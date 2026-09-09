import type { FastifyInstance } from "fastify";
import type { Db } from "../../db/pool.js";
import { createFParameter } from "../../shared/parm/index.js";
import { createParRepository } from "./par.repository.js";
import { createParService } from "./par.service.js";
import { parRoutes } from "./par.routes.js";

/** PAR vertical (pack atu-merlin-ts-par-v1@1): PAR200 maintain API over `parameter`, PATH reader via shared parm. */
export async function registerParFeature(app: FastifyInstance, db: Db): Promise<void> {
  const service = createParService(createParRepository(db));
  await parRoutes(app, { service, fparameter: createFParameter(db) });
}
