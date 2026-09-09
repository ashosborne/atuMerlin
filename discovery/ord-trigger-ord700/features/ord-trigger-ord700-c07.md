# ord-trigger-ord700-c07 — ORD701 sets customer last-order date on order insert

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD701_Insert_order` is an SQL `AFTER INSERT ... FOR EACH ROW` trigger on `ORDER` that runs `UPDATE Customer SET culastord = n.ordate WHERE cuid = N.orcuid`. It stamps the customer's "Last Order Date" with the **inserted order's date, unconditionally** — no comparison with the existing `CULASTORD`, no `MAX`, no check that the customer exists or is not soft-deleted, no touch of `CUMOD` / `CUMODID`. The only in-tree writer that inserts `ORDER` rows is `ORD100` at confirm (`write forde`, before the lines are written), with `ORDATE = today` in `yyyymmdd`. There is no update or delete trigger on `ORDER` in source (the consequence is `c08`, needs-SME).

## Entrypoints

- `CREATE TRIGGER ORD701_Insert_order AFTER INSERT ON order REFERENCING NEW AS N FOR EACH ROW PROGRAM NAME ORD701 SET OPTION sqlPath = *LIBL` — `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-16`
- Firing writer in `ATU_SRC`: `ORD100` `s01act` confirm → `write forde`. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10,188-197`

## Inputs / outputs / observables

- In: the new `ORDER` row — `N.ORCUID` (`CUID`), `N.ORDATE` (`8 0`, `yyyymmdd`). — `ATU_SRC/QDDSSRC/ORDER.PF:5-10`
- Out: `CUSTOMER.CULASTORD` (`8 0`, "Last Order Date") for `CUID = N.ORCUID` set to `N.ORDATE`. — `ORD701.SQLTRG:14-15`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:21-22`
- Observables in tree: `CUS200` shows it as a date when non-zero (`LASTORD = %date(CULASTORD:*iso)`); `CUS250D` displays `CULASTORD`. `CUS300`'s `GetCusLastOrdDate` getter exists only as commented-out source. — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:260-263`, `ATU_SRC/QDDSSRC/CUS250D.DSPF:69`, `ATU_SRC/QRPGLESRC/CUS300.RPGLE:139-150`

## Behaviour as implemented

1. `ORD100` confirm: `ORID` from `LASTORDNO`, `ORYEAR = *year`, `ORDATE = %dec(%date():*iso)`, `ORDATDEL = 0`, `ORDATCLO = 0`, `write forde`. — `ORD100.PGM.RPGLE:189-197`
2. Trigger fires after that insert, once (one row). `UPDATE Customer SET culastord = <that ORDATE> WHERE cuid = <that ORCUID>`. — `ORD701.SQLTRG:14-15`
3. Control returns to `ORD100`, which then writes the `DETORD` lines (firing `ORD700` per line, `c02`). The customer stamp therefore precedes the line inserts; a failure while writing lines leaves `CULASTORD` already updated (no commitment control in `ORD100`). — `ORD100.PGM.RPGLE:197-206`

## Validation rules found in code

None. The `WHERE cuid = N.orcuid` match is the only condition: no customer row → 0 rows updated, no error; soft-deleted customer (`CUDEL`) → updated anyway.

## Edge cases found in code

- **Not monotonic.** Because the assignment is unconditional, an order inserted with an `ORDATE` earlier than the customer's current `CULASTORD` moves the date **backwards**. In tree `ORD100` always uses today's date so this only matters for out-of-tree inserts (data loads, `ORD901`-style repairs that insert rather than update). `ART801` and `ORD901` recompute with `MAX(ORDATE)` instead (`c10`). — `ORD701.SQLTRG:14`, `ATU_SRC/QSQLSRC/ART801.SQLPRC:35-37`, `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50`
- **Order for a non-existent customer** (`ORD100` accepts any non-zero `CUID`, `ord-entry-ord100-c01`): the order row is written, the trigger updates nothing, silently. — `ORD701.SQLTRG:15`
- **Insert only.** Deleting an order, or changing `ORDATE` / `ORCUID` (`ORD901` shifts every `ORDATE`), does not touch `CULASTORD` through this trigger; `ORD901` compensates with its own `MAX(ORDATE)` statement, `ART801` likewise. Whether the stale window is acceptable is `c08` (needs-SME, no card). — `ORD701.SQLTRG:6`, `ORD901.PGM.SQLRPGLE:21,39,46-50`
- **`sqlPath = *LIBL`**: `Customer` resolves through the job's library list at run time, not to a fixed schema. — `ORD701.SQLTRG:11`
- **Trigger program name `ORD701`** is fixed by `PROGRAM NAME`; the object must exist alongside `ORDER` — attachment on the box is the same runtime question as `c01`.

## Dependencies

- `ORDER.PF` (`ORCUID`, `ORDATE`) — `ATU_SRC/QDDSSRC/ORDER.PF:5-10`
- `CUSTOMER.PF` (`CUID`, `CULASTORD`) — `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-6,21-22`
- Writer `ORD100` (slice `ord-entry-ord100`, `c07` there) — call site only.

## Assumptions / unknowns

- Attachment on the box (`c01`); whether `ORD701` was created with the same `*LIBL` resolution in every environment.
- Whether "last order date" is meant as "most recent order" (then the unconditional assignment is a latent defect for back-dated inserts) — SME.

## Evidence

`ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-16` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10,188-206` · `ATU_SRC/QDDSSRC/ORDER.PF:5-10` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-6,21-22` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:260-263` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:69` · `ATU_SRC/QRPGLESRC/CUS300.RPGLE:139-150` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:35-37` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21,39,46-50`
