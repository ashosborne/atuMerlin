#!/usr/bin/env node
// Independent COMPARE probe at the TypeScript boundary — pack atu-merlin-ts-cou-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/cou-maintain/features c07..c12, the FCOUNTRY half) + modern/README.md
// (COU section). NOT IBM i goldens: nothing here is a claim of parity against the box. COU200 (c01-c06, c13)
// is deferred and nothing of it is modelled or invented here.
//
// The oracles are written from the cards, not copied from the module or its vitest suite:
//  - c09 keyed read: every `country` row is fetched with a plain SELECT (no ORDER BY) and the COU301
//    `s01prp` / `S01lod` sequence (SETLL key -> read -> 20 rows -> one look-ahead read) is replayed in
//    JavaScript over a byte-order sort (Buffer.compare), then compared with `sltCountry` page by page.
//  - c10 / c11 selector: the S01chk row loop, the control-line checks in card order and the S01act
//    branch order (IN08 before OPTC1 = 8 before selection) are a small explicit state machine here;
//    the module's reducer is driven through the same entries and the outcomes are compared.
//  - c07 buffer rules are observed through a query-counting proxy on the pool, not inferred.
//
//   cd modern && ./scripts/local-pg.sh start
//   DATABASE_URL=$(./scripts/local-pg.sh url) npx tsx ../verification/cou-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Needs a live DATABASE_URL (the module is probed against a
// throw-away schema built and seeded by modern/test/helpers/db.ts and dropped at the end).

import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { randomBytes } from "node:crypto";
import * as fcountryModule from "../../../../modern/src/shared/fcountry/index.ts";
import { COUNTRY_FIXTURE } from "../../../../modern/src/db/seed.ts";
import { createTestDb } from "../../../../modern/test/helpers/db.ts";
import { buildApp } from "../../../../modern/src/app.ts";

const {
  createFCountry,
  normaliseCountryCode,
  normaliseCountryName,
  sltCountryOpen,
  sltCountryCheck,
  sltCountryAct,
  sltCountryRequest,
  SLT_LOAD_SIZE,
} = fcountryModule;

const here = dirname(fileURLToPath(import.meta.url));
const modernRoot = join(here, "../../../../modern");
const results = [];

function record(id, card, name, pass, detail) {
  results.push({ id, card, name, pass: Boolean(pass), detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${name}${pass ? "" : "  <-- " + JSON.stringify(detail).slice(0, 600)}`);
}

function randInt(min, max) {
  const span = max - min + 1;
  const n = randomBytes(6).readUIntBE(0, 6) % span;
  return min + n;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- Oracle 1: the 2A / 30A fixed-length parameter (c07 step "P_COID 2A value", c09 KEYCOD / KEYDES) ---
// An RPG by-value assignment into a fixed-length alpha field truncates on the right and pads with
// blanks; a keyed compare on that field therefore ignores trailing blanks. Written from the card, not
// from the module's normalise* helpers (which are compared against it in P05 / P16).
function fixedAlpha(value, len) {
  const v = (value ?? "").slice(0, len);
  return v.replace(/ +$/, "");
}

// --- Oracle 2: COU301 keyed read (c09 steps 2-3), replayed in JS over byte order (CR-C4) ------------
function byteCmp(a, b) {
  return Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}
/** Rows in COUNTRY (K COID, UNIQUE) or COUNTR1 (K COUNTR, not unique; code decides ties — CR-C4) order. */
function keyedOrder(allRows, order) {
  const rows = allRows.map((r) => ({ coid: r.coid, countr: r.countr }));
  rows.sort((x, y) =>
    order === "code" ? byteCmp(x.coid, y.coid) : byteCmp(x.countr, y.countr) || byteCmp(x.coid, y.coid),
  );
  return rows;
}
/**
 * s01prp: SETLL key; read (first row with key >= position). S01lod: write up to 20 rows, then one
 * look-ahead read decides More (row found) / Bottom (EOF). `offset` = rows already loaded (RRS01).
 */
function oraclePage(allRows, order, position, offset) {
  const key = order === "code" ? fixedAlpha(position, 2) : fixedAlpha(position, 30);
  const from = keyedOrder(allRows, order).filter((r) => byteCmp(order === "code" ? r.coid : r.countr, key) >= 0);
  const window = from.slice(offset, offset + SLT_LOAD_SIZE);
  const more = from.length > offset + SLT_LOAD_SIZE;
  return { rows: window, more, nextOffset: more ? offset + SLT_LOAD_SIZE : null };
}

// --- Oracle 3: COU301 S01chk + control line + S01act (c10 steps 1-3, c11 steps 1-5) -----------------
/**
 * Returns { kind, errors, firstErrorRrn, selected, optionsTyped, state } — the S01chk indicator set
 * in the order the card sets them (rows in RRN order, then 41, then 42), the S01key / S01act branch
 * taken, and the procedure-local state (bydesc, KEYCOD, KEYDES, dft) after the pass.
 */
function oracleAct(state, entry) {
  // S01key: F3 / F12 -> return dft (c09 step 5); Page Down is not an entry here.
  if (entry.cancel) return { kind: "return", coid: state.dft, state };

  // S01chk row loop (c11 step 2): SLT01 / STS01 / ERR01 latch.
  const errors = [];
  let slt01 = null;
  let sts01 = false;
  let err01 = null;
  for (const row of entry.rows ?? []) {
    if (row.opt === 0) continue;
    sts01 = true;
    if (row.opt !== 1) {
      errors.push({ indicator: 35, text: "INVALID OPTION", rrn: row.rrn });
      if (err01 === null) err01 = row.rrn;
    } else if (slt01 !== null) {
      errors.push({ indicator: 36, text: "ONLY ONE SELECTION", rrn: row.rrn });
      if (err01 === null) err01 = row.rrn;
    } else {
      slt01 = row.coid;
    }
  }
  // Control line (c11 step 3), in card order.
  const optc1 = entry.controlOption ?? 0;
  let dsp = errors.length > 0;
  if (optc1 !== 8 && optc1 !== 0) {
    errors.push({ indicator: 41, text: "Invalid option" });
    dsp = true;
  }
  if (slt01 !== null && optc1 !== 0) {
    errors.push({ indicator: 42, text: "Position to not available with selection pending" });
    dsp = true;
  }
  if (sts01 && entry.f8) dsp = true; // c10 step 2: F8 ignored while options typed
  const check = { errors, firstErrorRrn: err01, selected: slt01, optionsTyped: sts01 };
  if (dsp) return { kind: "redisplay", check, state };

  // S01act (c10 step 3, c11 steps 4-5): IN08 first, then OPTC1 = 8, then the selected row.
  if (entry.f8) {
    const order = state.order === "code" ? "name" : "code";
    const next = { ...state, order };
    if (order === "name") next.keydes = "";
    else next.keycod = "";
    return { kind: "reprepare", state: next };
  }
  if (optc1 === 8) {
    const next = { ...state };
    if (state.order === "code") next.keycod = fixedAlpha(entry.positionTo, 2);
    else next.keydes = fixedAlpha(entry.positionTo, 30);
    return { kind: "reprepare", state: next };
  }
  if (slt01 !== null) return { kind: "select", coid: slt01, state };
  return { kind: "none", state };
}
/** s01prp position for a state: the key of the current order (c09 step 2). */
function oracleRequest(state, offset = 0) {
  return { order: state.order, position: state.order === "code" ? state.keycod : state.keydes, offset };
}
/** Compare a module outcome with the oracle outcome (shape of the module's SltCountryOutcome). */
function outcomeMatches(mod, ora) {
  if (mod.kind !== ora.kind) return false;
  if (mod.kind === "return" || mod.kind === "select") return mod.coid === ora.coid;
  if (mod.kind === "redisplay") return same(mod.check, ora.check);
  if (mod.kind === "reprepare") return same(mod.state, ora.state);
  return true;
}

// --- EBCDIC CP037 order for [A-Za-z0-9 ] (used only to characterise CR-C4 in P25, never as a claim) ---
function ebcdicByte(ch) {
  if (ch === " ") return 0x40;
  const c = ch.charCodeAt(0);
  if (c >= 0x30 && c <= 0x39) return 0xf0 + (c - 0x30);
  const lower = ch.toLowerCase();
  const isUpper = ch !== lower;
  const i = lower.charCodeAt(0) - 0x61; // 0..25
  let b;
  if (i <= 8) b = 0x81 + i; // a-i
  else if (i <= 17) b = 0x91 + (i - 9); // j-r
  else b = 0xa2 + (i - 18); // s-z
  return isUpper ? b + 0x40 : b;
}
function ebcdicCmp(a, b) {
  return Buffer.compare(Buffer.from([...a].map(ebcdicByte)), Buffer.from([...b].map(ebcdicByte)));
}

// --- Setup ------------------------------------------------------------------------------------------

const t = await createTestDb();
let queryCount = 0;
const queryLog = [];
const countingDb = new Proxy(t.db, {
  get(target, prop, receiver) {
    if (prop === "query") {
      return (...args) => {
        queryCount++;
        queryLog.push(String(args[0]).replace(/\s+/g, " ").trim());
        return target.query(...args);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});
const f = createFCountry(countingDb);
const fixtureCodes = COUNTRY_FIXTURE.map((c) => c.coid);

async function allRows() {
  return (await t.db.query("SELECT coid, countr, coiso FROM country")).rows; // no ORDER BY: the oracle sorts
}
async function insertCountry(coid, countr, coiso = "") {
  await t.db.query("INSERT INTO country (coid, countr, coiso) VALUES ($1, $2, $3)", [coid, countr, coiso]);
}
async function clearExtraRows() {
  await t.db.query("DELETE FROM country WHERE coid <> ALL($1::varchar[])", [fixtureCodes]);
}
function twoCharCodes() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const out = [];
  for (const a of alphabet) for (const b of alphabet) out.push(a + b);
  return out;
}

try {
  // P01: c07 known codes — the three getters return the row's own fields (oracle: the raw row).
  {
    const rows = await allRows();
    const bad = [];
    for (const r of rows) {
      const got = { name: await f.getCountryName(r.coid), iso3: await f.getCountryIso3(r.coid), exist: await f.existCountry(r.coid) };
      if (!(got.name === r.countr && got.iso3 === r.coiso && got.exist === true)) bad.push({ r, got });
    }
    record("P01", "c07", `GetCountryName / GetCountryIso3 / ExistCountry return COUNTR / COISO / *on for every fixture row (${rows.length} codes)`, rows.length === COUNTRY_FIXTURE.length && bad.length === 0, { rows: rows.length, bad });
  }

  // P02: c07 unknown code -> cleared buffer: blanks / *off, no exception, for every AA..ZZ not in the table.
  {
    const known = new Set(fixtureCodes);
    const unknown = twoCharCodes().filter((c) => !known.has(c));
    const bad = [];
    const threw = [];
    for (const c of unknown) {
      try {
        const n = await f.getCountryName(c);
        const i = await f.getCountryIso3(c);
        const e = await f.existCountry(c);
        if (!(n === "" && i === "" && e === false)) bad.push({ c, n, i, e });
      } catch (err) {
        threw.push({ c, err: String(err.message ?? err) });
      }
    }
    record("P02", "c07", `unknown code -> name blank, ISO-3 blank, exists false, no exception: ${unknown.length} codes (AA..ZZ not in the table)`, bad.length === 0 && threw.length === 0, { codes: unknown.length, bad: bad.slice(0, 5), threw: threw.slice(0, 5) });
  }

  // P03: c07 blank code never reads — 0 SQL statements from all three getters with a blank-keyed row present.
  {
    await insertCountry("", "Nowhere", "NWH");
    queryCount = 0;
    const got = [];
    for (const blank of ["", " ", "  "]) got.push([await f.getCountryName(blank), await f.getCountryIso3(blank), await f.existCountry(blank)]);
    const statements = queryCount;
    const rowThere = (await t.db.query("SELECT countr FROM country WHERE coid = ''")).rows[0]?.countr;
    record("P03", "c07", "blank code never reads: 0 SQL statements for '', ' ', '  ' across the three getters while a blank-keyed row (Nowhere) is present; all return blanks / false", statements === 0 && rowThere === "Nowhere" && got.every(([n, i, e]) => n === "" && i === "" && e === false), { statements, got, rowThere });
    await clearExtraRows();
  }

  // P04: c07 exact 2-character match — no case folding, no leading-blank trim (oracle: byte-equal compare on the raw rows).
  {
    const rows = await allRows();
    const variants = [];
    for (const r of rows) variants.push(r.coid.toLowerCase(), r.coid[0].toLowerCase() + r.coid[1], " " + r.coid[0], r.coid[1] + r.coid[0]);
    const bad = [];
    for (const v of variants) {
      const want = rows.some((r) => r.coid === fixedAlpha(v, 2));
      const e = await f.existCountry(v);
      const n = await f.getCountryName(v);
      if (e !== want || (n !== "") !== want) bad.push({ v, e, n, want });
    }
    record("P04", "c07", `exact match: lower-case, mixed-case, leading-blank and swapped variants of every fixture code miss unless byte-equal (${variants.length} variants)`, bad.length === 0, { variants: variants.length, bad: bad.slice(0, 5) });
  }

  // P05: c07 / CR-C3 the 2A by-value contract — module == fixedAlpha(2) oracle on random strings, and through the table.
  {
    const chars = "ABCFRGZ ab1";
    const bad = [];
    for (let i = 0; i < 2000; i++) {
      const len = randInt(0, 5);
      let s = "";
      for (let k = 0; k < len; k++) s += chars[randInt(0, chars.length - 1)];
      if (normaliseCountryCode(s) !== fixedAlpha(s, 2)) bad.push({ s, got: normaliseCountryCode(s), want: fixedAlpha(s, 2) });
    }
    const through = {
      FRA: await f.existCountry("FRA"),
      "FR ": await f.getCountryName("FR "),
      F: await f.getCountryName("F"),
      "FRANCE": await f.getCountryIso3("FRANCE"),
      undefined: normaliseCountryCode(undefined),
    };
    record("P05", "c07 CR-C3", "2A by-value: normaliseCountryCode == fixed-length-alpha(2) oracle on 2000 random strings; through the table 'FRA' -> FR found, 'FR ' -> France, 'F' -> miss, 'FRANCE' -> FRA", bad.length === 0 && through.FRA === true && through["FR "] === "France" && through.F === "" && through.FRANCE === "FRA" && through.undefined === "", { bad: bad.slice(0, 5), through });
  }

  // P06: c07 / CR-C1 no last-key cache — observed: N non-blank calls issue N reads; a repeat of the same code reads again;
  // a changed row is seen at once; a miss followed by an insert is found (misses never stuck in legacy either).
  {
    queryCount = 0;
    queryLog.length = 0;
    await f.getCountryName("FR");
    await f.getCountryName("FR");
    await f.getCountryName("FR");
    await f.getCountryIso3("FR");
    await f.existCountry("FR");
    const repeatReads = queryCount;
    await t.db.query("UPDATE country SET countr = 'Belgique' WHERE coid = 'BE'");
    const before = await f.getCountryName("BE");
    await t.db.query("UPDATE country SET countr = 'Belgium' WHERE coid = 'BE'");
    const after = await f.getCountryName("BE");
    const missBefore = await f.existCountry("XX");
    await insertCountry("XX", "Xanadu", "XAN");
    const missAfter = await f.existCountry("XX");
    await clearExtraRows();
    const parameterised = queryLog.every((q) => /WHERE coid = \$1/.test(q) && !/\+|\|\|/.test(q));
    record("P06", "c07 CR-C1", "no last-key cache (delta observed as documented): 5 calls for one code = 5 reads (legacy: 1); a changed row is seen on the very next call; a code added after a miss is found; every read is parameterised", repeatReads === 5 && before === "Belgique" && after === "Belgium" && missBefore === false && missAfter === true && parameterised, { repeatReads, before, after, missBefore, missAfter, statements: queryLog.slice(0, 5) });
  }

  // P07: c07 getter + predicate share one buffer in legacy (one read); modern reads twice — the CR-C1 delta on the CUS200 path.
  {
    queryCount = 0;
    const n = await f.getCountryName("IT");
    const e = await f.existCountry("IT");
    record("P07", "c07 CR-C1", "GetCountryName(x) then ExistCountry(x) (the CUS200 prompt-then-check path): 2 reads here where the legacy performed 1 — same answers, different read count", queryCount === 2 && n === "Italy" && e === true, { reads: queryCount, n, e });
  }

  // P08: schema — `country` column-for-column from COUNTRY.PF, no delete flag, field bounds enforced by the column types.
  {
    const cols = (await t.db.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'country' ORDER BY ordinal_position`, [t.schema])).rows.map((c) => [c.column_name, c.data_type, c.character_maximum_length, c.is_nullable]);
    const want = [["coid", "character varying", 2, "NO"], ["countr", "character varying", 30, "NO"], ["coiso", "character varying", 3, "NO"]];
    const pk = (await t.db.query(`SELECT indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = 'country' AND indexname LIKE '%pkey'`, [t.schema])).rows[0]?.indexdef ?? "";
    const rejected = {};
    for (const [label, sql] of [["coid3", "INSERT INTO country (coid, countr, coiso) VALUES ('ABC', 'x', '')"], ["countr31", `INSERT INTO country (coid, countr, coiso) VALUES ('Q1', '${"x".repeat(31)}', '')`], ["coiso4", "INSERT INTO country (coid, countr, coiso) VALUES ('Q2', 'x', 'ABCD')"]]) {
      try { await t.db.query(sql); rejected[label] = "accepted"; } catch (err) { rejected[label] = err.code; }
    }
    await clearExtraRows();
    record("P08", "c07 schema", "country: COID varchar(2) PK, COUNTR varchar(30), COISO varchar(3), NOT NULL, no delete flag (exists = row present); 3-char code, 31-char name, 4-char ISO rejected by the column types (22001)", same(cols, want) && /\(coid\)/.test(pk) && rejected.coid3 === "22001" && rejected.countr31 === "22001" && rejected.coiso4 === "22001", { cols, pk, rejected });
  }

  // P09: c08 GetCountryIso3 is exported and has no consumer in modern/src outside the module; nothing named close*.
  {
    const files = [];
    (function walk(dir) {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.ts$/.test(name)) files.push(p);
      }
    })(join(modernRoot, "src"));
    const consumers = files
      .filter((p) => !p.includes(join("shared", "fcountry")))
      .filter((p) => /getCountryIso3/.test(readFileSync(p, "utf8")))
      .map((p) => relative(modernRoot, p));
    const closeNames = [...Object.keys(f), ...Object.keys(fcountryModule)].filter((k) => /close/i.test(k));
    record("P09", "c08", `getCountryIso3 is a method (typeof function) with no consumer in modern/src outside shared/fcountry (${files.length} .ts files scanned); nothing named close* on the instance or the module (closeCOUNTRY was never exported)`, typeof f.getCountryIso3 === "function" && consumers.length === 0 && closeNames.length === 0, { scanned: files.length, consumers, closeNames });
  }

  // P10: c08 / c09 the selector rows carry code and name only — COISO never appears in the window.
  {
    const pages = [await f.sltCountry({}), await f.sltCountry({ order: "name" }), await f.sltCountry({ position: "GB" })];
    const keys = new Set(pages.flatMap((p) => p.rows.flatMap((r) => Object.keys(r))));
    record("P10", "c08 c09", "SltCountry rows are { coid, countr } only across by-code, by-name and positioned loads — COISO never reaches the window", same([...keys].sort(), ["coid", "countr"]) && pages.every((p) => p.rows.length === COUNTRY_FIXTURE.length || p.rows.length > 0), { keys: [...keys], rowCounts: pages.map((p) => p.rows.length) });
  }

  // Populate for the keyed-read sweeps: digits, upper, lower codes; mixed-case and duplicate names (57 rows in total).
  const extra = [];
  {
    const names = ["Aland", "aland", "Zambia", "zambia", "Korea", "Korea", "Korea", "Eswatini", "eSwatini", "Terra 01", "Terra 02", "Åland", "Ørland"];
    let i = 0;
    for (const letter of ["A", "B", "C", "D", "a", "b", "1", "2", "9"]) {
      for (let k = 0; k < 5; k++) {
        const coid = `${letter}${k}`;
        const countr = names[i % names.length] + (i >= names.length ? ` ${i}` : "");
        extra.push({ coid, countr, coiso: `${coid}X`.slice(0, 3) });
        i++;
      }
    }
    // keep three literal duplicates of "Korea" and the exact-case pairs
    extra[4].countr = "Korea";
    extra[5].countr = "Korea";
    extra[6].countr = "Korea";
    extra[7].countr = "Aland";
    extra[8].countr = "aland";
    extra[9].countr = "Zambia";
    extra[10].countr = "zambia";
    for (const r of extra) await insertCountry(r.coid, r.countr, r.coiso);
  }

  // P11: c09 by-code keyed read == oracle for every position / offset (SETLL semantics, 20 per load, look-ahead More / Bottom).
  {
    const rows = await allRows();
    const positions = new Set(["", " ", "  ", "0", "1", "10", "1Z", "9Z", "A", "AA", "B", "BE", "BEL", "C", "D5", "F", "FR", "G", "GA", "GB", "IT", "N", "NL", "US", "UZ", "Z", "ZZ", "a", "a0", "b9", "z", "zz", "~"]);
    for (const r of rows) positions.add(r.coid);
    const bad = [];
    let checked = 0;
    for (const position of positions) {
      for (const offset of [0, 1, 19, 20, 21, 40, 60]) {
        const got = await f.sltCountry({ order: "code", position, offset });
        const want = oraclePage(rows, "code", position, offset);
        checked++;
        if (!same(got, want)) bad.push({ position, offset, got: got.rows.map((r) => r.coid), want: want.rows.map((r) => r.coid), more: [got.more, want.more] });
      }
    }
    record("P11", "c09", `by-code SltCountry == COU301 keyed-read oracle (SETLL >= key, 20 rows, look-ahead More / Bottom) on ${checked} (position, offset) pairs over ${rows.length} rows incl. digit / lower-case codes`, bad.length === 0, { rows: rows.length, checked, bad: bad.slice(0, 5) });
  }

  // P12: c09 by-name keyed read over COUNTR1 == oracle (name order, code tie-break — CR-C4) for many positions / offsets.
  {
    const rows = await allRows();
    const positions = new Set(["", " ", "A", "Al", "Aland", "B", "Bel", "Belgium", "E", "Es", "F", "Fr", "Ge", "K", "Korea", "L", "Terra", "N", "Ne", "S", "Sp", "U", "United", "United States", "Z", "Zam", "a", "al", "e", "eS", "z", "zz", "Å", "Ø", "~", "x".repeat(40)]);
    for (const r of rows) positions.add(r.countr);
    const bad = [];
    let checked = 0;
    for (const position of positions) {
      for (const offset of [0, 1, 20, 21, 40, 60]) {
        const got = await f.sltCountry({ order: "name", position, offset });
        const want = oraclePage(rows, "name", position, offset);
        checked++;
        if (!same(got, want)) bad.push({ position, offset, got: got.rows.map((r) => `${r.coid}:${r.countr}`), want: want.rows.map((r) => `${r.coid}:${r.countr}`) });
      }
    }
    record("P12", "c09 CR-C4", `by-name SltCountry (COUNTR1) == oracle (byte order on COUNTR, code decides equal names) on ${checked} (position, offset) pairs incl. three literal 'Korea' rows, exact-case pairs and non-ASCII names`, bad.length === 0, { rows: rows.length, checked, bad: bad.slice(0, 5) });
  }

  // P13: c09 load size and look-ahead: table sizes that leave exactly 19 / 20 / 21 / 40 / 41 rows from the top.
  {
    const outcomes = [];
    let ok = true;
    for (const total of [19, 20, 21, 40, 41]) {
      await clearExtraRows();
      // deterministic distinct codes after the fixture: Q0..Q9, R0..R9, S0..S9, T0..
      const need = total - COUNTRY_FIXTURE.length;
      let n = 0;
      for (const letter of ["Q", "R", "S", "T", "V", "W"]) for (let k = 0; k < 10 && n < need; k++, n++) await insertCountry(`${letter}${k}`, `Row ${letter}${k}`);
      const rows = await allRows();
      const first = await f.sltCountry({});
      const second = first.nextOffset === null ? null : await f.sltCountry({ offset: first.nextOffset });
      const third = second && second.nextOffset !== null ? await f.sltCountry({ offset: second.nextOffset }) : null;
      const want1 = oraclePage(rows, "code", "", 0);
      const want2 = want1.nextOffset === null ? null : oraclePage(rows, "code", "", want1.nextOffset);
      const want3 = want2 && want2.nextOffset !== null ? oraclePage(rows, "code", "", want2.nextOffset) : null;
      const pass = rows.length === total && same(first, want1) && same(second, want2) && same(third, want3);
      ok = ok && pass;
      outcomes.push({ total, pages: [first.rows.length, second?.rows.length ?? null, third?.rows.length ?? null], more: [first.more, second?.more ?? null, third?.more ?? null], pass });
    }
    await clearExtraRows();
    record("P13", "c09", "20 rows per load, More / Bottom by one-row look-ahead: 19 -> [19 Bottom]; 20 -> [20 Bottom] (exactly 20 left shows Bottom at once); 21 -> [20 More, 1 Bottom]; 40 -> [20, 20 Bottom]; 41 -> [20, 20, 1]", ok, outcomes);
  }

  // P14: c09 position beyond the last key -> empty window, no rows, no message, no error (both orders).
  {
    const got = { code: await f.sltCountry({ position: "ZZ" }), name: await f.sltCountry({ order: "name", position: "zzzz" }), tilde: await f.sltCountry({ position: "~" }) };
    const empty = { rows: [], more: false, nextOffset: null };
    record("P14", "c09", "position beyond the last key (by code 'ZZ' / '~', by name 'zzzz'): { rows: [], more: false, nextOffset: null } — empty window, nothing thrown, no message invented (needs-SME kept as-is)", same(got.code, empty) && same(got.name, empty) && same(got.tilde, empty), got);
  }

  // P15: c09 / CR-C4 duplicate names list adjacent and each row keeps its own code; equal names are tie-broken by code.
  {
    await insertCountry("K2", "Korea", "KOR");
    await insertCountry("K1", "Korea", "PRK");
    await insertCountry("K0", "Korea", "K0X");
    const page = await f.sltCountry({ order: "name", position: "Korea" });
    const korea = page.rows.filter((r) => r.countr === "Korea").map((r) => r.coid);
    const contiguous = page.rows.findIndex((r) => r.countr === "Korea") === 0 && page.rows.slice(0, korea.length).every((r) => r.countr === "Korea");
    await clearExtraRows();
    record("P15", "c09 CR-C4", "three rows named 'Korea' list adjacent at the position, each with its own code, in code order (K0, K1, K2 — the CR-C4 tie-break; the box listed arrival order)", same(korea, ["K0", "K1", "K2"]) && contiguous, { korea, first: page.rows.slice(0, 4) });
  }

  // P16: c09 entry state and return contract: keycod = pcod as 2A, keydes blank, dft = pcod; F3 / F12 return dft; option 1 returns the row's COID.
  {
    const s = sltCountryOpen("IT");
    const open = same(s, { order: "code", keycod: "IT", keydes: "", dft: "IT" }) && same(sltCountryRequest(s), { order: "code", position: "IT", offset: 0 });
    const cancel = sltCountryAct(s, { cancel: true });
    const cancelWins = sltCountryAct(s, { cancel: true, rows: [{ rrn: 3, coid: "NL", opt: 7 }], controlOption: 5 });
    const select = sltCountryAct(s, { rows: [{ rrn: 3, coid: "NL", opt: 1 }] });
    const none = sltCountryAct(s, { rows: [{ rrn: 1, coid: "BE", opt: 0 }], controlOption: 0 });
    // G-C2 observation: dft is the value as passed while keycod is the 2A view of it.
    const wide = sltCountryOpen("FRA");
    const trailing = sltCountryOpen("FR ");
    record("P16", "c09", "entry: { order code, keycod = pcod, keydes '', dft = pcod }; F3 / F12 return dft even with options typed; option 1 on one row returns that COID; plain Enter -> none. Observation (G-C2): dft is pcod verbatim while keycod is its 2A view ('FRA' -> keycod FR, dft FRA)", open && same(cancel, { kind: "return", coid: "IT" }) && same(cancelWins, { kind: "return", coid: "IT" }) && same(select, { kind: "select", coid: "NL" }) && same(none, { kind: "none" }), { s, cancel, cancelWins, select, none, gC2: { wide, trailing } });
  }

  // P17: c10 the card's trace — toggle, position by name, toggle back — codes from the top, pcod lost.
  {
    let s = sltCountryOpen("IT");
    let o = sltCountryOpen("IT");
    const steps = [{ f8: true }, { controlOption: 8, positionTo: "Ne" }, { f8: true }, { f8: true }];
    const trace = [];
    let ok = true;
    for (const entry of steps) {
      const m = sltCountryAct(s, entry);
      const w = oracleAct(o, entry);
      ok = ok && outcomeMatches(m, w) && m.kind === "reprepare";
      if (m.kind === "reprepare") s = m.state;
      o = w.state;
      trace.push({ entry, request: sltCountryRequest(s), state: s });
      ok = ok && same(sltCountryRequest(s), oracleRequest(o));
    }
    const shown = trace.map((x) => `${x.request.order}:${JSON.stringify(x.request.position)}`);
    record("P17", "c10", "card trace: F8 -> names from top (K kept = IT); option 8 'Ne' -> names from Ne; F8 -> codes from top (pcod lost, D = Ne kept); F8 -> names from top (retained key never read); dft stays IT", ok && same(shown, ['name:""', 'name:"Ne"', 'code:""', 'name:""']) && s.dft === "IT", { shown, trace });
  }

  // P18: c10 F8 interactions — exhaustive over row-option sets x control option x position-to x order, vs the oracle state machine.
  {
    const rowSets = [[], [{ rrn: 1, coid: "BE", opt: 0 }], [{ rrn: 2, coid: "DE", opt: 1 }], [{ rrn: 2, coid: "DE", opt: 5 }], [{ rrn: 1, coid: "BE", opt: 1 }, { rrn: 4, coid: "GB", opt: 1 }], [{ rrn: 1, coid: "BE", opt: 3 }, { rrn: 4, coid: "GB", opt: 1 }]];
    const bad = [];
    let checked = 0;
    for (const order of ["code", "name"]) {
      for (const rows of rowSets) for (const controlOption of [undefined, 0, 5, 8]) for (const positionTo of [undefined, "", "US", "Ne"]) {
        const state = { order, keycod: "IT", keydes: "Ne", dft: "IT" };
        const entry = { f8: true, rows, controlOption, positionTo };
        const m = sltCountryAct(state, entry);
        const w = oracleAct(state, entry);
        checked++;
        if (!outcomeMatches(m, w)) bad.push({ state, entry, m, w });
      }
    }
    record("P18", "c10", `F8 x ${checked} entry combinations == oracle: ignored while any row option is typed (redisplay, no toggle, no selection), 41 before the toggle, toggle wins over option 8 and discards the position, clears the key of the order entered`, bad.length === 0, { checked, bad: bad.slice(0, 3) });
  }

  // P19: c11 S01chk truth table — exhaustive over 3 rows x opts {0,1,2,9} x control {0,1,8,9} x f8, compared with the oracle.
  {
    const opts = [0, 1, 2, 9];
    const bad = [];
    let checked = 0;
    const indicatorSets = new Set();
    for (const a of opts) for (const b of opts) for (const c of opts) for (const controlOption of [0, 1, 8, 9]) for (const f8 of [false, true]) {
      const rows = [{ rrn: 2, coid: "BE", opt: a }, { rrn: 5, coid: "DE", opt: b }, { rrn: 9, coid: "GB", opt: c }];
      const entry = { rows, controlOption, positionTo: "N", f8 };
      const state = sltCountryOpen("IT");
      const mc = sltCountryCheck(entry);
      const m = sltCountryAct(state, entry);
      const w = oracleAct(state, entry);
      checked++;
      // On a redisplay the whole indicator set must match; otherwise S01chk raised nothing and the branch taken must match.
      const checkOk = w.kind === "redisplay" ? same(mc, w.check) : mc.errors.length === 0;
      if (!checkOk || !outcomeMatches(m, w)) bad.push({ entry, mc, m, w });
      indicatorSets.add(mc.errors.map((e) => e.indicator).join(","));
    }
    record("P19", "c11", `S01chk / S01act truth table: ${checked} combinations (3 rows x {0,1,2,9} x control {0,1,8,9} x F8) == oracle — 35 per invalid row, 36 per second '1', 41 for control not 0/8, 42 for 8 with a '1' pending; cumulative; first offending RRN latched; ${indicatorSets.size} distinct indicator sets seen`, bad.length === 0, { checked, indicatorSets: [...indicatorSets].sort(), bad: bad.slice(0, 3) });
  }

  // P20: c10 / c11 random multi-step sessions through the reducer vs the oracle state machine (state, outcome, s01prp request).
  {
    const coids = ["BE", "DE", "FR", "GB", "IT", "NL"];
    const bad = [];
    let sessions = 0;
    let steps = 0;
    for (let n = 0; n < 1500; n++) {
      let s = sltCountryOpen(pick(["IT", "FR", "", "ZZ", "us"]));
      let o = { ...s };
      sessions++;
      for (let k = 0; k < 8; k++) {
        const rows = [];
        const nRows = randInt(0, 3);
        const used = new Set();
        for (let r = 0; r < nRows; r++) {
          const rrn = randInt(1, 20);
          if (used.has(rrn)) continue;
          used.add(rrn);
          rows.push({ rrn, coid: pick(coids), opt: pick([0, 0, 0, 1, 1, 2, 8, 9]) });
        }
        rows.sort((x, y) => x.rrn - y.rrn);
        const entry = { rows, controlOption: pick([undefined, 0, 0, 8, 8, 3]), positionTo: pick([undefined, "", "N", "Ne", "United", "zz", "FRA"]), f8: pick([false, false, true]), cancel: Math.random() < 0.05 };
        const m = sltCountryAct(s, entry);
        const w = oracleAct(o, entry);
        steps++;
        if (!outcomeMatches(m, w)) { bad.push({ s, entry, m, w }); break; }
        if (m.kind === "reprepare") s = m.state;
        o = w.state;
        if (!same(sltCountryRequest(s), oracleRequest(o))) { bad.push({ s, o, entry }); break; }
        if (m.kind === "return" || m.kind === "select") break;
      }
    }
    record("P20", "c10 c11", `${sessions} random selector sessions (${steps} Enter / F-key steps) through sltCountryAct == oracle state machine on outcome, state and the s01prp request after every step`, bad.length === 0, { sessions, steps, bad: bad.slice(0, 2) });
  }

  // P21: c11 option 8 repositions the current order and the reload matches the oracle page; blank position = back to the top; text not validated.
  {
    const rows = await allRows();
    const cases = [
      { state: sltCountryOpen("IT"), entry: { controlOption: 8, positionTo: "N" } },
      { state: sltCountryOpen("IT"), entry: { controlOption: 8, positionTo: "" } },
      { state: sltCountryOpen("IT"), entry: { controlOption: 8, positionTo: "zz" } },
      { state: { order: "name", keycod: "IT", keydes: "", dft: "IT" }, entry: { controlOption: 8, positionTo: "Sp" } },
      { state: { order: "name", keycod: "IT", keydes: "", dft: "IT" }, entry: { controlOption: 8, positionTo: "x".repeat(40) } },
      { state: { order: "code", keycod: "ZZ", keydes: "", dft: "IT" }, entry: { controlOption: 8, positionTo: "" } },
    ];
    const bad = [];
    const shown = [];
    for (const c of cases) {
      const m = sltCountryAct(c.state, c.entry);
      const w = oracleAct(c.state, c.entry);
      if (!outcomeMatches(m, w) || m.kind !== "reprepare") { bad.push({ c, m, w }); continue; }
      const page = await f.sltCountry(sltCountryRequest(m.state));
      const want = oraclePage(rows, m.state.order, m.state.order === "code" ? m.state.keycod : m.state.keydes, 0);
      if (!same(page, want)) bad.push({ c, page: page.rows.slice(0, 3), want: want.rows.slice(0, 3) });
      shown.push({ order: m.state.order, position: sltCountryRequest(m.state).position, first: page.rows[0]?.coid ?? null, count: page.rows.length, more: page.more });
    }
    record("P21", "c11", "option 8: reposition at POSCOD / POSDES then reload == oracle page; blank position returns to the top (recovery from an empty window); text not validated ('zz' / 40 x's -> empty window)", bad.length === 0, { shown, bad: bad.slice(0, 3) });
  }

  // P22: c12 export surface — four binder symbols as four methods plus the CUS listCountries; the module's exports; nothing else.
  {
    const instance = Object.keys(f).sort();
    const moduleExports = Object.keys(fcountryModule).sort();
    const wantInstance = ["existCountry", "getCountryIso3", "getCountryName", "listCountries", "sltCountry"];
    const wantModule = ["COID_LENGTH", "COUNTR_LENGTH", "SLT_DISPLAY_PAGE", "SLT_LOAD_SIZE", "createFCountry", "normaliseCountryCode", "normaliseCountryName", "sltCountryAct", "sltCountryCheck", "sltCountryOpen", "sltCountryRequest"];
    record("P22", "c12", "instance keys are exactly existCountry, getCountryIso3, getCountryName, sltCountry (the four FCOUNTRY.BND symbols) + listCountries (CUS surface); module exports are createFCountry, the two normalisers, the four reducer functions and four constants; nothing named close*", same(instance, wantInstance) && same(moduleExports, wantModule), { instance, moduleExports });
  }

  // P23: c12 / schema — COUNTR1.LF -> countr1 index with COLLATE "C" on (countr, coid); comments cite c13 (writer), c08 (COISO), c09 (index).
  {
    const idx = (await t.db.query(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = 'country' ORDER BY indexname`, [t.schema])).rows;
    const countr1 = idx.find((i) => i.indexname === "countr1")?.indexdef ?? "";
    const comments = (await t.db.query(
      `SELECT obj_description(($1 || '.country')::regclass, 'pg_class') AS tbl,
              col_description(($1 || '.country')::regclass, 3) AS coiso,
              obj_description(($1 || '.countr1')::regclass, 'pg_class') AS idx`, [t.schema])).rows[0];
    record("P23", "c12 schema", "countr1 index exists on country (countr COLLATE \"C\", coid COLLATE \"C\") next to the PK only; table comment names COU200 (c13) as the only writer, coiso comment cites c08, index comment cites c09", idx.length === 2 && /\(countr COLLATE "C", coid COLLATE "C"\)/.test(countr1) && /c13/.test(comments.tbl ?? "") && /c08/.test(comments.coiso ?? "") && /c09/.test(comments.idx ?? ""), { idx, comments });
  }

  // P24: CUS consumer shape (pack atu-merlin-ts-cus-v1@1 untouched) — for every input CUS parseInput can pass (<= 2 chars, right-trimmed)
  // the new existCountry / getCountryName answer == the pre-convert raw-equality semantics; listCountries unchanged.
  {
    const rows = await allRows();
    const inputs = new Set(["", "F", "f", "1", " ", " F", "fr", "Fr", "fR", "XX", "ZZ", ...twoCharCodes().slice(0, 120), ...fixtureCodes]);
    const bad = [];
    for (const v of inputs) {
      if (v.length > 2 || /\s$/.test(v)) continue; // outside what parseInput lets through
      const raw = rows.find((r) => r.coid === v);
      const e = await f.existCountry(v);
      const n = await f.getCountryName(v);
      if (e !== Boolean(raw) || n !== (raw?.countr ?? "")) bad.push({ v, e, n, raw });
    }
    const list = await f.listCountries();
    const listOk = same(list.map((c) => c.coid), [...rows].map((r) => r.coid).sort()) && list.every((c) => same(Object.keys(c).sort(), ["coid", "coiso", "countr"]));
    // G-C3: inputs CUS cannot pass any more now answer differently from the pre-convert raw equality.
    const outside = { FRA: await f.existCountry("FRA"), "FR ": await f.existCountry("FR ") };
    record("P24", "c12 CUS", `CUS-reachable inputs (${[...inputs].filter((v) => v.length <= 2 && !/\s$/.test(v)).length} values, <= 2 chars right-trimmed): existCountry / getCountryName == pre-convert raw-equality semantics; listCountries returns every row ordered by code with COISO. Observation (G-C3): 'FRA' / 'FR ' now hit FR where the pre-convert surface missed — unreachable through CUS parseInput`, bad.length === 0 && listOk, { bad: bad.slice(0, 5), listCount: list.length, gC3: outside });
  }

  // P25: CR-C4 characterised — the module orders by byte order (Buffer.compare); where that agrees with EBCDIC CP037 and where it does not.
  {
    const samples = ["1A", "9Z", "AA", "AZ", "BE", "ZZ", "aa", "az", "zz", "A", "a"];
    for (const s of samples) if (!fixtureCodes.includes(s)) await insertCountry(s, `Sample ${s}`);
    const byModule = (await f.sltCountry({ position: "" })).rows.map((r) => r.coid);
    await clearExtraRows();
    const present = samples.filter((s) => byModule.includes(s));
    const moduleOrder = byModule.filter((c) => present.includes(c));
    const byteOrder = [...present].sort(byteCmp);
    const ebcdicOrder = [...present].sort(ebcdicCmp);
    const agree = { upperOnly: same(byteOrder.filter((c) => /^[A-Z]{2}$/.test(c)), ebcdicOrder.filter((c) => /^[A-Z]{2}$/.test(c))), digitsBeforeLetters_ascii: byteCmp("1A", "AA") < 0, digitsBeforeLetters_ebcdic: ebcdicCmp("1A", "AA") < 0, upperBeforeLower_ascii: byteCmp("AA", "aa") < 0, upperBeforeLower_ebcdic: ebcdicCmp("AA", "aa") < 0, blankFirst_ascii: byteCmp("  ", "AA") < 0 && byteCmp("  ", "1A") < 0, blankFirst_ebcdic: ebcdicCmp("  ", "aa") < 0 && ebcdicCmp("  ", "1A") < 0, shortKeyFirst_ascii: byteCmp("A", "AA") < 0, shortKeyFirst_ebcdic: ebcdicCmp("A ", "AA") < 0 };
    // G-C1: README CR-C4 says digits-before-letters and upper-before-lower "hold in both" — they hold in ASCII only.
    record("P25", "c09 CR-C4", `module order == byte order (COLLATE "C") on ${present.length} loaded codes (digit / upper / lower / 1-char); upper-case-only codes and a shorter (blank-padded) key order the same as EBCDIC; blank first in both. Observation (G-C1): digits-before-letters and upper-before-lower are ASCII-only — EBCDIC CP037 puts lower < upper < digits, contrary to the README CR-C4 rationale`, present.length === samples.length && same(moduleOrder, byteOrder) && !same(byteOrder, ebcdicOrder) && agree.upperOnly && agree.shortKeyFirst_ascii && agree.shortKeyFirst_ebcdic && agree.blankFirst_ascii && agree.blankFirst_ebcdic && agree.digitsBeforeLetters_ascii && !agree.digitsBeforeLetters_ebcdic && agree.upperBeforeLower_ascii && !agree.upperBeforeLower_ebcdic, { moduleOrder, byteOrder, ebcdicOrder, agree });
  }

  // P26: c09 OFFSET-based resume vs the legacy key-based resume (saved look-ahead row) — G-C4 characterised, not fixed.
  {
    await clearExtraRows();
    for (const letter of ["Q", "R", "S"]) for (let k = 0; k < 10; k++) await insertCountry(`${letter}${k}`, `Row ${letter}${k}`); // 38 rows
    const first = await f.sltCountry({});
    const lookAhead = first.rows[first.rows.length - 1].coid; // the legacy resumes from the row after this one
    await insertCountry("A0", "Inserted before resume"); // sorts before every loaded row
    const second = await f.sltCountry({ offset: first.nextOffset });
    const rows = await allRows();
    const keyed = keyedOrder(rows, "code");
    const legacySecond = keyed.slice(keyed.findIndex((r) => r.coid === lookAhead) + 1, keyed.findIndex((r) => r.coid === lookAhead) + 1 + SLT_LOAD_SIZE).map((r) => r.coid);
    const modernSecond = second.rows.map((r) => r.coid);
    const repeated = modernSecond.filter((c) => first.rows.some((r) => r.coid === c));
    await clearExtraRows();
    record("P26", "c09 G-C4", "resume after a load: the module resumes by OFFSET from the position, the legacy from the saved look-ahead key — with a row inserted before the resume point between two loads the module repeats the last row of page 1 (observation, reference data with no modern writer; not fixed here)", same(modernSecond.slice(1), legacySecond.slice(0, modernSecond.length - 1)) && repeated.length === 1 && repeated[0] === lookAhead, { lookAhead, modernSecond, legacySecond, repeated });
  }

  // P27: COU200 absence preserved — no route touches country except the CUS datalist GET; no features/cou; the only writer in src is the CUS seed.
  {
    const app = await buildApp({ db: t.db });
    await app.ready();
    const routeLines = app.printRoutes({ commonPrefix: false }).split("\n").filter((l) => /countr/i.test(l));
    await app.close();
    const featuresCou = existsSync(join(modernRoot, "src", "features", "cou"));
    const files = [];
    (function walk(dir) {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.ts$/.test(name)) files.push(p);
      }
    })(join(modernRoot, "src"));
    const writers = files.filter((p) => /(INSERT INTO|UPDATE|DELETE FROM)\s+country\b/.test(readFileSync(p, "utf8"))).map((p) => relative(modernRoot, p));
    const openapi = readdirSync(join(modernRoot, "openapi"));
    record("P27", "COU200 deferred", "no maintenance path: the only route naming countries is the CUS GET /api/countries datalist; no src/features/cou; the only writer of `country` in src is the CUS seed (src/db/seed.ts); no COU OpenAPI file", routeLines.length === 1 && /GET/.test(routeLines[0]) && /api\/countries/.test(routeLines[0]) && !/POST|PUT|DELETE|PATCH/.test(routeLines[0]) && !featuresCou && same(writers, ["src/db/seed.ts"]) && same(openapi.sort(), ["customer.yaml", "order.yaml"]), { routeLines, featuresCou, writers, openapi });
  }
} finally {
  await t.close();
}

// --- Summary --------------------------------------------------------------------------------------

const pass = results.filter((r) => r.pass).length;
const fail = results.length - pass;
const out = {
  pack: "atu-merlin-ts-cou-v1@1",
  characterization: "WAIVED_PATHFINDER",
  oracle: "discovery/cou-maintain/features c07..c12 (COU301 keyed read replayed in JS over byte order; S01chk / S01act state machine written from the cards; c07 buffer rules observed through a query-counting proxy) + modern/README.md COU section; NOT IBM i goldens",
  ran_at: new Date().toISOString(),
  summary: { pass, fail, total: results.length },
  cases: results,
};
writeFileSync(join(here, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
