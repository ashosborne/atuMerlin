import { createPool } from "../../db/pool.js";
import { applySchema } from "../../db/migrate.js";
import { seedOrder } from "./order.seed.js";

// `npm run db:seed:order` — ORD dependency fixtures (article, vatdef). The CUS seed CLI under
// src/db/ belongs to the CUS pack and is not edited by the ORD convert.
const db = createPool();
try {
  await applySchema(db);
  await seedOrder(db);
  console.log("schema applied, ORD fixtures seeded");
} finally {
  await db.end();
}
