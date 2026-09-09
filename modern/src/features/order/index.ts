import type { FastifyInstance } from "fastify";
import type { Db } from "../../db/pool.js";
import { createFArticle } from "../../shared/farticle/index.js";
import { createFCustomer } from "../../shared/fcustomer/index.js";
import { createFVat } from "../../shared/fvat/index.js";
import { createOrderRepository } from "./order.repository.js";
import { createOrderService } from "./order.service.js";
import { orderRoutes } from "./order.routes.js";
import { orderWeb } from "./order.web.js";

/** ORD vertical (pack atu-merlin-ts-ord-v1@1): ORD100, ORD101, ORD200, ORD201, ORD202, ORD500, ORD700/701. */
export async function registerOrderFeature(app: FastifyInstance, db: Db): Promise<void> {
  const farticle = createFArticle(db);
  const fvat = createFVat(db);
  const fcustomer = createFCustomer(db);
  const service = createOrderService({ repo: createOrderRepository(db), farticle, fvat, fcustomer });
  await orderRoutes(app, { service, farticle });
  await orderWeb(app, { service, farticle, fcustomer });
}
