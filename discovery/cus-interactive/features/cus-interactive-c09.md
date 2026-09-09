# cus-interactive-c09 — Customer-by-id inquiry with prompt and not-found message (CUS250 FMT01)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUS250` `FMT01` asks for a customer id; F4 opens `FCUSTOMER.SltCustomer`; Enter chains `CUSTOME1` and either shows the detail (`c10`) or redisplays with `ERR0103 "Code &1 Unknown."` carrying the edited id.

## Entrypoints

- Menu option 8 `CALL CUS250` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:111-114`
- `FMT01` (`CUID` input, `CF04 'Prompt'`, `ERRMSGID(ERR0103 … 40 &ERRDATA)`) — `ATU_SRC/QDDSSRC/CUS250D.DSPF:13-32`
- State machine `panel = 1`: `S01prp → S01dsp → S01key → S01chk → S01act` — `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:44-110`

## Inputs / outputs / observables

- Input: `CUID` (5P 0 via `REF(CUSTOMER)`), F3, F12, F4. — `CUS250D.DSPF:7,11-12,15,27`
- Output: on miss, indicator 40 + `ERRDATA = %editc(id:'Z')` (6A) shown through `ERR0103`; on hit, `panel = 2` (`c10`). — `CUS250.PGM.RPGLE:99-102,106-110`

## Behaviour as implemented

1. `S01prp`: `CLEAR FMT01` (id → 0). — `:69-72`
2. `S01dsp`: `EXFMT FMT01`; `id = cuid`. — `:74-78`
3. `S01key`: F3 → `panel = 0` (end); F12 → `panel - 1` = 0 (**also ends the program**); F4 → `id = SltCustomer(id)` then straight to check; Enter → check. — `:80-94`
4. `S01chk`: `CHAIN id CUSTOME1`; not found → `NotFound` on, `ERRDATA = %editc(id:'Z')`, redisplay `FMT01`. — `:96-104`
5. `S01act`: `panel = 2`, `step01 = dsp` (so returning from panel 2 redisplays `FMT01` with the same id still typed). — `:106-110`
6. `SltCustomer` (`CUS301`) returns the selected `CUID` on option 1, or the passed-in default on F3/F12. — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:54-56,71,93,155-160,218-222`

## Validation rules found in code

- Existence only (`%found` on `CUSTOME1`). No check on `CUDEL`: soft-deleted customers are found and displayed (see `c11`). — `:98-99`
- No range check; id 0 is chained and reported as unknown.

## Edge cases found in code

- **F4 then cancel with a blank id**: `SltCustomer(0)` returns 0, chain fails, `ERRDATA = %editc(0:'Z')` = blanks, message reads "Code  Unknown." — `:85-87,99-102`
- F4 does not redisplay before checking: a valid selection goes directly to the detail screen. — `:85-87`
- `ERRDATA` is 6A while `CUID` is 5 digits; `%editc(:'Z')` yields a 5-character zero-suppressed string, left-justified into 6. — `CUS250D.DSPF:30`
- `CUSTOME1` is opened `keyed` input-only (`dcl-f custome1 disk keyed`), no lock. — `:7`
- `ERR0103` is a shared message ("Code &1 Unknown.", `FMT (*CHAR 6 0)`) also used by other by-id programs. — `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:19-20`
- Cycle-driven like `CUS200`: one state step per RPG cycle, `*INLR` only in `pnl00`. — `:44-51,169-171`
- Only caller found under `ATU_SRC` is the menu; no program calls `CUS250`. — `rg` over `ATU_SRC`

## Dependencies

- `FCUSTOMER.SltCustomer` — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79-80`, `CUS301.SQLRPGLE` (slice `cus-modules`, dep only); `CUS301D` display file.
- `CUSTOME1.LF`; `SAMMSGF.MSGF` `ERR0103`; `BNDDIR('SAMPLE')` — `CUS250.PGM.RPGLE:4`.

## Assumptions / unknowns

- Selection window layout/paging is `cus-modules` behaviour (`cus-modules-c*`), not documented here.

## Evidence

`ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:4,7,9-10,26,44-110,169-171` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:7,11-32` · `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:19-20` · `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:54-56,71,93,155-160,218-222` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:111-114`
