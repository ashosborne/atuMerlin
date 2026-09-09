import { buildApp } from "./app.js";
import { createPool } from "./db/pool.js";
import { applySchema } from "./db/migrate.js";

const db = createPool();
await applySchema(db);
const app = await buildApp({ db, logger: true });

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
await app.listen({ port, host });

const shutdown = async () => {
  await app.close();
  await db.end();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
