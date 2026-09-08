# dat-utils-c04 — UDF interface contract (PARAMETER STYLE SQL, DETERMINISTIC, NO SQL)

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Both functions are declared identically apart from name, specific name and external program: `LANGUAGE RPGLE`, `DETERMINISTIC`, `NO SQL`, `RETURNS NULL ON NULL INPUT`, `NO EXTERNAL ACTION`, `PARAMETER STYLE SQL`, `EXTERNAL NAME DAT00n` (unqualified). `PARAMETER STYLE SQL` fixes the program's parameter list at **eight** for a one-argument function: argument, result, argument null indicator, result null indicator, `SQLSTATE`, qualified function name, specific name, message text. `DAT001` / `DAT002` declare exactly that list twice — once as a prototype with `extpgm` and once as the procedure interface — and use only four of the eight (`dat8`, `date`, `date_ind`, `SQL_State`) on the normal path plus `Msg_Text` on the error path. **Correction to the Phase A summary** ("9-parameter external interface"): the list has eight entries; the optional ninth and later slots (scratchpad, call type, dbinfo) are absent because `SCRATCHPAD`, `FINAL CALL` and `DBINFO` are not specified.

## Entrypoints

- `ISO_Num_To_Date` options — `ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:20-30`
- `ISOTODATE40` options — `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:4-14`
- `DAT001` prototype `isotodat pr extpgm('DAT001')` and `pi` — `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:13-29,31-39`
- `DAT002` prototype `isotodat40 pr extpgm('DAT002')` and `pi` — `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:13-29,31-39`

## Inputs / outputs / observables

| # | RPG parameter | Type | SQL meaning | Used by the body |
| ---: | --- | --- | --- | --- |
| 1 | `dat8` | `8 0` | argument `DECIMAL(8,0)` | read (`c01`, `c02`) |
| 2 | `date` | `d` | result `DATE` | written on success / sentinel paths only (`c08`) |
| 3 | `dat8_ind` | `5i 0` | argument null indicator | **never read** (`RETURNS NULL ON NULL INPUT` means the program is not called for NULL) |
| 4 | `date_ind` | `5i 0` | result null indicator | `0` or `-1` |
| 5 | `SQL_State` | `5` | SQLSTATE in/out | `'00000'` or `'38I02'` (`c05`) |
| 6 | `Function_Name` | `139` | qualified function name | never read |
| 7 | `Specific_Name` | `128` | specific name | never read |
| 8 | `Msg_Text` | `70 varying` | message text out | written in `*PSSR` only (`c05`) |

— `DAT001.PGM.RPGLE:31-39`, `DAT002.PGM.RPGLE:31-39` (the optional scratchpad / call-type / dbinfo parameters are absent because neither `SCRATCHPAD`, `FINAL CALL` nor `DBINFO` is specified).

## Behaviour as implemented

1. DB2 resolves the function by signature (`DECIMAL(8,0)` argument), applies `RETURNS NULL ON NULL INPUT`, then calls program `DAT001` / `DAT002` with the eight parameters above. — `ISOTODATE.SQLUDF:20-30`, `ISOTODATE4.SQLUDF:4-14`
2. The program treats the call as a plain program call: no `H` spec, cycle-main program, `pi` on the main procedure. — `DAT001.PGM.RPGLE:1-39`
3. On return DB2 reads `date_ind`, then `date` if `0`, and raises an SQL error if `SQL_State` is not `'00000'`/warning class (`c05`).

Option-by-option, as declared (both members):

- `LANGUAGE RPGLE` — external program in RPG; `PROGRAM TYPE` not specified, so the default `MAIN` (a `*PGM`, matching `extpgm`) applies.
- `DETERMINISTIC` — same result for the same argument; truthful here (no I/O, no state, `c06`).
- `NO SQL` — the programs contain no SQL (they are `.RPGLE`, not `.SQLRPGLE`); DB2 would reject SQL from within them.
- `RETURNS NULL ON NULL INPUT` — NULL short-circuits; the program never sees a NULL argument.
- `NO EXTERNAL ACTION` — no side effects claimed; truthful.
- `PARAMETER STYLE SQL` — the parameter list documented above.
- `SPECIFIC ISOTODATE` / `ISOTODATE4` — the 10-character specific names equal the source member names, which is what the ARCAD `%METADATA` build convention keys on; `ISO_Num_To_Date` (15 characters) needs the short specific name to be an IBM i object.
- `EXTERNAL NAME DAT001` / `DAT002` — **not library-qualified**; the program is located through the library list, so a deployment that puts the functions and programs in different libraries depends on `*LIBL` at run time.

Not specified (defaults apply, none visible in source): `FENCED` / `NOT FENCED`, `ALLOW PARALLEL`, `SCRATCHPAD`, `FINAL CALL`, `PROGRAM TYPE`, `SET OPTION`.

## Validation rules found in code

None beyond the SQL signature: DB2 casts an `INTEGER` or `DECIMAL(8,0)` column to the parameter type; a `CHAR` argument would not resolve to this function. The programs do not check `dat8_ind`, `Function_Name` or `Specific_Name`.

## Edge cases found in code

- **Unused indicators.** `dat8_ind` is declared in both members and referenced nowhere in either body; if the function were ever recreated with `CALLED ON NULL INPUT` the program would treat the (undefined) argument as a number and the result would be `test(de)`-dependent rather than NULL. — `DAT001.PGM.RPGLE:19,34,40-51`
- **Prototype duplicated per program.** Each member repeats the 8-parameter list as both `pr` and `pi`; there is no shared copybook in `QPROTOSRC` for the SQL parameter style, and no in-tree RPG caller uses the `extpgm` prototype (the programs are only ever called by DB2). — `DAT001.PGM.RPGLE:13-29`, `DAT002.PGM.RPGLE:13-29`
- **Status data structure fields.** `stPgmName` (positions 1–10) is declared and unused; `stExcText` (91–170, 80 characters) feeds the error message (`c05`). — `DAT001.PGM.RPGLE:7-11`, `DAT002.PGM.RPGLE:7-11`
- **Two `CREATE FUNCTION` members, no build script.** Nothing in the tree creates the functions (no CL `RUNSQLSTM`, no install member); creation order (programs before functions) and target library are build metadata. — structural grep of `ATU_SRC/**` for `ISOTODATE`, `DAT001`, `DAT002`

## Dependencies

- Programs `DAT001` / `DAT002` resolvable in the library list at call time. — `ISOTODATE.SQLUDF:29`, `ISOTODATE4.SQLUDF:13`
- `c05` (error contract), `c06` (activation), `c08` (result semantics).

## Assumptions / unknowns

- Compile options (activation group, `FIXNBR`, `EXPROPTS`) are not in source (no `H` spec); the ARCAD build defines them. Nothing in the cards depends on them beyond `c06`.
- Whether the functions are created `FENCED` or `NOT FENCED` on the box is unknown; it affects performance only, not the documented values.

## Evidence

`ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:20-30` · `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:4-14` · `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:1-39,40-51` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:1-39`
