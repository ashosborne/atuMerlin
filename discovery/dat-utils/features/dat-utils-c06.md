# dat-utils-c06 — Programs stay active between rows (return without *inlr); no state kept

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`DAT001` and `DAT002` end every call — normal and `*PSSR` — with `return` and never set `*inlr`, so after the first row of a statement the program stays active and later calls skip cycle initialisation. Nothing carries over that matters: the programs open no files, declare no global variables of their own besides the status DS, and re-initialise both outputs they own (`date_ind`, `SQL_State`) at the top of every call. The result parameter `date` is DB2's storage, not the program's (`c08`). The shape is the normal one for a `PARAMETER STYLE SQL` external function invoked once per row.

## Entrypoints

- `return` on the normal path — `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:51`, `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:57`
- `return` in `*PSSR` — `DAT001.PGM.RPGLE:59`, `DAT002.PGM.RPGLE:65`
- No `*inlr`, no `H` spec, no `F` spec in either member — `DAT001.PGM.RPGLE:1-61`, `DAT002.PGM.RPGLE:1-67`

## Inputs / outputs / observables

- Per-call state reset: `date_ind = *zero; SQL_State = '00000';` — `DAT001.PGM.RPGLE:42-43`, `DAT002.PGM.RPGLE:42-43`
- Program-owned storage that persists: the status data structure (`stPgmName`, `stExcText`) — informational only, never written by the code. — `DAT001.PGM.RPGLE:7-11`
- Observable: none from SQL — a second call with the same argument yields the same result (`DETERMINISTIC` is truthful, `c04`).

## Behaviour as implemented

1. First call in the activation group: full program initialisation, then the body.
2. `return` — program remains active (`*inlr` off).
3. Subsequent calls re-enter at the body with the parameters DB2 passes for that row; `date_ind` and `SQL_State` are overwritten before any branch. — `DAT001.PGM.RPGLE:42-50`, `DAT002.PGM.RPGLE:42-56`
4. Program end (and file / storage release) happens only when the activation group ends — a property of how DB2 runs the routine and of the compile options, not of the source.

## Validation rules found in code

None.

## Edge cases found in code

- **No stale data is possible in the outputs.** Both program-written outputs are unconditionally reset; the value parameter `date` is not program storage. Contrast the `FVAT` / `FCUSTOMER` getters, where the same "stay active" shape *does* keep a last-key buffer (`vat-module-c05`, `cus-modules`).
- **`*PSSR` also returns without `*inlr`.** After an exception the program stays active in whatever state the exception left; there is no program state to be left inconsistent (`c05`).
- **No `H` spec.** `DFTACTGRP`, `ACTGRP`, `FIXNBR`, `EXPROPTS` etc. are not in source; the default `CRTBNDRPG` behaviour for a member without an `H` spec places the program in the default activation group unless the ARCAD build overrides it. Compile-time, not in source — same class of unknown as the callers' activation group recorded for `vat-module` (`c05`/`c09` there).
- **DB2's own caching is the performance lever, not the program.** With `DETERMINISTIC` DB2 may avoid re-invoking the program for repeated arguments within a statement; the program itself has no cache.

## Dependencies

- `c04` (interface), `c05` (error return), `c08` (result storage).

## Assumptions / unknowns

- Which activation group the programs run in when invoked by DB2 (and whether `NOT FENCED` is in effect) is unknown from source; it affects only where the active program lives, not any documented value.

## Evidence

`ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:1-11,42-43,51,59` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:1-11,42-43,57,65` · `ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:25` · `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:9`
