# dat-utils-c01 — ISOTODATE40 sentinel conversion (0 → 1940-01-01, 99999999 → 2039-12-31, invalid → NULL)

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ISOTODATE40(DECIMAL(8,0)) RETURNS DATE` is an external SQL scalar function backed by the RPG program `DAT002`. It turns the estate's 8-digit numeric ISO dates (`yyyymmdd` stored in `8 0` columns) into a SQL `DATE` with two special values: `0` → `1940-01-01` and `99999999` (`*HIVAL` of an `8 0` field) → `2039-12-31`. Any other value is validated with `test(de) *iso`; a valid value is converted with `%date`, an invalid one returns SQL NULL by setting the result null indicator. A NULL argument never reaches the program (`RETURNS NULL ON NULL INPUT`). This is the only date rule the order lists (`ORD200`, `ORD201`) rely on, and the `1940-01-01` value is what their screens blank out and their option checks compare against.

## Entrypoints

- `CREATE FUNCTION ISOTODATE40 (DECIMAL(8, 0)) RETURNS DATE … SPECIFIC ISOTODATE4 … EXTERNAL NAME DAT002 PARAMETER STYLE SQL` — `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:4-14`; member `%TEXT` "Transform num ISO to date, 0 = 01/01/1940" — `:2`
- Program `DAT002`, procedure interface `isotodat40` (9 parameters, `c04`) — `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:31-39`; body — `:40-57`
- Callers in `ATU_SRC` (call sites only, `c03`): `ORD200` cursor `c1` over `ORDERCUS` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:105-113`; `ORD201` cursor `c1` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:98-106`

## Inputs / outputs / observables

- In: `dat8` `8 0` (packed, by reference from the SQL runtime) — the `DECIMAL(8,0)` argument. In-tree arguments are `ORDER.ORDATE`, `ORDER.ORDATDEL`, `ORDER.ORDATCLO` (`8 0`, "ORDER DATE" / "DELIVERY DATE" / "CLOSE DATE") read through the `ORDERCUS` view, which exposes them unconverted. — `DAT002.PGM.RPGLE:32`, `ATU_SRC/QDDSSRC/ORDER.PF:9-14`, `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:15-16`
- Out: `date` `d` (RPG date, `*ISO` by default) written only on the two sentinel paths and the valid path; `date_ind` `5i 0` = `0` (value present) or `-1` (SQL NULL); `SQL_State` `'00000'`. — `DAT002.PGM.RPGLE:33-36,42-43,46,48,52,54`
- Observable: the order-list subfile columns `DATORD`, `DATLIV`, `DATCLO` (`L`, `DATFMT(*JOB)`); `DATLIV` / `DATCLO` carry `MAPVAL(('1940-01-01' *BLANK))`, so the `0` sentinel renders blank; `DATORD` has no `MAPVAL`. `ORD200`/`ORD201` also compare the returned `DATLIV` / `DATCLO` against the constant `d'1940-01-01'` to decide whether an order is already delivered / closed. — `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-27`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-24,28-30`, `ORD200.PGM.SQLRPGLE:74,177-187`, `ORD201.PGM.SQLRPGLE:67,181-191`

## Behaviour as implemented

1. `date_ind = *zero; SQL_State = '00000';` — every call starts by declaring the result non-null and the state OK. — `DAT002.PGM.RPGLE:42-43`
2. `if dat8 = 0; date = D'1940-01-01';` — `:45-46`
3. `elseif dat8 = *Hival; date = D'2039-12-31';` — for an `8 0` field `*HIVAL` is `99999999`. — `:47-48`
4. `else; test(de) *iso dat8;` — validates the number as a `yyyymmdd` ISO date. `if %error; date_ind = -1;` (result NULL, `date` untouched — `c08`) `else; date = %date(dat8:*iso);`. — `:49-56`
5. `return;` — without `*inlr` (`c06`). — `:57`
6. `*PSSR` — any other exception sets `SQLSTATE 38I02` and a message (`c05`). — `:59-66`

Derived (analysis of the source, not a runtime observation): `1940-01-01` and `2039-12-31` are exactly RPG's `*LOVAL` and `*HIVAL` for the 2-digit-year date formats (`*DMY`, `*MDY`, `*YMD`, `*JUL`), whose representable window is 1940–2039. The same two dates therefore appear as `MAPVAL(('01/01/40' *BLANK))` on the `*DMY` display fields of `ORD202D` and as `d'1940-01-01'` constants in the RPG callers (`c07`). The rule a target must reproduce is `0 → 1940-01-01`, `99999999 → 2039-12-31`, valid `yyyymmdd` → that date, anything else → NULL.

## Validation rules found in code

- `test(de) *iso` on the non-sentinel path only: rejects month `00`/`13+`, day `00`/out-of-range for the month (including 29 February in a non-leap year), and any value that is not a well-formed 8-digit ISO date. Years `0001`–`9999` are accepted (leading zeros: `10101` is `0001-01-01`). — `DAT002.PGM.RPGLE:50-52`
- No range check: dates far outside the business window (e.g. `00010101`, `99991231`) convert successfully. The sentinel check is an exact equality on `0` and `99999999`; a value such as `99999998` goes to `test(de)` and returns NULL.

## Edge cases found in code

- **`0` and `99999999` are the only special values.** `ORD100` writes `ORDATDEL = 0` / `ORDATCLO = 0` on create and `ORDATE = %dec(%date():*iso)`, `ORD200`/`ORD201` write `%dec(%date():*iso)` on deliver/close, `ORD901` shifts dates by whole days and resets to `0`. No in-tree writer produces `99999999`, so the `2039-12-31` branch is unreachable from in-tree data; it is reachable from DFU / SQL writes. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194-196`, `ORD200.PGM.SQLRPGLE:244-259`, `ORD201.PGM.SQLRPGLE:250-265`, `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21-36`
- **`2039-12-31` is not blanked on screen.** The `MAPVAL` on `DATLIV` / `DATCLO` maps `1940-01-01` only, so a `99999999` close date would display as 31 December 2039 and, being `> d'1940-01-01'`, would count as "already closed" in the option checks. — `ORD200D.DSPF:25,27`, `ORD200.PGM.SQLRPGLE:177-187`
- **NULL result stops the caller's list load (pointer, `ord-maintain-ord200` / `ord-maintain-ord201`).** Both callers `fetch … into :datord, :datliv, :datclo` with **no indicator variables** and loop `dow sqlcod = 0`; a NULL returned for any of the three columns makes the fetch fail (SQLCODE `-305`, indicator variable required) and the loop ends at that row without a message. Derived: because the cursors `order by datord desc`, a NULL `DATORD` sorts first and empties the list. Reachable only via out-of-tree writes (all in-tree writers produce `0` or a valid date). — `ORD200.PGM.SQLRPGLE:113,121-131`, `ORD201.PGM.SQLRPGLE:106,117-125`
- **Negative or non-8-digit values** (`DECIMAL(8,0)` can hold `-99999999..99999999`): not `0`, not `*HIVAL`, fail `test(de)` → NULL.
- **NULL argument**: `RETURNS NULL ON NULL INPUT` — DB2 returns NULL without calling `DAT002`; the program never reads `dat8_ind` (declared, unreferenced in the body). — `ISOTODATE4.SQLUDF:11`, `DAT002.PGM.RPGLE:34,40-57`
- **`DETERMINISTIC`** is truthful (no I/O, no state, `c06`), so the optimiser may evaluate the function once per distinct argument within a statement. — `ISOTODATE4.SQLUDF:9`

## Dependencies

- `ORDER.PF` `ORDATE` / `ORDATDEL` / `ORDATCLO` `8 0` — `ORDER.PF:9-14`; exposed unconverted by `ORDERCUS.VIEW` (`sql-objects`, cited only) — `ORDERCUS.VIEW:10-12,15-16`
- `c04` (interface contract), `c05` (error path), `c06` (program stays active), `c08` (result untouched on NULL), `c03` (callers), `c07` (sibling sentinel implementations).
- Consumers of the sentinel value (pointers, not deepened): `ORD200` / `ORD201` option checks `datclo > datBlank`, `datliv > datBlank`. — `ORD200.PGM.SQLRPGLE:177-187`, `ORD201.PGM.SQLRPGLE:181-191`

## Assumptions / unknowns

- The `*LOVAL` / `*HIVAL`-of-`*DMY` reading of the two constants is analysis; the source states only the literals and the `%TEXT` "0 = 01/01/1940".
- `SME_BRIEF` question: is `1940-01-01` the agreed "no date" sentinel for the target, or should the target return NULL / an option type and let the UI decide? (Phase A open question 1, still open.)

## Evidence

`ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:2,4-14` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:31-57,59-66` · `ATU_SRC/QDDSSRC/ORDER.PF:9-14` · `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:10-12,15-16` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,105-113,121-131,177-187,244-259` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:67,98-106,117-125,181-191,250-265` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-27` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-24,28-30` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194-196` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21-36` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:56-60`
