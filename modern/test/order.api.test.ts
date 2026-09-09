/**
 * ORD behaviours at the TypeScript HTTP boundary (WAIVED_PATHFINDER: no IBM i goldens, COMPARE at
 * the TS API only). Each block cites the Discovery card it exercises. These are provisional modern
 * tests, not characterization goldens. Pack atu-merlin-ts-ord-v1@1.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { createTestDb, insertCustomer, type TestDb } from "./helpers/db.js";

let t: TestDb;
let app: FastifyInstance;

beforeAll(async () => {
  t = await createTestDb();
  app = await buildApp({ db: t.db });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await t.close();
});
beforeEach(() => t.reset());

const today = () => new Date().toISOString().slice(0, 10);
const yyyymmdd = () => Number(today().replace(/-/g, ""));

async function confirm(body: unknown, user = "TESTER") {
  return app.inject({ method: "POST", url: "/api/orders", headers: { "x-user-id": user }, payload: body as object });
}

async function createOrder(orcuid: number, lines: Array<{ odarid: string; odqty?: number; odprice?: number; odline?: number }>) {
  const res = await confirm({ orcuid, lines: lines.map((l, i) => ({ odline: l.odline ?? i + 1, odqty: 1, ...l })) });
  expect(res.statusCode).toBe(201);
  return res.json();
}

async function arcusqty(arid: string): Promise<number> {
  const r = await t.db.query<{ arcusqty: number }>("SELECT arcusqty FROM article WHERE arid = $1", [arid]);
  return r.rows[0]!.arcusqty;
}

async function culastord(cuid: number): Promise<number> {
  const r = await t.db.query<{ culastord: number }>("SELECT culastord FROM customer WHERE cuid = $1", [cuid]);
  return r.rows[0]!.culastord;
}

async function setDates(orid: number, dates: { ordatdel?: string | null; ordatclo?: string | null }) {
  await t.db.query("UPDATE orders SET ordatdel = COALESCE($2, ordatdel), ordatclo = COALESCE($3, ordatclo) WHERE orid = $1", [
    orid,
    dates.ordatdel ?? null,
    dates.ordatclo ?? null,
  ]);
}

// ------------------------------------------------------------------------------- ORD100

describe("ord-entry-ord100-c03 — add line with article prompt and default pricing", () => {
  it("defaults quantity 1 and unit price GetArtRefSalPrice, VAT via CLCVat, description and rate shown", async () => {
    const res = await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "A00001", odline: 1 } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      odline: 1,
      odarid: "A00001",
      odqty: 1,
      odprice: 149.9,
      ardesc: "Anvil, cast iron, 25 kg",
      odtot: 149.9,
      vat: 29.98,
      odtotvat: 179.88,
      vatRate: 20,
    });
  });

  it("recomputes from the typed quantity and price (c04); %dech half-adjusts the VAT", async () => {
    // 3 x 6.40 = 19.20 at 5.5% -> 1.056 -> 1.06
    const res = await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "B00010", odqty: 3, odprice: 6.4 } });
    expect(res.json()).toMatchObject({ odtot: 19.2, vat: 1.06, odtotvat: 20.26, vatRate: 5.5 });
    // 1 x 1.15 must not be rejected by the two-decimals check
    const cents = await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "B00010", odqty: 1, odprice: 1.15 } });
    expect(cents.statusCode).toBe(200);
    expect(cents.json().odtot).toBe(1.15);
  });

  it("unknown VAT code -> rate 0 -> VAT 0 silently (planted defect kept)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "X9", odqty: 2 } });
    expect(res.json()).toMatchObject({ odtot: 20, vat: 0, odtotvat: 20, vatRate: 0 });
  });

  it("unknown article -> price 0, blank description, no error (c14: no ExistArt check)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "NOPE" } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ odarid: "NOPE", odqty: 1, odprice: 0, ardesc: "", odtot: 0, odtotvat: 0 });
  });

  it("qty x price beyond ODTOT 9P 2 -> 400 TOTAL_OVERFLOW (legacy: unmonitored size exception)", async () => {
    const res = await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "A00001", odqty: 99999, odprice: 99999.99 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors[0].code).toBe("TOTAL_OVERFLOW");
  });
});

describe("ord-entry-ord100-c07 — confirm writes ORDER header and DETORD lines", () => {
  it("allocates LASTORDNO + 1 (60720 first), stamps header, renumbers staged lines 1..n, ODYEAR 0, ODQTYLIV 0", async () => {
    const res = await confirm({
      orcuid: 1001,
      lines: [
        { odline: 2, odarid: "A00001", odqty: 2, odprice: 100 }, // first-pass cancel left a gap (c12)
        { odline: 5, odarid: "B00010", odqty: 10, odprice: 6.4 },
      ],
    });
    expect(res.statusCode).toBe(201);
    const o = res.json();
    expect(o).toMatchObject({ orid: 60720, oryear: new Date().getFullYear(), orcuid: 1001, ordate: today(), ordatdel: null, ordatclo: null, custnm: "Arcad Software" });
    expect(o.document).toBe("/api/orders/60720/document");
    expect(o.lines).toEqual([
      expect.objectContaining({ odorid: 60720, odyear: 0, odline: 1, odarid: "A00001", odqty: 2, odqtyliv: 0, odprice: 100, odtot: 200, odtotvat: 240 }),
      expect.objectContaining({ odorid: 60720, odyear: 0, odline: 2, odarid: "B00010", odqty: 10, odqtyliv: 0, odprice: 6.4, odtot: 64, odtotvat: 67.52 }),
    ]);
    expect(o.tot).toBe(264);
    expect(o.totvat).toBe(307.52);

    const second = await confirm({ orcuid: 1002, lines: [] });
    expect(second.json().orid).toBe(60721);
  });

  it("date lock: never-delivered / never-closed are NULL in Postgres, not 1940-01-01", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001" }]);
    const r = await t.db.query("SELECT ordatdel, ordatclo, ordate FROM orders WHERE orid = $1", [o.orid]);
    expect(r.rows[0]).toEqual({ ordatdel: null, ordatclo: null, ordate: today() });
  });

  it("a zero-line order can be confirmed (no line-count check)", async () => {
    const o = await createOrder(1003, []);
    expect(o.lines).toEqual([]);
    expect(o.tot).toBe(0);
  });

  it("c01 / c14: any non-zero customer id is accepted — missing or soft-deleted (CUDEL = 'X')", async () => {
    const missing = await createOrder(99999, [{ odarid: "A00001" }]);
    expect(missing.custnm).toBe("");
    const deleted = await createOrder(1005, [{ odarid: "A00001" }]);
    expect(deleted.custnm).toBe("Elektro Meyer");
  });

  it("customer 0 is SltCustomer cancelled: nothing to confirm -> 400", async () => {
    const res = await confirm({ orcuid: 0, lines: [] });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors[0]).toMatchObject({ field: "orcuid" });
  });

  it("stored totals are computed with the article VAT rule at confirm (silent zero kept)", async () => {
    const o = await createOrder(1001, [{ odarid: "X9", odqty: 3, odprice: 10 }]);
    expect(o.lines[0]).toMatchObject({ odtot: 30, odtotvat: 30 });
  });
});

describe("ord-entry-ord100-c13 — abandon before confirm writes nothing", () => {
  it("quoting lines touches neither ORDER, DETORD nor LASTORDNO", async () => {
    await app.inject({ method: "POST", url: "/api/orders/lines/quote", payload: { odarid: "A00001" } });
    const orders = await t.db.query("SELECT COUNT(*)::int AS n FROM orders");
    expect(orders.rows[0].n).toBe(0);
    const first = await createOrder(1001, []);
    expect(first.orid).toBe(60720);
  });
});

// ------------------------------------------------------------------------------- ORD700 / ORD701

describe("ord-trigger-ord700-c07 — ORD701 stamps CULASTORD on ORDER insert", () => {
  it("assigns the inserted order date (yyyymmdd at the CUS boundary); unknown customer -> 0 rows, silent", async () => {
    expect(await culastord(1002)).toBe(0);
    await createOrder(1002, []);
    expect(await culastord(1002)).toBe(yyyymmdd());
    const res = await createOrder(99999, []);
    expect(res.orid).toBe(60721);
  });
});

describe("ord-trigger-ord700-c02 / c05 — insert adds the FULL ordered quantity; unknown article no-op", () => {
  it("ARCUSQTY += ODQTY per confirmed line; blank / unknown article ids are skipped silently", async () => {
    await createOrder(1001, [
      { odarid: "A00001", odqty: 5 },
      { odarid: "A00001", odqty: 2 },
      { odarid: "NOPE", odqty: 9 },
      { odarid: "", odqty: 9 },
    ]);
    expect(await arcusqty("A00001")).toBe(7);
  });
});

// ------------------------------------------------------------------------------- ORD101

describe("ord-entry-ord101-c03 — edit line quantities and price", () => {
  it("writes ODQTY, ODQTYLIV, ODPRICE and recomputes ODTOT / ODTOTVAT; ORD700 applies the outstanding delta", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 5, odprice: 100 }]);
    expect(await arcusqty("A00001")).toBe(5);
    const res = await app.inject({ method: "PUT", url: `/api/orders/${o.orid}/lines/1`, payload: { odqty: 8, odqtyliv: 2, odprice: 90 } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ odline: 1, odqty: 8, odqtyliv: 2, odprice: 90, odtot: 720, odtotvat: 864, ardesc: "Anvil, cast iron, 25 kg" });
    // (8 - 5) - (2 - 0) = +1
    expect(await arcusqty("A00001")).toBe(6);
  });

  it("a save with nothing changed still rewrites ODTOTVAT at today's VAT rate (silent re-rate, as-is)", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 100 }]);
    expect(o.lines[0].odtotvat).toBe(120);
    await t.db.query("UPDATE vatdef SET vatrate = 21 WHERE vatcode = '2'");
    const res = await app.inject({ method: "PUT", url: `/api/orders/${o.orid}/lines/1`, payload: { odqty: 1, odqtyliv: 0, odprice: 100 } });
    expect(res.json().odtotvat).toBe(121);
    // price-only change: the row changed, the trigger fires, the delta is 0
    expect(await arcusqty("A00001")).toBe(1);
  });

  it("no closed-order test inside the line surface (c12 as-is): lines of a closed order can be edited", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 10 }]);
    await setDates(o.orid, { ordatclo: today() });
    const res = await app.inject({ method: "PUT", url: `/api/orders/${o.orid}/lines/1`, payload: { odqty: 2, odqtyliv: 0, odprice: 10 } });
    expect(res.statusCode).toBe(200);
  });

  it("unknown order / line -> 404 ORDER_NOT_FOUND (legacy: chain miss then update exception)", async () => {
    const res = await app.inject({ method: "PUT", url: "/api/orders/1/lines/1", payload: { odqty: 1, odqtyliv: 0, odprice: 1 } });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ code: "ORDER_NOT_FOUND", orid: 1, odline: 1 });
  });
});

describe("ord-entry-ord101-c04 — quantity validation compares typed values with the STORED row", () => {
  async function stored10_5() {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 10, odprice: 1 }]);
    await t.db.query("UPDATE detord SET odqtyliv = 5 WHERE odorid = $1 AND odline = 1", [o.orid]);
    return o.orid as number;
  }

  it("ERR1001 when typed delivered > stored ordered — even when consistent with the typed ordered (20/15)", async () => {
    const orid = await stored10_5();
    const res = await app.inject({ method: "PUT", url: `/api/orders/${orid}/lines/1`, payload: { odqty: 20, odqtyliv: 15, odprice: 1 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors).toEqual([
      { code: "ERR1001", field: "odqtyliv", message: "Delivered quantity must be lower or equal to ordered quantity." },
    ]);
  });

  it("ERR1002 when typed ordered < stored delivered; both rules can be on together", async () => {
    const orid = await stored10_5();
    const res = await app.inject({ method: "PUT", url: `/api/orders/${orid}/lines/1`, payload: { odqty: 3, odqtyliv: 11, odprice: 1 } });
    expect(res.json().errors.map((e: { code: string }) => e.code)).toEqual(["ERR1001", "ERR1002"]);
  });

  it("both lowered, inconsistent (6/8) is ACCEPTED and stored with delivered > ordered (as-is, needs-SME)", async () => {
    const orid = await stored10_5();
    const res = await app.inject({ method: "PUT", url: `/api/orders/${orid}/lines/1`, payload: { odqty: 6, odqtyliv: 8, odprice: 1 } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ odqty: 6, odqtyliv: 8 });
  });

  it("negative delivered quantity is not blocked; negative ordered is blocked only through rule 2", async () => {
    const orid = await stored10_5();
    const negOrd = await app.inject({ method: "PUT", url: `/api/orders/${orid}/lines/1`, payload: { odqty: -1, odqtyliv: 0, odprice: 1 } });
    expect(negOrd.statusCode).toBe(400);
    expect(negOrd.json().errors[0].code).toBe("ERR1002"); // -1 < stored delivered 5
    const neg = await app.inject({ method: "PUT", url: `/api/orders/${orid}/lines/1`, payload: { odqty: 10, odqtyliv: -3, odprice: 1 } });
    expect(neg.statusCode).toBe(200);
    expect(neg.json().odqtyliv).toBe(-3);
  });
});

describe("ord-entry-ord101-c05 / c06 — delete line", () => {
  it("refused when ODQTYLIV > 0 with 'Line with delivery can not be deleted.'", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 4, odprice: 1 }]);
    await t.db.query("UPDATE detord SET odqtyliv = 1 WHERE odorid = $1", [o.orid]);
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}/lines/1` });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ code: "LINE_HAS_DELIVERY", message: "Line with delivery can not be deleted." });
  });

  it("deletes the row, subtracts the outstanding quantity (ORD700 c03) and logs to SAMLOG with the caller", async () => {
    const o = await createOrder(1001, [
      { odarid: "A00001", odqty: 4, odprice: 1 },
      { odarid: "A00002", odqty: 6, odprice: 1 },
    ]);
    expect(await arcusqty("A00001")).toBe(4);
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}/lines/1`, headers: { "x-user-id": "ASH" } });
    expect(res.statusCode).toBe(204);
    expect(await arcusqty("A00001")).toBe(0);
    const log = await t.db.query<{ user_id: string; msg: string }>("SELECT user_id, msg FROM samlog ORDER BY id");
    expect(log.rows).toEqual([{ user_id: "ASH", msg: `ORD700:Order Line deleted ${o.orid} 1 article : A00001 quantity : 4` }]);
    // ODLINE gaps are permanent; the other line keeps its number and the order its header
    const after = await app.inject({ method: "GET", url: `/api/orders/${o.orid}` });
    expect(after.json().lines.map((l: { odline: number }) => l.odline)).toEqual([2]);
  });

  it("deleting the last line leaves an order header with zero lines (no confirmation)", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 1 }]);
    await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}/lines/1` });
    const after = await app.inject({ method: "GET", url: `/api/orders/${o.orid}` });
    expect(after.statusCode).toBe(200);
    expect(after.json().lines).toEqual([]);
  });

  it("unknown line -> 404 (legacy delete by key was silent)", async () => {
    const o = await createOrder(1001, []);
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}/lines/7` });
    expect(res.statusCode).toBe(404);
  });
});

describe("ord-entry-ord101-c10 — no add-line path for existing orders", () => {
  it("there is no route that adds a line to an existing order", async () => {
    const o = await createOrder(1001, []);
    const res = await app.inject({ method: "POST", url: `/api/orders/${o.orid}/lines`, payload: { odarid: "A00001" } });
    expect(res.statusCode).toBe(404);
  });
});

// ------------------------------------------------------------------------------- ORD200 / ORD201

describe("ord-maintain-ord201-c01 / ord-maintain-ord200-c01 — list from ORDERCUS", () => {
  it("orders by date desc, id desc; TOTVAL is the VAT-inclusive sum; 14 per batch with More/Bottom", async () => {
    for (let i = 0; i < 16; i++) await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 10 }]);
    await t.db.query("UPDATE orders SET ordate = '2020-05-05' WHERE orid = 60720");
    const first = await app.inject({ method: "GET", url: "/api/orders" });
    expect(first.statusCode).toBe(200);
    const p1 = first.json();
    expect(p1.rows).toHaveLength(14);
    expect(p1.rows[0]).toEqual({ orid: 60735, oryear: new Date().getFullYear(), orcuid: 1001, custnm: "Arcad Software", ordate: today(), ordatdel: null, ordatclo: null, totval: 12 });
    expect(p1.rows[13].orid).toBe(60722);
    expect(p1.more).toBe(true);
    const p2 = (await app.inject({ method: "GET", url: `/api/orders?offset=${p1.nextOffset}` })).json();
    expect(p2.rows.map((r: { orid: number }) => r.orid)).toEqual([60721, 60720]); // the back-dated order sorts last
    expect(p2.more).toBe(false);
    expect(p2.nextOffset).toBeNull();
  });

  it("cuid filters to one customer (ORD200); a customer with no orders yields an empty list, no message", async () => {
    await createOrder(1001, []);
    await createOrder(1002, []);
    const one = (await app.inject({ method: "GET", url: "/api/orders?cuid=1002" })).json();
    expect(one.rows.map((r: { orid: number }) => r.orid)).toEqual([60721]);
    const none = (await app.inject({ method: "GET", url: "/api/orders?cuid=1004" })).json();
    expect(none).toEqual({ rows: [], more: false, nextOffset: null });
  });

  it("ORDERCUS inner join hides an order whose customer row is missing (planted defect kept)", async () => {
    await createOrder(77777, [{ odarid: "A00001" }]);
    await createOrder(1001, []);
    const all = (await app.inject({ method: "GET", url: "/api/orders" })).json();
    expect(all.rows.map((r: { orid: number }) => r.orid)).toEqual([60721]);
    const direct = await app.inject({ method: "GET", url: "/api/orders/60720" });
    expect(direct.statusCode).toBe(200); // ORD202 by id still shows it, with a blank customer (c01)
    expect(direct.json().custnm).toBe("");
  });

  it("zero-line orders list with TOTVAL 0; bad query values -> 400", async () => {
    await createOrder(1001, []);
    const list = (await app.inject({ method: "GET", url: "/api/orders" })).json();
    expect(list.rows[0].totval).toBe(0);
    expect((await app.inject({ method: "GET", url: "/api/orders?cuid=abc" })).statusCode).toBe(400);
    expect((await app.inject({ method: "GET", url: "/api/orders?offset=-1" })).statusCode).toBe(400);
  });
});

describe("ord-maintain-ord200-c04 / c08 / c13 — option 4 delete order", () => {
  it("refused on a closed order with 'Closed order can not be edited or deleted'", async () => {
    const o = await createOrder(1001, []);
    await setDates(o.orid, { ordatclo: today() });
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}` });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ code: "CLOSED_ORDER", message: "Closed order can not be edited or deleted" });
  });

  it("refused when any line has ODQTYLIV > 0 — DDS text kept with its typo", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 2, odprice: 1 }]);
    await t.db.query("UPDATE detord SET odqtyliv = 1 WHERE odorid = $1", [o.orid]);
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}` });
    expect(res.json()).toEqual({ code: "ORDER_HAS_DELIVERIES", message: "Order whith deliveries can not be deleted" });
  });

  it("deletes lines and header in one transaction; ORD700 subtracts and logs per line; CULASTORD is NOT maintained (c12)", async () => {
    const o = await createOrder(1001, [
      { odarid: "A00001", odqty: 3, odprice: 1 },
      { odarid: "A00002", odqty: 4, odprice: 1 },
    ]);
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}` });
    expect(res.statusCode).toBe(204);
    expect((await t.db.query("SELECT COUNT(*)::int AS n FROM orders")).rows[0].n).toBe(0);
    expect((await t.db.query("SELECT COUNT(*)::int AS n FROM detord")).rows[0].n).toBe(0);
    expect(await arcusqty("A00001")).toBe(0);
    expect(await arcusqty("A00002")).toBe(0);
    expect((await t.db.query("SELECT COUNT(*)::int AS n FROM samlog")).rows[0].n).toBe(2);
    expect(await culastord(1001)).toBe(yyyymmdd());
    expect((await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}` })).statusCode).toBe(404);
  });
});

describe("ord-maintain-ord200-c06 — option 7 close", () => {
  it("stamps ORDATCLO and ORDATDEL-when-blank; lines untouched (ODQTYLIV stays 0, ARCUSQTY not reduced)", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 3, odprice: 1 }]);
    const res = await app.inject({ method: "POST", url: `/api/orders/${o.orid}/close` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ orid: o.orid, ordatclo: today(), ordatdel: today() });
    const lines = (await app.inject({ method: "GET", url: `/api/orders/${o.orid}` })).json().lines;
    expect(lines[0].odqtyliv).toBe(0);
    expect(await arcusqty("A00001")).toBe(3);
  });

  it("keeps an existing delivery date; already closed -> 'Invalid Option' (generic text as-is)", async () => {
    const o = await createOrder(1001, []);
    await setDates(o.orid, { ordatdel: "2024-01-15" });
    const first = await app.inject({ method: "POST", url: `/api/orders/${o.orid}/close` });
    expect(first.json()).toMatchObject({ ordatdel: "2024-01-15", ordatclo: today() });
    const again = await app.inject({ method: "POST", url: `/api/orders/${o.orid}/close` });
    expect(again.statusCode).toBe(400);
    expect(again.json()).toEqual({ code: "INVALID_OPTION", message: "Invalid Option" });
  });
});

describe("ord-maintain-ord200-c07 — option 8 deliver", () => {
  it("stamps ORDATDEL, sets ODQTYLIV = ODQTY on undelivered lines, skips partial lines, does not close", async () => {
    const o = await createOrder(1001, [
      { odarid: "A00001", odqty: 5, odprice: 1 },
      { odarid: "A00002", odqty: 6, odprice: 1 },
      { odarid: "B00010", odqty: 0, odprice: 1 },
    ]);
    expect(await arcusqty("A00002")).toBe(6); // insert path added the full ODQTY (c02 as-is)
    // A partial delivery written by SQL fires the update trigger like any other writer: delta -2.
    await t.db.query("UPDATE detord SET odqtyliv = 2 WHERE odorid = $1 AND odline = 2", [o.orid]);
    expect(await arcusqty("A00002")).toBe(4);
    const res = await app.inject({ method: "POST", url: `/api/orders/${o.orid}/deliver` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ order: { ordatdel: today(), ordatclo: null }, linesDelivered: 2 });
    const lines = (await app.inject({ method: "GET", url: `/api/orders/${o.orid}` })).json().lines;
    expect(lines.map((l: { odqtyliv: number }) => l.odqtyliv)).toEqual([5, 2, 0]);
    expect(await arcusqty("A00001")).toBe(0);
    expect(await arcusqty("A00002")).toBe(4); // partial line frozen: option 8 skips it
  });

  it("already delivered -> 'Invalid Option'; deliver after close is impossible because close stamps ORDATDEL", async () => {
    const o = await createOrder(1001, []);
    await app.inject({ method: "POST", url: `/api/orders/${o.orid}/close` });
    const res = await app.inject({ method: "POST", url: `/api/orders/${o.orid}/deliver` });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ code: "INVALID_OPTION", message: "Invalid Option" });
  });

  it("delete is refused once any line has been delivered", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 1 }]);
    await app.inject({ method: "POST", url: `/api/orders/${o.orid}/deliver` });
    const res = await app.inject({ method: "DELETE", url: `/api/orders/${o.orid}` });
    expect(res.json().code).toBe("ORDER_HAS_DELIVERIES");
  });
});

// ------------------------------------------------------------------------------- ORD202

describe("ord-maintain-ord202-c01 / c02 — order display", () => {
  it("header with customer name and null dates, every line with description, footer = stored sums", async () => {
    const o = await createOrder(1003, [
      { odarid: "A00001", odqty: 2, odprice: 100 },
      { odarid: "C00100", odqty: 1, odprice: 24 },
    ]);
    await t.db.query("UPDATE detord SET odtot = 999, odtotvat = 1000 WHERE odorid = $1 AND odline = 2", [o.orid]);
    const res = await app.inject({ method: "GET", url: `/api/orders/${o.orid}` });
    expect(res.statusCode).toBe(200);
    const d = res.json();
    expect(d).toMatchObject({ orid: o.orid, orcuid: 1003, custnm: "Casa Rossi", ordate: today(), ordatdel: null, ordatclo: null });
    expect(d.lines[1].ardesc).toBe("Technical manual, hydraulics (fifty char descrip)");
    // stored, not recomputed: 200 + 999 / 240 + 1000
    expect(d.tot).toBe(1199);
    expect(d.totvat).toBe(1240);
  });

  it("missing article -> blank description (one FARTICLE rule; legacy ORD202 repeated the previous line — CR)", async () => {
    const o = await createOrder(1001, [
      { odarid: "A00001", odqty: 1, odprice: 1 },
      { odarid: "GONE", odqty: 1, odprice: 1 },
    ]);
    const d = (await app.inject({ method: "GET", url: `/api/orders/${o.orid}` })).json();
    expect(d.lines.map((l: { ardesc: string }) => l.ardesc)).toEqual(["Anvil, cast iron, 25 kg", ""]);
  });

  it("unknown order id -> 404 (legacy: unmonitored %date(0) exception; needs-SME)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/orders/424242" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ code: "ORDER_NOT_FOUND", message: "Order 424242 not found", orid: 424242 });
    expect((await app.inject({ method: "GET", url: "/api/orders/1234567" })).statusCode).toBe(404); // > 6P 0
    expect((await app.inject({ method: "GET", url: "/api/orders/abc" })).statusCode).toBe(404);
  });
});

// ------------------------------------------------------------------------------- ORD500

describe("ord-print-ord500-c01 — print order document", () => {
  it("renders company block, customer block, order line, two-line details and Net / VAT / Total", async () => {
    await insertCustomer(t.db, { cuid: 1500, custnm: "Printed Customer", cucity: "Lyon", cucoun: "FR" });
    await t.db.query("UPDATE customer SET culine1 = '1 rue A', cuzip = '69001' WHERE cuid = 1500");
    const o = await createOrder(1500, [
      { odarid: "A00001", odqty: 2, odprice: 100 },
      { odarid: "X9", odqty: 1, odprice: 10 },
    ]);
    const res = await app.inject({ method: "GET", url: `/api/orders/${o.orid}/document` });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    const text = res.body;
    expect(text).toContain("Company Sample");
    expect(text).toContain("Customer Order");
    expect(text).toContain("F-74650 Chavanod");
    expect(text).toContain("Printed Customer");
    expect(text).toMatch(/FR 69001 {6}Lyon/); // country as the 2-char code, no COUNTRY lookup
    expect(text).toContain(`Order Number  ${new Date().getFullYear()}/ ${o.orid}`);
    expect(text).toContain(`Order Date   ${today()}`);
    expect(text).toContain("Anvil, cast iron, 25 kg");
    expect(text).toContain("This is the footer");
    // Net 210.00, VAT = TOTTOT - TOTNET = 40.00 (the X9 line contributes no VAT), Total 250.00
    expect(text).toMatch(/Net\s+210\.00/);
    expect(text).toMatch(/VAT\s+40\.00/);
    expect(text).toMatch(/Total\s+250\.00/);
    expect(text.split("\n").every((l) => l.length <= 90)).toBe(true);
  });

  it("silent-zero order prints a blank VAT line (EDTCDE(2) zero -> blank)", async () => {
    const o = await createOrder(1001, [{ odarid: "X9", odqty: 1, odprice: 10 }]);
    const text = (await app.inject({ method: "GET", url: `/api/orders/${o.orid}/document` })).body;
    expect(text).toMatch(/Net\s+10\.00/);
    expect(text).toMatch(/\nVAT\s*\n|VAT\s*$/m);
    expect(text).toMatch(/Total\s+10\.00/);
  });

  it("15 details per page; continuation pages repeat the company block and order line but not the customer block", async () => {
    const lines = Array.from({ length: 16 }, () => ({ odarid: "B00010", odqty: 1, odprice: 1 }));
    const o = await createOrder(1001, lines);
    const text = (await app.inject({ method: "GET", url: `/api/orders/${o.orid}/document` })).body;
    const pages = text.split("\f");
    expect(pages).toHaveLength(2);
    expect(pages[0]!.match(/Safety gloves, pair/g)).toHaveLength(15);
    expect(pages[1]!.match(/Safety gloves, pair/g)).toHaveLength(1);
    expect(pages[1]).toContain("Company Sample");
    expect(pages[1]).toContain("Order Number");
    expect(pages[1]).not.toContain("Arcad Software");
    expect(pages[0]).toContain("Arcad Software");
    expect(pages[1]).toMatch(/Net\s+16\.00/); // 16 x 1.00 at 5.5% -> Total 16.96 on the last page only
    expect(pages[0]).not.toMatch(/Net\s/);
  });

  it("empty order prints headers and blank totals; unknown id -> 404 (legacy: exception before the first write, c08)", async () => {
    const o = await createOrder(1001, []);
    const text = (await app.inject({ method: "GET", url: `/api/orders/${o.orid}/document` })).body;
    expect(text).toContain("Order Number");
    expect(text).not.toMatch(/\d\.\d\d/);
    expect((await app.inject({ method: "GET", url: "/api/orders/424242/document" })).statusCode).toBe(404);
  });
});

// ------------------------------------------------------------------------------- dependency surface

describe("FARTICLE dependency surface", () => {
  it("GET /api/articles lists the reference rows, soft-deleted included (c14: no IsArtDeleted guard)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/articles" });
    expect(res.statusCode).toBe(200);
    const ids = res.json().rows.map((a: { arid: string }) => a.arid);
    expect(ids).toEqual(["A00001", "A00002", "B00010", "C00100", "X9", "Z00001"]);
  });
});
