import type { FastifyInstance, FastifyReply } from "fastify";
import type { FArticle } from "../../shared/farticle/index.js";
import { userOf } from "../customer/customer.routes.js";
import { documentText } from "./order.document.js";
import { OrderNotFoundError, OrderOptionError, OrderValidationError, type OrderService } from "./order.service.js";
import { ODLINE_MAX, ORID_MAX } from "./order.types.js";

export interface OrderRouteDeps {
  service: OrderService;
  farticle: FArticle;
}

/**
 * New HTTP JSON API for the ORD vertical (pack api_contract_policy new-http-json, inferred).
 * Contract at modern/openapi/order.yaml. DSPF -> web mapping:
 *   ORD201 CTL01 / ORD200 CTL01 -> GET /api/orders[?cuid]
 *   ORD100 FMT02 pricing        -> POST /api/orders/lines/quote
 *   ORD100 F8 confirm           -> POST /api/orders
 *   ORD202                      -> GET /api/orders/:id
 *   ORD101 FMT02 / option 4     -> PUT | DELETE /api/orders/:id/lines/:line
 *   ORD200/201 option 4, 7, 8   -> DELETE /api/orders/:id, POST .../close, POST .../deliver
 *   ORD500                      -> GET /api/orders/:id/document (text; no PDF — needs-SME)
 * There is deliberately no POST /api/orders/:id/lines (ord-entry-ord101-c10: no add-line path
 * once an order exists).
 */
export async function orderRoutes(app: FastifyInstance, deps: OrderRouteDeps): Promise<void> {
  const { service, farticle } = deps;

  app.get<{ Querystring: { cuid?: string; offset?: string } }>("/api/orders", async (req, reply) => {
    const cuid = req.query.cuid === undefined ? undefined : Number(req.query.cuid);
    if (cuid !== undefined && (!Number.isInteger(cuid) || cuid < 0 || cuid > 99_999)) {
      return badRequest(reply, "cuid must be a customer id (5 digits)");
    }
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    if (!Number.isInteger(offset) || offset < 0) return badRequest(reply, "offset must be a non-negative integer");
    return service.list({ cuid, offset });
  });

  app.post("/api/orders/lines/quote", async (req) => service.quoteLine(req.body));

  app.post("/api/orders", async (req, reply) => {
    const detail = await service.confirm(req.body, userOf(req.headers));
    // ORD100 c08: print + acknowledgement follow the confirm. The document is rendered on request;
    // whether the print must be a synchronous side effect is needs-SME (ord-print-ord500-c05).
    return reply.code(201).send({ ...detail, document: `/api/orders/${detail.orid}/document` });
  });

  app.get<{ Params: { id: string } }>("/api/orders/:id", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFound(reply, req.params.id);
    return service.get(orid);
  });

  app.get<{ Params: { id: string } }>("/api/orders/:id/document", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFound(reply, req.params.id);
    const pages = await service.document(orid);
    return reply.type("text/plain; charset=utf-8").send(documentText(pages));
  });

  app.delete<{ Params: { id: string } }>("/api/orders/:id", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFound(reply, req.params.id);
    await service.deleteOrder(orid, userOf(req.headers));
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>("/api/orders/:id/close", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFound(reply, req.params.id);
    return service.close(orid, userOf(req.headers));
  });

  app.post<{ Params: { id: string } }>("/api/orders/:id/deliver", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    if (orid === null) return notFound(reply, req.params.id);
    return service.deliver(orid, userOf(req.headers));
  });

  app.put<{ Params: { id: string; line: string } }>("/api/orders/:id/lines/:line", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    const odline = parseLine(req.params.line);
    if (orid === null || odline === null) return notFound(reply, req.params.id, req.params.line);
    return service.updateLine(orid, odline, req.body, userOf(req.headers));
  });

  app.delete<{ Params: { id: string; line: string } }>("/api/orders/:id/lines/:line", async (req, reply) => {
    const orid = parseOrid(req.params.id);
    const odline = parseLine(req.params.line);
    if (orid === null || odline === null) return notFound(reply, req.params.id, req.params.line);
    await service.deleteLine(orid, odline, userOf(req.headers));
    return reply.code(204).send();
  });

  // FARTICLE dependency surface behind the SltArticle prompt (ART stays legacy; read-only list).
  app.get("/api/articles", async () => ({ rows: await farticle.listArticles() }));
}

/** Maps order service errors onto the JSON API; installed by app.ts ahead of the CUS handler. */
export function orderApiErrorHandler(err: unknown, reply: FastifyReply): FastifyReply | null {
  if (err instanceof OrderValidationError) {
    return reply.code(400).send({ code: "VALIDATION", errors: err.errors });
  }
  if (err instanceof OrderOptionError) {
    return reply.code(400).send({ code: err.code, message: err.message });
  }
  if (err instanceof OrderNotFoundError) {
    return reply.code(404).send({ code: "ORDER_NOT_FOUND", message: err.message, orid: err.orid, ...(err.odline !== undefined ? { odline: err.odline } : {}) });
  }
  return null;
}

/** ORID is 6P 0: a non-numeric or out-of-range path segment cannot name an order. */
export function parseOrid(raw: string): number | null {
  if (!/^\d{1,6}$/.test(raw)) return null;
  const n = Number(raw);
  return n > ORID_MAX ? null : n;
}

/** ODLINE is 5P 0. */
export function parseLine(raw: string): number | null {
  if (!/^\d{1,5}$/.test(raw)) return null;
  const n = Number(raw);
  return n > ODLINE_MAX ? null : n;
}

function notFound(reply: FastifyReply, id: string, line?: string) {
  const orid = Number(id) || 0;
  return reply.code(404).send({
    code: "ORDER_NOT_FOUND",
    message: line === undefined ? `Order ${orid} not found` : `Order ${orid} line ${Number(line) || 0} not found`,
    orid,
    ...(line === undefined ? {} : { odline: Number(line) || 0 }),
  });
}

function badRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({ code: "BAD_REQUEST", message });
}
