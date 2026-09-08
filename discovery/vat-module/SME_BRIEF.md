# SME_BRIEF — vat-module (Phase A, awaiting human bind)

## What was found

`FVAT` (`VAT300`, 85 lines): `ClcVAT` = net × rate / 100 half-adjusted to 2 dp; `GetVATRate`; `GetVATDesc` (unused); `ExistVATRate` (unused); cached chain on `VATDEF`. 10 candidates, all `observed-in-code`.

Two facts matter:

- **Unknown VAT code → zero VAT, silently** (c02). No caller checks `ExistVATRate`. An article with a bad `ARVATCD` gets `ODTOTVAT = ODTOT` on every order line.
- **No rate maintenance exists** (c07). `VATDEF` is static reference data in this sample.

This slice is small but load-bearing: `ord-entry-ord100-c03`/`c04` (documented) and `ord-entry-ord101-c03` (candidate) compute line VAT through it. It is **not** part of the CUS vertical (`atu-merlin-ts-cus-v1`) and this radar does not propose widening that pack.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Where does the rule live in the target? | Recommend a single pure function (c01 + c02) shared by order and article code, seeded from `VATDEF`. |
| Cache staleness (c06) | Runtime property; `needs-SME` only if rates change intra-day. |
| `FAVATCD` | Family default VAT code is never read (fam-maintain c12); do not import it into the VAT rule. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c08
- **thin / fold:** c03, c04, c05, c09, c10
- **needs-SME:** c06, c07

## Open questions

1. Should an unknown VAT code be an error rather than 0 (c02)?
2. How are VAT rates maintained on the box (c07)?
3. Bind this slice alongside the ORD line-maintenance slices (`ord-entry-ord101`) so the VAT rule is documented once?

Did not: bind, deepen Phase B, generate tests, or convert.
