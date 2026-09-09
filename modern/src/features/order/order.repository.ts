import type pg from "pg";
import type { Db } from "../../db/pool.js";
import type { LineInput, LineRow, OrderListRow, OrderRow } from "./order.types.js";

export const LIST_PAGE_SIZE = 14; // ORD201 s01lod: 14 rows per fetch batch (ord-maintain-ord201-c01)

const ORDER_COLUMNS = "orid, oryear, orcuid, ordate, ordatdel, ordatclo";
const LINE_COLUMNS = "odorid, odyear, odline, odarid, odqty, odqtyliv, odprice, odtot, odtotvat";

type Queryable = Pick<pg.Pool, "query"> | pg.PoolClient;

/** A staged line with the figures ORD100 stores at confirm (ord-entry-ord100-c07). */
export interface ConfirmLine {
  odarid: string;
  odqty: number;
  odprice: number;
  odtot: number;
  odtotvat: number;
}

export interface ListCriteria {
  /** ORD200: one customer's orders; undefined = ORD201 all orders (with a CUSTOMER row). */
  cuid?: number | undefined;
  offset: number;
  limit: number;
}

/**
 * ORDER / DETORD data access over ORDER1 (by id), DETORD1 (by order, line) and the ORDERCUS view.
 * Parameterised SQL only (pack `forbidden`: no string-concat SQL in repositories). Every write
 * runs in a transaction that names the caller for the ORD700 SAMLOG entry.
 */
export interface OrderRepository {
  /** CHAIN ORID ORDER1 */
  findOrder(orid: number): Promise<OrderRow | null>;
  /** SETLL / READE ORID DETORD1 — every line in ODLINE order (one pass, no paging). */
  listLines(orid: number): Promise<LineRow[]>;
  /** CHAIN (ORID : ODLINE) DETORD1 */
  findLine(orid: number, odline: number): Promise<LineRow | null>;
  /** ORD200 / ORD201 cursor over ORDERCUS: ORDER BY ordate DESC, orid DESC (ORD201 tie-breaker). */
  list(criteria: ListCriteria): Promise<OrderListRow[]>;
  /** ORD200/ORD201 s01chk option 4: any DETORD line of the order with ODQTYLIV > 0 (live file read). */
  hasDeliveredLine(orid: number): Promise<boolean>;
  /** ORD100 F8: LASTORDNO + 1, WRITE FORDE, then WRITE FDETO per staged row renumbered 1..n. */
  confirm(orcuid: number, lines: ConfirmLine[], user: string): Promise<OrderRow>;
  /** ORD101 S02act: UPDATE FDETO with ODQTY, ODQTYLIV, ODPRICE, ODTOT, ODTOTVAT. */
  updateLine(orid: number, odline: number, input: LineInput & { odtot: number; odtotvat: number }, user: string): Promise<LineRow | null>;
  /** ORD101 option 4: DELETE (ORID : ODLINE) DETORD1. */
  deleteLine(orid: number, odline: number, user: string): Promise<boolean>;
  /** ORD200/ORD201 option 4: lines then header (ORD201 order), one transaction. */
  deleteOrder(orid: number, user: string): Promise<boolean>;
  /** Option 7: ORDATCLO = today; ORDATDEL = today only when never delivered. Lines untouched. */
  close(orid: number, user: string): Promise<OrderRow | null>;
  /** Option 8: ORDATDEL = today; every line still at ODQTYLIV = 0 gets ODQTYLIV = ODQTY. */
  deliver(orid: number, user: string): Promise<{ order: OrderRow; linesDelivered: number } | null>;
  /** ORD500 `chain orcuid custome1` for the HEADER2 address block; null on a miss (blank block). */
  documentCustomer(cuid: number): Promise<DocumentCustomerRow | null>;
}

export interface DocumentCustomerRow {
  custnm: string;
  culine1: string;
  culine2: string;
  culine3: string;
  cucoun: string;
  cuzip: string;
  cucity: string;
}

export function createOrderRepository(db: Db): OrderRepository {
  async function withTx<T>(user: string, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('atu.user', $1, true)", [user]);
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async function findOrderOn(q: Queryable, orid: number): Promise<OrderRow | null> {
    if (!Number.isInteger(orid)) return null;
    const r = await q.query<OrderRow>(`SELECT ${ORDER_COLUMNS} FROM orders WHERE orid = $1`, [orid]);
    return r.rows[0] ?? null;
  }

  return {
    findOrder: (orid) => findOrderOn(db, orid),

    async listLines(orid) {
      const r = await db.query<LineRow>(`SELECT ${LINE_COLUMNS} FROM detord WHERE odorid = $1 ORDER BY odline`, [orid]);
      return r.rows;
    },

    async findLine(orid, odline) {
      if (!Number.isInteger(orid) || !Number.isInteger(odline)) return null;
      const r = await db.query<LineRow>(`SELECT ${LINE_COLUMNS} FROM detord WHERE odorid = $1 AND odline = $2`, [orid, odline]);
      return r.rows[0] ?? null;
    },

    async list({ cuid, offset, limit }) {
      const r = await db.query<OrderListRow>(
        `SELECT orid, oryear, orcuid, custnm, ordate, ordatdel, ordatclo, totval
           FROM ordercus
          WHERE ($1::integer IS NULL OR orcuid = $1)
          ORDER BY ordate DESC, orid DESC
          LIMIT $2 OFFSET $3`,
        [cuid ?? null, limit, offset],
      );
      return r.rows;
    },

    async hasDeliveredLine(orid) {
      const r = await db.query("SELECT 1 FROM detord WHERE odorid = $1 AND odqtyliv > 0 LIMIT 1", [orid]);
      return (r.rowCount ?? 0) > 0;
    },

    confirm(orcuid, lines, user) {
      return withTx(user, async (c) => {
        // IN *LOCK ordno; ordno += 1; OUT ordno — a consumed number is not returned on failure either way.
        const seq = await c.query<{ id: string }>("SELECT nextval('lastordno')::text AS id");
        const orid = Number(seq.rows[0]!.id);
        // ORYEAR = *year, ORDATE = today, ORDATDEL = ORDATCLO = 0 (-> NULL). Header before lines (c07).
        const header = await c.query<OrderRow>(
          `INSERT INTO orders (orid, oryear, orcuid, ordate, ordatdel, ordatclo)
           VALUES ($1, EXTRACT(YEAR FROM CURRENT_DATE)::smallint, $2, CURRENT_DATE, NULL, NULL)
           RETURNING ${ORDER_COLUMNS}`,
          [orid, orcuid],
        );
        // ODYEAR stays 0 and ODQTYLIV 0 as staged (as-is, c07); ODLINE renumbered 1..n in staged order.
        let count = 0;
        for (const l of lines) {
          count += 1;
          await c.query(
            `INSERT INTO detord (odorid, odyear, odline, odarid, odqty, odqtyliv, odprice, odtot, odtotvat)
             VALUES ($1, 0, $2, $3, $4, 0, $5, $6, $7)`,
            [orid, count, l.odarid, l.odqty, l.odprice, l.odtot, l.odtotvat],
          );
        }
        return header.rows[0]!;
      });
    },

    updateLine(orid, odline, input, user) {
      return withTx(user, async (c) => {
        const r = await c.query<LineRow>(
          `UPDATE detord
              SET odqty = $3, odqtyliv = $4, odprice = $5, odtot = $6, odtotvat = $7
            WHERE odorid = $1 AND odline = $2
            RETURNING ${LINE_COLUMNS}`,
          [orid, odline, input.odqty, input.odqtyliv, input.odprice, input.odtot, input.odtotvat],
        );
        return r.rows[0] ?? null;
      });
    },

    deleteLine(orid, odline, user) {
      return withTx(user, async (c) => {
        const r = await c.query("DELETE FROM detord WHERE odorid = $1 AND odline = $2", [orid, odline]);
        return (r.rowCount ?? 0) > 0;
      });
    },

    deleteOrder(orid, user) {
      return withTx(user, async (c) => {
        // ORD201 order (lines first, then header) inside one transaction: neither the ORD200
        // orphan-lines residue nor the ORD201 header-without-lines residue can occur.
        await c.query("DELETE FROM detord WHERE odorid = $1", [orid]);
        const r = await c.query("DELETE FROM orders WHERE orid = $1", [orid]);
        return (r.rowCount ?? 0) > 0;
      });
    },

    close(orid, user) {
      return withTx(user, async (c) => {
        const r = await c.query<OrderRow>(
          `UPDATE orders
              SET ordatclo = CURRENT_DATE, ordatdel = COALESCE(ordatdel, CURRENT_DATE)
            WHERE orid = $1
            RETURNING ${ORDER_COLUMNS}`,
          [orid],
        );
        return r.rows[0] ?? null;
      });
    },

    deliver(orid, user) {
      return withTx(user, async (c) => {
        const h = await c.query<OrderRow>(
          `UPDATE orders SET ordatdel = CURRENT_DATE WHERE orid = $1 RETURNING ${ORDER_COLUMNS}`,
          [orid],
        );
        const order = h.rows[0];
        if (!order) return null;
        // Partially delivered lines (0 < ODQTYLIV) are skipped as-is; a zero-quantity line is
        // rewritten unchanged, which the trigger's WHEN clause ignores like TRGUPDCND(*CHANGE).
        const l = await c.query("UPDATE detord SET odqtyliv = odqty WHERE odorid = $1 AND odqtyliv = 0", [orid]);
        return { order, linesDelivered: l.rowCount ?? 0 };
      });
    },

    async documentCustomer(cuid) {
      const r = await db.query<DocumentCustomerRow>(
        "SELECT custnm, culine1, culine2, culine3, cucoun, cuzip, cucity FROM customer WHERE cuid = $1",
        [cuid],
      );
      return r.rows[0] ?? null;
    },
  };
}
