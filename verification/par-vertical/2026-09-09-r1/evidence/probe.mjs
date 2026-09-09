#!/usr/bin/env node
// Independent COMPARE probe at the TypeScript boundary — pack atu-merlin-ts-par-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/par-maintain/features c01..c13) + modern/README.md (PAR section).
// NOT IBM i goldens: nothing here is a claim of parity against the box.
//
// The oracles are written from the cards, not copied from the module or its vitest suite:
//  - c09 getters: PAR300.chainPARAMETER is replayed in JavaScript as a small buffer machine (the
//    request compared with the record buffer's own key; a differing key clears and chains; a miss is
//    never cached; the 10A by-value parameter truncates right and ignores trailing blanks). The module
//    is compared with it on values (every call) and on I/O counts (through a query-counting proxy),
//    which is where CR-P1 (no cache) is expected to show.
//  - c01 list: every `parameter` row is fetched with a plain SELECT (no ORDER BY) and the PAR200
//    s01lod sequence (setll from the saved key, 14 rows, one look-ahead read) is replayed over a
//    byte-order sort (Buffer.compare), then compared with GET /api/parameters page by page.
//  - c02 / c04 / c05 maintain: FMT03 / FMT02 / option 4 are modelled from the cards (display folding
//    of every field without CHECK(LC), duplicate-key check only, unconditional update with the key
//    output-only, keyed delete with %found off on a miss) and compared with the HTTP surface.
//  - c07 PAR201 pattern: `&PATH *TCAT '*'` on a 100-byte CL variable, written from the card.
//
//   cd modern && ./scripts/local-pg.sh start
//   DATABASE_URL=$(./scripts/local-pg.sh url) npx tsx ../verification/par-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Needs a live DATABASE_URL (the module is probed against a
// throw-away schema built and seeded by modern/test/helpers/db.ts and dropped at the end).

import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { randomBytes } from "node:crypto";
import * as parmModule from "../../../../modern/src/shared/parm/index.ts";
import * as serviceModule from "../../../../modern/src/features/par/par.service.ts";
import * as repositoryModule from "../../../../modern/src/features/par/par.repository.ts";
import { createTestDb } from "../../../../modern/test/helpers/db.ts";
import { buildApp } from "../../../../modern/src/app.ts";

const { createFParameter, wrklnkPattern, PATH_KEY, CLEARED_PARAMETER } = parmModule;
const { DUPLICATE_MESSAGE } = serviceModule;
const { PAR_PAGE_SIZE } = repositoryModule;

const here = dirname(fileURLToPath(import.meta.url));
const modernRoot = join(here, "../../../../modern");
const results = [];

function record(id, card, name, pass, detail) {
  results.push({ id, card, name, pass: Boolean(pass), detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${name}${pass ? "" : "  <-- " + JSON.stringify(detail).slice(0, 800)}`);
}
function randInt(min, max) {
  const span = max - min + 1;
  return min + (randomBytes(6).readUIntBE(0, 6) % span);
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
/** Structural equality with object keys in sorted order (a JSON row's key order is not a contract). */
function canon(x) {
  if (Array.isArray(x)) return x.map(canon);
  if (x && typeof x === "object") return Object.fromEntries(Object.keys(x).sort().map((k) => [k, canon(x[k])]));
  return x;
}
function same(a, b) {
  return JSON.stringify(canon(a)) === JSON.stringify(canon(b));
}
const KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /._-";
function randStr(maxLen, chars = KEY_CHARS, minLen = 0) {
  const n = randInt(minLen, maxLen);
  let s = "";
  for (let i = 0; i < n; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

// --- Oracle 1: the fixed-length alpha parameter / field (c09 "10A value", c02 / c04 display fields) ---
// An RPG by-value assignment into a fixed-length alpha field truncates on the right and pads with
// blanks; a keyed compare on that field therefore ignores trailing blanks (card c09, "trailing blanks
// insignificant, case-sensitive"). Stored fields lose their trailing blanks the same way.
function fixedAlpha(value, len) {
  return (value ?? "").slice(0, len).replace(/ +$/, "");
}
/** The 5250 folding of every input field without CHECK(LC) (c02): upper case on the way in. ASCII only here. */
function displayFold(value, len) {
  return fixedAlpha(value, len).toUpperCase();
}
const CLEARED = { pacode: "", pasubcode: "", parm1: "", parm2: "", parm3: "", parm4: 0, parm5: 0 };

// --- Oracle 2: PAR300.chainPARAMETER as the card describes it (c09 steps 2-4) ------------------------
/**
 * Legacy buffer machine: the request is compared with the record buffer's own PACODE / PASUBCODE; a
 * differing key clears the buffer and chains (one read); a hit costs no I/O; a miss leaves the cleared
 * buffer (so a following blank/blank request equals the cleared key and does not read). `rows` is the
 * table as it is *at the time of the read* (the legacy read the file, so a later change is invisible
 * until the key changes — that is the cache CR-P1 declines to reproduce).
 */
function legacyChainMachine(rowsNow) {
  let buf = { ...CLEARED };
  let reads = 0;
  return {
    get(field, code, sub) {
      const c = fixedAlpha(code, 10);
      const s = fixedAlpha(sub, 10);
      if (c !== buf.pacode || s !== buf.pasubcode) {
        buf = { ...CLEARED };
        reads++;
        const hit = rowsNow().find((r) => r.pacode === c && r.pasubcode === s);
        if (hit) buf = { ...hit };
      }
      return buf[field];
    },
    reads: () => reads,
    buffer: () => ({ ...buf }),
  };
}
/** The same chain without the cache: what every getter *value* must be (c09 miss / blank-key / case rules). */
function oracleGet(rows, field, code, sub) {
  const c = fixedAlpha(code, 10);
  const s = fixedAlpha(sub, 10);
  if (c === "" && s === "") return CLEARED[field];
  const hit = rows.find((r) => r.pacode === c && r.pasubcode === s);
  return (hit ?? CLEARED)[field];
}

// --- Oracle 3: PAR200 s01lod keyed read (c01 steps 2-4), replayed in JS over byte order (CR-P3) --------
function byteCmp(a, b) {
  return Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}
function keyedOrder(rows) {
  return [...rows].sort((x, y) => byteCmp(x.pacode, y.pacode) || byteCmp(x.pasubcode, y.pasubcode));
}
/** 14 rows from the saved position, one look-ahead read decides More / Bottom; PARM2S = first 32 of PARM2. */
function oraclePage(rows, offset) {
  const all = keyedOrder(rows);
  const window = all.slice(offset, offset + PAR_PAGE_SIZE).map((r) => ({
    pacode: r.pacode,
    pasubcode: r.pasubcode,
    parm1: r.parm1,
    parm2s: r.parm2.slice(0, 32),
    parm3: r.parm3,
    parm4: r.parm4,
    parm5: r.parm5,
  }));
  const more = all.length > offset + PAR_PAGE_SIZE;
  return { rows: window, more, nextOffset: more ? offset + PAR_PAGE_SIZE : null };
}

// --- Oracle 4: PAR200 FMT03 create / FMT02 update as typed on the display (c02, c04) --------------------
/** `clear fmt03` then the typed values: absent = blank / zero; folding on every field but PARM2 (CHECK(LC)). */
function oracleTyped(body) {
  const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v));
  return {
    parm1: displayFold(body.parm1 ?? "", 10),
    parm2: fixedAlpha(body.parm2 ?? "", 100),
    parm3: displayFold(body.parm3 ?? "", 2),
    parm4: num(body.parm4),
    parm5: num(body.parm5),
  };
}
function oracleCreate(rows, body) {
  const key = { pacode: displayFold(body.pacode ?? "", 10), pasubcode: displayFold(body.pasubcode ?? "", 10) };
  if (rows.some((r) => r.pacode === key.pacode && r.pasubcode === key.pasubcode)) {
    return { ok: false, status: 400, error: { code: "VALIDATION", errors: [{ code: "DUPLICATE_KEY", field: "pacode", message: "This code/sub-code already exist." }] } };
  }
  return { ok: true, status: 201, row: { ...key, ...oracleTyped(body) } };
}

// --- Oracle 5: PAR201 `CHGVAR &PATH (&PATH *TCAT '*')` on a *CHAR 100 (c07 steps 2-3, c08 step 2) ------
function oracleWrklnk(path100) {
  const trimmed = path100.replace(/ +$/, "");
  return (trimmed + "*").slice(0, 100);
}

// --- EBCDIC CP037 order for [A-Za-z0-9 ] (used only to characterise CR-P3, never as a claim) ------------
function ebcdicByte(ch) {
  if (ch === " ") return 0x40;
  const c = ch.charCodeAt(0);
  if (c >= 0x30 && c <= 0x39) return 0xf0 + (c - 0x30);
  const lower = ch.toLowerCase();
  const isUpper = ch !== lower;
  const i = lower.charCodeAt(0) - 0x61;
  let b;
  if (i <= 8) b = 0x81 + i;
  else if (i <= 17) b = 0x91 + (i - 9);
  else b = 0xa2 + (i - 18);
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
const f = createFParameter(countingDb);
const app = await buildApp({ db: t.db });
await app.ready();

async function allRows() {
  return (await t.db.query("SELECT pacode, pasubcode, parm1, parm2, parm3, parm4, parm5 FROM parameter")).rows;
}
async function clearRows() {
  await t.db.query("DELETE FROM parameter");
}
/** Fixture path (another tool writing the file): no folding, no validation beyond the table's own. */
async function insertRow(row) {
  const r = { ...CLEARED, ...row };
  await t.db.query("INSERT INTO parameter (pacode, pasubcode, parm1, parm2, parm3, parm4, parm5) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
    r.pacode, r.pasubcode, r.parm1, r.parm2, r.parm3, r.parm4, r.parm5,
  ]);
  return r;
}
/** `asWritten` = keys as PAR200 would have stored them (display-folded, no '/'): the only keys the keyed HTTP routes can address (G-P3). */
function randRow(asWritten = false) {
  const keyChars = asWritten ? KEY_CHARS.replace("/", "") : KEY_CHARS;
  const key = (s) => (asWritten ? displayFold(s, 10) : fixedAlpha(s, 10));
  return {
    pacode: key(randStr(10, keyChars)),
    pasubcode: key(randStr(10, keyChars)),
    parm1: fixedAlpha(randStr(10), 10),
    parm2: fixedAlpha(randStr(100), 100),
    parm3: fixedAlpha(randStr(2), 2),
    parm4: randInt(-9, 9),
    parm5: randInt(-999, 999),
  };
}
async function insertRandomRows(n, asWritten = false) {
  const rows = [];
  const seen = new Set();
  while (rows.length < n) {
    const r = randRow(asWritten);
    const k = `${r.pacode}\u0000${r.pasubcode}`;
    if (seen.has(k) || k === "\u0000") continue; // the blank/blank row is inserted deliberately where a case needs it
    seen.add(k);
    rows.push(await insertRow(r));
  }
  return rows;
}
const seg = (s) => (s === "" ? "%20" : encodeURIComponent(s));
async function http(method, url, payload) {
  const res = await app.inject({ method, url, payload });
  let body = null;
  if (res.body !== "") {
    try { body = res.json(); } catch { body = res.body; }
  }
  return { status: res.statusCode, body };
}
const GETTERS = [["parm1", "getParm1"], ["parm2", "getParm2"], ["parm3", "getParm3"], ["parm4", "getParm4"], ["parm5", "getParm5"]];

try {
  // ============================================================ FPARAMETER — c09 / c08 / c11 / c07 / c10 / c12

  // P01: c09 — every getter returns its typed column for every row of a random table; unknown keys give the cleared buffer.
  {
    await clearRows();
    const rows = await insertRandomRows(60);
    await insertRow({ pacode: "PATH", pasubcode: "", parm1: "P1", parm2: "/home/sample/out/", parm3: "AB", parm4: 3, parm5: 45 });
    await insertRow({ pacode: "", pasubcode: "", parm1: "HIDDEN", parm2: "hidden", parm3: "HI", parm4: 9, parm5: 999 });
    const table = await allRows();
    const bad = [];
    let checks = 0;
    for (const r of table) {
      for (const [field, getter] of GETTERS) {
        const got = await f[getter](r.pacode, r.pasubcode);
        const want = oracleGet(table, field, r.pacode, r.pasubcode);
        checks++;
        if (got !== want) bad.push({ key: [r.pacode, r.pasubcode], field, got, want });
      }
    }
    let misses = 0;
    for (let i = 0; i < 300; i++) {
      const code = randStr(12);
      const sub = randStr(12);
      for (const [field, getter] of GETTERS) {
        const got = await f[getter](code, sub);
        const want = oracleGet(table, field, code, sub);
        checks++;
        if (want === CLEARED[field]) misses++;
        if (got !== want) bad.push({ key: [code, sub], field, got, want });
      }
    }
    record("P01", "c09", `five getters == chainPARAMETER oracle on ${table.length} rows x 5 columns and 300 random keys x 5 (${checks} calls, ${misses} misses -> blanks / zeros, nothing thrown); the blank/blank row's values are never returned`, bad.length === 0 && checks > 1000, { rows: table.length, checks, misses, bad: bad.slice(0, 5) });
  }

  // P02: c09 — the 10A by-value contract: truncate right, trailing blanks ignored, case-sensitive; 2 000 random strings vs the oracle.
  {
    await clearRows();
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "/p/" });
    await insertRow({ pacode: "ABCDEFGHIJ", pasubcode: "0123456789", parm1: "TEN" });
    await insertRow({ pacode: "path", pasubcode: "", parm2: "/lower/" });
    await insertRow({ pacode: "Mixed", pasubcode: "Case", parm1: "MC" });
    const table = await allRows();
    const bad = [];
    const samples = ["PATH", "PATH ", "PATH      ", "PATH           ", "path", "Path", "PATHX", " PATH", "ABCDEFGHIJKLMNOP", "ABCDEFGHIJ", "ABCDEFGHI", "Mixed", "MIXED", "mixed"];
    const subs = ["", " ", "          ", "0123456789", "01234567890000", "Case", "CASE", "case"];
    for (let i = 0; i < 2000; i++) {
      const code = i < samples.length * subs.length ? samples[i % samples.length] : randStr(14, KEY_CHARS + "  ");
      const sub = i < samples.length * subs.length ? subs[Math.floor(i / samples.length)] : randStr(14, KEY_CHARS + "  ");
      for (const [field, getter] of [GETTERS[0], GETTERS[1]]) {
        const got = await f[getter](code, sub);
        const want = oracleGet(table, field, code, sub);
        if (got !== want) bad.push({ code, sub, field, got, want });
      }
    }
    const caseMiss = (await f.getParm2("path", " ")) === "/lower/" && (await f.getParm2("PATH", " ")) === "/p/" && (await f.getParm2("Path", " ")) === "";
    const cut = (await f.getParm1("ABCDEFGHIJKLMNOP", "0123456789ZZZ")) === "TEN";
    record("P02", "c09", "10A by-value contract == fixed-length-alpha oracle on 2 000 (code, sub) pairs (right-truncation to 10, trailing blanks ignored, exact case: 'path' and 'PATH' are two different rows, 'Path' misses)", bad.length === 0 && caseMiss && cut, { bad: bad.slice(0, 5), caseMiss, cut });
  }

  // P03: c09 — a blank/blank key never reads: 0 SQL statements with a blank/blank row present; a half-blank key does read.
  {
    await clearRows();
    await insertRow({ pacode: "", pasubcode: "", parm1: "HIDDEN", parm2: "hidden", parm3: "HI", parm4: 9, parm5: 999 });
    await insertRow({ pacode: "", pasubcode: "SUB", parm1: "HALF" });
    await insertRow({ pacode: "CODE", pasubcode: "", parm1: "OTHERHALF" });
    const blanks = [["", ""], [" ", " "], ["          ", ""], ["", "               "], ["   ", "         "]];
    const before = queryCount;
    const values = [];
    for (const [c, s] of blanks) for (const [, g] of GETTERS) values.push(await f[g](c, s));
    const blankReads = queryCount - before;
    const allCleared = values.every((v) => v === "" || v === 0);
    const b1 = queryCount;
    const half1 = await f.getParm1("", "SUB");
    const half2 = await f.getParm1("CODE", "          ");
    const halfReads = queryCount - b1;
    record("P03", "c09", `blank/blank key: ${blanks.length} key spellings x 5 getters issue 0 SQL statements and return blanks / zeros although a blank/blank row exists (unreachable, kept); a key with one blank half reads (2 calls -> 2 reads)`, blankReads === 0 && allCleared && half1 === "HALF" && half2 === "OTHERHALF" && halfReads === 2, { blankReads, halfReads, half1, half2 });
  }

  // P04: c09 CR-P1 — the legacy buffer machine vs the module on I/O count and staleness: the delta is observed, values agree on every call where the legacy would have read.
  {
    await clearRows();
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "/old/" });
    await insertRow({ pacode: "K", pasubcode: "1", parm1: "K1" });
    let tableNow = await allRows();
    const legacy = legacyChainMachine(() => tableNow);
    const before = queryCount;
    // Five reads of the same key: the legacy chains once and serves four hits; the module reads five times.
    const modernVals = [];
    const legacyVals = [];
    for (let i = 0; i < 5; i++) {
      modernVals.push(await f.getPath());
      legacyVals.push(legacy.get("parm2", "PATH", " "));
    }
    const fiveReads = queryCount - before;
    // Change the row out of band: the module sees it at once; the legacy keeps the buffer until the key changes.
    await t.db.query("UPDATE parameter SET parm2 = '/new/' WHERE pacode = 'PATH'");
    tableNow = await allRows();
    const modernAfterChange = await f.getPath();
    const legacyAfterChange = legacy.get("parm2", "PATH", " ");
    // Ask for another key, then PATH again: the legacy re-chains and now sees the change too.
    legacy.get("parm1", "K", "1");
    const legacyAfterSwitch = legacy.get("parm2", "PATH", " ");
    // Delete: module blank at once; legacy stale until a key switch.
    await t.db.query("DELETE FROM parameter WHERE pacode = 'PATH'");
    tableNow = await allRows();
    const modernAfterDelete = await f.getPath();
    const legacyAfterDelete = legacy.get("parm2", "PATH", " ");
    legacy.get("parm1", "K", "1");
    const legacyAfterDeleteSwitch = legacy.get("parm2", "PATH", " ");
    // A miss is never cached in either: the row re-appearing is seen by the next call in both.
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "/back/" });
    tableNow = await allRows();
    const modernBack = await f.getPath();
    const legacyBack = legacy.get("parm2", "PATH", " ");
    record("P04", "c09 CR-P1", "no last-key cache observed as the delta it is documented to be: 5 getPath calls = 5 SQL reads (legacy oracle: 1 read + 4 buffer hits); a PATH change / delete is seen by the module's next call while the legacy machine holds the stale buffer until a different key is requested; a miss is not cached in either (row re-appearing seen at once by both)", fiveReads === 5 && legacy.reads() >= 1 && same(modernVals, ["/old/", "/old/", "/old/", "/old/", "/old/"]) && same(legacyVals, modernVals) && modernAfterChange === "/new/" && legacyAfterChange === "/old/" && legacyAfterSwitch === "/new/" && modernAfterDelete === "" && legacyAfterDelete === "/new/" && legacyAfterDeleteSwitch === "" && modernBack === "/back/" && legacyBack === "/back/", { fiveReads, legacyReadsForFive: 1, modernAfterChange, legacyAfterChange, legacyAfterSwitch, modernAfterDelete, legacyAfterDelete, legacyAfterDeleteSwitch, modernBack, legacyBack });
  }

  // P05: c09 observation — the card's "blank key never reads" is a property of the *cleared* buffer; after a hit on another key the legacy machine's next blank/blank request differs from the buffer and chains (it would find the blank/blank row). The module short-circuits unconditionally. No caller in the estate passes a blank key (c11).
  {
    await clearRows();
    await insertRow({ pacode: "", pasubcode: "", parm1: "HIDDEN" });
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "/p/" });
    const tableNow = await allRows();
    const legacy = legacyChainMachine(() => tableNow);
    const legacyFromStart = legacy.get("parm1", "", "");            // cleared buffer: no read, blank
    const readsA = legacy.reads();
    legacy.get("parm2", "PATH", " ");                                // hit on PATH: buffer key = PATH
    const legacyAfterHit = legacy.get("parm1", "", "");              // differs from buffer -> chains -> finds the blank/blank row
    const readsB = legacy.reads();
    const before = queryCount;
    await f.getPath();
    const modernAfterHit = await f.getParm1("", "");
    const modernReads = queryCount - before;
    record("P05", "c09 G-P4", "observation: legacy machine from a cleared buffer -> blank/blank does not read (matches the card and the module); after a hit on PATH the legacy's next blank/blank request chains and returns the blank/blank row's PARM1 ('HIDDEN'), the module returns '' with no read. Unreachable in the estate (no blank-key caller, c11); recorded, not fixed", legacyFromStart === "" && readsA === 0 && legacyAfterHit === "HIDDEN" && readsB === 2 && modernAfterHit === "" && modernReads === 1, { legacyFromStart, legacyAfterHit, legacyReads: readsB, modernAfterHit, modernReads });
  }

  // P06: c08 — blank PATH is silent end to end: missing row and blank PARM2 both give '' from getPath and from GET /api/parameters/path; nothing thrown; the PAR201 pattern becomes '*'.
  {
    await clearRows();
    const missing = [await f.getPath(), (await http("GET", "/api/parameters/path")).body];
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "" });
    const blank = [await f.getPath(), (await http("GET", "/api/parameters/path")).body];
    await t.db.query("UPDATE parameter SET parm2 = '   ' WHERE pacode = 'PATH'"); // blanks written by another tool
    const blanks = await f.getPath();
    const pattern = [wrklnkPattern(missing[0]), wrklnkPattern(blank[0])];
    record("P06", "c08", "missing row and blank PARM2 are indistinguishable: getPath and GET /api/parameters/path answer '' (200) in both cases with no error; a PARM2 of three blanks written by another tool is returned as stored; wrklnkPattern('') is '*' (WRKLNK on the job's current directory)", same(missing, ["", { path: "" }]) && same(blank, ["", { path: "" }]) && blanks === "   " && same(pattern, ["*", "*"]), { missing, blank, blanks, pattern });
  }

  // P07: c07 — PAR201 pattern == the *TCAT oracle on 3 000 random 100-byte values, the two directory outcomes, the 100-character edge.
  {
    const bad = [];
    const cases = ["/home/sample/out/", "/home/sample/out", "/home/sample/out   ", "", "   ", "/", "/".padEnd(100, "x"), "/".padEnd(99, "x"), "/".padEnd(99, "x") + " ", "a b/", "/QOpenSys/out/"];
    for (let i = 0; i < 3000; i++) {
      const v = i < cases.length ? cases[i] : randStr(100, KEY_CHARS + "      ");
      const got = wrklnkPattern(v);
      const want = oracleWrklnk(v.padEnd(100, " "));
      if (got !== want) bad.push({ v, got, want });
    }
    const outcomes = { withSlash: wrklnkPattern("/home/sample/out/"), withoutSlash: wrklnkPattern("/home/sample/out"), full100: wrklnkPattern("/".padEnd(100, "x")), ninetyNine: wrklnkPattern("/".padEnd(99, "x")) };
    record("P07", "c07", "wrklnkPattern == `&PATH *TCAT '*'` on a *CHAR 100 for 3 000 values: '<dir>/*' lists the directory, '<dir>*' the parent's entries starting with the last component (trailing-slash contract, known_risk — not normalised), a 100-character PATH loses the '*', a 99-character one keeps it", bad.length === 0 && outcomes.withSlash === "/home/sample/out/*" && outcomes.withoutSlash === "/home/sample/out*" && outcomes.full100 === "/".padEnd(100, "x") && outcomes.ninetyNine.length === 100 && outcomes.ninetyNine.endsWith("x*"), { bad: bad.slice(0, 5), outcomes });
  }

  // P08: c11 — getPath is the literal GetParm2('PATH':' '); value verbatim over the module and over HTTP; PARM1/3/4/5 of the PATH row carried and read by nobody; no consumer invented.
  {
    await clearRows();
    const values = ["/home/sample/out/", "/home/sample/out", "/QOpenSys/home/sample/Out/", "relative/dir", "C:/legacy", " /leading-blank/", "/x/".padEnd(100, "y")];
    const bad = [];
    for (const v of values) {
      await t.db.query("DELETE FROM parameter WHERE pacode = 'PATH'");
      await insertRow({ pacode: "PATH", pasubcode: "", parm1: "X", parm2: v, parm3: "YZ", parm4: 1, parm5: 2 });
      const a = await f.getPath();
      const b = await f.getParm2("PATH", " ");
      const c = (await http("GET", "/api/parameters/path")).body;
      if (a !== v || b !== v || !same(c, { path: v })) bad.push({ v, a, b, c });
    }
    const carried = [await f.getParm1("PATH", ""), await f.getParm3("PATH", ""), await f.getParm4("PATH", ""), await f.getParm5("PATH", "")];
    const files = [];
    (function walk(dir) {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.ts$/.test(name)) files.push(p);
      }
    })(join(modernRoot, "src"));
    const outsideParm = files.filter((p) => !p.includes(join("shared", "parm")));
    const unusedGetterCallers = outsideParm.filter((p) => /\.getParm[1345]\s*\(/.test(readFileSync(p, "utf8"))).map((p) => relative(modernRoot, p));
    const getPathCallers = outsideParm.filter((p) => /\.getPath\s*\(/.test(readFileSync(p, "utf8"))).map((p) => relative(modernRoot, p));
    const orderReadsPath = files.filter((p) => p.includes(join("features", "order")) && /getPath|getParm|shared\/parm|parameter\b/i.test(readFileSync(p, "utf8"))).map((p) => relative(modernRoot, p));
    record("P08", "c11", `getPath == getParm2('PATH',' ') == GET /api/parameters/path on ${values.length} stored values incl. no trailing slash, a leading blank and a 100-character value — verbatim, nothing normalised; PARM1/3/4/5 of the PATH row are carried (X, YZ, 1, 2) and getParm1/3/4/5 have no caller in modern/src outside shared/parm (${outsideParm.length} files scanned); getPath is called only by the PAR route; features/order/** reads no PATH (ORD500 PDF step needs-SME under the ORD pack — interop documented as config reuse, not wired)`, bad.length === 0 && same(carried, ["X", "YZ", 1, 2]) && unusedGetterCallers.length === 0 && same(getPathCallers, ["src/features/par/par.routes.ts"]) && orderReadsPath.length === 0, { bad, carried, unusedGetterCallers, getPathCallers, orderReadsPath, filesScanned: outsideParm.length });
  }

  // P09: c10 — export surface: the five binder symbols + getPath as instance methods; nothing to open or close; the module's own exports.
  {
    const instance = Object.keys(f).sort();
    const moduleExports = Object.keys(parmModule).sort();
    const wantInstance = ["getParm1", "getParm2", "getParm3", "getParm4", "getParm5", "getPath"];
    const wantModule = ["CLEARED_PARAMETER", "PACODE_LENGTH", "PARM1_LENGTH", "PARM2_LENGTH", "PARM3_LENGTH", "PARM4_DIGITS", "PARM5_DIGITS", "PATH_KEY", "createFParameter", "normaliseParameterKey", "wrklnkPattern"];
    const closeLike = [...instance, ...moduleExports].filter((k) => /close|open|chain/i.test(k));
    record("P09", "c10", "instance keys are exactly getParm1..getParm5 (the five EXPORT(*ALL) symbols, corrected run 16) + getPath (the named GetParm2('PATH':' ') call); nothing named open* / close* / chain* anywhere (ClosePARAMETER had no export behind it); module exports are createFParameter, normaliseParameterKey, wrklnkPattern, PATH_KEY, CLEARED_PARAMETER and six width constants; PATH_KEY = { PATH, '' }", same(instance, wantInstance) && same(moduleExports, wantModule) && closeLike.length === 0 && same(PATH_KEY, { pacode: "PATH", pasubcode: "" }) && same(CLEARED_PARAMETER, CLEARED), { instance, moduleExports, closeLike });
  }

  // P10: c12 / schema — PARAMETER.PF -> parameter: columns, widths, PK only, zoned widths as CHECKs, no trigger / index / view, comments cite c11 / c07; the table is the additive PAR section.
  {
    const cols = (await t.db.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'parameter' ORDER BY ordinal_position`, [t.schema])).rows;
    const idx = (await t.db.query(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = 'parameter'`, [t.schema])).rows;
    const cons = (await t.db.query(
      `SELECT conname, contype, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = ($1 || '.parameter')::regclass ORDER BY contype, conname`, [t.schema])).rows;
    const trg = (await t.db.query(`SELECT tgname FROM pg_trigger WHERE tgrelid = ($1 || '.parameter')::regclass AND NOT tgisinternal`, [t.schema])).rows;
    const views = (await t.db.query(`SELECT table_name FROM information_schema.views WHERE table_schema = $1 AND view_definition ILIKE '%parameter%'`, [t.schema])).rows;
    const comments = (await t.db.query(
      `SELECT obj_description(($1 || '.parameter')::regclass, 'pg_class') AS tbl, col_description(($1 || '.parameter')::regclass, 4) AS parm2`, [t.schema])).rows[0];
    const shape = cols.map((c) => [c.column_name, c.data_type, c.character_maximum_length, c.is_nullable]);
    const wantShape = [["pacode", "character varying", 10, "NO"], ["pasubcode", "character varying", 10, "NO"], ["parm1", "character varying", 10, "NO"], ["parm2", "character varying", 100, "NO"], ["parm3", "character varying", 2, "NO"], ["parm4", "smallint", null, "NO"], ["parm5", "smallint", null, "NO"]];
    const bounds = {};
    await clearRows();
    for (const [name, row] of Object.entries({ code11: { pacode: "ABCDEFGHIJK", pasubcode: "" }, sub11: { pacode: "A", pasubcode: "ABCDEFGHIJK" }, parm1_11: { pacode: "B", pasubcode: "", parm1: "ABCDEFGHIJK" }, parm2_101: { pacode: "C", pasubcode: "", parm2: "x".repeat(101) }, parm3_3: { pacode: "D", pasubcode: "", parm3: "ABC" }, parm4_10: { pacode: "E", pasubcode: "", parm4: 10 }, parm4_m10: { pacode: "F", pasubcode: "", parm4: -10 }, parm5_1000: { pacode: "G", pasubcode: "", parm5: 1000 }, parm5_m1000: { pacode: "H", pasubcode: "", parm5: -1000 }, dup: { pacode: "PATH", pasubcode: "" } })) {
      if (name === "dup") await insertRow({ pacode: "PATH", pasubcode: "" });
      try { await insertRow(row); bounds[name] = "accepted"; } catch (e) { bounds[name] = e.code; }
    }
    await clearRows();
    const ok = await insertRow({ pacode: "OK", pasubcode: "", parm1: "ABCDEFGHIJ", parm2: "x".repeat(100), parm3: "AB", parm4: -9, parm5: -999 }).then(() => "accepted").catch((e) => e.code);
    const wantBounds = { code11: "22001", sub11: "22001", parm1_11: "22001", parm2_101: "22001", parm3_3: "22001", parm4_10: "23514", parm4_m10: "23514", parm5_1000: "23514", parm5_m1000: "23514", dup: "23505" };
    record("P10", "c12 schema", "parameter: PACODE/PASUBCODE/PARM1 varchar(10), PARM2 varchar(100), PARM3 varchar(2), PARM4/PARM5 smallint, all NOT NULL; PK (pacode, pasubcode) is the only index; two CHECKs carry the zoned widths (±9, ±999 — sign nibble allowed); no trigger, no view; over-wide values rejected 22001, out-of-width numerics 23514, duplicate key 23505, the widest legal row accepted; comments cite c11 (one live row, disposition open) and c07 (trailing slash)", same(shape, wantShape) && idx.length === 1 && /PRIMARY KEY|parameter_pkey/.test(idx[0].indexdef + idx[0].indexname) && cons.filter((c) => c.contype === "c").length === 2 && cons.filter((c) => c.contype === "p").length === 1 && trg.length === 0 && views.length === 0 && same(bounds, wantBounds) && ok === "accepted" && /c11/.test(comments.tbl ?? "") && /c07/.test(comments.parm2 ?? ""), { shape, idx: idx.map((i) => i.indexname), cons, trg, views, bounds, ok, comments });
  }

  // ============================================================ PAR200 over HTTP — c01 / c02 / c04 / c05 / c03 / c06

  // P11: c01 — the list == the s01lod oracle page by page for tables of 0, 1, 13, 14, 15, 27, 28, 29, 42, 57 random rows (blank/blank, lower-case, digits included).
  {
    const sizes = [0, 1, 13, 14, 15, 27, 28, 29, 42, 57];
    const bad = [];
    const shapes = [];
    let pages = 0;
    for (const n of sizes) {
      await clearRows();
      if (n > 0) {
        await insertRandomRows(n - 1);
        await insertRow({ pacode: "", pasubcode: "", parm1: "FIRST" });
      }
      const table = await allRows();
      const seen = [];
      let offset = 0;
      for (let guard = 0; guard < 20; guard++) {
        const got = (await http("GET", offset === 0 ? "/api/parameters" : `/api/parameters?offset=${offset}`)).body;
        const want = oraclePage(table, offset);
        pages++;
        seen.push(`${got.rows.length}${got.more ? "M" : "B"}`);
        if (!same(got, want)) { bad.push({ n, offset, gotFirst: got.rows[0], wantFirst: want.rows[0], gotLen: got.rows.length, wantLen: want.rows.length, more: [got.more, want.more], next: [got.nextOffset, want.nextOffset] }); break; }
        if (got.rows.some((r) => "parm2" in r) || got.rows.some((r) => !same(Object.keys(r).sort(), ["pacode", "parm1", "parm2s", "parm3", "parm4", "parm5", "pasubcode"]))) bad.push({ n, offset, shape: Object.keys(got.rows[0] ?? {}) });
        if (!got.more) break;
        offset = got.nextOffset;
      }
      shapes.push(`${n}: [${seen.join(" ")}]`);
      if (n > 0 && table.length && (await http("GET", "/api/parameters")).body.rows[0].parm1 !== "FIRST") bad.push({ n, note: "blank/blank row not first" });
    }
    record("P11", "c01", `GET /api/parameters == s01lod oracle (byte-order keyed read, 14 per load, one-row look-ahead) on ${pages} pages over ${sizes.length} table sizes; exactly 14 / 28 rows show Bottom on the last full page (no empty trailing page); blank/blank row first; rows carry parm2s (32) and never parm2`, bad.length === 0, { shapes, bad: bad.slice(0, 5) });
  }

  // P12: c01 — empty file / beyond the end / offset validation; F5 == any GET (stateless); options beyond 2 / 4 have no HTTP counterpart.
  {
    await clearRows();
    const empty = (await http("GET", "/api/parameters")).body;
    await insertRandomRows(5);
    const beyond = (await http("GET", "/api/parameters?offset=500")).body;
    const badOffsets = {};
    for (const v of ["-1", "x", "1.5", "1e400", "NaN"]) badOffsets[v] = (await http("GET", `/api/parameters?offset=${v}`)).status;
    const zeroish = { "": (await http("GET", "/api/parameters?offset=")).status, "1e1": (await http("GET", "/api/parameters?offset=1e1")).body.rows.length };
    const twice = [(await http("GET", "/api/parameters")).body, (await http("GET", "/api/parameters")).body];
    record("P12", "c01", "empty file -> { rows: [], more: false, nextOffset: null } with no message; an offset beyond the end -> empty page, nothing thrown; -1 / x / 1.5 / 1e400 / NaN -> 400 BAD_REQUEST; two consecutive GETs are identical (every GET is an F5 — no subfile state). Observation: '?offset=' and '?offset=1e1' are accepted as 0 and 10 (Number() coercion) — harmless", same(empty, { rows: [], more: false, nextOffset: null }) && same(beyond, { rows: [], more: false, nextOffset: null }) && Object.values(badOffsets).every((s) => s === 400) && same(twice[0], twice[1]) && zeroish[""] === 200 && zeroish["1e1"] === 0, { empty, beyond, badOffsets, zeroish });
  }

  // P13: c01 CR-P3 — list order is byte order (COLLATE "C"); characterised against EBCDIC CP037. The README's CR-P3 sentence ("digits before upper before lower hold in both") is wrong for EBCDIC (G-P1).
  {
    await clearRows();
    const codes = ["1A", "9Z", "A", "AA", "AZ", "BE", "ZZ", "a", "aa", "az", "zz", "PATH", "path", ""];
    for (const c of codes) await insertRow({ pacode: c, pasubcode: "", parm1: c || "BLANK" });
    const byModule = (await http("GET", "/api/parameters")).body.rows.map((r) => r.pacode);
    const byteOrder = [...codes].sort(byteCmp);
    const ebcdicOrder = [...codes].sort((x, y) => ebcdicCmp(x.padEnd(10, " "), y.padEnd(10, " ")));
    const agree = {
      blankFirst_byte: byteOrder[0] === "", blankFirst_ebcdic: ebcdicOrder[0] === "",
      upperOnly: same(byteOrder.filter((c) => /^[A-Z]+$/.test(c)), ebcdicOrder.filter((c) => /^[A-Z]+$/.test(c))),
      digitsBeforeUpper_byte: byteCmp("1A", "AA") < 0, digitsBeforeUpper_ebcdic: ebcdicCmp("1A", "AA") < 0,
      upperBeforeLower_byte: byteCmp("AA", "aa") < 0, upperBeforeLower_ebcdic: ebcdicCmp("AA", "aa") < 0,
      shortKeyFirst_byte: byteCmp("A", "AA") < 0, shortKeyFirst_ebcdic: ebcdicCmp("A ", "AA") < 0,
    };
    record("P13", "c01 CR-P3", `module order == byte order on ${codes.length} codes (blank, digit-led, upper, lower, 1-char, PATH / path); blank first and the relative order of upper-case-only keys agree with EBCDIC; digits-before-upper and upper-before-lower hold in byte order only (EBCDIC CP037: lower < upper < digits). Observation G-P1: the README CR-P3 rationale claims both hold "in both"`, same(byModule, byteOrder) && !same(byteOrder, ebcdicOrder) && agree.blankFirst_byte && agree.blankFirst_ebcdic && agree.upperOnly && agree.shortKeyFirst_byte && agree.shortKeyFirst_ebcdic && agree.digitsBeforeUpper_byte && !agree.digitsBeforeUpper_ebcdic && agree.upperBeforeLower_byte && !agree.upperBeforeLower_ebcdic, { byModule, byteOrder, ebcdicOrder, agree });
  }

  // P14: c02 — POST == the FMT03 oracle on 400 random bodies (folding of every field but PARM2, right-trim, absent = blank / zero, duplicate-key check only); the stored row equals the answer; the existing row is untouched on a duplicate.
  {
    await clearRows();
    const bad = [];
    let creates = 0;
    let duplicates = 0;
    const keys = ["PATH", "path", "Path", "K", "k", "", " ", "LIMITS", "A B", "1", "K  "];
    for (let i = 0; i < 400; i++) {
      const table = await allRows();
      const body = {};
      const useKnown = i % 3 === 0;
      if (randInt(0, 9) > 0) body.pacode = useKnown ? pick(keys) : randStr(10, KEY_CHARS + "  ");
      if (randInt(0, 9) > 0) body.pasubcode = useKnown ? pick(["", " ", "1", "SUB", "sub"]) : randStr(10, KEY_CHARS + "  ");
      if (randInt(0, 4) > 0) body.parm1 = randStr(10, KEY_CHARS + "  ");
      if (randInt(0, 4) > 0) body.parm2 = randStr(100, KEY_CHARS + "  ");
      if (randInt(0, 4) > 0) body.parm3 = randStr(2, KEY_CHARS);
      if (randInt(0, 4) > 0) body.parm4 = pick([randInt(-9, 9), String(randInt(0, 9)), ""]);
      if (randInt(0, 4) > 0) body.parm5 = pick([randInt(-999, 999), String(randInt(0, 999)), ""]);
      const want = oracleCreate(table, body);
      const res = await http("POST", "/api/parameters", body);
      if (want.ok) {
        creates++;
        const stored = (await allRows()).find((r) => r.pacode === want.row.pacode && r.pasubcode === want.row.pasubcode);
        if (res.status !== 201 || !same(res.body, want.row) || !same(stored, want.row)) bad.push({ body, res, want: want.row, stored });
      } else {
        duplicates++;
        const existing = table.find((r) => r.pacode === displayFold(body.pacode ?? "", 10) && r.pasubcode === displayFold(body.pasubcode ?? "", 10));
        const still = (await allRows()).find((r) => r.pacode === existing.pacode && r.pasubcode === existing.pasubcode);
        if (res.status !== 400 || !same(res.body, want.error) || !same(still, existing)) bad.push({ body, res, want: want.error, existing, still });
      }
    }
    const count = (await allRows()).length;
    record("P14", "c02", `POST /api/parameters == FMT03 oracle on 400 bodies: ${creates} creates (201, answer == stored row: keys / PARM1 / PARM3 upper-cased and right-trimmed like the display, PARM2 as typed (CHECK(LC)), absent field -> blank / zero) and ${duplicates} duplicates (400 VALIDATION / DUPLICATE_KEY on pacode with the DDS text, existing row untouched); blank/blank row creatable; no success message`, bad.length === 0 && creates > 100 && duplicates > 30 && count === creates && DUPLICATE_MESSAGE === "This code/sub-code already exist.", { creates, duplicates, count, bad: bad.slice(0, 3) });
  }

  // P15: c02 CR-P6 — over-long / non-numeric input -> 400 with one error per offending field, nothing written; negative zoned accepted; numeric strings accepted; observations on the 5250-unreachable corners.
  {
    await clearRows();
    const tooLong = await http("POST", "/api/parameters", { pacode: "ABCDEFGHIJK", pasubcode: "ABCDEFGHIJK", parm1: "12345678901", parm2: "x".repeat(101), parm3: "ABC", parm4: 10, parm5: "12.5" });
    const codes = (tooLong.body?.errors ?? []).map((e) => `${e.field}:${e.code}`).sort();
    const wantCodes = ["pacode:FIELD_TOO_LONG", "parm1:FIELD_TOO_LONG", "parm2:FIELD_TOO_LONG", "parm3:FIELD_TOO_LONG", "parm4:FIELD_INVALID", "parm5:FIELD_INVALID", "pasubcode:FIELD_TOO_LONG"];
    const wrongTypes = {};
    for (const [name, body] of Object.entries({ numKey: { pacode: 5 }, boolParm4: { pacode: "T", parm4: true }, floatParm4: { pacode: "T", parm4: 1.5 }, strFloat: { pacode: "T", parm5: "1.0" } })) wrongTypes[name] = (await http("POST", "/api/parameters", body)).status;
    const negative = await http("POST", "/api/parameters", { pacode: "NEG", pasubcode: "", parm4: -9, parm5: "-999" });
    const spaced = await http("POST", "/api/parameters", { pacode: "SP", pasubcode: "", parm4: " 7 ", parm5: "007" });
    const nullField = await http("POST", "/api/parameters", { pacode: "NUL", pasubcode: "", parm2: null, parm4: null }); // `clear fmt03`: null == absent == blank / zero
    const afterErrors = (await allRows()).map((r) => r.pacode).sort();
    // Observations (G-P2, corners a 5250 field could not produce): the width check runs before the right-trim, so
    // 'A' + 10 blanks (11 chars, would store as 'A') is refused; JS toUpperCase can lengthen a string ('ß' -> 'SS'),
    // so ten 'ß' pass the 10-char check, fold to 20 characters and fail in the column (500 INTERNAL); a JSON array
    // body is read as an empty form and creates the blank/blank row.
    const trailingBlanks = (await http("POST", "/api/parameters", { pacode: "A" + " ".repeat(10), pasubcode: "" })).status;
    const eszett = await http("POST", "/api/parameters", { pacode: "ß".repeat(10), pasubcode: "" });
    await clearRows();
    const arrayBody = await http("POST", "/api/parameters", [1, 2]);
    record("P15", "c02 CR-P6", "over-long / non-numeric fields -> 400 VALIDATION with one FIELD_TOO_LONG / FIELD_INVALID per offending field and nothing written; wrong JSON types -> 400; negative zoned values accepted (-9 / -999, sign nibble); ' 7 ' and '007' accepted as 7; null == absent == blank / zero (`clear fmt03`). Observations (G-P2, 5250-unreachable corners): 'A' + ten blanks is refused as too long although it would store as 'A'; ten 'ß' pass the 10-char check, fold to 20 characters and fail in the column (500 INTERNAL); a JSON array body is read as an empty form and creates the blank/blank row (201)", tooLong.status === 400 && same(codes, wantCodes) && Object.values(wrongTypes).every((s) => s === 400) && negative.status === 201 && same([negative.body.parm4, negative.body.parm5], [-9, -999]) && spaced.status === 201 && same([spaced.body.parm4, spaced.body.parm5], [7, 7]) && nullField.status === 201 && same([nullField.body.parm2, nullField.body.parm4], ["", 0]) && same(afterErrors, ["NEG", "NUL", "SP"]) && trailingBlanks === 400 && eszett.status === 500 && arrayBody.status === 201 && same(arrayBody.body, CLEARED), { tooLong: tooLong.status, codes, wrongTypes, negative: negative.body, spaced: spaced.body, nullField: nullField.body, afterErrors, trailingBlanks, eszett: eszett.status, eszettBody: eszett.body, arrayBody: arrayBody.status });
  }

  // P16: c04 — GET / PUT /api/parameters/:pacode/:pasubcode == the FMT02 oracle on 200 random edits: full row on entry, unconditional update, key output-only (body key ignored, URL key folded), absent field -> blank / zero; a vanished row -> 404 (CR-P5).
  {
    await clearRows();
    const rows = await insertRandomRows(30, true); // keys as PAR200 wrote them — the keyed routes fold the URL (G-P3 for the rest)
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "/".padEnd(100, "y") });
    const full100 = (await http("GET", `/api/parameters/PATH/${seg("")}`)).body.parm2.length; // before the random edits touch PATH
    const bad = [];
    let edits = 0;
    for (let i = 0; i < 200; i++) {
      const table = await allRows();
      const target = pick(table);
      const url = `/api/parameters/${seg(target.pacode)}/${seg(target.pasubcode)}`;
      const entry = await http("GET", url);
      if (entry.status !== 200 || !same(entry.body, target)) { bad.push({ step: "entry", target, entry }); continue; }
      const body = {};
      if (randInt(0, 3) > 0) body.parm1 = randStr(10, KEY_CHARS + "  ");
      if (randInt(0, 3) > 0) body.parm2 = randStr(100, KEY_CHARS + "  ");
      if (randInt(0, 3) > 0) body.parm3 = randStr(2, KEY_CHARS);
      if (randInt(0, 3) > 0) body.parm4 = randInt(-9, 9);
      if (randInt(0, 3) > 0) body.parm5 = randInt(-999, 999);
      if (randInt(0, 1)) { body.pacode = "OTHER"; body.pasubcode = "X"; } // key is output-only on FMT02
      const want = { pacode: target.pacode, pasubcode: target.pasubcode, ...oracleTyped(body) };
      const res = await http("PUT", url, body);
      const stored = (await allRows()).find((r) => r.pacode === target.pacode && r.pasubcode === target.pasubcode);
      const other = (await allRows()).find((r) => r.pacode === "OTHER");
      edits++;
      if (res.status !== 200 || !same(res.body, want) || !same(stored, want) || other) bad.push({ step: "update", target, body, res, want, stored, other });
    }
    // Lower-case URL key folds like the display (option 2 came from the subfile row; here the key is typed).
    await insertRow({ pacode: "EDIT", pasubcode: "ME", parm1: "OLD" });
    const folded = await http("PUT", "/api/parameters/edit/me", { parm1: "new" });
    // Unchanged panel: PUT with the row's own values still answers 200 (update issued, no 'changed?' test).
    const unchanged = await http("PUT", "/api/parameters/EDIT/ME", { parm1: "NEW" });
    // Vanished row (CR-P5): 404 with the key, on PUT and on GET.
    const gonePut = await http("PUT", "/api/parameters/GONE/1", { parm2: "/x/" });
    const goneGet = await http("GET", "/api/parameters/GONE/1");
    // A key containing '/' (legal in the 10A field) — how the URL form addresses it is recorded as detail, not asserted.
    await insertRow({ pacode: "A/B", pasubcode: "C/D", parm1: "SLASH" });
    const slashKey = { encoded: (await http("GET", "/api/parameters/A%2FB/C%2FD")).status, raw: (await http("GET", "/api/parameters/A/B/C/D")).status };
    record("P16", "c04", `GET + PUT == FMT02 oracle on ${edits} random edits over ${rows.length + 1} rows: entry returns the full row (PARM2 at 100), update is unconditional and partial bodies blank / zero the absent fields, the key is output-only (a body key is ignored, no OTHER row appears), URL key folded to upper case; unchanged values still 200; vanished row -> 404 PARAMETER_NOT_FOUND with the key on PUT and GET (CR-P5)`, bad.length === 0 && edits === 200 && folded.status === 200 && folded.body.parm1 === "NEW" && unchanged.status === 200 && gonePut.status === 404 && same(gonePut.body, { code: "PARAMETER_NOT_FOUND", message: "Parameter (GONE, 1) not found", pacode: "GONE", pasubcode: "1" }) && goneGet.status === 404 && full100 === 100, { edits, bad: bad.slice(0, 3), folded: folded.body, gonePut: gonePut.body, full100, slashKey });
  }

  // P17: c05 — DELETE: 204 whether or not the row exists, empty body, no confirmation, no in-use check (PATH deletable, getPath then ''), a blank/blank key deletes only the blank/blank row; other rows untouched.
  {
    await clearRows();
    const rows = await insertRandomRows(20, true);
    await insertRow({ pacode: "PATH", pasubcode: "", parm2: "/out/" });
    await insertRow({ pacode: "", pasubcode: "", parm1: "BLANKROW" });
    const before = (await allRows()).length;
    const del1 = await http("DELETE", `/api/parameters/${seg(rows[0].pacode)}/${seg(rows[0].pasubcode)}`);
    const del1again = await http("DELETE", `/api/parameters/${seg(rows[0].pacode)}/${seg(rows[0].pasubcode)}`);
    const delNever = await http("DELETE", "/api/parameters/NEVER/EXISTED");
    const pathBefore = await f.getPath();
    const delPath = await http("DELETE", `/api/parameters/PATH/${seg("")}`);
    const pathAfter = [await f.getPath(), (await http("GET", "/api/parameters/path")).body];
    const delBlank = await http("DELETE", `/api/parameters/${seg("")}/${seg("")}`);
    const after = await allRows();
    const untouched = rows.slice(1).every((r) => after.some((a) => same(a, r)));
    record("P17", "c05", `DELETE answers 204 with an empty body for an existing row, for the same key again, and for a key that never existed (not-found silent, no confirmation); PATH is deletable with no in-use check — getPath and GET /api/parameters/path then answer '' (c08); a blank/blank key deletes the blank/blank row only; the other ${rows.length - 1} rows are byte-identical afterwards`, [del1, del1again, delNever, delPath, delBlank].every((r) => r.status === 204 && r.body === null) && pathBefore === "/out/" && same(pathAfter, ["", { path: "" }]) && after.length === before - 3 && untouched && !after.some((r) => r.pacode === "" && r.pasubcode === ""), { before, after: after.length, statuses: [del1.status, del1again.status, delNever.status, delPath.status, delBlank.status], pathBefore, pathAfter, untouched });
  }

  // P18: c03 / c06 CR-P2 — stateless: the list is re-read per call (created row visible at once, no duplicate after Bottom, edited values shown, deleted row gone, no ghost); the PAR HTTP surface is exactly six routes and no web page — F3 / F5 / F6 / F12 / Page Down have no counterpart beyond GET and ?offset.
  {
    await clearRows();
    for (let i = 0; i < PAR_PAGE_SIZE; i++) await http("POST", "/api/parameters", { pacode: `K${String(i).padStart(2, "0")}`, pasubcode: "" });
    const atBottom = (await http("GET", "/api/parameters")).body;
    await http("POST", "/api/parameters", { pacode: "K99", pasubcode: "", parm1: "NEWEST" });   // F6 at Bottom
    const p1 = (await http("GET", "/api/parameters")).body;
    const p2 = (await http("GET", `/api/parameters?offset=${p1.nextOffset}`)).body;
    const all = [...p1.rows, ...p2.rows].map((r) => r.pacode);
    const noDup = new Set(all).size === all.length && all.length === PAR_PAGE_SIZE + 1 && all.includes("K99");
    await http("PUT", `/api/parameters/K00/${seg("")}`, { parm1: "EDITED" });
    await http("DELETE", `/api/parameters/K01/${seg("")}`);
    const afterEdit = (await http("GET", "/api/parameters")).body.rows;
    const editedShown = afterEdit.find((r) => r.pacode === "K00")?.parm1 === "EDITED";
    const deletedGone = !afterEdit.some((r) => r.pacode === "K01") && !afterEdit.some((r) => r.pacode === "" && r.parm1 === "");
    // The route surface, by request: the six PAR200 / PATH routes answer, everything else under the prefix is 404.
    const surface = {
      "GET /api/parameters": (await http("GET", "/api/parameters")).status,
      "GET /api/parameters/path": (await http("GET", "/api/parameters/path")).status,
      "GET /api/parameters/K02/%20": (await http("GET", "/api/parameters/K02/%20")).status,
      "PUT /api/parameters/K02/%20": (await http("PUT", "/api/parameters/K02/%20", {})).status,
      "DELETE /api/parameters/K02/%20": (await http("DELETE", "/api/parameters/K02/%20")).status,
      "POST /api/parameters": (await http("POST", "/api/parameters", { pacode: "K03", pasubcode: "" })).status, // duplicate of a live row -> 400 = route exists
      "PATCH /api/parameters/K03/%20": (await http("PATCH", "/api/parameters/K03/%20", {})).status,
      "POST /api/parameters/K03/%20": (await http("POST", "/api/parameters/K03/%20", {})).status,
      "PUT /api/parameters": (await http("PUT", "/api/parameters", {})).status,
      "DELETE /api/parameters": (await http("DELETE", "/api/parameters")).status,
      "POST /api/parameters/refresh": (await http("POST", "/api/parameters/refresh", {})).status,
      "GET /parameters": (await http("GET", "/parameters")).status,
      "GET /api/parameters/K03/%20/edit": (await http("GET", "/api/parameters/K03/%20/edit")).status,
    };
    const tree = app.printRoutes({ commonPrefix: false }).split("\n").filter((l) => /param|pacode|path/i.test(l)).map((l) => l.trim());
    const sixRoutes = [surface["GET /api/parameters"], surface["GET /api/parameters/path"], surface["GET /api/parameters/K02/%20"], surface["PUT /api/parameters/K02/%20"]].every((s) => s === 200) && surface["DELETE /api/parameters/K02/%20"] === 204 && surface["POST /api/parameters"] === 400 && ["PATCH /api/parameters/K03/%20", "POST /api/parameters/K03/%20", "PUT /api/parameters", "DELETE /api/parameters", "POST /api/parameters/refresh", "GET /parameters", "GET /api/parameters/K03/%20/edit"].every((k) => surface[k] === 404);
    record("P18", "c03 / c06 CR-P2", "stateless HTTP observed as the documented delta: after a create at Bottom the next two pages hold 15 distinct keys incl. the new one (no duplicate row, c03); an edited row shows its new values and a deleted row is gone with no blank-key ghost (c04 / c05); the PAR surface is exactly six routes (GET list, GET path, GET / PUT / DELETE key, POST) — PATCH, POST on a key, PUT / DELETE on the collection, a refresh route, a /parameters web page and any deeper path are 404: F3 / F5 / F6 / F12 / Page Down exist only as GET and ?offset (c06)", atBottom.more === false && atBottom.rows.length === PAR_PAGE_SIZE && noDup && editedShown && deletedGone && sixRoutes, { atBottomLen: atBottom.rows.length, all, editedShown, deletedGone, surface, tree });
  }

  // P19: c02 / c11 CR-P4 — the writer's folding is what makes GetParm2('PATH':' ') find a row typed 'path'; a lower-case key written by another tool is listed but invisible to the getters and (observation G-P3) unaddressable by the keyed routes.
  {
    await clearRows();
    await http("POST", "/api/parameters", { pacode: "path", pasubcode: " ", parm2: "/typed-lower/" });
    const viaGetter = await f.getPath();
    const viaHttp = (await http("GET", "/api/parameters/path")).body;
    await clearRows();
    await insertRow({ pacode: "path", pasubcode: "", parm2: "/other-tool/" });   // written outside PAR200 (c02 edge "another tool")
    const getterMiss = await f.getPath();
    const listed = (await http("GET", "/api/parameters")).body.rows.map((r) => r.pacode);
    const keyedGet = await http("GET", `/api/parameters/path/${seg("")}`);
    const keyedPut = await http("PUT", `/api/parameters/path/${seg("")}`, { parm2: "/x/" });
    const keyedDel = await http("DELETE", `/api/parameters/path/${seg("")}`);
    const stillThere = (await allRows()).some((r) => r.pacode === "path" && r.parm2 === "/other-tool/");
    record("P19", "c02 / c09 CR-P4", "a key typed 'path' through the API is stored 'PATH' and found by getPath and GET /api/parameters/path (the display folding reproduced at the writer, CR-P4); a lower-case 'path' row written by another tool is listed (c01) but missed by the case-sensitive getters (c09, as on the box). Observation G-P3: that row is also unaddressable by the keyed routes — GET / PUT answer 404 for the folded key and DELETE is a silent 204 that removes nothing; PAR200 option 2 / 4 took the key from the subfile row and could edit or delete it", viaGetter === "/typed-lower/" && same(viaHttp, { path: "/typed-lower/" }) && getterMiss === "" && same(listed, ["path"]) && keyedGet.status === 404 && keyedPut.status === 404 && keyedDel.status === 204 && stillThere, { viaGetter, viaHttp, getterMiss, listed, keyedGet: keyedGet.status, keyedPut: keyedPut.status, keyedDel: keyedDel.status, stillThere });
  }

  // P20: c02 CR-P5 — the chain / write race: 24 concurrent POSTs of one key -> exactly one 201 and 23 x 400 DUPLICATE_KEY (legacy: unmonitored 01021), exactly one row.
  {
    await clearRows();
    const results = await Promise.all(Array.from({ length: 24 }, (_, i) => http("POST", "/api/parameters", { pacode: "RACE", pasubcode: "", parm1: `W${i}` })));
    const created = results.filter((r) => r.status === 201);
    const dup = results.filter((r) => r.status === 400 && r.body?.errors?.[0]?.code === "DUPLICATE_KEY" && r.body.errors[0].message === DUPLICATE_MESSAGE);
    const rows = (await allRows()).filter((r) => r.pacode === "RACE");
    record("P20", "c02 CR-P5", "24 concurrent creates of one key: exactly one 201, the other 23 answer the same 400 DUPLICATE_KEY (a lost chain/write race answers as a duplicate — legacy raised unmonitored 01021); exactly one RACE row, and its values are the winner's", created.length === 1 && dup.length === 23 && rows.length === 1 && rows[0].parm1 === created[0].body.parm1, { created: created.length, dup: dup.length, rows: rows.length, other: results.filter((r) => r.status !== 201 && r.status !== 400).map((r) => r.status) });
  }

  // P21: blank key segments over HTTP — %20 addresses the blank/blank row for GET / PUT / DELETE while the getters never see it; 'path' is the reader and never a one-segment key.
  {
    await clearRows();
    await http("POST", "/api/parameters", {});   // the blank/blank row (c02)
    await http("POST", "/api/parameters", { pacode: "PATH", pasubcode: "X", parm2: "/sub/" });
    const blankGet = await http("GET", "/api/parameters/%20/%20");
    const blankPut = await http("PUT", "/api/parameters/%20/%20", { parm1: "b" });
    const getterBlank = await f.getParm1("", "");
    const readerNoPath = (await http("GET", "/api/parameters/path")).body;   // only (PATH, X) exists
    const keyedPathX = (await http("GET", "/api/parameters/path/x")).body;
    const oneSegment = (await http("GET", "/api/parameters/PATH")).status;
    const blankDel = await http("DELETE", "/api/parameters/%20/%20");
    const left = (await allRows()).map((r) => `${r.pacode}/${r.pasubcode}`);
    record("P21", "c02 / c05 / c11", "the blank/blank row is addressed as /api/parameters/%20/%20 for GET (200), PUT (200, PARM1 folded to 'B') and DELETE (204) while getParm1('', '') stays '' (never reads); GET /api/parameters/path answers '' when only (PATH, X) exists and /api/parameters/path/x returns that row; a one-segment /api/parameters/PATH is not a route (404)", blankGet.status === 200 && same(blankGet.body, { ...CLEARED }) && blankPut.status === 200 && blankPut.body.parm1 === "B" && getterBlank === "" && same(readerNoPath, { path: "" }) && keyedPathX.parm2 === "/sub/" && oneSegment === 404 && blankDel.status === 204 && same(left, ["PATH/X"]), { blankGet: blankGet.body, blankPut: blankPut.body, getterBlank, readerNoPath, keyedPathX, oneSegment, left });
  }

  // P22: scope — no PAR OpenAPI file (contract_paths: []), no web page, features/order and features/customer not touched by the PAR pack, schema section additive (checked in the shell too: first 332 lines byte-identical to ae99393).
  {
    const openapi = readdirSync(join(modernRoot, "openapi")).sort();
    const parFiles = readdirSync(join(modernRoot, "src", "features", "par")).sort();
    const parmFiles = readdirSync(join(modernRoot, "src", "shared", "parm")).sort();
    const webPage = existsSync(join(modernRoot, "src", "features", "par", "par.web.ts"));
    const schema = readFileSync(join(modernRoot, "db", "schema.sql"), "utf8").split("\n");
    const parStart = schema.findIndex((l) => /atuMerlin PAR vertical/.test(l));
    const parSection = schema.slice(parStart).join("\n");
    const createCount = (parSection.match(/CREATE TABLE IF NOT EXISTS parameter/g) ?? []).length;
    const altersOthers = /ALTER TABLE\s+(customer|orders|detord|article|vatdef|country|samlog)\b|DROP\s+/i.test(parSection);
    const logSectionStart = schema.findIndex((l, i) => i > parStart && /atuMerlin LOG vertical/.test(l));
    record("P22", "scope", `no PAR OpenAPI (openapi/ = customer.yaml, order.yaml), no par.web.ts; features/par = ${parFiles.join(", ")}; shared/parm = index.ts; the PAR section of db/schema.sql starts at line ${parStart + 1}, creates one table and alters / drops nothing (the LOG section follows at line ${logSectionStart + 1})`, same(openapi, ["customer.yaml", "order.yaml"]) && !webPage && same(parFiles, ["index.ts", "par.repository.ts", "par.routes.ts", "par.service.ts"]) && same(parmFiles, ["index.ts"]) && parStart > 300 && createCount === 1 && !altersOthers && logSectionStart > parStart, { openapi, parFiles, parmFiles, webPage, parStart: parStart + 1, createCount, altersOthers, logSectionStart: logSectionStart + 1 });
  }
} finally {
  await app.close();
  await t.close();
}

// --- Summary --------------------------------------------------------------------------------------

const pass = results.filter((r) => r.pass).length;
const fail = results.length - pass;
const out = {
  pack: "atu-merlin-ts-par-v1@1",
  characterization: "WAIVED_PATHFINDER",
  oracle: "discovery/par-maintain/features c01..c13 (PAR300 chainPARAMETER replayed as a buffer machine incl. its cache to characterise CR-P1; PAR200 s01lod keyed read replayed in JS over byte order; FMT03 / FMT02 / option 4 modelled from the cards; PAR201 *TCAT pattern) + modern/README.md PAR section; NOT IBM i goldens",
  ran_at: new Date().toISOString(),
  summary: { pass, fail, total: results.length },
  cases: results,
};
writeFileSync(join(here, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
