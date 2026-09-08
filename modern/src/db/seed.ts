import type { Db } from "./pool.js";

/**
 * Development / test fixtures. These are NOT legacy data: ATU_SRC holds source only,
 * no COUNTRY or CUSTOMER rows. Customer ids stay below CUSSEQ's START WITH 1551 so the
 * sequence never collides with them (same shape as the legacy library).
 */
export const COUNTRY_FIXTURE: ReadonlyArray<{ coid: string; countr: string; coiso: string }> = [
  { coid: "BE", countr: "Belgium", coiso: "BEL" },
  { coid: "DE", countr: "Germany", coiso: "DEU" },
  { coid: "ES", countr: "Spain", coiso: "ESP" },
  { coid: "FR", countr: "France", coiso: "FRA" },
  { coid: "GB", countr: "United Kingdom", coiso: "GBR" },
  { coid: "IT", countr: "Italy", coiso: "ITA" },
  { coid: "NL", countr: "Netherlands", coiso: "NLD" },
  { coid: "US", countr: "United States", coiso: "USA" },
];

export interface CustomerFixture {
  cuid: number;
  custnm: string;
  cuphone: string;
  cucity: string;
  cucoun: string;
  culimcre?: number;
  culastord?: number;
  cudel?: string;
}

export const CUSTOMER_FIXTURE: ReadonlyArray<CustomerFixture> = [
  { cuid: 1001, custnm: "Arcad Software", cuphone: "0450578396", cucity: "Annecy", cucoun: "FR", culimcre: 15000, culastord: 20240315 },
  { cuid: 1002, custnm: "Baker Street Books", cuphone: "02072243000", cucity: "London", cucoun: "GB", culimcre: 2500 },
  { cuid: 1003, custnm: "Casa Rossi", cuphone: "0612345678", cucity: "Roma", cucoun: "IT", culimcre: 1200, culastord: 20231201 },
  { cuid: 1004, custnm: "Delta Logistics", cuphone: "0201234567", cucity: "Amsterdam", cucoun: "NL", culimcre: 50000 },
  { cuid: 1005, custnm: "Elektro Meyer", cuphone: "03012345678", cucity: "Berlin", cucoun: "DE", culimcre: 8000, cudel: "X" },
];

export async function seed(db: Db, user = "SEED"): Promise<void> {
  for (const c of COUNTRY_FIXTURE) {
    await db.query(
      `INSERT INTO country (coid, countr, coiso) VALUES ($1, $2, $3)
       ON CONFLICT (coid) DO UPDATE SET countr = EXCLUDED.countr, coiso = EXCLUDED.coiso`,
      [c.coid, c.countr, c.coiso],
    );
  }
  for (const c of CUSTOMER_FIXTURE) {
    await db.query(
      `INSERT INTO customer (cuid, custnm, cuphone, cucity, cucoun, culimcre, culastord, cucrea, cumod, cumodid, cudel)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, LOCALTIMESTAMP, $8, $9)
       ON CONFLICT (cuid) DO NOTHING`,
      [c.cuid, c.custnm, c.cuphone, c.cucity, c.cucoun, c.culimcre ?? 0, c.culastord ?? 0, user, c.cudel ?? " "],
    );
  }
}
