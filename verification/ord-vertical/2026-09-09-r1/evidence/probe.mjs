#!/usr/bin/env node
// Live COMPARE probe at the TypeScript HTTP boundary — pack atu-merlin-ts-ord-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/ord-*/features) + modern/openapi/order.yaml + modern/README.md
// (ORD section). NOT IBM i goldens: nothing here is a claim of parity against the box.
//
//   cd modern && ./scripts/local-pg.sh start
//   createdb -h 127.0.0.1 -p 54329 atu_merlin_verify_ord
//   DATABASE_URL=postgres://.../atu_merlin_verify_ord npm run db:seed && npm run db:seed:order
//   DATABASE_URL=... PORT=3100 npx tsx src/server.ts &
//   BASE_URL=http://127.0.0.1:3100 DATABASE_URL=... node ../verification/ord-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Expects a freshly seeded database with NO orders
// (src/db/seed.ts customer fixtures + order.seed.ts article / vatdef fixtures): the first order
// confirmed must draw 60720 from lastordno.

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../../../modern/package.json"));
const { Pool } = require("pg");

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ORDER_KEYS = ["orid", "oryear", "orcuid", "ordate", "ordatdel", "ordatclo"].sort();
const LINE_KEYS = ["odorid", "odyear", "odline", "odarid", "odqty", "odqtyliv", "odprice", "odtot", "odtotvat", "ardesc"].sort();
const DETAIL_KEYS = [...ORDER_KEYS, "custnm", "lines", "tot", "totvat"].sort();
const CONFIRM_KEYS = [...DETAIL_KEYS, "document"].sort();
const LIST_ROW_KEYS = [...ORDER_KEYS, "custnm", "totval"].sort();
const PAGE_KEYS = ["rows", "more", "nextOffset"].sort();
const QUOTE_KEYS = ["odline", "odarid", "odqty", "odprice", "ardesc", "odtot", "vat", "odtotvat", "vatRate"].sort();
const ARTICLE_KEYS = ["arid", "ardesc", "arsalepr", "arvatcd", "ardel"].sort();
const NOT_FOUND_KEYS = ["code", "message", "orid"].sort();
const NOT_FOUND_LINE_KEYS = ["code", "message", "orid", "odline"].sort();

const results = [];

async function http(method, path, { body, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(headers ?? {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html, text/plain or empty */ }
  return { status: res.status, type: res.headers.get("content-type") ?? "", json, text };
}

function keysOf(o) { return Object.keys(o).sort(); }
function sameKeys(o, keys) { return JSON.stringify(keysOf(o)) === JSON.stringify(keys); }
function todayIso() { return new Date().toISOString().slice(0, 10); }
function todayYmd() { return Number(todayIso().replace(/-/g, "")); }
async function one(sql, params = []) { return (await pool.query(sql, params)).rows[0]; }
async function count(sql, params = []) { return Number((await one(sql, params)).n); }
async function arcusqty(arid) { return Number((await one("SELECT arcusqty FROM article WHERE arid = $1", [arid])).arcusqty); }

async function check(id, card, description, fn) {
  const r = { id, card, description, verdict: "PASS", observed: undefined, note: undefined };
  try {
    const out = await fn();
    if (out && typeof out === "object") {
      if (out.observed !== undefined) r.observed = out.observed;
      if (out.note !== undefined) r.note = out.note;
      if (out.fail) r.verdict = "FAIL";
      if (out.observe_only) r.verdict = "OBSERVED";
    }
  } catch (e) {
    r.verdict = "FAIL";
    r.observed = String(e && e.message ? e.message : e);
  }
  results.push(r);
  console.log(`${r.verdict.padEnd(8)} ${id.padEnd(8)} ${card.padEnd(30)} ${description}${r.note ? `  — ${r.note}` : ""}`);
}

function expect(cond, msg) { if (!cond) throw new Error(msg); }

// Order ids drawn during the run (the sequence is consumed in call order).
const ids = {};

// ---------------------------------------------------------------------------------------------
await check("P00", "boot", "GET /health -> 200 {status: ok}; database has no orders and lastordno is unconsumed", async () => {
  const r = await http("GET", "/health");
  expect(r.status === 200 && r.json?.status === "ok", `status ${r.status} ${r.text}`);
  const orders = await count("SELECT COUNT(*)::int AS n FROM orders");
  const seq = await one("SELECT last_value::int AS last_value, is_called FROM lastordno");
  expect(orders === 0, `${orders} orders already present — probe needs a fresh seed`);
  expect(seq.last_value === 60720 && seq.is_called === false, `lastordno ${JSON.stringify(seq)}`);
  return { observed: { health: r.json, orders, lastordno: seq } };
});

// ---------------------------------------------------------------- ORD100 FMT02 pricing (quote)
await check("P01", "ord-entry-ord100-c03", "POST /api/orders/lines/quote {odarid} -> qty 1, price GetArtRefSalPrice, VAT CLCVat, description, rate; QuotedLine shape", async () => {
  const r = await http("POST", "/api/orders/lines/quote", { body: { odarid: "A00001", odline: 1 } });
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, QUOTE_KEYS), `keys ${keysOf(r.json)}`);
  const q = r.json;
  expect(q.odqty === 1 && q.odprice === 149.9, `qty ${q.odqty} price ${q.odprice}`);
  expect(q.odtot === 149.9 && q.vat === 29.98 && q.odtotvat === 179.88 && q.vatRate === 20, `figures ${JSON.stringify(q)}`);
  expect(q.ardesc === "Anvil, cast iron, 25 kg", `ardesc ${q.ardesc}`);
  return { observed: q };
});

await check("P02", "ord-entry-ord100-c04", "quote with typed qty/price recomputes; %dech half-adjust on the VAT (3 x 6.40 @ 5.5% -> 1.06)", async () => {
  const r = await http("POST", "/api/orders/lines/quote", { body: { odarid: "B00010", odqty: 3, odprice: 6.4 } });
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(r.json.odtot === 19.2 && r.json.vat === 1.06 && r.json.odtotvat === 20.26 && r.json.vatRate === 5.5, `figures ${JSON.stringify(r.json)}`);
  return { observed: r.json };
});

await check("P03", "ord-entry-ord100-c03 (planted defect)", "unknown VAT code (article X9, code 9) -> vatRate 0, VAT 0, no error — VAT silent zero preserved", async () => {
  const r = await http("POST", "/api/orders/lines/quote", { body: { odarid: "X9", odqty: 2 } });
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(r.json.vatRate === 0 && r.json.vat === 0 && r.json.odtot === 20 && r.json.odtotvat === 20, `figures ${JSON.stringify(r.json)}`);
  return { observed: r.json, note: "planted defect asserted, not fixed" };
});

await check("P04", "ord-entry-ord100-c14", "unknown article -> price 0, blank description, 200 (no ExistArt check)", async () => {
  const r = await http("POST", "/api/orders/lines/quote", { body: { odarid: "NOPE99" } });
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(r.json.odprice === 0 && r.json.ardesc === "" && r.json.odtot === 0, `figures ${JSON.stringify(r.json)}`);
  return { observed: r.json };
});

await check("P05", "CR-O10", "qty x price beyond ODTOT 9P 2 -> 400 VALIDATION TOTAL_OVERFLOW (legacy: unmonitored size exception)", async () => {
  const r = await http("POST", "/api/orders/lines/quote", { body: { odarid: "A00001", odqty: 99999, odprice: 99999.99 } });
  expect(r.status === 400 && r.json?.code === "VALIDATION", `status ${r.status} ${r.text}`);
  expect(r.json.errors.length === 1 && r.json.errors[0].code === "TOTAL_OVERFLOW", `errors ${JSON.stringify(r.json.errors)}`);
  return { observed: r.json };
});

await check("P06", "ord-entry-ord100-c13", "quoting wrote nothing: orders 0, detord 0, lastordno still unconsumed", async () => {
  const orders = await count("SELECT COUNT(*)::int AS n FROM orders");
  const lines = await count("SELECT COUNT(*)::int AS n FROM detord");
  const seq = await one("SELECT last_value::int AS last_value, is_called FROM lastordno");
  expect(orders === 0 && lines === 0 && seq.is_called === false, `orders ${orders} lines ${lines} seq ${JSON.stringify(seq)}`);
  return { observed: { orders, lines, lastordno: seq } };
});

// ---------------------------------------------------------------- ORD100 F8 confirm
await check("P07", "ord-entry-ord100-c07 / c12", "POST /api/orders (3 staged lines with gaps 1,3,7) -> 201, orid 60720, lines renumbered 1..3, ODYEAR 0, ODQTYLIV 0, dates null, document link", async () => {
  const body = {
    orcuid: 1002,
    lines: [
      { odline: 7, odarid: "B00010", odqty: 3, odprice: 6.4 },
      { odline: 1, odarid: "A00001", odqty: 2, odprice: 149.9 },
      { odline: 3, odarid: "A00002", odqty: 1, odprice: 89.5 },
    ],
  };
  const r = await http("POST", "/api/orders", { body, headers: { "X-User-Id": "VERIFY" } });
  expect(r.status === 201, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, CONFIRM_KEYS), `keys ${keysOf(r.json)}`);
  const d = r.json;
  ids.main = d.orid;
  expect(d.orid === 60720, `first order id ${d.orid} (LASTORDNO 60719 + 1 expected)`);
  expect(d.oryear === Number(todayIso().slice(0, 4)) && d.ordate === todayIso(), `header ${JSON.stringify(d)}`);
  expect(d.ordatdel === null && d.ordatclo === null, "delivery / close should be null");
  expect(d.orcuid === 1002 && d.custnm === "Baker Street Books", `customer ${d.orcuid} ${d.custnm}`);
  expect(d.lines.length === 3 && d.lines.map((l) => l.odline).join() === "1,2,3", `lines ${JSON.stringify(d.lines.map((l) => l.odline))}`);
  expect(d.lines.map((l) => l.odarid).join() === "A00001,A00002,B00010", "staged-line order (by staged odline) not kept");
  expect(d.lines.every((l) => l.odyear === 0 && l.odqtyliv === 0 && sameKeys(l, LINE_KEYS)), "odyear / odqtyliv / LineDetail keys");
  // stored figures: 2 x 149.90 = 299.80 (+20% = 359.76); 89.50 (+20% = 107.40); 19.20 (+5.5% = 20.26)
  expect(d.tot === 408.5 && d.totvat === 487.42, `totals ${d.tot} ${d.totvat}`);
  expect(d.document === `/api/orders/${d.orid}/document`, `document ${d.document}`);
  return { observed: { orid: d.orid, lines: d.lines.map((l) => [l.odline, l.odarid, l.odqty, l.odtot, l.odtotvat]), tot: d.tot, totvat: d.totvat, document: d.document } };
});

await check("P08", "ord-trigger-ord700-c07 / c02", "DB after confirm: ORD701 stamped customer.culastord = today yyyymmdd; ORD700 insert added the FULL odqty to article.arcusqty", async () => {
  const cus = await one("SELECT culastord, cumodid FROM customer WHERE cuid = 1002");
  expect(Number(cus.culastord) === todayYmd(), `culastord ${cus.culastord}`);
  expect(cus.cumodid === "SEED", `cumodid touched: ${cus.cumodid}`);
  const a1 = await arcusqty("A00001"), a2 = await arcusqty("A00002"), b = await arcusqty("B00010");
  expect(a1 === 2 && a2 === 1 && b === 3, `arcusqty A00001=${a1} A00002=${a2} B00010=${b}`);
  const armod = await one("SELECT armod IS NULL AS untouched FROM article WHERE arid = 'A00001'");
  return { observed: { culastord: Number(cus.culastord), cumodid: cus.cumodid, arcusqty: { A00001: a1, A00002: a2, B00010: b }, armodNull: armod.untouched }, note: armod.untouched ? "armod not stamped (c05 as-is)" : "armod stamped by fixture seed" };
});

await check("P09", "ord-entry-ord100-c07 (zero-line)", "zero-line order is confirmed (no line-count check): 201, orid 60721, lines [], tot 0", async () => {
  const r = await http("POST", "/api/orders", { body: { orcuid: 1004, lines: [] } });
  expect(r.status === 201 && r.json.orid === 60721, `status ${r.status} ${r.text}`);
  expect(r.json.lines.length === 0 && r.json.tot === 0 && r.json.totvat === 0, `body ${r.text}`);
  ids.empty = r.json.orid;
  return { observed: { orid: r.json.orid, lines: r.json.lines.length } };
});

await check("P10", "ord-entry-ord100-c01 / c14", "missing customer 99999 -> 201 (no ExistCus), orphan order 60722; ORD701 updates 0 rows silently", async () => {
  const r = await http("POST", "/api/orders", { body: { orcuid: 99999, lines: [{ odarid: "C00100", odqty: 1, odprice: 24 }] } });
  expect(r.status === 201 && r.json.orid === 60722, `status ${r.status} ${r.text}`);
  expect(r.json.custnm === "", `custnm ${JSON.stringify(r.json.custnm)}`);
  ids.orphan = r.json.orid;
  return { observed: { orid: r.json.orid, custnm: r.json.custnm } };
});

await check("P11", "ord-entry-ord100-c01 (soft-deleted)", "soft-deleted customer 1005 (CUDEL = 'X') -> 201, orid 60723 (no IsCusDeleted)", async () => {
  const r = await http("POST", "/api/orders", { body: { orcuid: 1005, lines: [{ odarid: "A00002", odqty: 2, odprice: 89.5 }, { odarid: "C00100", odqty: 4, odprice: 24 }] } });
  expect(r.status === 201 && r.json.orid === 60723, `status ${r.status} ${r.text}`);
  ids.deliver = r.json.orid;
  const cus = await one("SELECT culastord, cudel FROM customer WHERE cuid = 1005");
  expect(Number(cus.culastord) === todayYmd() && cus.cudel === "X", `customer ${JSON.stringify(cus)}`);
  return { observed: { orid: r.json.orid, custnm: r.json.custnm, culastord: Number(cus.culastord), cudel: cus.cudel } };
});

await check("P12", "ord-entry-ord100-c01 (cancelled prompt)", "orcuid 0 (SltCustomer cancelled) -> 400 VALIDATION FIELD_INVALID orcuid; nothing written", async () => {
  const before = await count("SELECT COUNT(*)::int AS n FROM orders");
  const r = await http("POST", "/api/orders", { body: { orcuid: 0, lines: [] } });
  expect(r.status === 400 && r.json?.code === "VALIDATION", `status ${r.status} ${r.text}`);
  expect(r.json.errors.some((e) => e.code === "FIELD_INVALID" && e.field === "orcuid"), `errors ${JSON.stringify(r.json.errors)}`);
  const after = await count("SELECT COUNT(*)::int AS n FROM orders");
  expect(before === after, "an order was written");
  return { observed: r.json };
});

await check("P13", "CR-O10", "over-long odarid / non-integer odqty -> 400 VALIDATION with per-line field paths, all rules in one pass", async () => {
  const r = await http("POST", "/api/orders", { body: { orcuid: 1001, lines: [{ odarid: "TOOLONG7", odqty: "x" }, { odarid: "A00001", odqty: 1 }] } });
  expect(r.status === 400 && r.json?.code === "VALIDATION", `status ${r.status} ${r.text}`);
  const codes = r.json.errors.map((e) => `${e.code}@${e.field}`).sort();
  expect(codes.join() === "FIELD_INVALID@lines[0].odqty,FIELD_TOO_LONG@lines[0].odarid", `errors ${codes}`);
  return { observed: r.json.errors };
});

// ---------------------------------------------------------------- ORD201 / ORD200 lists
await check("P14", "ord-maintain-ord201-c01 (planted defect)", "GET /api/orders -> ORDERCUS rows only: orphan 60722 hidden (inner join); order date desc, id desc; TOTVAL VAT-inclusive; OrderListPage shape", async () => {
  const r = await http("GET", "/api/orders");
  expect(r.status === 200, `status ${r.status}`);
  expect(sameKeys(r.json, PAGE_KEYS), `page keys ${keysOf(r.json)}`);
  const rows = r.json.rows;
  expect(rows.every((x) => sameKeys(x, LIST_ROW_KEYS)), `row keys ${keysOf(rows[0] ?? {})}`);
  expect(rows.map((x) => x.orid).join() === "60723,60721,60720", `order ${rows.map((x) => x.orid)}`);
  expect(!rows.some((x) => x.orid === ids.orphan), "orphan order listed — inner join not preserved");
  const main = rows.find((x) => x.orid === ids.main);
  expect(main.totval === 487.42 && main.custnm === "Baker Street Books", `row ${JSON.stringify(main)}`);
  const empty = rows.find((x) => x.orid === ids.empty);
  expect(empty.totval === 0, `zero-line totval ${empty.totval}`);
  expect(r.json.more === false && r.json.nextOffset === null, "Bottom expected");
  return { observed: { order: rows.map((x) => x.orid), hiddenOrphan: ids.orphan, totval: rows.map((x) => x.totval) }, note: "planted defect asserted, not fixed" };
});

await check("P15", "ord-maintain-ord200-c01 / c11", "GET /api/orders?cuid=1002 -> one customer's orders; cuid=1001 (no orders) -> empty rows, no message", async () => {
  const a = await http("GET", "/api/orders?cuid=1002");
  const b = await http("GET", "/api/orders?cuid=1001");
  expect(a.status === 200 && a.json.rows.length === 1 && a.json.rows[0].orid === ids.main, `1002 -> ${a.text}`);
  expect(b.status === 200 && b.json.rows.length === 0 && b.json.more === false && b.json.nextOffset === null, `1001 -> ${b.text}`);
  return { observed: { "1002": a.json.rows.map((x) => x.orid), "1001": b.json } };
});

await check("P16", "openapi BadRequest", "GET /api/orders?cuid=abc / ?offset=-1 -> 400 BAD_REQUEST", async () => {
  const a = await http("GET", "/api/orders?cuid=abc");
  const b = await http("GET", "/api/orders?offset=-1");
  expect(a.status === 400 && a.json?.code === "BAD_REQUEST", `cuid -> ${a.status} ${a.text}`);
  expect(b.status === 400 && b.json?.code === "BAD_REQUEST", `offset -> ${b.status} ${b.text}`);
  return { observed: { cuid: a.json, offset: b.json } };
});

await check("P17", "ord-maintain-ord201-c01 (paging) / CR-O5", "16 orders for one customer page 14 + 2: more=true nextOffset=14, then more=false; cuid list paged too", async () => {
  for (let i = 0; i < 15; i++) {
    const r = await http("POST", "/api/orders", { body: { orcuid: 1004, lines: [] } });
    expect(r.status === 201, `fill ${i} -> ${r.status}`);
  }
  const p1 = await http("GET", "/api/orders?cuid=1004");
  const p2 = await http("GET", `/api/orders?cuid=1004&offset=${p1.json.nextOffset}`);
  expect(p1.json.rows.length === 14 && p1.json.more === true && p1.json.nextOffset === 14, `page 1 ${p1.json.rows.length} ${p1.json.more} ${p1.json.nextOffset}`);
  expect(p2.json.rows.length === 2 && p2.json.more === false && p2.json.nextOffset === null, `page 2 ${p2.json.rows.length} ${p2.json.more} ${p2.json.nextOffset}`);
  expect(p1.json.rows.every((x) => x.orcuid === 1004), "foreign customer in the cuid list");
  const all = await http("GET", "/api/orders");
  expect(all.json.rows.length === 14 && all.json.more === true, `all-orders page 1 ${all.json.rows.length} ${all.json.more}`);
  const idsDesc = p1.json.rows.map((x) => x.orid);
  expect(idsDesc.every((v, i) => i === 0 || idsDesc[i - 1] > v), "same-day rows not in id desc order (CR-O4)");
  return { observed: { page1: idsDesc, page2: p2.json.rows.map((x) => x.orid), nextOffset: p1.json.nextOffset } };
});

// ---------------------------------------------------------------- ORD202 display
await check("P18", "ord-maintain-ord202-c01 / c02", "GET /api/orders/60720 -> header with GetCusName, null dates, every line with ardesc, tot/totvat = stored sums; OrderDetail shape", async () => {
  const r = await http("GET", `/api/orders/${ids.main}`);
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, DETAIL_KEYS), `keys ${keysOf(r.json)}`);
  const d = r.json;
  expect(d.custnm === "Baker Street Books" && d.ordatdel === null && d.ordatclo === null, `header ${JSON.stringify(d)}`);
  expect(d.lines.length === 3 && d.lines[0].ardesc === "Anvil, cast iron, 25 kg" && d.lines[2].ardesc === "Safety gloves, pair", "ardesc");
  const tot = Math.round(d.lines.reduce((s, l) => s + l.odtot, 0) * 100) / 100;
  const totvat = Math.round(d.lines.reduce((s, l) => s + l.odtotvat, 0) * 100) / 100;
  expect(d.tot === tot && d.totvat === totvat, `sums ${d.tot}/${tot} ${d.totvat}/${totvat}`);
  return { observed: { custnm: d.custnm, lines: d.lines.map((l) => [l.odline, l.odarid, l.ardesc]), tot: d.tot, totvat: d.totvat } };
});

await check("P19", "ord-maintain-ord202-c01 / CR-O2", "orphan order 60722 is reachable by id with a blank customer name; unknown article gives a blank description", async () => {
  const r = await http("GET", `/api/orders/${ids.orphan}`);
  expect(r.status === 200 && r.json.custnm === "", `status ${r.status} custnm ${JSON.stringify(r.json?.custnm)}`);
  const c = await http("POST", "/api/orders", { body: { orcuid: 1003, lines: [{ odarid: "A00001", odqty: 1, odprice: 1 }, { odarid: "GHOST1", odqty: 1, odprice: 1 }] } });
  expect(c.status === 201, `confirm ${c.status} ${c.text}`);
  ids.ghost = c.json.orid;
  const g = await http("GET", `/api/orders/${ids.ghost}`);
  expect(g.json.lines[0].ardesc !== "" && g.json.lines[1].ardesc === "", `descriptions ${JSON.stringify(g.json.lines.map((l) => l.ardesc))}`);
  return { observed: { orphanCustnm: r.json.custnm, ghostDescriptions: g.json.lines.map((l) => l.ardesc) }, note: "blank, not the previous line's text (ORD202 repeated it — CR-O2)" };
});

await check("P20", "ord-maintain-ord202-c01 / CR-O1", "unknown order -> 404 ORDER_NOT_FOUND {code, message, orid}; non-numeric / 7-digit id also 404 (see gap G-O2)", async () => {
  const a = await http("GET", "/api/orders/999");
  const b = await http("GET", "/api/orders/abc");
  const c = await http("GET", "/api/orders/1234567");
  expect(a.status === 404 && a.json?.code === "ORDER_NOT_FOUND" && sameKeys(a.json, NOT_FOUND_KEYS) && a.json.orid === 999, `999 -> ${a.status} ${a.text}`);
  expect(b.status === 404 && b.json?.code === "ORDER_NOT_FOUND" && b.json.orid === 0, `abc -> ${b.status} ${b.text}`);
  expect(c.status === 404 && c.json?.code === "ORDER_NOT_FOUND", `1234567 -> ${c.status} ${c.text}`);
  return { observed: { "999": a.json, abc: b.json, "1234567": c.json } };
});

// ---------------------------------------------------------------- ORD101 line maintenance
await check("P21", "ord-entry-ord101-c03 / ord-trigger-ord700-c04", "PUT line 1 of 60720 {5, 2, 100} -> 200 LineDetail, odtot 500, odtotvat 600; ORD700 update applies the OUTSTANDING delta (+3 -2 = +1 on top of 2)", async () => {
  const before = await arcusqty("A00001");
  const r = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 5, odqtyliv: 2, odprice: 100 } });
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, LINE_KEYS), `keys ${keysOf(r.json)}`);
  expect(r.json.odqty === 5 && r.json.odqtyliv === 2 && r.json.odprice === 100 && r.json.odtot === 500 && r.json.odtotvat === 600, `line ${r.text}`);
  const after = await arcusqty("A00001");
  expect(after === before + (5 - 2) - (2 - 0), `arcusqty ${before} -> ${after}`);
  return { observed: { line: r.json, arcusqty: [before, after] } };
});

await check("P22", "ord-entry-ord101-c04", "ERR1001 when typed delivered > STORED ordered (20/15 on stored 5/2) — consistent typed pair still refused", async () => {
  const r = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 15, odqtyliv: 20, odprice: 100 } });
  expect(r.status === 400 && r.json?.code === "VALIDATION", `status ${r.status} ${r.text}`);
  const codes = r.json.errors.map((e) => e.code);
  expect(codes.join() === "ERR1001", `codes ${codes}`);
  expect(r.json.errors[0].message === "Delivered quantity must be lower or equal to ordered quantity.", `text ${r.json.errors[0].message}`);
  return { observed: r.json };
});

await check("P23", "ord-entry-ord101-c04", "ERR1002 when typed ordered < STORED delivered; both rules can be on together (1/6 on stored 5/2)", async () => {
  const r = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 1, odqtyliv: 6, odprice: 100 } });
  expect(r.status === 400 && r.json?.code === "VALIDATION", `status ${r.status} ${r.text}`);
  const codes = r.json.errors.map((e) => e.code).sort();
  expect(codes.join() === "ERR1001,ERR1002", `codes ${codes}`);
  return { observed: r.json };
});

await check("P24", "ord-entry-ord101-c04 (as-is, needs-SME)", "both lowered but inconsistent (odqty 3, odqtyliv 4 on stored 5/2) is ACCEPTED and stored with delivered > ordered", async () => {
  const r = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 3, odqtyliv: 4, odprice: 100 } });
  expect(r.status === 200 && r.json.odqty === 3 && r.json.odqtyliv === 4, `status ${r.status} ${r.text}`);
  // restore a sane state for the later delete-guard checks: ordered 5, delivered 2
  const back = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 5, odqtyliv: 2, odprice: 100 } });
  expect(back.status === 200, `restore ${back.status} ${back.text}`);
  return { observed: { accepted: [r.json.odqty, r.json.odqtyliv] }, note: "quirk asserted as-is; SME question open" };
});

await check("P25", "ord-entry-ord101-c03 (silent re-rate) / CR-O11", "PUT with nothing changed rewrites ODTOTVAT at TODAY's rate: after VATDEF '2' 20 -> 21, the same save yields 605 (then rate restored)", async () => {
  const same = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 5, odqtyliv: 2, odprice: 100 } });
  expect(same.status === 200 && same.json.odtotvat === 600, `baseline ${same.text}`);
  await pool.query("UPDATE vatdef SET vatrate = 21 WHERE vatcode = '2'");
  try {
    const r = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 5, odqtyliv: 2, odprice: 100 } });
    expect(r.status === 200 && r.json.odtotvat === 605 && r.json.odtot === 500, `re-rated ${r.text}`);
  } finally {
    await pool.query("UPDATE vatdef SET vatrate = 20 WHERE vatcode = '2'");
  }
  const restore = await http("PUT", `/api/orders/${ids.main}/lines/1`, { body: { odqty: 5, odqtyliv: 2, odprice: 100 } });
  expect(restore.status === 200 && restore.json.odtotvat === 600, `restore ${restore.text}`);
  return { observed: { at20: 600, at21: 605, restored: restore.json.odtotvat } };
});

await check("P26", "ord-entry-ord101-c02 / CR-O1", "PUT / DELETE on an unknown line -> 404 ORDER_NOT_FOUND with odline; unknown order -> 404 without odline", async () => {
  const a = await http("PUT", `/api/orders/${ids.main}/lines/99`, { body: { odqty: 1, odqtyliv: 0, odprice: 1 } });
  const b = await http("DELETE", `/api/orders/${ids.main}/lines/99`);
  const c = await http("PUT", `/api/orders/999/lines/1`, { body: { odqty: 1, odqtyliv: 0, odprice: 1 } });
  expect(a.status === 404 && a.json?.code === "ORDER_NOT_FOUND" && sameKeys(a.json, NOT_FOUND_LINE_KEYS) && a.json.odline === 99, `PUT -> ${a.status} ${a.text}`);
  expect(b.status === 404 && b.json?.code === "ORDER_NOT_FOUND" && b.json.odline === 99, `DELETE -> ${b.status} ${b.text}`);
  expect(c.status === 404 && c.json?.code === "ORDER_NOT_FOUND" && c.json.orid === 999, `order 999 -> ${c.status} ${c.text}`);
  return { observed: { put: a.json, del: b.json, order999: c.json } };
});

await check("P27", "ord-entry-ord101-c05 / CR-O6", "DELETE line with ODQTYLIV > 0 -> 400 LINE_HAS_DELIVERY 'Line with delivery can not be deleted.' (guard reads the table)", async () => {
  const r = await http("DELETE", `/api/orders/${ids.main}/lines/1`);
  expect(r.status === 400 && r.json?.code === "LINE_HAS_DELIVERY", `status ${r.status} ${r.text}`);
  expect(r.json.message === "Line with delivery can not be deleted.", `text ${r.json.message}`);
  const still = await one("SELECT COUNT(*)::int AS n FROM detord WHERE odorid = $1 AND odline = 1", [ids.main]);
  expect(Number(still.n) === 1, "line was deleted despite the guard");
  return { observed: r.json };
});

await check("P28", "ord-entry-ord101-c06 / ord-trigger-ord700-c03", "DELETE line 3 (B00010 x3, undelivered) with a 12-char X-User-Id -> 204; SAMLOG gets the ORD700 text with user cut to 10; arcusqty -= outstanding", async () => {
  const before = await arcusqty("B00010");
  const logsBefore = await count("SELECT COUNT(*)::int AS n FROM samlog");
  const r = await http("DELETE", `/api/orders/${ids.main}/lines/3`, { headers: { "X-User-Id": "VERIFIER0123" } });
  expect(r.status === 204, `status ${r.status} ${r.text}`);
  const after = await arcusqty("B00010");
  expect(after === before - 3, `arcusqty ${before} -> ${after}`);
  const log = await one("SELECT user_id, msg FROM samlog ORDER BY id DESC LIMIT 1");
  const logsAfter = await count("SELECT COUNT(*)::int AS n FROM samlog");
  expect(logsAfter === logsBefore + 1, `samlog rows ${logsBefore} -> ${logsAfter}`);
  expect(log.msg === `ORD700:Order Line deleted ${ids.main} 3 article : B00010 quantity : 3`, `msg ${JSON.stringify(log.msg)}`);
  expect(log.user_id === "VERIFIER01", `user_id ${JSON.stringify(log.user_id)}`);
  const lines = await count("SELECT COUNT(*)::int AS n FROM detord WHERE odorid = $1", [ids.main]);
  expect(lines === 2, `${lines} lines left (no renumbering expected: 1 and 2)`);
  return { observed: { samlog: log, arcusqty: [before, after], linesLeft: lines } };
});

await check("P29", "ord-entry-ord101-c10", "no add-line route for an existing order: POST /api/orders/60720/lines -> 404", async () => {
  const r = await http("POST", `/api/orders/${ids.main}/lines`, { body: { odarid: "A00001", odqty: 1 } });
  expect(r.status === 404, `status ${r.status} ${r.text}`);
  return { observed: { status: r.status, body: r.json } };
});

await check("P30", "ord-entry-ord101-c06 (last line)", "deleting the last line leaves a header with zero lines; the order still lists with TOTVAL 0", async () => {
  const c = await http("POST", "/api/orders", { body: { orcuid: 1001, lines: [{ odarid: "A00001", odqty: 1, odprice: 10 }] } });
  expect(c.status === 201, `confirm ${c.status}`);
  const d = await http("DELETE", `/api/orders/${c.json.orid}/lines/1`);
  expect(d.status === 204, `delete ${d.status} ${d.text}`);
  const g = await http("GET", `/api/orders/${c.json.orid}`);
  expect(g.status === 200 && g.json.lines.length === 0 && g.json.tot === 0, `get ${g.text}`);
  const l = await http("GET", "/api/orders?cuid=1001");
  const row = l.json.rows.find((x) => x.orid === c.json.orid);
  expect(row && row.totval === 0, `list row ${JSON.stringify(row)}`);
  ids.emptied = c.json.orid;
  return { observed: { orid: c.json.orid, lines: 0, totval: row.totval } };
});

// ---------------------------------------------------------------- ORD200 / ORD201 options 7 / 8 / 4
await check("P31", "ord-maintain-ord200-c06", "POST close on 60721 -> 200 Order shape, ordatclo = today, ordatdel = today (was null); again -> 400 INVALID_OPTION 'Invalid Option'", async () => {
  const r = await http("POST", `/api/orders/${ids.empty}/close`);
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, ORDER_KEYS), `keys ${keysOf(r.json)}`);
  expect(r.json.ordatclo === todayIso() && r.json.ordatdel === todayIso(), `dates ${r.text}`);
  const again = await http("POST", `/api/orders/${ids.empty}/close`);
  expect(again.status === 400 && again.json?.code === "INVALID_OPTION" && again.json.message === "Invalid Option", `again ${again.status} ${again.text}`);
  return { observed: { first: r.json, again: again.json } };
});

await check("P32", "ord-maintain-ord200-c06 (lines untouched)", "close on 60720 (open lines) keeps ODQTYLIV 0 on line 2 and does not reduce arcusqty; ordatdel stamped because it was null", async () => {
  const before = await arcusqty("A00002");
  const r = await http("POST", `/api/orders/${ids.main}/close`);
  expect(r.status === 200 && r.json.ordatclo === todayIso() && r.json.ordatdel === todayIso(), `status ${r.status} ${r.text}`);
  const line2 = await one("SELECT odqtyliv FROM detord WHERE odorid = $1 AND odline = 2", [ids.main]);
  expect(Number(line2.odqtyliv) === 0, `line 2 odqtyliv ${line2.odqtyliv}`);
  expect((await arcusqty("A00002")) === before, "arcusqty reduced by close");
  return { observed: { order: r.json, line2Odqtyliv: Number(line2.odqtyliv), arcusqtyA00002: before } };
});

await check("P33", "ord-maintain-ord200-c07", "POST deliver on 60723 (line 2 partially delivered first) -> 200 {order, linesDelivered: 1}; partial line skipped; not closed; arcusqty A00002 -= 2", async () => {
  const p = await http("PUT", `/api/orders/${ids.deliver}/lines/2`, { body: { odqty: 4, odqtyliv: 1, odprice: 24 } });
  expect(p.status === 200, `partial ${p.status} ${p.text}`);
  const before = await arcusqty("A00002");
  const r = await http("POST", `/api/orders/${ids.deliver}/deliver`);
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, ["linesDelivered", "order"]) && sameKeys(r.json.order, ORDER_KEYS), `keys ${keysOf(r.json)}`);
  expect(r.json.linesDelivered === 1 && r.json.order.ordatdel === todayIso() && r.json.order.ordatclo === null, `body ${r.text}`);
  const rows = (await pool.query("SELECT odline, odqty, odqtyliv FROM detord WHERE odorid = $1 ORDER BY odline", [ids.deliver])).rows;
  expect(Number(rows[0].odqtyliv) === 2 && Number(rows[1].odqtyliv) === 1, `lines ${JSON.stringify(rows)}`);
  expect((await arcusqty("A00002")) === before - 2, "arcusqty not reduced by the delivered quantity");
  return { observed: { result: r.json, lines: rows } };
});

await check("P34", "ord-maintain-ord200-c07 (as-is)", "deliver again -> 400 INVALID_OPTION; deliver a closed order (60721) -> 400 INVALID_OPTION (close stamps ORDATDEL)", async () => {
  const a = await http("POST", `/api/orders/${ids.deliver}/deliver`);
  const b = await http("POST", `/api/orders/${ids.empty}/deliver`);
  expect(a.status === 400 && a.json?.code === "INVALID_OPTION", `again ${a.status} ${a.text}`);
  expect(b.status === 400 && b.json?.code === "INVALID_OPTION", `closed ${b.status} ${b.text}`);
  return { observed: { again: a.json, closed: b.json } };
});

await check("P35", "ord-maintain-ord200-c08", "DELETE closed 60721 -> 400 CLOSED_ORDER; DELETE 60723 (deliveries) -> 400 ORDER_HAS_DELIVERIES with the DDS typo 'whith'", async () => {
  const a = await http("DELETE", `/api/orders/${ids.empty}`);
  const b = await http("DELETE", `/api/orders/${ids.deliver}`);
  expect(a.status === 400 && a.json?.code === "CLOSED_ORDER" && a.json.message === "Closed order can not be edited or deleted", `closed ${a.status} ${a.text}`);
  expect(b.status === 400 && b.json?.code === "ORDER_HAS_DELIVERIES" && b.json.message === "Order whith deliveries can not be deleted", `deliveries ${b.status} ${b.text}`);
  return { observed: { closed: a.json, deliveries: b.json } };
});

await check("P36", "ord-maintain-ord200-c04 / c13 / CR-O3", "DELETE an open order with 2 lines -> 204; lines and header gone together; 2 SAMLOG rows; arcusqty restored; CULASTORD NOT maintained (c12)", async () => {
  const c = await http("POST", "/api/orders", { body: { orcuid: 1003, lines: [{ odarid: "A00001", odqty: 2, odprice: 10 }, { odarid: "B00010", odqty: 5, odprice: 1 }] } });
  expect(c.status === 201, `confirm ${c.status}`);
  const orid = c.json.orid;
  const a1 = await arcusqty("A00001"), b1 = await arcusqty("B00010");
  const logs = await count("SELECT COUNT(*)::int AS n FROM samlog");
  const cusBefore = await one("SELECT culastord FROM customer WHERE cuid = 1003");
  const r = await http("DELETE", `/api/orders/${orid}`, { headers: { "X-User-Id": "VERIFY" } });
  expect(r.status === 204, `status ${r.status} ${r.text}`);
  const h = await count("SELECT COUNT(*)::int AS n FROM orders WHERE orid = $1", [orid]);
  const l = await count("SELECT COUNT(*)::int AS n FROM detord WHERE odorid = $1", [orid]);
  expect(h === 0 && l === 0, `header ${h} lines ${l}`);
  expect((await count("SELECT COUNT(*)::int AS n FROM samlog")) === logs + 2, "expected 2 SAMLOG rows");
  expect((await arcusqty("A00001")) === a1 - 2 && (await arcusqty("B00010")) === b1 - 5, "arcusqty not restored");
  const cusAfter = await one("SELECT culastord FROM customer WHERE cuid = 1003");
  expect(Number(cusAfter.culastord) === Number(cusBefore.culastord) && Number(cusAfter.culastord) === todayYmd(), `culastord ${cusBefore.culastord} -> ${cusAfter.culastord}`);
  const g = await http("GET", `/api/orders/${orid}`);
  expect(g.status === 404, `after delete GET -> ${g.status}`);
  return { observed: { orid, samlogAdded: 2, culastord: Number(cusAfter.culastord) }, note: "CULASTORD still points at the deleted order's date (as-is, needs-SME)" };
});

await check("P37", "CR-O1", "close / deliver / delete on an unknown order -> 404 ORDER_NOT_FOUND", async () => {
  const out = {};
  for (const [m, p] of [["POST", "/api/orders/999/close"], ["POST", "/api/orders/999/deliver"], ["DELETE", "/api/orders/999"]]) {
    const r = await http(m, p);
    out[`${m} ${p}`] = r.status;
    expect(r.status === 404 && r.json?.code === "ORDER_NOT_FOUND", `${m} ${p} -> ${r.status} ${r.text}`);
  }
  return { observed: out };
});

// ---------------------------------------------------------------- ORD500 document
await check("P38", "ord-print-ord500-c01 / CR-O7", "GET /api/orders/60720/document -> 200 text/plain, 90-column lines, customer block, 'Order Number yyyy/ nnn', ISO order date, Net / VAT / Total", async () => {
  const r = await http("GET", `/api/orders/${ids.main}/document`);
  expect(r.status === 200 && r.type.startsWith("text/plain"), `status ${r.status} ${r.type}`);
  const lines = r.text.split("\n");
  expect(lines.every((l) => l.length <= 90), `line longer than 90 columns: ${lines.find((l) => l.length > 90)?.length}`);
  expect(r.text.includes("Baker Street Books"), "customer block missing");
  expect(new RegExp(`Order Number\\s+${todayIso().slice(0, 4)}/\\s*${ids.main}`).test(r.text), "Order Number yyyy/ nnn missing");
  expect(r.text.includes(todayIso()), "ISO order date missing (CR-O7)");
  expect(/\bNet\b/.test(r.text) && /\bVAT\b/.test(r.text) && /\bTotal\b/.test(r.text), "Net / VAT / Total missing");
  expect(!r.text.includes("\f"), "single-page order should not contain a form feed");
  return { observed: { bytes: r.text.length, lines: lines.length, maxWidth: Math.max(...lines.map((l) => l.length)) } };
});

await check("P39", "ord-print-ord500-c01 (planted defect)", "silent-zero order (X9 line) prints a blank VAT amount: VAT = Total - Net = 0 -> EDTCDE(2) blank", async () => {
  const c = await http("POST", "/api/orders", { body: { orcuid: 1002, lines: [{ odarid: "X9", odqty: 2, odprice: 10 }] } });
  expect(c.status === 201 && c.json.totvat === 20 && c.json.tot === 20, `confirm ${c.status} ${c.text}`);
  const r = await http("GET", `/api/orders/${c.json.orid}/document`);
  // totals labels sit at column 66 (65 leading blanks); the X9 description also contains "VAT"
  const vatLine = r.text.split("\n").find((l) => /^ {65}VAT/.test(l));
  expect(vatLine && !/\d/.test(vatLine), `VAT line carries digits: ${JSON.stringify(vatLine)}`);
  const netLine = r.text.split("\n").find((l) => /^ {65}Net/.test(l));
  expect(/20[.,]00/.test(netLine), `Net line ${JSON.stringify(netLine)}`);
  return { observed: { orid: c.json.orid, vatLine, netLine }, note: "planted defect asserted, not fixed" };
});

await check("P40", "ord-print-ord500-c01 (paging)", "16 details -> 2 pages separated by a form feed; page 2 repeats the company block and Order Number but not the customer block", async () => {
  const lines = Array.from({ length: 16 }, (_, i) => ({ odline: i + 1, odarid: "B00010", odqty: 1, odprice: 1 }));
  const c = await http("POST", "/api/orders", { body: { orcuid: 1004, lines } });
  expect(c.status === 201 && c.json.lines.length === 16, `confirm ${c.status}`);
  const r = await http("GET", `/api/orders/${c.json.orid}/document`);
  const pages = r.text.split("\f");
  expect(pages.length === 2, `${pages.length} pages`);
  expect(pages[0].includes("Delta Logistics") && !pages[1].includes("Delta Logistics"), "customer block placement");
  expect(pages[1].includes("Order Number"), "page 2 lacks Order Number");
  expect(pages[1].includes("Total"), "totals not on the last page");
  return { observed: { orid: c.json.orid, pages: pages.length, page1Lines: pages[0].split("\n").length, page2Lines: pages[1].split("\n").length } };
});

await check("P41", "ord-print-ord500-c08 / CR-O1", "document for an unknown order -> 404 ORDER_NOT_FOUND (legacy: exception before the first write)", async () => {
  const r = await http("GET", "/api/orders/999/document");
  expect(r.status === 404 && r.json?.code === "ORDER_NOT_FOUND", `status ${r.status} ${r.text}`);
  return { observed: r.json };
});

// ---------------------------------------------------------------- FARTICLE dependency surface
await check("P42", "CR-O9 / ord-entry-ord100-c14", "GET /api/articles -> 6 fixture rows ordered by id, soft-deleted Z00001 included; Article shape", async () => {
  const r = await http("GET", "/api/articles");
  expect(r.status === 200 && Array.isArray(r.json.rows), `status ${r.status}`);
  expect(r.json.rows.length === 6 && r.json.rows.every((a) => sameKeys(a, ARTICLE_KEYS)), `rows ${r.json.rows.length} keys ${keysOf(r.json.rows[0] ?? {})}`);
  const idsSorted = r.json.rows.map((a) => a.arid);
  expect(JSON.stringify(idsSorted) === JSON.stringify([...idsSorted].sort()), `order ${idsSorted}`);
  expect(r.json.rows.find((a) => a.arid === "Z00001")?.ardel === "X", "soft-deleted article missing");
  return { observed: idsSorted };
});

// ---------------------------------------------------------------- date lock in the store
await check("P43", "pack date lock", "no sentinel dates stored: ordatdel / ordatclo are NULL for never; nothing equals 1940-01-01; culastord stays yyyymmdd integer", async () => {
  const sentinel = await count("SELECT COUNT(*)::int AS n FROM orders WHERE ordate = '1940-01-01' OR ordatdel = '1940-01-01' OR ordatclo = '1940-01-01'");
  const nulls = await one("SELECT COUNT(*) FILTER (WHERE ordatdel IS NULL)::int AS del_null, COUNT(*) FILTER (WHERE ordatclo IS NULL)::int AS clo_null, COUNT(*)::int AS total FROM orders");
  const cus = await one("SELECT pg_typeof(culastord)::text AS t, culastord FROM customer WHERE cuid = 1002");
  expect(sentinel === 0, `${sentinel} sentinel rows`);
  expect(nulls.del_null > 0 && nulls.clo_null > 0, `nulls ${JSON.stringify(nulls)}`);
  expect(cus.t === "integer" && Number(cus.culastord) === todayYmd(), `culastord ${JSON.stringify(cus)}`);
  return { observed: { sentinelRows: sentinel, ...nulls, culastord: cus } };
});

// ---------------------------------------------------------------- web (DSPF -> web) smoke
await check("P44", "DSPF->web", "web pages answer 200 text/html: /orders, /orders?cuid=, /orders/new, /orders/new?cuid=, /orders/:id, ?detail=1, /lines, /document, /confirmed", async () => {
  const out = {};
  for (const p of ["/orders", "/orders?cuid=1002", "/orders/new?cuid=1002", `/orders/${ids.main}`, `/orders/${ids.main}?detail=1`, `/orders/${ids.main}/lines`, `/orders/${ids.main}/document`, `/orders/${ids.main}/confirmed`]) {
    const r = await http("GET", p);
    out[p] = `${r.status} ${r.type.split(";")[0]}`;
    expect(r.status === 200 && (r.type.includes("text/html") || p.endsWith("/document")), `${p} -> ${r.status} ${r.type}`);
  }
  const redirect = await fetch(BASE + "/orders/new", { redirect: "manual" });
  out["/orders/new"] = `${redirect.status} -> ${redirect.headers.get("location")}`;
  expect(redirect.status >= 300 && redirect.status < 400 && /\/customers\/select/.test(redirect.headers.get("location") ?? ""), `/orders/new -> ${redirect.status} ${redirect.headers.get("location")}`);
  return { observed: out };
});

await check("P45", "ord-maintain-ord200-c09 (planted defect)", "ORD200 twin (/orders?cuid=1002) refuses EVERY 2=Edit with the closed-order text; ORD201 twin (/orders) links 2=Edit on open rows only", async () => {
  const a = await http("GET", "/orders?cuid=1002");
  expect(a.status === 200, `status ${a.status}`);
  const refused = (a.text.match(/<span class="muted" title="Closed order can not be edited or deleted">2=Edit<\/span>/g) ?? []).length;
  const linked = (a.text.match(/<a href="\/orders\/\d+\/lines">2=Edit<\/a>/g) ?? []).length;
  const apiRows = (await http("GET", "/api/orders?cuid=1002")).json.rows;
  const rows = apiRows.length;
  const openRows = apiRows.filter((x) => x.ordatclo === null).length;
  expect(rows > 0 && openRows > 0 && refused === rows && linked === 0, `ORD200: rows ${rows} (open ${openRows}) refused ${refused} linked ${linked}`);
  // ORD201 twin: walk every page; open rows link, closed rows refuse
  let bLinked = 0, bRefused = 0, offset = 0, pages = 0;
  for (;;) {
    const b = await http("GET", `/orders?offset=${offset}`);
    pages += 1;
    bLinked += (b.text.match(/<a href="\/orders\/\d+\/lines">2=Edit<\/a>/g) ?? []).length;
    bRefused += (b.text.match(/<span class="muted" title="Closed order can not be edited or deleted">2=Edit<\/span>/g) ?? []).length;
    const m = b.text.match(/offset=(\d+)">Page Down/);
    if (!m) break;
    offset = Number(m[1]);
  }
  const api = (await pool.query("SELECT COUNT(*) FILTER (WHERE h.ordatclo IS NULL)::int AS open, COUNT(*) FILTER (WHERE h.ordatclo IS NOT NULL)::int AS closed FROM orders h JOIN customer c ON c.cuid = h.orcuid")).rows[0];
  expect(bLinked === api.open && bRefused === api.closed && bRefused > 0, `ORD201: linked ${bLinked}/${api.open} open, refused ${bRefused}/${api.closed} closed over ${pages} pages`);
  return { observed: { ord200: { rows, openRows, refused, linked }, ord201: { pages, linked: bLinked, refused: bRefused, open: api.open, closed: api.closed } }, note: "planted defect asserted, not fixed" };
});

await check("P46", "ord-maintain-ord202-c02", "web ORD202: description hidden by default, shown with ?detail=1 (F11=Detail)", async () => {
  const plain = await http("GET", `/orders/${ids.main}`);
  const detail = await http("GET", `/orders/${ids.main}?detail=1`);
  const desc = "Anvil, cast iron, 25 kg";
  expect(!plain.text.includes(desc) && detail.text.includes(desc), `plain has desc: ${plain.text.includes(desc)}, detail has desc: ${detail.text.includes(desc)}`);
  return { observed: { hiddenByDefault: !plain.text.includes(desc), shownWithDetail: detail.text.includes(desc) } };
});

// ---------------------------------------------------------------- CUS untouched by this run
await check("P47", "scope guard", "CUS API still answers as under its own pack (GET /api/customers/1002 200) and the CUS list still shows 5=Orders as a non-link (not re-scoped)", async () => {
  const c = await http("GET", "/api/customers/1002");
  expect(c.status === 200 && c.json.cuid === 1002, `customers -> ${c.status}`);
  const l = await http("GET", "/customers");
  expect(!/href="\/orders/.test(l.text), "CUS list links into ORD — CUS pack widened");
  return { observed: { customer1002: c.status, cusListLinksToOrd: false } };
});

await pool.end();

const summary = {
  run_id: "2026-09-09-r1",
  pack: "atu-merlin-ts-ord-v1@1",
  mode: "COMPARE (TypeScript HTTP boundary only)",
  characterization: "WAIVED_PATHFINDER",
  oracle: "Discovery cards + modern/openapi/order.yaml + modern/README.md ORD section — not IBM i goldens",
  base_url: BASE,
  ran_at: new Date().toISOString(),
  totals: {
    pass: results.filter((r) => r.verdict === "PASS").length,
    fail: results.filter((r) => r.verdict === "FAIL").length,
    observed: results.filter((r) => r.verdict === "OBSERVED").length,
  },
  cases: results,
};
writeFileSync(join(here, "results.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(`\n${summary.totals.pass} PASS, ${summary.totals.fail} FAIL, ${summary.totals.observed} OBSERVED -> results.json`);
process.exitCode = summary.totals.fail > 0 ? 1 : 0;
