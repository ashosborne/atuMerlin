# sql-objects-c09 — `ART801` interface facts: `LANGUAGE SQL`, `NOT DETERMINISTIC`, `MODIFIES SQL DATA`, `CALLED ON NULL INPUT`; `SET OPTION COMMIT = *NONE`, `DYNUSRPRF = *USER`, `SRTSEQ = *HEX`, `ALWCPYDTA = *YES`, `ALWBLK = *ALLREAD`, `DECRESULT = (31,31,00)`, `DLYPRP = *NO`, `DYNDFTCOL = *NO`; no parameters, no result set, no handler

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is interface-contract card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The procedure header is fifteen lines of declarations that fix how the three `UPDATE`s run. The ones with a consequence for behaviour or for a port: **`COMMIT = *NONE`** — no commitment control, so the three statements are three independent, immediately-visible changes and a failure part-way leaves the earlier ones applied; **no handler** (`DECLARE … HANDLER` absent) — the first SQL error ends the procedure and the SQLSTATE surfaces to the caller (from the menu: a CL escape in the job log — inference); **`DYNUSRPRF = *USER`** — dynamic statements run under the *invoker's* profile (there are none in the body, so today it only says the procedure was compiled with the default); **`DECRESULT = (31,31,00)`** — maximum precision 31, maximum scale 31, minimum divide scale 0, which governs the `SUM` results assigned to `9P 2` / `8 0` columns; **`SRTSEQ = *HEX`** — irrelevant to the body (numeric comparisons only). The remaining options (`ALWBLK`, `ALWCPYDTA`, `DLYPRP`, `DYNDFTCOL`) are the platform defaults spelled out. `NOT DETERMINISTIC` and `MODIFIES SQL DATA` are accurate; `CALLED ON NULL INPUT` is vacuous with no parameters. There is no `DYNAMIC RESULT SETS`, no `OUT` parameter, no `RETURN` — the caller learns nothing from a successful run.

## Entrypoints

- Header — `ATU_SRC/QSQLSRC/ART801.SQLPRC:6-20`
- Body start / end — `ART801.SQLPRC:21,38`

## Inputs / outputs / observables

- Parameters: `( )`. — `ART801.SQLPRC:6`
- Result: none. — `ART801.SQLPRC:6-38` (no `DYNAMIC RESULT SETS`, no `RETURN`)
- Observable: on success nothing; on failure an SQL error escape from the `CALL` (inference) — the menu shows the message, the job log has the SQLSTATE.

## Behaviour as implemented

| # | Clause | Line | Effect on the body as written |
| ---: | --- | ---: | --- |
| 1 | `LANGUAGE SQL` | 7 | SQL PL body; the platform generates a C program named after `SPECIFIC` (`c08`) |
| 2 | `SPECIFIC ART801` | 8 | program / specific name `ART801` (`c08`) |
| 3 | `NOT DETERMINISTIC` | 9 | correct — results depend on table contents |
| 4 | `MODIFIES SQL DATA` | 10 | correct — three `UPDATE`s; also the reason it cannot be invoked from a read-only context |
| 5 | `CALLED ON NULL INPUT` | 11 | no effect — no parameters |
| 6 | `ALWBLK = *ALLREAD` | 12 | default; row blocking for read-only cursors — none in the body |
| 7 | `ALWCPYDTA = *YES` | 13 | default; the optimizer may use a copy of the data for the subqueries (no live-cursor concern here) |
| 8 | `COMMIT = *NONE` | 14 | **no commitment control**: each `UPDATE` is final on completion; no rollback on later failure |
| 9 | `DECRESULT = (31, 31, 00)` | 15 | `SUM(ODQTY - ODQTYLIV)` / `SUM(ODTOTVAT)` computed at precision 31 then assigned to `ARCUSQTY 5 0` / `CUCREDIT 9P 2` — an assignment overflow is an error, not a truncation (platform) |
| 10 | `DLYPRP = *NO` | 17 | default; dynamic statements prepared immediately — none in the body |
| 11 | `DYNDFTCOL = *NO` | 18 | default; no default collection for dynamic SQL — none in the body |
| 12 | `DYNUSRPRF = *USER` | 19 | default; dynamic SQL would run as the caller — none in the body. Static statements run under the program's adopted/`*USER` rules regardless (platform) |
| 13 | `SRTSEQ = *HEX` | 20 | default; no character comparison in the body |

— `ART801.SQLPRC:6-20`

1. **Transactionality.** Because of #8, "reset summary fields" is not atomic: `ARTICLE` may be reset while `CUSTOMER` is not if statement 2 or 3 fails. `ord-trigger-ord700-c10` step 4 records the same consequence from the behaviour side. — `ART801.SQLPRC:14,23-37`
2. **Error path.** No `DECLARE CONTINUE HANDLER` / `EXIT HANDLER`, no `SIGNAL`, no `GET DIAGNOSTICS`: the compound statement ends at the first failing statement and the error propagates to the `CALL` (platform). — `ART801.SQLPRC:21-38`
3. **Authority.** Static SQL in a `LANGUAGE SQL` procedure runs with the authority the platform gives the generated program (`*USER` for dynamic per #12; static follows the program's `USRPRF` attribute — default `*USER` — inference). The menu user therefore needs `UPDATE` on `ARTICLE` and `CUSTOMER` and `SELECT` on `"ORDER"` / `DETORD`, or an adopting program in the stack. — `ART801.SQLPRC:19`

## Validation rules found in code

- None. The header validates nothing about the data; there is no precondition check (e.g. "no other job updating orders") before the resync.

## Edge cases found in code

- **Overflow is an error.** `SUM(ODQTY − ODQTYLIV)` into `ARCUSQTY` (`5 0`, max 99 999) or `SUM(ODTOTVAT)` into `CUCREDIT` (`9P 2`, max 9 999 999.99): with #9 the sum is computed wide and the *assignment* fails for an out-of-range row — ending the whole statement (all rows of that `UPDATE` are rolled back as one statement — platform) and, with no handler, the procedure. Theoretical at the estate's size; noted because a target with wider columns would silently succeed where the source fails. — `ART801.SQLPRC:15,23-33`; `ATU_SRC/QDDSSRC/SAMREF.PF:47,50`; `ATU_SRC/QDDSSRC/CUSTOMER.PF:19`
- **Negative `ARCUSQTY`.** `ODQTY − ODQTYLIV` can be negative if more was delivered than ordered (`ord-trigger-ord700-c10` edge cases); nothing in the header or body prevents it.
- **Statement 3 has no `DETORD` join** (`"ORDER"` alone), so a customer whose only orders have no lines still gets `CULASTORD` set, while statements 1–2 skip line-less orders. — `ART801.SQLPRC:23-37`

## Dependencies

- `c08` (surface), `ord-trigger-ord700-c10` (behaviour), `c10` (naming); `SAMREF.PF` / `CUSTOMER.PF` (target column widths).

## Assumptions / unknowns

- Platform: default values of the listed `SET OPTION`s; error propagation without a handler; static-SQL authority model; assignment-overflow semantics. Inference, runtime-confirmable (`QSYS2.SYSROUTINES`, `DSPPGM ART801`, one deliberate failure).
- **needs-SME (room, ORD pack):** should the target's reset be atomic (one transaction) or reproduce the as-is "partial reset on failure"? Recommendation: atomic — no reader depends on a half-applied state, and the as-is behaviour is a consequence of `COMMIT = *NONE`, not a rule. Decision belongs to the room; recorded here.

## Evidence

`ATU_SRC/QSQLSRC/ART801.SQLPRC:6-38` · `ATU_SRC/QDDSSRC/SAMREF.PF:47-52` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:19-22` · `ATU_SRC/QDDSSRC/ARTICLE.PF:25-27` · `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c10.md` (steps 4–5, edge cases)
