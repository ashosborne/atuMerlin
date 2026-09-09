import { createPool } from "./pool.js";
import { applySchema } from "./migrate.js";
import { seed } from "./seed.js";

const command = process.argv[2];
const db = createPool();
try {
  switch (command) {
    case "migrate":
      await applySchema(db);
      console.log("schema applied");
      break;
    case "seed":
      await applySchema(db);
      await seed(db);
      console.log("schema applied, fixtures seeded");
      break;
    default:
      console.error("usage: tsx src/db/cli.ts <migrate|seed>");
      process.exitCode = 2;
  }
} finally {
  await db.end();
}
