# ord-entry-ord100-c03 — Add order line with article prompt and default pricing

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Adding a line (`F6` on the list, or automatically as the very first step after the customer is known) calls `SltArticle(' ')`, then pre-fills the line with quantity `1`, unit price `GetArtRefSalPrice`, net total `qty × price`, VAT `CLCVat(GetArtVatCode(article) : net)` and shows the VAT rate. `FMT02` lets the user change **quantity and unit price only**; Enter with a modified field recalculates and redisplays, Enter with nothing modified writes the row to the `QTEMP` staging file and reloads the list. Two as-is traps: after `F6`, cancelling the article prompt re-prompts until an article is chosen, and `F3`/`F12` on the add screen reached via `F6` end the whole program (staged order abandoned).

## Entrypoints

- `F6` on `CTL01` (`CF06(06)` → `create`) → `s01key` → `panel = 2; step02 = prp` — `ATU_SRC/QDDSSRC/ORD100D.DSPF:31`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:41,148-150`
- First pass after `*inzsr` (`panel = 2`, `create` forced on) — `ORD100.PGM.RPGLE:319,329`
- `S02prp` create branch — `ORD100.PGM.RPGLE:251-271`; `S02dsp`/`S02key`/`S02chk`/`S02act` — `ORD100.PGM.RPGLE:273-313`
- Screen `FMT02` "Add a customer Order Line" — `ORD100D.DSPF:89-127`

## Inputs / outputs / observables

- In: article chosen in `SltArticle` (`ART301D` window, returns 6A id or its argument `' '` on cancel); `ODQTY` (5 0, input) and `ODPRICE` (7P 2, input) on `FMT02`. — `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:54-55`, `ATU_SRC/QRPGLESRC/ART301.SQLRPGLE:75,94,227`, `ORD100D.DSPF:115-116`
- Out: one `TMPREC` row in `QTEMP/DETORD` with `ODLINE = count`, `ODARID`, `ODQTY`, `ODPRICE`, `ODTOT`, `ODTOTVAT`; `ODORID = 0`, `ODYEAR = 0`, `ODQTYLIV = 0` (never assigned before confirm). — `ORD100.PGM.RPGLE:303`, `ATU_SRC/QDDSSRC/DETORD.PF:6-20`
- Display-only: `ARTDESC` (first 30 of the 50-char description), `VAT` amount, `VATRATE`, `ODLINE`, `ORCUID`/`CUSTNAME`; `MODE` (3A) is never assigned — always blank. — `ORD100D.DSPF:114-127`, `ARTICLE.RPGLEINC:7-8`

## Behaviour as implemented

1. `odarid = sltArticle(' ')` — article window; blank means cancelled. — `ORD100.PGM.RPGLE:253`
2. `if odarid = ' '` → `panel = 1; step02 = prp` — **but the subroutine continues** (no `leavesr`). — `ORD100.PGM.RPGLE:254-257`
3. Defaults: `odqty = 1; odprice = GetArtRefSalPrice(odarid); odtot = odqty * odprice; count += 1; odline = count`. — `ORD100.PGM.RPGLE:258-262`
4. Common tail (also used by edit, `c04`): `artdesc = GetArtDesc(odarid)`; `vat = CLCVat(GetArtVatCode(odarid) : odtot)`; `odtotvat = odtot + vat`; `vatRate = GetVatRate(GetArtVatCode(odarid))`; `step02 = dsp`. — `ORD100.PGM.RPGLE:266-270`
5. `exfmt fmt02` — `ORD100.PGM.RPGLE:274`. Function keys: `F3` (`exit`) and `F12` (`cancel`) both set `panel = 1`; anything else → `S02chk`. — `ORD100.PGM.RPGLE:278-289`
6. `S02chk`: `odtot = odqty * odprice`; VAT and `odtotvat` recomputed from the (unchanged) article's VAT code; `vatRate` **not** recomputed (article cannot change). — `ORD100.PGM.RPGLE:291-296`
7. `S02act`: if `change` (record-level `CHANGE(27)` — any input field modified) → `step02 = dsp`, redisplay with the recomputed figures, **nothing saved**. Else, `create` on → `write tmprec; step01 = prp` (list will reload from the file, recomputing totals) and `panel = 1`. — `ORD100.PGM.RPGLE:298-313`, `ORD100D.DSPF:91`
8. Net effect for the user: pick article → screen shows defaults → (optionally type qty/price → Enter → see new totals) → Enter → line saved, list shown.

## Validation rules found in code

None. Quantity `0`, unit price `0`, and (if the device accepts a field-minus on the signed zoned/packed fields) negative values are written as typed. No article existence / soft-delete check (`ExistArt`, `IsArtDeleted` are not called — `c14`). No duplicate-article check across lines.

## Edge cases found in code

- **Cancelled article prompt after `F6` loops.** `s01key` set `panel = 2` without changing `step01` (still `key`); `S02prp` sets `panel = 1` on cancel and returns without any `ORD100D` input, so indicator 06 (`create`) is still on when `s01key` runs again → `panel = 2` → `SltArticle` again. `F3`/`F12` inside `SltArticle` only return `' '` and re-prompt; the only way out is to select an article (then Enter saves it, or `F3`/`F12` on `FMT02` ends the program — next bullet). — `ORD100.PGM.RPGLE:135,148-150,253-257`
- **`F3`/`F12` on `FMT02` reached via `F6` end the program.** `S02key` sets `panel = 1`; `step01` is still `key`, and indicators 03/12 are response indicators on every format (file-level `CA03`/`CA12`), so `s01key` immediately sees `exit` (→ `panel = 0`) or `cancel` (→ `panel = 1 - 1 = 0`). `pnl00` sets `*inlr`; the staged lines are abandoned silently (`c13`). On the **first** add after `*inzsr` (`step01 = prp`) and on edit (`step01 = act`, `c04`) the same keys return to the list instead. — `ORD100.PGM.RPGLE:140-145,280-285,333-335`, `ORD100D.DSPF:8-9`
- **Cancelled prompt still counts a line.** Step 3 runs after the cancel: `count` is incremented (`c12`) and the `FARTICLE`/`FVAT` getters are called with a blank id (they return `0` / blanks from a cleared buffer, no error). On the first-pass path this leaves the list empty with the next real line numbered `2`. — `ORD100.PGM.RPGLE:254-262`, `ATU_SRC/QRPGLESRC/ART300.RPGLE:114-127`
- **Price copied at entry.** `odprice` is a snapshot of `ARSALEPR`; nothing re-prices later (`c04` recomputes only from the typed price). — `ORD100.PGM.RPGLE:259`, `ATU_SRC/QDDSSRC/ARTICLE.PF:8`
- **Rounding / size.** `CLCVat` returns `%dech((net × rate) / 100 : 9 : 2)` (half-adjust); unknown VAT code → rate `0` → VAT `0` silently. `odtot` is 9P 2 while `qty (5 0) × price (7P 2)` can reach 10 digits — a product ≥ 10,000,000.00 raises an unmonitored size exception (runtime, not confirmed). — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:38-49`, `ATU_SRC/QDDSSRC/SAMREF.PF:47-55`
- **Description truncation.** `GetArtDesc` is 50A, `ARTDESC` on both screens is 30A. — `ARTICLE.RPGLEINC:7`, `ORD100D.DSPF:21,122`
- Title is always "Add a customer Order Line" and `MODE` is blank, also in edit mode. — `ORD100D.DSPF:100,127`

## Dependencies

- `FARTICLE`: `SltArticle`, `GetArtDesc`, `GetArtRefSalPrice`, `GetArtVatCode` — `ARTICLE.RPGLEINC:7-8,12-14,39-40,54-55`, `ATU_SRC/QSRVSRC/FARTICLE.BND:14`
- `FVAT`: `CLCVat`, `GetVATRate` — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8,22-24`
- Staging file `TMPDETORD` (`c02`); `DETORD.PF` field sizes via `SAMREF` — `DETORD.PF:6-20`, `SAMREF.PF:34-55`

## Assumptions / unknowns

- Whether the re-prompt loop and the `F3`/`F12`-ends-program behaviour are known to users (they are consistent in code; runtime not exercised here).
- Whether soft-deleted articles appear in `SltArticle` (owned by `art-modules`, skipped this round) — if they do, they can be ordered.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:41,135,140-150,251-313,319,329` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:8-9,21,31,89-127` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8,12-14,39-40,54-55` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8,22-24` · `ATU_SRC/QRPGLESRC/ART301.SQLRPGLE:75,94,227` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:114-127` · `ATU_SRC/QRPGLESRC/VAT300.RPGLE:38-49` · `ATU_SRC/QDDSSRC/DETORD.PF:6-20` · `ATU_SRC/QDDSSRC/SAMREF.PF:47-55` · `ATU_SRC/QDDSSRC/ARTICLE.PF:8`
