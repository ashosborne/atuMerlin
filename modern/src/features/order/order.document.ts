import type { CustomerRow } from "../customer/customer.types.js";
import type { LineDetail, OrderRow } from "./order.types.js";

/**
 * ORD500 / ORD500O.PRTF as a plain-text document (pack mapping rule PRTF/spool -> printable
 * artifact). Only the spool content is converted: PDF conversion (CVTSPLPDF, ord-print-ord500-c04)
 * is needs-SME and not invented, so no PDF, no `Custord<id>.pdf` name (and none of its 5-char
 * truncation), no PATH lookup.
 *
 * The page is emulated from the DDS SKIPB / SPACEB keywords so the source facts hold: 15 details
 * per page (`count > 14` tested before the increment, c01), footer + company block + order line
 * re-written on a page break but NOT the customer block, totals Net / VAT / Total with VAT =
 * TOTTOT - TOTNET of the STORED line totals, EDTCDE(2) printing zero as blank.
 * Line positions beyond "15 per page" are DDS-contract statements (page length is the printer
 * file default, assumed 66 here) — runtime-confirmable only on the box.
 */
export const PAGE_WIDTH = 90; // PAGESIZE(*N 90 *N)
export const PAGE_LENGTH = 66;
export const DETAILS_PER_PAGE = 15;

export interface DocumentCustomer
  extends Pick<CustomerRow, "custnm" | "culine1" | "culine2" | "culine3" | "cucoun" | "cuzip" | "cucity"> {}

export interface OrderDocumentInput {
  order: OrderRow;
  /** null = CUSTOME1 chain missed: the six customer lines print blank (c06). */
  customer: DocumentCustomer | null;
  lines: LineDetail[];
}

class Printer {
  readonly pages: string[][] = [];
  private page: string[] = [];
  private line = 0; // current line number on the page (1-based); 0 = top of a fresh page
  private positioned = false; // a SKIPB / SPACEB already placed the next print line

  /** SKIPB(n): position at absolute line n; a target at or above the current line ejects the page. */
  skipTo(n: number): void {
    if (this.line >= n) this.eject();
    this.line = n;
    this.positioned = true;
  }

  /** SPACEB(n): advance n lines before printing. */
  space(n: number): void {
    this.line += n;
    this.positioned = true;
  }

  /** Without a spacing keyword a line prints on the line after the previous one. */
  print(text: string): void {
    if (!this.positioned) this.line += 1;
    this.positioned = false;
    if (this.line > PAGE_LENGTH) {
      this.eject();
      this.line = 1;
    }
    while (this.page.length < this.line - 1) this.page.push("");
    this.page.push(text.replace(/\s+$/, ""));
  }

  eject(): void {
    if (this.page.length || this.pages.length === 0) this.pages.push(this.page);
    this.page = [];
    this.line = 0;
    this.positioned = false;
  }

  finish(): string[][] {
    this.eject();
    return this.pages;
  }
}

/** Compose one 90-column line from (column, text) pairs; columns are 1-based like DDS. */
function row(...parts: Array<[col: number, text: string]>): string {
  const buf: string[] = new Array<string>(PAGE_WIDTH).fill(" ");
  for (const [col, text] of parts) {
    for (let i = 0; i < text.length && col - 1 + i < PAGE_WIDTH; i++) buf[col - 1 + i] = text[i]!;
  }
  return buf.join("");
}

/** EDTCDE(Z): zero suppressed, right-adjusted in the field width. */
export function editZ(n: number, width: number): string {
  return (n === 0 ? "" : String(n)).padStart(width);
}

/** EDTCDE(2): thousands separators, two decimals, zero prints blank, right-adjusted. */
export function edit2(n: number, width: number): string {
  if (n === 0) return "".padStart(width);
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? `${s}-` : s).padStart(width);
}

const W_QTY = 5; // QUANTITY 5 0
const W_PRICE = 10; // UNITPRICE 7P 2 edited: 99,999.99
const W_TOT = 13; // TOTPRICE 9P 2 edited: 9,999,999.99

export function renderOrderDocument({ order, customer, lines }: OrderDocumentInput): string[][] {
  const p = new Printer();

  const header = () => {
    p.skipTo(5);
    p.print(row([3, "Company Sample"], [3 + 14 + 28, "Customer Order"]));
    p.space(1);
    p.print(row([3, "55, rue Adrastee"]));
    p.space(1);
    p.print(row([3, "F-74650 Chavanod"]));
  };

  const header2 = () => {
    const c = customer;
    p.space(1);
    p.print(row([41, "Customer"], [41 + 8 + 1, editZ(order.orcuid, 5)]));
    p.space(1);
    p.print(row([41, c?.custnm ?? ""]));
    p.space(1);
    p.print(row([41, c?.culine1 ?? ""]));
    p.space(1);
    p.print(row([41, c?.culine2 ?? ""]));
    p.space(1);
    p.print(row([41, c?.culine3 ?? ""]));
    p.space(1);
    // CUCOUN is the 2-char code (no COUNTRY lookup, c01), then CUZIP (10) and CUCITY.
    p.print(row([41, (c?.cucoun ?? "").padEnd(2)], [44, (c?.cuzip ?? "").padEnd(10)], [55, c?.cucity ?? ""]));
  };

  const header3 = () => {
    p.skipTo(18);
    p.space(1);
    // 'Order Number' +2 ORYEAR +0 '/' +0 ORID(EDTCDE Z, 6 wide) -> "2016/   123"; DATORD DATFMT(*JOB) -> ISO here.
    const orderNo = `${String(order.oryear).padStart(4, "0")}/${editZ(order.orid, 6)}`;
    p.print(row([3, "Order Number"], [3 + 12 + 2, orderNo], [66, "Order Date"], [79, order.ordate]));
    p.space(2);
    p.print(row([3, "Line"], [3 + 4 + 3, "Article"], [3 + 4 + 3 + 7 + 34, "Quantity"], [3 + 4 + 3 + 7 + 34 + 8 + 2, "U.Price"]));
  };

  const detail = (l: LineDetail) => {
    p.space(1);
    const qtyCol = 3 + 5 + 46;
    const priceCol = qtyCol + W_QTY + 2;
    const totCol = priceCol + W_PRICE + 2;
    p.print(row([3, editZ(l.odline, 5)], [qtyCol, editZ(l.odqty, W_QTY)], [priceCol, edit2(l.odprice, W_PRICE)], [totCol, edit2(l.odtot, W_TOT)]));
    p.space(1);
    // ODQTYLIV is not printed: the document does not distinguish delivered lines (c01).
    p.print(row([3, l.odarid.padEnd(6)], [10, l.ardesc.padEnd(50)], [10 + 50 + 12, edit2(l.odtotvat, W_TOT)]));
  };

  const footer = () => {
    p.skipTo(58);
    p.space(2);
    p.print(row([37, "This is the footer"], [37 + 18 + 35, "."]));
  };

  header();
  header2();
  header3();

  let count = 0;
  let totnet = 0;
  let tottot = 0;
  for (const l of lines) {
    if (count > DETAILS_PER_PAGE - 1) {
      footer();
      header();
      header3();
      count = 0;
    }
    count += 1;
    totnet = Math.round((totnet + l.odtot) * 100) / 100;
    tottot = Math.round((tottot + l.odtotvat) * 100) / 100;
    detail(l);
  }

  // TOTVAT is derived, never summed: a silent-zero line (ODTOTVAT = ODTOT) leaves VAT blank.
  const totvat = Math.round((tottot - totnet) * 100) / 100;
  p.skipTo(52);
  p.space(2);
  p.print(row([72, "============"]));
  p.space(1);
  p.print(row([66, "Net"], [66 + 3 + 3, edit2(totnet, W_TOT)]));
  p.space(1);
  p.print(row([66, "VAT"], [66 + 3 + 3, edit2(totvat, W_TOT)]));
  p.space(1);
  p.print(row([64, "Total"], [64 + 5 + 3, edit2(tottot, W_TOT)]));
  footer();

  return p.finish();
}

/** Pages joined with a form feed, as a spooled *SCS file would be viewed. */
export function documentText(pages: string[][]): string {
  return pages.map((lines) => lines.join("\n")).join("\n\f\n") + "\n";
}
