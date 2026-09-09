/**
 * ORD web UI (DSPF -> web) at the HTTP boundary: server-rendered pages, form posts, redirects.
 * Pack atu-merlin-ts-ord-v1@1, WAIVED_PATHFINDER — provisional modern tests, not goldens.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
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
beforeEach(() => t.reset());

async function createOrder(orcuid: number, lines: Array<{ odarid: string; odqty: number; odprice: number }>) {
  const res = await app.inject({ method: "POST", url: "/api/orders", payload: { orcuid, lines: lines.map((l, i) => ({ odline: i + 1, ...l })) } });
  expect(res.statusCode).toBe(201);
  return res.json();
}

function form(body: Record<string, string | string[]>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
    else p.append(k, v);
  }
  return p.toString();
}

const post = (url: string, body: Record<string, string | string[]>) =>
  app.inject({ method: "POST", url, headers: { "content-type": "application/x-www-form-urlencoded" }, payload: form(body) });

describe("ORD201 / ORD200 lists (/orders)", () => {
  it("ORD201 twin lists every order with the customer, F5/F6 and a working 2=Edit; closed rows refuse 2", async () => {
    const open = await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 10 }]);
    const closed = await createOrder(1002, []);
    await t.db.query("UPDATE orders SET ordatclo = CURRENT_DATE WHERE orid = $1", [closed.orid]);
    const res = await app.inject({ method: "GET", url: "/orders" });
    expect(res.statusCode).toBe(200);
    const body = res.body;
    expect(body).toContain("Work with Customer Orders");
    expect(body).toContain("F5=Refresh");
    expect(body).toContain('href="/orders/new"');
    expect(body).toContain("Arcad Software");
    expect(body).toContain("Baker Street Books");
    expect(body).toContain(`href="/orders/${open.orid}/lines">2=Edit`);
    expect(body).not.toContain(`href="/orders/${closed.orid}/lines">2=Edit`);
    expect(body).toContain("Bottom");
  });

  it("ORD200 twin (cuid) shows the customer header, F6 with the customer preselected, no F5, and refuses EVERY 2=Edit (planted defect c09)", async () => {
    const o = await createOrder(1001, []);
    await createOrder(1002, []);
    const res = await app.inject({ method: "GET", url: "/orders?cuid=1001" });
    const body = res.body;
    expect(body).toContain("1001 Arcad Software");
    expect(body).not.toContain("Baker Street Books");
    expect(body).not.toContain("F5=Refresh");
    expect(body).toContain('href="/orders/new?cuid=1001"');
    expect(body).not.toContain(`href="/orders/${o.orid}/lines"`);
    expect(body).toContain('title="Closed order can not be edited or deleted">2=Edit');
  });

  it("option 7 / 8 / 4 post back and redirect; refusals come back as the SFLMSG text", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 2, odprice: 5 }]);
    const close = await post(`/orders/${o.orid}/close`, { returnTo: "/orders" });
    expect(close.statusCode).toBe(303);
    expect(close.headers.location).toBe("/orders");
    const again = await post(`/orders/${o.orid}/close`, { returnTo: "/orders" });
    expect(again.headers.location).toBe("/orders?msg=Invalid+Option");
    const del = await post(`/orders/${o.orid}/delete`, { returnTo: "/orders?cuid=1001" });
    expect(del.headers.location).toBe("/orders?cuid=1001&msg=Closed+order+can+not+be+edited+or+deleted");
    const page = await app.inject({ method: "GET", url: del.headers.location as string });
    expect(page.body).toContain("Closed order can not be edited or deleted");
  });
});

describe("ORD100 create (/orders/new)", () => {
  it("without a customer redirects to the SltCustomer window, returning to /orders/new?cuid=", async () => {
    const res = await app.inject({ method: "GET", url: "/orders/new" });
    expect(res.statusCode).toBe(303);
    expect(res.headers.location).toBe("/customers/select?returnTo=%2Forders%2Fnew&param=cuid");
  });

  it("F6 add stages a line with defaults, a cancelled prompt still counts, Enter recomputes, F8 confirms and acknowledges", async () => {
    const start = await app.inject({ method: "GET", url: "/orders/new?cuid=1001" });
    expect(start.statusCode).toBe(200);
    expect(start.body).toContain("1001 Arcad Software");
    expect(start.body).toContain("Add a customer Order Line");

    // F6 with a blank article: the counter moves to 1 and no row is staged (c03 / c12).
    const cancelled = await post("/orders/new", { cuid: "1001", count: "0", action: "add", newArid: "" });
    expect(cancelled.body).toContain('name="count" value="1"');
    expect(cancelled.body).toContain("(no lines)");

    // F6 with an article: staged as line 2 with qty 1 and the reference price.
    const added = await post("/orders/new", { cuid: "1001", count: "1", action: "add", newArid: "A00001" });
    expect(added.body).toContain('name="staged" value="2|A00001|1|149.9"');
    expect(added.body).toContain("179.88");

    // Enter with a typed quantity recomputes; nothing is written yet (c04, c13).
    const recalc = await post("/orders/new", { cuid: "1001", count: "2", action: "recalc", staged: ["2|A00001|1|149.9"], odqty_2: "2", odprice_2: "100" });
    expect(recalc.body).toContain('name="staged" value="2|A00001|2|100"');
    expect(recalc.body).toContain("240.00");
    expect((await t.db.query("SELECT COUNT(*)::int AS n FROM orders")).rows[0].n).toBe(0);

    // F8: header + lines written, renumbered from 1, then the FMT03 acknowledgement.
    const confirmed = await post("/orders/new", { cuid: "1001", count: "2", action: "confirm", staged: ["2|A00001|2|100"] });
    expect(confirmed.statusCode).toBe(303);
    expect(confirmed.headers.location).toBe("/orders/60720/confirmed");
    const ack = await app.inject({ method: "GET", url: "/orders/60720/confirmed" });
    expect(ack.body).toContain("Order 60720 has been create for user 1001 Arcad Software");
    expect(ack.body).toContain("The order is printed.");
    const lines = await t.db.query("SELECT odline, odarid, odqty, odprice FROM detord WHERE odorid = 60720");
    expect(lines.rows).toEqual([{ odline: 1, odarid: "A00001", odqty: 2, odprice: 100 }]);
  });

  it("option 4 removes a staged row without decrementing the counter", async () => {
    const res = await post("/orders/new", { cuid: "1001", count: "3", action: "delete:2", staged: ["2|A00001|1|149.9", "3|B00010|1|6.4"] });
    expect(res.body).not.toContain("2|A00001");
    expect(res.body).toContain('name="staged" value="3|B00010|1|6.4"');
    expect(res.body).toContain('name="count" value="3"');
  });
});

describe("ORD202 display (/orders/:id)", () => {
  it("shows header, lines and stored totals; the description is hidden until F11=Detail (c02)", async () => {
    const o = await createOrder(1003, [{ odarid: "C00100", odqty: 1, odprice: 24 }]);
    const res = await app.inject({ method: "GET", url: `/orders/${o.orid}` });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("Display a Customer Orders");
    expect(res.body).toContain("1003 Casa Rossi");
    expect(res.body).toContain("C00100");
    expect(res.body).not.toContain("Technical manual");
    const folded = await app.inject({ method: "GET", url: `/orders/${o.orid}?detail=1` });
    expect(folded.body).toContain("Technical manual, hydraulics");
    expect((await app.inject({ method: "GET", url: "/orders/424242" })).statusCode).toBe(404);
  });
});

describe("ORD101 line maintenance (/orders/:id/lines)", () => {
  it("edits a line, shows ERR1001 under the field, deletes a line, refuses a delivered line", async () => {
    const o = await createOrder(1001, [
      { odarid: "A00001", odqty: 5, odprice: 10 },
      { odarid: "A00002", odqty: 1, odprice: 1 },
    ]);
    const page = await app.inject({ method: "GET", url: `/orders/${o.orid}/lines` });
    expect(page.body).toContain("Update a customer Order");
    expect(page.body).toContain("6=Deliver"); // legend present, action absent (c07)

    const bad = await post(`/orders/${o.orid}/lines/1`, { odqty: "5", odqtyliv: "9", odprice: "10" });
    expect(bad.statusCode).toBe(400);
    expect(bad.body).toContain("Delivered quantity must be lower or equal to ordered quantity.");

    const ok = await post(`/orders/${o.orid}/lines/1`, { odqty: "6", odqtyliv: "2", odprice: "10" });
    expect(ok.statusCode).toBe(303);
    expect(ok.headers.location).toBe(`/orders/${o.orid}/lines`);

    const refused = await post(`/orders/${o.orid}/lines/1/delete`, {});
    expect(refused.headers.location).toBe(`/orders/${o.orid}/lines?msg=Line+with+delivery+can+not+be+deleted.`);

    const deleted = await post(`/orders/${o.orid}/lines/2/delete`, {});
    expect(deleted.statusCode).toBe(303);
    const rows = await t.db.query("SELECT odline FROM detord WHERE odorid = $1", [o.orid]);
    expect(rows.rows).toEqual([{ odline: 1 }]);
  });
});

describe("ORD500 document (/orders/:id/document)", () => {
  it("serves the spool text", async () => {
    const o = await createOrder(1001, [{ odarid: "A00001", odqty: 1, odprice: 10 }]);
    const res = await app.inject({ method: "GET", url: `/orders/${o.orid}/document` });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.body).toContain("Customer Order");
  });
});
