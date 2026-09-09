/**
 * FPARAMETER shared module (PAR300 GetPARM1..5, the PATH reader, the PAR201 pattern) at the
 * TypeScript boundary — pack atu-merlin-ts-par-v1@1, WAIVED_PATHFINDER (no IBM i goldens;
 * expected values are derived from the cards, not recorded on the box). Cards: par-maintain-c07
 * (PAR201 pattern), c08 (blank PATH silent), c09 (getter family / chain semantics), c10 (export
 * surface), c11 (PATH is the one live key), c12 (PARAMETER table shape).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  CLEARED_PARAMETER,
  PACODE_LENGTH,
  PARM2_LENGTH,
  PATH_KEY,
  createFParameter,
  normaliseParameterKey,
  wrklnkPattern,
  type FParameter,
  type ParameterRow,
} from "../src/shared/parm/index.js";
import { createTestDb, type TestDb } from "./helpers/db.js";

let t: TestDb;
let f: FParameter;

beforeAll(async () => {
  t = await createTestDb();
  f = createFParameter(t.db);
});
afterAll(() => t.close());
beforeEach(async () => {
  await t.reset();
  // No PATH row is seeded (c08: installation data); each test writes what it needs.
  await t.db.query("DELETE FROM parameter");
});

/** Fixture path: PAR200 (features/par) is the only legacy writer; tests write the row directly. */
async function insertParameter(row: Partial<ParameterRow> & Pick<ParameterRow, "pacode" | "pasubcode">): Promise<void> {
  const r: ParameterRow = { ...CLEARED_PARAMETER, ...row };
  await t.db.query("INSERT INTO parameter (pacode, pasubcode, parm1, parm2, parm3, parm4, parm5) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
    r.pacode,
    r.pasubcode,
    r.parm1,
    r.parm2,
    r.parm3,
    r.parm4,
    r.parm5,
  ]);
}

describe("par-maintain-c09 — GetPARM1..5 over one keyed chain", () => {
  it("returns each typed column of the (PACODE, PASUBCODE) row", async () => {
    await insertParameter({ pacode: "LIMITS", pasubcode: "ORDER", parm1: "ABC", parm2: "Mixed Case value", parm3: "XY", parm4: 7, parm5: 321 });
    expect(await f.getParm1("LIMITS", "ORDER")).toBe("ABC");
    expect(await f.getParm2("LIMITS", "ORDER")).toBe("Mixed Case value");
    expect(await f.getParm3("LIMITS", "ORDER")).toBe("XY");
    expect(await f.getParm4("LIMITS", "ORDER")).toBe(7);
    expect(await f.getParm5("LIMITS", "ORDER")).toBe(321);
  });

  it("a miss returns the cleared buffer: blanks and zeros, no error, no found signal", async () => {
    expect(await f.getParm1("NOPE", "")).toBe("");
    expect(await f.getParm2("NOPE", "")).toBe("");
    expect(await f.getParm3("NOPE", "")).toBe("");
    expect(await f.getParm4("NOPE", "")).toBe(0);
    expect(await f.getParm5("NOPE", "")).toBe(0);
  });

  it("the 10A compare is case-sensitive and ignores trailing blanks (GetParm2('path') misses)", async () => {
    await insertParameter({ pacode: "PATH", pasubcode: "", parm2: "/home/sample/out/" });
    expect(await f.getParm2("PATH", " ")).toBe("/home/sample/out/");
    expect(await f.getParm2("PATH      ", "          ")).toBe("/home/sample/out/");
    expect(await f.getParm2("path", " ")).toBe("");
  });

  it("a longer key is cut to ten characters like the by-value 10A parameter", async () => {
    await insertParameter({ pacode: "ABCDEFGHIJ", pasubcode: "", parm1: "TEN" });
    expect(await f.getParm1("ABCDEFGHIJKLMN", "")).toBe("TEN");
    expect(normaliseParameterKey("ABCDEFGHIJKLMN")).toHaveLength(PACODE_LENGTH);
  });

  it("a blank/blank key never reads: the blank/blank row PAR200 can create is unreachable", async () => {
    await insertParameter({ pacode: "", pasubcode: "", parm1: "HIDDEN", parm2: "hidden too", parm4: 9, parm5: 999 });
    expect(await f.getParm1("", "")).toBe("");
    expect(await f.getParm2(" ", " ")).toBe("");
    expect(await f.getParm4("", "")).toBe(0);
    expect(await f.getParm5("          ", "")).toBe(0);
    // A key with only one blank half does read (the legacy test is on both fields).
    await insertParameter({ pacode: "", pasubcode: "SUB", parm1: "HALF" });
    expect(await f.getParm1("", "SUB")).toBe("HALF");
  });

  it("CR-P1: no last-key cache — a change or delete is seen by the next call", async () => {
    await insertParameter({ pacode: "PATH", pasubcode: "", parm2: "/old/" });
    expect(await f.getPath()).toBe("/old/");
    await t.db.query("UPDATE parameter SET parm2 = '/new/' WHERE pacode = 'PATH'");
    expect(await f.getPath()).toBe("/new/");
    await t.db.query("DELETE FROM parameter WHERE pacode = 'PATH'");
    expect(await f.getPath()).toBe("");
    // A miss was never cached in the legacy either: the row appearing is seen at once.
    await insertParameter({ pacode: "PATH", pasubcode: "", parm2: "/back/" });
    expect(await f.getPath()).toBe("/back/");
  });
});

describe("par-maintain-c11 — PATH is the one live key", () => {
  it("getPath is GetParm2('PATH':' ') — value returned exactly as stored, no separator added", async () => {
    expect(PATH_KEY).toEqual({ pacode: "PATH", pasubcode: "" });
    await insertParameter({ pacode: "PATH", pasubcode: "", parm2: "/home/sample/out" });
    expect(await f.getPath()).toBe("/home/sample/out");
    expect(await f.getPath()).toBe(await f.getParm2("PATH", " "));
  });

  it("PARM1 / PARM3 / PARM4 / PARM5 of the PATH row are carried but nothing reads them for PATH", async () => {
    await insertParameter({ pacode: "PATH", pasubcode: "", parm1: "X", parm2: "/p/", parm3: "YZ", parm4: 1, parm5: 2 });
    expect(await f.getPath()).toBe("/p/");
    expect(await f.getParm1("PATH", "")).toBe("X");
    expect(await f.getParm3("PATH", "")).toBe("YZ");
  });
});

describe("par-maintain-c08 — blank PATH is silent", () => {
  it("missing row and blank PARM2 are indistinguishable: both return '' without an error", async () => {
    expect(await f.getPath()).toBe("");
    await insertParameter({ pacode: "PATH", pasubcode: "", parm2: "" });
    expect(await f.getPath()).toBe("");
    expect(wrklnkPattern(await f.getPath())).toBe("*");
  });
});

describe("par-maintain-c07 — PAR201 pattern (`&PATH *TCAT '*'`)", () => {
  it("appends '*' after the trailing blanks; the directory's contents only with a trailing slash", () => {
    expect(wrklnkPattern("/home/sample/out/")).toBe("/home/sample/out/*");
    expect(wrklnkPattern("/home/sample/out")).toBe("/home/sample/out*");
    expect(wrklnkPattern("/home/sample/out   ")).toBe("/home/sample/out*");
  });

  it("a 100-character PATH loses the '*' to the 100-byte variable", () => {
    const full = "/".padEnd(PARM2_LENGTH, "x");
    expect(wrklnkPattern(full)).toBe(full);
    expect(wrklnkPattern(full)).toHaveLength(PARM2_LENGTH);
  });
});

describe("par-maintain-c10 / c12 — export surface and table shape", () => {
  it("exposes the five getters plus getPath and nothing to open or close", () => {
    expect(Object.keys(f).sort()).toEqual(["getParm1", "getParm2", "getParm3", "getParm4", "getParm5", "getPath"]);
    expect("closeParameter" in f).toBe(false);
  });

  it("parameter has the PF UNIQUE key and the zoned widths as CHECKs (additive, pack-scoped)", async () => {
    await insertParameter({ pacode: "DUP", pasubcode: "" });
    await expect(insertParameter({ pacode: "DUP", pasubcode: "" })).rejects.toMatchObject({ code: "23505" });
    await expect(insertParameter({ pacode: "W", pasubcode: "4", parm4: 10 })).rejects.toMatchObject({ code: "23514" });
    await expect(insertParameter({ pacode: "W", pasubcode: "5", parm5: 1000 })).rejects.toMatchObject({ code: "23514" });
    await insertParameter({ pacode: "W", pasubcode: "OK", parm4: -9, parm5: -999 });
    expect(await f.getParm4("W", "OK")).toBe(-9);
    expect(await f.getParm5("W", "OK")).toBe(-999);
    const cols = await t.db.query<{ column_name: string; character_maximum_length: number | null }>(
      `SELECT column_name, character_maximum_length FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'parameter' ORDER BY ordinal_position`,
    );
    expect(cols.rows.map((c) => [c.column_name, c.character_maximum_length])).toEqual([
      ["pacode", 10],
      ["pasubcode", 10],
      ["parm1", 10],
      ["parm2", 100],
      ["parm3", 2],
      ["parm4", null],
      ["parm5", null],
    ]);
  });
});
