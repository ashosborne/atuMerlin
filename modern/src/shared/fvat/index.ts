import type { Db } from "../../db/pool.js";

/**
 * FVAT dependency surface used by the ORD vertical (VAT300 GetVATRate / CLCVat). The
 * vat-module slice is NOT converted here; this is read-only access to the VATDEF reference
 * table the ORD cards depend on (ord-entry-ord100-c03, ord-entry-ord101-c03).
 *
 * As-is kept: an unknown VAT code chains nothing, VATRATE reads 0 from the cleared buffer and
 * CLCVat returns 0 with no message ("VAT silent zero", planted defect — do not fix).
 */
export interface FVat {
  /** VAT300.GetVATRate: VATRATE (4 2, percent), or 0 when the code is unknown. */
  getVatRate(vatcode: string): Promise<number>;
  /** VAT300.CLCVat: %dech((net * rate) / 100 : 9 : 2). Unknown code -> 0. */
  clcVat(vatcode: string, net: number): Promise<number>;
}

export function createFVat(db: Db): FVat {
  async function getVatRate(vatcode: string): Promise<number> {
    const r = await db.query<{ vatrate: number }>("SELECT vatrate FROM vatdef WHERE vatcode = $1", [vatcode]);
    return r.rows[0]?.vatrate ?? 0;
  }
  return {
    getVatRate,
    async clcVat(vatcode, net) {
      return clcVatWithRate(net, await getVatRate(vatcode));
    },
  };
}

/**
 * The CLCVat arithmetic on its own, in integer cents so that 9 2 x 4 2 never goes through a
 * binary float. %dech is half-adjust (round half away from zero).
 */
export function clcVatWithRate(net: number, ratePercent: number): number {
  const netCents = Math.round(net * 100);
  const rateHundredths = Math.round(ratePercent * 100);
  // (net * rate) / 100 in currency units == netCents * rateHundredths / 1e4 in cents
  const raw = (netCents * rateHundredths) / 10_000;
  const cents = Math.sign(raw) * Math.floor(Math.abs(raw) + 0.5);
  return cents / 100;
}
