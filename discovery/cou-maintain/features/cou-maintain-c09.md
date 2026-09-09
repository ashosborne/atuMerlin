# cou-maintain-c09 — SltCountry selection window (keyed read, by code or by name)

| | |
| --- | --- |
| Slice | `cou-maintain` (FCOUNTRY half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`; FCOUNTRY half only) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SltCountry(pcod)` opens the `COU301D` window "Select a Country Code" (18 rows × 42 columns at row 4, column 25) over `COUNTRY` — a **native keyed read**, not SQL (contrast `SltCustomer`, `cus-modules-c06`). The list is positioned at the caller's current code (`SETLL pcod`) in by-code order, or at a typed name in by-name order over the logical `COUNTR1`, and is loaded **20 rows per Page Down** into an extendable subfile (`SFLSIZ 11 / SFLPAG 10`, so two pages per load). Option `1` on exactly one row returns that row's `COID`; F3 or F12 returns `pcod` unchanged. There is no filter, no search field and no "not found" message: an empty result shows the window frame with no rows.

## Entrypoints

- Exported symbol `SLTCOUNTRY` — `ATU_SRC/QSRVSRC/FCOUNTRY.BND:8`; prototype `SltCountry PR 2a; COID 2A` (**by reference**, no `value`) — `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:22-23`
- Implementation `P sltcountry B export … PI like(coid); pcod like(coid)` — `ATU_SRC/QRPGLESRC/COU301.RPGLE:53-55`; body `:69-250`
- Display file `COU301D`: `SFL01` — `ATU_SRC/QDDSSRC/COU301D.DSPF:18-26`; `CTL01` — `:27-68`; `KEY01` (window definition + footer) — `:69-80`
- Callers (F4 on the edit panel; call sites only): `CUS200` `cucoun = SltCountry(cucoun)` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:281-284` (`CF04(04)` on `FMT02`, `ATU_SRC/QDDSSRC/CUS200D.DSPF:86`); `PRO200` `prcoun = SltCountry(prcoun)` — `ATU_SRC/QRPGLESRC/PRO200.RPGLE:236-239` (`ATU_SRC/QDDSSRC/PRO200D.DSPF:68`)

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| Parameter `pcod` | 2A by reference; copied to `keycod` (initial position) and `dft` (return on cancel); never written | `COU301.RPGLE:55,73-74` |
| Files | `country IF E K DISK` (by `COID`), `countr1 IF E K DISK` renamed `REC52` (by `COUNTR`) — both module-level, not `USROPN`, never closed | `COU301.RPGLE:6-8`, `ATU_SRC/QDDSSRC/COUNTRY.PF:10`, `ATU_SRC/QDDSSRC/COUNTR1.LF:4-5` |
| Window | `KEY01` `WINDOW(4 25 18 42)`; `CTL01` `WINDOW(KEY01)`; title row 1 col 22 `'Select a Country Code'`; program id `'COU301'` row 1 col 1 | `COU301D.DSPF:31,42-43,63,72` |
| Row | `OPT01 1Y 0B` col 3 (`EDTCDE(Z)`, `DSPATR(RI)`/`(PC)` on 34), `COID` col 5, `COUNTR` col 9 — both output, `REFFLD(… COUNTRY)` | `COU301D.DSPF:21-26` |
| Control line | `OPTC1 1Y 0B` row 5 col 3 (`8=Position to`); `POSCOD` row 5 col 5 (shown when not by-name, ind 40 off); `POSDES` row 5 col 9 with `CHECK(LC)` (shown when by-name) | `COU301D.DSPF:50-54,60-62,65-68` |
| Subfile geometry | `SFLSIZ(0011) SFLPAG(0010)` → extendable; `SFLEND(*MORE)` on 80; `PAGEDOWN(25)` active while `N80`; `SFLRCDNBR` = `RRB01` | `COU301D.DSPF:29-30,33,38,41` |
| Keys | `CA03(03)`, `CA12(12)` file level; `CF08(08)` on `CTL01` (toggle, `c10`); `INDARA`, `ERRSFL`, `PRINT` | `COU301D.DSPF:7-11,32` |
| Messages | `SFLMSG` 35 `'INVALID OPTION'`, 36 `'ONLY ONE SELECTION'`; `ERRMSG` 41 `'Invalid option'`, 42 `'Position to not available with selection pending'` (`c11`) | `COU301D.DSPF:39-40,51-53` |
| Return | 2A — the selected row's `COID`, or `dft` | `COU301.RPGLE:92,244` |
| `INFDS` | `LRRN` bytes 378–379 = subfile RRN under the cursor → keeps the page on redisplay | `COU301.RPGLE:10,13-14,149` |
| Load size | `TELLER < 20` rows per `S01lod` | `COU301.RPGLE:125-126` |

## Behaviour as implemented

1. **Entry.** Open guard on the display file; `keycod = pcod; dft = pcod; bydesc = *off;` then a `step01` state machine `prp → lod → dsp → key → {lod | chk → act | ' '}`. `step01` is a procedure local `inz(prp)`, `keydes` is a procedure local (blank), so every call starts in by-code order positioned at `pcod`. Loop exits when `step01 = ' '` → `return dft`. — `COU301.RPGLE:57,67,70-92`
2. **`s01prp` (clear + position).** `RRS01 = 0; clear CTL01` (this blanks `OPTC1`, `POSCOD`, `POSDES`, `RRB01`); `SFLCLR` written; then `setll KEYCOD country; read country` (by code) or `setll KEYDES countr1; read countr1` (by name); `sflend = %EOF`; the record just read is saved in `SAVCOD`/`SAVDES` as a one-row look-ahead. — `:95-115`
3. **`S01lod` (page).** Resume `RRN01` from `RRS01`; `RRB01 = RRS01 + 1` (display jumps to the first newly loaded row); restore the look-ahead row into `coid`/`countr`; `dow not sflend and TELLER < 20: RRN01 += 1; write SFL01; read next; sflend = %EOF`. The record that hits EOF is never written; "Bottom" appears when the look-ahead read fails, so exactly 20 rows left shows Bottom at once. — `:117-141`
4. **`S01dsp`.** `sfldsp = rrs01 > 0` (no rows → subfile hidden, control record only, no message); `write KEY01; exfmt CTL01; IN08 = CF08; RRB01 = LRRN`. — `:143-151`
5. **`S01key`.** F3 (`exit`) or F12 (`cancel`) → `' '`; Page Down → `lod` (next 20 rows in the current order); anything else (Enter, F8) → `chk`. — `:153-164`
6. **`S01chk`** — row and control-line option validation (`c11`). **`S01act`** — F8 toggle (`c10`), position-to (`c11`), or selection: `readc SFL01` until a row with `OPT01 = 1` → `return coid` (the subfile row's `COID`, because the `SFL01` field and the file field share one name and storage). Plain Enter with nothing typed falls through to `dsp` (redisplay). — `:222-249`
7. **Return contract at the callers.** Both callers pass their current code field and assign the result back, then refresh the name with `GetCountryName`; cancel therefore leaves the field unchanged and the redisplay happens **without validation** (`cus-interactive-c05`). — `CUS200.PGM.SQLRPGLE:281-284`, `PRO200.RPGLE:236-239`

## Validation rules found in code

Option rules only (`c11`). No validation of `pcod` (a code that does not exist positions at the next greater key; blank positions at the top), of the position-to text, or of result size.

## Edge cases found in code

- **Position beyond the last key gives an empty window.** `SETLL` past the last `COID` / `COUNTR` → first `read` hits EOF → `rrs01 = 0` → `sfldsp` off: the frame, legend and control line show with no rows and no message (`SFLEND` text is not displayed when the subfile is hidden). Recovery is option 8 with a blank position (back to the top) or F8. — `COU301.RPGLE:103-111,144`
- **Two pages per load.** `SFLPAG 10` with 20 rows written: the first Page Down after entry is served by the display from already-loaded rows; the program is entered only when the last loaded page is shown (`PAGEDOWN` under `N80`). After Bottom, `PAGEDOWN` is inactive (`N80`) and the key is handled by the system without entering the program. Page Up: no `PAGEUP` keyword → the system rolls back through loaded rows. — `COU301D.DSPF:29-30,33`, `COU301.RPGLE:125-126`
- **Look-ahead row survives a redisplay but not a re-prepare.** `SAVCOD`/`SAVDES` are rewritten after each load; option 8 / F8 go through `prp`, which repositions and re-reads. — `COU301.RPGLE:112-113,136-137`
- **`SFLNXTCHG` on every read row.** `S01chk` turns indicator 33 on before the `readc` loop and `update`s each changed row, so a row whose option was typed and then blanked keeps coming back through `readc` on later Enters (with `OPT01 = 0`, harmless). — `:174-175,203`
- **By-reference parameter.** The prototype passes `COID` by reference (no `value`), unlike `SltCustomer` (`5P 0 value`) — a caller cannot pass a literal or expression; both in-tree callers pass the field itself. The procedure never writes `pcod`. — `COUNTRY.RPGLEINC:22-23`, compare `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79-80`
- **Two more ODPs on `COUNTRY`.** `COU301` has its own `COUNTRY` and `COUNTR1` opens, independent of `COU300`'s cached getter ODP (`c07`); all are opened once and never closed (`c08`). The display file is never closed either, so `bydesc`/window state persist only via indicators reset at entry. — `COU301.RPGLE:6-9,70-75`
- **Declared but unused:** `pdes`, indicators `help`, `prompt`, `refresh`, `create`, `morekeys`, constants `chkctl`, `actctl`. — `:19-27,47-48,66`
- **Country name shown, ISO-3 not.** The window lists `COID` and `COUNTR` only; `COISO` never appears (`c08`). — `COU301D.DSPF:25-26`

## Dependencies

- `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` (`UNIQUE` key `COID`), `ATU_SRC/QDDSSRC/COUNTR1.LF:4-5` (key `COUNTR`, not unique — duplicate names list in arrival order within the key)
- `ATU_SRC/QDDSSRC/COU301D.DSPF` (owned by this slice; only `COU301` uses it); `ATU_SRC/QDDSSRC/SAMREF.PF:18,20-21` for field lengths
- `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:22-23`, `ATU_SRC/QSRVSRC/FCOUNTRY.BND:8`, `ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:8-9` (`c12`)
- Template twin: `sltArtFam` in `ATU_SRC/QRPGLESRC/FAM301.RPGLE` / `FAM301D.DSPF` (`fam-maintain`, unbound) — same code modulo names, window geometry (`WINDOW(4 13 18 62)`) and the toggle lines (`c10`)

## Assumptions / unknowns

- Whether a `nomain` module's non-`USROPN` files are opened at module initialisation or at the first procedure call is a compiler detail; either way they are opened once per activation group and never closed by this code.
- `needs-SME` (target): should the selector show a "no countries from this position" message instead of an empty frame, and should it keep the `pcod` positioning across the F8 toggle (`c10`)? As-is behaviour is documented; the target rule is a room decision.
- The converted CUS vertical's dependency surface exposes `listCountries()` ordered by code (`modern/src/shared/fcountry/index.ts`) — a flat list, not a positioned keyed read with a name order. Pointer only; not changed here.

## Evidence

`ATU_SRC/QRPGLESRC/COU301.RPGLE:4-14,16-49,53-92,95-164,222-252` · `ATU_SRC/QDDSSRC/COU301D.DSPF:6-80` · `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:22-23` · `ATU_SRC/QSRVSRC/FCOUNTRY.BND:8` · `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` · `ATU_SRC/QDDSSRC/COUNTR1.LF:4-5` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:281-284` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:86` · `ATU_SRC/QRPGLESRC/PRO200.RPGLE:236-239` · `ATU_SRC/QDDSSRC/PRO200D.DSPF:68` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79-80`
