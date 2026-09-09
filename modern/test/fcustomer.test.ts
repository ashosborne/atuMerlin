/**
 * FCUSTOMER shared module (CUS300 getters, ExistCus, IsCusDeleted; CUS301 SltCustomer) at the
 * TypeScript boundary. Cards: cus-modules-c01, c02, c03, c04 (miss semantics), c06, c09, c11.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { createFCustomer, normaliseCriterion, type FCustomer } from "../src/shared/fcustomer/index.js";
import { createTestDb, insertCustomer, type TestDb } from "./helpers/db.js";

let t: TestDb;
let f: FCustomer;
let app: FastifyInstance;

beforeAll(async () => {
  t = await createTestDb();
  f = createFCustomer(t.db);
  app = await buildApp({ db: t.db });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await t.close();
});
beforeEach(() => t.reset());

describe("cus-modules-c01 — getter family", () => {
  it("returns one column each for a known id; country as code", async () => {
    await t.db.query(
      `UPDATE customer SET cuvat = 'FR99', cumail = 'a@b.c', culine1 = 'L1', culine2 = 'L2', culine3 = 'L3',
              cuzip = '74000', cucredit = 12.5 WHERE cuid = 1001`,
    );
    expect(await f.getCusName(1001)).toBe("Arcad Software");
    expect(await f.getCusPhone(1001)).toBe("0450578396");
    expect(await f.getCusVat(1001)).toBe("FR99");
    expect(await f.getCusMail(1001)).toBe("a@b.c");
    expect(await f.getCusAdrline1(1001)).toBe("L1");
    expect(await f.getCusAdrline2(1001)).toBe("L2");
    expect(await f.getCusAdrline3(1001)).toBe("L3");
    expect(await f.getCusZip(1001)).toBe("74000");
    expect(await f.getCusCity(1001)).toBe("Annecy");
    expect(await f.getCusCountry(1001)).toBe("FR");
    expect(await f.getCusLimCredit(1001)).toBe(15000);
    expect(await f.getCusCredit(1001)).toBe(12.5);
  });

  it("unknown id -> blanks and zeros, no error (c04 miss semantics; needs-SME)", async () => {
    expect(await f.getCusName(99999)).toBe("");
    expect(await f.getCusCountry(99999)).toBe("");
    expect(await f.getCusLimCredit(99999)).toBe(0);
    expect(await f.getCusName(0)).toBe("");
  });

  it("returns data for a soft-deleted customer like any other (no CUDEL filter on getters)", async () => {
    expect(await f.getCusName(1005)).toBe("Elektro Meyer");
  });

  it("reads are not cached across calls (deliberate delta from c04 last-key cache)", async () => {
    expect(await f.getCusName(1002)).toBe("Baker Street Books");
    await t.db.query("UPDATE customer SET custnm = 'Renamed' WHERE cuid = 1002");
    expect(await f.getCusName(1002)).toBe("Renamed");
  });
});

describe("cus-modules-c02 / c03 — ExistCus and IsCusDeleted truth table", () => {
  it("stored, not deleted", async () => {
    expect(await f.existCus(1001)).toBe(true);
    expect(await f.isCusDeleted(1001)).toBe(false);
  });
  it("stored, CUDEL = 'X'", async () => {
    expect(await f.existCus(1005)).toBe(false);
    expect(await f.isCusDeleted(1005)).toBe(true);
  });
  it("no such id", async () => {
    expect(await f.existCus(4242)).toBe(false);
    expect(await f.isCusDeleted(4242)).toBe(false);
    expect(await f.existCus(0)).toBe(false);
  });
  it("only uppercase X counts as deleted", async () => {
    await insertCustomer(t.db, { cuid: 800, custnm: "Lower x", cudel: "x" });
    expect(await f.existCus(800)).toBe(true);
    expect(await f.isCusDeleted(800)).toBe(false);
  });
});

describe("cus-modules-c06 / c11 — SltCustomer selection list", () => {
  it("contains-match on name, ordered by name, 14 per page with look-ahead More/Bottom", async () => {
    for (let i = 0; i < 16; i++) {
      await insertCustomer(t.db, { cuid: 200 + i, custnm: `Widget ${String(i).padStart(2, "0")}`, cucity: "Lyon", cucoun: "FR" });
    }
    const p1 = await f.sltCustomer({ name: "widget" });
    expect(p1.rows).toHaveLength(14);
    expect(p1.rows[0]).toEqual({ cuid: 200, custnm: "Widget 00", cucity: "Lyon", cucoun: "FR" });
    expect(p1.more).toBe(true);
    expect(p1.nextOffset).toBe(14);

    const p2 = await f.sltCustomer({ name: "widget", offset: 14 });
    expect(p2.rows.map((r) => r.cuid)).toEqual([214, 215]);
    expect(p2.more).toBe(false);
    expect(p2.nextOffset).toBeNull();
  });

  it("exactly 14 rows shows Bottom at once (look-ahead fetch fails)", async () => {
    for (let i = 0; i < 14; i++) {
      await insertCustomer(t.db, { cuid: 300 + i, custnm: `Gadget ${String(i).padStart(2, "0")}` });
    }
    const p = await f.sltCustomer({ name: "GADGET" });
    expect(p.rows).toHaveLength(14);
    expect(p.more).toBe(false);
  });

  it("name AND city when both given; city only when name blank", async () => {
    const both = await f.sltCustomer({ name: "a", city: "rom" });
    expect(both.rows.map((r) => r.custnm)).toEqual(["Casa Rossi"]);
    const cityOnly = await f.sltCustomer({ city: "LONDON" });
    expect(cityOnly.rows.map((r) => r.custnm)).toEqual(["Baker Street Books"]);
  });

  it("blank criteria list every customer including soft-deleted rows (c11)", async () => {
    const all = await f.sltCustomer({});
    expect(all.rows.map((r) => r.cuid)).toEqual([1001, 1002, 1003, 1004, 1005]);
    const blanks = await f.sltCustomer({ name: "   ", city: "" });
    expect(blanks.rows).toHaveLength(5);
  });

  it("criteria are cut to 10 characters (leading blanks count) then trimmed (10A display fields)", async () => {
    expect(normaliseCriterion("  baker street books ")).toBe("BAKER ST");
    expect(normaliseCriterion("baker street books")).toBe("BAKER STRE");
    const p = await f.sltCustomer({ name: "Baker Street Books" });
    expect(p.rows.map((r) => r.custnm)).toEqual(["Baker Street Books"]);
  });

  it("% and _ typed by the user act as LIKE wildcards (as-is, no ESCAPE)", async () => {
    const pct = await f.sltCustomer({ name: "ARC%RE" });
    expect(pct.rows.map((r) => r.custnm)).toEqual(["Arcad Software"]);
    const us = await f.sltCustomer({ name: "R_SSI" });
    expect(us.rows.map((r) => r.custnm)).toEqual(["Casa Rossi"]);
  });

  it("a quote in the criteria no longer breaks the statement (c09 resolved by pack: parameterised SQL)", async () => {
    await insertCustomer(t.db, { cuid: 900, custnm: "O'Reilly Media", cucity: "Sebastopol" });
    const p = await f.sltCustomer({ name: "o'reil" });
    expect(p.rows.map((r) => r.cuid)).toEqual([900]);
    const injected = await f.sltCustomer({ name: "' OR 1=1 --" });
    expect(injected.rows).toEqual([]);
  });

  it("is exposed at GET /api/customers/search", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers/search?city=berlin" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      rows: [{ cuid: 1005, custnm: "Elektro Meyer", cucity: "Berlin", cucoun: "DE" }],
      more: false,
      nextOffset: null,
    });
    const bad = await app.inject({ method: "GET", url: "/api/customers/search?offset=-1" });
    expect(bad.statusCode).toBe(400);
  });
});
