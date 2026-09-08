# ord-maintain-ord200-c01 — List customer's orders from ORDERCUS view

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD200(cuid)` opens an SQL cursor over the view `ORDERCUS` for one customer (`orcuid = :cuid`), converts the three `8 0` dates with `ISOTODATE40`, takes the VAT-inclusive order total `TOTVAL`, and loads **every** row into the subfile in one pass (`dow sqlcod = 0`), newest order date first. There is no paging logic, no `F5` handler and no tie-breaker on the sort; the list is rebuilt from the database only at start and after `F6` create.

## Entrypoints

- Program entry `ORD200` with one parameter `cuid` (`like(orcuid)` → `5P 0`) — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:15-19`, `ATU_SRC/QDDSSRC/SAMREF.PF:15`
- Panel 1 state machine `pnl01` → `s01prp` → `s01lod` → `s01dsp` (`exfmt ctl01`) — `ORD200.PGM.SQLRPGLE:76-98,100-144`
- Subfile `SFL01` / control `CTL01` / footer `KEY01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:12-92`

## Inputs / outputs / observables

- In: `cuid`; rows of `ORDERCUS` where `ORCUID = :cuid`. — `ORD200.PGM.SQLRPGLE:105-113`, `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:5-21`
- Out (screen): one `SFL01` row per order — `OPT01` (`2Y 0B`, `EDTCDE(Z)`), `ORID` (`EDTCDE(2)`), `ORYEAR`, `DATORD` (`L`, `DATFMT(*JOB)`), `SUMORD` (`11Y 2`, `EDTCDE(2)`, column heading "Value"), `DATLIV`, `DATCLO` (both `MAPVAL(('1940-01-01' *BLANK))`). — `ORD200D.DSPF:15-28,71-82`
- `SUMORD` ← `TOTVAL` = `COALESCE(SUM(ODTOTVAT), 0)` over `DETORD` for the order — **VAT-inclusive**, zero for an order without lines. — `ORDERCUS.VIEW:17-19`
- No writes. The cursor is closed at the end of the load. — `ORD200.PGM.SQLRPGLE:129`

## Behaviour as implemented

1. `s01prp`: `RRN01 = 0`, `SFLCLR` write of `CTL01`, then `declare c1 cursor for SELECT ORID, ORYEAR, ISOTODATE40(ORDATE) AS DATORD, ISOTODATE40(ORDATDEL) AS DATLIV, ISOTODATE40(ORDATCLO) AS DATCLO, Totval FROM Ordercus WHERE orcuid = :cuid ORDER BY datord DESC`; `open c1`. — `ORD200.PGM.SQLRPGLE:100-116`
2. `s01lod`: `RRB01 = RRN01 + 1` (always 1 here), `opt01 = 0`; `fetch c1 into :orid, :oryear, :datord, :datliv, :datclo, :sumord`; `dow sqlcod = 0`: `RRN01 += 1; write sfl01; fetch`. Then `close c1`, `sflend = *on`, `step01 = dsp`. — `ORD200.PGM.SQLRPGLE:118-132`
3. `s01dsp`: `SFLDSPCTL` on, `SFLDSP` only when `RRN01 > 0`; `write key01`; `exfmt ctl01`; if the INFDS top-of-page RRN (`lrrn`, positions 378–379) is non-zero it becomes `RRB01`, so the same page is redisplayed after an option pass. — `ORD200.PGM.SQLRPGLE:52-53,134-144`
4. `SFLSIZ(15)` ≠ `SFLPAG(14)` → the subfile auto-extends; `SFLEND(*MORE)` under indicator 80, which is set on after every load. Paging between the loaded pages is done by the display; the program has no `PAGEDOWN` keyword in the DSPF and no `when pagedown` branch. — `ORD200D.DSPF:31-32,39`, `ORD200.PGM.SQLRPGLE:146-160`
5. Reload points: `step01 = prp` is set only by `F3`/`F12` (which then end the program) and by `F6` create (`c02`). Options `4`, `7`, `8` update the displayed row in place (`c04`, `c06`, `c07`); nothing else re-reads the database.

## Validation rules found in code

None on the load. `cuid` is not checked against `CUSTOMER` here (`c11`); a customer with no orders yields `RRN01 = 0` and `SFLDSP` off — header and footer only, no message.

## Edge cases found in code

- **Sort has no tie-breaker.** `ORDER BY datord DESC` only; orders created the same day come back in an unspecified order. The twin `ORD201` adds `, orid desc`. — `ORD200.PGM.SQLRPGLE:113` vs `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:106`
- **Whole result loaded, no paging.** `dow sqlcod = 0` fetches to end; `ORD201` fetches 14 per `PAGEDOWN` and keeps the cursor open. `RRN01` is `5i 0` (max 32 767) but a subfile holds at most 9 999 records — a customer with more orders than that would hit an unmonitored `write sfl01` exception. Irrelevant for the sample data; relevant for a real estate. — `ORD200.PGM.SQLRPGLE:55,123-128` vs `ORD201.PGM.SQLRPGLE:112-130`
- **Silent truncation on any SQL condition.** The loop ends on the first non-zero `SQLCOD`, including errors and `-305` (NULL fetched into a host variable with no indicator). `ISOTODATE40` returns NULL for an invalid `8 0` date (`dat-utils-c01`), so one bad date ends the list at that row with no message; a failed `open` yields an empty list. — `ORD200.PGM.SQLRPGLE:114,121-128`, `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:11`
- **`F5` is enabled but unlabelled and unhandled.** `CA05(05 'Refresh')` is on `CTL01`; `KEY01` shows only `F3`, `F6`, `F12`; the `refresh` indicator is declared and never tested, so `F5` falls to `other` → `s01chk` → `s01act` with no field data returned (`CA` key) and the list is redisplayed as it was — **not** reloaded. `ORD201` labels and handles `F5`. — `ORD200D.DSPF:34,85-92`, `ORD200.PGM.SQLRPGLE:37,146-160` vs `ORD201.PGM.SQLRPGLE:152-154`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:93`
- **Inner join hides orders of a missing customer.** `ORDERCUS` is `"ORDER" H, CUSTOMER WHERE ORCUID = CUID`; an order whose `ORCUID` has no `CUSTOMER` row is not listed (the "ORDERCUS join" planted defect in the bind record — as-is). For `ORD200` the effect is an empty list for an unknown `cuid`. — `ORDERCUS.VIEW:20-21`
- **Sentinel dates.** `ISOTODATE40(0)` → `1940-01-01` (`dat-utils-c01`); `DATLIV` / `DATCLO` map that value to blanks on screen, `DATORD` has no `MAPVAL` so an order with `ORDATE = 0` would show `01/01/40` in job format. The date host variables are `L` fields initialised to the sentinel in `*inzsr` (`c11`). — `ORD200D.DSPF:23-27`, `ORD200.PGM.SQLRPGLE:74,280-282`
- **Cursor closed after load, never in `pnl00`.** Because the load runs to end, `close c1` in `s01lod` is sufficient; `ORD201` needs the extra close on exit because it pages. `*inlr = *on` at exit closes the native files. — `ORD200.PGM.SQLRPGLE:129,286-288` vs `ORD201.PGM.SQLRPGLE:292`
- **Dead declarations.** `rrs01`, `count`, `mode`, `User`, `savId`, `crt`, `upd`, `help`, `prompt`, `refresh`, `morekeys`, `pagedown` are declared and never referenced — `ORD201`-shaped leftovers (`ORD201` uses `rrs01` and `count` for paging). — `ORD200.PGM.SQLRPGLE:33-41,55-67`

## Dependencies

- `ORDERCUS.VIEW` over `"ORDER"` + `CUSTOMER` with correlated `DETORD` sum — `ORDERCUS.VIEW:5-21`
- `ISOTODATE40` SQL UDF → `DAT002` (`dat-utils`, documented) — `ISOTODATE4.SQLUDF:4-14`
- `ORD200D.DSPF` `SFL01`/`CTL01`/`KEY01`; `REFFLD` to `ORDER` and `CUSTOMER` for `ORID`, `ORYEAR`, `CUID`, `CUSTNM` — `ORD200D.DSPF:19-22,69-70`
- Compile: `dftactgrp(*no) bnddir('SAMPLE')`; embedded SQL (`SQLRPGLE`). Activation group inferred `QILE` (no `ACTGRP` keyword) — build owner to confirm. — `ORD200.PGM.SQLRPGLE:5`

## Assumptions / unknowns

- Whether the un-tie-broken sort and the whole-result load are accepted as-is or should follow `ORD201` in the target (needs-SME; the twins are separate slices by charter).
- `F5` behaviour with a `CA` key and `READC` is stated from the DDS/RPG contract (no field data returned); runtime confirmation would need the box.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:5,15-19,33-41,52-67,74,76-98,100-144,146-160,280-282,286-288` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:12-92` · `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:5-21` · `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:4-14` · `ATU_SRC/QDDSSRC/SAMREF.PF:15` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:106,112-130,152-154,292` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:93`
