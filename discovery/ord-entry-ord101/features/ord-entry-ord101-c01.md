# ord-entry-ord101-c01 — Load order lines with totals

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD101(orid)` loads **every** `DETORD` row of the order in one pass (keyed `DETORD1`, partial key `ODORID`, ascending `ODLINE`), summing the net (`TOT`) and VAT-inclusive (`TOTVAT`) footer totals from the stored `ODTOT` / `ODTOTVAT` and fetching each article description through `GetArtDesc`. The whole list is in the subfile before the first display; there is no incremental page load. An order with no lines shows the header and footer only.

## Entrypoints

- Program entry `ORD101` with one parameter `id` (`like(orid)`, `6P 0`) — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:19-25`
- Panel 1 state machine `pnl01` → `s01prp` → `s01lod` → `s01dsp` (`exfmt ctl01`) — `ORD101.PGM.RPGLE:78-132`
- Subfile `SFL01` / control `CTL01` / footer `KEY01` — `ATU_SRC/QDDSSRC/ORD101D.DSPF:12-92`

## Inputs / outputs / observables

- In: `id` (order number); `DETORD1` rows where `ODORID = id`. — `ORD101.PGM.RPGLE:108-109`, `ATU_SRC/QDDSSRC/DETORD1.LF:5-7`
- Out (screen): one `SFL01` row per line — `OPT01` (blank, `EDTCDE(Z)`), `ODLINE`, `ODARID`, `ARTDESC` (30 chars), `ODQTY`, `ODPRICE`, `ODTOT`; hidden `ODQTYLIV`, `ODTOTVAT`. Footer `TOT` / `TOTVAT` on `KEY01`. — `ORD101D.DSPF:15-27,87-89`
- No writes. `TOT` and `TOTVAT` are running sums of the **stored** `ODTOT` / `ODTOTVAT`, not recomputed. — `ORD101.PGM.RPGLE:111-112`

## Behaviour as implemented

1. `s01prp`: `RRN01 = 0`, `SFLCLR`, `tot = 0`, `totvat = 0`. — `ORD101.PGM.RPGLE:95-103`
2. `s01lod`: `RRB01 = 1` (first page), `opt01 = 0`; `setll id detord1; reade(n) id detord1` and loop to `%eof`: `tot += odtot; totvat += odtotvat; RRN01 += 1; artdesc = GetArtDesc(odarid); write sfl01`. `sflend = *on` after the loop → `SFLEND(*MORE)` shows the end marker. — `ORD101.PGM.RPGLE:105-120`, `ORD101D.DSPF:36`
3. `s01dsp`: `SFLDSPCTL` on; `SFLDSP` only if `RRN01 > 0`; `write key01` (footer with totals) then `exfmt ctl01`. On return, if the INFDS top-of-page RRN (`lrrn`, positions 378–379) is non-zero it becomes `RRB01` so the same page is redisplayed next time. — `ORD101.PGM.RPGLE:30-31,122-132`
4. `SFLSIZ(15)` ≠ `SFLPAG(14)` → the subfile grows automatically; `PAGEDOWN(25)` is conditioned `N80` and `sflend` is always on after the load, so paging is handled entirely by the display and the RPG `pagedown` indicator is declared but never tested. — `ORD101D.DSPF:30,36-38`, `ORD101.PGM.RPGLE:42`
5. Reads are `reade(n)` (no lock) on a `UF` file — the load itself locks nothing. — `ORD101.PGM.RPGLE:9,109,116`

## Validation rules found in code

None. `id` is not checked against `ORDER` here (see `c02`); an unknown or line-less order simply yields `RRN01 = 0` and `SFLDSP` off.

## Edge cases found in code

- **Description truncation.** `GetArtDesc` returns `like(ardesc)` = 50 chars (`SAMREF.ARDESC`); `ARTDESC` on both `SFL01` and `FMT02` is `30A`, so descriptions are cut at 30 on screen. — `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8`, `ATU_SRC/QRPGLESRC/ART300.RPGLE:19-27`, `ATU_SRC/QDDSSRC/SAMREF.PF:13`, `ORD101D.DSPF:21,127`
- **Unknown article.** `GetArtDesc` chains `ARTICLE1` and returns whatever `ARDESC` holds after a miss (owned by `art-modules`); `ORD101` does not test the result. Pointer only.
- **`RRN01` is `5i 0`** — fine for any realistic line count; `SFLRCDNBR` `RRB01` is `4S 0`. — `ORD101.PGM.RPGLE:58`, `ORD101D.DSPF:42`
- **Reload points.** The list is rebuilt from the file only by `s01prp` → `s01lod`: at start, on `F5`, and never after an edit (`c03`) — deletes adjust the footer in memory (`c06`).
- **Empty order.** `SFLDSP` off, `CTL01` + `KEY01` still shown with `TOT = TOTVAT = 0`; Enter on the empty screen runs `s01chk` / `s01act` against zero rows and redisplays. — `ORD101.PGM.RPGLE:124,149-154,180-184`

## Dependencies

- `DETORD1.LF` (`UNIQUE`, key `ODORID, ODLINE`) over `DETORD.PF` — `DETORD1.LF:4-7`, `ATU_SRC/QDDSSRC/DETORD.PF:5-20`
- `FARTICLE` service program via `ARTICLE.RPGLEINC` (`GetArtDesc`), bound through `BNDDIR('SAMPLE')` — `ORD101.PGM.RPGLE:5,16`
- `SAMREF` field definitions for `QUANTITY` (`5 0`), `UNITPRICE` (`7P 2`), `TOTPRICE` (`9P 2`) — `SAMREF.PF:47-55`

## Assumptions / unknowns

- Whether the 30-character truncation of a 50-character description is accepted as-is (display-only).

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:5,9,16,19-25,30-31,42,58,78-132` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:12-42,87-89,127` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/SAMREF.PF:13,47-55` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:19-27`
