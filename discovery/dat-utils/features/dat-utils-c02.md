# dat-utils-c02 — ISO_Num_To_Date plain conversion (0 → NULL)

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ISO_Num_To_Date(DECIMAL(8,0)) RETURNS DATE` (`SPECIFIC ISOTODATE`) is the sibling function backed by `DAT001`. It is the `ISOTODATE40` conversion **without** the two special values: every argument goes straight to `test(de) *iso`, so `0` (month `00`) and `99999999` (month `99`) are invalid ISO dates and return SQL NULL. `DAT001` and `DAT002` are otherwise line-for-line identical (status DS, 9-parameter interface, `*PSSR`, `return` without `*inlr`). The function has no caller in `ATU_SRC` (`c03`).

## Entrypoints

- `CREATE FUNCTION ISO_Num_To_Date (DECIMAL(8, 0)) RETURNS DATE LANGUAGE RPGLE SPECIFIC ISOTODATE DETERMINISTIC NO SQL RETURNS NULL ON NULL INPUT NO EXTERNAL ACTION EXTERNAL NAME DAT001 PARAMETER STYLE SQL` — `ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:20-30`; member `%TEXT` "Transfrom num ISO to date" and ARCAD header (author `VTAQUIN`, 29/11/2016, `01.01.00`) — `:2,4-19`
- Program `DAT001`, procedure interface `isotodat` — `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:31-39`; body — `:40-51`
- Callers in `ATU_SRC`: none (`c03`).

## Inputs / outputs / observables

- In: `dat8` `8 0` — the `DECIMAL(8,0)` argument. — `DAT001.PGM.RPGLE:32`
- Out: `date` `d` written on the valid path only; `date_ind` `0` or `-1`; `SQL_State` `'00000'`. — `:33-36,42-43,47,49`
- Observable: none in the tree — no SQL statement, view, RPG program or CL references the function; the only possible consumers are the QM queries `CUSQRY` / `ARTQRY` reached from menu options 12/13, whose source is not in the tree (blind spot). — `ATU_SRC/QPNLSRC/SAMMNU.MENU:126-132`, `overnight/METHOD_COVERAGE.md:18`

## Behaviour as implemented

1. `date_ind = *zero; SQL_State = '00000';` — `DAT001.PGM.RPGLE:42-43`
2. `test(de) *iso dat8; if %error; date_ind = -1; else; date = %date(dat8:*iso); endif;` — `:45-50`
3. `return;` (no `*inlr`, `c06`). — `:51`
4. `*PSSR` — `SQLSTATE 38I02` + message (`c05`). — `:53-60`

Difference from `DAT002` is exactly the absent `if dat8 = 0 / elseif dat8 = *Hival` block (`DAT002.PGM.RPGLE:45-49,56`); the two `/free` bodies are otherwise identical.

## Validation rules found in code

- `test(de) *iso` only (`c01` describes what it accepts). `0` fails because `00000000` has month `00`; `99999999` fails because month `99` is invalid. — `DAT001.PGM.RPGLE:45-47`

## Edge cases found in code

- **`0` → NULL, not a sentinel date.** A consumer that used this function on `ORDATDEL` / `ORDATCLO` / `CULASTORD` (where `0` means "none", `c07`) would get NULL rows and — if fetched into RPG host variables without indicators, as `ORD200`/`ORD201` do for `ISOTODATE40` — a failed fetch (`c01` edge case). No such consumer exists in the tree.
- **Same NULL-argument, negative-value and out-of-window behaviour as `c01`** (`RETURNS NULL ON NULL INPUT`; `dat8_ind` never read). — `ISOTODATE.SQLUDF:27`, `DAT001.PGM.RPGLE:34`
- **Two objects for one rule.** The estate carries two functions and two programs where one function with a flag, or one function plus `COALESCE`, would do; Phase A's `SME_BRIEF` recommended `defer` for `c02`/`c03`, the room accepted both for documentation.

## Dependencies

- None at run time (no files, no SQL, no service programs). Object-level: `DAT001` must exist in the library list when the function is invoked (`EXTERNAL NAME DAT001` is unqualified, `c04`). — `ISOTODATE.SQLUDF:29`
- `c04`, `c05`, `c06`, `c08` (shared mechanics); `c03` (no caller).

## Assumptions / unknowns

- `needs-SME`: do the QM queries `CUSQRY` / `ARTQRY` (not in tree) call `ISO_Num_To_Date`? If not, the function is dead and the room may prefer `reject` over carrying it into the target (Phase A open question 2, `c03`).

## Evidence

`ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:2,4-19,20-30` · `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:7-11,13-39,40-51,53-60` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:45-49,56` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:126-132`
