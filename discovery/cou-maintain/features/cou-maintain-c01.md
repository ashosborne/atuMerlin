# cou-maintain-c01 — `COU200` "Work with Countries" lists every country in one load (`*LOVAL SETLL`, read to EOF, no page limit); the display pages it; option 2 is the only option

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`); supersedes the 2026-09-08 residual bind's `deferred` on this half |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`COU200` (menu option 21, Utilities group) is a two-panel OPM RPG III program driven by a `PANEL` / `STEP01` state machine. Panel 1 is a subfile list of the whole `COUNTRY` file: on entry the program clears the subfile, positions to `*LOVAL`, and reads **every** record (no lock) into `SFL01` until end of file — there is no per-page count, no `PAGEDOWN` handler and no reload path afterwards. The subfile geometry is the house `SFLSIZ(15)` / `SFLPAG(14)` (an extendable subfile), so the workstation controller pages through the loaded rows itself and shows `Bottom` on the last page; the `PAGEDOWN(25 'dynamic subfile')` keyword is conditioned `N80`, which is never true when the screen is shown (indicator 80 is on at end of file), and the program never tests `*IN25` — the keyword is a template leftover with no effect. The only option is **2=Edit** (`c02`); any other numeric option marks the row reverse-image, positions the page to the first offending row and shows the DDS literal `Invalid Option` (`SFLMSG` 35). The list is built once per program call; edits made in panel 2 are not written back to the subfile row (`c06`), and the program ends (`LR`) on F3 / F12 so the next call from the menu reloads. Contrast: the sibling maintain lists `CUS200` / `PRO200` load 14 rows per pass with a `pagedown` handler (`CUS200.PGM.SQLRPGLE:135,186`, `PRO200.RPGLE:104,145`).

## Entrypoints

- Menu: `:menui option=21 action='cmd call cou200'` / `Work with countries … COU200` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:139-142` (Utilities group; `menu-cmd-shell-c01`)
- Program mainline and panel-1 dispatcher: `ATU_SRC/QRPGSRC/COU200.RPG:12-19` (`LOOP` / `CASEQ` on `PANEL`), `:21-29` (`PNL01` / `CASEQ` on `STEP01`)
- Display file: `ATU_SRC/QDDSSRC/COU200D.DSPF:12-46` (`SFL01`, `CTL01`), `:47-51` (`KEY01`)
- No other caller in `ATU_SRC` (grep `COU200`: the two members and the menu line; no CL wrapper, no command, no compile spec — `c13`).

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| File | `COUNTRY UF E K DISK` — update-capable, keyed, externally described; opened by the program itself (not `USROPN`), no commitment control, no `INFSR` | `COU200.RPG:7`; `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` |
| Subfile row | `OPT01 2Y 0B` (numeric, `EDTCDE(Z)`, `DSPATR(RI) DSPATR(PC)` under 34), `COID 2A O`, `COUNTR 30A O`, `COISO 3A O` — all three data fields `REFFLD(FCOUN/… *LIBL/COUNTRY)`, output only | `COU200D.DSPF:15-21`; `COUNTRY.PF:7-9`; `ATU_SRC/QDDSSRC/SAMREF.PF:18,20` |
| Control record | `SFLSIZ(0015) SFLPAG(0014)`, `PAGEDOWN(25)` under `N80`, `OVERLAY`, `SFLDSP` 31, `SFLDSPCTL` 32, `SFLCLR` 30, `SFLEND(*MORE)` 80, `SFLMSG('Invalid Option' 35)`, `RRB01 4S 0H SFLRCDNBR`; heading `COU200` / `Work with Countries` / `Type options, press Enter.` / `2=Edit` / `Opt`, `DATE` + `TIME` | `COU200D.DSPF:22-46` |
| Keys | `CA03(03)` `F3=Exit`, `CA12(12)` `F12=Cancel` (file level — both panels); `PRINT`; `ERRSFL`; `INDARA` | `COU200D.DSPF:8-11`, `:47-51` |
| Load counter | `RRN01 4 0` (defined by `Z-ADD0 RRN01 40`) — subfile RRN, also the `KSFILE` field | `COU200.RPG:5,31` |
| Page position | `LRRN` = WORKSTN INFDS positions 378–379 (binary) → copied into `RRB01` after each `EXFMT` when > 0 | `COU200.RPG:4,9-10,53-55` |
| Observable | full country list, `Bottom` on the last page; typing anything but `2` (or `0`) in `Opt` gives `Invalid Option` with the row highlighted | `COU200D.DSPF:16-17,31-32`; `COU200.RPG:74-81` |

## Behaviour as implemented

1. **Prepare.** `S01PRP`: `RRN01 = 0`, `SETON 30`, `WRITE CTL01` (clears the subfile), `SETOF 30`, `STEP01 = 'LOD'`. Runs once per program call — `*INZSR` sets `STEP01 = 'PRP'` and nothing ever sets it back. — `COU200.RPG:30-36,134-138`
2. **Load all.** `S01LOD`: `RRB01 = RRN01 + 1` (= 1, first page), `*LOVAL SETLL COUNTRY`, `READ COUNTRY` with **no lock** (`N` in column 53) and EQ indicator 80 = end of file; `DOWEQ *IN80 = *OFF`: `RRN01 += 1`, `WRITE SFL01`, `READ` again. Every record in key order (`COID`) is written; there is no count, no `SFLPAG` test, no upper bound other than the field size. `STEP01 = 'DSP'`. — `COU200.RPG:37-47`
3. **Display.** `S01DSP`: `SETON 32` (`SFLDSPCTL`), `RRN01 COMP 0` → indicator 31 (`SFLDSP`) on only when at least one row was loaded, `WRITE KEY01`, `EXFMT CTL01`; then `if LRRN > 0: RRB01 = LRRN` so the page the user was looking at is redisplayed next time. `STEP01 = 'KEY'`. — `COU200.RPG:48-57`
4. **Keys.** `S01KEY`: `*IN03` or `*IN12` → `PANEL = 0` → mainline `CABEQ 0 ENDPGM` → `SETON LR` (`c05`); anything else (Enter, or a roll key that reached the program — none can, see edge cases) → `STEP01 = 'CHK'`. — `COU200.RPG:58-67`, `:16-19`
5. **Check.** `S01CHK`: `STEP01 = 'ACT'`, `ERR01 = *OFF`, `*IN33` on (`SFLNXTCHG` for every re-written row); `READC SFL01` loop over changed rows: `OPT01 ≠ 0 and ≠ 2` → `STEP01 = 'DSP'`, `SETON 34 35`, and if this is the first error (`ERR01` off) `RRB01 = RRN01` (page to the offending row), `ERR01 = *ON`; `UPDAT SFL01` for **every** changed row (with 33 on, and 34 on for offending rows), `SETOF 34`. After the loop `SETOF 33`. — `COU200.RPG:68-88`
6. **Act.** `S01ACT` (`c06`): `READC SFL01`; EQ 99 (no more changed rows) → `STEP01 = 'DSP'`; `OPT01 = 2` → `PANEL = 2`, `STEP02 = 'PRP'`, `OPT01 = 0`, `UPDAT SFL01` (33 off → the changed flag and the option are cleared for that row). — `COU200.RPG:89-100`

## Validation rules found in code

- Option: `OPT01` must be `0` or `2`; anything else is `Invalid Option` (35) with `DSPATR(RI)` + `DSPATR(PC)` on the row (34 captured at `UPDAT` time). No other validation exists on panel 1. — `COU200.RPG:74-77`; `COU200D.DSPF:15-17,32`
- The field is `2Y 0` — the keyboard rejects non-digits before the program sees them (DDS numeric field — platform, inference). A typed `0` counts as a changed row and passes the check.
- All-or-nothing per Enter: one invalid option anywhere sends the program back to `DSP` **before** `S01ACT`, so valid `2`s typed on the same Enter are not actioned until the invalid one is corrected — they keep their `2` and their `SFLNXTCHG` flag and are picked up on the next Enter. — `COU200.RPG:76,83`

## Edge cases found in code

- **Empty file.** `RRN01 = 0` → 31 off → `SFLDSP` off: the heading, function keys and `Opt` column header display with no rows and no message; Enter re-runs `CHK` / `ACT` with nothing to read and redisplays. — `COU200.RPG:49-52`; `COU200D.DSPF:28`
- **Roll keys never reach the program.** `PAGEDOWN(25)` is conditioned `N80`; 80 is set by the end-of-file `READ` in `S01LOD` and is never turned off, so at every `EXFMT` the keyword is inactive and the controller pages the extendable subfile itself; rolling past the last page is refused by the controller with its own message (platform — inference). `*IN25` does not appear in the program. The `'dynamic subfile'` comment on the keyword describes a load-on-demand pattern that this program does not implement. — `COU200D.DSPF:26,31`; `COU200.RPG:40-45`
- **Size limits.** `RRN01` is `4 0` and an extendable subfile holds at most 9999 records (platform — inference); the 10 000th `WRITE SFL01` would fail with no handler. The key is `2A`, so the space is far larger than 9999 in principle, though a country table is not. Not a practical limit; recorded as the only bound in the load. — `COU200.RPG:31,42-43`
- **Stale list.** The load runs once per call. A rename made in panel 2 (`c02`) is written to the file but the subfile row keeps the old `COUNTR` / `COISO` (`c06`); a change made by another job is not seen until the program is re-entered from the menu. No F5 exists.
- **No-lock read, later lock.** Panel 1 reads with `N` (no lock), so listing never blocks or is blocked; the record is locked only by panel 2's `CHAIN` (`c02`, `c03`). — `COU200.RPG:40,44,111`
- **Page memory.** `LRRN` (378–379) is the lowest RRN on the displayed page; after an edit or an error-free Enter the same page comes back. On an invalid option the page jumps to the **first** offending row (`ERR01` latch), every offending row is reverse-image with the cursor attribute, and after that Enter `RRB01` reverts to `LRRN`. — `COU200.RPG:53-55,78-81`; `COU200D.DSPF:16-17,33`
- **`INDARA` without a program indicator DS.** The display file uses a separate indicator area; RPG/400 maps it to `*INxx` without a `KINDDS`-style declaration (platform — inference; the program compiles in the shipped estate). — `COU200D.DSPF:7`; `COU200.RPG:4-5`

## Dependencies

- `ATU_SRC/QDDSSRC/COUNTRY.PF` (`UNIQUE`, `REF(SAMREF)`, key `COID`; 3 fields, no delete flag — `c04`) — `:4-10`; `SAMREF.PF:18,20`
- `ATU_SRC/QDDSSRC/COU200D.DSPF` (compiles against `COUNTRY` via `REFFLD` — a compile-time dependency of the panel on the file layout, alongside `CUS250D` / `PRO250D` / `COU301D` listed in `c12`)
- Menu surface `menu-cmd-shell-c01` (option 21, Utilities group, no confirmation)
- Readers of the same file that this panel's writes affect: `c07` (`COU300` getter cache — a hit stays cached until a different code is requested), `c09` (`COU301` keyed window)

## Assumptions / unknowns

- Platform (RPG/400 + DDS, inference / runtime-confirmable): extendable-subfile paging by the controller; `SFLEND(*MORE)` texts; inactive `PAGEDOWN` under an off indicator; INFDS 378–379 meaning; `SFLRCDNBR` page positioning; `Y` field keyboard validation; `CA` keys return no data.
- Build: `COU200` is OPM — `CRTRPGPGM` options (e.g. `GENOPT`, `IGNDECERR`) are not in the tree (`iproj.json` delegates to `elias compile`); nothing on this card depends on them.
- **needs-SME (room):** retire-and-replace vs convert for the whole panel is `c13`'s question; this card records only what the list does.

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:4-5,7,9-10,12-19,21-29,30-36,37-47,48-57,58-67,68-88,89-100,134-138` · `ATU_SRC/QDDSSRC/COU200D.DSPF:6-11,12-21,22-46,47-51` · `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` · `ATU_SRC/QDDSSRC/SAMREF.PF:18,20` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:139-142` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:48,135,186` · `ATU_SRC/QRPGLESRC/PRO200.RPGLE:26,104,145` (contrast) · structural grep of `ATU_SRC/**` for `COU200` (3 hits), `*IN25` in the member (none), `INFSR` / `*PSSR` in the member (none)
