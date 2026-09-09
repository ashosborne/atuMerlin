#!/usr/bin/env node
// Live COMPARE probe at the TypeScript HTTP boundary — pack atu-merlin-ts-cus-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/cus-*/features) + modern/openapi/customer.yaml. NOT IBM i goldens.
//
//   cd modern && ./scripts/local-pg.sh start
//   DATABASE_URL=postgres://.../atu_merlin_verify npm run db:seed
//   DATABASE_URL=... PORT=3100 npx tsx src/server.ts &
//   BASE_URL=http://127.0.0.1:3100 DATABASE_URL=... node ../verification/cus-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Expects a freshly seeded database (src/db/seed.ts fixtures).

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../../../modern/package.json"));
const { Pool } = require("pg");

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DETAIL_KEYS = [
  "cuid", "custnm", "cuphone", "cuvat", "cumail", "culine1", "culine2", "culine3", "cuzip", "cucity", "cucoun",
  "countryName", "culimcre", "cucredit", "culastord", "lastOrderDate", "cucrea", "cumod", "cumodid", "cudel",
].sort();
const LIST_ROW_KEYS = ["cuid", "custnm", "culimcre", "cuzip", "cudel", "cucity"].sort();
const SLT_ROW_KEYS = ["cuid", "custnm", "cucity", "cucoun"].sort();
const COUNTRY_KEYS = ["coid", "countr", "coiso"].sort();

const results = [];

async function http(method, path, { body, headers } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(headers ?? {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html or empty */ }
  return { status: res.status, type: res.headers.get("content-type") ?? "", json, text };
}

function keysOf(o) { return Object.keys(o).sort(); }
function sameKeys(o, keys) { return JSON.stringify(keysOf(o)) === JSON.stringify(keys); }
function todayIso() { return new Date().toISOString().slice(0, 10); }

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
  console.log(`${r.verdict.padEnd(8)} ${id.padEnd(8)} ${card.padEnd(24)} ${description}${r.note ? `  — ${r.note}` : ""}`);
}

function expect(cond, msg) { if (!cond) throw new Error(msg); }

// ---------------------------------------------------------------------------------------------
await check("P00", "boot", "GET /health -> 200 {status: ok} (not in OpenAPI; see gap G-1)", async () => {
  const r = await http("GET", "/health");
  expect(r.status === 200 && r.json?.status === "ok", `status ${r.status} ${r.text}`);
  return { observed: r.json };
});

// c01 — list
await check("P01", "cus-interactive-c01", "GET /api/customers -> 200, CustomerListPage shape, SFL01 columns only, byte order (name,id)", async () => {
  const r = await http("GET", "/api/customers");
  expect(r.status === 200, `status ${r.status}`);
  expect(sameKeys(r.json, ["more", "next", "rows"]), `page keys ${keysOf(r.json)}`);
  expect(r.json.rows.length <= 14 && r.json.rows.length >= 5, `rows ${r.json.rows.length}`);
  for (const row of r.json.rows) expect(sameKeys(row, LIST_ROW_KEYS), `row keys ${keysOf(row)}`);
  const names = r.json.rows.map((x) => x.custnm);
  const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  expect(JSON.stringify(names) === JSON.stringify(sorted), `not byte-ordered: ${names}`);
  expect(r.json.more === false && r.json.next === null, "fixture set fits one page: expected Bottom");
  expect(r.json.rows.some((x) => x.cuid === 1005 && x.cudel === "X"), "soft-deleted 1005 must be listed unfiltered (c11)");
  return { observed: { rows: r.json.rows.length, more: r.json.more, first: names[0], last: names.at(-1) } };
});

await check("P02", "cus-interactive-c01", "positionTo is a name prefix; longer than 10 chars is cut to 10 (POSTO 10A)", async () => {
  const a = await http("GET", "/api/customers?positionTo=Casa");
  expect(a.status === 200 && a.json.rows[0]?.custnm === "Casa Rossi", `positionTo=Casa first row ${a.json?.rows?.[0]?.custnm}`);
  const b = await http("GET", "/api/customers?positionTo=" + encodeURIComponent("Delta LogiXXXXXX"));
  expect(b.status === 200, `long positionTo status ${b.status}`);
  expect(b.json.rows[0]?.custnm === "Delta Logistics", `10-char cut expected Delta Logistics, got ${b.json.rows[0]?.custnm}`);
  return { observed: { casa: a.json.rows[0].custnm, cut10: b.json.rows[0].custnm }, note: "OpenAPI says maxLength 10; implementation cuts rather than rejects (gap G-2, contract wording)" };
});

await check("P03", "cus-interactive-c01", "cursorId non-integer -> 400 BAD_REQUEST", async () => {
  const r = await http("GET", "/api/customers?cursorName=x&cursorId=abc");
  expect(r.status === 400 && r.json?.code === "BAD_REQUEST", `status ${r.status} ${r.text}`);
  return { observed: r.json };
});

// c05 — countries
await check("P04", "cus-interactive-c05", "GET /api/countries -> 200, rows {coid,countr,coiso} ordered by code", async () => {
  const r = await http("GET", "/api/countries");
  expect(r.status === 200 && Array.isArray(r.json.rows), `status ${r.status}`);
  for (const row of r.json.rows) expect(sameKeys(row, COUNTRY_KEYS), `country keys ${keysOf(row)}`);
  const codes = r.json.rows.map((x) => x.coid);
  expect(JSON.stringify(codes) === JSON.stringify([...codes].sort()), `not ordered ${codes}`);
  return { observed: { count: r.json.rows.length, codes } };
});

// c02 / c08 — create
const created = { cuid: null };
await check("P05", "cus-interactive-c02/c08", "POST valid -> 201 CustomerDetail; cuid >= 1551; CUCREA today; CUMODID = X-User-Id cut to 10; CUDEL blank; CUCREDIT/CULASTORD 0", async () => {
  const r = await http("POST", "/api/customers", {
    headers: { "x-user-id": "VERIFIER-XYZ" },
    body: { custnm: "Verify Probe One", cuphone: " 0999000111 ", cucoun: "GB", cucity: "Leeds", culimcre: "1500.50" },
  });
  expect(r.status === 201, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, DETAIL_KEYS), `detail keys ${keysOf(r.json)}`);
  expect(r.json.cuid >= 1551, `cuid ${r.json.cuid}`);
  expect(r.json.cucrea === todayIso(), `cucrea ${r.json.cucrea}`);
  expect(r.json.cumodid === "VERIFIER-X", `cumodid ${r.json.cumodid}`);
  expect(r.json.cudel === " " && r.json.cucredit === 0 && r.json.culastord === 0 && r.json.lastOrderDate === null, "defaults");
  expect(r.json.cuphone === "0999000111", `phone trimmed in place: ${JSON.stringify(r.json.cuphone)}`);
  expect(r.json.culimcre === 1500.5, `culimcre ${r.json.culimcre}`);
  expect(r.json.countryName === "United Kingdom", `countryName ${r.json.countryName}`);
  created.cuid = r.json.cuid;
  created.detail = r.json;
  return { observed: { cuid: r.json.cuid, cucrea: r.json.cucrea, cumodid: r.json.cumodid, cumod: r.json.cumod } };
});

await check("P06", "cus-interactive-c02", "second POST draws the next CUSSEQ value (no reuse)", async () => {
  const r = await http("POST", "/api/customers", { body: { custnm: "Verify Probe Two", cuphone: "0999000222", cucoun: "FR" } });
  expect(r.status === 201 && r.json.cuid === created.cuid + 1, `cuid ${r.json?.cuid} after ${created.cuid}`);
  expect(r.json.cumodid === "WEB", `default user ${r.json.cumodid}`);
  created.second = r.json.cuid;
  return { observed: { cuid: r.json.cuid, cumodid: r.json.cumodid } };
});

// c04 — validation
await check("P07", "cus-interactive-c04", "POST with blank name, unknown country, letters in phone -> 400 VALIDATION with all three codes in one pass", async () => {
  const r = await http("POST", "/api/customers", { body: { custnm: "   ", cuphone: "12AB", cucoun: "ZZ" } });
  expect(r.status === 400 && r.json?.code === "VALIDATION", `status ${r.status} ${r.text}`);
  const codes = r.json.errors.map((e) => e.code).sort();
  expect(JSON.stringify(codes) === JSON.stringify(["ERR0002", "ERR2002", "NAME_MANDATORY"]), `codes ${codes}`);
  return { observed: codes };
});

await check("P08", "cus-interactive-c04", "blank phone -> ERR2001 only for phone (digits + duplicate checks skipped)", async () => {
  const r = await http("POST", "/api/customers", { body: { custnm: "Arcad Software", cuphone: "   ", cucoun: "FR" } });
  expect(r.status === 400, `status ${r.status}`);
  const codes = r.json.errors.map((e) => e.code).sort();
  expect(JSON.stringify(codes) === JSON.stringify(["ERR2001"]), `codes ${codes}`);
  return { observed: codes };
});

await check("P09", "cus-interactive-c04", "create duplicate of fixture 1001 (UPPER(name)+phone, dup > 0) -> ERR2000; different phone passes the duplicate rule", async () => {
  const dup = await http("POST", "/api/customers", { body: { custnm: "ARCAD software", cuphone: "0450578396", cucoun: "FR" } });
  expect(dup.status === 400 && dup.json.errors.some((e) => e.code === "ERR2000"), `dup ${dup.status} ${dup.text}`);
  const ok = await http("POST", "/api/customers", { body: { custnm: "Arcad Software", cuphone: "0450578397", cucoun: "FR" } });
  expect(ok.status === 201, `same name other phone ${ok.status} ${ok.text}`);
  created.third = ok.json.cuid;
  return { observed: { dupCodes: dup.json.errors.map((e) => e.code), otherPhone: ok.status } };
});

await check("P10", "CR-5", "over-long name -> 400 FIELD_TOO_LONG; non-numeric credit limit -> 400 FIELD_INVALID (modern boundary, no 5250 field lengths)", async () => {
  const a = await http("POST", "/api/customers", { body: { custnm: "X".repeat(31), cuphone: "0999000333", cucoun: "GB" } });
  expect(a.status === 400 && a.json.errors.some((e) => e.code === "FIELD_TOO_LONG" && e.field === "custnm"), `long ${a.status} ${a.text}`);
  const b = await http("POST", "/api/customers", { body: { custnm: "Credit Probe", cuphone: "0999000334", cucoun: "GB", culimcre: "abc" } });
  expect(b.status === 400 && b.json.errors.some((e) => e.code === "FIELD_INVALID" && e.field === "culimcre"), `credit ${b.status} ${b.text}`);
  return { observed: { long: a.json.errors.map((e) => e.code), credit: b.json.errors.map((e) => e.code) } };
});

// c03 / c08 — update
await check("P11", "cus-interactive-c03/c08", "PUT changes typed fields; CUMOD refreshed; CUMODID, CUCREA, CUDEL, CUCREDIT, CULASTORD unchanged even with another X-User-Id (c08 as-is)", async () => {
  await new Promise((res) => setTimeout(res, 20));
  const r = await http("PUT", `/api/customers/${created.cuid}`, {
    headers: { "x-user-id": "SOMEONE" },
    body: { custnm: "Verify Probe One", cuphone: "0999000111", cucoun: "GB", cucity: "York", culimcre: 2000 },
  });
  expect(r.status === 200, `status ${r.status} ${r.text}`);
  expect(sameKeys(r.json, DETAIL_KEYS), `detail keys ${keysOf(r.json)}`);
  expect(r.json.cucity === "York" && r.json.culimcre === 2000, "typed fields");
  expect(r.json.cumodid === created.detail.cumodid, `cumodid changed ${r.json.cumodid}`);
  expect(r.json.cucrea === created.detail.cucrea && r.json.cudel === " " && r.json.cucredit === 0 && r.json.culastord === 0, "preserved fields");
  expect(r.json.cumod !== created.detail.cumod, "cumod not refreshed");
  return { observed: { cumodid: r.json.cumodid, cumodBefore: created.detail.cumod, cumodAfter: r.json.cumod } };
});

await check("P12", "cus-interactive-c04", "UPD duplicate rule dup > 1: changing a customer to collide with exactly one other passes (as-is, needs-SME); the next CRT of that pair is then refused", async () => {
  const r = await http("PUT", `/api/customers/${created.second}`, { body: { custnm: "Baker Street Books", cuphone: "02072243000", cucoun: "GB" } });
  expect(r.status === 200, `collide-with-one status ${r.status} ${r.text}`);
  const again = await http("PUT", `/api/customers/${created.third}`, { body: { custnm: "Baker Street Books", cuphone: "02072243000", cucoun: "GB" } });
  expect(again.status === 400 && again.json.errors.some((e) => e.code === "ERR2000"), `collide-with-two ${again.status}`);
  const crt = await http("POST", "/api/customers", { body: { custnm: "baker street BOOKS", cuphone: "02072243000", cucoun: "GB" } });
  expect(crt.status === 400 && crt.json.errors.some((e) => e.code === "ERR2000"), `crt ${crt.status}`);
  return { observed: { collideWithOne: r.status, collideWithTwo: again.status, crt: crt.status }, note: "legacy quirk preserved, not fixed" };
});

await check("P13", "CR-4", "PUT unknown id -> 404 ERR0103 'Code 99999 Unknown.'", async () => {
  const r = await http("PUT", "/api/customers/99999", { body: { custnm: "Nobody", cuphone: "0999", cucoun: "GB" } });
  expect(r.status === 404 && r.json?.code === "ERR0103" && r.json.message === "Code 99999 Unknown." && r.json.cuid === 99999, `${r.status} ${r.text}`);
  return { observed: r.json };
});

await check("P14", "cus-interactive-c03", "PUT runs the same validation as create -> 400 VALIDATION", async () => {
  const r = await http("PUT", `/api/customers/${created.cuid}`, { body: { custnm: "", cuphone: "abc", cucoun: "ZZ" } });
  expect(r.status === 400 && r.json.code === "VALIDATION", `${r.status} ${r.text}`);
  return { observed: r.json.errors.map((e) => e.code).sort() };
});

// c09 / c10 / c07 / c11 — inquiry
await check("P15", "cus-interactive-c09/c10/c07", "GET 1001 -> 200; countryName France; culastord 20240315; lastOrderDate 2024-03-15", async () => {
  const r = await http("GET", "/api/customers/1001");
  expect(r.status === 200 && sameKeys(r.json, DETAIL_KEYS), `${r.status} keys ${keysOf(r.json ?? {})}`);
  expect(r.json.countryName === "France" && r.json.culastord === 20240315 && r.json.lastOrderDate === "2024-03-15", JSON.stringify(r.json));
  return { observed: { countryName: r.json.countryName, culastord: r.json.culastord, lastOrderDate: r.json.lastOrderDate } };
});

await check("P16", "cus-interactive-c07", "GET 1002 -> culastord 0 presents lastOrderDate null (1940-01-01 blank sentinel)", async () => {
  const r = await http("GET", "/api/customers/1002");
  expect(r.status === 200 && r.json.culastord === 0 && r.json.lastOrderDate === null, r.text);
  return { observed: { culastord: r.json.culastord, lastOrderDate: r.json.lastOrderDate } };
});

await check("P17", "CR-6", "invalid stored CULASTORD (20231301) -> lastOrderDate null, raw kept (legacy raised an RPG exception)", async () => {
  await pool.query("UPDATE customer SET culastord = 20231301 WHERE cuid = 1003");
  const r = await http("GET", "/api/customers/1003");
  expect(r.status === 200 && r.json.culastord === 20231301 && r.json.lastOrderDate === null, r.text);
  return { observed: { culastord: r.json.culastord, lastOrderDate: r.json.lastOrderDate } };
});

await check("P18", "cus-interactive-c10", "unknown country code on a stored row -> countryName blank, no error", async () => {
  await pool.query("UPDATE customer SET cucoun = 'ZZ' WHERE cuid = 1004");
  const r = await http("GET", "/api/customers/1004");
  expect(r.status === 200 && r.json.cucoun === "ZZ" && r.json.countryName === "", r.text);
  return { observed: { cucoun: r.json.cucoun, countryName: r.json.countryName } };
});

await check("P19", "cus-interactive-c11", "GET soft-deleted 1005 -> 200 with cudel X (existence only, no CUDEL test)", async () => {
  const r = await http("GET", "/api/customers/1005");
  expect(r.status === 200 && r.json.cudel === "X", r.text);
  return { observed: { cuid: r.json.cuid, cudel: r.json.cudel } };
});

await check("P20", "cus-interactive-c09", "GET 77 -> 404 'Code 77 Unknown.'; GET 0 -> 'Code  Unknown.' (zero-suppressed)", async () => {
  const a = await http("GET", "/api/customers/77");
  expect(a.status === 404 && a.json.code === "ERR0103" && a.json.message === "Code 77 Unknown." && a.json.cuid === 77, a.text);
  const b = await http("GET", "/api/customers/0");
  expect(b.status === 404 && b.json.message === "Code  Unknown." && b.json.cuid === 0, b.text);
  return { observed: { m77: a.json.message, m0: b.json.message } };
});

await check("P21", "OpenAPI /api/customers/{cuid}", "path segments outside 5P 0 (six digits, letters) -> 404 ERR0103 (observed wording recorded)", async () => {
  const a = await http("GET", "/api/customers/100000");
  const b = await http("GET", "/api/customers/abc");
  expect(a.status === 404 && a.json?.code === "ERR0103", `100000 -> ${a.status} ${a.text}`);
  expect(b.status === 404 && b.json?.code === "ERR0103", `abc -> ${b.status} ${b.text}`);
  return { observed: { six: a.json, letters: b.json }, note: "contract declares min 0 / max 99999; the server answers 404 not 400 (gap G-3)" };
});

// c06 / c11 — absent routes
await check("P22", "cus-interactive-c11", "DELETE /api/customers/1001 -> 404 (no route); row still readable; CUDEL never written", async () => {
  const d = await http("DELETE", "/api/customers/1001");
  expect(d.status === 404, `delete ${d.status}`);
  const g = await http("GET", "/api/customers/1001");
  expect(g.status === 200 && g.json.cudel === " ", g.text);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM customer WHERE cudel = 'X'");
  expect(rows[0].n === 1, `deleted rows ${rows[0].n} (fixture 1005 only)`);
  return { observed: { deleteStatus: d.status, stillReadable: g.status, deletedRows: rows[0].n } };
});

await check("P23", "cus-interactive-c06", "no orders route in this pack (ORD stay_legacy, interop none)", async () => {
  const a = await http("GET", "/api/customers/1001/orders");
  const b = await http("GET", "/api/orders?cuid=1001");
  expect(a.status === 404 && b.status === 404, `${a.status} ${b.status}`);
  return { observed: { perCustomer: a.status, orders: b.status } };
});

// cus-modules c06 / c09 / c11 — selector
await check("P24", "cus-modules-c06/c11", "GET /api/customers/search blank -> every customer incl. soft-deleted; SltCustomerRow keys; ordered by name", async () => {
  const r = await http("GET", "/api/customers/search");
  expect(r.status === 200 && sameKeys(r.json, ["more", "nextOffset", "rows"]), `${r.status} ${keysOf(r.json ?? {})}`);
  for (const row of r.json.rows) expect(sameKeys(row, SLT_ROW_KEYS), `row keys ${keysOf(row)}`);
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM customer");
  expect(r.json.rows.length === Math.min(14, rows[0].n), `rows ${r.json.rows.length} vs table ${rows[0].n}`);
  expect(r.json.rows.some((x) => x.cuid === 1005), "soft-deleted 1005 listed");
  const names = r.json.rows.map((x) => x.custnm);
  expect(JSON.stringify(names) === JSON.stringify([...names].sort()), `order ${names}`);
  return { observed: { rows: r.json.rows.length, table: rows[0].n, more: r.json.more, nextOffset: r.json.nextOffset } };
});

await check("P25", "cus-modules-c06", "contains-match, case-insensitive: name=rossi -> Casa Rossi; city=roma -> 1 row; name+city both applied", async () => {
  const a = await http("GET", "/api/customers/search?name=rossi");
  expect(a.status === 200 && a.json.rows.length === 1 && a.json.rows[0].custnm === "Casa Rossi", a.text);
  const b = await http("GET", "/api/customers/search?city=roma");
  expect(b.status === 200 && b.json.rows.length === 1 && b.json.rows[0].cuid === 1003, b.text);
  const c = await http("GET", "/api/customers/search?name=rossi&city=london");
  expect(c.status === 200 && c.json.rows.length === 0, c.text);
  return { observed: { name: a.json.rows.length, city: b.json.rows.length, both: c.json.rows.length } };
});

await check("P26", "cus-modules-c09 / CR-7", "quote in criteria is literal text (bound parameters, no SQL failure); % stays a LIKE wildcard (as-is)", async () => {
  const q = await http("GET", "/api/customers/search?name=" + encodeURIComponent("o'r"));
  expect(q.status === 200 && q.json.rows.length === 0, `quote ${q.status} ${q.text}`);
  const w = await http("GET", "/api/customers/search?name=" + encodeURIComponent("c%r"));
  expect(w.status === 200 && w.json.rows.some((x) => x.custnm === "Casa Rossi"), `wildcard ${w.status} ${w.text}`);
  return { observed: { quoteRows: q.json.rows.length, wildcardRows: w.json.rows.length } };
});

await check("P27", "cus-modules-c06", "offset must be a non-negative integer -> 400 BAD_REQUEST otherwise", async () => {
  const a = await http("GET", "/api/customers/search?offset=-1");
  const b = await http("GET", "/api/customers/search?offset=x");
  expect(a.status === 400 && a.json.code === "BAD_REQUEST" && b.status === 400, `${a.status} ${b.status}`);
  return { observed: { negative: a.status, nonNumeric: b.status } };
});

await check("P28", "cus-modules-c06", "14 per page with look-ahead: seed 20 rows -> page 1 has 14 + more, page 2 has the rest + Bottom", async () => {
  for (let i = 0; i < 20; i++) {
    await pool.query(
      `INSERT INTO customer (cuid, custnm, cuphone, cucity, cucoun, culimcre, culastord, cucrea, cumod, cumodid, cudel)
       VALUES ($1, $2, $3, 'Paging', 'GB', 0, 0, CURRENT_DATE, LOCALTIMESTAMP, 'PROBE', ' ')`,
      [1100 + i, `Paging ${String(i).padStart(2, "0")}`, `0777${String(i).padStart(6, "0")}`],
    );
  }
  const p1 = await http("GET", "/api/customers/search?city=paging");
  expect(p1.status === 200 && p1.json.rows.length === 14 && p1.json.more === true && p1.json.nextOffset === 14, JSON.stringify({ n: p1.json.rows.length, more: p1.json.more, next: p1.json.nextOffset }));
  const p2 = await http("GET", `/api/customers/search?city=paging&offset=${p1.json.nextOffset}`);
  expect(p2.status === 200 && p2.json.rows.length === 6 && p2.json.more === false && p2.json.nextOffset === null, JSON.stringify({ n: p2.json.rows.length, more: p2.json.more, next: p2.json.nextOffset }));
  const l1 = await http("GET", "/api/customers?positionTo=Paging");
  expect(l1.status === 200 && l1.json.rows.length === 14 && l1.json.more === true && l1.json.next?.cursorName === "Paging 14", `list page 1 ${JSON.stringify(l1.json.next)} more=${l1.json.more}`);
  const l2 = await http("GET", `/api/customers?cursorName=${encodeURIComponent(l1.json.next.cursorName)}&cursorId=${l1.json.next.cursorId}`);
  expect(l2.status === 200 && l2.json.rows[0].custnm === "Paging 14", `list page 2 resumes at ${l2.json.rows[0]?.custnm}`);
  return { observed: { selector: [p1.json.rows.length, p2.json.rows.length], listNext: l1.json.next, listPage2First: l2.json.rows[0].custnm } };
});

// web surface smoke (DSPF -> web mapping; the JSON API is the contract, web is checked to be alive only)
await check("P29", "DSPF->web", "web pages answer 200 text/html: /customers, /customers/new, /customers/1001, /customers/inquiry, /customers/select", async () => {
  const out = {};
  for (const p of ["/customers", "/customers/new", "/customers/1001", "/customers/1001/edit", "/customers/inquiry", "/customers/select"]) {
    const r = await http("GET", p);
    out[p] = r.status;
    expect(r.status === 200 && r.type.includes("text/html"), `${p} -> ${r.status} ${r.type}`);
  }
  return { observed: out };
});

await check("P30", "cus-interactive-c06", "web list shows option 5 (orders) as a non-link muted marker citing c06; no link into ORD", async () => {
  const r = await http("GET", "/customers");
  expect(r.status === 200, `status ${r.status}`);
  expect(!/href="[^"]*ord/i.test(r.text), "found a link into ORD");
  const markers = r.text.match(/<span class="muted" title="ORD200 stays legacy[^"]*cus-interactive-c06[^"]*">5=Orders<\/span>/g) ?? [];
  const rows = (r.text.match(/2=Edit/g) ?? []).length;
  expect(markers.length === rows && rows > 0, `${markers.length} disabled markers for ${rows} rows`);
  return { observed: { rows, disabledOption5: markers.length, ordLinks: 0 } };
});

await pool.end();

const summary = {
  run_id: "2026-09-08-r1",
  pack: "atu-merlin-ts-cus-v1@1",
  mode: "COMPARE (TypeScript HTTP boundary only)",
  characterization: "WAIVED_PATHFINDER",
  oracle: "Discovery cards + modern/openapi/customer.yaml — not IBM i goldens",
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
