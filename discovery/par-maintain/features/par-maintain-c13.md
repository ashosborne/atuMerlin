# par-maintain-c13 — LOG100 uses PARAMETER's library as the application library

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — cross-slice dependency) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`LOG100` (the one-off "create the log user space" program of `log-programs`, no menu entry) opens `PARAMETER` **only to learn which library it lives in**: the file is `if e k disk` with an `INFDS` whose bytes 93–102 are the opened file's library, and that name is concatenated into the qualified user-space name `'SAMLOG    ' + Lib` passed to `QUSCRTUS`. No record is ever read. So the library that resolves `PARAMETER` on `*LIBL` is, by construction, "the application library" where `SAMLOG` is created; `LOG300` later finds the space with `'SAMLOG    *LIBL'`. This slice's table is therefore a **build/deployment anchor** for the log, independent of any parameter row — the dependency is on the object, not on data. Recorded here because it is the only use of `PARAMETER` outside `PAR200` / `PAR300`; the log behaviour itself belongs to `log-programs-c01` (accepted in the same wave, not deepened here).

## Entrypoints

- `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:6-7` — `fparameter if e k disk` / `f infds(info)`
- `LOG100.PGM.RPGLE:11-12` — `d info ds` / `d lib 93 102`
- `LOG100.PGM.RPGLE:20-22` — `usrspc = 'SAMLOG    ' + Lib; crtusrspc(usrspc:'LOG':5000:X'00':'*ALL':'Sample Application Log':'*YES':errcod);`
- Reader side: `ATU_SRC/QRPGLESRC/LOG300.RPGLE:41` — `usrspc = 'SAMLOG    *LIBL'`

## Inputs / outputs / observables

- In: the library name in the file-feedback INFDS of `PARAMETER` after the implicit open (positions 93–102 = library of the file actually opened via `*LIBL`). — `LOG100.PGM.RPGLE:6-7,11-12`
- Out: `*USRSPC SAMLOG` in that library (attribute `LOG`, 5 000 bytes, initial `X'00'`, `*ALL` authority, text `Sample Application Log`, replace `*YES`); then `QUSPTRUS` pointer, `pos = 7`, `data = '***'` written at the space's start; `*inlr`. — `LOG100.PGM.RPGLE:14-26`, `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4-12`
- Observable: `SAMLOG` appears next to `PARAMETER`; `PARAMETER` itself is untouched.

## Behaviour as implemented

1. Program start opens `PARAMETER` (`h dftactgrp(*no)`, no `usropn`) — the open resolves `*LIBL`; the INFDS is filled. — `LOG100.PGM.RPGLE:5-7`
2. `usrspc = 'SAMLOG    ' + Lib` — 10-char name + 10-char library = the 20-byte qualified name `QUSCRTUS` expects. — `:18,20`
3. `QUSCRTUS` with replace `*YES` — an existing `SAMLOG` in that library is replaced (log content lost; log-programs' concern). — `:21-22`
4. No `read` on `PARAMETER`; the file is closed by `*inlr`. — `:26`

## Validation rules found in code

None. `errcod` (256 bytes) is passed to the API but never inspected — an API failure is silent (`log-programs`). If `PARAMETER` is not on `*LIBL`, the implicit open fails → RPG status 01216/1217 → unmonitored → the program ends with an inquiry before creating anything (inference).

## Edge cases found in code

- **`PARAMETER` in a different library than the rest of the application** (e.g. a data library vs a program library): `SAMLOG` is created where `PARAMETER` is, and `LOG300`'s `*LIBL` lookup finds it only if that library is on the library list at run time — the two sides use different resolution rules (INFDS at install, `*LIBL` at run). Deployment fact; runtime-confirmable.
- **Two copies of `PARAMETER` on `*LIBL`** (test/prod): the first one wins for both the parameter data (`c09`) and the log location.
- **Dropping `PARAMETER` in the target** (if `PATH` becomes configuration — `c11`) removes `LOG100`'s anchor; the log's location rule needs a new source. Note for the `log-programs` card and the residual Architecture pack.

## Dependencies

- `PARAMETER.PF` as an object (not its rows) — `c12`
- `QUSCRTUS` / `QUSPTRUS` (`APICALL.RPGLEINC:4-14`); `SAMLOG` `*USRSPC` (runtime object, not in tree — `log-programs`)
- `LOG300` (`log-programs`) reads `SAMLOG` via `*LIBL`.

## Assumptions / unknowns

- INFDS positions 93–102 = library name of the opened file is the standard open-feedback layout (platform); which library that is on the box is deployment data.
- needs-SME: none specific to this slice; the question "where should the target log live" is `log-programs`'.

## Evidence

`ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:5-27` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4-14` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:41` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`
