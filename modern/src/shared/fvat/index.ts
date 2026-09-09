import type { Db } from "../../db/pool.js";

/**
 * FVAT service program (module VAT300) as a shared module — pack atu-merlin-ts-vat-v1@1,
 * mapping rule "RPGLE service program FVAT -> TS shared module". Cards vat-module-c01 .. c10.
 * The four binder exports (c09) are the four methods below; `closeVATDEF` was never exported
 * (c05) and has no equivalent here. ORD callers already consume this module (c08) and are not
 * rewritten by this pack.
 *
 * Kept as-is (planted defects and known_risks, not fixed here — needs-SME in SME_BRIEF.md):
 *  - c02 VAT silent zero: an unknown code leaves the cleared buffer, so the rate is 0, the
 *    description blank and ClcVAT returns 0 with no message.
 *  - c04 ExistVATRate is the only reader of VATDEL; ClcVAT / GetVATRate / GetVATDesc ignore it,
 *    so a soft-deleted ('X') rate is still applied.
 *  - c05 a blank code never reads VATDEF (the buffer starts and clears blank), even if a
 *    blank-keyed row exists.
 *
 * Deliberately not reproduced:
 *  - TODO(vat-module-c06): last-key cache / activation-group lifetime. The server is stateless
 *    per request; every call reads the table, so a changed VATDEF row is seen at once. Whether
 *    rates change intra-day is needs-SME.
 *  - TODO(vat-module-c07): no maintenance path for VATDEF exists in the legacy tree and none is
 *    invented here (seed configuration vs maintenance screen is a room decision).
 */

/** VATDEF record format FVAT, the fields the exports read. */
export interface VatDefRow {
  /** VATRATE 4P 2, a percentage such as 20.00. */
  vatrate: number;
  /** VATDESC 20A. */
  vatdesc: string;
  /** VATDEL (DLCODE 1A): 'X' = soft-deleted. */
  vatdel: string;
}

/** Buffer after `clear *all FVAT` followed by a failed CHAIN, or before any read (c02, c05). */
const CLEARED: VatDefRow = { vatrate: 0, vatdesc: "", vatdel: " " };

export interface FVat {
  /** VAT300.GetVATRate: VATRATE (4 2, percent), or 0 when the code is unknown (c03, c02). */
  getVatRate(vatcode: string): Promise<number>;
  /** VAT300.GetVATDesc: VATDESC (20A), or blank when the code is unknown (c03). No legacy caller. */
  getVatDesc(vatcode: string): Promise<string>;
  /** VAT300.ClcVAT: %dech((net * rate) / 100 : 9 : 2) — the VAT amount, not the gross (c01). Unknown code -> 0 (c02). */
  clcVat(vatcode: string, net: number): Promise<number>;
  /** VAT300.ExistVATRate: %found(VATDEF) and VATDEL <> 'X' (c04). No legacy caller. */
  existVatRate(vatcode: string): Promise<boolean>;
}

export function createFVat(db: Db): FVat {
  // chainVATDEF (c05) without the cache: one keyed read per call, blank code never reads.
  async function chain(vatcode: string): Promise<{ found: boolean; row: VatDefRow }> {
    const code = normaliseVatCode(vatcode);
    if (code === " ") return { found: false, row: CLEARED };
    const r = await db.query<VatDefRow>("SELECT vatrate, vatdesc, vatdel FROM vatdef WHERE vatcode = $1", [code]);
    const row = r.rows[0];
    return row ? { found: true, row } : { found: false, row: CLEARED };
  }

  return {
    async getVatRate(vatcode) {
      return (await chain(vatcode)).row.vatrate;
    },
    async getVatDesc(vatcode) {
      return (await chain(vatcode)).row.vatdesc;
    },
    async clcVat(vatcode, net) {
      return clcVatWithRate(net, (await chain(vatcode)).row.vatrate);
    },
    async existVatRate(vatcode) {
      const { found, row } = await chain(vatcode);
      return found && row.vatdel !== "X";
    },
  };
}

/**
 * The 1A by-value parameter of every export (c10 effective contract): a longer value is cut to
 * its first character, an empty one is the blank code. Comparison stays case-sensitive as on
 * the keyed CHAIN.
 */
export function normaliseVatCode(vatcode: string): string {
  const c = vatcode.slice(0, 1);
  return c === "" ? " " : c;
}

/**
 * The ClcVAT arithmetic on its own (c01): tot(11P 4) = (net * rate) / 100 truncated, then
 * %dech(tot : 9 : 2) half-adjusted (round half away from zero). Because net and rate carry two
 * decimals each the exact quotient has at most six, so truncating to four first can never move
 * a value across a .xx5 boundary; the rule is round_half_away_from_zero(net * rate / 100, 2).
 * Computed in integer hundredths so 9 2 x 4 2 never goes through a binary float.
 */
export function clcVatWithRate(net: number, ratePercent: number): number {
  const netCents = Math.round(net * 100);
  const rateHundredths = Math.round(ratePercent * 100);
  // (net * rate) / 100 in currency units == netCents * rateHundredths / 10_000 in cents
  const raw = netCents * rateHundredths;
  const cents = Math.sign(raw) * Math.floor((Math.abs(raw) + 5_000) / 10_000);
  return cents === 0 ? 0 : cents / 100;
}
