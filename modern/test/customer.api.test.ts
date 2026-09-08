/**
 * CUS200 / CUS250 behaviours at the TypeScript HTTP boundary (WAIVED_PATHFINDER: no IBM i
 * goldens, COMPARE at the TS API only). Each block cites the Discovery card it exercises.
 * These are provisional modern tests, not characterization goldens.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { createTestDb, insertCustomer, type TestDb } from "./helpers/db.js";

let t: TestDb;
let app: FastifyInstance;

const valid = {
  custnm: "Zeta Works",
  cuphone: "0123456789",
  cuvat: "FR123",
  cumail: "z@example.test",
  culine1: "1 Rue de la Paix",
  cuzip: "75001",
  cucity: "Paris",
  cucoun: "FR",
  culimcre: 2500.5,
};

beforeAll(async () => {
  t = await createTestDb();
  app = await buildApp({ db: t.db });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await t.close();
});
beforeEach(() => t.reset());

async function create(body: unknown, user = "TESTER") {
  return app.inject({ method: "POST", url: "/api/customers", headers: { "x-user-id": user }, payload: body as object });
}

describe("cus-interactive-c01 — list by name with position-to and paging", () => {
  it("orders by (name, id), loads 14 rows per page and resumes from the first unseen row", async () => {
    for (let i = 0; i < 20; i++) {
      await insertCustomer(t.db, { cuid: 100 + i, custnm: `Name ${String(i).padStart(2, "0")}` });
    }
    const first = await app.inject({ method: "GET", url: "/api/customers?positionTo=Name" });
    expect(first.statusCode).toBe(200);
    const p1 = first.json();
    expect(p1.rows).toHaveLength(14);
    expect(p1.rows[0]).toMatchObject({ cuid: 100, custnm: "Name 00" });
    expect(p1.more).toBe(true);
    expect(p1.next).toEqual({ cursorName: "Name 14", cursorId: 114 });

    const second = await app.inject({
      method: "GET",
      url: `/api/customers?cursorName=${encodeURIComponent(p1.next.cursorName)}&cursorId=${p1.next.cursorId}`,
    });
    const p2 = second.json();
    expect(p2.rows.map((r: { cuid: number }) => r.cuid)).toEqual([114, 115, 116, 117, 118, 119]);
    expect(p2.more).toBe(false); // Bottom
    expect(p2.next).toBeNull();
  });

  it("position-to is a name prefix (10 chars max) and blank means from the top", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers?positionTo=Del" });
    expect(res.json().rows[0].custnm).toBe("Delta Logistics");

    const longPrefix = await app.inject({ method: "GET", url: "/api/customers?positionTo=Delta%20LogisticsXYZ" });
    // Only 'Delta Logi' (10 chars) is used, so the row still positions on Delta Logistics.
    expect(longPrefix.json().rows[0].custnm).toBe("Delta Logistics");

    const all = await app.inject({ method: "GET", url: "/api/customers" });
    expect(all.json().rows[0].custnm).toBe("Arcad Software");
  });

  it("lists soft-deleted customers unfiltered with the Del flag (c11)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers?positionTo=Elektro" });
    expect(res.json().rows[0]).toMatchObject({ cuid: 1005, custnm: "Elektro Meyer", cudel: "X" });
  });

  it("returns the SFL01 columns only", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers?positionTo=Arcad" });
    expect(Object.keys(res.json().rows[0]).sort()).toEqual(["cucity", "cudel", "cuid", "culimcre", "custnm", "cuzip"]);
  });
});

describe("cus-interactive-c02 / c08 — create with id from CUSSEQ and audit stamping", () => {
  it("draws ids from CUSSEQ starting at 1551 and stamps CUCREA / CUMOD / CUMODID on create", async () => {
    const res = await create(valid, "ASH");
    expect(res.statusCode).toBe(201);
    const c = res.json();
    expect(c.cuid).toBe(1551);
    expect(c.cumodid).toBe("ASH");
    expect(c.cucrea).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(c.cumod).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(c.cucredit).toBe(0);
    expect(c.culastord).toBe(0);
    expect(c.lastOrderDate).toBeNull();
    expect(c.cudel).toBe(" ");
    expect(c.culimcre).toBe(2500.5);
    expect(c.countryName).toBe("France");

    const next = await create({ ...valid, custnm: "Zeta Two", cuphone: "0987" }, "ASH");
    expect(next.json().cuid).toBe(1552);
  });

  it("CUMODID is capped at 10 characters and defaults when no user is given", async () => {
    const long = await create(valid, "ABCDEFGHIJKLMN");
    expect(long.json().cumodid).toBe("ABCDEFGHIJ");
    const anon = await app.inject({ method: "POST", url: "/api/customers", payload: { ...valid, cuphone: "555" } });
    expect(anon.json().cumodid).toBe("WEB");
  });

  it("ignores LASTORD / CUID / CUCREDIT / CUDEL sent by the client (not input fields on FMT02)", async () => {
    const res = await create({ ...valid, cuid: 42, cucredit: 99, culastord: 20240101, lastOrderDate: "2024-01-01", cudel: "X" });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ cuid: 1551, cucredit: 0, culastord: 0, cudel: " " });
  });
});

describe("cus-interactive-c04 — validation rules (S02chk)", () => {
  it("evaluates every rule in one pass and reports them together", async () => {
    const res = await create({ custnm: "   ", cuphone: "", cucoun: "ZZ" });
    expect(res.statusCode).toBe(400);
    const codes = res.json().errors.map((e: { code: string }) => e.code);
    expect(codes).toEqual(["ERR0002", "NAME_MANDATORY", "ERR2001"]);
  });

  it("blank phone skips the digits-only and duplicate checks", async () => {
    const res = await create({ ...valid, cuphone: "   " });
    const codes = res.json().errors.map((e: { code: string }) => e.code);
    expect(codes).toEqual(["ERR2001"]);
  });

  it("trims the phone in place, then requires digits only", async () => {
    const bad = await create({ ...valid, cuphone: " +33 1 23 " });
    expect(bad.json().errors.map((e: { code: string }) => e.code)).toEqual(["ERR2002"]);

    const ok = await create({ ...valid, cuphone: "  0123456789  " });
    expect(ok.statusCode).toBe(201);
    expect(ok.json().cuphone).toBe("0123456789");
  });

  it("rejects a duplicate UPPER(name)+phone on create (dup > 0), case-insensitive on name", async () => {
    const res = await create({ ...valid, custnm: "arcad software", cuphone: "0450578396" });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors).toEqual([
      { code: "ERR2000", field: "custnm", message: "Customer arcad software /Phone 0450578396 Already Exist" },
    ]);
  });

  it("same name with a different phone is not a duplicate", async () => {
    const res = await create({ ...valid, custnm: "Arcad Software", cuphone: "1" });
    expect(res.statusCode).toBe(201);
  });

  it("country must exist (ERR0002); blank country fails", async () => {
    const res = await create({ ...valid, cucoun: "" });
    expect(res.json().errors[0]).toMatchObject({ code: "ERR0002", field: "cucoun" });
  });

  it("stores the unvalidated fields as typed (right-trimmed) and leaves credit limit unchecked for sign", async () => {
    const res = await create({ ...valid, cuvat: "  weird  ", cumail: "not-an-email", culimcre: -5 });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ cuvat: "  weird", cumail: "not-an-email", culimcre: -5 });
  });

  it("modern boundary: rejects values longer than the fixed-length legacy field", async () => {
    const res = await create({ ...valid, custnm: "x".repeat(31), cucoun: "FRA" });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors.map((e: { code: string; field: string }) => [e.code, e.field])).toEqual([
      ["FIELD_TOO_LONG", "custnm"],
      ["FIELD_TOO_LONG", "cucoun"],
    ]);
  });

  it("modern boundary: credit limit must fit 9,2", async () => {
    const res = await create({ ...valid, culimcre: 12345678.9 });
    expect(res.json().errors[0]).toMatchObject({ code: "FIELD_INVALID", field: "culimcre" });
    const dec = await create({ ...valid, culimcre: "10.123" });
    expect(dec.json().errors[0]).toMatchObject({ code: "FIELD_INVALID", field: "culimcre" });
  });
});

describe("cus-interactive-c03 / c08 — update (option 2)", () => {
  it("updates the typed fields, refreshes CUMOD only, preserves CUCREA, CUMODID, CUDEL, CUCREDIT, CULASTORD (c08 as-is)", async () => {
    await insertCustomer(t.db, {
      cuid: 500,
      custnm: "Old Name",
      cuphone: "111",
      cucoun: "FR",
      culastord: 20230101,
      cumodid: "CREATOR",
      cucrea: "2019-05-05",
      cudel: "X",
    });
    await t.db.query("UPDATE customer SET cucredit = 77 WHERE cuid = 500");
    const before = (await app.inject({ method: "GET", url: "/api/customers/500" })).json();

    const res = await app.inject({
      method: "PUT",
      url: "/api/customers/500",
      headers: { "x-user-id": "EDITOR" },
      payload: { ...valid, custnm: "New Name", cuphone: "222", cuid: 999 },
    });
    expect(res.statusCode).toBe(200);
    const after = res.json();
    expect(after).toMatchObject({
      cuid: 500,
      custnm: "New Name",
      cuphone: "222",
      cucity: "Paris",
      cucrea: "2019-05-05",
      // needs-SME cus-interactive-c08: CUMODID is NOT refreshed on update — preserved as-is.
      cumodid: "CREATOR",
      cudel: "X",
      cucredit: 77,
      culastord: 20230101,
      lastOrderDate: "2023-01-01",
    });
    expect(after.cumod > before.cumod).toBe(true);
  });

  it("update-mode duplicate rule is dup > 1: unchanged values pass (self counted)", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/customers/1001",
      payload: { ...valid, custnm: "Arcad Software", cuphone: "0450578396" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("update-mode duplicate gap (as-is, needs-SME c04): colliding with exactly one other customer passes", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/customers/1002",
      payload: { ...valid, custnm: "ARCAD SOFTWARE", cuphone: "0450578396" },
    });
    // Legacy counts rows holding the new values (1: customer 1001) and requires dup > 1 to fail.
    expect(res.statusCode).toBe(200);

    // Once two other rows collide, the update is rejected.
    const rejected = await app.inject({
      method: "PUT",
      url: "/api/customers/1003",
      payload: { ...valid, custnm: "Arcad Software", cuphone: "0450578396" },
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json().errors[0].code).toBe("ERR2000");
  });

  it("runs the same validation as create", async () => {
    const res = await app.inject({ method: "PUT", url: "/api/customers/1001", payload: { custnm: "", cuphone: "abc", cucoun: "FR" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors.map((e: { code: string }) => e.code)).toEqual(["NAME_MANDATORY", "ERR2002"]);
  });

  it("unknown id reports ERR0103 (legacy chain was unchecked)", async () => {
    const res = await app.inject({ method: "PUT", url: "/api/customers/4242", payload: valid });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ code: "ERR0103", message: "Code 4242 Unknown.", cuid: 4242 });
  });
});

describe("cus-interactive-c09 / c10 — inquiry by id with country name", () => {
  it("returns the row with the resolved country name", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers/1001" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ cuid: 1001, custnm: "Arcad Software", cucoun: "FR", countryName: "France" });
  });

  it("country name is blank when the code is unknown", async () => {
    await insertCustomer(t.db, { cuid: 600, custnm: "Nowhere Inc", cucoun: "XX" });
    const res = await app.inject({ method: "GET", url: "/api/customers/600" });
    expect(res.json()).toMatchObject({ cucoun: "XX", countryName: "" });
  });

  it("not found -> ERR0103 'Code &1 Unknown.' with zero-suppressed id; id 0 reads 'Code  Unknown.'", async () => {
    const miss = await app.inject({ method: "GET", url: "/api/customers/77" });
    expect(miss.statusCode).toBe(404);
    expect(miss.json()).toEqual({ code: "ERR0103", message: "Code 77 Unknown.", cuid: 77 });

    const zero = await app.inject({ method: "GET", url: "/api/customers/0" });
    expect(zero.json().message).toBe("Code  Unknown.");

    const junk = await app.inject({ method: "GET", url: "/api/customers/abc" });
    expect(junk.statusCode).toBe(404);
    const tooLong = await app.inject({ method: "GET", url: "/api/customers/123456" });
    expect(tooLong.statusCode).toBe(404);
  });

  it("finds and displays soft-deleted customers (no CUDEL test, c11)", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers/1005" });
    expect(res.statusCode).toBe(200);
    expect(res.json().cudel).toBe("X");
  });
});

describe("cus-interactive-c07 — sentinel last-order date", () => {
  it("0 -> null (blank), yyyymmdd -> ISO date, invalid stored value -> null with raw kept", async () => {
    const never = (await app.inject({ method: "GET", url: "/api/customers/1002" })).json();
    expect(never).toMatchObject({ culastord: 0, lastOrderDate: null });

    const dated = (await app.inject({ method: "GET", url: "/api/customers/1001" })).json();
    expect(dated).toMatchObject({ culastord: 20240315, lastOrderDate: "2024-03-15" });

    await insertCustomer(t.db, { cuid: 700, custnm: "Bad Date", culastord: 20241301 });
    const bad = (await app.inject({ method: "GET", url: "/api/customers/700" })).json();
    expect(bad).toMatchObject({ culastord: 20241301, lastOrderDate: null });
  });
});

describe("cus-interactive-c11 — no delete path", () => {
  it("has no DELETE route and never writes CUDEL", async () => {
    const res = await app.inject({ method: "DELETE", url: "/api/customers/1001" });
    expect(res.statusCode).toBe(404);
    const still = await app.inject({ method: "GET", url: "/api/customers/1001" });
    expect(still.statusCode).toBe(200);
    expect(still.json().cudel).toBe(" ");
  });
});

describe("cus-interactive-c06 — option 5 (orders) stays legacy", () => {
  it("exposes no orders route in this pack", async () => {
    const res = await app.inject({ method: "GET", url: "/api/customers/1001/orders" });
    expect(res.statusCode).toBe(404);
  });
});

describe("cus-interactive-c05 — country prompt data", () => {
  it("lists the countries behind the F4 selector", async () => {
    const res = await app.inject({ method: "GET", url: "/api/countries" });
    expect(res.statusCode).toBe(200);
    expect(res.json().rows[0]).toEqual({ coid: "BE", countr: "Belgium", coiso: "BEL" });
  });
});
