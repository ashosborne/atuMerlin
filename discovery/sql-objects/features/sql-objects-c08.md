# sql-objects-c08 — `ART801` / `UPDATE_ON_CUS_ORD_QTY` stored-procedure surface: `SPECIFIC ART801` makes it callable as program `ART801` from menu option 82 (`cmd call art801`); body = three `WHERE EXISTS`-guarded `UPDATE`s — behaviour under `ord-trigger-ord700-c10`

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is object-surface card, Phase B — surface for a behaviour already carded; points at `ord-trigger-ord700-c10`, does not re-derive the arithmetic) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md` — "Never widen ORD") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ART801.SQLPRC` creates an SQL procedure whose **SQL name** is `UPDATE_ON_CUS_ORD_QTY` and whose **specific name** is `ART801`. On DB2 for i the specific name is also the name of the generated program object (platform), which is why the menu can reach it with a plain CL `CALL`: option 82 "Reset Summary Fields" is `cmd call art801`, tagged `SQLPRC:ART801`. It takes no parameters and returns nothing. The body recomputes `ARTICLE.ARCUSQTY` (open orders), `CUSTOMER.CUCREDIT` (open orders) and `CUSTOMER.CULASTORD` (all orders), each `UPDATE` restricted by `WHERE EXISTS` so rows with no qualifying order are left untouched — all documented as-is at `ord-trigger-ord700-c10`, which also notes that `ORD901` carries the identical `CULASTORD` statement. The member is the *only* callable SQL routine in the estate that modifies data (the two `.SQLUDF` members are scalar functions — `dat-utils`; `ORD701.SQLTRG` is a trigger — `ord-trigger-ord700`). No program calls it; the menu is its sole entry.

## Entrypoints

- `SET PATH *LIBL ;` then `CREATE PROCEDURE UPDATE_ON_CUS_ORD_QTY ( ) LANGUAGE SQL SPECIFIC ART801 … BEGIN … END;` — `ATU_SRC/QSQLSRC/ART801.SQLPRC:4-38`
- Menu: `:menui option=82 action='cmd call art801' help=nohelp.` / `Reset Summary Fields … SQLPRC:ART801` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:151-154`
- No other caller (structural grep `ART801` / `UPDATE_ON_CUS_ORD_QTY`: the DDL, the menu; no `CALL` in any RPG / CL / COBOL member).

## Inputs / outputs / observables

- In: none (empty parameter list). Reads `"ORDER"`, `DETORD`. — `ART801.SQLPRC:6,23-37`
- Out: none (no `OUT` parameter, no result set). Writes `ARTICLE.ARCUSQTY`, `CUSTOMER.CUCREDIT`, `CUSTOMER.CULASTORD`. — `ART801.SQLPRC:23-37`
- Observable: the three fields as displayed by the ART / CUS screens and getters (`ord-trigger-ord700-c10` §Observables); the menu redisplays when the call returns. No message, no completion text.

## Behaviour as implemented

1. **Two names, one object.** `UPDATE_ON_CUS_ORD_QTY` is what `CALL UPDATE_ON_CUS_ORD_QTY()` from SQL would use; `ART801` is what `CALL ART801` from CL / RPG uses, because the `SPECIFIC` name becomes the `*PGM` object name (platform). The menu uses the second form. — `ART801.SQLPRC:6,8`; `SAMMNU.MENU:152`
2. **`SET PATH *LIBL`** precedes the `CREATE` and sets the SQL path used to resolve unqualified functions and procedures while the procedure is created (and, for a `LANGUAGE SQL` procedure, at run time — platform). The body calls no user function, so the path affects nothing today. — `ART801.SQLPRC:4`
3. **Body.** Three `UPDATE … SET col = (correlated aggregate subquery) WHERE EXISTS (same predicate)` statements, in the order `ARTICLE.ARCUSQTY`, `CUSTOMER.CUCREDIT`, `CUSTOMER.CULASTORD`. Comments in the source label them. The arithmetic, its asymmetries with `ORD700` / `ORD701`, and the "rows without open orders are not reset" consequence are `ord-trigger-ord700-c10` steps 1–5 — not repeated here. — `ART801.SQLPRC:22-37`
4. **No transaction, no handler.** `COMMIT = *NONE` and no `DECLARE … HANDLER`: each `UPDATE` is applied as it completes; a failure in statement *n* ends the procedure with that SQLSTATE and leaves statements 1..n−1 applied (`c09`). — `ART801.SQLPRC:14,21-38`
5. **Callers.** Menu option 82 only; the batch resets `ORD900` / `ORD901` (options 80 / 81) do not call it — `ORD901` re-implements statement 3 inline instead. — `SAMMNU.MENU:143-154`; `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50`

## Validation rules found in code

- None. No parameters to validate; no row-count check; no authority check beyond what `DYNUSRPRF = *USER` implies (`c09`).

## Edge cases found in code

- **Callable from anywhere the object is on `*LIBL`.** `cmd call art801` is an ordinary CL command on a UIM menu; any user who can open `SAMMNU` and has authority to the program and the files can run a full resync. — `SAMMNU.MENU:151-153`
- **Duplicate logic.** Statement 3 exists twice in the estate (`ART801:35-37`, `ORD901:46-50`) — a target that changes one must change both, or fold them (`ord-batch-ord900` owns `ORD901`; queue).
- **`"ORDER"` delimited six times** in this one member — the densest occurrence of the reserved-word trap (`c10`). — `ART801.SQLPRC:23,26,29,32,35,37`
- **Empty `%TEXT`.** The ARCAD header's text line is blank, so the object text of the created program is whatever the platform assigns (nothing from source). — `ART801.SQLPRC:2`

## Dependencies

- Behaviour: `ord-trigger-ord700-c10` (owner — not widened). Tables: `ORDER.PF`, `DETORD.PF`, `ARTICLE.PF`, `CUSTOMER.PF` (deps). Menu: `menu-cmd-shell-c01` (option 82 row). Related: `ord-batch-ord900` (`ORD901` duplicate statement), `c09` (interface facts), `c10` (naming).
- Existing target counterpart (cited read-only): the ORD conversion implemented the `ORD700` / `ORD701` side effects as Postgres triggers (`modern/db/schema.sql:150-155`); whether a batch reset equivalent to `ART801` exists there is an ORD-pack fact and was not checked or changed.

## Assumptions / unknowns

- Platform: `SPECIFIC` name = program object name for SQL procedures; `SET PATH` semantics; procedure ends at the first unhandled error. Inference, runtime-confirmable (`DSPOBJD ART801 *PGM`; `QSYS2.SYSROUTINES`).
- **needs-SME (room, ORD pack / ops):** who runs option 82, and when? The tree gives no schedule and no guard; the answer decides whether the target needs an operator-facing "reset summary fields" action at all or only the incremental maintenance.

## Evidence

`ATU_SRC/QSQLSRC/ART801.SQLPRC:2,4-38` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:143-154` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50` · `ATU_SRC/QSQLSRC/` listing (8 members: 1 `SQLPRC`, 2 `SQLUDF`, 1 `SQLTRG`, 2 `VIEW`, 1 `TABLE`, 1 `SQLSEQ`) · `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c10.md` (behaviour) · structural grep of `ATU_SRC/**` for `ART801` (DDL + menu), `UPDATE_ON_CUS_ORD_QTY` (DDL only)
