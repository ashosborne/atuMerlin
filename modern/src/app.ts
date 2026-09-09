import Fastify, { type FastifyInstance } from "fastify";
import formbody from "@fastify/formbody";
import type { Db } from "./db/pool.js";
import { registerCustomerFeature } from "./features/customer/index.js";
import { apiErrorHandler } from "./features/customer/customer.routes.js";
import { registerOrderFeature } from "./features/order/index.js";
import { orderApiErrorHandler } from "./features/order/order.routes.js";
import { registerParFeature } from "./features/par/index.js";
import { parApiErrorHandler } from "./features/par/par.routes.js";

export interface BuildAppOptions {
  db: Db;
  logger?: boolean;
}

/** Modular monolith entry: one Fastify instance, features register themselves. */
export async function buildApp({ db, logger = false }: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger });
  await app.register(formbody);

  app.get("/health", async () => {
    await db.query("SELECT 1");
    return { status: "ok" };
  });

  app.setErrorHandler((err, req, reply) => {
    if (req.url.startsWith("/api/")) {
      return parApiErrorHandler(err, reply) ?? orderApiErrorHandler(err, reply) ?? apiErrorHandler(err, reply, app.log);
    }
    app.log.error(err);
    return reply.code(500).type("text/plain").send("internal error");
  });

  await registerCustomerFeature(app, db);
  await registerOrderFeature(app, db);
  await registerParFeature(app, db);
  return app;
}
