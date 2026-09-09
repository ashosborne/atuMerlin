import {
  PACODE_LENGTH,
  PARM1_LENGTH,
  PARM2_LENGTH,
  PARM3_LENGTH,
  PARM4_DIGITS,
  PARM5_DIGITS,
  normaliseParameterKey,
  type ParameterRow,
} from "../../shared/parm/index.js";
import type { ParameterKey, ParameterPage, ParameterValues, ParRepository } from "./par.repository.js";

/**
 * PAR200 "Work with Parameters" (par-maintain-c01 .. c06) at the TypeScript boundary — pack
 * atu-merlin-ts-par-v1@1. The panel/step machine, the subfile and its snapshot quirks are not
 * reproduced (stateless HTTP, CR-P2): each call is one Enter on one row. What IS carried are the
 * rules the cards found in code:
 *  - c01 key order, 14 rows per load, exact Bottom by look-ahead; PARM2S = first 32 of PARM2.
 *  - c02 create validates the duplicate key ONLY: blank code and/or sub-code accepted (the
 *    blank/blank row), values unvalidated, no audit, no message on success; ERRMSG text kept.
 *  - c02 keys and PARM1 / PARM3 are stored upper-case: the 5250 display folded every field
 *    without CHECK(LC); PARM2 has CHECK(LC) and keeps case. The folding is reproduced here
 *    because it is the only reason `GetParm2('PATH':' ')` finds a row typed in lower case
 *    (c09 compares case-sensitively). Recorded as CR-P4.
 *  - c04 edit updates PARM1..5 unconditionally (an unchanged panel still updates), key immutable
 *    (output-only on FMT02), no validation, no audit.
 *  - c05 delete is immediate, by key, no confirmation, no in-use check (PATH can be deleted while
 *    consumers depend on it), not-found is silent; the blank/blank row is deletable like any other.
 *
 * Deliberately not reproduced / decided elsewhere:
 *  - c03 (list not refreshed after create; duplicate row after Bottom), c04 (pre-edit values in
 *    the list), c05 (ghost row, the never-displayed '*** Deleted ****' marker), c06 (F3 / F12
 *    routing): subfile-snapshot and key mechanics with no HTTP equivalent (CR-P2).
 *  - c02 / c04 record locks across the panel, WAITRCD, 01218: no lock over HTTP (CR-P2).
 *  - c04 update on a vanished row (legacy: unmonitored 01221) -> ParameterNotFoundError (CR-P5).
 *  - c02 chain/write race (legacy: unmonitored 01021) -> the same duplicate error (CR-P5).
 *  - Over-long or non-numeric input: impossible on 5250 (field widths); rejected 400 here (CR-P6).
 */

export interface ParFieldError {
  code: "FIELD_TOO_LONG" | "FIELD_INVALID" | "DUPLICATE_KEY";
  field: string;
  message: string;
}

export class ParameterValidationError extends Error {
  constructor(readonly errors: ParFieldError[]) {
    super(errors.map((e) => e.message).join("; "));
    this.name = "ParameterValidationError";
  }
}

export class ParameterNotFoundError extends Error {
  constructor(readonly key: ParameterKey) {
    super(`Parameter (${key.pacode || " "}, ${key.pasubcode || " "}) not found`);
    this.name = "ParameterNotFoundError";
  }
}

/** ERRMSG on PACODE, indicator 40 (PAR200D FMT03, c02). */
export const DUPLICATE_MESSAGE = "This code/sub-code already exist.";
/** PARM2S 32A: the list shows the first 32 characters of PARM2 (c01). */
export const PARM2S_LENGTH = 32;

/** A SFL01 row: Opt / Code / Sub-Code / 1 / 2 (PARM2S) / 3 / 4 / 5 — PARM2 itself is not in the subfile (c01, c05). */
export interface ParameterListRow {
  pacode: string;
  pasubcode: string;
  parm1: string;
  parm2s: string;
  parm3: string;
  parm4: number;
  parm5: number;
}

export interface ParameterListPage {
  rows: ParameterListRow[];
  more: boolean;
  nextOffset: number | null;
}

export interface ParService {
  /** CTL01 / SFL01 (c01): the file in key order, 14 rows from `offset`. */
  list(offset?: number): Promise<ParameterListPage>;
  /** FMT02 entry (c04 S02prp `chain`): the full row. Not found -> ParameterNotFoundError (CR-P5). */
  get(key: ParameterKey): Promise<ParameterRow>;
  /** FMT03 Enter (c02): duplicate-key check, then `write fparam`. */
  create(input: unknown): Promise<ParameterRow>;
  /** FMT02 Enter (c04): `update fparam` unconditionally; key from the URL, values from the body. */
  update(key: ParameterKey, input: unknown): Promise<ParameterRow>;
  /** Option 4 (c05): `delete (pacode:pasubcode)`; silent whether or not a row existed. */
  remove(key: ParameterKey): Promise<void>;
}

export function createParService(repo: ParRepository): ParService {
  return {
    async list(offset = 0) {
      const page: ParameterPage = await repo.list(Math.max(0, Math.trunc(offset)));
      return {
        rows: page.rows.map(({ parm2, ...rest }) => ({ ...rest, parm2s: parm2.slice(0, PARM2S_LENGTH) })),
        more: page.more,
        nextOffset: page.nextOffset,
      };
    },
    async get(key) {
      const row = await repo.chain(key);
      if (!row) throw new ParameterNotFoundError(key);
      return row;
    },
    async create(input) {
      const body = asRecord(input);
      const errors: ParFieldError[] = [];
      const key: ParameterKey = {
        pacode: readKey(body, "pacode", errors),
        pasubcode: readKey(body, "pasubcode", errors),
      };
      const values = readValues(body, errors);
      if (errors.length) throw new ParameterValidationError(errors);

      // S03chk: `chain` then `%found` -> indicator 40. Nothing else is checked (c02).
      if (await repo.chain(key)) throw duplicate();
      const row: ParameterRow = { ...key, ...values };
      try {
        await repo.write(row);
      } catch (err) {
        // The chain/write pair is not atomic (c02): a row written in between fails the UNIQUE
        // key. Legacy: unmonitored RPG 01021. Here: the same duplicate answer (CR-P5).
        if ((err as { code?: unknown }).code === "23505") throw duplicate();
        throw err;
      }
      return row;
    },
    async update(key, input) {
      const errors: ParFieldError[] = [];
      const values = readValues(asRecord(input), errors);
      if (errors.length) throw new ParameterValidationError(errors);
      // S02act: `update fparam` with no "changed?" test and no prior %found test (c04).
      if (!(await repo.update(key, values))) throw new ParameterNotFoundError(key);
      return { ...key, ...values };
    },
    async remove(key) {
      // `delete (pacode:pasubcode)`: no chain, no confirmation, no in-use check; not found is
      // silent (c05). A blank/blank key deletes the blank/blank row if one exists (c02, c05).
      await repo.delete(key);
    },
  };
}

/** Path / body key as the 10A key fields: cut to 10, trailing blanks dropped, upper-cased like the display (c02). */
export function parameterKeyOf(pacode: string | undefined, pasubcode: string | undefined): ParameterKey {
  return { pacode: normaliseParameterKey(pacode).toUpperCase(), pasubcode: normaliseParameterKey(pasubcode).toUpperCase() };
}

function duplicate(): ParameterValidationError {
  return new ParameterValidationError([{ code: "DUPLICATE_KEY", field: "pacode", message: DUPLICATE_MESSAGE }]);
}

function asRecord(input: unknown): Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
}

function readKey(body: Record<string, unknown>, field: "pacode" | "pasubcode", errors: ParFieldError[]): string {
  return readChar(body, field, PACODE_LENGTH, errors, true);
}

/** FMT02 / FMT03 input: `clear fmt03` means an absent field is blank / zero (c02). */
function readValues(body: Record<string, unknown>, errors: ParFieldError[]): ParameterValues {
  return {
    parm1: readChar(body, "parm1", PARM1_LENGTH, errors, true),
    parm2: readChar(body, "parm2", PARM2_LENGTH, errors, false), // CHECK(LC): case as typed
    parm3: readChar(body, "parm3", PARM3_LENGTH, errors, true),
    parm4: readZoned(body, "parm4", PARM4_DIGITS, errors),
    parm5: readZoned(body, "parm5", PARM5_DIGITS, errors),
  };
}

function readChar(body: Record<string, unknown>, field: string, max: number, errors: ParFieldError[], fold: boolean): string {
  const v = body[field];
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") {
    errors.push({ code: "FIELD_INVALID", field, message: `${field} must be a string` });
    return "";
  }
  if (v.length > max) {
    errors.push({ code: "FIELD_TOO_LONG", field, message: `${field} is longer than ${max} characters` });
    return "";
  }
  const stored = v.trimEnd();
  return fold ? stored.toUpperCase() : stored;
}

/** Zoned `n 0` input field: an integer of at most n digits; the sign nibble allows a negative (c12). */
function readZoned(body: Record<string, unknown>, field: string, digits: number, errors: ParFieldError[]): number {
  const v = body[field];
  if (v === undefined || v === null || v === "") return 0;
  const n = typeof v === "string" && /^-?\d+$/.test(v.trim()) ? Number(v.trim()) : v;
  const max = 10 ** digits - 1;
  if (typeof n !== "number" || !Number.isInteger(n) || Math.abs(n) > max) {
    errors.push({ code: "FIELD_INVALID", field, message: `${field} must be an integer with at most ${digits} digit${digits > 1 ? "s" : ""}` });
    return 0;
  }
  return n;
}
