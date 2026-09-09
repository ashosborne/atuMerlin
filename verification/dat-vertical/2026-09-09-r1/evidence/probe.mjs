#!/usr/bin/env node
// Independent COMPARE probe at the TypeScript boundary — pack atu-merlin-ts-dat-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/dat-utils/features, c01 validation rules) + modern/README.md
// (DAT section). NOT IBM i goldens: nothing here is a claim of parity against the box.
//
// The oracle below is written from the cards, not copied from the module or its vitest suite: the
// calendar check goes through the JS Date engine (proleptic Gregorian, same calendar as RPG *ISO
// and PostgreSQL make_date) with setUTCFullYear so years 0001-0099 are read literally.
//
//   cd modern && ./scripts/local-pg.sh start
//   DATABASE_URL=$(./scripts/local-pg.sh url) npx tsx ../verification/dat-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Needs a live DATABASE_URL (the SQL twins are probed in a
// throw-away schema created from modern/db/schema.sql and dropped at the end).

import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import {
  DatArgumentError,
  ISO_NUM_HIVAL,
  ISO_NUM_NONE,
  LEGACY_HIVAL_DATE,
  LEGACY_LOVAL_DATE,
  fromLegacyIsoNum,
  fromLegacySentinelDate,
  isoNumToDate,
  isoToDate40,
  testIsoNum,
  toLegacyIsoNum,
  toLegacySentinelDate,
} from "../../../../modern/src/shared/dat/index.ts";
import { lastOrderDateOf } from "../../../../modern/src/features/customer/customer.service.ts";

const here = dirname(fileURLToPath(import.meta.url));
const modernRoot = join(here, "../../../../modern");
const pg = createRequire(join(modernRoot, "package.json"))("pg");
const results = [];

function record(id, card, name, pass, detail) {
  results.push({ id, card, name, pass: Boolean(pass), detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${name}${pass ? "" : "  <-- " + JSON.stringify(detail)}`);
}

// --- Oracle from the cards -------------------------------------------------------------------

/** c01 "Validation rules found in code": test(de) *iso on eight zero-padded digits yyyymmdd. */
function oracleTestIso(n) {
  if (n < 0) return null;
  const s = String(n).padStart(8, "0");
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(0);
  dt.setUTCFullYear(y, m - 1, d);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
/** c01: DAT002 — 0 -> *LOVAL, 99999999 -> *HIVAL (exact equality), else test(de). */
function oracleDat002(n) {
  if (n === 0) return "1940-01-01";
  if (n === 99999999) return "2039-12-31";
  return oracleTestIso(n);
}
/** c02: DAT001 — test(de) only. */
const oracleDat001 = oracleTestIso;

/** Sweep: every mm/dd 00..99 for a set of years that exercise the calendar rules (130 000 values). */
const YEARS = [0, 1, 99, 100, 400, 1900, 1940, 1999, 2000, 2024, 2039, 2100, 9999];
const SWEEP = [];
for (const y of YEARS) for (let md = 0; md < 10000; md++) SWEEP.push(y * 10000 + md);

/** Random sample over the whole DECIMAL(8,0) range, negatives included (fixed seed for a stable file). */
function sampleDecimal8(count) {
  const out = [];
  const buf = randomBytes(count * 4);
  for (let i = 0; i < count; i++) {
    const u = buf.readUInt32BE(i * 4);
    out.push((u % (2 * ISO_NUM_HIVAL + 1)) - ISO_NUM_HIVAL);
  }
  return out;
}
const RANDOM = sampleDecimal8(200000);

function compareAll(fn, oracle, values) {
  let mismatches = [];
  let threw = 0;
  for (const n of values) {
    let got;
    try {
      got = fn(n);
    } catch (e) {
      threw++;
      mismatches.push({ n, got: `threw ${e?.name}`, want: oracle(n) });
      continue;
    }
    const want = oracle(n);
    if (got !== want) mismatches.push({ n, got, want });
  }
  return { checked: values.length, mismatches: mismatches.length, threw, sample: mismatches.slice(0, 10) };
}

// --- c01 ISOTODATE40 / DAT002 ------------------------------------------------------------------

{
  const sentinels = {
    zero: isoToDate40(0),
    negZero: isoToDate40(-0),
    hival: isoToDate40(99999999),
    hivalMinusOne: isoToDate40(99999998),
    one: isoToDate40(1),
    minHival: isoToDate40(-99999999),
  };
  record("P01", "c01", "DAT002 sentinels by exact equality: 0 -> 1940-01-01, 99999999 -> 2039-12-31, 99999998 / 1 / -99999999 -> null",
    sentinels.zero === "1940-01-01" && sentinels.negZero === "1940-01-01" && sentinels.hival === "2039-12-31" &&
    sentinels.hivalMinusOne === null && sentinels.one === null && sentinels.minHival === null &&
    LEGACY_LOVAL_DATE === "1940-01-01" && LEGACY_HIVAL_DATE === "2039-12-31" && ISO_NUM_HIVAL === 99999999 && ISO_NUM_NONE === 0,
    sentinels);

  const r = compareAll(isoToDate40, oracleDat002, SWEEP);
  record("P02", "c01", `isoToDate40 == DAT002 oracle on the calendar sweep (${r.checked} values, years ${YEARS.join("/")})`, r.mismatches === 0 && r.threw === 0, r);

  const r2 = compareAll(isoToDate40, oracleDat002, RANDOM);
  record("P03", "c01", `isoToDate40 == DAT002 oracle on ${r2.checked} random DECIMAL(8,0) values (negatives included)`, r2.mismatches === 0 && r2.threw === 0, r2);

  const leap = { y1900: isoToDate40(19000229), y2000: isoToDate40(20000229), y2100: isoToDate40(21000229), y2024: isoToDate40(20240229), y2023: isoToDate40(20230229) };
  record("P04", "c01", "leap-year rule: 1900 / 2100 not leap, 2000 / 2024 leap, 2023 not", leap.y1900 === null && leap.y2100 === null && leap.y2000 === "2000-02-29" && leap.y2024 === "2024-02-29" && leap.y2023 === null, leap);

  const window = { min: isoToDate40(10101), max: isoToDate40(99991231), year0: isoToDate40(101), y99: isoToDate40(991231) };
  record("P05", "c01", "no business window: 00010101 and 99991231 convert; year 0000 is null; 0099-12-31 converts", window.min === "0001-01-01" && window.max === "9999-12-31" && window.year0 === null && window.y99 === "0099-12-31", window);
}

// --- c02 ISO_Num_To_Date / DAT001 --------------------------------------------------------------

{
  const r = compareAll(isoNumToDate, oracleDat001, SWEEP);
  record("P06", "c02", `isoNumToDate == DAT001 oracle on the calendar sweep (${r.checked} values)`, r.mismatches === 0 && r.threw === 0, r);
  const r2 = compareAll(isoNumToDate, oracleDat001, RANDOM);
  record("P07", "c02", `isoNumToDate == DAT001 oracle on ${r2.checked} random values`, r2.mismatches === 0 && r2.threw === 0, r2);

  const differ = [];
  for (const n of new Set([...SWEEP, 99999999, 99999998, -1])) if (isoNumToDate(n) !== isoToDate40(n)) differ.push(n);
  record("P08", "c02", "DAT001 and DAT002 differ on exactly the two sentinel inputs (0, 99999999) across the sweep", differ.length === 2 && differ.includes(0) && differ.includes(99999999), { differ });
}

// --- c04 / c06 / c08 interface contract, statelessness, absent-not-stale -----------------------

{
  const nulls = { d001: isoNumToDate(null), d002: isoToDate40(null), lockIn: fromLegacyIsoNum(null), sentIn: fromLegacySentinelDate(null) };
  record("P09", "c04", "RETURNS NULL ON NULL INPUT: null in -> null out for isoNumToDate, isoToDate40, fromLegacyIsoNum, fromLegacySentinelDate", Object.values(nulls).every((v) => v === null), nulls);

  // c06: shuffled order and repetition must not change any value (no state kept between rows).
  const probe = SWEEP.filter((_, i) => i % 97 === 0);
  const first = probe.map((n) => [isoToDate40(n), isoNumToDate(n)]);
  const shuffled = [...probe].sort(() => (randomBytes(1)[0] & 1) ? 1 : -1);
  const byN = new Map(shuffled.map((n) => [n, [isoToDate40(n), isoNumToDate(n)]]));
  const second = probe.map((n) => byN.get(n));
  const again = probe.map((n) => [isoToDate40(n), isoNumToDate(n)]);
  record("P10", "c06", `stateless: ${probe.length} values evaluated in order, shuffled, and again give identical results`,
    JSON.stringify(first) === JSON.stringify(second) && JSON.stringify(first) === JSON.stringify(again), { probed: probe.length });

  // c08: an invalid argument right after a valid one is null, never the previous value.
  let stale = 0;
  for (let i = 0; i < 5000; i++) {
    if (isoToDate40(20240315) !== "2024-03-15") stale++;
    if (isoToDate40(20240230) !== null) stale++;
    if (isoNumToDate(20240315) !== "2024-03-15") stale++;
    if (isoNumToDate(0) !== null) stale++;
    if (testIsoNum(20241301) !== null) stale++;
  }
  record("P11", "c08", "absent, never stale: 5000 valid/invalid alternations, every invalid result is null", stale === 0, { stale });
}

// --- c05 error path --------------------------------------------------------------------------

{
  const bad = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 20240315.5, 100000000, -100000000, 1e12];
  const outcomes = [];
  for (const fn of [isoNumToDate, isoToDate40, fromLegacyIsoNum, testIsoNum]) {
    for (const b of bad) {
      try {
        outcomes.push({ fn: fn.name, b: String(b), threw: false, got: fn(b) });
      } catch (e) {
        outcomes.push({ fn: fn.name, b: String(b), threw: true, isDat: e instanceof DatArgumentError, sqlstate: e?.sqlstate, name: e?.name, msgLen: e?.message?.length, dat8Same: Object.is(e?.dat8, b) });
      }
    }
  }
  const allGood = outcomes.every((o) => o.threw && o.isDat && o.sqlstate === "38I02" && o.name === "DatArgumentError" && o.msgLen <= 70 && o.dat8Same);
  record("P12", "c05", `non-DECIMAL(8,0) argument -> DatArgumentError { sqlstate 38I02, message <= 70 chars } from all four entry points (${outcomes.length} cases)`, allGood, { failing: outcomes.filter((o) => !(o.threw && o.isDat && o.sqlstate === "38I02" && o.msgLen <= 70 && o.dat8Same)) });

  // Every in-range integer must be a value or null — never an exception (invalid date is NOT *PSSR).
  let threw = 0;
  for (const n of [...SWEEP, ...RANDOM, -99999999, 99999999]) {
    try { isoToDate40(n); isoNumToDate(n); } catch { threw++; }
  }
  record("P13", "c05", `an invalid date is a null, not an error: 0 exceptions across ${SWEEP.length + RANDOM.length + 2} in-range values`, threw === 0, { threw });

  let longMsg;
  try { toLegacyIsoNum("x".repeat(300)); } catch (e) { longMsg = e; }
  record("P14", "c05", "message text cut to the 70-char VARYING parameter on the boundary-out error", longMsg instanceof DatArgumentError && longMsg.message.length === 70 && longMsg.sqlstate === "38I02", { len: longMsg?.message?.length });
}

// --- Date lock (pack mapping rule; MUST match ORD) -----------------------------------------------

{
  const r = compareAll(fromLegacyIsoNum, oracleDat001, SWEEP);
  record("P15", "lock", "fromLegacyIsoNum == DAT001 semantics on the sweep (0 -> null; no 2039 sentinel inside the boundary)", r.mismatches === 0 && fromLegacyIsoNum(0) === null && fromLegacyIsoNum(99999999) === null, r);

  let rt = 0, valid = 0, bad = [];
  for (const n of SWEEP) {
    const iso = fromLegacyIsoNum(n);
    if (iso === null) continue;
    valid++;
    if (toLegacyIsoNum(iso) !== n) { rt++; bad.push({ n, iso }); }
  }
  record("P16", "lock", `toLegacyIsoNum round-trips every valid sweep value (${valid} dates) and null -> 0`, rt === 0 && toLegacyIsoNum(null) === 0 && valid > 0, { valid, failed: bad.slice(0, 5) });

  const rejects = ["2024-02-30", "20240315", "2024-3-15", "", "2024-13-01", "0000-01-01", "1940-1-1", "2024-03-15T00:00:00Z", "abcd-ef-gh"];
  const notRejected = rejects.filter((s) => { try { toLegacyIsoNum(s); return true; } catch (e) { return !(e instanceof DatArgumentError); } });
  record("P17", "lock", "toLegacyIsoNum rejects malformed / impossible ISO strings with DatArgumentError", notRejected.length === 0 && toLegacyIsoNum("1940-01-01") === 19400101 && toLegacyIsoNum("0001-01-01") === 10101, { notRejected });

  const sent = { lovalIn: fromLegacySentinelDate("1940-01-01"), hivalIn: fromLegacySentinelDate("2039-12-31"), plain: fromLegacySentinelDate("2024-03-15"), nullOut: toLegacySentinelDate(null), plainOut: toLegacySentinelDate("2024-03-15") };
  record("P18", "c07", "sentinel shape: 1940-01-01 -> null in, null -> 1940-01-01 out; 2039-12-31 NOT mapped (c01 known_risk kept)", sent.lovalIn === null && sent.hivalIn === "2039-12-31" && sent.plain === "2024-03-15" && sent.nullOut === "1940-01-01" && sent.plainOut === "2024-03-15", sent);

  // c07 composition claim from README / CONVERT_RECORD: isoToDate40(n) === toLegacySentinelDate(fromLegacyIsoNum(n)).
  // From the cards it can only hold on {0} U valid dates: DAT002 answers NULL for an invalid number and
  // 2039-12-31 for 99999999, while the lock folds both into "never" (null -> 1940-01-01 on the way out).
  // This probe asserts the identity on exactly that domain and counts where it fails (G-D1: README over-claims).
  const holds = [];
  const breaks = [];
  let hivalShape = null;
  for (const n of new Set([...SWEEP, 99999998, -1])) {
    const dat002 = isoToDate40(n);
    const composed = toLegacySentinelDate(fromLegacyIsoNum(n));
    const valid = oracleTestIso(n) !== null;
    if (dat002 === composed) holds.push(n); else breaks.push({ n, dat002, composed, valid });
    if (n === 99999999) hivalShape = { dat002, composed };
  }
  const holdsOnlyWhereExpected = holds.every((n) => n === 0 || oracleTestIso(n) !== null);
  const breaksOnlyOnInvalid = breaks.every((b) => !b.valid && b.n !== 0 && b.dat002 === (b.n === 99999999 ? "2039-12-31" : null) && b.composed === "1940-01-01");
  record("P19", "c07", `one sentinel rule: isoToDate40(n) === toLegacySentinelDate(fromLegacyIsoNum(n)) holds on exactly {0} U valid dates (${holds.length} values); for every invalid n (${breaks.length} values incl. 99999999) DAT002 gives NULL / 2039-12-31 and the composition gives 1940-01-01 — the README states the identity unqualified (G-D1)`,
    holdsOnlyWhereExpected && breaksOnlyOnInvalid && breaks.length > 0 && hivalShape?.dat002 === "2039-12-31" && hivalShape?.composed === "1940-01-01",
    { holds: holds.length, breaks: breaks.length, hival: hivalShape, sample: breaks.slice(0, 3) });

  // The presentation value must never survive a boundary-in: strip then store gives null / 0.
  record("P20", "lock", "DAT002 presentation value for 0 does not leak into storage: fromLegacySentinelDate(isoToDate40(0)) is null and stores as 0",
    fromLegacySentinelDate(isoToDate40(0)) === null && toLegacyIsoNum(fromLegacySentinelDate(isoToDate40(0))) === 0, {});
}

// --- CUS alignment (read-only; CR-D3) ------------------------------------------------------------

{
  const diffs = [];
  for (const n of SWEEP) {
    if (n < 0) continue;
    const a = fromLegacyIsoNum(n);
    const b = lastOrderDateOf(n);
    if (a !== b) diffs.push({ n, dat: a, cus: b });
  }
  const years = new Set(diffs.map((d) => Math.floor(d.n / 10000)));
  const onlyLowYears = [...years].every((y) => y >= 1 && y <= 99);
  const allCusNull = diffs.every((d) => d.cus === null && d.dat !== null);
  record("P21", "CR-D3", `CUS lastOrderDateOf agrees with the DAT lock on the sweep except years 0001-0099, where CUS gives null and DAT a date (${diffs.length} values, years ${[...years].join(",")})`,
    diffs.length > 0 && onlyLowYears && allCusNull, { diffs: diffs.length, years: [...years], sample: diffs.slice(0, 3) });
}

// --- Schema / ORD lock shape (static) -----------------------------------------------------------

{
  const schema = readFileSync(join(modernRoot, "db/schema.sql"), "utf8");
  const datStart = schema.indexOf("atuMerlin DAT utilities");
  const datSection = schema.slice(datStart);
  const ord701 = /to_char\((NEW\.)?ordate, 'YYYYMMDD'\)::integer/.test(schema);
  const noTable = !/CREATE\s+TABLE/i.test(datSection);
  const noSentinelLiteralInCode = !/'1940-01-01'|'2039-12-31'|19400101|20391231/.test(datSection.replace(/--[^\n]*/g, ""));
  const noLegacyNames = !/CREATE (OR REPLACE )?FUNCTION\s+(isotodate40|iso_num_to_date)/i.test(schema);
  const orderDatesAreDate = /ordatdel\s+date/i.test(schema) && /ordatclo\s+date/i.test(schema);
  record("P22", "lock", "schema: ORD701 keeps its inline to_char(ordate,'YYYYMMDD')::integer; ORD date columns are `date`; DAT section creates no table, no 1940/2039 literal in code, no legacy-named function",
    ord701 && noTable && noSentinelLiteralInCode && noLegacyNames && orderDatesAreDate && datStart > 0, { ord701, noTable, noSentinelLiteralInCode, noLegacyNames, orderDatesAreDate });
}

// --- SQL twins in a throw-away schema -----------------------------------------------------------

{
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  pool.on("error", () => {});
  const schemaName = `verify_dat_${randomBytes(4).toString("hex")}`;
  const c = await pool.connect();
  try {
    await c.query(`CREATE SCHEMA ${schemaName}`);
    await c.query(`SET search_path TO ${schemaName}`);
    const ddl = readFileSync(join(modernRoot, "db/schema.sql"), "utf8");
    await c.query(ddl);

    // P23: dat_iso_num_to_date == TS lock on the whole sweep (one round trip through unnest).
    const want = SWEEP.map((n) => fromLegacyIsoNum(n));
    const got = (await c.query("SELECT dat_iso_num_to_date(n)::text AS d FROM unnest($1::integer[]) AS n", [SWEEP])).rows.map((r) => r.d);
    let mism = [];
    for (let i = 0; i < SWEEP.length; i++) if (got[i] !== want[i]) mism.push({ n: SWEEP[i], sql: got[i], ts: want[i] });
    record("P23", "lock/SQL", `dat_iso_num_to_date agrees with fromLegacyIsoNum on the sweep (${SWEEP.length} values)`, mism.length === 0, { mismatches: mism.length, sample: mism.slice(0, 5) });

    const rnd = RANDOM.slice(0, 50000);
    const wantR = rnd.map((n) => fromLegacyIsoNum(n));
    const gotR = (await c.query("SELECT dat_iso_num_to_date(n)::text AS d FROM unnest($1::integer[]) AS n", [rnd])).rows.map((r) => r.d);
    let mismR = [];
    for (let i = 0; i < rnd.length; i++) if (gotR[i] !== wantR[i]) mismR.push({ n: rnd[i], sql: gotR[i], ts: wantR[i] });
    record("P24", "lock/SQL", `dat_iso_num_to_date agrees with fromLegacyIsoNum on ${rnd.length} random values incl. negatives`, mismR.length === 0, { mismatches: mismR.length, sample: mismR.slice(0, 5) });

    const nullIn = (await c.query("SELECT dat_iso_num_to_date(NULL::integer) AS a, dat_iso_num_to_date(0) AS b, dat_iso_num_to_date(99999999) AS c, dat_date_to_iso_num(NULL::date) AS d")).rows[0];
    record("P25", "lock/SQL", "SQL: NULL -> NULL, 0 -> NULL, 99999999 -> NULL (no 2039 sentinel in storage), NULL date -> 0", nullIn.a === null && nullIn.b === null && nullIn.c === null && Number(nullIn.d) === 0, nullIn);

    // P26: boundary out == ORD701's inline expression and round-trips.
    const validIso = SWEEP.map((n) => fromLegacyIsoNum(n)).filter((d) => d !== null);
    const outRows = (await c.query(
      "SELECT d::text AS d, dat_date_to_iso_num(d) AS n, to_char(d, 'YYYYMMDD')::integer AS ord701, dat_iso_num_to_date(dat_date_to_iso_num(d))::text AS back FROM unnest($1::date[]) AS d",
      [validIso],
    )).rows;
    const outBad = outRows.filter((r) => Number(r.n) !== Number(r.ord701) || r.back !== r.d || toLegacyIsoNum(r.d) !== Number(r.n));
    record("P26", "lock/SQL", `dat_date_to_iso_num == ORD701 inline to_char expression == toLegacyIsoNum, and round-trips, on ${outRows.length} dates`, outBad.length === 0 && outRows.length === validIso.length, { bad: outBad.slice(0, 5), n: outRows.length });

    // P27: declared attributes (c04 DETERMINISTIC / RETURNS NULL ON NULL INPUT).
    const attrs = (await c.query(
      `SELECT proname, provolatile, proisstrict, l.lanname FROM pg_proc p JOIN pg_language l ON l.oid = p.prolang
       WHERE pronamespace = $1::regnamespace AND proname IN ('dat_iso_num_to_date','dat_date_to_iso_num') ORDER BY proname`, [schemaName],
    )).rows;
    const okAttrs = JSON.stringify(attrs.map((a) => [a.proname, a.provolatile, a.proisstrict])) === JSON.stringify([["dat_date_to_iso_num", "i", false], ["dat_iso_num_to_date", "i", true]]);
    record("P27", "c04", "SQL twins are IMMUTABLE; dat_iso_num_to_date is STRICT (RETURNS NULL ON NULL INPUT), dat_date_to_iso_num is not (NULL must give 0)", okAttrs, attrs);

    // P28: no function with a legacy name exists in the schema (CR-D1 as documented).
    const legacy = (await c.query(`SELECT proname FROM pg_proc WHERE pronamespace = $1::regnamespace AND lower(proname) IN ('isotodate40','iso_num_to_date','isotodate','isotodate4')`, [schemaName])).rows;
    record("P28", "CR-D1", "no SQL function named ISOTODATE40 / ISO_Num_To_Date (legacy names not created; documented delta)", legacy.length === 0, legacy);

    // P29: nothing in the schema stores the presentation sentinel: no column default of 1940-01-01, and the
    // ORD date columns are nullable `date`.
    const cols = (await c.query(
      `SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns
       WHERE table_schema = $1 AND column_name IN ('ordate','ordatdel','ordatclo') ORDER BY table_name, column_name`, [schemaName],
    )).rows;
    const okCols = cols.length >= 3 && cols.every((r) => r.data_type === "date" && !/1940|2039/.test(r.column_default ?? "")) && cols.filter((r) => r.column_name !== "ordate").every((r) => r.is_nullable === "YES");
    record("P29", "lock", "ORD date columns are `date`, delivery / close nullable, no sentinel default (lock matches ORD: NULL for never)", okCols, cols);
  } finally {
    await c.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`).catch(() => {});
    c.release();
    await pool.end();
  }
}

// --- Summary --------------------------------------------------------------------------------------

const pass = results.filter((r) => r.pass).length;
const fail = results.length - pass;
const out = {
  pack: "atu-merlin-ts-dat-v1@1",
  characterization: "WAIVED_PATHFINDER",
  oracle: "discovery/dat-utils/features (c01 validation rules) + modern/README.md DAT section; NOT IBM i goldens",
  sweep: { years: YEARS, values: SWEEP.length, random: RANDOM.length },
  ran_at: new Date().toISOString(),
  summary: { pass, fail, total: results.length },
  cases: results,
};
writeFileSync(join(here, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
