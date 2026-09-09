/**
 * FCOUNTRY shared module (COU300 ExistCountry, GetCountryName, GetCountryIso3; COU301 SltCountry)
 * at the TypeScript boundary — pack atu-merlin-ts-cou-v1@1, WAIVED_PATHFINDER (no IBM i goldens;
 * expected values are derived from the cards, not recorded on the box). Cards: cou-maintain-c07
 * (cached keyed chain), c08 (unused export / no close), c09 (selection window load and return),
 * c10 (F8 toggle), c11 (option rules 35 / 36 / 41 / 42), c12 (export surface).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  COID_LENGTH,
  COUNTR_LENGTH,
  SLT_LOAD_SIZE,
  createFCountry,
  normaliseCountryCode,
  normaliseCountryName,
  sltCountryAct,
  sltCountryCheck,
  sltCountryOpen,
  sltCountryRequest,
  type FCountry,
  type SltCountryState,
} from "../src/shared/fcountry/index.js";
import { COUNTRY_FIXTURE } from "../src/db/seed.js";
import { createTestDb, type TestDb } from "./helpers/db.js";

let t: TestDb;
let f: FCountry;

beforeAll(async () => {
  t = await createTestDb();
  f = createFCountry(t.db);
});
afterAll(() => t.close());
beforeEach(async () => {
  await t.reset();
  // `reset` re-seeds the eight CUS fixture countries but does not clear rows a test added.
  await t.db.query("DELETE FROM country WHERE coid <> ALL($1::varchar[])", [COUNTRY_FIXTURE.map((c) => c.coid)]);
});

/** Fixture path (COU200 is the only legacy writer and is deferred): a COUNTRY row the seed does not carry. */
async function insertCountry(coid: string, countr: string, coiso = ""): Promise<void> {
  await t.db.query("INSERT INTO country (coid, countr, coiso) VALUES ($1, $2, $3)", [coid, countr, coiso]);
}

/** Enough rows for two loads plus a look-ahead: codes A0..A9, B0..B9, C0..C4 (25 rows) after the fixture. */
async function insertManyCountries(): Promise<string[]> {
  const codes: string[] = [];
  for (const letter of ["A", "B", "C"]) {
    for (let i = 0; i < (letter === "C" ? 5 : 10); i++) {
      const coid = `${letter}${i}`;
      codes.push(coid);
      await insertCountry(coid, `Land ${coid}`, `${coid}X`);
    }
  }
  return codes;
}

describe("cou-maintain-c07 — GetCountryName / GetCountryIso3 / ExistCountry over one keyed chain", () => {
  it("returns COUNTR, COISO and %found for a known code", async () => {
    expect(await f.getCountryName("FR")).toBe("France");
    expect(await f.getCountryIso3("FR")).toBe("FRA");
    expect(await f.existCountry("FR")).toBe(true);
  });

  it("unknown code -> cleared buffer: blanks and *off, no error", async () => {
    expect(await f.getCountryName("ZZ")).toBe("");
    expect(await f.getCountryIso3("ZZ")).toBe("");
    expect(await f.existCountry("ZZ")).toBe(false);
  });

  it("blank code never reads: a blank-keyed row is invisible to the getters", async () => {
    await insertCountry("", "Nowhere", "NWH");
    expect(await f.existCountry("")).toBe(false);
    expect(await f.existCountry("  ")).toBe(false);
    expect(await f.getCountryName("")).toBe("");
    expect(await f.getCountryIso3(" ")).toBe("");
    // the row is there — only the chain path skips it
    const r = await t.db.query("SELECT countr FROM country WHERE coid = ''");
    expect(r.rows[0]).toEqual({ countr: "Nowhere" });
  });

  it("matches the 2-character key exactly: no trimming of leading blanks, no case folding", async () => {
    expect(await f.existCountry("fr")).toBe(false);
    expect(await f.existCountry(" F")).toBe(false);
    expect(await f.getCountryName("fr")).toBe("");
  });

  it("2A by-value contract: a longer value is cut to two characters, trailing padding is ignored (CR-C3)", async () => {
    expect(await f.existCountry("FRA")).toBe(true);
    expect(await f.getCountryName("FR ")).toBe("France");
    expect(await f.getCountryName("F")).toBe("");
    expect(normaliseCountryCode("FRA")).toBe("FR");
    expect(normaliseCountryCode("F ")).toBe("F");
    expect(normaliseCountryCode(undefined)).toBe("");
    expect(COID_LENGTH).toBe(2);
  });

  it("exists = row present: COUNTRY has no delete flag, so nothing can be soft-deleted", async () => {
    const cols = await t.db.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'country' ORDER BY ordinal_position`,
      [t.schema],
    );
    expect(cols.rows.map((c) => c.column_name)).toEqual(["coid", "countr", "coiso"]);
  });

  it("no last-key cache (CR-C1): a row changed between two calls is seen at once", async () => {
    expect(await f.getCountryName("BE")).toBe("Belgium");
    await t.db.query("UPDATE country SET countr = 'Belgique' WHERE coid = 'BE'");
    expect(await f.getCountryName("BE")).toBe("Belgique");
    // a miss was never cached in the legacy either: a row added after a miss is found
    expect(await f.existCountry("XX")).toBe(false);
    await insertCountry("XX", "Xanadu", "XAN");
    expect(await f.existCountry("XX")).toBe(true);
  });
});

describe("cou-maintain-c08 — GetCountryIso3 has no caller; closeCOUNTRY is not exported", () => {
  it("getCountryIso3 is exported and shares the chain semantics of the name getter", async () => {
    expect(await f.getCountryIso3("GB")).toBe("GBR");
    expect(await f.getCountryIso3("ZZ")).toBe("");
    expect(await f.getCountryIso3("")).toBe("");
  });

  it("no consumer in modern reads the ISO-3 through the module (nothing invented)", async () => {
    // The window lists code and name only (c09): COISO never appears in a SltCountry row.
    const page = await f.sltCountry({ position: "GB" });
    expect(page.rows[0]).toEqual({ coid: "GB", countr: "United Kingdom" });
    expect(Object.keys(page.rows[0]!)).not.toContain("coiso");
  });

  it("there is no close on the module (nothing to close)", () => {
    expect("closeCountry" in f).toBe(false);
    expect("closeCOUNTRY" in f).toBe(false);
  });
});

describe("cou-maintain-c09 — SltCountry: positioned keyed read, 20 rows per load, More / Bottom, return contract", () => {
  it("entry state: by-code order positioned at pcod, dft = pcod, by-name key blank", () => {
    const s = sltCountryOpen("IT");
    expect(s).toEqual({ order: "code", keycod: "IT", keydes: "", dft: "IT" });
    expect(sltCountryRequest(s)).toEqual({ order: "code", position: "IT", offset: 0 });
  });

  it("SETLL pcod: the list starts at the first key >= pcod in by-code order", async () => {
    const page = await f.sltCountry({ position: "GB" });
    expect(page.rows.map((r) => r.coid)).toEqual(["GB", "IT", "NL", "US"]);
    expect(page.more).toBe(false);
    expect(page.nextOffset).toBeNull();
  });

  it("a code that does not exist positions at the next greater key; blank positions at the top", async () => {
    expect((await f.sltCountry({ position: "GA" })).rows[0]?.coid).toBe("GB");
    expect((await f.sltCountry({ position: "" })).rows.map((r) => r.coid)).toEqual(COUNTRY_FIXTURE.map((c) => c.coid));
    expect((await f.sltCountry()).rows.length).toBe(COUNTRY_FIXTURE.length);
  });

  it("position beyond the last key: empty window, no rows, no message, no error", async () => {
    const page = await f.sltCountry({ position: "ZZ" });
    expect(page).toEqual({ rows: [], more: false, nextOffset: null });
  });

  it("loads 20 rows and decides More by a one-row look-ahead; the next load resumes after them", async () => {
    const codes = await insertManyCountries();
    const all = [...codes, ...COUNTRY_FIXTURE.map((c) => c.coid)].sort();
    expect(all.length).toBe(33);

    const first = await f.sltCountry({ position: "" });
    expect(first.rows.length).toBe(SLT_LOAD_SIZE);
    expect(first.rows.map((r) => r.coid)).toEqual(all.slice(0, 20));
    expect(first.more).toBe(true);
    expect(first.nextOffset).toBe(20);

    const second = await f.sltCountry({ position: "", offset: first.nextOffset! });
    expect(second.rows.map((r) => r.coid)).toEqual(all.slice(20));
    expect(second.rows.length).toBe(13);
    expect(second.more).toBe(false);
    expect(second.nextOffset).toBeNull();
  });

  it("exactly 20 rows left shows Bottom at once (the look-ahead read fails)", async () => {
    await insertManyCountries(); // 33 rows in total; position so that exactly 20 remain
    const all = (await f.listCountries()).map((c) => c.coid);
    const from = all[all.length - 20]!;
    const page = await f.sltCountry({ position: from });
    expect(page.rows.length).toBe(20);
    expect(page.more).toBe(false);
    expect(page.nextOffset).toBeNull();
  });

  it("by-name order reads COUNTR1: positioned at a typed name, ordered by name", async () => {
    const page = await f.sltCountry({ order: "name", position: "Ge" });
    expect(page.rows.map((r) => r.countr)).toEqual(["Germany", "Italy", "Netherlands", "Spain", "United Kingdom", "United States"]);
    const top = await f.sltCountry({ order: "name" });
    expect(top.rows.map((r) => r.countr)).toEqual([
      "Belgium",
      "France",
      "Germany",
      "Italy",
      "Netherlands",
      "Spain",
      "United Kingdom",
      "United States",
    ]);
  });

  it("duplicate names list adjacent in by-name order and each row keeps its own code (CR-C4 tie-break by code)", async () => {
    await insertCountry("K2", "Korea", "KOR");
    await insertCountry("K1", "Korea", "PRK");
    const page = await f.sltCountry({ order: "name", position: "Korea" });
    expect(page.rows.slice(0, 2)).toEqual([
      { coid: "K1", countr: "Korea" },
      { coid: "K2", countr: "Korea" },
    ]);
  });

  it("30A by-name key: cut to 30 characters, trailing blanks ignored", () => {
    expect(normaliseCountryName("x".repeat(40))).toBe("x".repeat(COUNTR_LENGTH));
    expect(normaliseCountryName("France  ")).toBe("France");
    expect(normaliseCountryName(undefined)).toBe("");
  });

  it("ordering is byte order (COLLATE \"C\"), not EBCDIC (CR-C4): upper before lower, digits before letters", async () => {
    await insertCountry("aa", "eSwatini", "SWZ");
    await insertCountry("1A", "Zed", "ZED");
    const byCode = (await f.sltCountry()).rows.map((r) => r.coid);
    expect(byCode[0]).toBe("1A");
    expect(byCode[byCode.length - 1]).toBe("aa");
    const byName = (await f.sltCountry({ order: "name" })).rows.map((r) => r.countr);
    expect(byName.indexOf("Zed")).toBeLessThan(byName.indexOf("eSwatini"));
  });

  it("F3 / F12 return pcod unchanged; option 1 on one row returns that row's COID", () => {
    const s = sltCountryOpen("IT");
    expect(sltCountryAct(s, { cancel: true })).toEqual({ kind: "return", coid: "IT" });
    expect(sltCountryAct(s, { rows: [{ rrn: 3, coid: "NL", opt: 1 }] })).toEqual({ kind: "select", coid: "NL" });
    // cancel wins over anything typed
    expect(sltCountryAct(s, { cancel: true, rows: [{ rrn: 3, coid: "NL", opt: 7 }] })).toEqual({ kind: "return", coid: "IT" });
  });

  it("plain Enter with nothing typed redisplays; rows carrying 0 are not options", () => {
    const s = sltCountryOpen("IT");
    expect(sltCountryAct(s, {})).toEqual({ kind: "none" });
    expect(sltCountryAct(s, { rows: [{ rrn: 1, coid: "BE", opt: 0 }], controlOption: 0 })).toEqual({ kind: "none" });
  });

  it("dft is the caller's value as passed (pcod is by reference and never written)", () => {
    const s = sltCountryOpen("it");
    expect(s.keycod).toBe("it");
    expect(sltCountryAct(s, { cancel: true })).toEqual({ kind: "return", coid: "it" });
  });
});

describe("cou-maintain-c10 — F8 toggles the order and clears the key of the order entered", () => {
  it("F8 from by-code enters by-name with KEYDES cleared and KEYCOD kept", () => {
    const s = sltCountryOpen("IT");
    const out = sltCountryAct(s, { f8: true });
    expect(out).toEqual({ kind: "reprepare", state: { order: "name", keycod: "IT", keydes: "", dft: "IT" } });
    if (out.kind !== "reprepare") throw new Error("unreachable");
    expect(sltCountryRequest(out.state)).toEqual({ order: "name", position: "", offset: 0 });
  });

  it("trace from the card: toggle, position by name, toggle back — codes from the top, pcod lost", () => {
    let s: SltCountryState = sltCountryOpen("IT");
    const step = (entry: Parameters<typeof sltCountryAct>[1]) => {
      const out = sltCountryAct(s, entry);
      if (out.kind !== "reprepare") throw new Error(`expected reprepare, got ${out.kind}`);
      s = out.state;
      return sltCountryRequest(s);
    };
    // F8 -> by name: names from the top (D cleared, K kept = pcod)
    expect(step({ f8: true })).toEqual({ order: "name", position: "", offset: 0 });
    expect(s.keycod).toBe("IT");
    // option 8 in by-name, position 'Ne'
    expect(step({ controlOption: 8, positionTo: "Ne" })).toEqual({ order: "name", position: "Ne", offset: 0 });
    // F8 -> by code: K cleared (D = 'Ne' kept) -> codes from the top, pcod lost
    expect(step({ f8: true })).toEqual({ order: "code", position: "", offset: 0 });
    expect(s.keydes).toBe("Ne");
    // F8 -> by name: D cleared -> names from the top; the retained key was never read
    expect(step({ f8: true })).toEqual({ order: "name", position: "", offset: 0 });
    expect(s.dft).toBe("IT");
  });

  it("F8 with a position-to typed on the same Enter toggles and discards the position", () => {
    const out = sltCountryAct(sltCountryOpen("IT"), { f8: true, controlOption: 8, positionTo: "US" });
    expect(out).toEqual({ kind: "reprepare", state: { order: "name", keycod: "IT", keydes: "", dft: "IT" } });
  });

  it("F8 is ignored while any row option is typed (valid 1 or invalid): no toggle, no selection", () => {
    const s = sltCountryOpen("IT");
    const withOne = sltCountryAct(s, { f8: true, rows: [{ rrn: 2, coid: "DE", opt: 1 }] });
    expect(withOne.kind).toBe("redisplay");
    if (withOne.kind !== "redisplay") throw new Error("unreachable");
    expect(withOne.check.errors).toEqual([]);
    expect(withOne.check.selected).toBe("DE");
    expect(withOne.check.optionsTyped).toBe(true);

    const withBad = sltCountryAct(s, { f8: true, rows: [{ rrn: 2, coid: "DE", opt: 5 }] });
    expect(withBad.kind).toBe("redisplay");
    if (withBad.kind !== "redisplay") throw new Error("unreachable");
    expect(withBad.check.errors.map((e) => e.indicator)).toEqual([35]);
  });

  it("F8 with an invalid control option raises 41 before the toggle is reached", () => {
    const out = sltCountryAct(sltCountryOpen("IT"), { f8: true, controlOption: 5 });
    expect(out.kind).toBe("redisplay");
    if (out.kind !== "redisplay") throw new Error("unreachable");
    expect(out.check.errors).toEqual([{ indicator: 41, text: "Invalid option" }]);
  });

  it("the state after a toggle reads the other file: by-name then by-code page loads", async () => {
    let s = sltCountryOpen("IT");
    const toggled = sltCountryAct(s, { f8: true });
    if (toggled.kind !== "reprepare") throw new Error("unreachable");
    s = toggled.state;
    expect((await f.sltCountry(sltCountryRequest(s))).rows[0]).toEqual({ coid: "BE", countr: "Belgium" });
    const back = sltCountryAct(s, { f8: true });
    if (back.kind !== "reprepare") throw new Error("unreachable");
    expect((await f.sltCountry(sltCountryRequest(back.state))).rows[0]?.coid).toBe("BE");
  });
});

describe("cou-maintain-c11 — option 8 position-to, control-line guards 41 / 42, row rules 35 / 36", () => {
  it("row option must be 0 or 1: anything else is 35 INVALID OPTION on that row", () => {
    const c = sltCountryCheck({ rows: [{ rrn: 4, coid: "GB", opt: 2 }] });
    expect(c.errors).toEqual([{ indicator: 35, text: "INVALID OPTION", rrn: 4 }]);
    expect(c.firstErrorRrn).toBe(4);
    expect(c.selected).toBeNull();
    expect(c.optionsTyped).toBe(true);
  });

  it("at most one row may carry 1: the second is 36 ONLY ONE SELECTION; the first stays selected", () => {
    const c = sltCountryCheck({
      rows: [
        { rrn: 1, coid: "BE", opt: 1 },
        { rrn: 5, coid: "IT", opt: 1 },
      ],
    });
    expect(c.errors).toEqual([{ indicator: 36, text: "ONLY ONE SELECTION", rrn: 5 }]);
    expect(c.selected).toBe("BE");
    expect(c.firstErrorRrn).toBe(5);
  });

  it("errors are cumulative within one Enter and the page shown holds the first offending row", () => {
    const c = sltCountryCheck({
      rows: [
        { rrn: 2, coid: "DE", opt: 1 },
        { rrn: 7, coid: "NL", opt: 9 },
        { rrn: 8, coid: "US", opt: 1 },
      ],
      controlOption: 8,
    });
    expect(c.errors.map((e) => e.indicator)).toEqual([35, 36, 42]);
    expect(c.firstErrorRrn).toBe(7);
  });

  it("control option must be 0 or 8: anything else is 41 Invalid option", () => {
    expect(sltCountryCheck({ controlOption: 5 }).errors).toEqual([{ indicator: 41, text: "Invalid option" }]);
    expect(sltCountryCheck({ controlOption: 0 }).errors).toEqual([]);
    expect(sltCountryCheck({ controlOption: 8 }).errors).toEqual([]);
  });

  it("option 8 is refused while a row selection is pending: 42, nothing returned, nothing repositioned", () => {
    const out = sltCountryAct(sltCountryOpen("IT"), {
      rows: [{ rrn: 1, coid: "BE", opt: 1 }],
      controlOption: 8,
      positionTo: "US",
    });
    expect(out.kind).toBe("redisplay");
    if (out.kind !== "redisplay") throw new Error("unreachable");
    expect(out.check.errors).toEqual([{ indicator: 42, text: "Position to not available with selection pending" }]);
  });

  it("invalid row option + option 8: 35 fires and the position-to is not applied", () => {
    const s = sltCountryOpen("IT");
    const out = sltCountryAct(s, { rows: [{ rrn: 1, coid: "BE", opt: 3 }], controlOption: 8, positionTo: "US" });
    expect(out.kind).toBe("redisplay");
    if (out.kind !== "redisplay") throw new Error("unreachable");
    expect(out.check.errors.map((e) => e.indicator)).toEqual([35]);
    // the state is untouched: a fresh act on the same state still positions at pcod
    expect(sltCountryRequest(s).position).toBe("IT");
  });

  it("option 8 repositions the current order at POSCOD / POSDES and reloads from there", async () => {
    const byCode = sltCountryAct(sltCountryOpen("IT"), { controlOption: 8, positionTo: "N" });
    expect(byCode).toEqual({ kind: "reprepare", state: { order: "code", keycod: "N", keydes: "", dft: "IT" } });
    if (byCode.kind !== "reprepare") throw new Error("unreachable");
    expect((await f.sltCountry(sltCountryRequest(byCode.state))).rows.map((r) => r.coid)).toEqual(["NL", "US"]);

    const s: SltCountryState = { order: "name", keycod: "IT", keydes: "", dft: "IT" };
    const byName = sltCountryAct(s, { controlOption: 8, positionTo: "Sp" });
    if (byName.kind !== "reprepare") throw new Error("unreachable");
    expect(byName.state.keydes).toBe("Sp");
    expect((await f.sltCountry(sltCountryRequest(byName.state))).rows.map((r) => r.countr)).toEqual([
      "Spain",
      "United Kingdom",
      "United States",
    ]);
  });

  it("position-to text is not validated: beyond the last key gives an empty window", async () => {
    const out = sltCountryAct(sltCountryOpen("IT"), { controlOption: 8, positionTo: "zz" });
    if (out.kind !== "reprepare") throw new Error("unreachable");
    expect(await f.sltCountry(sltCountryRequest(out.state))).toEqual({ rows: [], more: false, nextOffset: null });
  });

  it("option 8 with a blank position goes back to the top (the recovery from an empty window)", async () => {
    const empty: SltCountryState = { order: "code", keycod: "ZZ", keydes: "", dft: "IT" };
    const out = sltCountryAct(empty, { controlOption: 8, positionTo: "" });
    if (out.kind !== "reprepare") throw new Error("unreachable");
    expect((await f.sltCountry(sltCountryRequest(out.state))).rows[0]?.coid).toBe("BE");
  });
});

describe("cou-maintain-c12 — export surface: four binder symbols as four methods, CUS dependency surface unchanged", () => {
  it("exposes existCountry, getCountryName, getCountryIso3, sltCountry and the CUS listCountries", () => {
    expect(Object.keys(f).sort()).toEqual(["existCountry", "getCountryIso3", "getCountryName", "listCountries", "sltCountry"]);
  });

  it("listCountries (CUS pack surface) still returns every row ordered by code with COISO", async () => {
    const rows = await f.listCountries();
    expect(rows).toEqual(COUNTRY_FIXTURE.map((c) => ({ coid: c.coid, countr: c.countr, coiso: c.coiso })));
  });

  it("the COUNTR1 index exists in the schema (LF -> index mapping rule)", async () => {
    const r = await t.db.query<{ indexdef: string }>(
      "SELECT indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = 'country' AND indexname = 'countr1'",
      [t.schema],
    );
    expect(r.rows.length).toBe(1);
    expect(r.rows[0]!.indexdef).toMatch(/countr COLLATE "C", coid COLLATE "C"/);
  });
});
