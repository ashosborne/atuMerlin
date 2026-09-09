/** One CUSTOMER row as stored (CUSTOMER.PF record format FCUST). */
export interface CustomerRow {
  cuid: number;
  custnm: string;
  cuphone: string;
  cuvat: string;
  cumail: string;
  culine1: string;
  culine2: string;
  culine3: string;
  cuzip: string;
  cucity: string;
  cucoun: string;
  culimcre: number;
  cucredit: number;
  /** yyyymmdd as a number, 0 = never ordered (cus-interactive-c07). Written only by ORD/ART, never by CUS. */
  culastord: number;
  /** ISO date yyyy-mm-dd */
  cucrea: string;
  /** Local timestamp yyyy-mm-ddThh:mm:ss.ffffff, no zone (job time, as %timestamp()) */
  cumod: string;
  cumodid: string;
  /** 'X' = soft-deleted, otherwise blank. No writer exists in the CUS seam (cus-interactive-c11). */
  cudel: string;
}

/** Fields a user can type on CUS200 FMT02 (cus-interactive-c02 / c03). */
export interface CustomerInput {
  custnm: string;
  cuphone: string;
  cuvat: string;
  cumail: string;
  culine1: string;
  culine2: string;
  culine3: string;
  cuzip: string;
  cucity: string;
  cucoun: string;
  culimcre: number;
}

export const CUSTOMER_INPUT_FIELDS = [
  "custnm",
  "cuphone",
  "cuvat",
  "cumail",
  "culine1",
  "culine2",
  "culine3",
  "cuzip",
  "cucity",
  "cucoun",
  "culimcre",
] as const satisfies ReadonlyArray<keyof CustomerInput>;

/** Fixed-length sizes from SAMREF.PF / CUSTOMER.PF. */
export const FIELD_LENGTH: Record<Exclude<keyof CustomerInput, "culimcre">, number> = {
  custnm: 30,
  cuphone: 15,
  cuvat: 12,
  cumail: 50,
  culine1: 50,
  culine2: 50,
  culine3: 50,
  cuzip: 10,
  cucity: 30,
  cucoun: 2,
};

export interface CustomerDetail extends CustomerRow {
  /** GetCountryName(CUCOUN); blank when the code is unknown (c05 / c10). */
  countryName: string;
  /** CUS200 presentation of CULASTORD: null when 0 (sentinel 1940-01-01 -> blank), else yyyy-mm-dd (c07). */
  lastOrderDate: string | null;
}

/** One CUS200 SFL01 row (c01): first line + folded CUCITY line. */
export interface CustomerListRow {
  cuid: number;
  custnm: string;
  culimcre: number;
  cuzip: string;
  cudel: string;
  cucity: string;
}

export interface CustomerListPage {
  rows: CustomerListRow[];
  /** true = "More..." (a 15th row exists); false = "Bottom". */
  more: boolean;
  /** Key of the first unseen row, i.e. where the next load resumes (c01 s01sav). */
  next: { cursorName: string; cursorId: number } | null;
}

export type ValidationErrorCode =
  | "ERR0002" // Country code unknown. Press F4 to select.
  | "NAME_MANDATORY" // DDS literal "The name is mandatory"
  | "ERR2001" // A phone number is mandatory
  | "ERR2002" // Phone number must contain only numbers
  | "ERR2000" // Customer &1 /Phone &2 Already Exist
  | "FIELD_TOO_LONG" // modern boundary: longer than the fixed-length legacy field
  | "FIELD_INVALID"; // modern boundary: wrong type / shape

export interface ValidationError {
  code: ValidationErrorCode;
  field: keyof CustomerInput;
  message: string;
}

export type SaveMode = "CRT" | "UPD";
