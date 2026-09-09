# sql-objects-c03 — `ARTLSTDAT` view: per article `MAX(ORDATE)` as `LASTORDER` and `SUM(ODQTY)` as `QUANTITY` over **all** orders, three-way inner join; never-ordered articles absent, soft-deleted articles present

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is data-contract card, Phase B — report contract with no in-tree reader, see `c04`) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ARTLSTDAT` is `SELECT ARID, ARDESC, MAX(ORDATE) AS LASTORDER, SUM(ODQTY) AS QUANTITY FROM ARTICLE, "ORDER", DETORD WHERE ARID = ODARID AND ODORID = ORID GROUP BY ARID, ARDESC`. Three tables, two equality predicates, comma joins — so **inner** throughout: an article appears only if at least one `DETORD` line names it *and* that line's header exists. Per article it gives the latest order date (numeric `8 0` ISO, compared as a number) and the total **ordered** quantity (`ODQTY`, not delivered `ODQTYLIV`, not outstanding) across every order ever written — open or closed, and regardless of the article's `ARDEL` soft-delete flag. The join is on `ODORID = ORID` alone (`ODYEAR` / `ORYEAR` unused, like `ORDERCUS` and `ART801`). `ARDESC` is a group key, but since `ARTICLE1` is `UNIQUE` on `ARID` there is exactly one description per article and therefore one row per article. Nothing in `ATU_SRC` reads the view (`c04`).

## Entrypoints

- `CREATE VIEW ARTLSTDAT (ARID, ARDESC, LASTORDER, QUANTITY) AS SELECT ARID, ARDESC, MAX(ORDATE) AS LASTORDER, SUM(ODQTY) AS QUANTITY FROM ARTICLE, "ORDER", DETORD WHERE ARID = ODARID AND ODORID = ORID GROUP BY ARID, ARDESC` — `ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW:5-14`
- In-tree consumers: **none** (structural grep `ARTLSTDAT`: the DDL member only). Probable out-of-tree reader: menu option 13 `STRQMQRY QMQRY(ARTQRY)` "Article by Last Order Date" — `c04`.

## Inputs / outputs / observables

- In: `ARTICLE` (`ARID 6A`, `ARDESC 50A`, `ARDEL 1A` — not filtered), `"ORDER"` (`ORID`, `ORDATE 8 0`, `ORDATCLO` — not filtered), `DETORD` (`ODORID`, `ODARID`, `ODQTY` `5 0` via `REFFLD(QUANTITY)`). — `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7,39`, `ORDER.PF:5-13`, `DETORD.PF:5-12`, `SAMREF.PF:11-14,47-49`
- Out: one row per article that has ≥ 1 order line: `ARID`, `ARDESC` (current description), `LASTORDER` (`8 0` numeric, `YYYYMMDD`), `QUANTITY` (decimal, widened by `SUM` — inference).
- Column headings / text exist for `ARID` ('ART.' / 'ID'; text 'ARTICLE ID') and `ARDESC` ('DESCRIPTION'; text 'ARTICLE DESCRPTION' — the `SAMREF` typo copied verbatim). `LASTORDER` and `QUANTITY` have none, so a report tool that prints headings shows the bare column names for those two. — `ARTLSTDAT.VIEW:16-22`; `SAMREF.PF:11-14`
- Observable: none in the tree. On a box with `ARTQRY`, the option-13 report (`c04`, inference).

## Behaviour as implemented

1. **Join.** `ARTICLE × "ORDER" × DETORD` restricted by `ARID = ODARID AND ODORID = ORID`. Both predicates are equalities on the natural keys (`ARTICLE1.LF` `UNIQUE K ARID`; `ORDER1.LF` `UNIQUE K ORID`; `DETORD1.LF` `UNIQUE K ODORID, ODLINE`), so each `DETORD` row contributes exactly once if — and only if — both its article and its header exist. — `ARTLSTDAT.VIEW:12-13`; `ATU_SRC/QDDSSRC/ARTICLE1.LF`, `ORDER1.LF`, `DETORD1.LF`
2. **Grouping.** `GROUP BY ARID, ARDESC`. `ARDESC` is functionally dependent on `ARID` (one `ARTICLE` row per `ARID`), so the grouping is effectively per article; it also means a description change is reflected immediately (the view shows the *current* `ARDESC`, not the one in force when the orders were placed — `DETORD` stores no description). — `ARTLSTDAT.VIEW:11-13`
3. **`LASTORDER = MAX(ORDATE)`.** `ORDATE` is an `8 0` numeric written as `%dec(%date():*iso)` at order creation (`ORD100.PGM.RPGLE:194`) and shifted by `ORD901` (`ORD901.PGM.SQLRPGLE:21`); as `YYYYMMDD` integers its numeric maximum is the latest date. No conversion to a date type happens in the view (contrast the readers of `ORDERCUS`, which call `ISOTODATE40`). — `ARTLSTDAT.VIEW:11`; `ATU_SRC/QDDSSRC/ORDER.PF:9-10`
4. **`QUANTITY = SUM(ODQTY)`.** Ordered quantity, all lines, all orders — delivered lines are not subtracted (`ODQTYLIV` unused) and closed orders are not excluded (`ORDATCLO` unused). This is therefore **not** the same number as `ARTICLE.ARCUSQTY` (which `ART801` / `ORD700` maintain as `SUM(ODQTY − ODQTYLIV)` over *open* orders — `ord-trigger-ord700-c10` step 1). — `ARTLSTDAT.VIEW:11-13`; `ATU_SRC/QSQLSRC/ART801.SQLPRC:23-27`
5. **No status filters.** `ARDEL`, `ORDATCLO`, `ORDATDEL` are absent from the predicate. — `ARTLSTDAT.VIEW:13`
6. **Read-only.** Grouped view — not updatable (platform); no writer in the tree.

## Validation rules found in code

- None (view).

## Edge cases found in code

- **Never-ordered article → no row.** Inner join; the article is simply missing from the report, not shown with `QUANTITY 0`. — `ARTLSTDAT.VIEW:12-13`
- **Soft-deleted article (`ARDEL = 'X'`) → still a row**, with its full history, because nothing filters `ARDEL`. `ART200` option 4 is the only in-tree writer of `ARDEL` (`ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:208-216`). — `ARTLSTDAT.VIEW:13`; `ARTICLE.PF:39`
- **Orphan order line (`ODARID` with no `ARTICLE` row) → excluded.** Reachable: `ORD100` performs no `ExistArt` check (`ord-entry-ord100-c14`). Such a line still counts in `ORDERCUS.TOTVAL` (`c01`, which does not touch `ARTICLE`) — the two views disagree about the same line. — `ARTLSTDAT.VIEW:13`
- **Orphan line (header missing)** → excluded here *and* not summed by `ORDERCUS` (its header is the thing that is missing); `DETORD1` has no referential constraint to `ORDER1` (DDS files, no `CST`). — `ARTLSTDAT.VIEW:13`; `DETORD.PF`
- **`ORDATE = 0`** would be the minimum, so it can never win `MAX` while any real date exists; an article whose *only* orders have `ORDATE 0` would report `LASTORDER 0`. No in-tree writer stores 0 in `ORDATE` (`ORD100:194` uses the current date). — `ORD100.PGM.RPGLE:194`
- **Cancelled / deleted lines.** `ORD101` deletes `DETORD` rows physically (its slice); deleted lines drop out of both `QUANTITY` and (if it was the last line of the latest order) `LASTORDER` — the view has no memory. — `ARTLSTDAT.VIEW:11-13`

## Dependencies

- Base tables `ARTICLE.PF` (+ `ARTICLE1.LF`), `ORDER.PF` (+ `ORDER1.LF`), `DETORD.PF` (+ `DETORD1.LF`) — deps, not the slice. Related derived numbers: `ARTICLE.ARCUSQTY` (`ord-trigger-ord700-c10`, `ART801` `c08`) and `CUSTOMER.CULASTORD` (same statement family on the customer side — `ART801.SQLPRC:35-37`, `ORD901.PGM.SQLRPGLE:46-50`).
- `c04` (who reads it), `c10` (labels, `"ORDER"` delimiter).

## Assumptions / unknowns

- Platform: `SUM` over a `5 0` decimal widens precision (inference); grouped views are read-only (inference).
- **needs-SME (source owner):** the QM query `ARTQRY` — does it read `ARTLSTDAT`, and with what form? Until seen, this view's *purpose* is inferred from the menu text (`c04`). Recommendation unchanged from Phase A: `defer` any target decision about this report until the QM source is available; the DDL contract above is what a target view would need to reproduce if the report is kept.

## Evidence

`ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW:5-22` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7,39` · `ATU_SRC/QDDSSRC/ARTICLE1.LF` · `ATU_SRC/QDDSSRC/ORDER.PF:5-13` · `ATU_SRC/QDDSSRC/ORDER1.LF` · `ATU_SRC/QDDSSRC/DETORD.PF:5-15` · `ATU_SRC/QDDSSRC/DETORD1.LF` · `ATU_SRC/QDDSSRC/SAMREF.PF:11-14,47-49` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:208-216` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:23-27` · structural grep of `ATU_SRC/**` for `ARTLSTDAT` (1 hit — the DDL)
