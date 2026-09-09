# ord-maintain-ord201-c01 — List all orders paged from ORDERCUS

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD201` (no parameters) opens an SQL cursor over the view `ORDERCUS` with **no `WHERE`** — every order that has a `CUSTOMER` row — converts the three `8 0` dates with `ISOTODATE40`, takes the VAT-inclusive total `TOTVAL` and the customer id/name, and loads the subfile **14 rows per fetch batch**, keeping the cursor open for `PAGEDOWN`. Sort is order date descending, then order id descending. The screen page is **7 two-line rows** (`SFLPAG(7)`; order on line 1, customer on line 2), so each batch is two display pages. Phase A's "14 rows per page" is the fetch batch, not the page.

## Entrypoints

- Program entry `ORD201`, no parameter list (`SAMMNU` option 3, `c09`) — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:5-14`
- Panel 1 state machine `pnl01` → `s01prp` → `s01lod` → `s01dsp` (`exfmt ctl01`), one step per RPG cycle iteration until `pnl00` sets `*inlr` — `ORD201.PGM.SQLRPGLE:69-91,93-142`
- Subfile `SFL01` / control `CTL01` / footer `KEY01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:12-96`

## Inputs / outputs / observables

- In: every row of `ORDERCUS` (`"ORDER" H, CUSTOMER WHERE ORCUID = CUID` — inner join). — `ORD201.PGM.SQLRPGLE:98-106`, `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:5-21`
- Out (screen), per `SFL01` record — line 1 (row 7): `OPT01` (`2Y 0B`, `EDTCDE(Z)`), `ORID` (`EDTCDE(2)`), `ORYEAR` (`EDTCDE(Z)`), `DATORD` (`L`, `DATFMT(*JOB)`, no `MAPVAL`), `SUMORD` (`11Y 2`, `EDTCDE(2)`, heading "Value"), `DATLIV`, `DATCLO` (both `MAPVAL(('1940-01-01' *BLANK))`); line 2 (row 8): `CUID`, `CUSTNM` (`REFFLD` to `CUSTOMER`, no column heading). — `ORD201D.DSPF:15-30,71-82`
- `SUMORD` ← `TOTVAL` = `COALESCE(SUM(ODTOTVAT), 0)` over `DETORD` for the order — VAT-inclusive, `0` for an order without lines. — `ORDERCUS.VIEW:17-19`
- No writes. The cursor stays open between pages; it is closed by `F5`, `F6` (`c08`, `c02`) and at program end (`c11`). — `ORD201.PGM.SQLRPGLE:154,158,292`

## Behaviour as implemented

1. `s01prp`: `RRN01 = 0`, `SFLCLR` write of `CTL01`, `declare c1 cursor for SELECT ORID, ORYEAR, ISOTODATE40(ORDATE) AS DATORD, ISOTODATE40(ORDATDEL) AS DATLIV, ISOTODATE40(ORDATCLO) AS DATCLO, TOTVAL, orcuid, custnm FROM Ordercus order by datord desc, orid desc`; `open c1`; `rrs01 = 0`; `step01 = lod`. — `ORD201.PGM.SQLRPGLE:93-110`
2. `s01lod`: `rrn01 = rrs01` (restore the high-water mark — `rrn01` is the `SFILE` RRN field and is overwritten by every `READC`/`UPDATE` in `s01chk`/`s01act`); `RRB01 = RRN01 + 1` (`SFLRCDNBR` → the page shown starts at the first newly loaded row); `opt01 = 0`; `count = 0`; `dow sqlcod = 0 and count < 14`: `fetch c1 into :orid, :oryear, :datord, :datliv, :datclo, :sumord, :cuid, :custnm`; on `sqlcod = 0` → `RRN01 += 1; count += 1; write sfl01`. Then `sflend = sqlcod <> 0`; `rrs01 = rrn01`; `step01 = dsp`. — `ORD201.PGM.SQLRPGLE:112-130`, `ORD201.PGM.SQLRPGLE:13,49-50`
3. `s01dsp`: `SFLDSPCTL` on, `SFLDSP` only when `RRN01 > 0`; `write key01`; `exfmt ctl01`; if the INFDS field at 378–379 (`lrrn`, top-of-page RRN) is non-zero it becomes `RRB01`, so the same page is redisplayed after an option pass. — `ORD201.PGM.SQLRPGLE:46-47,132-142`
4. `SFLSIZ(15)` ≠ `SFLPAG(7)` → the subfile auto-extends (max 9 999 records). `PAGEDOWN(25)` is conditioned `N80`: while `sflend` is off, rolling past the last **loaded** row returns to the program with `pagedown` on → `s01key` → `step01 = lod` → next batch of 14 from the open cursor. Rolling inside the loaded rows is handled by the display. Once `sflend` is on (`SFLEND(*MORE)` shows "Bottom"), `PAGEDOWN` is disabled. — `ORD201D.DSPF:33-35,42`, `ORD201.PGM.SQLRPGLE:159-160`
5. `sflend` goes on when a fetch returns any non-zero `SQLCOD` — end of data (+100) **or** an error. A batch that fills exactly 14 leaves `sflend` off ("More..."); the next `PAGEDOWN` fetches, gets +100, writes nothing and sets `sflend`.
6. Reload points: `step01 = prp` from `F3`/`F12` (which then end the program), `F5` (`c08`) and `F6` (`c02`). Options `4`, `7`, `8` update the displayed row in place (`c04`, `c06`); `2`, `5`, `6` rewrite the row with the option cleared and do not re-read (`c03`, `c05`).

## Validation rules found in code

None on the load. An empty view yields `RRN01 = 0` and `SFLDSP` off — header and footer only, no message.

## Edge cases found in code

- **"All orders" means all orders with a customer row.** `ORDERCUS` is an inner join; an order whose `ORCUID` has no `CUSTOMER` row is not listed anywhere in the estate (the "ORDERCUS join" planted defect in the bind record — as-is). `CUSTNM` comes from the view, per row (`ORD200` chains it once for the header). — `ORDERCUS.VIEW:20-21`
- **Tie-breaker present.** `order by datord desc, orid desc` — same-day orders are listed newest id first; `ORD200` has no tie-breaker. — `ORD201.PGM.SQLRPGLE:106` vs `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:113`
- **Silent truncation on any SQL condition.** The loop ends on the first non-zero `SQLCOD`, including errors and `-305` (NULL fetched into a host variable with no indicator). `ISOTODATE40` returns NULL for an invalid `8 0` date (`dat-utils-c01`); `RETURNS NULL ON NULL INPUT`. A NULL `DATLIV`/`DATCLO` ends the list at that row with no message and "Bottom" shown. A failed `open` (`sqlcod ≠ 0` before the first `dow` test) yields an empty list. — `ORD201.PGM.SQLRPGLE:107,117-127`, `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:11`
- **A NULL order date sorts first (inferred from DB2 for i semantics).** The `ORDER BY` is on the converted `datord`; DB2 for i orders NULL above every value, so in `DESC` a single order with an invalid `ORDATE` anywhere in the estate comes back **first**, the first fetch fails with `-305`, and `ORD201` shows an **empty list**. `ORD200` would show the same for that customer only. Runtime-confirmable; no such row in the sample data is known. — `ORD201.PGM.SQLRPGLE:100,106`
- **Sentinel dates.** `ISOTODATE40(0)` → `1940-01-01` (`dat-utils-c01`); `DATLIV`/`DATCLO` map that value to blanks; `DATORD` has no `MAPVAL`, so an order with `ORDATE = 0` would show `01/01/40` in job format. Host variables are `L` fields preset to `d'1940-01-01'` in `*inzsr`. — `ORD201D.DSPF:23-24,28-30`, `ORD201.PGM.SQLRPGLE:67,285-288`
- **Two-line record and `F11`.** `SFL01` spans rows 7–8; `SFLDROP(CF11)` lets the user drop the customer line (truncated form). The toggle is handled entirely by the display — `CF11` has no indicator in `indds` and no branch in `s01key`. The record count per page in truncated form is a display-file property (runtime-confirmable). `KEY01` labels it `F11=Detail`. `ORD200D` has a one-line record and no `SFLDROP`. — `ORD201D.DSPF:15-30,43,91-92`, `ORD201.PGM.SQLRPGLE:27-44`
- **Subfile capacity.** All orders of the estate go into one subfile: `rrn01` is `5i 0` (32 767) but a subfile holds 9 999 records — beyond that `write sfl01` fails unmonitored. Irrelevant for the sample data; relevant for a real estate (and more so here than in `ORD200`, which is per customer). — `ORD201.PGM.SQLRPGLE:49,122-124`
- **Host variables are file fields.** `cuid`/`custnm` are the `FCUST` buffer fields (also `SFL01` fields via `REFFLD`); `orid`/`oryear` are `FORDE` buffer fields. The fetch writes the `CUSTOME1` record buffer even though `CUSTOME1` is never read (`c10`). — `ORD201.PGM.SQLRPGLE:8,118-120`, `ORD201D.DSPF:19-21,26-27`
- **Positioning after a page load.** `RRB01 = RRN01 + 1` before the batch puts the first new row at the top of the page; after an Enter pass the `lrrn` copy keeps the user's page. `RRB01` is `SFLRCDNBR` without `CURSOR`, so the cursor is not moved to a row. — `ORD201.PGM.SQLRPGLE:114,138-140`, `ORD201D.DSPF:49`
- **Dead declarations.** `mode`, `User`, `crt`, `upd`, `help`, `prompt`, `morekeys` are declared and never referenced. Unlike `ORD200`, `rrs01`, `count`, `refresh` and `pagedown` are live here. — `ORD201.PGM.SQLRPGLE:28,30,34,55,57,59-60`
- **Screen furniture.** `PRINT` (Print key enabled) and `ERRSFL` (messages via the error subfile) on the file; panel id literal `'ORD200-1'` at 1/2 — the twin's id (`c09`); `DATE` (`EDTCDE(Y)`) / `TIME` at 1/68, 2/68. No customer header line (the customer is per row). — `ORD201D.DSPF:10-11,50,58-60`

## Dependencies

- `ORDERCUS.VIEW` over `"ORDER"` + `CUSTOMER` with correlated `DETORD` sum — `ORDERCUS.VIEW:5-21` (`sql-objects`, unbound — cited only)
- `ISOTODATE40` SQL UDF → `DAT002` (`dat-utils`, documented) — `ISOTODATE4.SQLUDF:4-14`
- `ORD201D.DSPF` `SFL01`/`CTL01`/`KEY01`; `REFFLD` to `ORDER` and `CUSTOMER` — `ORD201D.DSPF:19-21,26-27`
- Compile: `dftactgrp(*no) bnddir('SAMPLE')`; embedded SQL (`SQLRPGLE`). Activation group inferred `QILE` (no `ACTGRP` keyword) — build owner to confirm. — `ORD201.PGM.SQLRPGLE:5`

## Assumptions / unknowns

- The NULL-sorts-first consequence is stated from DB2 for i `ORDER BY` semantics, not from source; flagged inferred.
- Truncated-form page size under `SFLDROP` and the exact `lrrn` semantics are DDS/RPG contract statements; runtime confirmation would need the box.
- needs-SME: is the inner-join view the intended definition of "all orders" for the target list, or should orphaned orders be visible somewhere? (Room decision for the ORD pack; not fixed here.)

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:5-14,27-50,55-60,67,69-91,93-142,154,158,159-160,285-288,292` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:10-11,12-96` · `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:5-21` · `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:4-14` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:113` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:31-34`
