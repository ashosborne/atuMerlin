import type { FCountry } from "../../shared/fcountry/index.js";
import type { CustomerRepository } from "./customer.repository.js";
import { LIST_PAGE_SIZE } from "./customer.repository.js";
import {
  CUSTOMER_INPUT_FIELDS,
  FIELD_LENGTH,
  type CustomerDetail,
  type CustomerInput,
  type CustomerListPage,
  type CustomerRow,
  type SaveMode,
  type ValidationError,
} from "./customer.types.js";

export const POSTO_LENGTH = 10; // CUS200D POSTO 10A
export const CUMODID_LENGTH = 10;

export class CustomerValidationError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super("customer validation failed");
  }
}

export class CustomerNotFoundError extends Error {
  constructor(public readonly cuid: number) {
    super(`Code ${editZ(cuid)} Unknown.`); // ERR0103 with %editc(id:'Z') (cus-interactive-c09)
  }
}

export interface CustomerService {
  /** CUS200 list (c01): position-to prefix or continuation cursor; 14 rows + More/Bottom. */
  list(opts: { positionTo?: string | undefined; cursorName?: string | undefined; cursorId?: number | undefined }): Promise<CustomerListPage>;
  /** CUS250 chain + GetCountryName (c09, c10). Soft-deleted rows are returned (c11). */
  get(cuid: number): Promise<CustomerDetail>;
  /** CUS200 F6 + Enter (c02, c04, c08). */
  create(raw: unknown, user: string): Promise<CustomerDetail>;
  /** CUS200 option 2 + Enter (c03, c04, c08). */
  update(cuid: number, raw: unknown): Promise<CustomerDetail>;
  /** S02chk (c04) on an already-parsed input; exported for the web form. */
  validate(input: CustomerInput, mode: SaveMode): Promise<ValidationError[]>;
  /** Boundary parse of a JSON / form body into the FMT02 fields. */
  parseInput(raw: unknown): { input: CustomerInput; errors: ValidationError[] };
  toDetail(row: CustomerRow): Promise<CustomerDetail>;
}

export function createCustomerService(repo: CustomerRepository, fcountry: FCountry): CustomerService {
  async function toDetail(row: CustomerRow): Promise<CustomerDetail> {
    return {
      ...row,
      countryName: await fcountry.getCountryName(row.cucoun),
      lastOrderDate: lastOrderDateOf(row.culastord),
    };
  }

  async function validate(input: CustomerInput, mode: SaveMode): Promise<ValidationError[]> {
    // S02chk: every rule runs in one pass so several errors can show together (c04 §1).
    const errors: ValidationError[] = [];

    if (!(await fcountry.existCountry(input.cucoun))) {
      errors.push({ code: "ERR0002", field: "cucoun", message: "Country code unknown. Press F4 to select." });
    }
    if (input.custnm.trim() === "") {
      errors.push({ code: "NAME_MANDATORY", field: "custnm", message: "The name is mandatory" });
    }
    if (input.cuphone === "") {
      // Blank phone skips the digits and duplicate checks entirely (c04 §2).
      errors.push({ code: "ERR2001", field: "cuphone", message: "A phone number is mandatory" });
    } else {
      if (/[^0-9]/.test(input.cuphone)) {
        errors.push({ code: "ERR2002", field: "cuphone", message: "Phone number must contain only numbers" });
      }
      // As-is UPD threshold `dup > 1` counts rows holding the NEW name+phone; the customer's own
      // row still holds the old values, so a change colliding with exactly one other customer
      // passes. needs-SME (cus-interactive-c04) — preserved, not redesigned.
      const dup = await repo.countDuplicates(input.custnm, input.cuphone);
      if ((mode === "CRT" && dup > 0) || (mode === "UPD" && dup > 1)) {
        errors.push({
          code: "ERR2000",
          field: "custnm",
          message: `Customer ${input.custnm} /Phone ${input.cuphone} Already Exist`,
        });
      }
    }
    return errors;
  }

  return {
    toDetail,
    validate,
    parseInput,

    async list({ positionTo, cursorName, cursorId }) {
      const key =
        cursorName !== undefined && cursorId !== undefined
          ? { name: cursorName, id: cursorId }
          : { name: (positionTo ?? "").slice(0, POSTO_LENGTH), id: 0 };
      // Read one past the page: the 15th record is where the next load resumes (s01sav).
      const rows = await repo.listFrom(key, LIST_PAGE_SIZE + 1);
      const more = rows.length > LIST_PAGE_SIZE;
      const page = more ? rows.slice(0, LIST_PAGE_SIZE) : rows;
      const lookAhead = more ? rows[LIST_PAGE_SIZE]! : null;
      return {
        rows: page,
        more,
        next: lookAhead ? { cursorName: lookAhead.custnm, cursorId: lookAhead.cuid } : null,
      };
    },

    async get(cuid) {
      const row = await repo.findById(cuid);
      if (!row) throw new CustomerNotFoundError(cuid);
      return toDetail(row);
    },

    async create(raw, user) {
      const { input, errors: shapeErrors } = parseInput(raw);
      if (shapeErrors.length) throw new CustomerValidationError(shapeErrors);
      const errors = await validate(input, "CRT");
      if (errors.length) throw new CustomerValidationError(errors);
      // Legacy draws NEXT VALUE FOR CUSSEQ on F6, before validation; here it is drawn at save.
      // Gaps remain possible (Postgres sequences are non-transactional) — gap-free ids are not
      // guaranteed either way (open question on c02).
      const cuid = await repo.nextId();
      const row = await repo.insert(cuid, input, user.slice(0, CUMODID_LENGTH));
      return toDetail(row);
    },

    async update(cuid, raw) {
      const existing = await repo.findById(cuid);
      if (!existing) throw new CustomerNotFoundError(cuid); // legacy chain is unchecked (c03); modern reports not-found
      const { input, errors: shapeErrors } = parseInput(raw);
      if (shapeErrors.length) throw new CustomerValidationError(shapeErrors);
      const errors = await validate(input, "UPD");
      if (errors.length) throw new CustomerValidationError(errors);
      const row = await repo.update(cuid, input);
      if (!row) throw new CustomerNotFoundError(cuid);
      return toDetail(row);
    },
  };
}

/**
 * Boundary parse: strings are right-trimmed (fixed-length CHAR semantics), the phone is
 * %trim'd on both sides as CUS200 does in place (c04 §3), and lengths that the 5250 screen made
 * impossible to exceed are rejected instead of silently truncated.
 */
export function parseInput(raw: unknown): { input: CustomerInput; errors: ValidationError[] } {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: ValidationError[] = [];
  const input: CustomerInput = {
    custnm: "",
    cuphone: "",
    cuvat: "",
    cumail: "",
    culine1: "",
    culine2: "",
    culine3: "",
    cuzip: "",
    cucity: "",
    cucoun: "",
    culimcre: 0,
  };

  for (const field of CUSTOMER_INPUT_FIELDS) {
    const value = src[field];
    if (field === "culimcre") {
      if (value === undefined || value === null || value === "") continue;
      const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
      // CULIMCRE 9,2 signed: |n| < 10^7 with at most two decimals. Sign and range are otherwise
      // unvalidated by CUS200 (c04) — only the field shape is enforced here.
      if (!Number.isFinite(n) || Math.abs(n) >= 1e7 || Math.round(n * 100) !== n * 100) {
        errors.push({ code: "FIELD_INVALID", field, message: "Credit limit must be a number with at most 2 decimals (9,2)" });
      } else {
        input.culimcre = n;
      }
      continue;
    }
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") {
      errors.push({ code: "FIELD_INVALID", field, message: `${field} must be a string` });
      continue;
    }
    const normalised = field === "cuphone" ? value.trim() : value.replace(/\s+$/, "");
    if (normalised.length > FIELD_LENGTH[field]) {
      errors.push({ code: "FIELD_TOO_LONG", field, message: `${field} is longer than ${FIELD_LENGTH[field]} characters` });
      continue;
    }
    input[field] = normalised;
  }
  return { input, errors };
}

/** %editc(id:'Z'): zero-suppressed, so 0 becomes blank (c09 edge case "Code  Unknown."). */
export function editZ(n: number): string {
  return n === 0 ? "" : String(n);
}

/**
 * CUS200 presentation of CULASTORD (c07): 0 -> 1940-01-01 sentinel -> blank (null here); otherwise
 * the yyyymmdd number as an ISO date. A stored value that is not a valid date raised an RPG
 * exception in CUS200; here it is presented as null and the raw number stays available.
 */
export function lastOrderDateOf(culastord: number): string | null {
  if (culastord === 0) return null;
  const s = String(culastord).padStart(8, "0");
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}
