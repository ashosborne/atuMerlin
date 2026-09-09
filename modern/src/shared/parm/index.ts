import type { Db } from "../../db/pool.js";

/**
 * FPARAMETER service program (module PAR300) as a shared module — pack atu-merlin-ts-par-v1@1,
 * mapping rule "RPGLE FPARM / PAR maintain programs -> TS shared module and/or features/par".
 * Cards par-maintain-c08 (blank PATH), c09 (getter family), c10 (export surface), c11 (PATH is
 * the one live key), c12 (PARAMETER table). The PAR200 maintain half (c01-c06) is
 * features/par; PAR201 (c07) is carried only as the pure `wrklnkPattern` below.
 *
 * The five binder exports (c10, corrected: EXPORT(*ALL) exports the five getters only) are
 * `getParm1` .. `getParm5`; `chainPARAMETER` and `closePARAMETER` are module-local in the legacy
 * and have no equivalent here (nothing is open, nothing to close). `getPath` is not a legacy
 * export: it is the literal call `GetParm2('PATH':' ')` that all four in-tree consumers make
 * (c11), given a name so that a converted consumer reuses the configuration value instead of
 * reading the table itself (pack anti_corruption: "document interop as reuse of config").
 *
 * Kept as-is (planted facts and known_risks, not fixed here — needs-SME in SME_BRIEF.md):
 *  - c09 a miss leaves the cleared buffer: PARM1/2/3 blank, PARM4/5 zero, no %found, no message.
 *  - c09 a blank code AND blank sub-code never reads PARAMETER (the buffer key starts and clears
 *    blank), even if PAR200 created the blank/blank row (c02): blanks / zeros without I/O.
 *  - c09 the 10A by-value compare is case-sensitive and ignores trailing blanks; no folding.
 *  - c08 a missing or blank PATH is silent: `getPath` returns '' and no consumer in the legacy
 *    tested it. TODO(par-maintain-c08): required setting (fail fast) or default location is a
 *    target decision — nothing raised here.
 *  - c07 / c11 the trailing-slash contract of PATH (two consumers concatenate without a
 *    separator) is NOT normalised: the value is returned exactly as stored. known_risk.
 *  - c11 GetPARM1 / 3 / 4 / 5 have no caller in the estate; exported, no consumer invented.
 *
 * Deliberately not reproduced (CONTRACT_RISK, modern/README.md PAR section):
 *  - the record-buffer cache and its activation-group lifetime (c09): every call reads the table,
 *    so a PATH changed or deleted in PAR200 is seen by the next call, not by the next job.
 *  - the USROPN open / never-closed data path (c09, c10): stateless; nothing to open or close.
 */

/** PARAMETER.PF record format FPARAM (c12). */
export interface ParameterRow {
  /** PACODE 10A, key 1. */
  pacode: string;
  /** PASUBCODE 10A, key 2. */
  pasubcode: string;
  /** PARM1 10A. */
  parm1: string;
  /** PARM2 100A, CHECK(LC) on the maintain screen: case kept. */
  parm2: string;
  /** PARM3 2A. */
  parm3: string;
  /** PARM4 zoned 1 0 (returned packed 1P 0 by GetPARM4). */
  parm4: number;
  /** PARM5 zoned 3 0 (returned packed 3P 0 by GetPARM5). */
  parm5: number;
}

export const PACODE_LENGTH = 10; // PACODE 10A (and PASUBCODE 10A)
export const PARM1_LENGTH = 10; // PARM1 10A
export const PARM2_LENGTH = 100; // PARM2 100A
export const PARM3_LENGTH = 2; // PARM3 2A
export const PARM4_DIGITS = 1; // PARM4 1S 0
export const PARM5_DIGITS = 3; // PARM5 3S 0

/** Buffer after `clear *all FPARAM` followed by a failed CHAIN, or before any read (c09). */
export const CLEARED_PARAMETER: ParameterRow = Object.freeze({
  pacode: "",
  pasubcode: "",
  parm1: "",
  parm2: "",
  parm3: "",
  parm4: 0,
  parm5: 0,
});

/**
 * The one live key (c11): `GetParm2('PATH':' ')` from ORD500, PRO202, PRO203 and PAR201. The
 * sub-code is a single blank in the legacy calls; `normaliseParameterKey` makes it ''.
 */
export const PATH_KEY = Object.freeze({ pacode: "PATH", pasubcode: "" });

export interface FParameter {
  /** PAR300.GetPARM1: PARM1 (10A) of the row, or blank on a miss (c09). No caller in the estate (c11). */
  getParm1(pacode: string, pasubcode: string): Promise<string>;
  /** PAR300.GetPARM2: PARM2 (100A) of the row, or blank on a miss (c09). The PATH reader (c11). */
  getParm2(pacode: string, pasubcode: string): Promise<string>;
  /** PAR300.GetPARM3: PARM3 (2A), or blank on a miss. No caller (c11). */
  getParm3(pacode: string, pasubcode: string): Promise<string>;
  /** PAR300.GetPARM4: PARM4 (1P 0), or 0 on a miss. No caller (c11). */
  getParm4(pacode: string, pasubcode: string): Promise<number>;
  /** PAR300.GetPARM5: PARM5 (3P 0), or 0 on a miss. No caller (c11). */
  getParm5(pacode: string, pasubcode: string): Promise<number>;
  /**
   * `GetParm2('PATH':' ')` — the configuration value every generated file in the estate is
   * written under (c11). '' when the row is missing or blank (c08, silent as-is). Returned exactly
   * as stored: no trailing-slash normalisation (c07, known_risk).
   */
  getPath(): Promise<string>;
}

export function createFParameter(db: Db): FParameter {
  // chainPARAMETER (c09) without the cache: one keyed read per call; a blank/blank key never reads.
  async function chain(pacode: string, pasubcode: string): Promise<ParameterRow> {
    const code = normaliseParameterKey(pacode);
    const sub = normaliseParameterKey(pasubcode);
    if (code === "" && sub === "") return CLEARED_PARAMETER;
    const r = await db.query<ParameterRow>(
      "SELECT pacode, pasubcode, parm1, parm2, parm3, parm4, parm5 FROM parameter WHERE pacode = $1 AND pasubcode = $2",
      [code, sub],
    );
    return r.rows[0] ?? CLEARED_PARAMETER;
  }

  return {
    async getParm1(pacode, pasubcode) {
      return (await chain(pacode, pasubcode)).parm1;
    },
    async getParm2(pacode, pasubcode) {
      return (await chain(pacode, pasubcode)).parm2;
    },
    async getParm3(pacode, pasubcode) {
      return (await chain(pacode, pasubcode)).parm3;
    },
    async getParm4(pacode, pasubcode) {
      return (await chain(pacode, pasubcode)).parm4;
    },
    async getParm5(pacode, pasubcode) {
      return (await chain(pacode, pasubcode)).parm5;
    },
    async getPath() {
      return (await chain(PATH_KEY.pacode, PATH_KEY.pasubcode)).parm2;
    },
  };
}

/**
 * The `10A value` parameters of the getters (c09): a longer value is cut to ten characters,
 * trailing blanks are fixed-length padding and take no part in the keyed compare. Case is kept —
 * the compare is `<>` on 10A, so `GetParm2('path':' ')` misses (PAR200 upper-cased keys on
 * entry, which is why in-tree data is upper-case; that folding is the writer's, see features/par).
 */
export function normaliseParameterKey(value: string | undefined): string {
  return (value ?? "").slice(0, PACODE_LENGTH).trimEnd();
}

/**
 * PAR201 (c07): `CHGVAR &PATH (&PATH *TCAT '*')` on the 100-byte return of GetPARM2 — trailing
 * blanks removed, '*' appended, the result cut back to the 100-byte variable (a 100-character
 * PATH loses the '*'). Blank PATH -> '*' (c08). `WRKLNK OBJ(&PATH)` itself — the interactive
 * IFS panel — is not reproduced (no IFS browser is invented); this is the pattern it would open.
 */
export function wrklnkPattern(path: string): string {
  return `${path.trimEnd()}*`.slice(0, PARM2_LENGTH);
}
