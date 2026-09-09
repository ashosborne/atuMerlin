/**
 * PAR200 "Work with Parameters" at the TypeScript HTTP boundary (WAIVED_PATHFINDER: no IBM i
 * goldens, COMPARE at the TS API only). Each block cites the Discovery card it exercises. These
 * are provisional modern tests, not characterization goldens. Pack atu-merlin-ts-par-v1@1.
 * Cards: par-maintain-c01 (list), c02 (create), c04 (edit), c05 (delete), c03 / c06 (residual),
 * c11 (PATH reader over HTTP).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { DUPLICATE_MESSAGE, PARM2S_LENGTH } from "../src/features/par/par.service.js";
import { PAR_PAGE_SIZE } from "../src/features/par/par.repository.js";
import { createTestDb, type TestDb } from "./helpers/db.js";

let t: TestDb;
let app: FastifyInstance;

beforeAll(async () => {
  t = await createTestDb();
  app = await buildApp({ db: t.db });
  await app.ready();
});
afterAll(async () => {
  await app.close();
  await t.close();
});
beforeEach(async () => {
  await t.reset();
  await t.db.query("DELETE FROM parameter");
});

const BLANK = "%20";

async function create(body: unknown) {
  return app.inject({ method: "POST", url: "/api/parameters", payload: body as object });
}

async function created(body: unknown) {
  const res = await create(body);
  expect(res.statusCode).toBe(201);
  return res.json();
}

async function list(offset?: number) {
  const res = await app.inject({ method: "GET", url: offset === undefined ? "/api/parameters" : `/api/parameters?offset=${offset}` });
  expect(res.statusCode).toBe(200);
  return res.json() as { rows: Array<Record<string, unknown>>; more: boolean; nextOffset: number | null };
}

async function stored(pacode: string, pasubcode: string) {
  const r = await t.db.query("SELECT pacode, pasubcode, parm1, parm2, parm3, parm4, parm5 FROM parameter WHERE pacode = $1 AND pasubcode = $2", [
    pacode,
    pasubcode,
  ]);
  return r.rows[0] ?? null;
}

// ------------------------------------------------------------------------------- c02 create

describe("par-maintain-c02 — F6 create with duplicate-key check only", () => {
  it("writes the row with all seven fields and answers 201 with no message", async () => {
    const row = await created({ pacode: "PATH", pasubcode: "", parm1: "P1", parm2: "/home/sample/out/", parm3: "AB", parm4: 3, parm5: 45 });
    expect(row).toEqual({ pacode: "PATH", pasubcode: "", parm1: "P1", parm2: "/home/sample/out/", parm3: "AB", parm4: 3, parm5: 45 });
    expect(await stored("PATH", "")).toEqual(row);
  });

  it("validates the duplicate key only: ERRMSG 'This code/sub-code already exist.' on pacode", async () => {
    await created({ pacode: "PATH", pasubcode: "" });
    const res = await create({ pacode: "PATH", pasubcode: "", parm2: "/other/" });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ code: "VALIDATION", errors: [{ code: "DUPLICATE_KEY", field: "pacode", message: DUPLICATE_MESSAGE }] });
    // The existing row is untouched (the typed values were never written).
    expect((await stored("PATH", ""))!.parm2).toBe("");
  });

  it("accepts a blank code and blank sub-code (the blank/blank row) and blank / zero values", async () => {
    const row = await created({});
    expect(row).toEqual({ pacode: "", pasubcode: "", parm1: "", parm2: "", parm3: "", parm4: 0, parm5: 0 });
    expect(await stored("", "")).toEqual(row);
    // Same key twice is the one duplicate case even for the blank row.
    expect((await create({ pacode: " ", pasubcode: " " })).statusCode).toBe(400);
  });

  it("upper-cases the keys, PARM1 and PARM3 like the display; PARM2 (CHECK(LC)) keeps case", async () => {
    const row = await created({ pacode: "path", pasubcode: "sub", parm1: "abc", parm2: "/Home/Sample/Out/", parm3: "xy" });
    expect(row).toMatchObject({ pacode: "PATH", pasubcode: "SUB", parm1: "ABC", parm2: "/Home/Sample/Out/", parm3: "XY" });
    // ... which is the only reason GetParm2('PATH') finds a row typed in lower case (c09).
    await created({ pacode: "path", pasubcode: "", parm2: "/p/" });
    const res = await app.inject({ method: "GET", url: "/api/parameters/path" });
    expect(res.json()).toEqual({ path: "/p/" });
  });

  it("stores values right-trimmed; trailing blanks are fixed-length padding", async () => {
    const row = await created({ pacode: "K  ", pasubcode: "", parm1: "A ", parm2: "/x/  ", parm3: "B " });
    expect(row).toMatchObject({ pacode: "K", parm1: "A", parm2: "/x/", parm3: "B" });
  });

  it("does not validate values: PARM4 / PARM5 may be zero, negative, any digits within the width", async () => {
    const row = await created({ pacode: "N", pasubcode: "1", parm4: -9, parm5: "999" });
    expect(row).toMatchObject({ parm4: -9, parm5: 999 });
  });

  it("CR-P6: over-long or non-numeric input is refused 400 (impossible on the 5250 field widths)", async () => {
    const res = await create({ pacode: "ABCDEFGHIJK", pasubcode: "", parm1: "12345678901", parm2: "x".repeat(101), parm3: "ABC", parm4: 10, parm5: "12.5" });
    expect(res.statusCode).toBe(400);
    const codes = (res.json().errors as Array<{ code: string; field: string }>).map((e) => `${e.field}:${e.code}`).sort();
    expect(codes).toEqual([
      "pacode:FIELD_TOO_LONG",
      "parm1:FIELD_TOO_LONG",
      "parm2:FIELD_TOO_LONG",
      "parm3:FIELD_TOO_LONG",
      "parm4:FIELD_INVALID",
      "parm5:FIELD_INVALID",
    ]);
    expect((await create({ pacode: "T", pasubcode: 5 })).statusCode).toBe(400);
    expect(await t.db.query("SELECT count(*)::int AS n FROM parameter")).toMatchObject({ rows: [{ n: 0 }] });
  });
});

// ------------------------------------------------------------------------------- c01 list

describe("par-maintain-c01 — list in key order, 14 per load, exact Bottom, PARM2S", () => {
  async function fill(n: number, prefix = "K") {
    for (let i = 0; i < n; i++) await created({ pacode: `${prefix}${String(i).padStart(2, "0")}`, pasubcode: "", parm2: `v${i}` });
  }

  it("empty file: headings only — no rows, Bottom, no message", async () => {
    expect(await list()).toEqual({ rows: [], more: false, nextOffset: null });
  });

  it("lists every row in (PACODE, PASUBCODE) order with the blank/blank row first", async () => {
    await created({ pacode: "B", pasubcode: "2" });
    await created({ pacode: "B", pasubcode: "1" });
    await created({ pacode: "A", pasubcode: "Z" });
    await created({});
    const page = await list();
    expect(page.rows.map((r) => `${r.pacode}/${r.pasubcode}`)).toEqual(["/", "A/Z", "B/1", "B/2"]);
  });

  it("shows PARM2S (first 32 of PARM2) and the raw 1 / 3 / 4 / 5 columns; PARM2 itself is not a list field", async () => {
    const parm2 = "0123456789".repeat(5);
    await created({ pacode: "L", pasubcode: "", parm1: "ONE", parm2, parm3: "TH", parm4: 4, parm5: 5 });
    const [row] = (await list()).rows;
    expect(row).toEqual({ pacode: "L", pasubcode: "", parm1: "ONE", parm2s: parm2.slice(0, PARM2S_LENGTH), parm3: "TH", parm4: 4, parm5: 5 });
    expect(row).not.toHaveProperty("parm2");
  });

  it("exactly 14 rows shows Bottom at once — the look-ahead read finds no 15th row", async () => {
    await fill(PAR_PAGE_SIZE);
    const page = await list();
    expect(page.rows).toHaveLength(PAR_PAGE_SIZE);
    expect(page.more).toBe(false);
    expect(page.nextOffset).toBeNull();
  });

  it("15 rows: More... then a one-row page from the saved position (Page Down)", async () => {
    await fill(PAR_PAGE_SIZE + 1);
    const first = await list();
    expect(first.rows).toHaveLength(PAR_PAGE_SIZE);
    expect(first.more).toBe(true);
    expect(first.nextOffset).toBe(PAR_PAGE_SIZE);
    const second = await list(first.nextOffset!);
    expect(second.rows.map((r) => r.pacode)).toEqual(["K14"]);
    expect(second.more).toBe(false);
  });

  it("offset must be a non-negative integer", async () => {
    for (const bad of ["-1", "x", "1.5"]) {
      const res = await app.inject({ method: "GET", url: `/api/parameters?offset=${bad}` });
      expect(res.statusCode).toBe(400);
    }
  });
});

// ------------------------------------------------------------------------------- c04 edit

describe("par-maintain-c04 — option 2 edit values without validation", () => {
  it("FMT02 entry chains the full row (PARM2 at its full 100 width)", async () => {
    const parm2 = "/".padEnd(100, "y");
    await created({ pacode: "E", pasubcode: "1", parm2 });
    const res = await app.inject({ method: "GET", url: "/api/parameters/E/1" });
    expect(res.statusCode).toBe(200);
    expect(res.json().parm2).toBe(parm2);
  });

  it("updates PARM1..5 unconditionally; the key is output-only and cannot change", async () => {
    await created({ pacode: "E", pasubcode: "1", parm1: "OLD", parm2: "/old/", parm3: "OL", parm4: 1, parm5: 1 });
    const res = await app.inject({
      method: "PUT",
      url: "/api/parameters/e/1",
      payload: { pacode: "OTHER", pasubcode: "X", parm1: "new", parm2: "/New/", parm3: "nw", parm4: 2, parm5: 22 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pacode: "E", pasubcode: "1", parm1: "NEW", parm2: "/New/", parm3: "NW", parm4: 2, parm5: 22 });
    expect(await stored("OTHER", "X")).toBeNull();
  });

  it("an unchanged panel still updates; an absent field is written blank / zero (no 'changed?' test)", async () => {
    await created({ pacode: "E", pasubcode: "2", parm1: "KEEP", parm2: "/keep/", parm4: 5 });
    const res = await app.inject({ method: "PUT", url: "/api/parameters/E/2", payload: { parm2: "/keep/" } });
    expect(res.statusCode).toBe(200);
    expect(await stored("E", "2")).toEqual({ pacode: "E", pasubcode: "2", parm1: "", parm2: "/keep/", parm3: "", parm4: 0, parm5: 0 });
  });

  it("CR-P5: update on a row that no longer exists -> 404 (legacy: unmonitored RPG 01221)", async () => {
    const res = await app.inject({ method: "PUT", url: "/api/parameters/GONE/1", payload: { parm2: "/x/" } });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ code: "PARAMETER_NOT_FOUND", message: "Parameter (GONE, 1) not found", pacode: "GONE", pasubcode: "1" });
    expect((await app.inject({ method: "GET", url: "/api/parameters/GONE/1" })).statusCode).toBe(404);
  });

  it("the blank/blank row is addressed with a blank in each key segment", async () => {
    await created({});
    const res = await app.inject({ method: "PUT", url: `/api/parameters/${BLANK}/${BLANK}`, payload: { parm1: "B" } });
    expect(res.statusCode).toBe(200);
    expect((await stored("", ""))!.parm1).toBe("B");
    expect((await app.inject({ method: "GET", url: `/api/parameters/${BLANK}/${BLANK}` })).json().parm1).toBe("B");
  });

  it("editing PATH is seen by the next getPath call (CR-P1, no per-job cache)", async () => {
    await created({ pacode: "PATH", pasubcode: "", parm2: "/a/" });
    await app.inject({ method: "PUT", url: `/api/parameters/PATH/${BLANK}`, payload: { parm2: "/b/" } });
    expect((await app.inject({ method: "GET", url: "/api/parameters/path" })).json()).toEqual({ path: "/b/" });
  });
});

// ------------------------------------------------------------------------------- c05 delete

describe("par-maintain-c05 — option 4 immediate delete, no confirmation", () => {
  it("deletes by key with no confirmation and no message; 204", async () => {
    await created({ pacode: "D", pasubcode: "1" });
    const res = await app.inject({ method: "DELETE", url: "/api/parameters/D/1" });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe("");
    expect(await stored("D", "1")).toBeNull();
  });

  it("not found is silent: a second 4 (or a row deleted by another job) answers 204 too", async () => {
    expect((await app.inject({ method: "DELETE", url: "/api/parameters/D/1" })).statusCode).toBe(204);
  });

  it("no in-use check: the PATH row can be deleted while consumers depend on it; getPath then returns blank", async () => {
    await created({ pacode: "PATH", pasubcode: "", parm2: "/out/" });
    expect((await app.inject({ method: "DELETE", url: `/api/parameters/PATH/${BLANK}` })).statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: "/api/parameters/path" })).json()).toEqual({ path: "" });
  });

  it("a blank/blank key deletes the blank/blank row if one exists (the ghost-row case of c05)", async () => {
    await created({});
    await created({ pacode: "KEEP", pasubcode: "" });
    expect((await app.inject({ method: "DELETE", url: `/api/parameters/${BLANK}/${BLANK}` })).statusCode).toBe(204);
    expect(await stored("", "")).toBeNull();
    expect(await stored("KEEP", "")).not.toBeNull();
  });
});

// ------------------------------------------------------------------------------- c11 / c03 / c06

describe("par-maintain-c11 — the PATH reader over HTTP", () => {
  it("GET /api/parameters/path is GetParm2('PATH':' '): blank when missing, as stored otherwise", async () => {
    expect((await app.inject({ method: "GET", url: "/api/parameters/path" })).json()).toEqual({ path: "" });
    await created({ pacode: "PATH", pasubcode: "", parm2: "/home/sample/out" });
    // No trailing-slash normalisation (c07, known_risk).
    expect((await app.inject({ method: "GET", url: "/api/parameters/path" })).json()).toEqual({ path: "/home/sample/out" });
  });

  it("'path' is the reader, not a one-segment key: a real key has two segments", async () => {
    await created({ pacode: "PATH", pasubcode: "X", parm2: "/sub/" });
    expect((await app.inject({ method: "GET", url: "/api/parameters/path" })).json()).toEqual({ path: "" });
    expect((await app.inject({ method: "GET", url: "/api/parameters/path/x" })).json().parm2).toBe("/sub/");
  });
});

describe("par-maintain-c03 / c06 — subfile snapshot and key mechanics are residual (CR-P2)", () => {
  it("the list is re-read on every call: a created row is visible at once, no duplicate after Bottom", async () => {
    await created({ pacode: "A", pasubcode: "" });
    await created({ pacode: "B", pasubcode: "" });
    expect((await list()).rows.map((r) => r.pacode)).toEqual(["A", "B"]);
    await created({ pacode: "C", pasubcode: "" });
    expect((await list()).rows.map((r) => r.pacode)).toEqual(["A", "B", "C"]);
  });

  it("an edited row shows its new values in the list; a deleted row is gone (no ghost row)", async () => {
    await created({ pacode: "A", pasubcode: "", parm1: "OLD" });
    await created({ pacode: "B", pasubcode: "" });
    await app.inject({ method: "PUT", url: `/api/parameters/A/${BLANK}`, payload: { parm1: "NEW" } });
    await app.inject({ method: "DELETE", url: `/api/parameters/B/${BLANK}` });
    expect((await list()).rows).toEqual([{ pacode: "A", pasubcode: "", parm1: "NEW", parm2s: "", parm3: "", parm4: 0, parm5: 0 }]);
  });
});
