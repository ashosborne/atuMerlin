import type { FastifyInstance, FastifyReply } from "fastify";
import type { FCountry } from "../../shared/fcountry/index.js";
import type { FCustomer } from "../../shared/fcustomer/index.js";
import { CustomerNotFoundError, CustomerValidationError, type CustomerService } from "./customer.service.js";
import { parseId, userOf } from "./customer.routes.js";
import type { CustomerDetail, CustomerInput, ValidationError } from "./customer.types.js";

export interface CustomerWebDeps {
  service: CustomerService;
  fcustomer: FCustomer;
  fcountry: FCountry;
}

/**
 * Simple web UI (pack ui: simple-web; mapping rule DSPF -> web). Server-rendered HTML, no
 * client framework. Screen mapping:
 *   CUS200 CTL01/SFL01 -> /customers            (list, position-to, next page, New = F6, Edit = option 2)
 *   CUS200 FMT02       -> /customers/new, /customers/:id/edit
 *   CUS250 FMT01       -> /customers/inquiry    (id prompt, Select = F4)
 *   CUS250 FMT02       -> /customers/:id        (read-only detail)
 *   CUS301D            -> /customers/select     (SltCustomer window)
 * Subfile option mechanics (c12, cus-modules-c07/c08) are replaced by per-row links.
 */
export async function customerWeb(app: FastifyInstance, deps: CustomerWebDeps): Promise<void> {
  const { service, fcustomer, fcountry } = deps;

  app.get("/", async (_req, reply) => reply.redirect("/customers"));

  app.get<{ Querystring: { positionTo?: string; cursorName?: string; cursorId?: string } }>(
    "/customers",
    async (req, reply) => {
      const { positionTo, cursorName, cursorId } = req.query;
      const id = cursorId === undefined ? undefined : Number(cursorId);
      const page = await service.list({ positionTo, cursorName, cursorId: Number.isInteger(id) ? id : undefined });
      const nextHref = page.next
        ? `/customers?${qs({ cursorName: page.next.cursorName, cursorId: String(page.next.cursorId) })}`
        : null;
      return html(
        reply,
        "Work with Customers",
        `
<form method="get" action="/customers" class="bar">
  <label>Position to <input name="positionTo" maxlength="10" value="${esc(positionTo ?? "")}"></label>
  <button type="submit">Enter</button>
  <a class="btn" href="/customers">F5=Refresh</a>
  <a class="btn" href="/customers/new">F6=Create</a>
  <a class="btn" href="/customers/inquiry">Inquiry (CUS250)</a>
</form>
<table>
  <thead><tr><th>Opt</th><th class="num">Cust ID</th><th>Customer name</th><th class="num">Limit credit</th><th>Zip code</th><th>Del</th><th>City</th></tr></thead>
  <tbody>
  ${page.rows
    .map(
      // TODO(cus-interactive-c06): option 5 called ORD200(cuid); ORD is stay_legacy in pack
      // atu-merlin-ts-cus-v1@1 with interop none, so the action is shown but not wired.
      (r) => `<tr>
    <td><a href="/customers/${r.cuid}/edit">2=Edit</a> <span class="muted" title="ORD200 stays legacy in this pack (cus-interactive-c06)">5=Orders</span></td>
    <td class="num">${r.cuid}</td><td>${esc(r.custnm)}</td><td class="num">${money(r.culimcre)}</td>
    <td>${esc(r.cuzip)}</td><td>${esc(r.cudel)}</td><td>${esc(r.cucity)}</td></tr>`,
    )
    .join("")}
  ${page.rows.length === 0 ? `<tr><td colspan="7" class="muted">(no customers)</td></tr>` : ""}
  </tbody>
</table>
<p class="muted">${page.more ? `More... <a href="${esc(nextHref!)}">Page Down</a>` : "Bottom"}</p>`,
      );
    },
  );

  app.get("/customers/new", async (_req, reply) =>
    html(reply, "Customer — Create", await formHtml("CRT", null, emptyInput(), [], fcountry)),
  );

  app.post("/customers", async (req, reply) => {
    try {
      const created = await service.create(req.body, userOf(req.headers));
      return reply.redirect(`/customers?${qs({ positionTo: created.custnm.slice(0, 10) })}`, 303);
    } catch (e) {
      if (e instanceof CustomerValidationError) {
        const { input } = service.parseInput(req.body);
        return html(reply, "Customer — Create", await formHtml("CRT", null, input, e.errors, fcountry), 400);
      }
      throw e;
    }
  });

  app.get<{ Params: { id: string } }>("/customers/:id/edit", async (req, reply) => {
    const cuid = parseId(req.params.id);
    if (cuid === null) return notFoundPage(reply, req.params.id);
    try {
      const c = await service.get(cuid);
      return html(reply, "Customer — Update", await formHtml("UPD", c, c, [], fcountry));
    } catch (e) {
      if (e instanceof CustomerNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });

  app.post<{ Params: { id: string } }>("/customers/:id", async (req, reply) => {
    const cuid = parseId(req.params.id);
    if (cuid === null) return notFoundPage(reply, req.params.id);
    try {
      const updated = await service.update(cuid, req.body);
      return reply.redirect(`/customers?${qs({ positionTo: updated.custnm.slice(0, 10) })}`, 303);
    } catch (e) {
      if (e instanceof CustomerNotFoundError) return notFoundPage(reply, req.params.id);
      if (e instanceof CustomerValidationError) {
        const current = await service.get(cuid);
        const { input } = service.parseInput(req.body);
        return html(reply, "Customer — Update", await formHtml("UPD", current, input, e.errors, fcountry), 400);
      }
      throw e;
    }
  });

  app.get<{ Querystring: { cuid?: string; err?: string } }>("/customers/inquiry", async (req, reply) => {
    const cuid = req.query.cuid ?? "";
    const err = req.query.err;
    return html(
      reply,
      "Display Customer",
      `
<form method="get" action="/customers/inquiry/go" class="stack">
  <label>Customer ID <input name="cuid" inputmode="numeric" maxlength="5" value="${esc(cuid)}"></label>
  <div class="bar"><button type="submit">Enter</button>
  <a class="btn" href="/customers/select?${qs({ returnTo: "/customers/inquiry/go", param: "cuid" })}">F4=Prompt</a>
  <a class="btn" href="/customers">F3=Exit</a></div>
  ${err ? `<p class="err">${esc(err)}</p>` : ""}
</form>`,
    );
  });

  // CUS250 S01chk: chain by id; not found -> ERR0103 on FMT01 with the id still typed (c09).
  app.get<{ Querystring: { cuid?: string } }>("/customers/inquiry/go", async (req, reply) => {
    const raw = (req.query.cuid ?? "").trim();
    const cuid = raw === "" ? 0 : parseId(raw);
    if (cuid === null) return reply.redirect(`/customers/inquiry?${qs({ cuid: raw, err: `Code ${raw} Unknown.` })}`, 303);
    try {
      await service.get(cuid);
      return reply.redirect(`/customers/${cuid}`, 303);
    } catch (e) {
      if (e instanceof CustomerNotFoundError) {
        return reply.redirect(`/customers/inquiry?${qs({ cuid: raw, err: e.message })}`, 303);
      }
      throw e;
    }
  });

  app.get<{ Querystring: { name?: string; city?: string; offset?: string; returnTo?: string; param?: string } }>(
    "/customers/select",
    async (req, reply) => {
      const { name = "", city = "" } = req.query;
      const offset = Number(req.query.offset ?? 0);
      const returnTo = safeReturnTo(req.query.returnTo);
      const param = /^[a-z]+$/i.test(req.query.param ?? "") ? req.query.param! : "cuid";
      const page = await fcustomer.sltCustomer({ name, city, offset: Number.isInteger(offset) ? offset : 0 });
      const keep = { name, city, returnTo, param };
      return html(
        reply,
        "Select a Customer",
        `
<form method="get" action="/customers/select" class="stack">
  <input type="hidden" name="returnTo" value="${esc(returnTo)}"><input type="hidden" name="param" value="${esc(param)}">
  <label>Name <input name="name" maxlength="10" value="${esc(name)}"></label>
  <label>City <input name="city" maxlength="10" value="${esc(city)}"></label>
  <div class="bar"><button type="submit">Enter</button><a class="btn" href="${esc(returnTo)}">F12=Cancel</a></div>
</form>
<table>
  <thead><tr><th>Opt</th><th class="num">Cust ID</th><th>Customer name</th><th>City</th><th>CO</th></tr></thead>
  <tbody>
  ${page.rows
    .map(
      (r) =>
        `<tr><td><a href="${esc(withParam(returnTo, param, String(r.cuid)))}">1=Select</a></td><td class="num">${r.cuid}</td><td>${esc(r.custnm)}</td><td>${esc(r.cucity)}</td><td>${esc(r.cucoun)}</td></tr>`,
    )
    .join("")}
  </tbody>
</table>
<p class="muted">${
          page.more
            ? `More... <a href="/customers/select?${qs({ ...keep, offset: String(page.nextOffset) })}">Page Down</a>`
            : "Bottom"
        }</p>`,
      );
    },
  );

  app.get<{ Params: { id: string } }>("/customers/:id", async (req, reply) => {
    const cuid = parseId(req.params.id);
    if (cuid === null) return notFoundPage(reply, req.params.id);
    try {
      const c = await service.get(cuid);
      // CUS250 FMT02: read-only; audit fields and CUDEL are not shown (c10); CULASTORD raw numeric (c07).
      return html(
        reply,
        "Display Customer",
        `
<dl class="detail">
  ${dt("Customer ID", String(c.cuid))}${dt("Name", c.custnm)}${dt("Phone", c.cuphone)}${dt("VAT number", c.cuvat)}
  ${dt("E-mail", c.cumail)}${dt("Address", c.culine1)}${dt("", c.culine2)}${dt("", c.culine3)}
  ${dt("Zip / City", `${c.cuzip} ${c.cucity}`)}${dt("Country", `${c.cucoun} ${c.countryName}`)}
  ${dt("Limit credit", money(c.culimcre))}${dt("Credit", money(c.cucredit))}${dt("Last order date", String(c.culastord))}
</dl>
<div class="bar"><a class="btn" href="/customers/inquiry?${qs({ cuid: String(c.cuid) })}">Enter / F3 / F12 = back to prompt</a></div>`,
      );
    } catch (e) {
      if (e instanceof CustomerNotFoundError) return notFoundPage(reply, req.params.id);
      throw e;
    }
  });
}

async function formHtml(
  mode: "CRT" | "UPD",
  current: CustomerDetail | null,
  input: CustomerInput,
  errors: ValidationError[],
  fcountry: FCountry,
): Promise<string> {
  const countries = await fcountry.listCountries();
  const errFor = (f: keyof CustomerInput) => errors.filter((e) => e.field === f);
  const field = (label: string, name: keyof CustomerInput, size: number, value: string) => `
<label class="${errFor(name).length ? "has-err" : ""}">${label}
  <input name="${name}" maxlength="${size}" value="${esc(value)}">
  ${errFor(name)
    .map((e) => `<span class="err">${esc(e.message)}</span>`)
    .join("")}
</label>`;
  const action = mode === "CRT" ? "/customers" : `/customers/${current!.cuid}`;
  const cucoun = input.cucoun;
  const countryName = countries.find((c) => c.coid === cucoun)?.countr ?? "";
  return `
<form method="post" action="${action}" class="stack">
  <p class="mode">Mode: <strong>${mode}</strong>${current ? ` — Customer ID ${current.cuid}` : ""}</p>
  ${field("Name", "custnm", 30, input.custnm)}
  ${field("Phone", "cuphone", 15, input.cuphone)}
  ${field("VAT number", "cuvat", 12, input.cuvat)}
  ${field("E-mail", "cumail", 50, input.cumail)}
  ${field("Address line 1", "culine1", 50, input.culine1)}
  ${field("Address line 2", "culine2", 50, input.culine2)}
  ${field("Address line 3", "culine3", 50, input.culine3)}
  ${field("Zip code", "cuzip", 10, input.cuzip)}
  ${field("City", "cucity", 30, input.cucity)}
  <label class="${errFor("cucoun").length ? "has-err" : ""}">Country (F4 = pick from list)
    <input name="cucoun" maxlength="2" list="countries" value="${esc(cucoun)}"> <span class="muted">${esc(countryName)}</span>
    <datalist id="countries">${countries.map((c) => `<option value="${esc(c.coid)}">${esc(c.countr)}</option>`).join("")}</datalist>
    ${errFor("cucoun")
      .map((e) => `<span class="err">${esc(e.message)}</span>`)
      .join("")}
  </label>
  ${field("Limit credit", "culimcre", 12, input.culimcre === 0 ? "" : String(input.culimcre))}
  ${
    current
      ? `<p class="muted">Credit ${money(current.cucredit)} · Last order ${current.lastOrderDate ?? ""}</p>`
      : ""
  }
  <div class="bar"><button type="submit">Enter</button><a class="btn" href="/customers">F12=Cancel</a></div>
</form>`;
}

function emptyInput(): CustomerInput {
  return { custnm: "", cuphone: "", cuvat: "", cumail: "", culine1: "", culine2: "", culine3: "", cuzip: "", cucity: "", cucoun: "", culimcre: 0 };
}

function notFoundPage(reply: FastifyReply, id: string) {
  return html(reply, "Display Customer", `<p class="err">Code ${esc(id)} Unknown.</p><a class="btn" href="/customers">Back</a>`, 404);
}

function html(reply: FastifyReply, title: string, body: string, status = 200) {
  return reply.code(status).type("text/html; charset=utf-8").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)} — atuMerlin</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font:14px/1.4 system-ui,sans-serif;margin:1.5rem;max-width:64rem;color:#222}
h1{font-size:1.25rem;margin:0 0 1rem}
table{border-collapse:collapse;width:100%}th,td{padding:.3rem .5rem;border-bottom:1px solid #ddd;text-align:left}
.num{text-align:right;font-variant-numeric:tabular-nums}
.bar{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:.75rem 0}
.stack label{display:block;margin:.4rem 0}.stack input{width:24rem;max-width:100%}
.btn,button{display:inline-block;padding:.3rem .7rem;border:1px solid #888;border-radius:3px;background:#f4f4f4;color:#222;text-decoration:none;font:inherit;cursor:pointer}
.muted{color:#777}.err{color:#a00;display:block}.has-err input{border-color:#a00}
.detail{display:grid;grid-template-columns:10rem 1fr;gap:.25rem 1rem}.detail dt{color:#555}.detail dd{margin:0}
.mode{font-family:ui-monospace,monospace}
</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`);
}

function dt(label: string, value: string) {
  return `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;
}

function money(n: number): string {
  return n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function qs(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

/** Only same-site relative paths may be used as a return target from the selector. */
function safeReturnTo(v: string | undefined): string {
  return v && /^\/[^/\\]/.test(v) ? v : "/customers/inquiry/go";
}

function withParam(path: string, key: string, value: string): string {
  const u = new URL(path, "http://local");
  u.searchParams.set(key, value);
  return u.pathname + u.search;
}
