import type { FastifyInstance, FastifyReply } from "fastify";
import type { FCountry } from "../../shared/fcountry/index.js";
import type { FCustomer } from "../../shared/fcustomer/index.js";
import { CustomerNotFoundError, CustomerValidationError, editZ, type CustomerService } from "./customer.service.js";

export interface CustomerRouteDeps {
  service: CustomerService;
  fcustomer: FCustomer;
  fcountry: FCountry;
}

/** Pathfinder-open auth (pack authn_authz): the caller names itself; defaults like *USER on a dev session. */
export const USER_HEADER = "x-user-id";
export const DEFAULT_USER = "WEB";

export function userOf(headers: Record<string, unknown>): string {
  const h = headers[USER_HEADER];
  const v = Array.isArray(h) ? h[0] : h;
  return typeof v === "string" && v.trim() !== "" ? v.trim() : DEFAULT_USER;
}

/**
 * New HTTP JSON API for the CUS vertical (pack api_contract_policy new-http-json). Contract at
 * modern/openapi/customer.yaml. DSPF -> web mapping: CUS200 CTL01 -> GET /api/customers,
 * FMT02 -> POST / PUT, CUS250 -> GET /api/customers/:id, CUS301 -> GET /api/customers/search.
 * There is deliberately no DELETE (cus-interactive-c11) and no orders route (c06, ORD stays legacy).
 */
export async function customerRoutes(app: FastifyInstance, deps: CustomerRouteDeps): Promise<void> {
  const { service, fcustomer, fcountry } = deps;

  app.get<{ Querystring: { positionTo?: string; cursorName?: string; cursorId?: string } }>(
    "/api/customers",
    async (req, reply) => {
      const { positionTo, cursorName, cursorId } = req.query;
      const id = cursorId === undefined ? undefined : Number(cursorId);
      if (cursorId !== undefined && !Number.isInteger(id)) {
        return badRequest(reply, "cursorId must be an integer");
      }
      return service.list({ positionTo, cursorName, cursorId: id });
    },
  );

  app.get<{ Querystring: { name?: string; city?: string; offset?: string } }>(
    "/api/customers/search",
    async (req, reply) => {
      const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
      if (!Number.isInteger(offset) || offset < 0) return badRequest(reply, "offset must be a non-negative integer");
      return fcustomer.sltCustomer({ name: req.query.name, city: req.query.city, offset });
    },
  );

  app.get<{ Params: { id: string } }>("/api/customers/:id", async (req, reply) => {
    const cuid = parseId(req.params.id);
    if (cuid === null) return notFound(reply, Number(req.params.id) || 0);
    return service.get(cuid);
  });

  app.post("/api/customers", async (req, reply) => {
    const detail = await service.create(req.body, userOf(req.headers));
    return reply.code(201).send(detail);
  });

  app.put<{ Params: { id: string } }>("/api/customers/:id", async (req, reply) => {
    const cuid = parseId(req.params.id);
    if (cuid === null) return notFound(reply, Number(req.params.id) || 0);
    return service.update(cuid, req.body);
  });

  app.get("/api/countries", async () => ({ rows: await fcountry.listCountries() }));
}

/** Maps service errors onto the JSON API; installed by app.ts for /api/**. */
export function apiErrorHandler(err: unknown, reply: FastifyReply, log: { error: (e: unknown) => void }) {
  if (err instanceof CustomerValidationError) {
    return reply.code(400).send({ code: "VALIDATION", errors: err.errors });
  }
  if (err instanceof CustomerNotFoundError) {
    return notFound(reply, err.cuid);
  }
  const statusCode = (err as { statusCode?: unknown }).statusCode;
  if (typeof statusCode === "number" && statusCode < 500) {
    return reply.code(statusCode).send({ code: "BAD_REQUEST", message: (err as Error).message });
  }
  log.error(err);
  return reply.code(500).send({ code: "INTERNAL", message: "internal error" });
}

/** CUID is 5P 0: a non-numeric or out-of-range path segment cannot name a customer. */
export function parseId(raw: string): number | null {
  if (!/^\d{1,5}$/.test(raw)) return null;
  return Number(raw);
}

function notFound(reply: FastifyReply, cuid: number) {
  return reply.code(404).send({ code: "ERR0103", message: `Code ${editZ(cuid)} Unknown.`, cuid });
}

function badRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({ code: "BAD_REQUEST", message });
}
