import type { Db } from "../../db/pool.js";
import type { CustomerRow } from "../../features/customer/customer.types.js";

/**
 * FCUSTOMER service program (CUS300 + CUS301) as a shared module — pack mapping rule
 * "FCUSTOMER -> shared module". Cards: cus-modules-c01 .. c09, c11.
 *
 * Deliberately not reproduced (see modern/README.md, residuals):
 *  - TODO(cus-modules-c04): last-key cache / activation-group lifetime. The server is stateless
 *    per request, every call reads the table. Misses still return blanks / zeros as-is; whether
 *    "not found" should surface instead is needs-SME.
 *  - cus-modules-c05 CloseCUSTOME1: no file handle to close.
 *  - cus-modules-c10 GetCusLastOrdDate: dormant scaffold, needs-SME, no card — not implemented.
 *  - cus-modules-c09 dynamic SQL concatenation: pack `forbidden` rules out string-concat SQL,
 *    so criteria are bound parameters. `%` / `_` typed by the user still act as LIKE wildcards
 *    (no ESCAPE clause, as-is); a `'` no longer breaks the statement.
 */

/** Columns exposed by the eleven CUS300 getters (cus-modules-c01). */
type GetterColumns = Pick<
  CustomerRow,
  | "custnm"
  | "cuphone"
  | "cuvat"
  | "cumail"
  | "culine1"
  | "culine2"
  | "culine3"
  | "cuzip"
  | "cucity"
  | "cucoun"
  | "culimcre"
  | "cucredit"
  | "cudel"
>;

/** Buffer after `clear *all FCUST` followed by a failed CHAIN: blanks and zeros. */
const CLEARED: GetterColumns = {
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
  cucredit: 0,
  cudel: " ",
};

export const SLT_PAGE_SIZE = 14; // CUS301D SFLSIZ(15) SFLPAG(14): 14 rows per load, one-row look-ahead
export const SLT_CRITERIA_LENGTH = 10; // SRCHNAME / SRCHCITY 10A

export interface SltCustomerCriteria {
  name?: string | undefined;
  city?: string | undefined;
  /** rows already shown; the next 14 are returned */
  offset?: number | undefined;
}

export interface SltCustomerRow {
  cuid: number;
  custnm: string;
  cucity: string;
  /** 2-char code; no FCOUNTRY lookup in the selector (c06) */
  cucoun: string;
}

export interface SltCustomerPage {
  rows: SltCustomerRow[];
  /** true = "More...", false = "Bottom" (look-ahead fetch failed) */
  more: boolean;
  nextOffset: number | null;
}

export interface FCustomer {
  getCusName(cuid: number): Promise<string>;
  getCusPhone(cuid: number): Promise<string>;
  getCusVat(cuid: number): Promise<string>;
  getCusMail(cuid: number): Promise<string>;
  getCusAdrline1(cuid: number): Promise<string>;
  getCusAdrline2(cuid: number): Promise<string>;
  getCusAdrline3(cuid: number): Promise<string>;
  getCusZip(cuid: number): Promise<string>;
  getCusCity(cuid: number): Promise<string>;
  /** Country code, not name (c01). */
  getCusCountry(cuid: number): Promise<string>;
  getCusLimCredit(cuid: number): Promise<number>;
  getCusCredit(cuid: number): Promise<number>;
  /** %found and CUDEL <> 'X' (cus-modules-c02). Unknown id -> false. */
  existCus(cuid: number): Promise<boolean>;
  /** CUDEL = 'X' (cus-modules-c03). Unknown id -> false (indistinguishable from not deleted). */
  isCusDeleted(cuid: number): Promise<boolean>;
  /** CUS301 selection list: contains-match on UPPER(name) / UPPER(city), ordered by name (c06, c11). */
  sltCustomer(criteria: SltCustomerCriteria): Promise<SltCustomerPage>;
}

export function createFCustomer(db: Db): FCustomer {
  // chainCUSTOME1 (cus-modules-c04) without the cache: one keyed read per call.
  async function chain(cuid: number): Promise<{ found: boolean; row: GetterColumns }> {
    if (!Number.isInteger(cuid)) return { found: false, row: CLEARED };
    const r = await db.query<GetterColumns>(
      `SELECT custnm, cuphone, cuvat, cumail, culine1, culine2, culine3, cuzip, cucity, cucoun,
              culimcre, cucredit, cudel
         FROM customer WHERE cuid = $1`,
      [cuid],
    );
    const row = r.rows[0];
    return row ? { found: true, row } : { found: false, row: CLEARED };
  }

  const getter =
    <K extends keyof GetterColumns>(col: K) =>
    async (cuid: number): Promise<GetterColumns[K]> =>
      (await chain(cuid)).row[col];

  return {
    getCusName: getter("custnm"),
    getCusPhone: getter("cuphone"),
    getCusVat: getter("cuvat"),
    getCusMail: getter("cumail"),
    getCusAdrline1: getter("culine1"),
    getCusAdrline2: getter("culine2"),
    getCusAdrline3: getter("culine3"),
    getCusZip: getter("cuzip"),
    getCusCity: getter("cucity"),
    getCusCountry: getter("cucoun"),
    getCusLimCredit: getter("culimcre"),
    getCusCredit: getter("cucredit"),

    async existCus(cuid) {
      const { found, row } = await chain(cuid);
      return found && row.cudel !== "X";
    },

    async isCusDeleted(cuid) {
      const { row } = await chain(cuid);
      return row.cudel === "X";
    },

    async sltCustomer(criteria) {
      const name = normaliseCriterion(criteria.name);
      const city = normaliseCriterion(criteria.city);
      const offset = Math.max(0, Math.trunc(criteria.offset ?? 0));

      // s01prp branch shape (c09 table, c11): name AND city / name only / city only or both blank.
      // Both blank -> the legacy `LIKE '%%'` on a NOT NULL column matches every row, so no predicate.
      const where: string[] = [];
      const params: unknown[] = [];
      if (name !== "") {
        params.push(`%${name}%`);
        where.push(`UPPER(custnm) LIKE $${params.length}`);
      }
      if (city !== "") {
        params.push(`%${city}%`);
        where.push(`UPPER(cucity) LIKE $${params.length}`);
      }
      params.push(SLT_PAGE_SIZE + 1, offset);
      const sql =
        `SELECT cuid, custnm, cucity, cucoun FROM customer` +
        (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
        ` ORDER BY custnm COLLATE "C", cuid LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const r = await db.query<SltCustomerRow>(sql, params);
      const more = r.rows.length > SLT_PAGE_SIZE;
      const rows = more ? r.rows.slice(0, SLT_PAGE_SIZE) : r.rows;
      return { rows, more, nextOffset: more ? offset + SLT_PAGE_SIZE : null };
    },
  };
}

/** 10A display field, %trim'd, uppercased (the 5250 session uppercased input; UPPER() is on the column side). */
export function normaliseCriterion(value: string | undefined): string {
  return (value ?? "").slice(0, SLT_CRITERIA_LENGTH).trim().toUpperCase();
}
