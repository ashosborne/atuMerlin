# cus-modules-c06 — SltCustomer selection window

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SltCustomer(pcod)` shows `CUS301D` "Select a Customer": a subfile over a dynamically prepared `SELECT CUID, CUSTNM, CUCITY, CUCOUN FROM CUSTOMER` filtered by contains-matches on name and/or city, ordered by name, loaded 14 rows at a time on Page Down. Option `1` on exactly one row returns that row's `CUID`; F3 or F12 returns `pcod` unchanged. SQL failures are silent (empty list).

## Entrypoints

- Exported symbol `SLTCUSTOMER` — `ATU_SRC/QSRVSRC/FCUSTOMER.BND:19`; prototype `sltcustomer PR 5p 0; CUID 5P 0 value` — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79-80`
- Implementation `P sltcustomer B export … PI 5 0; pcod 5 0 value` — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:54-56,71-230`
- Display file `CUS301D`: `SFL01` — `ATU_SRC/QDDSSRC/CUS301D.DSPF:13-23`; `CTL01` — `:24-57`; `KEY01` — `:58-66`
- Callers: `CUS250` F4 `id = SltCustomer(id)` — `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:86`; `ORD100` `*inzsr` `orcuid = SltCustomer(0)`, `0` treated as abort — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:320-324`

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| Parameter `pcod` | `5 0` by value; copied to `dft`, returned on F3/F12 | `CUS301.SQLRPGLE:56,75,93` |
| `SRCHNAME`, `SRCHCITY` | 10A input fields, rows 2–3 col 27; no `CHECK(LC)` | `CUS301D.DSPF:54-57` |
| `OPT01` | `1Y 0B` per subfile row, `EDTCDE(Z)`, `DSPATR(RI)`/`DSPATR(PC)` on 34 | `CUS301D.DSPF:16-19` |
| Row columns | `CUID` col 5 (`EDTCDE(Z)` via `SAMREF`), `CUSTNM` col 11, `CUCITY` col 42, `CUCOUN` col 73 (code only) | `CUS301D.DSPF:20-23`, `ATU_SRC/QDDSSRC/SAMREF.PF:15-17` |
| Subfile geometry | `SFLSIZ(0015) SFLPAG(0014)` → extendable; `SFLEND(*MORE)` on 80; `PAGEDOWN(25)` active only while `N80`; `SFLRCDNBR` = `RRB01` | `CUS301D.DSPF:27,32-34,37` |
| Keys | `CA03(03)`, `CA12(12)` file level; `CF08(08)` on `CTL01` (no handler); `PRINT`; `ERRSFL`; `INDARA` | `CUS301D.DSPF:8-12,26` |
| Return | `5 0` — selected `CUID`, or `dft` | `CUS301.SQLRPGLE:93,222` |
| SQL | dynamic statement in `stm` (500 varying), `PREPARE s1`, cursor `C1` | `CUS301.SQLRPGLE:70,103-122` |
| `INFDS` | `LRRN` = bytes 378-379 (subfile RRN under the cursor) → keeps the page on redisplay | `CUS301.SQLRPGLE:7,10-11,151` |

## Behaviour as implemented

1. **Entry.** Open guard on the display file (`if not %open … open`), `dft = pcod`, then a `step01` state machine: `prp → lod → dsp → key → {lod | chk → act | ' '}`. `step01` is a procedure local with `inz(prp)`, so every call starts at `prp` regardless of how the previous call ended. Loop exits when `step01 = ' '`: `exec sql close c1; return dft;`. — `CUS301.SQLRPGLE:61,72-93`
2. **`s01prp` (build + first fetch).** `RRS01 = 0`; subfile cleared (`SFLCLR` on, write `CTL01`); statement assembled from the criteria (`c09`, `c11`) + `' ORDER BY CUSTNM'`; criteria saved in `savName`/`savCity`; `PREPARE`, `DECLARE`, `OPEN`, then one `FETCH` into `data`, stashed in `savData` (one-row look-ahead). — `CUS301.SQLRPGLE:96-124`
3. **`S01lod` (page).** Resume `RRN01` from `RRS01`; restore the look-ahead row; `RRB01 = RRS01 + 1` (page shows the newly loaded rows); write rows while `sqlcod = 0 and TELLER < 14`, fetching the next row after each write; `sflend = sqlcod <> 0` — "Bottom" appears only when the look-ahead `FETCH` fails (so a result of exactly 14 rows shows Bottom at once; 15 rows show More… then a 1-row page). `OPT01 = 0`, `SflNxtChg` off for fresh rows. — `CUS301.SQLRPGLE:126-144`
4. **`S01dsp`.** `sfldsp = rrs01 > 0` (no rows → subfile hidden, control record only, no message); write `KEY01`; `exfmt CTL01`; `RRB01 = LRRN` so a plain redisplay keeps the current page. — `CUS301.SQLRPGLE:146-153`
5. **`S01key`.** F3 (`exit`) or F12 (`cancel`) → `step01 = ' '`; Page Down → `lod`; anything else (Enter, F8) → `chk`. — `CUS301.SQLRPGLE:155-166`
6. **`S01chk`** — option validation, `c07`. **`S01act`** — criteria-change check then selection, `c08`: `readc` for the first row with `OPT01 = 1` → `exec sql close c1; return cuid;` (the row's own `CUID`, since the `data` DS subfields share names with the `SFL01` fields). — `CUS301.SQLRPGLE:211-227`, `:37-41`
7. **Return contract observed at callers.** `ORD100` passes `0` and treats a returned `0` as "no customer, abort" (`panel = 0`); `CUS250` passes the current id so cancel is a no-op. — `ORD100.PGM.RPGLE:320-324`, `CUS250.PGM.RPGLE:86`

## Validation rules found in code

Option rules only (`c07`). No validation of `pcod`, of the criteria text, or of the result set size.

## Edge cases found in code

- **Silent SQL failure.** No `SQLCODE`/`SQLSTATE` test after `PREPARE`/`DECLARE`/`OPEN`/`FETCH`. A syntax error (e.g. a `'` in the criteria, `c09`) leaves `sqlcod <> 0`: no rows are written, `sflend` goes on, the user sees an empty list with "Bottom" and no message. — `CUS301.SQLRPGLE:119-122,133-140`
- **Criteria persist across calls.** `SRCHNAME`/`SRCHCITY` are display-file fields (module-global) and the display file is never closed (no `close`, no `*INLR` in a `nomain` module). The next `SltCustomer` call in the same activation group starts `prp` with the **previous** criteria already applied and shown. First call: blanks → list all (`c11`).
- **Case handling.** `UPPER()` is applied to the columns only; the typed text is not uppercased in code. The input fields have no `CHECK(LC)`, so a 5250 session converts typed lowercase to uppercase before the program sees it (system behaviour, inferred) — net effect case-insensitive from a terminal. — `CUS301.SQLRPGLE:105-113`, `CUS301D.DSPF:56-57`
- **Wildcards.** `%`/`_` typed by the user are SQL `LIKE` wildcards; `%trim` removes surrounding blanks; match is "contains" anywhere in the 30-char column using at most 10 typed characters.
- **F8 behaves like Enter.** `CF08(08)` is enabled on `CTL01` but `S01key` has no branch for it → `chk`. The legend `'F8=By code'` is conditioned on indicator 40 (`bydesc`), which the program never sets, so it never displays; `'F12=Cancel'` occupies the same position. — `CUS301D.DSPF:26,63-65`, `CUS301.SQLRPGLE:32,161-165`
- **Paging.** Page Down after Bottom: `PAGEDOWN` inactive (`N80`) → the system handles the key, the program is not called. Before Bottom: 14 more rows appended (RRN keeps growing; subfile max is system-defined). Page Up: no `PAGEUP` keyword → the system rolls back through already loaded rows. Page Down with changed criteria: goes straight to `lod` (old result set) — criteria are only re-applied on Enter (`c08`).
- **Empty result.** Control record only; no "not found" text; F3/F12 return `dft`.
- Declared-but-unused indicators `help, prompt, refresh, create, cf08, morekeys, InvalidOptC, NotAvail` and the flag `sts01` (set, never read) — `CUS301.SQLRPGLE:16-34,63,172,183,203`.
- Country shown as 2-char code; no `FCOUNTRY` lookup. Soft-deleted customers (`CUDEL = 'X'`) are listed — no filter in any branch (`c11`).
- `exec sql close c1` runs on every exit path even when the cursor never opened; the resulting SQL error is unchecked and harmless. — `CUS301.SQLRPGLE:92,216,221`

## Dependencies

- `CUSTOMER` physical file via SQL (not `CUSTOME1`) — `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-29`; field refs `ATU_SRC/QDDSSRC/SAMREF.PF`
- `ATU_SRC/QDDSSRC/CUS301D.DSPF` (owned by this slice; only `CUS301` uses it)
- SQL runtime: dynamic `PREPARE`, cursor `C1`; no `SET OPTION` in source (commitment control / isolation are compile defaults)
- `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79-80`, `ATU_SRC/QSRVSRC/FCUSTOMER.BND:19`, `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9`

## Assumptions / unknowns

- Activation group of the open display file and SQL cursor (`ACTGRP(*CALLER)`) — runtime.
- Whether a `nomain` module's non-`USROPN` display file is opened at module initialisation or by the `open` guard is a compiler detail; either way it is opened once and never closed by this code.
- Bind open question (from `SME_BRIEF`): is `SltCustomer` ever called with a non-zero default that the caller expects back on cancel? Only `CUS250` does so in `ATU_SRC` (current id).

## Evidence

`ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:4-11,13-50,54-93,96-166,211-230` · `ATU_SRC/QDDSSRC/CUS301D.DSPF:6-66` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79-80` · `ATU_SRC/QSRVSRC/FCUSTOMER.BND:19` · `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:86` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:320-324` · `ATU_SRC/QDDSSRC/SAMREF.PF:15-17`
