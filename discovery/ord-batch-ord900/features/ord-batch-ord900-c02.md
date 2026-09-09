# ord-batch-ord900-c02 — `ORD901` early exit when there are no orders: `SELECT MAX(ORDATE) INTO :lastdate` with no indicator variable, `IF lastdate = 0 → *INLR, RETURN`; the guard holds because a `NULL` aggregate leaves the host variable at its initial zero

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The first statement of `ORD901` is `exec sql select max(ordate) into :LastDate from order;` followed by `if lastdate = 0; *inlr = *on; return; endif;`. There is no indicator variable and no `sqlcod` / `sqlstt` test anywhere in the program. On an empty `ORDER` file `MAX` returns `NULL`; fetching `NULL` into a host variable without an indicator is an error (SQLCODE `-305`) that leaves the host variable **unchanged** (DB2 for i — inference), and `lastdate` is a standalone `8 0` field whose initial value is zero — so the test is true and the program ends before the update loop. The guard therefore works, but by way of an error path the code never looks at; the same test also fires if every order has `ORDATE = 0`, a state no in-tree writer produces (`ORD100` always writes today's date). The file `ORDER` is already open for update at that point (F-spec open at program start) and is closed by `LR`. `from order` is written **undelimited** here (and at `:43,45`) while the two statements at `:47,49` write `"ORDER"` — `sql-objects-c10` flagged the mixed spelling as a compile-time check; this card records where it sits.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:11-15` — the `SELECT … INTO`, the test, `*inlr = *on; return;`
- Program entry: menu `:menui option=81 action='cmd call ord901'` / `Reset Order dates to current … ORD901` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:147-150`

## Inputs / outputs / observables

- In: `ORDER` (`"ORDER"` — `ORDATE 8 0`). — `ATU_SRC/QDDSSRC/ORDER.PF:9`
- Out: none on this path. No message, no return code, no log entry.
- Observable: the program ends at once; `ORDER`, `DETORD`, `CUSTOMER` are untouched.

## Behaviour as implemented

1. **File open.** `forder UF E DISK` — `ORDER` is opened for update (arrival sequence) at program initialisation, before any statement runs. — `ORD901.PGM.SQLRPGLE:4`
2. **Aggregate into a host variable.** `select max(ordate) into :LastDate from order` — one row, one column, no `WHERE`, no indicator. — `ORD901.PGM.SQLRPGLE:11`
3. **Test and exit.** `if lastdate = 0; *inlr = *on; return; endif;` — `LR` on, so the file is closed and the program's storage is freed. — `ORD901.PGM.SQLRPGLE:12-15`
4. **Otherwise** continue to `c03` (`today`, `days`, the loop).

## Validation rules found in code

- "There must be at least one order" — implemented as `lastdate = 0`, which is *not* a direct test of the row count: it is true when the file is empty (via the `NULL` / `-305` path) **or** when the maximum `ORDATE` is literally zero.

## Edge cases found in code

- **Empty file — the intended case.** `MAX` over zero rows is `NULL`; with no indicator the `INTO` fails with `-305` and `lastdate` stays at its initial `0` (standalone numeric field, `d lastdate s 8 0`, no `INZ` → zero). The `if` catches it. Inference on the host-variable rule; runtime-confirmable by running option 81 on an empty `ORDER` and checking that no message is left. — `ORD901.PGM.SQLRPGLE:6,11-12`
- **Every order dated 0.** Same exit. Not reachable in-tree (`ORD100.PGM.RPGLE:194` writes `%dec(%date():*iso)`; `ORD901:21` only shifts a non-zero date — and a zero date would fail there, `c03`).
- **No error handling anywhere.** If the `SELECT` fails for another reason (file not found on `*LIBL`, authority), `lastdate` is still 0 and the program **exits silently** as if the file were empty — indistinguishable from the intended case without looking at the job log. — `ORD901.PGM.SQLRPGLE:11-15` (absence of `sqlcod` tests — structural read of the member)
- **Spelling.** `from order` undelimited (`:11`) — `ORDER` is an SQL reserved word; whether the precompiler accepts it as a table name is a compile-time fact not visible from source (`sql-objects-c10`; the build is `elias compile`, `iproj.json`). — `ORD901.PGM.SQLRPGLE:11,43,45,47,49`

## Dependencies

- `ORDER.PF` (shared PF — **dep**, not the slice).
- `c03` (what runs when the test is false), `c06` (file open mode and commitment stance).
- `sql-objects-c10` (naming contract — the undelimited `order`).

## Assumptions / unknowns

- Platform: `NULL` into a host variable without an indicator → SQLCODE `-305`, host variable unchanged; standalone numeric fields initialise to zero. Inference, runtime-confirmable.
- Whether `ORD901` was compiled at all with `from order` undelimited is a build question for the source owner (`sql-objects-c10`, `needs_sme`).

## Evidence

`ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:4,6,11-15,43-49` · `ATU_SRC/QDDSSRC/ORDER.PF:9` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:147-150` · `iproj.json:14-15` (build command) · structural read of the member for `sqlcod` / `sqlstt` / indicator variables (none)
