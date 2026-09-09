# dat-utils-c05 — Error path: SQLSTATE 38I02 with the program-status exception text

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Both programs end with a `*PSSR` program-status subroutine that turns any unhandled RPG exception into an SQL error: `SQL_State = '38I02'` (user-defined `38xxx` class, so DB2 raises `SQL0443` "trigger program or external routine detected an error") and `Msg_Text = %trimr(stExcText)` — the 80-character exception text from the program status data structure, truncated to the 70-character `VARYING` message parameter — then `return`. An **invalid date is not an error**: `test(de)` absorbs it and the function returns NULL (`c01`, `c02`); `*PSSR` is reached only by exceptions the body does not monitor.

## Entrypoints

- `DAT001` `*PSSR` — `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:53-60`
- `DAT002` `*PSSR` — `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:59-66`
- Status data structure `sds` — `stPgmName 1-10`, `stExcText 91-170` — `DAT001.PGM.RPGLE:7-11`, `DAT002.PGM.RPGLE:7-11`
- `Msg_Text 70 varying` in the `pi` — `DAT001.PGM.RPGLE:39`, `DAT002.PGM.RPGLE:39`

## Inputs / outputs / observables

- In: the exception text placed in the SDS by the runtime (positions 91–170). — `DAT001.PGM.RPGLE:11`
- Out: `SQL_State = '38I02'`; `Msg_Text` = trimmed exception text (≤ 70 characters); `date_ind` **unchanged** (still `0` from the start of the call) and `date` untouched. — `DAT001.PGM.RPGLE:57-58,42`, `DAT002.PGM.RPGLE:63-64,42`
- Observable: the calling SQL statement fails with `SQLSTATE 38I02`; in `ORD200` / `ORD201` this is a non-zero `SQLCODE` on the `fetch`, which ends the list load silently (`c03`). No message is written to the job log by the programs themselves.

## Behaviour as implemented

1. Body raises an exception that no `(e)` extender or `monitor` covers.
2. Runtime invokes `*PSSR`: `SQL_State='38I02'; Msg_Text=%trimr(stExcText); return;`. — `DAT001.PGM.RPGLE:57-59`, `DAT002.PGM.RPGLE:63-65`
3. `return` from `*PSSR` hands control back to DB2 with the parameters as set; the program stays active (`c06`).

Derived (analysis, not observed at run time): with `test(de)` covering the date validation and no I/O, arithmetic, array or string operations in the body, the only exceptions the code can raise are numeric ones on `dat8` — a decimal-data error when the `8 0` argument holds invalid packed data (`dat8 = 0` compares the field, `test` and `%date` read it). The `*PSSR` is therefore a safety net rather than a reachable branch under valid data. If an exception occurred *inside* `*PSSR` (none is plausible in these three lines) the standard RPG behaviour is to re-enter `*PSSR`, looping.

## Validation rules found in code

None — the subroutine does not inspect the exception id, `stPgmName`, `Function_Name` or `Specific_Name`, and returns the same `SQLSTATE` for every exception.

## Edge cases found in code

- **Message truncation.** `stExcText` is 80 characters; `Msg_Text` is `70 varying`, so the assignment keeps the first 70 characters after right-trim. The comment in the source says exactly this. — `DAT001.PGM.RPGLE:55,58`
- **`date_ind` is left at `0` on the error path.** Harmless because DB2 ignores the result when `SQLSTATE` is an error class, but a port that maps "error" to "return NULL" would be changing behaviour: as-is the statement fails, it does not produce a NULL row.
- **`38I02` is an arbitrary code.** `38` is the user-defined external-routine class; `I02` carries no meaning elsewhere in the tree (single occurrence in both members). Callers do not test for it.
- **No `*inlr` after an error.** The program remains active with whatever state the exception left; there is no state to corrupt (`c06`).

## Dependencies

- Program status data structure (RPG runtime). — `DAT001.PGM.RPGLE:7-11`
- `c04` (where `SQL_State` / `Msg_Text` sit in the interface), `c06`.

## Assumptions / unknowns

- Whether `SQL0443` surfaces to a 5250 user in `ORD200` / `ORD201` is a caller-slice question (they check only `sqlcod = 0`); as read, it does not — the list simply stops.

## Evidence

`ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:7-11,39,42,53-60` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:7-11,39,42,59-66` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:121-131` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:117-125`
