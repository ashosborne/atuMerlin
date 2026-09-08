import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Db } from "./pool.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_SQL_PATH = path.resolve(here, "../../db/schema.sql");

export async function applySchema(db: Db): Promise<void> {
  const sql = await readFile(SCHEMA_SQL_PATH, "utf8");
  await db.query(sql);
}
