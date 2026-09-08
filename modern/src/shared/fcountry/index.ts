import type { Db } from "../../db/pool.js";

/**
 * FCOUNTRY dependency surface used by the CUS vertical (COU300 ExistCountry / GetCountryName,
 * COU301 SltCountry list). The country slice (`cou-maintain`) is NOT converted here; this is
 * read-only access to the reference table the CUS cards depend on
 * (cus-interactive-c04, c05, c10).
 */
export interface Country {
  coid: string;
  countr: string;
  coiso: string;
}

export interface FCountry {
  /** COU300.ExistCountry: %found on COUNTRY by exact 2-char code. Blank code -> false. */
  existCountry(coid: string): Promise<boolean>;
  /** COU300.GetCountryName: COUNTR, or blank when the code does not exist. */
  getCountryName(coid: string): Promise<string>;
  /** Rows behind COU301.SltCountry, ordered by code. */
  listCountries(): Promise<Country[]>;
}

export function createFCountry(db: Db): FCountry {
  return {
    async existCountry(coid) {
      const r = await db.query<{ one: number }>("SELECT 1 AS one FROM country WHERE coid = $1", [coid]);
      return (r.rowCount ?? 0) > 0;
    },
    async getCountryName(coid) {
      const r = await db.query<{ countr: string }>("SELECT countr FROM country WHERE coid = $1", [coid]);
      return r.rows[0]?.countr ?? "";
    },
    async listCountries() {
      const r = await db.query<Country>("SELECT coid, countr, coiso FROM country ORDER BY coid");
      return r.rows;
    },
  };
}
