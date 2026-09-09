# ord-entry-ord101-c03 — Edit line quantities and price

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `2` opens `FMT02` for one line with three input fields — ordered quantity, **delivered quantity** and unit price — as display copies (`DSQTY`, `DSQTYLIV`, `DSPRICE`) of the stored row. Enter recomputes net (`ODTOT = qty × price`), VAT (`CLCVat` on the article's VAT code) and total; a **modified** screen is redisplayed with the new figures, an **unmodified** Enter writes `ODQTY`, `ODQTYLIV`, `ODPRICE`, `ODTOT`, `ODTOTVAT` to `DETORD` and returns to the list. So a save always takes two Enters after a change, and a plain Enter with no change **still rewrites** `ODTOT` / `ODTOTVAT` with values recomputed at today's VAT rate. `F3` and `F12` on `FMT02` both return to the list without saving (neither ends the program). The footer totals are **not** updated after a save.

## Entrypoints

- Option `2` on `SFL01` → `s01chk` (valid) → `s01act` `when opt01 = 2` → `panel = 2` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:155,185-187`
- Panel 2 state machine `pnl02`: `S02prp` → `S02dsp` (`exfmt fmt02`) → `S02key` → `S02chk` → `S02act` — `ORD101.PGM.RPGLE:202-276`
- Record `FMT02` (`CHANGE(27)`; input `DSQTY`, `DSPRICE`, `DSQTYLIV`) — `ATU_SRC/QDDSSRC/ORD101D.DSPF:93-138`

## Inputs / outputs / observables

- In: the subfile row read by `readc` (`ODLINE`, hidden `ODQTYLIV` / `ODTOTVAT`); the `DETORD1` row `(id, odline)`; typed `DSQTY`, `DSQTYLIV`, `DSPRICE`. — `ORD101.PGM.RPGLE:181,219`
- Out (file): `update fdeto` with `ODQTY`, `ODQTYLIV`, `ODPRICE`, `ODTOT`, `ODTOTVAT`; `ODARID`, `ODLINE`, `ODORID`, `ODYEAR` untouched. — `ORD101.PGM.RPGLE:267-270`
- Out (screen): `FMT02` shows `ODARID` + `ARTDESC`, `VATRATE`, the three inputs, `ODTOT` (net), `VAT`, `ODTOTVAT` (total); after the save the `SFL01` row is rewritten with the new values (`OPT01 = 0`). — `ORD101D.DSPF:118-127,137`, `ORD101.PGM.RPGLE:271-272`
- Not updated: footer `TOT` / `TOTVAT` (`c01`); the calling list (`c09`).

## Behaviour as implemented

1. **`S02prp`** — `chain (id:odline) detord1` (acquires the record lock; `%found` not tested). Copies `odqty → dsqty`, `odqtyliv → dsqtyliv`, `odprice → dsprice`; `artdesc = GetArtDesc(odarid)`; `vat = CLCVat(GetArtVatCode(odarid):odtot)`; `odtotvat = odtot + vat`; `vatRate = GetVatRate(GetArtVatCode(odarid))`. The **displayed** VAT and total are therefore recomputed from the stored net at the current rate, not read from the row. — `ORD101.PGM.RPGLE:218-228`
2. **`S02dsp`** — `exfmt fmt02`. — `ORD101.PGM.RPGLE:230-233`
3. **`S02key`** — `F3` (`exit`): `panel = 1`, `step02 = prp` (back to the list — **not** program end). `F12` (`cancel`): `step02 = prp`, `panel = panel − 1` = 1 (same outcome). Anything else → `S02chk`. — `ORD101.PGM.RPGLE:235-246`
4. **`S02chk`** — validation (`c04`), then unconditionally `odtot = dsqty * dsprice`; `vat = CLCVat(GetArtVatCode(odarid):odtot)`; `odtotvat = odtot + vat`. Errors set `step02 = dsp` but the totals are recomputed anyway, so the error screen already shows the new figures. — `ORD101.PGM.RPGLE:248-261`
5. **`S02act`** — if `change` (indicator 27, any input field modified) → `step02 = dsp`: redisplay with recomputed totals, nothing written. Else: `odqty = dsqty; odqtyliv = dsqtyliv; odprice = dsprice; update fdeto; opt01 = 0; update sfl01; step01 = dsp; panel = 1`. — `ORD101.PGM.RPGLE:263-276`, `ORD101D.DSPF:95`
6. Back on panel 1 with `step01 = dsp`: `write key01` (old totals) + `exfmt ctl01`. The next `readc` in `s01act` only happens after another Enter. — `ORD101.PGM.RPGLE:122-132`

## Validation rules found in code

- Delivered vs ordered pair (`ERR1001` / `ERR1002`) — see `c04`.
- Nothing else: zero or negative quantity, zero price, price different from the article reference price, article existence — none checked. `GetArtRefSalPrice`, `GetArtStock`, `ExistArt` are prototyped but not called. — `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:12-20,44-45`

## Edge cases found in code

- **Silent re-rate on plain Enter.** Enter with no field modified runs `S02chk` and `S02act` writes `ODTOT` (= `qty × price`, normally unchanged) and `ODTOTVAT` recomputed at **today's** `VATDEF` rate — if the rate changed since the line was written, or the article's VAT code is now unknown (`vat-module-c02`: rate 0, no message), the stored total changes without any input. — `ORD101.PGM.RPGLE:258-260,267-270`
- **Footer stale after edit.** `TOT` / `TOTVAT` are only recomputed by a reload (`F5`); after a save the footer shows pre-edit totals while the row shows post-edit values. A later option `4` on that row subtracts the **new** row values from the **old** footer (`c06`). — `ORD101.PGM.RPGLE:101-103,111-112,264-275`
- **`F3` on the edit screen does not exit the program** (contrast `ord-entry-ord100-c03`, where `F3` on the add screen reached via `F6` ends the program). Both `F3` and `F12` leave the `2` visible in the option column (row not rewritten) but the row is no longer "changed", so Enter will not reprocess it. On return `step01` is still `act`, so `s01act` immediately `readc`s the **next** changed row — consecutive `2`s are processed one after another; at `%eof` the list is redisplayed. — `ORD101.PGM.RPGLE:180-187,235-246`
- **Lock left by `F12`.** `S02prp` chained for update; cancelling does not `unlock`; the lock is released by the next I/O on `DETORD1` (`chain`, `reade`, `delete`) or program end. — `ORD101.PGM.RPGLE:9,219`
- **Option `2` on a row deleted in the same pass (`c06`).** The `DETORD1` row is gone; `chain` fails silently, the display copies come from the stale buffer, and `update fdeto` without a prior successful read raises an unmonitored I/O exception (no `(e)`, no `*PSSR`, no `INFSR`).
- **Overflow (derived from field sizes).** `ODTOT` is `9P 2`; `DSQTY` (`5 0`) × `DSPRICE` (`7P 2`) can reach 10 digits before the point, so a large quantity × price raises an unmonitored numeric overflow on `eval`. — `ATU_SRC/QDDSSRC/SAMREF.PF:47-55`, `ORD101.PGM.RPGLE:258`
- **Two getters per prepare, three per check.** `GetArtVatCode` is called twice in `S02prp` and once in `S02chk` (each a `chain ARTICLE1`); `CLCVat` + `GetVatRate` hit the `FVAT` cache (`vat-module-c05`). — `ORD101.PGM.RPGLE:224-226,259`
- **Delivered quantity is editable here** although the order-level deliver (`ORD200` / `ORD201` option 8) sets `ODQTYLIV = ODQTY` for lines still at 0 — `ORD101` is the only per-line delivered-quantity writer under `ATU_SRC`. — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:266-276`

## Dependencies

- `DETORD1.LF` / `DETORD.PF` record `FDETO` — `ATU_SRC/QDDSSRC/DETORD1.LF:5`, `ATU_SRC/QDDSSRC/DETORD.PF:5-20`
- `FARTICLE` (`GetArtDesc`, `GetArtVatCode`), `FVAT` (`CLCVat`, `GetVatRate`) via copybooks — `ORD101.PGM.RPGLE:16-17`, `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8,22-24`, `ARTICLE.RPGLEINC:39-40`
- Triggers `ORD700U` on the `update fdeto` (`c11`, pointer).

## Assumptions / unknowns

- needs-SME: is the "plain Enter rewrites `ODTOTVAT` at today's rate" path known? It is the only in-tree way a stored line total can change without a quantity/price change.
- needs-SME: no lower bound on quantity or price (0 and negative accepted, subject only to `c04`).

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:9,16-17,101-103,111-112,122-132,155,180-187,202-276` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:93-138` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/SAMREF.PF:47-55` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-8,22-24` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:12-20,39-45` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:266-276`
