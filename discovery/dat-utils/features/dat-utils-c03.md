# dat-utils-c03 — Callers: ISOTODATE40 from ORD200 / ORD201 cursors; ISO_Num_To_Date unused

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ISOTODATE40` has exactly two call sites in `ATU_SRC`, both embedded-SQL cursors over the `ORDERCUS` view: `ORD200` (orders for one customer, `WHERE orcuid = :cuid`) and `ORD201` (all orders). Each wraps the three numeric order dates — `ORDATE`, `ORDATDEL`, `ORDATCLO` — as `DATORD`, `DATLIV`, `DATCLO`, sorts on the converted `DATORD` descending and fetches the three `DATE` results into the display-file date fields **without null indicators**. `ISO_Num_To_Date` has no caller anywhere in the tree. Every other program that shows one of these dates converts in RPG with `%date(…:*iso)` instead (`ORD202`, `ORD500`, `CUS200` for `CULASTORD`), so the estate has two conversion paths for one storage format (`c07`).

## Entrypoints

- `ORD200` `s01prp`: `declare c1 cursor for SELECT ORID, ORYEAR, ISOTODATE40(ORDATE) AS DATORD, ISOTODATE40(ORDATDEL) AS DATLIV, ISOTODATE40( ORDATCLO) AS DATCLO, Totval FROM Ordercus Where orcuid = :cuid order by datord desc` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:105-113`
- `ORD201` `s01prp`: same three wrappers plus `TOTVAL, orcuid, custnm`, no `WHERE`, `order by datord desc, orid desc` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:98-106`
- `ISO_Num_To_Date` / `ISOTODATE(`: no occurrence in `ATU_SRC` outside its own `CREATE FUNCTION` (structural grep; `QSQLSRC` holds 8 members, none referencing it). — `ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:20`

## Inputs / outputs / observables

- In (to the UDF): `ORDERCUS.ORDATE`, `ORDATDEL`, `ORDATCLO` — passed through from `"ORDER"` unconverted by the view. — `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:10-12,15-16`
- Out (from the cursor): `DATE` columns fetched into `:datord, :datliv, :datclo` — host variables are the subfile record's `L` fields (`DATFMT(*JOB)`), not declared in the D-specs. — `ORD200.PGM.SQLRPGLE:121-122`, `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-26`; `ORD201.PGM.SQLRPGLE:118-120`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:23,28-29`
- Observable: list rows ordered newest order first; delivery / close columns blank when the stored value is `0` (`MAPVAL`, `c01`); options 7 (close) / 8 (deliver) / 2 / 4 refused when the converted date is `> d'1940-01-01'`. — `ORD200D.DSPF:25,27`, `ORD200.PGM.SQLRPGLE:177-187`, `ORD201.PGM.SQLRPGLE:181-191`

## Behaviour as implemented

1. Subfile clear, cursor declared and opened. `ORD200` loads **all** rows for the customer in one loop; `ORD201` loads 14 per page (`count < 14`) with `PAGEDOWN`. — `ORD200.PGM.SQLRPGLE:100-132`, `ORD201.PGM.SQLRPGLE:93-125`
2. Each `fetch` fills the three date host variables; `dow sqlcod = 0` (`ORD200`) / `if sqlcod = 0` (`ORD201`) writes the subfile row. Any non-zero `SQLCODE` — end of data, or a NULL date with no indicator (`-305`) — ends the load with no message (`c01` edge case, pointer to the caller slices). — `ORD200.PGM.SQLRPGLE:121-131`, `ORD201.PGM.SQLRPGLE:117-125`
3. After a deliver / close action the programs update `ORDER` with `%dec(%date():*iso)` and refresh the subfile row's date fields with `%date()` directly — the UDF is not re-invoked until the list is rebuilt. — `ORD200.PGM.SQLRPGLE:244-259`, `ORD201.PGM.SQLRPGLE:250-265`
4. `*inzsr` presets `datord` / `datclo` / `datliv` to the sentinel constant `d'1940-01-01'` (the same value the UDF returns for `0`). — `ORD200.PGM.SQLRPGLE:74,279-283`, `ORD201.PGM.SQLRPGLE:67,286-288`

## Validation rules found in code

None at the call sites: no `SQLCODE` check other than `= 0`, no indicator variables, no `COALESCE` around the UDF calls.

## Edge cases found in code

- **Sorting on the converted value.** `order by datord desc` sorts on the UDF result: a `0` order date would sort as 1940 (last), a NULL (invalid) first. `ORDATE` is always stamped by `ORD100` (`%dec(%date():*iso)`), so neither case arises from in-tree data. — `ORD200.PGM.SQLRPGLE:113`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194`
- **Three UDF calls per row, per load.** `ORD200` rebuilds the whole list on each `prp` (e.g. after `F5` refresh or a create); `ORD201` per page. `DETERMINISTIC` (`c04`) lets DB2 cache within a statement, not across statements.
- **The QM queries are the only unread consumer candidates.** Menu options 12 (`STRQMQRY QMQRY(CUSQRY) QMFORM(CUSQRYFMT)`, "Customer with Open Order") and 13 (`STRQMQRY QMQRY(ARTQRY)`, "Article by Last Order Date") run query-management objects with no source in the tree; `ARTQRY` is the probable consumer of the `ARTLSTDAT` view and possibly of `ISO_Num_To_Date`. Unverifiable from source. — `ATU_SRC/QPNLSRC/SAMMNU.MENU:126-132`, `overnight/METHOD_COVERAGE.md:18`
- **Not a caller: `ORD202`, `ORD500`, `CUS200`, `ORD901`.** These read the same `8 0` columns with native I/O and convert with `%date(x:*iso)` (with or without a `> 0` guard, `c07`). — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:85-91`, `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:32`, `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:260-264`, `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21-38`

## Dependencies

- `ORDERCUS.VIEW` (`sql-objects`, unbound — cited as the row source only; note its inner join to `CUSTOMER` is that slice's finding). — `ORDERCUS.VIEW:20-21`
- `ord-maintain-ord200` / `ord-maintain-ord201` (unbound) own the list behaviour; this card records only what they pass in and what they do with the result.
- `c01` (values returned), `c04` (why the function is callable from SQL), `c08` (what the host variable holds after a NULL).

## Assumptions / unknowns

- `needs-SME`: do `CUSQRY` / `ARTQRY` / `CUSQRYFMT` use `ISO_Num_To_Date` (or `ISOTODATE40`)? Decides whether `ISO_Num_To_Date` is dead (Phase A open question 2).
- The `-305` reading of a NULL fetch is standard SQL precompiler behaviour, not something the source states; recorded as derived.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,100-132,177-187,244-259,279-283` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:67,93-125,181-191,250-265,286-288` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-27` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-24,28-30` · `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:10-12,15-21` · `ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:20` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:126-132` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:85-91` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:32` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:260-264` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21-38`
