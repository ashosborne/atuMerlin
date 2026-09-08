# vat-module-c08 — VAT code comes from the article via GetArtVatCode (two srvpgm hops)

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The VAT code lives on the article (`ARTICLE.ARVATCD`, `REFFLD(VATCODE)`, 1 character). `FVAT` never receives an article id: the order programs call `GetArtVatCode(odarid)` (`FARTICLE`, module `ART300`, cached chain on `ARTICLE1`) and pass the result straight into `CLCVat` / `GetVatRate` — two service-program hops per call, and `ORD100`/`ORD101` make the round trip **twice** per line prepare (once for the amount, once for the displayed rate). `ART250` is the exception: it has already read the article row, so it passes `ARVATCD` directly (one hop). **Correction to the Phase A summary** ("every caller does `CLCVat(GetArtVatCode(arid), net)`"): two of the three callers do; `ART250` does not.

## Entrypoints

- `GetArtVatCode` — `ATU_SRC/QRPGLESRC/ART300.RPGLE:83-91` (returns `like(arvatcd)` after `chainARTICLE1(P_ARID)`); prototype `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:39`; export `ATU_SRC/QSRVSRC/FARTICLE.BND:12`
- `ORD100` line prepare `vat = CLCVat(GetArtVatCode(odarid):odtot); … vatRate = GetVatRate(GetArtVatCode(odarid));` and line check `:294` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267-269,294`
- `ORD101` line prepare `:224-226` and line check `:259` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:224-226,259`
- `ART250` detail prepare `VATINCL = CLCVat(ARVATCD:ARSALEPR);` after `chain id article1` — `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:120,154`

## Inputs / outputs / observables

- In (to `FVAT`): the 1-character code returned by `GetArtVatCode` or read from the article record; the net amount (`ODTOT` or `ARSALEPR`). — `ORD100.PGM.RPGLE:267`, `ART250.PGM.SQLRPGLE:154`
- Out: VAT amount (`c01`) and rate (`c03`).
- Observable: order-line panel `VAT`, `ODTOTVAT`, `VATRATE`; article detail `VATINCL`. `DETORD` stores only `ODTOT`/`ODTOTVAT` — the code is never copied to the order line. — `ATU_SRC/QDDSSRC/ORD100D.DSPF:117-120`, `ATU_SRC/QDDSSRC/ART250D.DSPF:63`, `ATU_SRC/QDDSSRC/DETORD.PF:5-20`

## Behaviour as implemented

1. `GetArtVatCode(P_ARID 6A value)`: `chainARTICLE1(P_ARID); return ARvatcd;` — same lazy-open / last-key-cache pattern as `FVAT` (`c05`), on `ARTICLE1`. Unknown article → cleared buffer → blank code. — `ART300.RPGLE:83-91`
2. `FVAT` resolves the code (`c05`), computes (`c01`) or returns the rate (`c03`).
3. `ORD100`/`ORD101` repeat step 1 for the rate display; both inner calls hit the `ART300` cache, the second `FVAT` call hits the `VAT300` cache. — `ORD100.PGM.RPGLE:267,269`, `ORD101.PGM.RPGLE:224,226`
4. `ORD100` opens **no** `ARTICLE` file itself (`ord-entry-ord100` documented); the code is reachable only through `FARTICLE`. `ORD101` and `ART250` each read `ARTICLE1` for other reasons; `ART250` uses its own copy of `ARVATCD`, `ORD101` still goes through `GetArtVatCode`. — `ORD100.PGM.RPGLE:10-12`, `ORD101.PGM.RPGLE:8-9`, `ART250.PGM.SQLRPGLE:10,120`

## Validation rules found in code

None. Neither hop checks that the article exists or that the code is known; a missing article degrades to a blank code and zero VAT (`c02`, `c05`).

## Edge cases found in code

- **Blank / unknown article id** (`GetArtVatCode` miss) → blank code → `ClcVAT` never reads `VATDEF` (`c05`) → VAT `0`, rate `.00`. — `ART300.RPGLE:87-89`, `VAT300.RPGLE:68`
- **Article changed between the two `GetArtVatCode` calls**: not possible within one `ORD100` subroutine, but the two caches (`ART300`, `VAT300`) can be stale independently (`c06`).
- **`ART250` "with VAT" shows the VAT amount, not the gross.** `VATINCL` (`REFFLD(FARTI/ARSALEPR)`, `7P 2`) receives the `ClcVAT` return value under the label `with VAT . . . . :`; `ORD100`/`ORD101` by contrast add the amount to the net. Pointer only — `ART250` belongs to `art-interactive` (unbound); recorded here because it is the only caller that treats the `ClcVAT` result as a gross. — `ART250.PGM.SQLRPGLE:154`, `ART250D.DSPF:50,63`, `ORD100.PGM.RPGLE:267-268`
- **`ART250` result narrowing.** `ClcVAT` returns `9 2`, `VATINCL` is `7 2`; with `ARSALEPR ≤ 99,999.99` and rate `≤ 99.99` the VAT fits, so no truncation is reachable. — `ATU_SRC/QDDSSRC/SAMREF.PF:53,61`
- **The family default (`FAVATCD`) is not part of the chain**: no fallback from a blank `ARVATCD` to the family's code (fam-maintain `c12`, pointer). — `ATU_SRC/QDDSSRC/FAMILLY.PF:9-10`

## Dependencies

- `FARTICLE` service program / `ART300` module (`art-modules` slice, unbound — cited as the provider of `GetArtVatCode` only). — `FARTICLE.BND:12`, `ART300.RPGLE:83-91`
- `ARTICLE.PF` `ARVATCD REFFLD(VATCODE)`; `ARTICLE1.LF`. — `ATU_SRC/QDDSSRC/ARTICLE.PF:32`
- `SAMPLE.BNDDIR` (both `FARTICLE` and `FVAT` resolved through it) — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:11,14`
- `c01`, `c02`, `c03`, `c05`.

## Assumptions / unknowns

- None specific to this card beyond the caller slices' own questions. The `ART250` label/value mismatch is left for the `art-interactive` bind, not decided here.

## Evidence

`ATU_SRC/QRPGLESRC/ART300.RPGLE:83-91` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:39` · `ATU_SRC/QSRVSRC/FARTICLE.BND:12` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-12,267-269,294` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:8-9,224-226,259` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:10,120,154` · `ATU_SRC/QDDSSRC/ARTICLE.PF:32` · `ATU_SRC/QDDSSRC/ART250D.DSPF:50,60,63` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:117-120` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/SAMREF.PF:53,61` · `ATU_SRC/QDDSSRC/FAMILLY.PF:9-10` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:11,14` · `ATU_SRC/QRPGLESRC/VAT300.RPGLE:68`
