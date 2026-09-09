import type { Db } from "../../db/pool.js";

/**
 * FCOUNTRY service program (modules COU300 + COU301) as a shared module — pack
 * atu-merlin-ts-cou-v1@1, mapping rule "RPGLE service program FCOUNTRY -> TS shared module".
 * Cards cou-maintain-c07 .. c12 (the FCOUNTRY half; the COU200 panel half c01-c06 / c13 is
 * deferred and nothing of it is invented here).
 *
 * The four binder exports (c12) are `existCountry`, `getCountryName`, `getCountryIso3` and
 * `sltCountry`; `closeCOUNTRY` was never exported (c08) and has no equivalent. `listCountries` is
 * the read-only dependency surface the CUS vertical consumed before this pack (pack
 * atu-merlin-ts-cus-v1@1) and is kept unchanged; the CUS callers are not rewritten.
 *
 * Kept as-is (planted facts and known_risks, not fixed here — needs-SME in SME_BRIEF.md):
 *  - c07 an unknown code leaves the cleared buffer: name blank, ISO-3 blank, exist false, no
 *    message. `COUNTRY` has no delete flag, so exist = row present.
 *  - c07 a blank code never reads `COUNTRY` (the buffer starts and clears blank), even if a
 *    blank-keyed row exists; `ExistCountry(blank)` is false without I/O.
 *  - c08 `getCountryIso3` has no caller in the estate. TODO(cou-maintain-c08): carry unused or
 *    reject (and dispose COISO)? Room / SME decision — no consumer is invented here.
 *  - c09 a position beyond the last key yields an empty page, no rows and no message.
 *    TODO(cou-maintain-c09): whether the target shows a message is needs-SME.
 *  - c10 F8 clears the position key of the order being entered, so the caller's code position
 *    is lost after the first toggle away and back. TODO(cou-maintain-c10): retaining it is a
 *    target decision.
 *
 * Deliberately not reproduced (CONTRACT_RISK, modern/README.md COU section):
 *  - last-key cache / activation-group lifetime of the getter buffer and the COUNTRY /
 *    COUNTR1 / display-file opens (c07, c08, c12): every call reads the table.
 *  - the COU301D window itself (subfile, 10-row display pages, indicator attributes): the
 *    selector is a positioned page reader plus a pure option / toggle reducer; no HTTP or web
 *    surface is added (pack `contract_paths: []`).
 */

/** COUNTRY.PF record format FCOUN. */
export interface Country {
  /** COID 2A (SAMREF). */
  coid: string;
  /** COUNTR 30A (SAMREF). */
  countr: string;
  /** COISO 3A (literal in COUNTRY.PF, not a SAMREF field). */
  coiso: string;
}

/** Buffer after `clear *all FCOUN` followed by a failed CHAIN, or before any read (c07). */
const CLEARED: Country = { coid: "", countr: "", coiso: "" };

export const COID_LENGTH = 2; // COID 2A
export const COUNTR_LENGTH = 30; // COUNTR 30A
export const SLT_LOAD_SIZE = 20; // COU301 S01lod: `TELLER < 20` rows per load
export const SLT_DISPLAY_PAGE = 10; // COU301D SFLPAG(0010): two display pages per load (c09)

/** `bydesc` indicator 40: by-code order over COUNTRY, by-name order over COUNTR1 (c09, c10). */
export type SltCountryOrder = "code" | "name";

export interface SltCountryRequest {
  /** KEYCOD (2A) or KEYDES (30A) depending on `order`; blank positions at the top (SETLL). */
  position?: string | undefined;
  order?: SltCountryOrder | undefined;
  /** Rows already loaded from this position (RRS01); the next 20 are returned. */
  offset?: number | undefined;
}

/** A COU301D SFL01 row: code and name only — COISO never appears in the window (c09). */
export interface SltCountryRow {
  coid: string;
  countr: string;
}

export interface SltCountryPage {
  rows: SltCountryRow[];
  /** true = "More..." (the look-ahead read found a row), false = "Bottom" (c09). */
  more: boolean;
  nextOffset: number | null;
}

/** Procedure-local state of one SltCountry call (COU301 `keycod`, `keydes`, `bydesc`, `dft`). */
export interface SltCountryState {
  order: SltCountryOrder;
  /** KEYCOD: initial position = the caller's `pcod`, normalised to 2A. */
  keycod: string;
  /** KEYDES: blank at entry. */
  keydes: string;
  /** `dft`: what F3 / F12 return — the caller's `pcod` unchanged (c09). */
  dft: string;
}

/** What the user typed on one Enter / function key (the changed subfile rows and the control line). */
export interface SltCountryEntry {
  /** Changed rows (`readc`): subfile RRN, the row's COID, and OPT01 as typed. */
  rows?: ReadonlyArray<{ rrn: number; coid: string; opt: number }> | undefined;
  /** OPTC1 on the control line: 0 = none, 8 = position to (c11). */
  controlOption?: number | undefined;
  /** POSCOD (by code) or POSDES (by name) as typed. */
  positionTo?: string | undefined;
  /** CF08 (c10). */
  f8?: boolean | undefined;
  /** CA03 / CA12: exit / cancel (c09 S01key). */
  cancel?: boolean | undefined;
}

/** COU301D message indicators (c11): 35 / 36 are SFLMSG per row, 41 / 42 are ERRMSG on the control line. */
export type SltCountryError =
  | { indicator: 35; text: "INVALID OPTION"; rrn: number }
  | { indicator: 36; text: "ONLY ONE SELECTION"; rrn: number }
  | { indicator: 41; text: "Invalid option" }
  | { indicator: 42; text: "Position to not available with selection pending" };

/** S01chk result (c11): what to do next and what to show. */
export interface SltCountryCheck {
  errors: SltCountryError[];
  /** RRB01 after the loop: the first offending row, so the page holding it is shown. */
  firstErrorRrn: number | null;
  /** SLT01: a row with option 1 was seen (the selected row's COID). */
  selected: string | null;
  /** STS01: any non-zero row option was typed (F8 is ignored while true). */
  optionsTyped: boolean;
}

export type SltCountryOutcome =
  /** F3 / F12: `return dft` (c09). */
  | { kind: "return"; coid: string }
  /** Option 1 on exactly one row and nothing else pending: `return coid` (c09, c11). */
  | { kind: "select"; coid: string }
  /** S01chk raised 35 / 36 / 41 / 42, or F8 with options typed: redisplay with the errors (c10, c11). */
  | { kind: "redisplay"; check: SltCountryCheck }
  /** F8 toggle or option 8: re-prepare from `state` (order and keys already updated). */
  | { kind: "reprepare"; state: SltCountryState }
  /** Plain Enter with nothing typed: redisplay unchanged. */
  | { kind: "none" };

export interface FCountry {
  /** COU300.ExistCountry: %found on COUNTRY by exact 2-char code (c07). Blank code -> false without a read. */
  existCountry(coid: string): Promise<boolean>;
  /** COU300.GetCountryName: COUNTR (30A), or blank when the code does not exist (c07). */
  getCountryName(coid: string): Promise<string>;
  /** COU300.GetCountryIso3: COISO (3A), or blank when the code does not exist (c07, c08 — no legacy caller). */
  getCountryIso3(coid: string): Promise<string>;
  /** COU301.SltCountry list load (c09): positioned keyed read, 20 rows per load, one-row look-ahead. */
  sltCountry(request?: SltCountryRequest): Promise<SltCountryPage>;
  /** CUS dependency surface (pack atu-merlin-ts-cus-v1@1): all rows ordered by code. Unchanged. */
  listCountries(): Promise<Country[]>;
}

export function createFCountry(db: Db): FCountry {
  // chainCOUNTRY (c07) without the cache: one keyed read per call, blank code never reads.
  async function chain(coid: string): Promise<{ found: boolean; row: Country }> {
    const code = normaliseCountryCode(coid);
    if (code === "") return { found: false, row: CLEARED };
    const r = await db.query<Country>("SELECT coid, countr, coiso FROM country WHERE coid = $1", [code]);
    const row = r.rows[0];
    return row ? { found: true, row } : { found: false, row: CLEARED };
  }

  return {
    async existCountry(coid) {
      return (await chain(coid)).found;
    },
    async getCountryName(coid) {
      return (await chain(coid)).row.countr;
    },
    async getCountryIso3(coid) {
      return (await chain(coid)).row.coiso;
    },
    async sltCountry(request = {}) {
      const order: SltCountryOrder = request.order ?? "code";
      const offset = Math.max(0, Math.trunc(request.offset ?? 0));
      // s01prp: SETLL key then read (first key >= position); S01lod: 20 rows plus the look-ahead
      // read that decides More / Bottom. Byte order (COLLATE "C") stands in for the keyed LF
      // order; COUNTR1 is not UNIQUE, so equal names are tie-broken by code here (CR-C4).
      const sql =
        order === "code"
          ? `SELECT coid, countr FROM country
              WHERE coid COLLATE "C" >= $1 COLLATE "C"
              ORDER BY coid COLLATE "C" LIMIT $2 OFFSET $3`
          : `SELECT coid, countr FROM country
              WHERE countr COLLATE "C" >= $1 COLLATE "C"
              ORDER BY countr COLLATE "C", coid COLLATE "C" LIMIT $2 OFFSET $3`;
      const key = order === "code" ? normaliseCountryCode(request.position) : normaliseCountryName(request.position);
      const r = await db.query<SltCountryRow>(sql, [key, SLT_LOAD_SIZE + 1, offset]);
      const more = r.rows.length > SLT_LOAD_SIZE;
      const rows = more ? r.rows.slice(0, SLT_LOAD_SIZE) : r.rows;
      return { rows, more, nextOffset: more ? offset + SLT_LOAD_SIZE : null };
    },
    async listCountries() {
      const r = await db.query<Country>("SELECT coid, countr, coiso FROM country ORDER BY coid");
      return r.rows;
    },
  };
}

/**
 * The `2A` by-value parameter of the COU300 getters and the `2A` KEYCOD / POSCOD (c07, c12):
 * a longer value is cut to its first two characters, trailing blanks are the fixed-length
 * padding and do not take part in the keyed compare. Case is kept as typed — the 5250 session
 * uppercased POSCOD (no CHECK(LC)), which is presentation, not this module (CR-C3).
 */
export function normaliseCountryCode(coid: string | undefined): string {
  return (coid ?? "").slice(0, COID_LENGTH).trimEnd();
}

/** The `30A` KEYDES / POSDES of the by-name order (c09, c11); `CHECK(LC)` keeps case as typed. */
export function normaliseCountryName(countr: string | undefined): string {
  return (countr ?? "").slice(0, COUNTR_LENGTH).trimEnd();
}

/** SltCountry entry (c09 step 1): by-code order positioned at the caller's code, `dft` = that code. */
export function sltCountryOpen(pcod: string): SltCountryState {
  return { order: "code", keycod: normaliseCountryCode(pcod), keydes: "", dft: pcod };
}

/**
 * COU301 S01chk (c11), rows examined in RRN order as `readc` returns them. Errors are cumulative
 * within one Enter; the first offending row is the one the page is positioned on (ERR01 latch).
 */
export function sltCountryCheck(entry: SltCountryEntry): SltCountryCheck {
  const errors: SltCountryError[] = [];
  let firstErrorRrn: number | null = null;
  let selected: string | null = null;
  let optionsTyped = false;

  for (const row of entry.rows ?? []) {
    if (row.opt === 0) continue;
    optionsTyped = true;
    if (row.opt !== 1) {
      errors.push({ indicator: 35, text: "INVALID OPTION", rrn: row.rrn });
      firstErrorRrn ??= row.rrn;
    } else if (selected !== null) {
      errors.push({ indicator: 36, text: "ONLY ONE SELECTION", rrn: row.rrn });
      firstErrorRrn ??= row.rrn;
    } else {
      selected = row.coid;
    }
  }

  const optc1 = entry.controlOption ?? 0;
  if (optc1 !== 8 && optc1 !== 0) {
    errors.push({ indicator: 41, text: "Invalid option" });
  }
  if (selected !== null && optc1 !== 0) {
    errors.push({ indicator: 42, text: "Position to not available with selection pending" });
  }
  return { errors, firstErrorRrn, selected, optionsTyped };
}

/**
 * One pass of the COU301 state machine after `exfmt CTL01` (c09 S01key, c11 S01chk, c10 / c11
 * S01act): F3 / F12 return `dft`; otherwise the entry is checked, then F8 toggles (clearing the
 * key of the order being entered), option 8 repositions, or the single selected row is returned.
 * Page Down is not an entry here — the caller asks `sltCountry` for the next offset.
 */
export function sltCountryAct(state: SltCountryState, entry: SltCountryEntry): SltCountryOutcome {
  if (entry.cancel) return { kind: "return", coid: state.dft };

  const check = sltCountryCheck(entry);
  if (check.errors.length > 0) return { kind: "redisplay", check };
  // `when STS01 = *ON and IN08 = *ON -> dsp`: F8 is ignored while any row option is typed (c10).
  if (entry.f8 && check.optionsTyped) return { kind: "redisplay", check };

  if (entry.f8) {
    // IN08 is tested before OPTC1 = 8: F8 with a position typed on the same Enter toggles and
    // discards the position (c10 step 3). The key of the order being entered is cleared.
    const order: SltCountryOrder = state.order === "code" ? "name" : "code";
    return {
      kind: "reprepare",
      state: order === "name" ? { ...state, order, keydes: "" } : { ...state, order, keycod: "" },
    };
  }
  if ((entry.controlOption ?? 0) === 8) {
    return {
      kind: "reprepare",
      state:
        state.order === "code"
          ? { ...state, keycod: normaliseCountryCode(entry.positionTo) }
          : { ...state, keydes: normaliseCountryName(entry.positionTo) },
    };
  }
  if (check.selected !== null) return { kind: "select", coid: check.selected };
  return { kind: "none" };
}

/** The `sltCountry` request for a state: the current order and that order's key (s01prp). */
export function sltCountryRequest(state: SltCountryState, offset = 0): SltCountryRequest {
  return {
    order: state.order,
    position: state.order === "code" ? state.keycod : state.keydes,
    offset,
  };
}
