# vat-module-c03 — GetVATRate / GetVATDesc getters (GetVATDesc unused)

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Two field getters over the cached `VATDEF` read: `GetVATRate(code)` returns `VATRATE` (`4P 2`, a percentage such as `20.00`) and `GetVATDesc(code)` returns `VATDESC` (`20A`). `GetVATRate` is called only to **display** the rate on the order-line panels of `ORD100` and `ORD101`, immediately after `ClcVAT` for the same code (so it never causes a second read). `GetVATDesc` has **no caller** anywhere in `ATU_SRC`; the article maintenance screen that has fields laid out for the rate and description never fills them.

## Entrypoints

- `FVAT` exports `GETVATRATE`, `GETVATDESC` — `ATU_SRC/QSRVSRC/FVAT.BND:7-8`
- `GetVATRate` — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:19-26`; prototype `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8`
- `GetVATDesc` — `VAT300.RPGLE:28-35`; prototype `VAT.RPGLEINC:12-13`
- Callers of `GetVATRate` (call sites only): `ORD100.PGM.RPGLE:269` (`vatRate = GetVatRate(GetArtVatCode(odarid))`), `ORD101.PGM.RPGLE:226`
- Callers of `GetVATDesc`: none (structural grep of `ATU_SRC/**`)

## Inputs / outputs / observables

- In: `P_VATCODE` `1A` by value. — `VAT300.RPGLE:21,30`
- Out: `GetVATRate → VATRATE` (`SAMREF VATRATE 4 2`, "VAT RATE %"); `GetVATDesc → VATDESC` (`20`). Both return whatever the buffer holds — a real row, or zeros/blanks after a miss (`c02`). — `VAT300.RPGLE:24,33`, `ATU_SRC/QDDSSRC/VATDEF.PF:7-8`, `ATU_SRC/QDDSSRC/SAMREF.PF:61`
- Observable: order-line panel field `VATRATE` ("VAT rate . . . :", `REFFLD(FVAT/VATRATE)`) in `ORD100D` FMT02 and `ORD101D` FMT02. Display only — the rate is not stored on the order line (`c01`). — `ATU_SRC/QDDSSRC/ORD100D.DSPF:120-121`, `ATU_SRC/QDDSSRC/ORD101D.DSPF:125-126`

## Behaviour as implemented

1. `chainVATDEF(P_VATCODE)` — cache-aware read (`c05`). — `VAT300.RPGLE:23,32`
2. `return VATRATE;` / `return VATDESC;` — the raw file field. — `VAT300.RPGLE:24,33`

In both callers the sequence is `vat = CLCVat(GetArtVatCode(odarid):odtot); odtotvat = odtot + vat; vatRate = GetVatRate(GetArtVatCode(odarid));` — the second `FVAT` call finds the same code in the buffer and does no I/O; `GetArtVatCode` is nevertheless called twice (`c08`). — `ORD100.PGM.RPGLE:267-269`, `ORD101.PGM.RPGLE:224-226`

## Validation rules found in code

None. Neither getter consults `VATDEL` (`c04`) or `%found`.

## Edge cases found in code

- **Unknown code → `0.00` / blanks** (`c02`).
- **`GetVATDesc` is dead code in this tree.** `ART200D` FMT02 declares output fields `VATRATE` (`REFFLD(FVAT/VATRATE)`, `EDTCDE(2)`, followed by a `%` literal), `VATDESC` (`REFFLD(FVAT/VATDESC)`) and `WITHVAT` (`REFFLD(FARTI/ARSALEPR)`) next to the `ARVATCD` input, but `ART200` does not `/COPY VAT.RPGLEINC` and never assigns any of the three; they are written to the screen with their initial values (zero balance suppressed by edit code 2, blank description). — `ATU_SRC/QDDSSRC/ART200D.DSPF:107-115`, `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:14` (only `FAMILLY.RPGLEINC` copied), structural grep
- **Rate shown is the cached rate**, not necessarily the current `VATDEF` row (`c06`).
- **Only the rate is ever displayed to a user; the description never is** — `VATDESC` has no reader other than the unused getter. — structural grep of `VATDESC`

## Dependencies

- `VATDEF.PF` fields `VATRATE`, `VATDESC`. — `VATDEF.PF:7-8`
- `c05` (open / cache), `c02` (miss), `c08` (code source).
- `ORD100D` / `ORD101D` / `ART200D` cited as display surfaces only; their slices are not deepened here.

## Assumptions / unknowns

- Why `ART200` FMT02 carries dead VAT display fields is not answerable from source (screen designed for a lookup that was never wired, or wiring removed). Recorded for the SME.

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:19-35,61-74` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-13` · `ATU_SRC/QSRVSRC/FVAT.BND:7-8` · `ATU_SRC/QDDSSRC/VATDEF.PF:7-8` · `ATU_SRC/QDDSSRC/SAMREF.PF:61` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267-269` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:224-226` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:120-121` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:125-126` · `ATU_SRC/QDDSSRC/ART200D.DSPF:107-115` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:14`
