# sql-objects-c01 — `ORDERCUS` view: `"ORDER"` inner-joined to `CUSTOMER` on `ORCUID = CUID`, one row per order, `TOTVAL` correlated over `DETORD`; orders without a customer row are invisible

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is data-contract card, Phase B — the read contract behind the two order lists) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORDERCUS` is a `CREATE VIEW` over `"ORDER" H, CUSTOMER WHERE ORCUID = CUID` — an old-style comma join, therefore **inner**. It exposes eight columns: seven straight from the tables (`ORID`, `ORCUID`, `CUSTNM`, `ORYEAR`, `ORDATE`, `ORDATDEL`, `ORDATCLO` — `CUSTNM` is the only `CUSTOMER` column) and `TOTVAL = COALESCE((SELECT SUM(ODTOTVAT) FROM DETORD D WHERE H.ORID = ODORID), 0)`. Because `CUSTOME1` is `UNIQUE` on `CUID`, the join can never duplicate an order; because it is inner, an order whose `ORCUID` has no `CUSTOMER` row is **absent** — and both in-tree readers (`ORD200`, `ORD201`) read only this view, so such an order is listed nowhere in the estate. There is no filter on `CUDEL` (soft-deleted customers' orders stay listed) and none on `ORDATCLO` (open and closed orders both appear). The correlated sum joins on `ORID = ODORID` only — `ODYEAR` / `ORYEAR` play no part — and returns `0`, never `NULL`, for an order without lines. The view is the sole read path of `ORD200` (one customer's orders) and `ORD201` (all orders); nothing writes through it.

## Entrypoints

- `CREATE VIEW ORDERCUS (ORID, ORCUID, CUSTNM, ORYEAR, ORDATE, ORDATDEL, ORDATCLO, TOTVAL) AS SELECT … FROM "ORDER" H, CUSTOMER WHERE ORCUID = CUID` — `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:5-21`
- Reader 1: `ORD200` `s01prp` — `declare c1 cursor for SELECT ORID, ORYEAR, ISOTODATE40(ORDATE) AS DATORD, ISOTODATE40(ORDATDEL) AS DATLIV, ISOTODATE40(ORDATCLO) AS DATCLO, Totval FROM Ordercus Where orcuid = :cuid order by datord desc` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:105-113` (behaviour: `ord-maintain-ord200-c01`)
- Reader 2: `ORD201` `s01prp` — same select plus `orcuid, custnm`, no `WHERE`, `order by datord desc, orid desc` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:98-106` (behaviour: `ord-maintain-ord201-c01`)
- No other reference in `ATU_SRC` (structural grep `ORDERCUS`: the DDL member and the two cursors).

## Inputs / outputs / observables

- In: `"ORDER"` (`ORID 6P 0`, `ORYEAR 4P 0`, `ORCUID 5P 0`, `ORDATE` / `ORDATDEL` / `ORDATCLO` `8 0` numeric ISO dates), `CUSTOMER` (`CUID 5P 0`, `CUSTNM 30A`), `DETORD` (`ODORID`, `ODTOTVAT 9P 2`). — `ATU_SRC/QDDSSRC/ORDER.PF:5-14`, `CUSTOMER.PF:5-7`, `DETORD.PF:5-20`, `SAMREF.PF:15,24,34,50,68`
- Out: one row per `"ORDER"` row that has a matching `CUSTOMER` row. Dates come out as the raw `8 0` numerics (the view does not convert; both readers wrap them in `ISOTODATE40` — `dat-utils`). `TOTVAL` is a decimal of the platform's maximum precision with scale 2 (`SUM` over `DECIMAL(9,2)` — inference, see Assumptions). — `ORDERCUS.VIEW:15-19`
- Observable: the `ORD200` subfile (one customer) and the `ORD201` subfile (everyone), column `SUMORD 11Y 2 EDTCDE(2)`. — `ATU_SRC/QDDSSRC/ORD200D.DSPF:28`, `ORD201D.DSPF:25`
- Column headings / text exist for four of the eight columns only (`c10`): `ORID` 'ORD' / 'NUM', `ORCUID` 'CUST' / 'ID', `CUSTNM` 'CUSTOMER' / 'NAME', `ORYEAR` 'YEAR' — copies of the `SAMREF` `COLHDG` values. `ORDATE`, `ORDATDEL`, `ORDATCLO`, `TOTVAL` carry none. — `ORDERCUS.VIEW:24-34`; `SAMREF.PF:16,25,35,69`

## Behaviour as implemented

1. **Join.** `FROM "ORDER" H, CUSTOMER WHERE ORCUID = CUID` — implicit inner join, one predicate, no outer-join syntax anywhere in the member. `CUSTOME1.LF` is `UNIQUE` keyed `CUID`, so at most one `CUSTOMER` row matches an order: the row count of the view equals the number of orders whose customer exists. — `ORDERCUS.VIEW:20-21`; `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`
2. **Projection.** Seven columns pass through unchanged; the only value taken from `CUSTOMER` is `CUSTNM`. The column list on line 5–13 renames nothing (view column names = base column names). — `ORDERCUS.VIEW:5-16`
3. **`TOTVAL`.** Correlated scalar subquery `SELECT SUM(ODTOTVAT) FROM DETORD D WHERE H.ORID = ODORID`, wrapped in `COALESCE(…, 0)`. The correlation is on `ORID` alone — `DETORD1.LF` is `UNIQUE` on (`ODORID`, `ODLINE`) and `ORDER1.LF` `UNIQUE` on `ORID`, so a line belongs to exactly one header without `ODYEAR`. `SUM` over no rows is `NULL`, hence the `COALESCE`: an order with no lines shows `0`. — `ORDERCUS.VIEW:17-19`; `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `DETORD1.LF:4-7`
4. **No status filter.** Neither `ORDATCLO` (0 = open) nor `CUDEL` (`'X'` = soft-deleted customer) appears in the predicate; `ORD201` therefore lists closed orders and — if a customer were ever soft-deleted — that customer's orders too. — `ORDERCUS.VIEW:20-21`; `CUSTOMER.PF:29`; `ORDER.PF:13`
5. **Readers add the ordering and the date conversion, not the view.** `ORD200` filters `orcuid = :cuid` and sorts `datord desc`; `ORD201` takes everything and sorts `datord desc, orid desc`. The view itself has no `ORDER BY`. — `ORD200.PGM.SQLRPGLE:111-113`; `ORD201.PGM.SQLRPGLE:105-106`
6. **Read-only.** A join view with an aggregate subquery is not updatable (platform); no statement in the tree writes through `ORDERCUS` (grep). Writers go to `ORDER1` / `DETORD1` directly (`ORD100`, `ORD101`, `ORD200`, `ORD201`, `ORD900`, `ORD901`).

## Validation rules found in code

- None in the view (a view cannot validate). The one rule it *encodes* is the referential one: "an order counts only if its customer exists" — enforced at read time by the inner join, not at write time (`ORD100` accepts any non-zero `ORCUID` without an existence check — `ord-entry-ord100-c01` step 4, `-c14`). — `ORDERCUS.VIEW:20-21`; `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:325-327` (via the `ord-entry-ord100` cards)

## Edge cases found in code

- **Orphan order (no `CUSTOMER` row) — hidden, not an error.** Reachable in-tree: `ORD100C`/`ORD100` create an order for whatever `CUID` they are given (`ord-entry-ord100-c14`). Not reachable in-tree the other way round: no program or SQL statement deletes a `CUSTOMER` row (grep `DELETE` / `delete fcust` / `custome1`: none) and none sets `CUDEL` (read in `CUS300.RPGLE:158,169` only). So the hidden case arises from a bad `ORCUID` at entry, or from work done outside the tree (`STRSQL`, `DFU`, restores). The record stays in `"ORDER"` / `DETORD`, keeps feeding `ART801` / `ORD700` / `ORD701` arithmetic (`ord-trigger-ord700-c10`), and is listed on no screen.
- **Order with no lines → `TOTVAL 0`.** `COALESCE` makes the `NULL` sum `0`; the row is still shown. — `ORDERCUS.VIEW:17-19`
- **Host-variable width.** Both readers fetch `TOTVAL` into `SUMORD`, an `11Y 2` display-file field (max 999 999 999.99). `ODTOTVAT` is `9P 2` per line, so a single order needs ≥ 10 lines near the field maximum to exceed it — theoretical, but if it happened the `FETCH` would fail on that row (numeric overflow into a host variable without an indicator — inference, SQLCODE `-304` class) and both load loops (`dow sqlcod = 0`) would stop there silently, truncating the list. — `ORD200D.DSPF:28`; `ORD201D.DSPF:25`; `ORD200.PGM.SQLRPGLE:121-128`; `ORD201.PGM.SQLRPGLE:118-120`
- **`CUSTNM` is per row.** `ORD201` shows it from the view; `ORD200` shows the header name from a separate `chain cuid custome1` (`ORD200:283`) and ignores the view's `CUSTNM`. Consistent as long as `CUSTOMER` is not changed mid-screen. — `ORD200.PGM.SQLRPGLE:283`; `ORD201.PGM.SQLRPGLE:104`
- **Dates are numbers.** `ORDATCLO = 0` (open) reaches the reader as `0`, which `ISOTODATE40` maps per `dat-utils` (its 0 → date handling is that slice's card, not this one's).

## Dependencies

- Base tables: `"ORDER"` (`ORDER.PF`; unique key via `ORDER1.LF`), `CUSTOMER` (`CUSTOMER.PF`; `CUSTOME1.LF` `UNIQUE K CUID`), `DETORD` (`DETORD.PF`; `DETORD1.LF` `UNIQUE K ODORID, ODLINE`). Shared PFs remain **deps**, not the slice.
- Readers: `ORD200` (`ord-maintain-ord200-c01`), `ORD201` (`ord-maintain-ord201-c01`, `-c10` — "the customer name comes from the `ORDERCUS` view, not from `CUSTOME1`").
- Functions used by the readers, not by the view: `ISOTODATE40` (`dat-utils`).
- `c02` (what `TOTVAL` sums), `c10` (the `"ORDER"` delimiter and the labels).

## Assumptions / unknowns

- Platform: `SUM` over `DECIMAL(9,2)` yields a decimal with the maximum precision in force (31 unless `DECRESULT` says otherwise) and scale 2; a join view is read-only; a fetch into a too-narrow host variable fails rather than truncating. Inference, runtime-confirmable (`DSPFFD ORDERCUS`; one oversized order).
- **needs-SME (room, ORD pack):** is "orders whose customer is missing are invisible" the intended definition of the order lists? The ORD conversion kept it as-is and documented it as a preserved planted defect (`modern/db/schema.sql:142-148` — cited read-only, not widened). `ord-maintain-ord201-c01` carries the same question. This card adds the source fact that the *only* in-tree way to reach the state is an unchecked `ORCUID` at order entry.
- Whether any out-of-tree reader (QM query `CUSQRY`, menu option 12 "Customer with Open Order") also reads `ORDERCUS` cannot be known from the tree (`menu-cmd-shell-c02`).

## Evidence

`ATU_SRC/QSQLSRC/ORDERCUS.VIEW:5-34` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:105-128,283` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:98-120` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:28` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:25` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-7,29` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:15-16,24-25,34-35,50,68-69` · `ATU_SRC/QRPGLESRC/CUS300.RPGLE:158,169` · structural grep of `ATU_SRC/**` for `ORDERCUS` (3 hits), for `DELETE` against `CUSTOMER` / `FCUST` / `CUSTOME1` (none), for writers of `CUDEL` (none)
