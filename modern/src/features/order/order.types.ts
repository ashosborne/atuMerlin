/** One ORDER row as stored (ORDER.PF record format FORDE). Dates are ISO yyyy-mm-dd or null = never. */
export interface OrderRow {
  orid: number;
  oryear: number;
  orcuid: number;
  ordate: string;
  /** null = never delivered (legacy ORDATDEL 0 / 1940-01-01 sentinel at the boundary) */
  ordatdel: string | null;
  /** null = never closed (legacy ORDATCLO 0) */
  ordatclo: string | null;
}

/** One DETORD row as stored (DETORD.PF record format FDETO). */
export interface LineRow {
  odorid: number;
  /** Written as 0 by ORD100 confirm; only the deferred batch ORD901 backfills it (ord-entry-ord100-c07). */
  odyear: number;
  odline: number;
  odarid: string;
  odqty: number;
  odqtyliv: number;
  odprice: number;
  odtot: number;
  odtotvat: number;
}

/** ORD101 / ORD202 line presentation: stored row + FARTICLE description. */
export interface LineDetail extends LineRow {
  /** GetArtDesc(ODARID), blank when the article is unknown. */
  ardesc: string;
}

/** ORD202 FMT (ord-maintain-ord202-c01 / c02) and ORD101 header (ord-entry-ord101-c02). */
export interface OrderDetail extends OrderRow {
  /** GetCusName(ORCUID); blank when the customer is missing. */
  custnm: string;
  lines: LineDetail[];
  /** Sum of the STORED ODTOT / ODTOTVAT (never recomputed). */
  tot: number;
  totvat: number;
}

/** One ORDERCUS row as the list twins show it (ord-maintain-ord200-c01, ord-maintain-ord201-c01). */
export interface OrderListRow {
  orid: number;
  oryear: number;
  orcuid: number;
  custnm: string;
  ordate: string;
  ordatdel: string | null;
  ordatclo: string | null;
  /** TOTVAL = COALESCE(SUM(ODTOTVAT), 0) — VAT-inclusive. */
  totval: number;
}

export interface OrderListPage {
  rows: OrderListRow[];
  /** true = "More..." (a further row exists), false = "Bottom". */
  more: boolean;
  nextOffset: number | null;
}

/** One staged line of an order being composed (ORD100 QTEMP/DETORD row before confirm). */
export interface DraftLine {
  /** Staged number from the running counter (gaps allowed, ord-entry-ord100-c12); renumbered at confirm. */
  odline: number;
  odarid: string;
  odqty: number;
  odprice: number;
}

/** ORD100 FMT02 figures for one line (ord-entry-ord100-c03 / c04). */
export interface QuotedLine extends DraftLine {
  ardesc: string;
  odtot: number;
  vat: number;
  odtotvat: number;
  vatRate: number;
}

/** Body of POST /api/orders (ORD100 F8 confirm). */
export interface OrderInput {
  orcuid: number;
  lines: DraftLine[];
}

/** Body of PUT /api/orders/:id/lines/:line (ORD101 FMT02). */
export interface LineInput {
  odqty: number;
  odqtyliv: number;
  odprice: number;
}

export type OrderErrorCode =
  | "ERR1001" // Delivered quantity must be lower or equal to ordered quantity
  | "ERR1002" // Ordered quantity can not be lower that the quantity already delivered
  | "INVALID_OPTION" // SFLMSG 35 'Invalid Option' — as-is text for already closed / already delivered
  | "CLOSED_ORDER" // SFLMSG 36 'Closed order can not be edited or deleted'
  | "ORDER_HAS_DELIVERIES" // SFLMSG 37 'Order whith deliveries can not be deleted' (DDS typo as-is)
  | "LINE_HAS_DELIVERY" // ORD101 SFLMSG 36 'Line with delivery can not be deleted.'
  | "TOTAL_OVERFLOW" // modern boundary: qty x price does not fit ODTOT 9P 2 (legacy: unmonitored size error)
  | "FIELD_TOO_LONG"
  | "FIELD_INVALID";

export interface OrderError {
  code: OrderErrorCode;
  field: string;
  message: string;
}

export const MESSAGES = {
  ERR1001: "Delivered quantity must be lower or equal to ordered quantity.",
  ERR1002: "Ordered quantity can not be lower that the quantity already delivered.",
  INVALID_OPTION: "Invalid Option",
  CLOSED_ORDER: "Closed order can not be edited or deleted",
  ORDER_HAS_DELIVERIES: "Order whith deliveries can not be deleted",
  LINE_HAS_DELIVERY: "Line with delivery can not be deleted.",
} as const;

/** SAMREF field sizes used at the boundary. */
export const ARID_LENGTH = 6;
export const ORID_MAX = 999_999; // ORID 6P 0
export const ODLINE_MAX = 99_999; // ODLINE 5P 0
export const QUANTITY_MAX = 99_999; // QUANTITY 5 0 (signed)
export const UNITPRICE_MAX = 99_999.99; // UNITPRICE 7P 2
export const TOTPRICE_MAX = 9_999_999.99; // TOTPRICE 9P 2
