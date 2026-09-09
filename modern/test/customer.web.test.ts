/** Simple web UI (DSPF -> web) smoke tests: screens render, forms round-trip, output is escaped. */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { createTestDb, insertCustomer, type TestDb } from "./helpers/db.js";

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
beforeEach(() => t.reset());

const form = (fields: Record<string, string>) => new URLSearchParams(fields).toString();
const formHeaders = { "content-type": "application/x-www-form-urlencoded" };

describe("CUS200 work-with list", () => {
  it("renders rows with Edit links, the Del column and Bottom", async () => {
    const res = await app.inject({ method: "GET", url: "/customers" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain('href="/customers/1001/edit"');
    expect(res.body).toContain("Elektro Meyer");
    expect(res.body).toContain("Bottom");
  });

  it("shows More... with a Page Down link when a 15th row exists", async () => {
    for (let i = 0; i < 15; i++) await insertCustomer(t.db, { cuid: 100 + i, custnm: `Row ${String(i).padStart(2, "0")}` });
    const res = await app.inject({ method: "GET", url: "/customers?positionTo=Row" });
    expect(res.body).toContain("More...");
    expect(res.body).toContain("cursorName=Row+14&amp;cursorId=114");
  });

  it("escapes customer data", async () => {
    await insertCustomer(t.db, { cuid: 100, custnm: `<script>alert(1)</script>` });
    const res = await app.inject({ method: "GET", url: "/customers?positionTo=%3Cscript" });
    expect(res.body).not.toContain("<script>alert");
    expect(res.body).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("CUS200 FMT02 create / update", () => {
  it("re-renders the form with every error on a failed check", async () => {
    const res = await app.inject({ method: "POST", url: "/customers", headers: formHeaders, payload: form({ custnm: "", cuphone: "", cucoun: "" }) });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain("The name is mandatory");
    expect(res.body).toContain("A phone number is mandatory");
    expect(res.body).toContain("Country code unknown. Press F4 to select.");
    expect(res.body).toContain("Mode: <strong>CRT</strong>");
  });

  it("creates and returns to the list positioned on the new name", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/customers",
      headers: { ...formHeaders, "x-user-id": "WEBUSER" },
      payload: form({ custnm: "Web Created", cuphone: "0700", cucoun: "GB", culimcre: "12.50" }),
    });
    expect(res.statusCode).toBe(303);
    expect(res.headers.location).toBe("/customers?positionTo=Web+Create");
    const api = await app.inject({ method: "GET", url: "/api/customers/1551" });
    expect(api.json()).toMatchObject({ custnm: "Web Created", cumodid: "WEBUSER", culimcre: 12.5 });
  });

  it("edit form shows UPD mode with the stored values; update round-trips", async () => {
    const page = await app.inject({ method: "GET", url: "/customers/1001/edit" });
    expect(page.body).toContain("Mode: <strong>UPD</strong>");
    expect(page.body).toContain('value="Arcad Software"');

    const res = await app.inject({
      method: "POST",
      url: "/customers/1001",
      headers: formHeaders,
      payload: form({ custnm: "Arcad Software", cuphone: "0450578396", cucoun: "FR", cucity: "Annecy-le-Vieux" }),
    });
    expect(res.statusCode).toBe(303);
    expect((await app.inject({ method: "GET", url: "/api/customers/1001" })).json().cucity).toBe("Annecy-le-Vieux");
  });

  it("unknown id on the edit screen reads Code &1 Unknown.", async () => {
    const res = await app.inject({ method: "GET", url: "/customers/4242/edit" });
    expect(res.statusCode).toBe(404);
    expect(res.body).toContain("Code 4242 Unknown.");
  });
});

describe("CUS250 inquiry and CUS301 selector", () => {
  it("prompt -> hit redirects to the detail; miss redisplays the prompt with ERR0103", async () => {
    const hit = await app.inject({ method: "GET", url: "/customers/inquiry/go?cuid=1003" });
    expect(hit.headers.location).toBe("/customers/1003");

    const miss = await app.inject({ method: "GET", url: "/customers/inquiry/go?cuid=77" });
    expect(miss.headers.location).toBe("/customers/inquiry?cuid=77&err=Code+77+Unknown.");

    const blank = await app.inject({ method: "GET", url: "/customers/inquiry/go?cuid=" });
    expect(miss.statusCode).toBe(303);
    expect(blank.headers.location).toBe("/customers/inquiry?cuid=&err=Code++Unknown.");
  });

  it("detail shows the country name and the raw last-order number, not audit fields", async () => {
    const res = await app.inject({ method: "GET", url: "/customers/1001" });
    expect(res.body).toContain("FR France");
    expect(res.body).toContain("<dd>20240315</dd>");
    expect(res.body).not.toContain("SEED");
  });

  it("selector lists matches with a Select link back to the caller, and refuses off-site return targets", async () => {
    const res = await app.inject({ method: "GET", url: "/customers/select?name=rossi&returnTo=/customers/inquiry/go&param=cuid" });
    expect(res.body).toContain('href="/customers/inquiry/go?cuid=1003"');
    expect(res.body).toContain("Casa Rossi");

    const evil = await app.inject({ method: "GET", url: "/customers/select?returnTo=//evil.example/x" });
    expect(evil.body).not.toContain("evil.example");
  });
});
