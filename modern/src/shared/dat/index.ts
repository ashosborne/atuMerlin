/**
 * DAT utilities — the two RPG programs DAT001 / DAT002 behind the SQL scalar functions
 * ISO_Num_To_Date and ISOTODATE40 — as a shared TypeScript module. Pack atu-merlin-ts-dat-v1@1,
 * mapping rule "RPGLE date utilities -> TS shared module". Cards dat-utils-c01 .. c08.
 *
 * Two layers, deliberately kept apart:
 *
 *  1. As-is UDF semantics for COMPARE at the TS API (WAIVED_PATHFINDER):
 *     - `isoToDate40`  = ISOTODATE40 / DAT002 (c01): 0 -> 1940-01-01, 99999999 -> 2039-12-31,
 *       valid yyyymmdd -> that date, anything else -> null.
 *     - `isoNumToDate` = ISO_Num_To_Date / DAT001 (c02): no sentinels, 0 -> null.
 *     Both are pure and stateless (c04 DETERMINISTIC / NO SQL, c06 nothing kept between calls),
 *     accept `null` without evaluating (c04 RETURNS NULL ON NULL INPUT) and raise
 *     `DatArgumentError` (SQLSTATE 38I02, c05) for an argument an `8 0` packed field cannot hold.
 *
 *  2. The date lock the pack shares with ORD and CUS: inside the modern boundary a blank / never
 *     date is `null`; the IBM i shapes (numeric 0, the 1940-01-01 presentation value) appear only
 *     when a value crosses that boundary (`fromLegacyIsoNum`, `toLegacyIsoNum`,
 *     `fromLegacySentinelDate`, `toLegacySentinelDate`). DAT001's "0 -> NULL" *is* the lock;
 *     DAT002's "0 -> 1940-01-01" is legacy presentation and is never to be stored (c07).
 *
 * known_risks kept visible, not decided here (SME_BRIEF.md):
 *  - c01: the 99999999 -> 2039-12-31 branch is reproduced as-is in `isoToDate40` (no in-tree
 *    writer produces it; no MAPVAL blanks it). The date lock does not treat 2039-12-31 as "never".
 *  - c02/c03: ISO_Num_To_Date has no caller in ATU_SRC; whether the QM queries use it is open.
 *    `isoNumToDate` is carried because it is one line and because the lock has the same shape.
 *  - c07: the sentinel is now defined once (`LEGACY_LOVAL_DATE`); the CUS / ORD packs keep their
 *    own boundary code and are not rewritten here (deny-listed).
 */

/** yyyy-mm-dd, the shape `date` columns come back as (pg type parser 1082 in db/pool.ts). */
export type IsoDate = string;

/** `*LOVAL` of the RPG 2-digit-year date formats; DAT002's value for 0 (c01, c07). */
export const LEGACY_LOVAL_DATE: IsoDate = "1940-01-01";
/** `*HIVAL` of the same formats; DAT002's value for 99999999 (c01). */
export const LEGACY_HIVAL_DATE: IsoDate = "2039-12-31";
/** `*HIVAL` of an `8 0` field — the only value other than 0 that DAT002 treats specially (c01). */
export const ISO_NUM_HIVAL = 99999999;
/** The estate's storage convention for "no date" in an `8 0` column (c07). */
export const ISO_NUM_NONE = 0;

/**
 * c05: the `*PSSR` path. DAT001 / DAT002 turn any unmonitored exception into SQLSTATE 38I02 with the
 * program-status exception text (80 chars, cut to the 70-char VARYING parameter) and the SQL
 * statement fails — an invalid date is NOT this path (it is a NULL result). In TypeScript the only
 * analogue of a corrupt packed argument is a value an `8 0` field cannot hold: non-finite,
 * non-integer, or outside -99999999 .. 99999999.
 */
export class DatArgumentError extends Error {
  readonly sqlstate = "38I02";
  readonly dat8: unknown;
  constructor(dat8: unknown, detail: string) {
    super(detail.slice(0, 70));
    this.name = "DatArgumentError";
    this.dat8 = dat8;
  }
}

/** DECIMAL(8,0) can hold -99999999 .. 99999999 (c01 edge case); anything else is not a value. */
function requireDecimal8(dat8: number): void {
  if (!Number.isInteger(dat8) || Math.abs(dat8) > ISO_NUM_HIVAL) {
    throw new DatArgumentError(dat8, `Decimal-data error: ${String(dat8)} is not a DECIMAL(8,0) value`);
  }
}

/**
 * `test(de) *iso dat8` followed by `%date(dat8:*iso)` (c01 validation rules): the number is read as
 * eight zero-padded digits yyyymmdd; years 0001-9999, months 01-12, days valid for the month
 * (29 February only in a leap year). No business-window check, so 10101 (0001-01-01) and 99991231
 * convert. A negative value, month 00 / 13+, day 00 / out of range -> null (the `%error` branch:
 * the result is absent, never a stale value — c08).
 */
export function testIsoNum(dat8: number): IsoDate | null {
  requireDecimal8(dat8);
  if (dat8 < 0) return null;
  const y = Math.floor(dat8 / 10000);
  const m = Math.floor(dat8 / 100) % 100;
  const d = dat8 % 100;
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/**
 * ISO_Num_To_Date(DECIMAL(8,0)) RETURNS DATE — DAT001 (c02). Every argument goes to `test(de)`, so
 * 0 (month 00) and 99999999 (month 99) are null. `null` in -> `null` out without evaluating (c04).
 * No caller in ATU_SRC (c03, needs-SME: QM queries).
 */
export function isoNumToDate(dat8: number | null): IsoDate | null {
  if (dat8 === null) return null;
  return testIsoNum(dat8);
}

/**
 * ISOTODATE40(DECIMAL(8,0)) RETURNS DATE — DAT002 (c01), the rule ORD200 / ORD201 relied on:
 * 0 -> 1940-01-01, 99999999 -> 2039-12-31 (exact equality, 99999998 is just invalid), otherwise
 * `test(de)` / `%date`. The two sentinels are legacy *presentation* values (blanked by DDS MAPVAL,
 * compared as constants by the callers) — see the date lock below for what to store.
 */
export function isoToDate40(dat8: number | null): IsoDate | null {
  if (dat8 === null) return null;
  requireDecimal8(dat8);
  if (dat8 === ISO_NUM_NONE) return LEGACY_LOVAL_DATE;
  if (dat8 === ISO_NUM_HIVAL) return LEGACY_HIVAL_DATE;
  return testIsoNum(dat8);
}

// --- Date lock (pack mapping rule "IBM i blank/never date -> store NULL; sentinel only at the boundary")

/**
 * Boundary in, numeric shape: an `8 0` yyyymmdd as stored by the legacy (ORDER.ORDATE / ORDATDEL /
 * ORDATCLO, CUSTOMER.CULASTORD) -> ISO date or `null` for "never" (0). An invalid stored number is
 * also `null` (the CUS pack's CR-6 stance: the RPG paths raised an exception, the modern boundary
 * presents "no date" and keeps the raw number available where it matters). Same values as
 * `isoNumToDate`: DAT001's semantics are the lock.
 */
export function fromLegacyIsoNum(dat8: number | null): IsoDate | null {
  return isoNumToDate(dat8);
}

/**
 * Boundary out, numeric shape: ISO date or `null` -> `8 0` yyyymmdd, `null` -> 0. This is what the
 * ORD701 trigger does inline (`to_char(ordate, 'YYYYMMDD')::integer`) when it stamps CULASTORD at
 * the CUS boundary, and what `%dec(%date():*iso)` did on the box.
 */
export function toLegacyIsoNum(date: IsoDate | null): number {
  if (date === null) return ISO_NUM_NONE;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const n = m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : NaN;
  if (!m || testIsoNum(n) !== date) {
    throw new DatArgumentError(date, `Not an ISO date: ${String(date)}`);
  }
  return n;
}

/**
 * Boundary in, date shape: a date that arrives already carrying the legacy presentation sentinel
 * (DAT002 output, a CUS200 / ORD202 `datBlank` field) -> `null` for 1940-01-01, unchanged otherwise.
 * 2039-12-31 is NOT mapped: the legacy never blanked it either (c01 known_risk, needs-SME).
 */
export function fromLegacySentinelDate(date: IsoDate | null): IsoDate | null {
  return date === LEGACY_LOVAL_DATE ? null : date;
}

/**
 * Boundary out, date shape: `null` -> 1940-01-01, the single definition of the step that DAT002,
 * CUS200 and ORD202 each carried on their own (c07) and that ORD200 / ORD201 compared against.
 * For legacy-shaped presentation or interop only; the modern tables store `null`.
 */
export function toLegacySentinelDate(date: IsoDate | null): IsoDate {
  return date ?? LEGACY_LOVAL_DATE;
}
