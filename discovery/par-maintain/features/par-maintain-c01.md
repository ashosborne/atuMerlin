# par-maintain-c01 — List parameters with paging, F5 refresh, options 2/4

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`PAR200` (menu option 20, no parameters) lists every `PARAMETER` row in key order (`PACODE`, `PASUBCODE`) in a subfile of **14 rows per load**, reading the file directly (`uf a` — no service program). Each load reads one row ahead so `Bottom` is exact; Page Down appends the next 14 from the saved key; F5 clears and reloads from the top; options `2` (edit) and `4` (delete) are the only ones accepted — anything else reverses the option cell and shows `Invalid Option`. There is no filter, no position-to and no search. The `2` column shows the first 32 characters of `PARM2` (`PARM2S`); columns `3`–`5` are the raw fields. Rows changed by edit, create or delete are **not** re-read into the list (`c03`, `c04`, `c05`) — only F5 or re-entry shows the file as it is.

## Entrypoints

- `SAMMNU` option 20 `call par200`, help `nohelp` (Utilities group) — `ATU_SRC/QPNLSRC/SAMMNU.MENU:135-138`
- Program `PAR200`, no `H` spec, no parameters; cycle-driven state machine (`panel` 1/2/3/0, `step01` `prp`→`lod`→`dsp`→`key`→`chk`→`act`), one subroutine per cycle pass, `*inlr` only in `pnl00` — `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:36-62,311-313`
- Files: `fparameter uf a e k disk` (update + add, keyed); `fpar200d cf e workstn indds(indds) sfile(sfl01:rrn01) infds(Info)` — `PAR200.PGM.RPGLE:5-9`
- Display: `SFL01` / `CTL01` (`SFLSIZ(0015) SFLPAG(0014)`, `SFLEND(*MORE)`, `N80 PAGEDOWN(25)`, `CA05` Refresh, `CF06` Create, `SFLMSG('Invalid Option' 35)`), footer `KEY01` — `ATU_SRC/QDDSSRC/PAR200D.DSPF:13-81`

## Inputs / outputs / observables

- In: `PARAMETER` rows (`FPARAM`: `PACODE` 10, `PASUBCODE` 10, `PARM1` 10, `PARM2` 100, `PARM3` 2, `PARM4` 1 0, `PARM5` 3 0; `UNIQUE (PACODE, PASUBCODE)`) — `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`
- Out (screen `PAR200-1`, "Work with Parameters", date/time top right): header line 4 `2=Edit 4=Delete`; headings line 6 `Opt`, `Code` (col 6), `Sub-Code` (col 17), `1` (col 28), `2` (col 39), `3` (col 72), `4` (col 75), `5` (col 79); one row per record on line 7+: `OPT01` (`2Y 0B`, `EDTCDE(Z)`), `PACODE`, `PASUBCODE`, `PARM1`, `PARM2S` (32 chars — `PARM2` truncated, `PARM2` itself is **not** a subfile field), `PARM3`, `PARM4`, `PARM5`. `PARM4` / `PARM5` are numeric output fields without an edit code — leading zeros are shown (`0`, `000`) (DDS default; runtime-confirmable). Footer line 23 `F3=Exit F6=Create F12=Cancel`. — `PAR200D.DSPF:13-28,42-73,74-81`
- Observables: `More...` / `Bottom` from `SFLEND(*MORE)`; the option cell reverse-imaged with cursor (`DSPATR(RI) DSPATR(PC)` on 34) and `Invalid Option` on a bad option; an empty file shows the headings with no rows and no message (`SFLDSP` off when `RRN01 = 0`). — `PAR200D.DSPF:17-18,35,38,41`, `PAR200.PGM.RPGLE:123`

## Behaviour as implemented

1. `s01prp`: `RRN01 = 0`, `SFLCLR` written, `step01 = lod`, `savid1` / `savid2` cleared, `rrs01 = 0`. — `PAR200.PGM.RPGLE:81-90`
2. `s01lod` → `s01rst`: `setll (savid1:savid2) parameter; rrn01 = rrs01` — first time both keys blank → start of file; later the key of the **look-ahead** record (step 4). `RRb01 = RRn01 + 1` (`SFLRCDNBR` → the page holding the first new row is displayed). `opt01 = 0; count = 0`. — `:92-96,110-113`
3. `read(n) parameter` (no lock) then `dow not %eof and count < 14`: `RRN01 += 1; count += 1; parm2s = parm2; write sfl01; read(n)`. Rows come in physical key order — no `WHERE`, no `setgt`, no position-to. — `:97-104`
4. Loop exit after the 14th write has already **read the 15th record** (or hit end of file), so `sflend = %eof(parameter)` is exact: a file of exactly 14 (or 28…) rows shows `Bottom` on the last full page — no empty trailing page. `s01sav` then stores `pacode` / `pasubcode` of the record in the buffer (the unread 15th; at end of file the last record read — RPG leaves the buffer unchanged on `%eof`) and `rrs01 = rrn01`. — `:105-107,115-119`
5. `s01dsp`: `SFLDSPCTL` on, `SFLDSP = RRn01 > 0`, `write key01`, `exfmt ctl01`; after return, `if LRRN <> 0 → RRb01 = LRRN` (INFDS 378–379, subfile RRN under the cursor) so a plain redisplay keeps the user's page. — `:29-30,121-131`
6. `s01key`: F3 → `panel 0` (end); F12 → `panel = panel − 1` = 0 (end — F3 = F12 here); Page Down → `lod` (append 14 from the saved key); F5 → `prp` (clear, forget the position, reload from the top); F6 → `panel 3`, `step01 = lod` (`c02`, `c03`); Enter → `chk`. — `:133-151`
7. `s01chk`: `sflnxtchg` on; `readc(e)` loop over changed rows: option not in {0, 2, 4} → `step01 = dsp`, `dspatr_ri` + `sflmsg` on, `rrb01` = the first offending row (page to it); **every** changed row is `update sfl01`'d with `SFLNXTCHG` so it is re-read on the next Enter (valid rows survive an error pass). `sflnxtchg` off after the loop. — `:153-173`
8. `s01act` (only when every option was valid): one `readc(e)` **per cycle pass** — `%eof`/`%error` → `dsp`; `2` → `panel 2`, `opt01 = 0`, `update sfl01` (row's modified-data tag cleared) (`c04`); `4` → delete and rewrite the row (`c05`); any other changed row (option blanked to 0) → nothing, no `update` — its modified-data tag stays on and it is re-read on every later Enter, harmlessly. Because panel 2 returns with `step01` still `act`, several `2`s are edited one after another in RRN order and `4`s are processed in sequence; the list redisplays (on the cursor's page) when `readc` runs out. — `:175-196,244-248`
9. `SFLSIZ 15 ≠ SFLPAG 14` → the subfile auto-extends (max 9 999); earlier pages stay loaded, Page Up is display-side (no `PAGEUP` keyword); `PAGEDOWN(25)` is conditioned `N80`, so once `Bottom` is shown the Page Down key never reaches the program. — `PAR200D.DSPF:31,38-40`

## Validation rules found in code

- Option must be 0, 2 or 4 — `PAR200.PGM.RPGLE:159`. `OPT01` is `2Y 0B`, so non-digits are refused by the device before the program sees them (keyboard-level; runtime-confirmable). — `PAR200D.DSPF:16`
- Nothing else: no row-count limit, no authority check, no message for an empty file.

## Edge cases found in code

- **Stale list.** The subfile is a snapshot: created rows appear only when they sort into a later-appended page or after F5 (`c03`); edited rows keep their pre-edit values (`c04`); deleted rows stay on screen blanked (`c05`). Changes made by another job (or by `PAR200` in another session) are invisible until F5 / re-entry.
- **Concurrent insert / delete between loads.** `setll` on the saved key: a row deleted meanwhile → positioning falls to the next greater key (no error); a row inserted with a lower key than the saved one → not shown; the saved row itself deleted → the next row is shown (nothing skipped, nothing duplicated). Only the F6 path can duplicate a row (`c03`).
- **Options typed and then Page Down / F6.** Both return data (`PAGEDOWN`, `CF06`); no `readc` runs on those paths, so typed options stay in the subfile with their modified-data tags and run on the next Enter (same as `ord-maintain-ord201-c07`). F3 / F5 / F12 are `CA` keys — typed options are discarded (DDS contract; runtime-confirmable). — `PAR200D.DSPF:9-10,31-33`, `PAR200.PGM.RPGLE:141-147`
- **Blank code + blank sub-code** row: allowed by the file and by `c02`; it sorts first and is listed normally. It is unreachable through the getters (`c09`).
- **Page geometry** (`SFLPAG 14`, one line per row, rows on lines 7–20): DDS contract, runtime-confirmable.
- **Dead declarations**: `help` (01), `prompt` (04), `morekeys` (24), `User`, `mode`, an empty `*inzsr`; `PRINT` lets the Print key dump the screen (display-side). — `PAR200.PGM.RPGLE:12,14,18,42,44,308-309`, `PAR200D.DSPF:11`

## Dependencies

- `PARAMETER.PF` (physical file, read directly — `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`), `PAR200D.DSPF` (`REF(*LIBL/PARAMETER)`, `ERRSFL`, `INDARA`) — `PAR200D.DSPF:6-12`
- Caller: `SAMMNU` option 20 only (grep: no `CALL PAR200` elsewhere in `ATU_SRC`).
- No service program, no `bnddir`, no `H` spec → `CRTBNDRPG` defaults, default activation group (inference; build owner to confirm). `FPARAMETER`'s cache is therefore not involved — `PAR200` always sees the file as it is (`c09`).

## Assumptions / unknowns

- RPG-cycle looping while `*INLR` is off, `READ` at end of file leaving the buffer unchanged, `SFLRCDNBR` / INFDS 378–379 semantics, `N80`-conditioned `PAGEDOWN`, modified-data-tag survival across `CF`/`PAGEDOWN`, and leading zeros on un-edited numeric output are platform rules, not source — flagged runtime-confirmable.
- needs-SME: keep the generic list at all, or replace `PATH` with target configuration (`c11`)? Phase A recommendation: configuration.

## Evidence

`ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:5-9,11-44,53-62,81-196,311-313` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:6-81` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:135-138`
