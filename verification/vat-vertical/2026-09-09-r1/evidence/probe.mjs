#!/usr/bin/env node
// Independent COMPARE probe at the TypeScript boundary — pack atu-merlin-ts-vat-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/vat-module/features, c01 arithmetic and c02/c04/c05 buffer rules)
// + modern/README.md (VAT section). NOT IBM i goldens: nothing here is a claim of parity against the box.
//
// The c01 oracle is written from the card, not copied from the module or its vitest suite: it evaluates
// the RPG statements literally — `tot = (net * vatrate) / 100` assigned to an 11P 4 field (truncation,
// no (h) extender) and then `%dech(tot : 9 : 2)` (half-adjust, half away from zero) — in BigInt on
// exact decimal scales. The module does a one-step rounding in integer hundredths; the card claims the
// two agree, and this probe is what checks that claim.
//
//   cd modern && ./scripts/local-pg.sh start
//   DATABASE_URL=$(./scripts/local-pg.sh url) npx tsx ../verification/vat-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Needs a live DATABASE_URL (the module is probed against a
// throw-away schema built and seeded by modern/test/helpers/db.ts and dropped at the end).

import { writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { randomBytes } from "node:crypto";
import * as fvatModule from "../../../../modern/src/shared/fvat/index.ts";
import { createFArticle } from "../../../../modern/src/shared/farticle/index.ts";
import { createTestDb } from "../../../../modern/test/helpers/db.ts";

const { clcVatWithRate, createFVat, normaliseVatCode } = fvatModule;

const here = dirname(fileURLToPath(import.meta.url));
const modernRoot = join(here, "../../../../modern");
const results = [];

function record(id, card, name, pass, detail) {
  results.push({ id, card, name, pass: Boolean(pass), detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${name}${pass ? "" : "  <-- " + JSON.stringify(detail)}`);
}

// --- Oracle from the cards -------------------------------------------------------------------

/** Truncating integer division toward zero (RPG assignment without (h)). */
function truncDiv(a, b) {
  return a / b; // BigInt division truncates toward zero
}
/** Half-adjust (round half away from zero) integer division (RPG %dech). */
function roundHalfAwayDiv(a, b) {
  const q = a / b;
  const r = a % b;
  const twice = (r < 0n ? -r : r) * 2n;
  if (twice >= b) return a < 0n ? q - 1n : q + 1n;
  return q;
}

const LIMIT_11P4 = 10n ** 11n; // 11 digits: 7 integer + 4 decimals
const LIMIT_9P2 = 10n ** 9n; // 9 digits: 7 integer + 2 decimals

/**
 * c01 "Behaviour as implemented", steps 2-3, evaluated literally:
 *   netCents (9P 2 as integer cents), rateH (4P 2 as integer hundredths of a percent).
 *   (net * rate) / 100 exact = netCents * rateH in 1e-6 currency units.
 *   tot 11P 4 <- truncate to 1e-4;  return %dech(tot : 9 : 2) -> cents.
 * Throws if the 11P 4 or 9P 2 field would overflow (the card says it cannot).
 */
function oracleClcVatCents(netCents, rateH) {
  const micro = BigInt(netCents) * BigInt(rateH);
  const tot4 = truncDiv(micro, 100n);
  const abs4 = tot4 < 0n ? -tot4 : tot4;
  if (abs4 >= LIMIT_11P4) throw new Error(`11P 4 overflow: ${tot4}`);
  const cents = roundHalfAwayDiv(tot4, 100n);
  const absC = cents < 0n ? -cents : cents;
  if (absC >= LIMIT_9P2) throw new Error(`9P 2 overflow: ${cents}`);
  return cents;
}

/** Module value -> integer cents, exact for any value the module can return (2 dp). */
function toCents(v) {
  return BigInt(Math.round(v * 100));
}

function randInt(min, max) {
  // inclusive; uses 6 random bytes for a 48-bit uniform
  const span = max - min + 1;
  const r = Number.parseInt(randomBytes(6).toString("hex"), 16) / 2 ** 48;
  return min + Math.floor(r * span);
}

// --- Sweep definitions -------------------------------------------------------------------------

const RATES_H = [0, 1, 550, 1000, 1250, 2000, 3333, 405, 9999]; // 0 / 0.01 / 5.5 / 10 / 12.5 / 20 / 33.33 / 4.05 / 99.99 %
const NET_SWEEP_MIN = -100_000; // -1000.00
const NET_SWEEP_MAX = 100_000; // 1000.00
const RANDOM_PAIRS = 200_000;

// --- c01 arithmetic at the pure boundary ------------------------------------------------------

{
  let checked = 0;
  let mismatches = [];
  let negZero = 0;
  for (const rateH of RATES_H) {
    const rate = rateH / 100;
    for (let c = NET_SWEEP_MIN; c <= NET_SWEEP_MAX; c++) {
      const got = clcVatWithRate(c / 100, rate);
      if (Object.is(got, -0)) negZero++;
      const want = oracleClcVatCents(c, rateH);
      if (toCents(got) !== want) mismatches.push({ netCents: c, rateH, got, want: Number(want) / 100 });
      checked++;
    }
  }
  record("P01", "c01", `clcVatWithRate == literal RPG oracle (truncate 11P 4, then %dech 9 2) on the cent sweep: ${checked} pairs (${NET_SWEEP_MIN}..${NET_SWEEP_MAX} cents x ${RATES_H.length} rates)`,
    mismatches.length === 0 && negZero === 0, { checked, mismatches: mismatches.length, negZero, sample: mismatches.slice(0, 10) });

  const rnd = [];
  let mism = [];
  let overflow = 0;
  let maxTot4 = 0n;
  for (let i = 0; i < RANDOM_PAIRS; i++) {
    const c = randInt(-999_999_999, 999_999_999);
    const rateH = randInt(0, 9999);
    rnd.push([c, rateH]);
    let want;
    try {
      want = oracleClcVatCents(c, rateH);
    } catch {
      overflow++;
      continue;
    }
    const abs4 = BigInt(c) * BigInt(rateH) / 100n;
    if ((abs4 < 0n ? -abs4 : abs4) > maxTot4) maxTot4 = abs4 < 0n ? -abs4 : abs4;
    const got = clcVatWithRate(c / 100, rateH / 100);
    if (toCents(got) !== want) mism.push({ netCents: c, rateH, got, want: Number(want) / 100 });
  }
  record("P02", "c01", `clcVatWithRate == literal RPG oracle on ${RANDOM_PAIRS} random (9P 2 net, 4P 2 rate) pairs across the full field ranges, negatives included; 11P 4 / 9P 2 never overflow`,
    mism.length === 0 && overflow === 0, { checked: RANDOM_PAIRS, mismatches: mism.length, oracleOverflows: overflow, maxTot4AsDecimal: `${Number(maxTot4) / 1e4}`, sample: mism.slice(0, 10) });

  const ext = {
    max: clcVatWithRate(9_999_999.99, 99.99),
    min: clcVatWithRate(-9_999_999.99, 99.99),
    wantMax: Number(oracleClcVatCents(999_999_999, 9999)) / 100,
  };
  record("P03", "c01", "9 2 x 4 2 extremes: 9,999,999.99 at 99.99% and its negative agree with the oracle, no overflow path", ext.max === ext.wantMax && ext.min === -ext.wantMax, ext);

  // Ties at the third decimal: the value that decides "truncate then half-adjust" vs "one step".
  const ties = [
    [5, 550, 0], // 0.00275 -> tot 0.0027 -> 0.00
    [10, 550, 1], // 0.0055 -> 0.01
    [2, 1250, 0], // 0.0025 -> 0.00
    [6, 1250, 1], // 0.0075 -> 0.01
    [1235, 405, 50], // 0.500175 -> tot 0.5001 -> 0.50
    [-6, 1250, -1],
    [-5, 550, 0],
  ].map(([c, rH, wantC]) => ({ c, rH, got: clcVatWithRate(c / 100, rH / 100), want: wantC / 100, oracle: Number(oracleClcVatCents(c, rH)) / 100 }));
  record("P04", "c01", "third-decimal ties and six-decimal quotients: module == oracle == the card's worked values; symmetric about zero", ties.every((t) => t.got === t.want && t.oracle === t.want), ties);

  record("P05", "c01", "returns the VAT amount, not the gross: 100.00 at 20% -> 20.00 (not 120.00); 0 at any rate -> 0; any net at 0% -> 0",
    clcVatWithRate(100, 20) === 20 && clcVatWithRate(0, 20) === 0 && clcVatWithRate(12345.67, 0) === 0, { at20: clcVatWithRate(100, 20) });
}

// --- Contract edge: what the module does with a net that is not decimal(9,2) (c10 / CR-V3) --------

{
  // RPG by-value conversion to 9P 2 truncates extra decimals (no half adjust); the module rounds them.
  const subCent = [
    { net: 0.075, rate: 20, module: clcVatWithRate(0.075, 20), rpgTruncNet: 0.07, oracleFromTruncNet: Number(oracleClcVatCents(7, 2000)) / 100 },
    { net: 1.035, rate: 20, module: clcVatWithRate(1.035, 20), rpgTruncNet: 1.03, oracleFromTruncNet: Number(oracleClcVatCents(103, 2000)) / 100 },
    { net: 0.045, rate: 20, module: clcVatWithRate(0.045, 20), rpgTruncNet: 0.04, oracleFromTruncNet: Number(oracleClcVatCents(4, 2000)) / 100 },
  ];
  const differs = subCent.filter((s) => s.module !== s.oracleFromTruncNet);
  const beyond = { net: 10_000_000, rate: 20, module: clcVatWithRate(10_000_000, 20), threw: false };
  // Observation, recorded as PASS-with-detail: the module accepts these inputs silently; see REPORT.md G-V1.
  record("P06", "c10/G-V1", "OBSERVATION (not a card check): `net` is not normalised to decimal(9,2) — sub-cent nets are rounded (RPG by-value would truncate) and |net| > 9,999,999.99 computes with no guard; no modern caller passes either (ORD passes round2(qty x price) and checks TOTPRICE_MAX)",
    true, { subCentCasesWhereRoundingChangesTheResult: differs, beyondNineTwo: beyond });
}

// --- Against the database ---------------------------------------------------------------------

const t = await createTestDb();
let queryCount = 0;
let lastSql = "";
const countingDb = new Proxy(t.db, {
  get(target, prop, receiver) {
    if (prop === "query") {
      return (...args) => {
        queryCount++;
        lastSql = String(args[0]);
        return target.query(...args);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});
const f = createFVat(countingDb);
const fa = createFArticle(t.db);

async function insertVatDef(vatcode, vatrate, vatdesc = "", vatdel = " ") {
  await t.db.query(
    `INSERT INTO vatdef (vatcode, vatrate, vatdesc, vatcrea, vatmod, vatmodid, vatdel)
     VALUES ($1, $2, $3, CURRENT_DATE, LOCALTIMESTAMP, 'PROBE', $4)
     ON CONFLICT (vatcode) DO UPDATE SET vatrate = EXCLUDED.vatrate, vatdesc = EXCLUDED.vatdesc, vatdel = EXCLUDED.vatdel`,
    [vatcode, vatrate, vatdesc, vatdel],
  );
}

try {
  // P07: c01 through VATDEF — fixture codes 1 / 2 / 3 (5.5 / 20 / 10 %) on random nets.
  {
    const codes = { 1: 550, 2: 2000, 3: 1000 };
    let mism = [];
    let n = 0;
    for (const [code, rateH] of Object.entries(codes)) {
      for (let i = 0; i < 1500; i++) {
        const c = randInt(-999_999_999, 999_999_999);
        const got = await f.clcVat(code, c / 100);
        const want = oracleClcVatCents(c, rateH);
        if (toCents(got) !== want) mism.push({ code, netCents: c, got, want: Number(want) / 100 });
        n++;
      }
    }
    record("P07", "c01", `ClcVAT through vatdef (codes 1/2/3 = 5.5/20/10 %) == oracle on ${n} random nets`, mism.length === 0, { checked: n, mismatches: mism.length, sample: mism.slice(0, 5) });
  }

  // P08: c02 unknown code -> cleared buffer, silently, for every printable ASCII code not in the table.
  {
    const known = new Set((await t.db.query("SELECT vatcode FROM vatdef")).rows.map((r) => r.vatcode));
    const unknown = [];
    for (let ch = 0x21; ch <= 0x7e; ch++) {
      const c = String.fromCharCode(ch);
      if (!known.has(c)) unknown.push(c);
    }
    unknown.push("\u00e9", "\u20ac", "\ud83d\ude00"); // e-acute, euro sign, one emoji (surrogate pair)
    let bad = [];
    let threw = [];
    for (const c of unknown) {
      try {
        const r = await f.getVatRate(c);
        const d = await f.getVatDesc(c);
        const v = await f.clcVat(c, 149.9);
        const e = await f.existVatRate(c);
        if (!(r === 0 && d === "" && v === 0 && e === false)) bad.push({ c, r, d, v, e });
      } catch (err) {
        threw.push({ c, err: String(err.message ?? err) });
      }
    }
    record("P08", "c02", `unknown code -> rate 0, description blank, VAT 0, exists false, no exception: ${unknown.length} codes (printable ASCII not in the table + 3 non-ASCII)`, bad.length === 0 && threw.length === 0, { codes: unknown.length, bad: bad.slice(0, 5), threw: threw.slice(0, 5) });
  }

  // P09: c02 a zero-rated line and an unknown-code line are indistinguishable by amount.
  {
    await insertVatDef("0", 0, "Zero rated");
    const nets = [0.01, 10, 149.9, 9_999_999.99, -25.5];
    const same = [];
    for (const n of nets) same.push([await f.clcVat("0", n), await f.clcVat("9", n), await f.getVatRate("0"), await f.getVatRate("9")]);
    record("P09", "c02", "zero-rated (row with rate 0) and unknown code give identical amounts and rates (planted defect preserved: nothing downstream can tell them apart)", same.every(([a, b, c, d]) => a === b && a === 0 && c === d && c === 0), same);
  }

  // P10: c03 getters return the raw VATDEF fields; 20A description round-trips; 21 chars rejected by varchar(20).
  {
    const desc20 = "ABCDEFGHIJKLMNOPQRST";
    await insertVatDef("T", 7.25, desc20);
    const got = { rate: await f.getVatRate("T"), desc: await f.getVatDesc("T"), rateType: typeof (await f.getVatRate("T")) };
    let tooLong = null;
    try {
      await insertVatDef("U", 1, desc20 + "U");
    } catch (err) {
      tooLong = err.code;
    }
    record("P10", "c03", "GetVATRate / GetVATDesc return the raw row fields (rate as a number, 20-char description intact); a 21-char description is rejected by varchar(20) (22001)", got.rate === 7.25 && got.desc === desc20 && got.rateType === "number" && tooLong === "22001", { ...got, tooLongCode: tooLong });
  }

  // P11: c03 ClcVAT then GetVATRate for the same code agree (the ORD100/ORD101 line-panel sequence).
  {
    let bad = [];
    for (const [code, rateH] of [["1", 550], ["2", 2000], ["3", 1000]]) {
      for (let i = 0; i < 200; i++) {
        const c = randInt(-99_999_999, 99_999_999);
        const vat = await f.clcVat(code, c / 100);
        const rate = await f.getVatRate(code);
        if (rate !== rateH / 100 || toCents(vat) !== oracleClcVatCents(c, BigInt(Math.round(rate * 100)))) bad.push({ code, c, vat, rate });
      }
    }
    record("P11", "c03", "ClcVAT followed by GetVATRate for the same code: the displayed rate is the rate the amount was computed with (600 line prepares)", bad.length === 0, { bad: bad.slice(0, 5) });
  }

  // P12: c04 ExistVATRate = %found and VATDEL <> 'X'; only the literal uppercase X counts.
  {
    const flags = ["X", "x", " ", "D", "Y", "1", "*"];
    const rows = [];
    for (let i = 0; i < flags.length; i++) {
      const code = String.fromCharCode(0x41 + i); // A..G
      await insertVatDef(code, 3, `flag ${flags[i]}`, flags[i]);
      rows.push({ code, vatdel: flags[i], exists: await f.existVatRate(code) });
    }
    rows.push({ code: "9", vatdel: "(no row)", exists: await f.existVatRate("9") });
    rows.push({ code: "2", vatdel: "(seed, blank)", exists: await f.existVatRate("2") });
    const ok = rows.every((r) => r.exists === (r.vatdel !== "X" && r.vatdel !== "(no row)"));
    record("P12", "c04", "ExistVATRate truth table: row present and VATDEL <> 'X' -> true; 'X' -> false; lower-case x and any other flag -> true; missing -> false", ok, rows);
  }

  // P13: c04 a soft-deleted rate is still applied by the other three exports (as-is, needs-SME).
  {
    await insertVatDef("D", 7, "Retired rate", "X");
    const got = { clc: await f.clcVat("D", 100), rate: await f.getVatRate("D"), desc: await f.getVatDesc("D"), exists: await f.existVatRate("D") };
    record("P13", "c04", "soft-deleted row (VATDEL = 'X'): ClcVAT applies 7% -> 7.00, GetVATRate 7, GetVATDesc 'Retired rate', ExistVATRate false (inconsistency preserved, not fixed)", got.clc === 7 && got.rate === 7 && got.desc === "Retired rate" && got.exists === false, got);
  }

  // P14: c05 blank code never reads VATDEF — zero SQL statements, even with a blank-keyed row present.
  {
    await insertVatDef(" ", 99, "Blank key row");
    queryCount = 0;
    const got = { rateSp: await f.getVatRate(" "), rateEmpty: await f.getVatRate(""), desc: await f.getVatDesc(" "), clc: await f.clcVat(" ", 100), clcEmpty: await f.clcVat("", 100), exists: await f.existVatRate(" ") };
    const q = queryCount;
    const rowThere = (await t.db.query("SELECT vatrate FROM vatdef WHERE vatcode = ' '")).rows[0]?.vatrate;
    record("P14", "c05", "blank / empty code: cleared buffer from all four exports and 0 SQL statements issued, although a row keyed ' ' (rate 99) exists", q === 0 && got.rateSp === 0 && got.rateEmpty === 0 && got.desc === "" && got.clc === 0 && got.clcEmpty === 0 && got.exists === false && rowThere === 99, { ...got, sqlStatements: q, blankRowRate: rowThere });
  }

  // P15: c05 / c06 / CR-V1 — no last-key cache: every non-blank call issues one read, repeats included.
  {
    queryCount = 0;
    await f.getVatRate("2");
    await f.getVatRate("2");
    await f.clcVat("2", 10);
    await f.getVatDesc("2");
    await f.existVatRate("2");
    await f.getVatRate("9");
    await f.getVatRate("9");
    const q = queryCount;
    record("P15", "c05/c06 CR-V1", "no cache (deliberate delta): 7 non-blank calls (5 repeats of code 2, 2 repeats of unknown 9) issue exactly 7 keyed reads; each read is a parameterised SELECT ... WHERE vatcode = $1", q === 7 && /WHERE vatcode = \$1/.test(lastSql) && !/\+|\$\{/.test(lastSql), { sqlStatements: q, lastSql });
  }

  // P16: c06 a changed row is seen at once; a code added after a miss is seen (misses never stuck in legacy either).
  {
    const before = await f.getVatRate("3");
    await t.db.query("UPDATE vatdef SET vatrate = 12 WHERE vatcode = '3'");
    const after = await f.getVatRate("3");
    const clcAfter = await f.clcVat("3", 100);
    const missFirst = await f.getVatRate("7");
    await insertVatDef("7", 7.7, "Late arrival");
    const hitNext = await f.getVatRate("7");
    record("P16", "c06", "changed row seen on the very next call (10 -> 12, CR-V1: legacy would hold 10 for the session); code added after a miss seen on the next call (matches legacy)", before === 10 && after === 12 && clcAfter === 12 && missFirst === 0 && hitNext === 7.7, { before, after, clcAfter, missFirst, hitNext });
  }

  // P17: c07 absence — no HTTP route for VAT, no writer of vatdef in modern/src outside the ORD dev seed.
  {
    function walk(dir, out = []) {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.ts$/.test(p)) out.push(p);
      }
      return out;
    }
    const files = walk(join(modernRoot, "src"));
    const writers = [];
    const routes = [];
    for (const p of files) {
      const text = readFileSync(p, "utf8");
      if (/(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+vatdef/i.test(text)) writers.push(relative(modernRoot, p));
      if (/['"`]\/api\/vat|['"`]\/vat/i.test(text)) routes.push(relative(modernRoot, p));
    }
    const openapi = readdirSync(join(modernRoot, "openapi"));
    record("P17", "c07", "no maintenance path built: no /vat or /api/vat route in src, no OpenAPI file for VAT, the only vatdef writer in src is the ORD dev seed (order.seed.ts, CR-V4)", routes.length === 0 && writers.length === 1 && /order\.seed\.ts$/.test(writers[0]) && !openapi.some((f) => /vat/i.test(f)), { routes, writers, openapi });
  }

  // P18: c08 two hops — unknown article -> blank code from FARTICLE -> zero VAT with no vatdef read; ORD source still calls clcVat then getVatRate.
  {
    const code = await fa.getArtVatCode("ZZZZZZ");
    queryCount = 0;
    const vat = await f.clcVat(code, 149.9);
    const q = queryCount;
    const knownCode = await fa.getArtVatCode("A00001");
    const knownVat = await f.clcVat(knownCode, 149.9);
    const svc = readFileSync(join(modernRoot, "src/features/order/order.service.ts"), "utf8");
    const seq = /fvat\.clcVat\(vatCode,\s*odtot\)[\s\S]*fvat\.getVatRate\(vatCode\)/.test(svc) && /farticle\.getArtVatCode\(odarid\)/.test(svc);
    record("P18", "c08", "FARTICLE -> FVAT: unknown article gives blank code -> VAT 0 with 0 vatdef reads; article A00001 (code 2) -> 29.98 on 149.90; order.service.ts (read-only) still goes getArtVatCode -> clcVat -> getVatRate", code === "" && vat === 0 && q === 0 && knownCode === "2" && knownVat === 29.98 && seq, { unknownArticleCode: JSON.stringify(code), vat, vatdefReads: q, knownCode, knownVat, ordSequence: seq });
  }

  // P19: c09 export surface — exactly the four binder symbols as methods; no close; module exports the two pure helpers.
  {
    const methods = Object.keys(f).sort();
    const modExports = Object.keys(fvatModule).sort();
    record("P19", "c09", "FVat has exactly the four binder exports (clcVat, existVatRate, getVatDesc, getVatRate) and nothing named close*; the module also exports clcVatWithRate, createFVat, normaliseVatCode only", JSON.stringify(methods) === JSON.stringify(["clcVat", "existVatRate", "getVatDesc", "getVatRate"]) && JSON.stringify(modExports) === JSON.stringify(["clcVatWithRate", "createFVat", "normaliseVatCode"]) && !modExports.some((k) => /close/i.test(k)), { methods, modExports });
  }

  // P20: c10 / CR-V3 — the 1A by-value code: first character, empty -> blank, case-sensitive like the keyed CHAIN.
  {
    // 'q' / 'Q': neither is inserted by any other case (P12 used A..G).
    await insertVatDef("q", 3, "lower q");
    const norm = { "2": normaliseVatCode("2"), "2X": normaliseVatCode("2X"), "": normaliseVatCode(""), " ": normaliseVatCode(" "), "  ": normaliseVatCode("  "), "x2": normaliseVatCode("x2") };
    const viaDb = { "2X": await f.getVatRate("2X"), q: await f.getVatRate("q"), Q: await f.getVatRate("Q"), " 2": await f.getVatRate(" 2") };
    queryCount = 0;
    await f.getVatRate(" 2");
    const blankFirstReads = queryCount;
    record("P20", "c10 CR-V3", "normaliseVatCode: first character kept ('2X' -> '2'), '' -> ' ', 'x2' -> 'x'; through the table 'q' (3%) != 'Q' (unknown, 0); ' 2' is the blank code (0, no read)",
      norm["2"] === "2" && norm["2X"] === "2" && norm[""] === " " && norm[" "] === " " && norm["  "] === " " && norm["x2"] === "x" && viaDb["2X"] === 20 && viaDb.q === 3 && viaDb.Q === 0 && viaDb[" 2"] === 0 && blankFirstReads === 0, { norm, viaDb, blankFirstReads });
  }

  // P21: schema — vatdef maps VATDEF.PF column-for-column; PK on vatcode is the only index; comments present.
  {
    const cols = (await t.db.query(
      `SELECT column_name, data_type, character_maximum_length AS len, numeric_precision AS p, numeric_scale AS s, is_nullable, column_default
       FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'vatdef' ORDER BY ordinal_position`, [t.schema],
    )).rows;
    const shape = cols.map((c) => [c.column_name, c.data_type, c.len, c.p, c.s]);
    const wantShape = [
      ["vatcode", "character", 1, null, null],
      ["vatrate", "numeric", null, 4, 2],
      ["vatdesc", "character varying", 20, null, null],
      ["vatcrea", "date", null, null, null],
      ["vatmod", "timestamp without time zone", null, null, null],
      ["vatmodid", "character varying", 10, null, null],
      ["vatdel", "character", 1, null, null],
    ];
    const idx = (await t.db.query(`SELECT indexname FROM pg_indexes WHERE schemaname = $1 AND tablename = 'vatdef' ORDER BY indexname`, [t.schema])).rows.map((r) => r.indexname);
    const comments = (await t.db.query(
      `SELECT obj_description(($1 || '.vatdef')::regclass, 'pg_class') AS tbl,
              col_description(($1 || '.vatdef')::regclass, 2) AS rate, col_description(($1 || '.vatdef')::regclass, 7) AS del`, [t.schema],
    )).rows[0];
    record("P21", "schema", "vatdef: VATCODE char(1) PK, VATRATE numeric(4,2), VATDESC varchar(20), VATCREA date, VATMOD timestamp, VATMODID varchar(10), VATDEL char(1); the PK is the only index (no LF over VATDEF); table / rate / del comments cite c07 / c02 / c04",
      JSON.stringify(shape) === JSON.stringify(wantShape) && idx.length === 1 && /pkey/.test(idx[0]) && /c07/.test(comments.tbl ?? "") && /c02/.test(comments.rate ?? "") && /c04/.test(comments.del ?? ""), { shape, idx, comments });
  }

  // P22: schema — the 4P 2 rate field bound is enforced by numeric(4,2): 99.99 accepted, 100 rejected (22003).
  {
    let tooBig = null;
    await insertVatDef("M", 99.99, "max rate");
    try {
      await insertVatDef("N", 100, "over 4 2");
    } catch (err) {
      tooBig = err.code;
    }
    const maxRate = await f.getVatRate("M");
    record("P22", "schema/c01", "VATRATE 4P 2 bound: 99.99 stored and read back; 100.00 rejected by numeric(4,2) (22003) — the c01 'no overflow' argument rests on this bound", maxRate === 99.99 && tooBig === "22003", { maxRate, tooBigCode: tooBig });
  }

  // P23: ORD fixture path (CR-V4) — the three seed codes are the ORD dev fixture, reset restores them.
  {
    await t.reset();
    const rows = (await t.db.query("SELECT vatcode, vatrate, vatdesc, vatmodid FROM vatdef ORDER BY vatcode")).rows;
    record("P23", "c07 CR-V4", "after reset only the ORD dev fixture rows remain (1 = 5.5 Reduced, 2 = 20 Standard, 3 = 10 Intermediate, vatmodid SEED): VATDEF content arrives through the ORD seed, not a VAT surface", JSON.stringify(rows) === JSON.stringify([
      { vatcode: "1", vatrate: 5.5, vatdesc: "Reduced", vatmodid: "SEED" },
      { vatcode: "2", vatrate: 20, vatdesc: "Standard", vatmodid: "SEED" },
      { vatcode: "3", vatrate: 10, vatdesc: "Intermediate", vatmodid: "SEED" },
    ]), rows);
  }
} finally {
  await t.close();
}

// --- Summary --------------------------------------------------------------------------------------

const pass = results.filter((r) => r.pass).length;
const fail = results.length - pass;
const out = {
  pack: "atu-merlin-ts-vat-v1@1",
  characterization: "WAIVED_PATHFINDER",
  oracle: "discovery/vat-module/features (c01 arithmetic evaluated literally as RPG: truncate to 11P 4, %dech to 9P 2; c02/c04/c05 buffer rules) + modern/README.md VAT section; NOT IBM i goldens",
  sweep: { centRange: [NET_SWEEP_MIN, NET_SWEEP_MAX], ratesHundredths: RATES_H, randomPairs: RANDOM_PAIRS },
  ran_at: new Date().toISOString(),
  summary: { pass, fail, total: results.length },
  cases: results,
};
writeFileSync(join(here, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
