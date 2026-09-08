# dat-utils-c07 — The 0 → 1940-01-01 sentinel is implemented three times across the estate

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The estate stores dates as `8 0` numerics with `0` meaning "no date" (`ORDER.ORDATDEL`, `ORDATCLO`, `CUSTOMER.CULASTORD`) and presents "no date" as a blank by first turning `0` into `1940-01-01` and then letting DDS `MAPVAL` blank that value. The `0 → 1940-01-01` step exists in three places: in SQL in `DAT002` (`ISOTODATE40`, this slice), in RPG in `CUS200` (explicit `if CULASTORD = 0`, `cus-interactive-c07`, documented) and in RPG in `ORD202` (implicitly — the fields are preset to `d'1940-01-01'` in `*inzsr` and simply not assigned when the numeric is `0`; `ord-maintain-ord202-c01`, unbound). Only the SQL variant also maps `99999999 → 2039-12-31`. `ORD200` / `ORD201` add a fourth dependency: they hold the same constant to **compare** the UDF's output (`datclo > datBlank` = "already closed"), so the SQL sentinel and the RPG constant must agree or option checks break silently. Meanwhile the *storage* convention `0` is tested directly by `ORD200`/`ORD201` (`if ordatdel = 0`), `ORD202` (`> 0`), `ORD901` (`> 0`) and `ART801` (`ORDATCLO = 0` = open order). One rule, several encodings, no shared definition.

## Entrypoints

- SQL: `DAT002.PGM.RPGLE:45-48` (`c01`) — `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:45-48`
- RPG explicit: `CUS200` `datBlank c d'1940-01-01'`; `if CULASTORD = 0; LASTORD = datBlank; else LASTORD = %date(CULASTORD:*iso)`; `*inzsr` preset — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:89,260-264,336`
- RPG implicit: `ORD202` `datBlank` constant; `*inzsr` presets `datord`/`datclo`/`datliv`; per-order `datord = %date(ordate:*iso); if ordatdel > 0 …; if ordatclo > 0 …` (no `else`) — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:58,83-91,147-151`
- RPG consumers of the sentinel value: `ORD200` / `ORD201` `datBlank` constant, `*inzsr` preset, `datclo > datBlank` / `datliv > datBlank` option guards — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,177-187,279-283`, `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:67,181-191,286-288`
- Display blanking: `MAPVAL(('1940-01-01' *BLANK))` on `ORD200D` / `ORD201D` `DATLIV`, `DATCLO` and `CUS200D` `LASTORD` (`DATFMT(*JOB)`); `MAPVAL(('01/01/40' *BLANK))` on `ORD202D` `DATLIV`, `DATCLO` (`DATFMT(*DMY)`) — `ATU_SRC/QDDSSRC/ORD200D.DSPF:24-27`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-24,29-30`, `ATU_SRC/QDDSSRC/CUS200D.DSPF:144-145`, `ATU_SRC/QDDSSRC/ORD202D.DSPF:57-60`

## Inputs / outputs / observables

- Stored: `ORDER.ORDATE` / `ORDATDEL` / `ORDATCLO` `8 0`; `CUSTOMER.CULASTORD` `8 0` (per `cus-interactive-c07`). `ORD100` creates orders with `ORDATDEL = 0`, `ORDATCLO = 0`. — `ATU_SRC/QDDSSRC/ORDER.PF:9-14`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194-196`
- Shown: blank on `ORD200`, `ORD201`, `ORD202`, `CUS200`; the raw number (`0`) on `CUS250` (`cus-interactive-c07`, pointer).
- Never shown: `2039-12-31` has no `MAPVAL` anywhere, so a `99999999` value would appear as a date on `ORD200` / `ORD201` (`c01`).

## Behaviour as implemented

| Where | Input | `0` handling | `99999999` handling | Invalid handling |
| --- | --- | --- | --- | --- |
| `DAT002` (SQL) | any `DECIMAL(8,0)` | `1940-01-01` | `2039-12-31` | NULL |
| `CUS200` (RPG) | `CULASTORD` | `1940-01-01` (explicit `if`) | `%date` — runtime error, unmonitored | runtime error, unmonitored |
| `ORD202` (RPG) | `ORDATDEL`, `ORDATCLO` | field left at the `*inzsr` preset `1940-01-01` | `%date` — runtime error, unmonitored | runtime error, unmonitored |
| `ORD202`, `ORD500` (RPG) | `ORDATE` | `%date(ordate:*iso)` with **no** guard — `0` would raise a runtime error; never `0` in-tree | runtime error | runtime error |

— `DAT002.PGM.RPGLE:45-56`, `CUS200.PGM.SQLRPGLE:260-264`, `ORD202.PGM.RPGLE:85-91,147-151`, `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:32`

Consumers of the raw `0` convention (no conversion): `ORD200`/`ORD201` `if ordatdel = 0` before stamping a delivery date on close — `ORD200.PGM.SQLRPGLE:246-249`, `ORD201.PGM.SQLRPGLE:252-255`; `ORD901` `if ordatdel > 0` / `if ordatclo > 0` and reset to `0` — `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:22-36`; `ART801` `ORDATCLO = 0` as "open order" — `ATU_SRC/QSQLSRC/ART801.SQLPRC:25,27,31,33`.

Derived (analysis, not observed at run time): `1940-01-01` is `*LOVAL` of RPG's 2-digit-year date formats and `2039-12-31` their `*HIVAL`; `ORD202D` shows the same sentinel as `01/01/40` under `DATFMT(*DMY)`. The choice was almost certainly made so that a "no date" value is representable and blankable in every date format the screens use; the `*JOB`-format screens inherit it.

## Validation rules found in code

None. No shared constant, copybook or SQL view centralises the sentinel; each member declares its own `d'1940-01-01'` (`CUS200.PGM.SQLRPGLE:89`, `ORD200.PGM.SQLRPGLE:74`, `ORD201.PGM.SQLRPGLE:67`, `ORD202.PGM.RPGLE:58`) or literal (`DAT002.PGM.RPGLE:46`).

## Edge cases found in code

- **`ORD202`'s mapping works by omission.** Because `datliv` / `datclo` are only assigned when the numeric is `> 0`, the blank relies on the `*inzsr` preset and on the program ending with `*inlr = *on` after each order (`ORD202.PGM.RPGLE:154`); within one activation the fields are never carried between orders because each call is a fresh program instance. Correction to the Phase A wording "converts ISO numeric dates; zero → 1940-01-01" for `ord-maintain-ord202-c01`: there is no conversion of zero, only a non-assignment. Pointer for that slice's bind.
- **SQL and RPG disagree on `0` vs `99999999`.** Only `DAT002` knows `2039-12-31`; the RPG paths would raise a date error on `99999999` (`%date(99999999:*iso)` is invalid). Unreachable in-tree (`c01`).
- **The RPG paths have no invalid-date protection.** `CUS200`, `ORD202`, `ORD500` call `%date(x:*iso)` unmonitored; an out-of-tree bad value would take the program to its `*PSSR` (or the default handler) where the SQL path returns NULL. Pointers to the owning slices.
- **Cross-language coupling.** `ORD200`/`ORD201` compare a SQL-produced `DATE` with an RPG constant; renaming the sentinel in one place (e.g. returning NULL from the UDF) would make the guards misfire *and* break the un-indicated fetch (`c03`).
- **`ISO_Num_To_Date` is the "no sentinel" variant** — the estate also contains the opposite choice (`0 → NULL`, `c02`), unused.

## Dependencies

- `cus-interactive-c07` (documented; `CUS200` side), `ord-maintain-ord202-c01` (unbound; `ORD202` side), `ord-maintain-ord200` / `ord-maintain-ord201` (unbound; comparison consumers), `ord-print-ord500` (unbound; unguarded `ORDATE`), `sql-objects` (`ART801`, `ORDERCUS`), `ord-batch-ord900` (deferred; `ORD901`). All cited, none deepened.
- `c01` (the SQL rule), `c02` (the no-sentinel sibling).

## Assumptions / unknowns

- Room / target question (Phase A `SME_BRIEF` question 1, still open): one "numeric ISO date with sentinels" rule referenced by the CUS / ORD cards, or NULL storage with the UI deciding how to show "none"? As-is there is no single owner of the rule. Not decided here.
- `needs-SME` carried from Phase A: "Collapse into one rule in the target?" — a design decision for the later ORD Architecture pack, not a documentation gap.

## Evidence

`ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:45-56` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:89,260-264,336` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:144-145` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:58,83-91,147-154` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:56-60` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,177-187,246-249,279-283` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:67,181-191,252-255,286-288` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:24-27` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-24,29-30` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:32` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194-196` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:22-36` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:25,27,31,33` · `ATU_SRC/QDDSSRC/ORDER.PF:9-14`
