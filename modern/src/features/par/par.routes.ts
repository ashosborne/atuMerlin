import type { FastifyInstance, FastifyReply } from "fastify";
import type { FParameter } from "../../shared/parm/index.js";
import { ParameterNotFoundError, ParameterValidationError, parameterKeyOf, type ParService } from "./par.service.js";

export interface ParRouteDeps {
  service: ParService;
  fparameter: FParameter;
}

/**
 * New HTTP JSON API for the PAR maintain slice (pack api_contract_policy new-http-json, inferred;
 * `contract_paths: []`, so the contract is this file and modern/README.md). DSPF -> HTTP mapping:
 *   PAR200 CTL01 / SFL01 list, Page Down       -> GET    /api/parameters[?offset]
 *   PAR200 FMT02 entry (option 2, chain)        -> GET    /api/parameters/:pacode/:pasubcode
 *   PAR200 FMT03 Enter (F6 create)              -> POST   /api/parameters
 *   PAR200 FMT02 Enter (option 2 update)        -> PUT    /api/parameters/:pacode/:pasubcode
 *   PAR200 option 4                             -> DELETE /api/parameters/:pacode/:pasubcode
 *   GetParm2('PATH':' ') (c11, the config read) -> GET    /api/parameters/path
 * A blank key segment is sent as a single blank (`%20`); keys are upper-cased like the display
 * (c02). PAR201 / WRKLNK (c07) has no route: no IFS browser is invented.
 */
export async function parRoutes(app: FastifyInstance, deps: ParRouteDeps): Promise<void> {
  const { service, fparameter } = deps;

  app.get<{ Querystring: { offset?: string } }>("/api/parameters", async (req, reply) => {
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    if (!Number.isInteger(offset) || offset < 0) return badRequest(reply, "offset must be a non-negative integer");
    return service.list(offset);
  });

  // Declared before the keyed route so "path" is the PATH reader, never a one-segment key
  // (a real key always has two segments).
  app.get("/api/parameters/path", async () => ({ path: await fparameter.getPath() }));

  app.get<{ Params: { pacode: string; pasubcode: string } }>("/api/parameters/:pacode/:pasubcode", async (req) =>
    service.get(parameterKeyOf(req.params.pacode, req.params.pasubcode)),
  );

  app.post("/api/parameters", async (req, reply) => {
    const row = await service.create(req.body);
    return reply.code(201).send(row);
  });

  app.put<{ Params: { pacode: string; pasubcode: string } }>("/api/parameters/:pacode/:pasubcode", async (req) =>
    service.update(parameterKeyOf(req.params.pacode, req.params.pasubcode), req.body),
  );

  app.delete<{ Params: { pacode: string; pasubcode: string } }>("/api/parameters/:pacode/:pasubcode", async (req, reply) => {
    await service.remove(parameterKeyOf(req.params.pacode, req.params.pasubcode));
    return reply.code(204).send();
  });
}

/** Maps PAR service errors onto the JSON API; chained by app.ts for /api/**. */
export function parApiErrorHandler(err: unknown, reply: FastifyReply): FastifyReply | null {
  if (err instanceof ParameterValidationError) {
    return reply.code(400).send({ code: "VALIDATION", errors: err.errors });
  }
  if (err instanceof ParameterNotFoundError) {
    return reply.code(404).send({ code: "PARAMETER_NOT_FOUND", message: err.message, ...err.key });
  }
  return null;
}

function badRequest(reply: FastifyReply, message: string) {
  return reply.code(400).send({ code: "BAD_REQUEST", message });
}
