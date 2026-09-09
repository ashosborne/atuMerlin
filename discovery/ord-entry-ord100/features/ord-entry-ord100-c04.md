# ord-entry-ord100-c04 — Edit staged line and recompute totals

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `2` on a list row reopens that row from the staging file (`chain` by `ODLINE`) in `FMT02`. Quantity and unit price are the only input fields; the article is fixed. Enter recomputes `ODTOT = qty × price`, VAT and `ODTOTVAT`; if any field was modified (record-level `CHANGE(27)`) the screen is redisplayed with the new figures and **not** saved, Enter again (no modification) updates the staged row and refreshes the subfile row. The running totals at the foot of the list are **not** adjusted by an edit — they stay as loaded until `F5` or the next add reloads the list.

**Correction to Phase A:** there is no "F27". Indicator 27 is the `CHANGE(27)` response indicator of `FMT02`; the "redisplay without saving" happens on Enter after a field was modified.

## Entrypoints

- Option `2` on `SFL01` → `s01chk` (valid) → `s01act` `when opt01 = 2` → `panel = 2; step02 = prp` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:156-185,214-220`
- `S02prp` non-create branch `chain (line) tmpDetord` — `ORD100.PGM.RPGLE:263-265`; common tail `:266-270`
- `S02chk` / `S02act` — `ORD100.PGM.RPGLE:291-313`
- `FMT02` fields: `ODQTY` B, `ODPRICE` B, all others O; `CHANGE(27)` — `ATU_SRC/QDDSSRC/ORD100D.DSPF:91,114-127`

## Inputs / outputs / observables

- In: `OPT01 = 2` (2Y 0B) and the row's `LINE` from the subfile record; typed `ODQTY` / `ODPRICE`. — `ORD100D.DSPF:15,19`
- Out: `update tmprec` with recomputed `ODTOT`, `ODTOTVAT` (and any other field values currently in the buffer); `update sfl01` for the same RRN with `OPT01 = 0` and the new `ODQTY`, `ODPRICE`, `ODTOT`. — `ORD100.PGM.RPGLE:306-308`
- Observable: the list row shows the new figures; `TOT` / `TOTVAT` in `KEY01` are unchanged until a reload. — `ORD100D.DSPF:85-87`

## Behaviour as implemented

1. `s01chk` validates every changed row (see `c06`); `s01act` reads the first changed row (`readc`) and, for `opt01 = 2`, switches to `panel = 2` leaving `step01 = act`. — `ORD100.PGM.RPGLE:214-220`
2. `S02prp`: `create` is off (indicator 06 was returned off by the last `CTL01` input), so `chain (line) tmpDetord` — partial key on `ODLINE`, the first key field of `DETORD`. No `%found` test. — `ORD100.PGM.RPGLE:263-265`, `ATU_SRC/QDDSSRC/DETORD.PF:21-23`
3. Common tail fills `ARTDESC`, `VAT`, `ODTOTVAT`, `VATRATE`; `exfmt fmt02`. — `ORD100.PGM.RPGLE:266-270,274`
4. Enter → `S02chk`: `odtot = odqty * odprice; vat = CLCVat(GetArtVatCode(odarid) : odtot); odtotvat = odtot + vat`. — `ORD100.PGM.RPGLE:291-296`
5. `S02act`: `change` on → `step02 = dsp` (redisplay only). Off → `update tmprec; opt01 = 0; update sfl01; step01 = dsp; panel = 1`. — `ORD100.PGM.RPGLE:298-313`
6. Back on `panel = 1`, `step01 = dsp` → `write key01; exfmt ctl01` — the list is **not** reloaded. — `ORD100.PGM.RPGLE:126-136`
7. `F3` / `F12` on `FMT02` → `panel = 1` with `step01 = act` → `s01act` continues with the next changed row (or `step01 = dsp` at end). Nothing is saved for the row being edited. — `ORD100.PGM.RPGLE:278-285,214-217`

## Validation rules found in code

None on the values: zero or negative quantity/price are accepted; `odtot` overflow (> 9,999,999.99) is an unmonitored size exception (`c03`). Option validity (`0`, `2`, `4` only) is checked in `s01chk` (`c06`).

## Edge cases found in code

- **Stale running totals.** `tot` / `totvat` are only computed in `s01lod` (`c05` adjusts them on delete); after an edit `step01 = dsp` skips the reload, so the footer totals do not reflect the edited line until `F5` (`refresh → prp`) or the next add (`write tmprec; step01 = prp`). — `ORD100.PGM.RPGLE:104-105,114-115,146-147,304,309`
- **Option `2` on a deleted row.** After option `4` the row stays in the subfile with `LINE` still shown (`c05`). Typing `2` on it chains a key that no longer exists; with no `%found` test the screen shows the blank buffer left by the delete, and Enter performs `update tmprec` without a prior successful read → RPG I/O exception (unmonitored; runtime, not confirmed). — `ORD100.PGM.RPGLE:221-231,264,306`
- **Several options in one Enter.** `s01chk` re-marks every changed row (`SFLNXTCHG`); `s01act` processes them one `readc` per cycle pass in RRN order. An option `2` interrupts the pass (`panel = 2`); when it returns with `step01 = dsp` the remaining marked rows are picked up by the next Enter. Option `4`s are processed back-to-back without redisplay (`step01` stays `act`). — `ORD100.PGM.RPGLE:157,159-184,214-232`
- **Abandoned edit leaves the `2` visible.** `F3`/`F12` from the edit screen do not rewrite the subfile row; the `2` stays on screen but the row was already consumed by `readc`, so it is not re-processed unless retyped (READC semantics; runtime, not confirmed).
- **`VATRATE` not recomputed** in `S02chk` (harmless — the article cannot change on this screen). — `ORD100.PGM.RPGLE:269,291-296`
- The edit screen carries the same fixed title "Add a customer Order Line" and blank `MODE` (`c03`).

## Dependencies

- `FVAT` `CLCVat` / `GetVATRate`, `FARTICLE` `GetArtVatCode` / `GetArtDesc` — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8,22-24`, `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8,39-40`
- Staging file `TMPDETORD` (`c02`), key `ODLINE` — `DETORD.PF:21`

## Assumptions / unknowns

- Whether the stale footer totals after an edit are noticed / accepted by users today (as-is; for the SME).
- No re-pricing rule exists in code; the typed price wins.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:104-105,114-115,126-136,146-147,156-185,214-232,263-270,274,278-313` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:15,19,85-87,91,114-127` · `ATU_SRC/QDDSSRC/DETORD.PF:21-23` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8,22-24` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8,39-40`
