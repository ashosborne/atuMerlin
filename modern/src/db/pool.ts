import pg from "pg";

export type Db = pg.Pool;

export interface DbOptions {
  connectionString?: string;
  /** Postgres schema to put on search_path (tests use a throw-away schema per run). */
  schema?: string;
}

// numeric(9,2) comes back as text by default; the CUS amounts fit safely in a JS number.
pg.types.setTypeParser(1700, (v) => Number(v));
// date -> keep as ISO yyyy-mm-dd string, no timezone shifting
pg.types.setTypeParser(1082, (v) => v);
// timestamp without time zone -> local ISO-like string; CUMOD is job-local time with no zone (c08)
pg.types.setTypeParser(1114, (v) => v.replace(" ", "T"));

export function createPool(opts: DbOptions = {}): Db {
  const connectionString = opts.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new pg.Pool({
    connectionString,
    ...(opts.schema ? { options: `-c search_path=${quoteIdent(opts.schema)},public` } : {}),
  });
  return pool;
}

export function quoteIdent(name: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    throw new Error(`unsafe identifier: ${name}`);
  }
  return `"${name}"`;
}
