# cus-interactive-c01 — List customers by name with position-to and paging

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUS200` panel 1 shows a subfile of customers ordered by name (`CUSTOME2`: key `CUSTNM`, `CUID`), loads 14 rows per load (two 7-row pages), supports a 10-character position-to-name field and page-down continuation from the last record read.

## Entrypoints

- Menu option 2 `CALL CUS200` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:87-90`
- Screen `CUS200D` record `CTL01`/`SFL01` (subfile control + subfile) — `ATU_SRC/QDDSSRC/CUS200D.DSPF:12-71`
- Program state machine: `panel = 1`, steps `prp → lod → dsp → key → (chk → act)` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:91-115`

## Inputs / outputs / observables

Inputs
- `POSTO` (10A, `CHECK(LC)`, lowercase allowed) position-to name — `CUS200D.DSPF:67`
- Function keys on `CTL01`: F3 exit, F12 cancel (file level), F5 refresh, F6 create, F11 fold/drop, Page Down (only while indicator 80 is off) — `CUS200D.DSPF:8-9,29-31,37`
- Cursor position (`INFDS` bytes 378-379 = subfile record number under cursor) — `CUS200.PGM.SQLRPGLE:62-63,163-165`

Outputs (per subfile row `SFL01`)
- `OPT01` (2Y 0, input), `CUID` (5P 0, `EDTCDE(Z)` via REFFLD), `CUSTNM` (30A), `CULIMCRE` (`EDTCDE(2)`), `CUZIP`, `CUDEL` under column "Del"; second (folded) line `CUCITY` — `CUS200D.DSPF:15-26`
- `SFLEND(*MORE)` "More..." / "Bottom" driven by indicator 80 — `CUS200D.DSPF:36`

## Behaviour as implemented

1. **Prepare** (`s01prp`): clear the subfile (`SFLCLR`), `savId = 0`, `savName = POSTO`, clear `POSTO`, saved rrn `rrs01 = 0`. — `CUS200.PGM.SQLRPGLE:117-127`
2. **Load** (`s01lod`): `SETLL (savName : savId) CUSTOME2` then read forward writing up to **14** rows, incrementing `rrn01` from the saved rrn; `sflend = %eof`. Display starts at `RRB01 = rrn01 + 1` (first unseen row). — `:129-149`
3. **Save last read** (`s01sav`): after the loop the file buffer holds the 15th (not yet written) record, or the 14th on EOF; its `CUID`/`CUSTNM` and `rrn01` are saved so the next load resumes exactly there. — `:151-155`
4. **Display** (`s01dsp`): `SFLDSPCTL` on, `SFLDSP` only if `rrn01 > 0`; write `KEY01` then `EXFMT CTL01`. If the cursor was on a subfile row, `RRB01` is set to that row so the same page redisplays. — `:157-167`
5. **Keys** (`s01key`): F3 → program end (`panel = 0`); F12 → `panel - 1` = 0, i.e. **F12 on the list also ends the program**; F5 → back to prepare (reload from blank position-to); Page Down → load next 14; anything else → option check (`c12`). — `:169-191`
6. **Enter with a non-blank `POSTO` and no options** → back to prepare, so the list re-positions to the typed name. Enter with blank `POSTO` and no options → redisplay. — `:215-223`
7. Subfile is `SFLSIZ(15)`/`SFLPAG(7)` so previously loaded pages stay in the subfile; roll-up within loaded rows is handled by the workstation controller, `PAGEDOWN(25)` fires only past the last loaded row, and is disabled once EOF (`N80`). — `CUS200D.DSPF:29,38-39`
8. Rows are never re-read after an update or create; the list shows stale data until F5, page down, or a position-to. — `:224-229,321-329` (no reload path back into `lod`)

## Validation rules found in code

- None on `POSTO` beyond DDS `CHECK(LC)`.

## Edge cases found in code

- Position-to is a **partial key** on `CUSTNM` with `CUID = 0`: positions at the first record whose (`CUSTNM`, `CUID`) ≥ (`POSTO` padded to 30, 0). `POSTO` is 10 characters into a 30-character key, so only a prefix can be given. — `:124,147`, `SAMREF.PF:24`
- Ordering and positioning are by the logical file collation (EBCDIC, case-sensitive) — lowercase entry is allowed by `CHECK(LC)` but not folded.
- Soft-deleted customers (`CUDEL = 'X'`) are **listed**, with the flag shown in the "Del" column; no filter (see `c11`). — `CUS200D.DSPF:22`
- The RPG cycle drives the state machine: the mainline `SELECT` runs once per cycle and the program ends only when `pnl00` sets `*INLR` (`panel = 0`). — `:91-98,339-341`
- No PAGEUP keyword; no help panel linked (`SAMHELP` has a `CUS200` help name but body is the placeholder "Text"; `CUS200D` has no `HLPPNLGRP`). — `SAMHELP.PNLGRP:8-9`

## Dependencies

- `CUSTOME2.LF` (keys `CUSTNM`, `CUID`) — `ATU_SRC/QDDSSRC/CUSTOME2.LF:4-6`; `CUSTOMER.PF` fields — `CUSTOMER.PF:5-29`; `SAMREF.PF` field definitions.
- Display file `CUS200D`.

## Assumptions / unknowns

- `INFDS` positions 378-379 read as `lrrn` are the standard subfile-cursor-rrn location; behaviour when the cursor is not on a subfile row (`LRRN = 0`) leaves `RRB01` as set by the load. Static derivation, not run.
- Actual roll behaviour within the extended subfile is workstation-controller behaviour, not in program source.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:28,62-63,91-98,117-167,169-191,215-223` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:12-71` · `ATU_SRC/QDDSSRC/CUSTOME2.LF:4-6` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:87-90`
