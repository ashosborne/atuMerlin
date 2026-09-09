import type { FArticle } from "../../shared/farticle/index.js";
import type { FCustomer } from "../../shared/fcustomer/index.js";
import type { FVat } from "../../shared/fvat/index.js";
import { renderOrderDocument } from "./order.document.js";
import { LIST_PAGE_SIZE, type ConfirmLine, type OrderRepository } from "./order.repository.js";
import {
  ARID_LENGTH,
  MESSAGES,
  ODLINE_MAX,
  QUANTITY_MAX,
  TOTPRICE_MAX,
  UNITPRICE_MAX,
  type DraftLine,
  type LineDetail,
  type LineInput,
  type OrderDetail,
  type OrderError,
  type OrderInput,
  type OrderListPage,
  type OrderRow,
  type QuotedLine,
} from "./order.types.js";

export class OrderValidationError extends Error {
  constructor(public readonly errors: OrderError[]) {
    super("order validation failed");
  }
}

/**
 * Legacy had no not-found path: ORD202 / ORD500 raised an unmonitored date exception on a
 * missing order (ord-maintain-ord202-c01, ord-print-ord500-c08), ORD200/ORD201 option 7/8
 * updated without a locked record. What the target should do is needs-SME; the HTTP boundary
 * answers 404 and records the delta (CONTRACT_RISK, README).
 */
export class OrderNotFoundError extends Error {
  constructor(public readonly orid: number, public readonly odline?: number) {
    super(odline === undefined ? `Order ${orid} not found` : `Order ${orid} line ${odline} not found`);
  }
}

/** ORD200 / ORD201 s01chk refusal (one code, the as-is SFLMSG text). */
export class OrderOptionError extends Error {
  constructor(public readonly code: "INVALID_OPTION" | "CLOSED_ORDER" | "ORDER_HAS_DELIVERIES" | "LINE_HAS_DELIVERY") {
    super(MESSAGES[code]);
  }
}

export interface OrderService {
  /** ORD201 list (all orders with a customer row) or ORD200 list (one customer) — 14 rows + More/Bottom. */
  list(opts: { cuid?: number | undefined; offset?: number | undefined }): Promise<OrderListPage>;
  /** ORD202 / ORD101 header + every line + stored totals. */
  get(orid: number): Promise<OrderDetail>;
  /** ORD100 S02prp / S02chk: defaults for a new line, or recomputed figures for typed qty/price. */
  quoteLine(raw: unknown): Promise<QuotedLine>;
  /** ORD100 F8 confirm (c07): number from LASTORDNO, header, lines renumbered 1..n. */
  confirm(raw: unknown, user: string): Promise<OrderDetail>;
  /** ORD101 FMT02 Enter (c03 / c04). */
  updateLine(orid: number, odline: number, raw: unknown, user: string): Promise<LineDetail>;
  /** ORD101 option 4 (c05 / c06). */
  deleteLine(orid: number, odline: number, user: string): Promise<void>;
  /** ORD200 / ORD201 option 4 (c04 / c08). */
  deleteOrder(orid: number, user: string): Promise<void>;
  /** Option 7 (ord-maintain-ord200-c06). */
  close(orid: number, user: string): Promise<OrderRow>;
  /** Option 8 (ord-maintain-ord200-c07). */
  deliver(orid: number, user: string): Promise<{ order: OrderRow; linesDelivered: number }>;
  /** ORD500 (ord-print-ord500-c01): the spool content as text pages; re-rendered from stored rows on each call. */
  document(orid: number): Promise<string[][]>;
  parseOrderInput(raw: unknown): { input: OrderInput; errors: OrderError[] };
  parseLineInput(raw: unknown): { input: LineInput; errors: OrderError[] };
}

export interface OrderServiceDeps {
  repo: OrderRepository;
  farticle: FArticle;
  fvat: FVat;
  fcustomer: FCustomer;
}

export function createOrderService({ repo, farticle, fvat, fcustomer }: OrderServiceDeps): OrderService {
  /** ODTOT = qty x price (9P 2); VAT via CLCVat on the article's code; ODTOTVAT = ODTOT + VAT. */
  async function price(odarid: string, odqty: number, odprice: number) {
    const odtot = lineTotal(odqty, odprice);
    if (odtot === null) {
      throw new OrderValidationError([
        { code: "TOTAL_OVERFLOW", field: "odqty", message: "Quantity x unit price exceeds the line total field (9,2)" },
      ]);
    }
    const vatCode = await farticle.getArtVatCode(odarid);
    const vat = await fvat.clcVat(vatCode, odtot);
    const odtotvat = round2(odtot + vat);
    if (Math.abs(odtotvat) > TOTPRICE_MAX) {
      throw new OrderValidationError([
        { code: "TOTAL_OVERFLOW", field: "odqty", message: "Line total with VAT exceeds the field (9,2)" },
      ]);
    }
    return { odtot, vat, odtotvat, vatRate: await fvat.getVatRate(vatCode) };
  }

  async function toDetail(order: OrderRow): Promise<OrderDetail> {
    const rows = await repo.listLines(order.orid);
    const lines: LineDetail[] = [];
    let tot = 0;
    let totvat = 0;
    for (const l of rows) {
      tot = round2(tot + l.odtot);
      totvat = round2(totvat + l.odtotvat);
      lines.push({ ...l, ardesc: await farticle.getArtDesc(l.odarid) });
    }
    return { ...order, custnm: await fcustomer.getCusName(order.orcuid), lines, tot, totvat };
  }

  return {
    parseOrderInput,
    parseLineInput,

    async list({ cuid, offset }) {
      const from = Math.max(0, Math.trunc(offset ?? 0));
      const rows = await repo.list({ cuid, offset: from, limit: LIST_PAGE_SIZE + 1 });
      const more = rows.length > LIST_PAGE_SIZE;
      return { rows: more ? rows.slice(0, LIST_PAGE_SIZE) : rows, more, nextOffset: more ? from + LIST_PAGE_SIZE : null };
    },

    async get(orid) {
      const order = await repo.findOrder(orid);
      if (!order) throw new OrderNotFoundError(orid);
      return toDetail(order);
    },

    async quoteLine(raw) {
      const src = asRecord(raw);
      const errors: OrderError[] = [];
      const odarid = parseArid(src.odarid, errors);
      const odline = parseInt(src.odline, "odline", ODLINE_MAX, errors, 0);
      // First display: qty 1, unit price = GetArtRefSalPrice (c03). Typed values win afterwards (c04).
      const odqty = src.odqty === undefined || src.odqty === "" ? 1 : parseInt(src.odqty, "odqty", QUANTITY_MAX, errors, 1);
      const odprice =
        src.odprice === undefined || src.odprice === ""
          ? await farticle.getArtRefSalPrice(odarid)
          : parseMoney(src.odprice, "odprice", UNITPRICE_MAX, errors, 0);
      if (errors.length) throw new OrderValidationError(errors);
      const figures = await price(odarid, odqty, odprice);
      return { odline, odarid, odqty, odprice, ardesc: await farticle.getArtDesc(odarid), ...figures };
    },

    async confirm(raw, user) {
      const { input, errors } = parseOrderInput(raw);
      if (errors.length) throw new OrderValidationError(errors);
      // No ExistCus / IsCusDeleted, no article, stock, credit or line-count check (c01, c14):
      // any non-zero customer and any article id are accepted; a zero-line order is confirmed.
      const staged = [...input.lines].sort((a, b) => a.odline - b.odline);
      const lines: ConfirmLine[] = [];
      for (const l of staged) {
        const f = await price(l.odarid, l.odqty, l.odprice);
        lines.push({ odarid: l.odarid, odqty: l.odqty, odprice: l.odprice, odtot: f.odtot, odtotvat: f.odtotvat });
      }
      const order = await repo.confirm(input.orcuid, lines, user);
      return toDetail(order);
    },

    async updateLine(orid, odline, raw, user) {
      const stored = await repo.findLine(orid, odline);
      if (!stored) throw new OrderNotFoundError(orid, odline);
      const { input, errors } = parseLineInput(raw);
      if (errors.length) throw new OrderValidationError(errors);
      // S02chk (ord-entry-ord101-c04): each typed value is compared with the STORED row, never
      // typed vs typed. Both rules run; both can be on together. Preserved as-is (needs-SME).
      const rules: OrderError[] = [];
      if (input.odqtyliv > stored.odqty) {
        rules.push({ code: "ERR1001", field: "odqtyliv", message: MESSAGES.ERR1001 });
      }
      if (input.odqty < stored.odqtyliv) {
        rules.push({ code: "ERR1002", field: "odqty", message: MESSAGES.ERR1002 });
      }
      if (rules.length) throw new OrderValidationError(rules);
      // ODTOT / ODTOTVAT are always recomputed at today's VAT rate — also on a save with nothing
      // changed (silent re-rate, c03 as-is). No closed-order test here (c12 as-is: lists only).
      const f = await price(stored.odarid, input.odqty, input.odprice);
      const row = await repo.updateLine(orid, odline, { ...input, odtot: f.odtot, odtotvat: f.odtotvat }, user);
      if (!row) throw new OrderNotFoundError(orid, odline);
      return { ...row, ardesc: await farticle.getArtDesc(row.odarid) };
    },

    async deleteLine(orid, odline, user) {
      const stored = await repo.findLine(orid, odline);
      if (!stored) throw new OrderNotFoundError(orid, odline);
      // ord-entry-ord101-c05: ODQTYLIV > 0 blocks; ODQTYLIV < 0 does not. Read from the table,
      // not a screen copy (CONTRACT_RISK).
      if (stored.odqtyliv > 0) throw new OrderOptionError("LINE_HAS_DELIVERY");
      await repo.deleteLine(orid, odline, user);
    },

    async deleteOrder(orid, user) {
      const order = await repo.findOrder(orid);
      if (!order) throw new OrderNotFoundError(orid);
      // s01chk option 4 (ord-maintain-ord200-c08): closed -> 36; any delivered line -> 37.
      // Tests are not exclusive in legacy; the first hit is reported here.
      if (order.ordatclo !== null) throw new OrderOptionError("CLOSED_ORDER");
      if (await repo.hasDeliveredLine(orid)) throw new OrderOptionError("ORDER_HAS_DELIVERIES");
      await repo.deleteOrder(orid, user);
    },

    async close(orid, user) {
      const order = await repo.findOrder(orid);
      if (!order) throw new OrderNotFoundError(orid);
      // Already closed -> generic 'Invalid Option' (SFLMSG 35), not the closed-order text (c06 as-is).
      if (order.ordatclo !== null) throw new OrderOptionError("INVALID_OPTION");
      const row = await repo.close(orid, user);
      if (!row) throw new OrderNotFoundError(orid);
      return row;
    },

    async deliver(orid, user) {
      const order = await repo.findOrder(orid);
      if (!order) throw new OrderNotFoundError(orid);
      // Already delivered -> 'Invalid Option'. Close stamps ORDATDEL, so deliver-after-close is
      // refused here too (c07 as-is).
      if (order.ordatdel !== null) throw new OrderOptionError("INVALID_OPTION");
      const result = await repo.deliver(orid, user);
      if (!result) throw new OrderNotFoundError(orid);
      return result;
    },

    async document(orid) {
      const order = await repo.findOrder(orid);
      if (!order) throw new OrderNotFoundError(orid); // legacy: %date(0) exception (c08); CONTRACT_RISK
      const detail = await toDetail(order);
      return renderOrderDocument({ order, customer: await repo.documentCustomer(order.orcuid), lines: detail.lines });
    },
  };
}

/** ODTOT = ODQTY x ODPRICE in 9P 2, computed in integer cents; null when it does not fit. */
export function lineTotal(odqty: number, odprice: number): number | null {
  const cents = odqty * Math.round(odprice * 100);
  if (Math.abs(cents) > TOTPRICE_MAX * 100) return null;
  return cents / 100;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Boundary parse of POST /api/orders (ORD100 confirm): customer + staged lines. */
export function parseOrderInput(raw: unknown): { input: OrderInput; errors: OrderError[] } {
  const src = asRecord(raw);
  const errors: OrderError[] = [];
  const orcuid = parseInt(src.orcuid, "orcuid", 99_999, errors, 0);
  if (orcuid === 0 && !errors.some((e) => e.field === "orcuid")) {
    // SltCustomer(0) returning 0 ends ORD100 before any screen (c01): nothing to confirm.
    errors.push({ code: "FIELD_INVALID", field: "orcuid", message: "orcuid must be a customer id (1-99999)" });
  }
  const lines: DraftLine[] = [];
  const rawLines = Array.isArray(src.lines) ? src.lines : src.lines === undefined ? [] : null;
  if (rawLines === null) {
    errors.push({ code: "FIELD_INVALID", field: "lines", message: "lines must be an array" });
  } else {
    rawLines.forEach((item, i) => {
      const l = asRecord(item);
      const field = `lines[${i}]`;
      const lineErrors: OrderError[] = [];
      const odarid = parseArid(l.odarid, lineErrors);
      const odline = parseInt(l.odline, "odline", ODLINE_MAX, lineErrors, i + 1);
      const odqty = parseInt(l.odqty, "odqty", QUANTITY_MAX, lineErrors, 0);
      const odprice = parseMoney(l.odprice, "odprice", UNITPRICE_MAX, lineErrors, 0);
      errors.push(...lineErrors.map((e) => ({ ...e, field: `${field}.${e.field}` })));
      lines.push({ odline, odarid, odqty, odprice });
    });
  }
  return { input: { orcuid, lines }, errors };
}

/** Boundary parse of PUT /api/orders/:id/lines/:line (ORD101 FMT02: DSQTY, DSQTYLIV, DSPRICE). */
export function parseLineInput(raw: unknown): { input: LineInput; errors: OrderError[] } {
  const src = asRecord(raw);
  const errors: OrderError[] = [];
  const input: LineInput = {
    odqty: parseInt(src.odqty, "odqty", QUANTITY_MAX, errors, 0),
    odqtyliv: parseInt(src.odqtyliv, "odqtyliv", QUANTITY_MAX, errors, 0),
    odprice: parseMoney(src.odprice, "odprice", UNITPRICE_MAX, errors, 0),
  };
  return { input, errors };
}

function asRecord(raw: unknown): Record<string, unknown> {
  return (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
}

/** ARID 6A: right-trimmed, no existence check (c14). Blank is accepted as-is (cancelled prompt still staged a line, c03). */
function parseArid(value: unknown, errors: OrderError[]): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    errors.push({ code: "FIELD_INVALID", field: "odarid", message: "odarid must be a string" });
    return "";
  }
  const v = value.replace(/\s+$/, "");
  if (v.length > ARID_LENGTH) {
    errors.push({ code: "FIELD_TOO_LONG", field: "odarid", message: `odarid is longer than ${ARID_LENGTH} characters` });
    return "";
  }
  return v;
}

/** Signed integer field (QUANTITY 5 0, ODLINE 5P 0, CUID 5P 0). Zero and negatives are accepted as-is (c03, c04). */
function parseInt(value: unknown, field: string, max: number, errors: OrderError[], dflt: number): number {
  if (value === undefined || value === null || value === "") return dflt;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isInteger(n) || Math.abs(n) > max) {
    errors.push({ code: "FIELD_INVALID", field, message: `${field} must be an integer with at most ${String(max).length} digits` });
    return dflt;
  }
  return n;
}

/** Packed decimal with two places (UNITPRICE 7P 2). */
function parseMoney(value: unknown, field: string, max: number, errors: OrderError[], dflt: number): number {
  if (value === undefined || value === null || value === "") return dflt;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isFinite(n) || Math.abs(n) > max || Math.abs(Math.round(n * 100) - n * 100) > 1e-6) {
    errors.push({ code: "FIELD_INVALID", field, message: `${field} must be a number with at most 2 decimals (7,2)` });
    return dflt;
  }
  return n;
}
