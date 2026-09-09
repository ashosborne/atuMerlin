import type { Db } from "../../db/pool.js";

/**
 * Development / test fixtures for the ORD dependency tables. These are NOT legacy data
 * (ATU_SRC holds source only). VAT codes follow SAMREF's DFT('2'); article X9 carries a VAT
 * code that has no VATDEF row so the "VAT silent zero" path is reachable in fixtures.
 */
export const VATDEF_FIXTURE: ReadonlyArray<{ vatcode: string; vatrate: number; vatdesc: string }> = [
  { vatcode: "1", vatrate: 5.5, vatdesc: "Reduced" },
  { vatcode: "2", vatrate: 20, vatdesc: "Standard" },
  { vatcode: "3", vatrate: 10, vatdesc: "Intermediate" },
];

export interface ArticleFixture {
  arid: string;
  ardesc: string;
  arsalepr: number;
  arvatcd: string;
  arstock?: number;
  ardel?: string;
}

export const ARTICLE_FIXTURE: ReadonlyArray<ArticleFixture> = [
  { arid: "A00001", ardesc: "Anvil, cast iron, 25 kg", arsalepr: 149.9, arvatcd: "2", arstock: 12 },
  { arid: "A00002", ardesc: "Bench vice 125 mm", arsalepr: 89.5, arvatcd: "2", arstock: 30 },
  { arid: "B00010", ardesc: "Safety gloves, pair", arsalepr: 6.4, arvatcd: "1", arstock: 400 },
  { arid: "C00100", ardesc: "Technical manual, hydraulics (fifty char descrip)", arsalepr: 24, arvatcd: "3", arstock: 15 },
  { arid: "X9    ", ardesc: "Legacy part, VAT code retired", arsalepr: 10, arvatcd: "9", arstock: 1 },
  { arid: "Z00001", ardesc: "Discontinued item (soft-deleted)", arsalepr: 1, arvatcd: "2", arstock: 0, ardel: "X" },
];

export async function seedOrder(db: Db, user = "SEED"): Promise<void> {
  for (const v of VATDEF_FIXTURE) {
    await db.query(
      `INSERT INTO vatdef (vatcode, vatrate, vatdesc, vatcrea, vatmod, vatmodid)
       VALUES ($1, $2, $3, CURRENT_DATE, LOCALTIMESTAMP, $4)
       ON CONFLICT (vatcode) DO UPDATE SET vatrate = EXCLUDED.vatrate, vatdesc = EXCLUDED.vatdesc`,
      [v.vatcode, v.vatrate, v.vatdesc, user],
    );
  }
  for (const a of ARTICLE_FIXTURE) {
    await db.query(
      `INSERT INTO article (arid, ardesc, arsalepr, arvatcd, arstock, arcrea, armod, armodid, ardel)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, LOCALTIMESTAMP, $6, $7)
       ON CONFLICT (arid) DO NOTHING`,
      [a.arid.replace(/\s+$/, ""), a.ardesc, a.arsalepr, a.arvatcd, a.arstock ?? 0, user, a.ardel ?? " "],
    );
  }
}
