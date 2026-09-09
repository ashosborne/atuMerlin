import type { Db } from "../../db/pool.js";
import type { ParameterRow } from "../../shared/parm/index.js";

/** PAR200 s01lod: SFLPAG 14 rows per load (par-maintain-c01). */
export const PAR_PAGE_SIZE = 14;

export interface ParameterKey {
  pacode: string;
  pasubcode: string;
}

export interface ParameterValues {
  parm1: string;
  parm2: string;
  parm3: string;
  parm4: number;
  parm5: number;
}

export interface ParameterPage {
  rows: ParameterRow[];
  /** true = "More..." (the look-ahead read found a 15th row), false = "Bottom" (c01). */
  more: boolean;
  nextOffset: number | null;
}

const COLUMNS = "pacode, pasubcode, parm1, parm2, parm3, parm4, parm5";

/**
 * PARAMETER.PF access for PAR200 (`uf a`, par-maintain-c01 .. c05). Bound parameters only (pack
 * forbidden: string-concat SQL). Key order is the PF key (PACODE, PASUBCODE); byte order
 * (COLLATE "C") stands in for the EBCDIC keyed order (CR-P3), blank/blank still sorts first.
 */
export interface ParRepository {
  /** s01lod: 14 rows from `offset` in key order plus the one-row look-ahead that decides More / Bottom. */
  list(offset: number): Promise<ParameterPage>;
  /** S02prp / S03chk `chain (pacode:pasubcode)`: the row or null (%found off). No lock (CR-P2). */
  chain(key: ParameterKey): Promise<ParameterRow | null>;
  /** S03act `write fparam`. Throws the driver's unique-violation on a lost race (legacy 01021). */
  write(row: ParameterRow): Promise<void>;
  /** S02act `update fparam`: unconditional; returns false when no row has that key (legacy 01221). */
  update(key: ParameterKey, values: ParameterValues): Promise<boolean>;
  /** s01act option 4 `delete (pacode:pasubcode)`: keyed, no prior chain; returns %found. */
  delete(key: ParameterKey): Promise<boolean>;
}

export function createParRepository(db: Db): ParRepository {
  return {
    async list(offset) {
      const r = await db.query<ParameterRow>(
        `SELECT ${COLUMNS} FROM parameter
          ORDER BY pacode COLLATE "C", pasubcode COLLATE "C"
          LIMIT $1 OFFSET $2`,
        [PAR_PAGE_SIZE + 1, offset],
      );
      const more = r.rows.length > PAR_PAGE_SIZE;
      const rows = more ? r.rows.slice(0, PAR_PAGE_SIZE) : r.rows;
      return { rows, more, nextOffset: more ? offset + PAR_PAGE_SIZE : null };
    },
    async chain(key) {
      const r = await db.query<ParameterRow>(`SELECT ${COLUMNS} FROM parameter WHERE pacode = $1 AND pasubcode = $2`, [
        key.pacode,
        key.pasubcode,
      ]);
      return r.rows[0] ?? null;
    },
    async write(row) {
      await db.query(`INSERT INTO parameter (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
        row.pacode,
        row.pasubcode,
        row.parm1,
        row.parm2,
        row.parm3,
        row.parm4,
        row.parm5,
      ]);
    },
    async update(key, v) {
      const r = await db.query(
        `UPDATE parameter SET parm1 = $3, parm2 = $4, parm3 = $5, parm4 = $6, parm5 = $7
          WHERE pacode = $1 AND pasubcode = $2`,
        [key.pacode, key.pasubcode, v.parm1, v.parm2, v.parm3, v.parm4, v.parm5],
      );
      return (r.rowCount ?? 0) > 0;
    },
    async delete(key) {
      const r = await db.query("DELETE FROM parameter WHERE pacode = $1 AND pasubcode = $2", [key.pacode, key.pasubcode]);
      return (r.rowCount ?? 0) > 0;
    },
  };
}
