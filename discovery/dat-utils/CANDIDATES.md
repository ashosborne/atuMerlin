# CANDIDATES — dat-utils (Phase A, unbound)

Seed: SQL UDFs `ISO_Num_To_Date` (→ `DAT001`) and `ISOTODATE40` (→ `DAT002`). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| dat-utils-c01 | `ISOTODATE40(DECIMAL(8,0)) RETURNS DATE` → `DAT002`: `0` → `1940-01-01`; `99999999` (`*HIVAL`) → `2039-12-31`; otherwise `test(de) *iso` and `%date(dat8:*iso)`; invalid → SQL NULL (`date_ind = -1`); NULL in → NULL out (`RETURNS NULL ON NULL INPUT`) | `QRPGLESRC/DAT002.PGM.RPGLE:40-57`; `QSQLSRC/ISOTODATE4.SQLUDF:4-14` | observed-in-code | Core sentinel rule used by the order lists |
| dat-utils-c02 | `ISO_Num_To_Date(DECIMAL(8,0)) RETURNS DATE` (`SPECIFIC ISOTODATE`) → `DAT001`: same conversion **without** the special values — `0` is an invalid ISO date and returns NULL | `QRPGLESRC/DAT001.PGM.RPGLE:40-51`; `QSQLSRC/ISOTODATE.SQLUDF:20-30` | observed-in-code | Sibling function; different sentinel semantics |
| dat-utils-c03 | `ISO_Num_To_Date` has **no caller** in `ATU_SRC`; only `ISOTODATE40` is used (`ORD200`, `ORD201` cursors over `ORDERCUS` for `ORDATE`, `ORDATDEL`, `ORDATCLO`) | grep `ISO_Num_To_Date`/`ISOTODATE(` = none; `ORD200.PGM.SQLRPGLE:107-109`; `ORD201.PGM.SQLRPGLE:100-102` | observed-in-code | Call graph |
| dat-utils-c04 | Both UDFs are `LANGUAGE RPGLE`, `DETERMINISTIC`, `NO SQL`, `NO EXTERNAL ACTION`, `PARAMETER STYLE SQL` (9-parameter external interface: value, result, two null indicators, SQLSTATE, function name, specific name, message text) | `ISOTODATE.SQLUDF:23-30`; `ISOTODATE4.SQLUDF:7-14`; `DAT001.PGM.RPGLE:13-39` | observed-in-code | Interface contract |
| dat-utils-c05 | Error path: `*PSSR` sets `SQLSTATE 38I02` and returns the first 70 chars of the program status exception text as the SQL message | `DAT001.PGM.RPGLE:53-60`; `DAT002.PGM.RPGLE:59-66` | observed-in-code | Error contract |
| dat-utils-c06 | Programs `return` without `*inlr`, staying active between rows (normal for UDF programs); no state is kept between calls | `DAT001.PGM.RPGLE:51`; `DAT002.PGM.RPGLE:57` | observed-in-code | Runtime shape |
| dat-utils-c07 | The `0 → 1940-01-01` sentinel is implemented **three times** in the estate: here in SQL (`DAT002`), in RPG in `CUS200` (`LASTORD`, documented `cus-interactive-c07`, where DDS `MAPVAL` then blanks it) and in `ORD202` (`ord-maintain-ord202-c01`); the SQL variant also maps `99999999` → `2039-12-31`, which the RPG variants do not | `DAT002.PGM.RPGLE:45-48`; `CUS200.PGM.SQLRPGLE` (see card c07); `ORD202.PGM.RPGLE` | observed-in-code | Cross-slice duplication a target should collapse into one rule |
| dat-utils-c08 | Result `date` is left unassigned when the input is invalid (only the null indicator is set); harmless under SQL semantics but a target port must not read the value | `DAT001.PGM.RPGLE:45-50`; `DAT002.PGM.RPGLE:50-55` | observed-in-code | Port trap |

## Deferred recommendations (prose only)

- c01 + c07: recommend the room accept **one** "numeric ISO date with sentinels" rule and reference it from the CUS / ORD cards instead of three implementations. This is the smallest, purest seam in the estate and an ideal first golden-test candidate **when** test generation is unlocked (not from this radar).
- c02 / c03: `ISO_Num_To_Date` is unused; recommend `defer` (or `reject` if the QM queries — not in tree — do not use it either).
