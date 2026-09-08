import { randomBytes } from "node:crypto";
import pg from "pg";
import { createPool, quoteIdent, type Db } from "../../src/db/pool.js";
import { applySchema } from "../../src/db/migrate.js";
import { seed } from "../../src/db/seed.js";

export interface TestDb {
  db: Db;
  schema: string;
  /** Drop every customer row and reset CUSSEQ to 1551 (fixtures stay below the sequence). */
  reset(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Tests run against a real PostgreSQL (DATABASE_URL). Each test file gets its own schema so
 * files can run in parallel; the schema is dropped on close.
 */
export async function createTestDb(): Promise<TestDb> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for tests (see modern/README.md, `scripts/local-pg.sh start`)");
  }
  const schema = `t_${randomBytes(6).toString("hex")}`;
  const admin = new pg.Pool({ connectionString });
  await admin.query(`CREATE SCHEMA ${quoteIdent(schema)}`);
  await admin.end();

  const db = createPool({ connectionString, schema });
  await applySchema(db);
  await seed(db);

  return {
    db,
    schema,
    async reset() {
      await db.query("TRUNCATE customer");
      await db.query("ALTER SEQUENCE cusseq RESTART");
      await seed(db);
    },
    async close() {
      await db.query(`DROP SCHEMA ${quoteIdent(schema)} CASCADE`);
      await db.end();
    },
  };
}

/** Insert a row directly (fixture path, bypassing CUS200 validation) — e.g. unknown country, CUDEL = 'X'. */
export async function insertCustomer(
  db: Db,
  row: {
    cuid: number;
    custnm: string;
    cuphone?: string;
    cucity?: string;
    cucoun?: string;
    culimcre?: number;
    culastord?: number;
    cudel?: string;
    cumodid?: string;
    cucrea?: string;
  },
): Promise<void> {
  await db.query(
    `INSERT INTO customer (cuid, custnm, cuphone, cucity, cucoun, culimcre, culastord, cucrea, cumod, cumodid, cudel)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, LOCALTIMESTAMP, $9, $10)`,
    [
      row.cuid,
      row.custnm,
      row.cuphone ?? "",
      row.cucity ?? "",
      row.cucoun ?? "",
      row.culimcre ?? 0,
      row.culastord ?? 0,
      row.cucrea ?? "2020-01-01",
      row.cumodid ?? "FIXTURE",
      row.cudel ?? " ",
    ],
  );
}
