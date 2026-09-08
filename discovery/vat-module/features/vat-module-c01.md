# vat-module-c01 — ClcVAT arithmetic (net × rate / 100, half-adjust to 2 dp)

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ClcVAT(code, net)` returns the **VAT amount** (not the gross) for a net amount: it resolves the rate for the 1-character VAT code through the cached `VATDEF` read (`c05`), computes `(net × VATRATE) / 100` into an `11P 4` work field, and returns that value **half-adjusted to 2 decimals** as `9P 2`. Both parameters are passed by value. This is the single VAT rule in the estate; every order line total with VAT (`DETORD.ODTOTVAT`) and the article "with VAT" display go through it.

## Entrypoints

- `FVAT` export `CLCVAT` → procedure `ClcVAT` in module `VAT300` — `ATU_SRC/QSRVSRC/FVAT.BND:5`, `ATU_SRC/QRPGLESRC/VAT300.RPGLE:38-49`
- Prototype `CLCVat(VATCODE 1 value : NetValue 9 2 value) → 9 2` — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:22-24`
- Callers in `ATU_SRC` (call sites only): `ORD100` line prepare and check — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267,294`; `ORD101` line prepare and check — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:224,259`; `ART250` article detail — `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:154`

## Inputs / outputs / observables

- In: `P_VATCODE` `1` (character, by value); `Net` `9 2` (packed, by value). Callers pass `ODTOT` (`TOTPRICE` `9P 2`) or `ARSALEPR` (`UNITPRICE` `7P 2`, widened at the call). — `VAT300.RPGLE:40-41`, `ATU_SRC/QDDSSRC/SAMREF.PF:50,53`, `ATU_SRC/QDDSSRC/DETORD.PF:17`, `ATU_SRC/QDDSSRC/ARTICLE.PF:8`
- Out: return value `9 2` = `%dech(tot : 9 : 2)`. — `VAT300.RPGLE:39,47`
- Observable: `ORD100`/`ORD101` add it to the net (`odtotvat = odtot + vat`) and show both `VAT` and `ODTOTVAT` on the line panel; `ORD100` stores `ODTOTVAT` on the `DETORD` row at confirm. `ART250` shows the raw return value as `VATINCL`. — `ORD100.PGM.RPGLE:267-268,294-295`, `ATU_SRC/QDDSSRC/ORD100D.DSPF:117-119`, `ORD101.PGM.RPGLE:224-225,259-260`, `ATU_SRC/QDDSSRC/ORD101D.DSPF:122-124`, `ATU_SRC/QDDSSRC/ART250D.DSPF:63`

## Behaviour as implemented

1. `chainVATDEF(P_VATCODE)` — lazy open of `VATDEF`, read skipped when the code equals the code already in the buffer (`c05`, `c06`); on a miss the buffer is cleared so `VATRATE = 0` (`c02`). — `VAT300.RPGLE:45,61-74`
2. `tot = (net * vatrate) / 100;` — `tot` is `11 4` (packed, 7 integer digits, 4 decimals). The `eval` has no `(h)` extender, so the assignment **truncates** the quotient to 4 decimals. — `VAT300.RPGLE:43,46`
3. `return %dech(tot : 9 : 2);` — half-adjust (round half away from zero) to 2 decimals, returned as `9 2`. — `VAT300.RPGLE:47`

Derived (analysis of the source, not a runtime observation): `net` has 2 decimals and `VATRATE` 2, so the exact quotient has at most 6 decimals; truncating to 4 decimals cannot move a value across a `.xx5` boundary, so the two-step "truncate to 4 dp, then half-adjust to 2 dp" yields the same result as half-adjusting the exact quotient to 2 dp. The rule a target must reproduce is therefore `round_half_away_from_zero(net × rate / 100, 2)`.

## Validation rules found in code

None. No check that the code exists (`ExistVATRate` is never called, `c04`), that the rate is non-zero, or that `net` is non-negative.

## Edge cases found in code

- **Unknown or blank code → 0** (rate 0 after `clear *all FVAT`; see `c02`, and the blank-code path in `c05`). — `VAT300.RPGLE:68-71`
- **Soft-deleted code still computes** — `ClcVAT` never reads `VATDEL` (`c04`). — `VAT300.RPGLE:45-47` vs `:57`
- **No overflow path.** `|net| ≤ 9,999,999.99` and `VATRATE ≤ 99.99` give `|tot| < 10,000,000`, which fits `11 4`; the `9 2` result fits by construction. — `VAT300.RPGLE:39-43`, `SAMREF.PF:50,61`
- **Sign.** A negative `net` yields a negative VAT amount; truncation (step 2) and `%dech` (step 3) are both symmetric about zero. Whether callers can produce a negative `ODTOT` is a property of the order screens, not of this rule.
- **Called twice per line in `ORD100`/`ORD101`** (prepare and check); the second call hits the buffer cache. — `ORD100.PGM.RPGLE:267,294`, `ORD101.PGM.RPGLE:224,259`
- **Rate is not stored with the line.** `DETORD` carries `ODTOT` and `ODTOTVAT` only; the VAT amount is recoverable as `ODTOTVAT − ODTOT`, the code and rate are not. A later rate change does not alter stored lines. — `DETORD.PF:17-20`

## Dependencies

- `VATDEF.PF` — `VATRATE` (`SAMREF` `VATRATE 4 2`, "VAT RATE %"), key `VATCODE` (`1`). — `ATU_SRC/QDDSSRC/VATDEF.PF:5-7,16`, `SAMREF.PF:58,61`
- `c05` (open / cache), `c02` (miss path), `c08` (how callers obtain the code).
- Consumers of the stored result (pointers, not deepened): `ORDERCUS.VIEW` `TOTVAL = SUM(ODTOTVAT)` — `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:17`; `ART801` `CUCREDIT = SUM(ODTOTVAT)` — `ATU_SRC/QSQLSRC/ART801.SQLPRC:29`.

## Assumptions / unknowns

- Default RPG intermediate precision for `(net * vatrate) / 100` is assumed (no `EXPROPTS` on the H-spec); with these operand sizes the quotient is exact before assignment.
- `SME_BRIEF` question: should an unknown code be an error in the target rather than 0 (`c02`)?

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:38-49,61-74` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:22-24` · `ATU_SRC/QSRVSRC/FVAT.BND:5` · `ATU_SRC/QDDSSRC/VATDEF.PF:5-7,16` · `ATU_SRC/QDDSSRC/SAMREF.PF:50,53,58,61` · `ATU_SRC/QDDSSRC/DETORD.PF:17-20` · `ATU_SRC/QDDSSRC/ARTICLE.PF:8` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267-268,294-295` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:224-225,259-260` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:154` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:117-119` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:122-124` · `ATU_SRC/QDDSSRC/ART250D.DSPF:63` · `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:17` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:29`
