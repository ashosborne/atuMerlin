import type { Db } from "../../db/pool.js";
import type { CustomerInput, CustomerListRow, CustomerRow } from "./customer.types.js";

export const LIST_PAGE_SIZE = 14; // CUS200 s01lod: 14 rows per load (SFLSIZ 15 / SFLPAG 7)

const ROW_COLUMNS = `cuid, custnm, cuphone, cuvat, cumail, culine1, culine2, culine3, cuzip, cucity, cucoun,
  culimcre, cucredit, culastord, cucrea, cumod, cumodid, cudel`;

export interface ListKey {
  /** CUSTNM part of the CUSTOME2 key (position-to prefix or saved name) */
  name: string;
  /** CUID part; 0 for a position-to */
  id: number;
}

/**
 * CUS200 / CUS250 data access over CUSTOME1 (by id) and CUSTOME2 (by name, id). Parameterised
 * SQL only (pack `forbidden`: no string-concat SQL in repositories).
 */
export interface CustomerRepository {
  /** CHAIN CUID CUSTOME1 */
  findById(cuid: number): Promise<CustomerRow | null>;
  /** SETLL (name : id) CUSTOME2 + READ up to `limit` rows (c01 s01lod). */
  listFrom(key: ListKey, limit: number): Promise<CustomerListRow[]>;
  /** SELECT COUNT(*) WHERE UPPER(custnm) = UPPER(:custnm) AND cuphone = :cuphone (c04). */
  countDuplicates(custnm: string, cuphone: string): Promise<number>;
  /** NEXT VALUE FOR CUSSEQ (c02). */
  nextId(): Promise<number>;
  /** WRITE FCUST (c02, c08 create stamping). */
  insert(cuid: number, input: CustomerInput, cumodid: string): Promise<CustomerRow>;
  /** UPDATE FCUST (c03, c08 update stamping). Returns null when the row does not exist. */
  update(cuid: number, input: CustomerInput): Promise<CustomerRow | null>;
}

export function createCustomerRepository(db: Db): CustomerRepository {
  return {
    async findById(cuid) {
      if (!Number.isInteger(cuid)) return null;
      const r = await db.query<CustomerRow>(`SELECT ${ROW_COLUMNS} FROM customer WHERE cuid = $1`, [cuid]);
      return r.rows[0] ?? null;
    },

    async listFrom(key, limit) {
      // Row-value compare on the CUSTOME2 key; COLLATE "C" gives byte order like the keyed LF
      // (EBCDIC vs ASCII ordering differs — see README, CONTRACT_RISK).
      const r = await db.query<CustomerListRow>(
        `SELECT cuid, custnm, culimcre, cuzip, cudel, cucity
           FROM customer
          WHERE (custnm COLLATE "C", cuid) >= ($1 COLLATE "C", $2)
          ORDER BY custnm COLLATE "C", cuid
          LIMIT $3`,
        [key.name, key.id, limit],
      );
      return r.rows;
    },

    async countDuplicates(custnm, cuphone) {
      const r = await db.query<{ dup: string }>(
        `SELECT COUNT(*)::text AS dup FROM customer WHERE UPPER(custnm) = UPPER($1) AND cuphone = $2`,
        [custnm, cuphone],
      );
      return Number(r.rows[0]?.dup ?? 0);
    },

    async nextId() {
      const r = await db.query<{ id: string }>(`SELECT nextval('cusseq')::text AS id`);
      return Number(r.rows[0]!.id);
    },

    async insert(cuid, input, cumodid) {
      // CUCREDIT 0, CULASTORD 0 and CUDEL blank come from the table defaults (RESET FCUST).
      const r = await db.query<CustomerRow>(
        `INSERT INTO customer
           (cuid, custnm, cuphone, cuvat, cumail, culine1, culine2, culine3, cuzip, cucity, cucoun, culimcre,
            cucrea, cumod, cumodid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_DATE, LOCALTIMESTAMP, $13)
         RETURNING ${ROW_COLUMNS}`,
        [
          cuid,
          input.custnm,
          input.cuphone,
          input.cuvat,
          input.cumail,
          input.culine1,
          input.culine2,
          input.culine3,
          input.cuzip,
          input.cucity,
          input.cucoun,
          input.culimcre,
          cumodid,
        ],
      );
      return r.rows[0]!;
    },

    async update(cuid, input) {
      // cus-interactive-c08 as-is: only CUMOD is stamped on update. CUMODID keeps the previous
      // modifier and CUCREA is preserved (needs-SME; do not "fix" here). CUDEL, CUCREDIT and
      // CULASTORD are not on FMT02 and stay untouched.
      const r = await db.query<CustomerRow>(
        `UPDATE customer
            SET custnm = $2, cuphone = $3, cuvat = $4, cumail = $5, culine1 = $6, culine2 = $7, culine3 = $8,
                cuzip = $9, cucity = $10, cucoun = $11, culimcre = $12,
                cumod = LOCALTIMESTAMP
          WHERE cuid = $1
          RETURNING ${ROW_COLUMNS}`,
        [
          cuid,
          input.custnm,
          input.cuphone,
          input.cuvat,
          input.cumail,
          input.culine1,
          input.culine2,
          input.culine3,
          input.cuzip,
          input.cucity,
          input.cucoun,
          input.culimcre,
        ],
      );
      return r.rows[0] ?? null;
    },
  };
}
