# ord-trigger-ord700-c10 — ART801 batch reconciliation (related surface)

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) — related surface; object owned by the `sql-objects` seed |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, "listed here for the relationship") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

SQL procedure `UPDATE_ON_CUS_ORD_QTY` (`SPECIFIC ART801`, menu option 82 "Reset Summary Fields") recomputes three derived fields from scratch: `ARTICLE.ARCUSQTY = SUM(ODQTY - ODQTYLIV)` over lines of **open** orders (`ORDATCLO = 0`), `CUSTOMER.CUCREDIT = SUM(ODTOTVAT)` over lines of open orders, and `CUSTOMER.CULASTORD = MAX(ORDATE)` over all orders. Each `UPDATE` is restricted by `WHERE EXISTS` to rows that have at least one qualifying order, so articles with no open lines and customers with no open orders are **left as they are**, not reset to zero. It is the batch counterpart of what `ORD700` (`c02`–`c04`) and `ORD701` (`c07`) maintain incrementally; `CUCREDIT` has no incremental maintainer at all in `ATU_SRC`.

## Entrypoints

- `CREATE PROCEDURE UPDATE_ON_CUS_ORD_QTY () LANGUAGE SQL SPECIFIC ART801 NOT DETERMINISTIC MODIFIES SQL DATA CALLED ON NULL INPUT SET OPTION ... COMMIT = *NONE ...` — `ATU_SRC/QSQLSRC/ART801.SQLPRC:4-21`
- Menu `SAMMNU` option 82 `cmd call art801` — "Reset Summary Fields SQLPRC:ART801" — `ATU_SRC/QPNLSRC/SAMMNU.MENU:151-154`
- No other caller in `ATU_SRC` (structural grep for `ART801` / `UPDATE_ON_CUS_ORD_QTY`).

## Inputs / outputs / observables

- In: `ORDER` (`ORID`, `ORCUID`, `ORDATE`, `ORDATCLO`), `DETORD` (`ODORID`, `ODARID`, `ODQTY`, `ODQTYLIV`, `ODTOTVAT`). — `ATU_SRC/QDDSSRC/ORDER.PF:5-14`, `ATU_SRC/QDDSSRC/DETORD.PF:5-20`
- Out: `ARTICLE.ARCUSQTY`, `CUSTOMER.CUCREDIT`, `CUSTOMER.CULASTORD` rewritten by set-based `UPDATE`. — `ART801.SQLPRC:23-37`
- Observables: same fields as `c02`/`c07` plus `CUCREDIT` (`CUS200D`, `CUS250D`, `GetCusCredit`). — `ATU_SRC/QDDSSRC/CUS200D.DSPF:138`, `ATU_SRC/QDDSSRC/CUS250D.DSPF:67`, `ATU_SRC/QRPGLESRC/CUS300.RPGLE:130-135`

## Behaviour as implemented

1. `UPDATE ARTICLE A SET ARCUSQTY = (SELECT SUM(ODQTY - ODQTYLIV) FROM "ORDER", DETORD WHERE ORID = ODORID AND ORDATCLO = 0 AND A.ARID = ODARID GROUP BY ODARID) WHERE EXISTS (same predicate)`. Join is on `ORID = ODORID` only (`ODYEAR` / `ORYEAR` not used). — `ART801.SQLPRC:22-27`
2. `UPDATE CUSTOMER C SET CUCREDIT = (SELECT SUM(ODTOTVAT) FROM "ORDER", DETORD WHERE ORID = ODORID AND ORDATCLO = 0 AND C.CUID = ORCUID GROUP BY ORCUID) WHERE EXISTS (...)`. `ODTOTVAT` is the VAT-inclusive line total; delivered-but-not-closed lines still count. — `ART801.SQLPRC:28-33`
3. `UPDATE CUSTOMER C SET CULASTORD = (SELECT MAX(ORDATE) FROM "ORDER" WHERE C.CUID = ORCUID) WHERE EXISTS (...)` — all orders, open or closed. `ORD901` contains the identical statement. — `ART801.SQLPRC:34-37`, `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50`
4. `COMMIT = *NONE`: three independent statements, no transaction; a failure in statement 2 leaves statement 1 applied. — `ART801.SQLPRC:14`
5. The `ARTICLE` updates are plain SQL `UPDATE`s on the base table — no `DETORD` I/O occurs, so `ORD700` does **not** fire during reconciliation; likewise nothing here inserts into `ORDER`, so `ORD701` is not involved. — `ART801.SQLPRC:23-37`

## Validation rules found in code

None. No parameters, no result, no row-count feedback to the caller.

## Edge cases found in code

- **Rows outside the `EXISTS` are not touched.** An article whose last open line was delivered-and-closed keeps whatever `ARCUSQTY` the trigger path left; a customer whose orders are all closed keeps the previous `CUCREDIT`. Only rows with at least one qualifying order are recomputed. — `ART801.SQLPRC:26-27,32-33,37`
- **Definitions differ from the trigger path** (facts only; the business question is `c11`, needs-SME): `ART801` excludes closed orders, `ORD700` never sees an order close (`c04`); `ART801` uses `ODQTY - ODQTYLIV` everywhere, `ORD700` insert uses `ODQTY` (`c02`); `ART801` uses `MAX(ORDATE)`, `ORD701` assigns the inserted date (`c07`).
- **Menu label says "Reset"**, but the procedure never writes zero to a field that has no qualifying rows.
- **Grouping alignment**: the sub-selects `GROUP BY ODARID` / `GROUP BY ORCUID` while correlated on the same column, so each returns one row; the `SUM` over `NULL` is not reachable because `EXISTS` guards it.
- **Options 81/82 neighbours**: `ORD901` (option 81) also rewrites `CULASTORD`, so the two "reset" tools overlap on that field. — `SAMMNU.MENU:147-150`, `ORD901.PGM.SQLRPGLE:46-50`

## Dependencies

- `ORDER.PF`, `DETORD.PF`, `ARTICLE.PF`, `CUSTOMER.PF` — base tables.
- Owned by the unscanned `sql-objects` seed (`docs/estate/INDEX.md` row 27); this card records the relationship for the trigger seam and does not claim that seed's Phase A.

## Assumptions / unknowns

- When and how often option 82 is run (operational practice; SME). The Phase A hint that these are demo-refresh tools is inferred and stays so.
- `c11`: whether the trigger-path and batch-path values are expected to agree between runs of option 82 — needs-SME, verify with data.

## Evidence

`ATU_SRC/QSQLSRC/ART801.SQLPRC:4-38` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:147-154` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:138` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:67` · `ATU_SRC/QRPGLESRC/CUS300.RPGLE:130-135`
