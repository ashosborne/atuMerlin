# par-maintain-c11 — Only PATH is a live parameter; GetPARM1/3/4/5 unused

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — call graph / data contract) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The whole parameter subsystem serves **one key**: `GetParm2('PATH':' ')`, called from exactly four places — `ORD500` (PDF directory, via `ORD500C TODIR`), `PRO202` (purchase-order XML, `%trim(path) + fileName`), `PRO203` (purchasing spreadsheet, same concatenation) and `PAR201` (`WRKLNK`). `GetPARM1`, `GetPARM3`, `GetPARM4`, `GetPARM5` and `ClosePARAMETER` have **no caller** in `ATU_SRC`; columns `PARM1`, `PARM3`, `PARM4`, `PARM5` are maintained by `PAR200` and read by nobody. The implicit contract of `PATH`: ≤ 100 characters, an IFS directory, **ending with `/`** (two of the four consumers concatenate without a separator — `c07`), case as typed (`CHECK(LC)`), read once per job and cached (`c09`), blank tolerated silently (`c08`). No other key is referenced by any source member; whether other rows exist on the box is data (Phase A question 3, open).

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:13,26,58-59` — `/COPY PARAMETER.RPGLEINC`; `path 100`; `path = getParm2('PATH':' '); pdfOrd(%trim(%char(orid)):path)` → `ORD500C TODIR(&PATH)` (`ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:7,11-12`)
- `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:12,151-152` — `path = getParm2('PATH':' '); xmlopen(%trim(path) + fileName)`
- `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:8,32-33` — `path = GetParm2('PATH':' '); xssopenfile(%trim(path) + fileName)`
- `ATU_SRC/QCLSRC/PAR201.CLLE:5-8` — `CALLPRC GETPARM2 (&CODE='PATH', &SUBCODE=' ')`
- Absence: grep of `ATU_SRC/**` for `GetPARM1|GetPARM3|GetPARM4|GetPARM5|ClosePARAMETER` (case-insensitive) — prototype (`PARAMETER.RPGLEINC`) and body (`PAR300.RPGLE`) only.

## Inputs / outputs / observables

- In: one `PARAMETER` row `('PATH', ' ')`, column `PARM2` (100A). — `ATU_SRC/QDDSSRC/PARAMETER.PF:6-9`
- Out: the directory used for every generated file in the estate — `Custord<orid>.pdf` (`ORD500C`), `Pur_Ord_<prid>_<yymmdd>.xml` (`PRO202`), `Goods to purchase_<yymmdd>.xml` (`PRO203`) — and the directory `PAR201` opens.

## Behaviour as implemented

| Consumer | Call | How `PATH` is joined | Separator needed | Slice / card |
| --- | --- | --- | --- | --- |
| `ORD500` → `ORD500C` | `getParm2('PATH':' ')` into `path 100` | `TODIR(&PATH)` + `TOSTMF('Custord…pdf')` | no (command joins) | `ord-print-ord500-c02` (documented) |
| `PRO202` (in `PRO200`) | `getParm2('PATH':' ')` | `%trim(path) + 'Pur_Ord_…xml'` | **yes** — trailing `/` in the data | `pro-interactive-c05` (accepted, not yet carded) |
| `PRO203` | `GetParm2('PATH':' ')` | `%trim(path) + 'Goods to purchase_…xml'` | **yes** | `pro-interactive-c13` (accepted, not yet carded) |
| `PAR201` | `CALLPRC GETPARM2` | `&PATH *TCAT '*'` → `WRKLNK` | yes for "directory contents" (`c07`) | `c07` |

1. All four pass the literal key; none reads any other row, none passes a variable key, none reads `PARM1`/`PARM3`/`PARM4`/`PARM5`. — lines above
2. All four run in `QILE` (explicit or default — `c09`), so within one interactive job the first consumer's read is the value for all of them.
3. `PAR200` is the only writer (create/edit/delete — `c02`, `c04`, `c05`); there is no seed, install script or SQL that creates the `PATH` row in the tree — its presence is an installation fact.

## Validation rules found in code

None in any consumer: no blank test, no existence test, no separator normalisation, no length check.

## Edge cases found in code

- **Trailing `/`.** With `PATH = '/home/sample/out'` (no slash): `ORD500C` writes `/home/sample/out/Custord123.pdf`; `PRO202` writes `/home/sample/outPur_Ord_…xml`; `PRO203` writes `/home/sample/outGoods to purchase_…xml`; `PAR201` shows the entries of `/home/sample` starting with `out` — which happens to include all three. With the slash everything is in one directory. One data value, two conventions.
- **Blank** — `c08`. **Stale** — `c09`.
- **Case.** `PARM2` keeps case (`CHECK(LC)`); IFS root file system is case-insensitive for names, `QOpenSys` is not — which file system `PATH` points at is data.
- **Dead API.** `GetPARM1/3/4/5` are typed returns (10A, 2A, 1P 0, 3P 0) for columns with no reader; `PAR200`'s edit/create screens spend five of seven fields on them.

## Dependencies

- `FPARAMETER` (`c09`, `c10`); `PARAMETER.PF` (`c12`).
- Downstream slices: `ord-print-ord500` (documented), `pro-interactive` (accepted, queued) — their cards own the file-name rules; this card owns the `PATH` contract.

## Assumptions / unknowns

- needs-SME / room: **treat `PATH` as target configuration** (environment / settings), not as a maintained table row — Phase A's recommendation, unchanged and sharpened: one key, one column, four literal readers, no other consumer. If so, `PAR200` (`c01`–`c06`) and `PAR201` (`c07`) have nothing left to maintain or browse.
- needs-SME (data): value of `PATH` on the box (trailing slash? which file system?), and whether any other `PARAMETER` rows exist (nothing in source would read them).

## Evidence

`ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:13,26,58-59` · `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:7,11-12` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:12,148-152` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:8,30-33` · `ATU_SRC/QCLSRC/PAR201.CLLE:5-8` · `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:7-37` · `ATU_SRC/QRPGLESRC/PAR300.RPGLE:22-80` · `ATU_SRC/QDDSSRC/PARAMETER.PF:6-9`
