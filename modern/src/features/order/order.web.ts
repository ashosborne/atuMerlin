import type { FastifyInstance, FastifyReply } from "fastify";
import type { FArticle } from "../../shared/farticle/index.js";
import type { FCustomer } from "../../shared/fcustomer/index.js";
import { userOf } from "../customer/customer.routes.js";
import { esc } from "../customer/customer.web.js";
import { documentText } from "./order.document.js";
import { parseLine, parseOrid } from "./order.routes.js";
import { OrderNotFoundError, OrderOptionError, OrderValidationError, type OrderService } from "./order.service.js";
import { MESSAGES, type DraftLine, type OrderDetail, type OrderError, type OrderListPage, type QuotedLine } from "./order.types.js";

export interface OrderWebDeps {
  service: OrderService;
  farticle: FArticle;
  fcustomer: FCustomer;
}

/**
 * Simple web UI (pack ui: simple-web; mapping rule DSPF -> web). Server-rendered HTML, no client
 * framework. Screen mapping:
 *   ORD201D CTL01/SFL01 (all orders)      -> /orders                 (F5, F6, Page Down, options 2 4 5 6 7 8)
 *   ORD200D CTL01/SFL01 (one customer)    -> /orders?cuid=N          (F6 with the customer preselected;
 *                                             option 2 refused on every row — planted defect kept, c09)
 *   ORD100D FMT02 / CTL01 (create)        -> /orders/new             (staged lines carried in the form)
 *   ORD100D FMT03 (acknowledgement)       -> /orders/:id/confirmed
 *   ORD202D (display)                     -> /orders/:id             (description hidden until F11=Detail, c02)
 *   ORD101D (line maintenance)            -> /orders/:id/lines
 *   ORD500O (print)                       -> /orders/:id/document    (text; no PDF)
 * Subfile option mechanics (one refused row cancels the pass, READC ordering, ghost rows after a
 * delete, sticky dead option 3) are replaced by one action per request and a reload.
 */
export async function orderWeb(app: FastifyInstance, deps: OrderWebDeps): Promise<void> {
  const { service, farticle, fcustomer } = deps;

  // ---------------------------------------------------------------- ORD200 / ORD201 lists
  app.get<{ Querystring: { cuid?: string; offset?: string; msg?: string } }>("/orders", async (req, reply) => {
    const cuidRaw = req.query.cuid;
    const cuid = cuidRaw === undefined || cuidRaw === "" ? undefined : Number(cuidRaw);
    const offset = Number(req.query.offset ?? 0);
    const page = await service.list({ cuid: Number.isInteger(cuid) ? cuid : undefined, offset: Number.isInteger(offset) ? offset : 0 });
    const perCustomer = cuid !== undefined;
    const custnm = perCustomer ? await fcustomer.getCusName(cuid) : "";
    const keep = perCustomer ? { cuid: String(cuid) } : {};
    const here = `/orders${perCustomer ? `?${qs(keep)}` : ""}`;
    return html(
      reply,
      "Work with Customer Orders",
      `
${perCustomer ? `<p class="mode">${esc(String(cuid))} ${esc(custnm)}</p>` : ""}
${req.query.msg ? `<p class="err">${esc(req.query.msg)}</p>` : ""}
<div class="bar">
  <a class="btn" href="${perCustomer ? "/customers" : "/"}">F3=Exit</a>
  ${perCustomer ? "" : `<a class="btn" href="/orders">F5=Refresh</a>`}
  <a class="btn" href="/orders/new${perCustomer ? `?${qs(keep)}` : ""}">F6=Create</a>
  <a class="btn" href="${perCustomer ? "/customers" : "/"}">F12=Cancel</a>
</div>
<p class="muted">2=Edit 4=Delete 5=Display 6=Print 7=Close 8=Deliver</p>
<table>
  <thead><tr><th>Opt</th><th class="num">Order</th><th class="num">Year</th><th>Creation</th><th class="num">Value</th><th>Delivery</th><th>Close</th>${perCustomer ? "" : `<th class="num">Cust ID</th><th>Customer name</th>`}</tr></thead>
  <tbody>
  ${page.rows
    .map((r) => {
      const closed = r.ordatclo !== null;
      // ord-maintain-ord200-c09: `opt01 = 2 or opt01 = 4 and datclo > datBlank` — every 2 is refused
      // as "Closed order" in the per-customer list; ORD201 has the parentheses.
      const editRefused = perCustomer || closed;
      const edit = editRefused
        ? `<span class="muted" title="${esc(MESSAGES.CLOSED_ORDER)}">2=Edit</span>`
        : `<a href="/orders/${r.orid}/lines">2=Edit</a>`;
      const act = (path: string, label: string) =>
        `<form method="post" action="/orders/${r.orid}/${path}" class="inline"><input type="hidden" name="returnTo" value="${esc(here)}"><button type="submit">${label}</button></form>`;
      return `<tr>
    <td class="opts">${edit} ${act("delete", "4=Delete")} <a href="/orders/${r.orid}">5=Display</a> <a href="/orders/${r.orid}/document">6=Print</a> ${act("close", "7=Close")} ${act("deliver", "8=Deliver")}</td>
    <td class="num">${r.orid}</td><td class="num">${r.oryear}</td><td>${esc(r.ordate)}</td><td class="num">${money(r.totval)}</td>
    <td>${esc(r.ordatdel ?? "")}</td><td>${esc(r.ordatclo ?? "")}</td>${perCustomer ? "" : `<td class="num">${r.orcuid}</td><td>${esc(r.custnm)}</td>`}</tr>`;
    })
    .join("")}
  ${page.rows.length === 0 ? `<tr><td colspan="9" class="muted">(no orders)</td></tr>` : ""}
  </tbody>
</table>
<p class="muted">${page.more ? `More... <a href="/orders?${qs({ ...keep, offset: String(page.nextOffset) })}">Page Down</a>` : "Bottom"}</p>`,
    );
  });

  const listAction = (path: "delete" | "close" | "deliver") =>
    app.post<{ Params: { id: string }; Body: { returnTo?: string } }>(`/orders/:id/${path}`, async (req, reply) => {
      const orid = parseOrid(req.params.id);
      const back = safeReturnTo(req.body?.returnTo);
      if (orid === null) return reply.redirect(`${withParam(back, "msg", `Order ${req.params.id} not found`)}`, 303);
      try {
        const user = userOf(req.headers);
        if (path === "delete") await service.deleteOrder(orid, user);
        else if (path === "close") await service.close(orid, user);
        else await service.deliver(orid, user);
        return reply.redirect(back, 303);
      } catch (e) {
        if (e instanceof OrderOptionError || e instanceof OrderNotFoundError) {
          return reply.redirect(withParam(back, "msg", e.message), 303);
        }
        throw e;
      }
    });
  listAction("delete");
  listAction("close");
  listAction("deliver");

  // ---------------------------------------------------------------- ORD100 create
  app.get<{ Querystring: { cuid?: string } }>("/orders/new", async (req, reply) => {
    const cuid = Number(req.query.cuid ?? 0);
    // %parms = 0 or cuid = 0 -> SltCustomer(0) (c01); F3/F12 there ends the program with no order.
    if (!Number.isInteger(cuid) || cuid <= 0) {
      return reply.redirect(`/customers/select?${qs({ returnTo: "/orders/new", param: "cuid" })}`, 303);
    }
    return html(reply, "Add a customer Order Line", await draftHtml(cuid, 0, [], [], farticle, fcustomer, service));
  });

  app.post<{ Body: Record<string, unknown> }>("/orders/new", async (req, reply) => {
    const body = req.body ?? {};
    const cuid = Number(body.cuid);
    if (!Number.isInteger(cuid) || cuid <= 0) return reply.redirect("/orders/new", 303);
    let count = Number(body.count) || 0;
    const action = String(body.action ?? "recalc");
    let staged = parseStaged(body.staged);

    // Enter on FMT02 / the list: typed qty and price replace the staged values (c04 recompute).
    staged = staged.map((l) => ({
      ...l,
      odqty: numberOr(body[`odqty_${l.odline}`], l.odqty),
      odprice: numberOr(body[`odprice_${l.odline}`], l.odprice),
    }));

    const errors: OrderError[] = [];
    if (action === "add") {
      // F6 -> SltArticle. The line counter increments even when the prompt is cancelled (c12).
      count += 1;
      const odarid = String(body.newArid ?? "").trim().slice(0, 6);
      if (odarid !== "") {
        try {
          const q = await service.quoteLine({ odarid, odline: count });
          staged.push({ odline: q.odline, odarid: q.odarid, odqty: q.odqty, odprice: q.odprice });
        } catch (e) {
          if (e instanceof OrderValidationError) errors.push(...e.errors);
          else throw e;
        }
      }
    } else if (action.startsWith("delete:")) {
      // Option 4: the row goes; `count` is not decremented (c05, c12).
      const n = Number(action.slice("delete:".length));
      staged = staged.filter((l) => l.odline !== n);
    } else if (action === "confirm") {
      try {
        const detail = await service.confirm({ orcuid: cuid, lines: staged }, userOf(req.headers));
        return reply.redirect(`/orders/${detail.orid}/confirmed`, 303);
      } catch (e) {
        if (e instanceof OrderValidationError) errors.push(...e.errors);
        else throw e;
      }
    }
    return html(reply, "Add a customer Order Line", await draftHtml(cuid, count, staged, errors, farticle, fcustomer, service), errors.length ? 400 : 200);
  });

  // ORD100 FMT03 window (c08): shown after confirm; any key ends the program.
  app.get<{ Params: { id: string } }>("/orders/:id/confirmed", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFoundPage(reply, req.params.id);
    try {
      const o = await service.get(orid);
      return html(
        reply,
        "Confirmation",
        `
<p>Order ${o.orid} has been create for user ${o.orcuid} ${esc(o.custnm)}</p>
<p>The order is printed. <a href="/orders/${o.orid}/document">(view document)</a></p>
<p>Press Enter to continue.</p>
<div class="bar"><a class="btn" href="/orders">Enter</a></div>`,
      );
    } catch (e) {
      if (e instanceof OrderNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });

  // ---------------------------------------------------------------- ORD202 display
  app.get<{ Params: { id: string }; Querystring: { detail?: string } }>("/orders/:id", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFoundPage(reply, req.params.id);
    try {
      const o = await service.get(orid);
      // SFLDROP(CF11): the description line is hidden until F11=Detail (ord-maintain-ord202-c02).
      const folded = req.query.detail === "1";
      return html(
        reply,
        "Display a Customer Orders",
        `
<dl class="detail">
  ${dt("Order . . .", `${o.orid} ${o.oryear}`)}${dt("Customer  .", `${o.orcuid} ${o.custnm}`)}
  ${dt("Création  .", o.ordate)}${dt("Delivery  .", o.ordatdel ?? "")}${dt("Close . . .", o.ordatclo ?? "")}
</dl>
<table>
  <thead><tr><th class="num">Line</th><th>Article</th><th class="num">Qty</th><th class="num">Deliver</th><th class="num">Un.Price</th><th class="num">Total</th><th class="num">With VAT</th></tr></thead>
  <tbody>
  ${o.lines
    .map(
      (l) => `<tr><td class="num">${l.odline}</td><td>${esc(l.odarid)}</td><td class="num">${l.odqty}</td><td class="num">${zeroBlank(l.odqtyliv)}</td>
    <td class="num">${money(l.odprice)}</td><td class="num">${money(l.odtot)}</td><td class="num">${money(l.odtotvat)}</td></tr>
    ${folded ? `<tr class="fold"><td></td><td colspan="6">${esc(l.ardesc)}</td></tr>` : ""}`,
    )
    .join("")}
  </tbody>
  <tfoot><tr><th colspan="5"></th><th class="num">${money(o.tot)}</th><th class="num">${money(o.totvat)}</th></tr></tfoot>
</table>
<div class="bar"><a class="btn" href="/orders">F3=Exit</a>
  <a class="btn" href="/orders/${o.orid}${folded ? "" : "?detail=1"}">F11=Detail</a>
  <a class="btn" href="/orders">F12=Cancel</a></div>`,
      );
    } catch (e) {
      if (e instanceof OrderNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });

  // ---------------------------------------------------------------- ORD500 document
  app.get<{ Params: { id: string } }>("/orders/:id/document", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFoundPage(reply, req.params.id);
    try {
      return reply.type("text/plain; charset=utf-8").send(documentText(await service.document(orid)));
    } catch (e) {
      if (e instanceof OrderNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });

  // ---------------------------------------------------------------- ORD101 line maintenance
  app.get<{ Params: { id: string }; Querystring: { msg?: string } }>("/orders/:id/lines", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFoundPage(reply, req.params.id);
    try {
      const o = await service.get(orid);
      return html(reply, "Update a customer Order", linesHtml(o, null, [], req.query.msg));
    } catch (e) {
      if (e instanceof OrderNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });

  app.post<{ Params: { id: string; line: string }; Body: Record<string, unknown> }>("/orders/:id/lines/:line", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    const odline = parseLine(req.params.line);
    if (orid === null || odline === null) return notFoundPage(reply, req.params.id);
    try {
      await service.updateLine(orid, odline, req.body, userOf(req.headers));
      return reply.redirect(`/orders/${orid}/lines`, 303);
    } catch (e) {
      if (e instanceof OrderNotFoundError) return notFoundPage(reply, req.params.id);
      if (e instanceof OrderValidationError) {
        const o = await service.get(orid);
        const { input } = service.parseLineInput(req.body);
        return html(reply, "Update a customer Order", linesHtml(o, { odline, ...input }, e.errors), 400);
      }
      throw e;
    }
  });

  app.post<{ Params: { id: string; line: string } }>("/orders/:id/lines/:line/delete", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    const odline = parseLine(req.params.line);
    if (orid === null || odline === null) return notFoundPage(reply, req.params.id);
    try {
      await service.deleteLine(orid, odline, userOf(req.headers));
      return reply.redirect(`/orders/${orid}/lines`, 303);
    } catch (e) {
      if (e instanceof OrderOptionError) return reply.redirect(`/orders/${orid}/lines?${qs({ msg: e.message })}`, 303);
      if (e instanceof OrderNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });
}

// -------------------------------------------------------------------- ORD100 draft rendering

async function draftHtml(
  cuid: number,
  count: number,
  staged: DraftLine[],
  errors: OrderError[],
  farticle: FArticle,
  fcustomer: FCustomer,
  service: OrderService,
): Promise<string> {
  const custname = await fcustomer.getCusName(cuid);
  const articles = await farticle.listArticles();
  const quoted: QuotedLine[] = [];
  for (const l of staged) {
    try {
      quoted.push(await service.quoteLine(l));
    } catch (e) {
      if (!(e instanceof OrderValidationError)) throw e;
      quoted.push({ ...l, ardesc: "", odtot: 0, vat: 0, odtotvat: 0, vatRate: 0 });
      errors.push(...e.errors.map((x) => ({ ...x, field: `line ${l.odline} ${x.field}` })));
    }
  }
  const tot = quoted.reduce((s, l) => s + l.odtot, 0);
  const totvat = quoted.reduce((s, l) => s + l.odtotvat, 0);
  return `
<form method="post" action="/orders/new" class="stack">
  <input type="hidden" name="cuid" value="${cuid}"><input type="hidden" name="count" value="${count}">
  ${staged.map((l) => `<input type="hidden" name="staged" value="${esc(encodeStaged(l))}">`).join("")}
  <p class="mode">${cuid} ${esc(custname)}</p>
  ${errors.map((e) => `<span class="err">${esc(e.field)}: ${esc(e.message)}</span>`).join("")}
  <label>Article (F6=Add, pick from list) <input name="newArid" maxlength="6" list="articles">
    <datalist id="articles">${articles.map((a) => `<option value="${esc(a.arid)}">${esc(a.ardesc)} — ${money(a.arsalepr)}</option>`).join("")}</datalist>
    <button type="submit" name="action" value="add">F6=Add</button></label>
  <table>
    <thead><tr><th>Opt</th><th class="num">Line</th><th>Article</th><th>Description</th><th class="num">Qty</th><th class="num">U.Price</th><th class="num">Total</th><th class="num">VAT %</th><th class="num">With VAT</th></tr></thead>
    <tbody>
    ${quoted
      .map(
        (l) => `<tr>
      <td><button type="submit" name="action" value="delete:${l.odline}">4=Delete</button></td>
      <td class="num">${l.odline}</td><td>${esc(l.odarid)}</td><td>${esc(l.ardesc.slice(0, 30))}</td>
      <td class="num"><input class="short" name="odqty_${l.odline}" value="${l.odqty}"></td>
      <td class="num"><input class="short" name="odprice_${l.odline}" value="${l.odprice}"></td>
      <td class="num">${money(l.odtot)}</td><td class="num">${l.vatRate}</td><td class="num">${money(l.odtotvat)}</td></tr>`,
      )
      .join("")}
    ${quoted.length === 0 ? `<tr><td colspan="9" class="muted">(no lines)</td></tr>` : ""}
    </tbody>
    <tfoot><tr><th colspan="6"></th><th class="num">${money(tot)}</th><th></th><th class="num">${money(totvat)}</th></tr></tfoot>
  </table>
  <div class="bar">
    <button type="submit" name="action" value="recalc">Enter</button>
    <button type="submit" name="action" value="confirm">F8=Confirm</button>
    <a class="btn" href="/orders">F3=Exit</a><a class="btn" href="/orders">F12=Cancel</a>
  </div>
</form>`;
}

function encodeStaged(l: DraftLine): string {
  return [l.odline, l.odarid, l.odqty, l.odprice].join("|");
}

function parseStaged(raw: unknown): DraftLine[] {
  const items = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
  const lines: DraftLine[] = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const [n, arid, qty, price] = item.split("|");
    const odline = Number(n);
    if (!Number.isInteger(odline)) continue;
    lines.push({ odline, odarid: (arid ?? "").slice(0, 6), odqty: Number(qty) || 0, odprice: Number(price) || 0 });
  }
  return lines;
}

function numberOr(v: unknown, dflt: number): number {
  if (typeof v !== "string" || v.trim() === "") return dflt;
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

// -------------------------------------------------------------------- ORD101 rendering

function linesHtml(o: OrderDetail, editing: { odline: number; odqty: number; odqtyliv: number; odprice: number } | null, errors: OrderError[], msg?: string): string {
  const errFor = (f: string) => errors.filter((e) => e.field === f);
  return `
<p class="mode">${o.orcuid} ${esc(o.custnm)} — Order ${o.oryear} / ${o.orid}</p>
${msg ? `<p class="err">${esc(msg)}</p>` : ""}
<p class="muted">2=Edit 4=Delete <span title="Advertised on ORD101D but never implemented (ord-entry-ord101-c07)">6=Deliver</span></p>
<table>
  <thead><tr><th>Opt</th><th class="num">Line</th><th>Article</th><th>Description</th><th class="num">Qty</th><th class="num">Delivered</th><th class="num">U.Price</th><th class="num">Total</th></tr></thead>
  <tbody>
  ${o.lines
    .map((l) => {
      const e = editing && editing.odline === l.odline ? editing : l;
      return `<tr>
    <td class="opts"><form method="post" action="/orders/${o.orid}/lines/${l.odline}" class="inline" id="edit-${l.odline}"><button type="submit">2=Edit / Enter</button></form>
      <form method="post" action="/orders/${o.orid}/lines/${l.odline}/delete" class="inline"><button type="submit">4=Delete</button></form></td>
    <td class="num">${l.odline}</td><td>${esc(l.odarid)}</td><td>${esc(l.ardesc.slice(0, 30))}</td>
    <td class="num ${errFor("odqty").length && e === editing ? "has-err" : ""}"><input class="short" form="edit-${l.odline}" name="odqty" value="${e.odqty}">${e === editing ? errFor("odqty").map((x) => `<span class="err">${esc(x.message)}</span>`).join("") : ""}</td>
    <td class="num ${errFor("odqtyliv").length && e === editing ? "has-err" : ""}"><input class="short" form="edit-${l.odline}" name="odqtyliv" value="${e.odqtyliv}">${e === editing ? errFor("odqtyliv").map((x) => `<span class="err">${esc(x.message)}</span>`).join("") : ""}</td>
    <td class="num"><input class="short" form="edit-${l.odline}" name="odprice" value="${e.odprice}"></td>
    <td class="num">${money(l.odtot)}</td></tr>`;
    })
    .join("")}
  ${o.lines.length === 0 ? `<tr><td colspan="8" class="muted">(no lines)</td></tr>` : ""}
  </tbody>
  <tfoot><tr><th colspan="7">Total ${money(o.tot)}</th><th class="num">With VAT ${money(o.totvat)}</th></tr></tfoot>
</table>
<div class="bar"><a class="btn" href="/orders">F3=Exit</a><a class="btn" href="/orders/${o.orid}/lines">F5=Refresh</a><a class="btn" href="/orders">F12=Cancel</a></div>`;
}

// -------------------------------------------------------------------- shared helpers

function notFoundPage(reply: FastifyReply, id: string) {
  return html(reply, "Display a Customer Orders", `<p class="err">Order ${esc(id)} not found.</p><a class="btn" href="/orders">Back</a>`, 404);
}

function html(reply: FastifyReply, title: string, body: string, status = 200) {
  return reply.code(status).type("text/html; charset=utf-8").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)} — atuMerlin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font:14px/1.4 system-ui,sans-serif;margin:1.5rem;max-width:72rem;color:#222}
h1{font-size:1.25rem;margin:0 0 1rem}
table{border-collapse:collapse;width:100%}th,td{padding:.3rem .5rem;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}
.num{text-align:right;font-variant-numeric:tabular-nums}
.bar{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.75rem 0}
.stack label{display:block;margin:.4rem 0}.stack input{width:24rem;max-width:100%}
input.short,.stack input.short{width:5rem;text-align:right}
.btn,button{display:inline-block;padding:.3rem .7rem;border:1px solid #888;border-radius:3px;background:#f4f4f4;color:#222;text-decoration:none;font:inherit;cursor:pointer}
.inline{display:inline}.opts{white-space:nowrap}.opts form{margin:0}
.muted{color:#777}.err{color:#a00;display:block}.has-err input{border-color:#a00}
.detail{display:grid;grid-template-columns:10rem 1fr;gap:.25rem 1rem}.detail dt{color:#555;font-family:ui-monospace,monospace}.detail dd{margin:0}
.fold td{color:#555}
.mode{font-family:ui-monospace,monospace}
</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`);
}

function dt(label: string, value: string) {
  return `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;
}

function money(n: number): string {
  return n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** EDTCDE(2) on the ORD202 screen: zero shows blank. */
function zeroBlank(n: number): string {
  return n === 0 ? "" : String(n);
}

function qs(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

function safeReturnTo(v: string | undefined): string {
  return v && /^\/[^/\\]/.test(v) ? v : "/orders";
}

function withParam(path: string, key: string, value: string): string {
  const u = new URL(path, "http://local");
  u.searchParams.set(key, value);
  return u.pathname + u.search;
}
