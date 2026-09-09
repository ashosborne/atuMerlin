# ord-maintain-ord202-c02 — Order lines display with totals

| | |
| --- | --- |
| Slice | `ord-maintain-ord202` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`s01lod` reads **every** `DETORD1` row of the order (partial key `ODORID`, ascending `ODLINE`) in one pass, chains `ARTICLE1` per line for the description, sums the **stored** `ODTOT` / `ODTOTVAT` into `TOT` / `TOTVAT`, and writes one two-line `SFL01` record per line. The subfile is `SFLSIZ(7)` / `SFLPAG(6)` — sizes differ, so it auto-extends and the display pages it; there is no `PAGEDOWN` keyword and no program paging. Because of `SFLDROP(CF11)` the list is first shown **truncated**: the article description (line 2 of each record) is hidden until the user presses `F11`. Totals go out on the footer record `KEY01`, not on the subfile control. A missing article does not blank the description — the **previous line's** description is repeated.

## Entrypoints

- `s01lod` (after `s01prp`, `c01`), then `s01dsp` — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:99-127`
- Subfile `SFL01` (rows 8–9), control `CTL01` (`SFLCTL`), footer `KEY01` (rows 21–23) — `ATU_SRC/QDDSSRC/ORD202D.DSPF:12-28,29-41,78-91`

## Inputs / outputs / observables

- In: `DETORD1` rows where `ODORID = id` (`FDETO`: `ODLINE 5P 0`, `ODARID 6A`, `ODQTY`/`ODQTYLIV 5 0`, `ODPRICE 7P 2`, `ODTOT`/`ODTOTVAT 9P 2`); `ARTICLE1` by `ODARID` for `ARDESC` (50). — `ORD202.PGM.RPGLE:8-9,103-111`, `ATU_SRC/QDDSSRC/DETORD.PF:5-23`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7`, `ATU_SRC/QDDSSRC/SAMREF.PF:11-14,37-39,47-55`
- Out (screen), per `SFL01` record, all output-only: line 1 (row 8) `ODLINE` (`EDTCDE(Z)`) col 2, `ODARID` col 8, `ODQTY` col 15, `ODQTYLIV` col 22 (heading `Deliver`), `ODPRICE` col 40 (`Un.Price`), `ODTOT` col 50 (`Total`), `ODTOTVAT` col 63 (`With VAT`) — the five amounts/quantities `EDTCDE(2)`; line 2 (row 9) `ARDESC` col 8. Column headings on `CTL01` row 7. — `ORD202D.DSPF:15-28,64-77`
- Out (footer `KEY01`): `TOT` at 22/50, `TOTVAT` at 22/63 (both `REFFLD` to `DETORD` totals, `EDTCDE(2)`, `DSPATR(HI)`), a `'============ ============'` rule at 21/50, and the key legend `F3=Exit`, `F11=Detail`, `F12=Cancel` at row 23. — `ORD202D.DSPF:80-91`
- No writes. — `ORD202.PGM.RPGLE:7-11`

## Behaviour as implemented

1. `RRb01 = RRn01 + 1` (`RRN01` is `0` after `s01prp`, so `SFLRCDNBR = 1` — first page); `tot = 0`; `totvat = 0`. — `ORD202.PGM.RPGLE:92,100-102`
2. `setll id detord1; reade id detord1; dow not %eof(detord1)`: `tot += odtot`; `totvat += odtotvat`; `chain odarid article1`; `RRN01 += 1`; `write sfl01`; `reade id detord1`. `DETORD1` is keyed `ODORID, ODLINE`, so lines come out in ascending line number, every line of the order, no limit other than the subfile's 9 999. — `ORD202.PGM.RPGLE:103-112`, `DETORD1.LF:4-7`
3. `sflend = *on` unconditionally; `step01 = dsp`. — `ORD202.PGM.RPGLE:113-114`
4. `s01dsp`: `SFLDSPCTL` on; `SFLDSP = RRn01 > 0`; `write key01` (footer with the totals); `exfmt ctl01`. After the return, `if LRRN <> 0 → RRb01 = LRRN` (top-of-page RRN from the `INFDS`) — assigned but never used, because the next step ends the program (`c03`). — `ORD202.PGM.RPGLE:37-38,117-126`
5. Display-file mechanics (DDS contract, not program logic): `SFLSIZ(0007)` ≠ `SFLPAG(0006)`, so writing record 8 and beyond auto-extends the subfile (max 9 999) and **Page Up/Down are handled by the display** without returning to the program; `SFLEND(*MORE)` with indicator 80 on shows `More...` on intermediate pages and `Bottom` on the last. `SFLDROP(CF11)`: the subfile is first displayed **truncated** to line 1 of each record (up to 12 records in rows 8–19); `F11` folds it to show both lines (6 records per page, `SFLPAG`); the toggle is handled by the display and `CF11` has no indicator in the program. — `ORD202D.DSPF:37-40`, `ORD202.PGM.RPGLE:20-35`

## Validation rules found in code

None. An order with no lines gives `RRN01 = 0` → `SFLDSP` off: header, column headings, blank totals (`EDTCDE(2)` shows zero as blank) and the key legend, no message. — `ORD202.PGM.RPGLE:119`, `ORD202D.DSPF:86-89`

## Edge cases found in code

- **Missing article → previous line's description repeated.** `chain odarid article1` is not tested with `%found`; on a miss the `FARTI` buffer is left as it was, so `ARDESC` still holds the description chained for the previous line (blank only when the first line's article is missing). The list twins' line editor uses `GetArtDesc` for the same lookup and gets whatever `FARTICLE` returns on a miss (`c06`, `art-modules`). — `ORD202.PGM.RPGLE:108-110`
- **Totals are sums of stored line totals, not recomputed.** `TOT = Σ ODTOT`, `TOTVAT = Σ ODTOTVAT` as stored by `ORD100`/`ORD101` — including the `ODTOTVAT` re-rated at today's VAT rate by a plain Enter in `ORD101` (`ord-entry-ord101-c03`) — so the footer agrees with the `ORDERCUS.TOTVAL` the lists show for the same order only if nothing has changed the lines since. `ODQTY` × `ODPRICE` is never checked against `ODTOT`. — `ORD202.PGM.RPGLE:106-107`
- **The description line is hidden by default.** Under `SFLDROP` the user sees line/article id/quantities/prices only until `F11` (`F11=Detail`); the folded (two-line) form is what Phase A described as the display. The `ARDESC` field is 50 wide at 9/8 — the **full** description; `ORD101` truncates `GetArtDesc`'s 50 to 30 on screen (`ord-entry-ord101-c01`). — `ORD202D.DSPF:28,38,84-85`
- **Zero shows blank.** `EDTCDE(2)` on `ODQTYLIV`, `ODPRICE`, `ODTOT`, `ODTOTVAT`, `TOT`, `TOTVAT`: an undelivered line has an empty `Deliver` column rather than `0`; a zero-priced line shows nothing under `Un.Price`/`Total`. `ODLINE` is `EDTCDE(Z)`. — `ORD202D.DSPF:15-27,86-89`
- **Truncated form holds twice the records.** In the initial (dropped) form the page is 12 records (rows 8–19); after `F11` it is 6 (`SFLPAG`). `More...`/`Bottom` and the roll keys apply to whichever form is shown. An order with 7 or more lines therefore needs a roll only in the folded form; Phase A's "orders with more than 7 lines may not display fully" is withdrawn — every line is written and the display pages them. Rolling past `Bottom` (no `PAGEDOWN` keyword) is refused by the display with a system message, not by the program. — `ORD202D.DSPF:37-40`
- **Footer written before the control record.** `write key01` precedes `exfmt ctl01`; `CTL01` has `OVERLAY`, `KEY01` has not, so `KEY01` clears the screen and `CTL01` (with the subfile) is drawn over it. Rows 8–19 belong to the subfile, row 20 is blank, rows 21–23 are the footer. — `ORD202.PGM.RPGLE:121-122`, `ORD202D.DSPF:33,78-91`
- **`SFLRCDNBR` copy is dead.** `RRb01 = LRRN` after the `exfmt` would keep the user's page on a redisplay, but there is no redisplay (`c03`). `rrs01` (the high-water-mark idiom of `ORD201`) is declared and unused — no `READC` here to overwrite `RRN01`. — `ORD202.PGM.RPGLE:41,123-125`
- **`SFLNXTCHG` / `SFLMSG` residue.** Indicator 33 (`SFLNXTCHG`) on `SFL01` and `SFLMSG('Invalid Option' 35)` on `CTL01` are the list-template's option-validation furniture; with no input-capable field they can never do anything, and the program never sets 33 or 35. — `ORD202D.DSPF:14,41`, `ORD202.PGM.RPGLE:32,34`
- **Subfile capacity.** `RRN01` is `5i 0` (32 767); a subfile holds 9 999 records; an order with more lines than that would fail `write sfl01` unmonitored. Irrelevant for the sample data. — `ORD202.PGM.RPGLE:40,110`

## Dependencies

- `DETORD1.LF` (`UNIQUE`, `K ODORID`, `K ODLINE`) over `DETORD.PF`; `ARTICLE1.LF` (`UNIQUE`, `K ARID`) over `ARTICLE.PF` — `DETORD1.LF:4-7`, `ARTICLE1.LF:4-6`
- `ORD202D.DSPF` `SFL01` / `CTL01` / `KEY01`; `REFFLD` to `DETORD` and `ARTICLE` — `ORD202D.DSPF:15-28,86-89`
- Stored line totals are produced by `ORD100` (`ord-entry-ord100`) and `ORD101` (`ord-entry-ord101`); `ODQTYLIV` by `ORD101` per line and by `ORD200`/`ORD201` option 8 (`ord-maintain-ord200-c07`) — cited, not deepened

## Assumptions / unknowns

- The auto-extend, display-side paging, `More...`/`Bottom` and truncated-first statements are the documented DDS contract for `SFLSIZ ≠ SFLPAG`, `SFLEND(*MORE)` and `SFLDROP`; they are not visible in the RPG. Runtime confirmation on the box would settle the exact page counts and the roll-past-`Bottom` message text.
- needs-SME: is the truncated-first presentation (description hidden until `F11`) intended, or a template accident? The target has to choose one.
- needs-SME: the repeated-description-on-miss behaviour is a defect to record as-is (not fixed); the target lookup should not inherit it, but that is a room decision for the ORD pack.

## Evidence

`ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:7-11,20-35,37-38,40-41,92,99-127` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:12-28,29-41,64-77,78-91` · `ATU_SRC/QDDSSRC/DETORD.PF:5-23` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:11-14,37-39,47-55`
