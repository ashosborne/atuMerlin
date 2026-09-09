import type { FastifyInstance } from "fastify";
import type { Db } from "../../db/pool.js";
import { createFCountry } from "../../shared/fcountry/index.js";
import { createFCustomer } from "../../shared/fcustomer/index.js";
import { createCustomerRepository } from "./customer.repository.js";
import { createCustomerService } from "./customer.service.js";
import { customerRoutes } from "./customer.routes.js";
import { customerWeb } from "./customer.web.js";

export async function registerCustomerFeature(app: FastifyInstance, db: Db): Promise<void> {
  const fcountry = createFCountry(db);
  const fcustomer = createFCustomer(db);
  const service = createCustomerService(createCustomerRepository(db), fcountry);
  const deps = { service, fcustomer, fcountry };
  await customerRoutes(app, deps);
  await customerWeb(app, deps);
}
