# CANDIDATES — sql-objects (Phase A, unbound)

Seed: `ORDERCUS`, `ARTLSTDAT`, `ARTIINF`, `CUSSEQ`, `ART801`. All rows `candidate`. Rows marked *(pointer)* give an existing documented behaviour a surface; they are not new behaviour.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| sql-objects-c01 | `ORDERCUS` view = `ORDER` **inner-joined** to `CUSTOMER` on `ORCUID = CUID`, exposing `ORID, ORCUID, CUSTNM, ORYEAR, ORDATE, ORDATDEL, ORDATCLO` and `TOTVAL = COALESCE(SUM(ODTOTVAT) over DETORD, 0)` — orders whose customer row is missing **disappear** from the order lists; an order with no lines shows `TOTVAL 0` | `QSQLSRC/ORDERCUS.VIEW:5-21`; consumers `ORD200.PGM.SQLRPGLE:104-113`, `ORD201.PGM.SQLRPGLE:97-106` | observed-in-code | Read contract behind `ord-maintain-ord200-c01` / `ord-maintain-ord201-c01` |
| sql-objects-c02 | `TOTVAL` is the **VAT-inclusive** line total (`ODTOTVAT`), not net — the order lists show gross amounts | `ORDERCUS.VIEW:16-19` | observed-in-code | Semantics of the displayed total |
| sql-objects-c03 | `ARTLSTDAT` view = per article `MAX(ORDATE)` as `LASTORDER` and `SUM(ODQTY)` as `QUANTITY` over **all** orders (open and closed); articles never ordered are absent (inner join) | `QSQLSRC/ARTLSTDAT.VIEW:5-14` | observed-in-code | Report contract |
| sql-objects-c04 | `ARTLSTDAT` has **no consumer** in `ATU_SRC`; the menu's "Article by Last Order Date" QM query (`ARTQRY`, not in tree) is the probable reader | grep `ARTLSTDAT` = DDL only; `QPNLSRC/SAMMNU.MENU:129-132` | inferred | Blind-spot pointer |
| sql-objects-c05 | `ARTIINF` (`article_full_description`): `ARID CHAR(6)` PK + `ARTINF VARCHAR(1520)`, CCSID 297, `NOT NULL DEFAULT ''`; written by `ART200` option 3 (insert-or-update) and read by `ART302.GetArtInfo` | `QSQLSRC/ARTIINF.TABLE:5-20`; `ART200.PGM.SQLRPGLE:334,371,375`; `ART302.SQLRPGLE:18` | observed-in-code | Table contract behind `art-interactive-c04` / `art-modules-c07` |
| sql-objects-c06 | `ARTIINF` rows are **never deleted**: `ART200`'s soft delete of an article leaves its free text; no `DELETE FROM artiinf` anywhere | grep `artiinf` = select/update/insert only | observed-in-code | Orphan-data note |
| sql-objects-c07 | `CUSSEQ` sequence: `START WITH 1551 INCREMENT BY 1 NO MAXVALUE NO CYCLE`; consumed by `CUS200` F6 (`NEXT VALUE FOR CusSeq`) — value burned even if the create is cancelled *(pointer to documented `cus-interactive-c02`)* | `QSQLSRC/CUSSEQ.SQLSEQ:5-9`; `CUS200.PGM.SQLRPGLE:185` | observed-in-code | Surface for a documented behaviour |
| sql-objects-c08 | `ART801` / `UPDATE_ON_CUS_ORD_QTY` stored procedure (menu opt 82): three `WHERE EXISTS`-guarded `UPDATE`s recomputing `ARTICLE.ARCUSQTY`, `CUSTOMER.CUCREDIT` (open orders only) and `CUSTOMER.CULASTORD` (all orders); `COMMIT = *NONE`, `SET PATH *LIBL` *(pointer to documented `ord-trigger-ord700-c10`)* | `QSQLSRC/ART801.SQLPRC:4-38`; `QPNLSRC/SAMMNU.MENU:151-154` | observed-in-code | Callable surface for a documented behaviour — not re-scanned |
| sql-objects-c09 | `ART801` is a `LANGUAGE SQL` procedure with `DYNUSRPRF = *USER`, `SRTSEQ = *HEX`, `ALWCPYDTA = *YES`; called with no parameters and no result | `ART801.SQLPRC:6-20` | observed-in-code | Interface facts |
| sql-objects-c10 | Object naming: `ARTIINF` and `ARTLSTDAT` carry SQL long names / labels (`article_full_description`, column labels); `"ORDER"` must be delimited everywhere because it is a reserved word | `ARTIINF.TABLE:5-17`; `ARTLSTDAT.VIEW:16-22`; `ORDERCUS.VIEW:20`; `ART801.SQLPRC:23-37` | observed-in-code | Port trap for the target schema |

## Deferred recommendations (prose only)

- c01: the inner join to `CUSTOMER` is a silent filter. Recommend an SME confirm whether an order for a deleted / missing customer should vanish from the lists in the target.
- c04: `ARTLSTDAT` is only meaningful once the QM queries are seen. `defer`.
- c07 / c08 are **surfaces for behaviours already carded** under `cus-interactive` and `ord-trigger-ord700`; recommend the bind accept the surfaces and point at the existing cards rather than create new ones.
