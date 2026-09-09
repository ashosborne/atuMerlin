/**
 * FVAT shared module (VAT300 GetVATRate, GetVATDesc, ClcVAT, ExistVATRate) at the TypeScript
 * boundary — pack atu-merlin-ts-vat-v1@1, WAIVED_PATHFINDER (no IBM i goldens; expected values
 * are derived from the cards, not recorded on the box). Cards: vat-module-c01, c02, c03, c04,
 * c05 (blank code), c06 (deliberate no-cache delta), c10 (1A contract).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clcVatWithRate, createFVat, normaliseVatCode, type FVat } from "../src/shared/fvat/index.js";
import { createTestDb, type TestDb } from "./helpers/db.js";

let t: TestDb;
let f: FVat;

beforeAll(async () => {
  t = await createTestDb();
  f = createFVat(t.db);
});
afterAll(() => t.close());
beforeEach(() => t.reset());

/** Fixture path: a VATDEF row the seed does not carry (soft-deleted, blank-keyed, lower-case). */
async function insertVatDef(vatcode: string, vatrate: number, vatdesc = "", vatdel = " "): Promise<void> {
  await t.db.query(
    `INSERT INTO vatdef (vatcode, vatrate, vatdesc, vatcrea, vatmod, vatmodid, vatdel)
     VALUES ($1, $2, $3, CURRENT_DATE, LOCALTIMESTAMP, 'FIXTURE', $4)`,
    [vatcode, vatrate, vatdesc, vatdel],
  );
}

describe("vat-module-c01 — ClcVAT arithmetic: (net * rate) / 100 half-adjusted to 2 dp, VAT amount not gross", () => {
  it.each([
    [100, 20, 20],
    [149.9, 20, 29.98],
    [6.4, 5.5, 0.35], // 0.352
    [0.05, 5.5, 0], // 0.00275 -> truncate 0.0027 -> 0.00
    [0.1, 5.5, 0.01], // 0.0055 -> 0.01
    [1.25, 5.5, 0.07], // 0.06875 -> 0.07
    [0.02, 12.5, 0], // 0.0025 -> 0.00 (third decimal 2)
    [0.06, 12.5, 0.01], // 0.0075 -> 0.01
    [12.35, 4.05, 0.5], // 0.500175: six-decimal quotient, same result as rounding the exact value
    [1.23, 4.56, 0.06], // 0.056088
    [0, 20, 0],
    [100, 0, 0],
  ])("net %s at %s%% -> %s", (net, rate, expected) => {
    expect(clcVatWithRate(net, rate)).toBe(expected);
  });

  it("is symmetric about zero (truncate and %dech both are); no negative zero at the boundary", () => {
    expect(clcVatWithRate(-0.06, 12.5)).toBe(-0.01);
    expect(clcVatWithRate(-149.9, 20)).toBe(-29.98);
    expect(clcVatWithRate(-0.05, 5.5)).toBe(0);
    expect(Object.is(clcVatWithRate(-0.001, 20), 0)).toBe(true);
  });

  it("has no overflow path at the 9 2 x 4 2 extremes", () => {
    expect(clcVatWithRate(9_999_999.99, 99.99)).toBe(9_998_999.99);
    expect(clcVatWithRate(-9_999_999.99, 99.99)).toBe(-9_998_999.99);
  });

  it("resolves the rate through VATDEF and returns the VAT amount (callers add it to the net)", async () => {
    expect(await f.clcVat("2", 149.9)).toBe(29.98);
    expect(await f.clcVat("1", 6.4)).toBe(0.35);
    expect(await f.clcVat("3", 24)).toBe(2.4);
  });
});

describe("vat-module-c02 — unknown code -> cleared buffer -> zero VAT, silently (planted defect kept)", () => {
  it("rate 0, description blank, VAT 0, no error", async () => {
    expect(await f.getVatRate("9")).toBe(0);
    expect(await f.getVatDesc("9")).toBe("");
    expect(await f.clcVat("9", 149.9)).toBe(0);
    expect(await f.existVatRate("9")).toBe(false);
  });

  it("a zero-rated line and an unknown-code line are indistinguishable by their amounts", async () => {
    await insertVatDef("0", 0, "Zero rated");
    expect(await f.clcVat("0", 100)).toBe(await f.clcVat("9", 100));
  });
});

describe("vat-module-c03 — GetVATRate / GetVATDesc getters", () => {
  it("return the raw VATDEF fields for a known code", async () => {
    expect(await f.getVatRate("2")).toBe(20);
    expect(await f.getVatDesc("2")).toBe("Standard");
    expect(await f.getVatRate("1")).toBe(5.5);
    expect(await f.getVatDesc("1")).toBe("Reduced");
  });

  it("GetVATRate after ClcVAT for the same code agrees with the amount (ORD100/ORD101 line panel sequence)", async () => {
    const net = 89.5;
    const vat = await f.clcVat("2", net);
    const rate = await f.getVatRate("2");
    expect(vat).toBe(17.9);
    expect(vat).toBe(clcVatWithRate(net, rate));
  });
});

describe("vat-module-c04 — ExistVATRate = %found and VATDEL <> 'X'; the other exports ignore VATDEL", () => {
  it("truth table: live, soft-deleted, missing", async () => {
    await insertVatDef("D", 7, "Retired rate", "X");
    expect(await f.existVatRate("2")).toBe(true);
    expect(await f.existVatRate("D")).toBe(false);
    expect(await f.existVatRate("9")).toBe(false);
  });

  it("a soft-deleted rate is still applied by ClcVAT / GetVATRate / GetVATDesc (as-is, needs-SME)", async () => {
    await insertVatDef("D", 7, "Retired rate", "X");
    expect(await f.clcVat("D", 100)).toBe(7);
    expect(await f.getVatRate("D")).toBe(7);
    expect(await f.getVatDesc("D")).toBe("Retired rate");
  });

  it("only uppercase X counts as deleted", async () => {
    await insertVatDef("L", 4, "lower x", "x");
    expect(await f.existVatRate("L")).toBe(true);
  });
});

describe("vat-module-c05 — blank code never reads VATDEF", () => {
  it("returns the cleared buffer even when a blank-keyed row exists", async () => {
    await insertVatDef(" ", 99, "Blank key row");
    expect(await f.getVatRate(" ")).toBe(0);
    expect(await f.getVatRate("")).toBe(0);
    expect(await f.getVatDesc(" ")).toBe("");
    expect(await f.clcVat(" ", 100)).toBe(0);
    expect(await f.existVatRate(" ")).toBe(false);
  });
});

describe("vat-module-c06 — last-key cache not reproduced (deliberate delta CR-V1)", () => {
  it("a changed VATDEF row is seen on the next call for the same code", async () => {
    expect(await f.getVatRate("3")).toBe(10);
    await t.db.query("UPDATE vatdef SET vatrate = 12 WHERE vatcode = '3'");
    expect(await f.getVatRate("3")).toBe(12);
    expect(await f.clcVat("3", 100)).toBe(12);
  });

  it("a code added after a miss is seen (misses never stuck in legacy either)", async () => {
    expect(await f.getVatRate("7")).toBe(0);
    await insertVatDef("7", 7.7, "Late arrival");
    expect(await f.getVatRate("7")).toBe(7.7);
  });
});

describe("vat-module-c10 — effective contract ClcVAT(char(1), decimal(9,2)) -> decimal(9,2)", () => {
  it("the 1A by-value code keeps its first character; empty is the blank code", () => {
    expect(normaliseVatCode("2")).toBe("2");
    expect(normaliseVatCode("2X")).toBe("2");
    expect(normaliseVatCode("")).toBe(" ");
    expect(normaliseVatCode(" ")).toBe(" ");
  });

  it("resolves through the first character and compares case-sensitively like the keyed CHAIN", async () => {
    await insertVatDef("a", 3, "lower a");
    expect(await f.getVatRate("2X")).toBe(20);
    expect(await f.getVatRate("a")).toBe(3);
    expect(await f.getVatRate("A")).toBe(0);
  });
});
