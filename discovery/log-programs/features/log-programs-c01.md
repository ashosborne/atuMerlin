# log-programs-c01 — LOG100 creates the SAMLOG user space (5000 bytes) in PARAMETER's library

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — install / setup step) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`LOG100` ("Create Log UserSpace", 27 lines) is the one-off setup program for the application log. It opens `PARAMETER` **only** to learn the library the file resolved to on `*LIBL` (INFDS bytes 93–102 — `par-maintain-c13` owns that fact), builds the qualified name `'SAMLOG    ' + Lib`, and calls `QUSCRTUS` to create a `*USRSPC` named `SAMLOG` there: extended attribute `LOG`, **initial size 5000 bytes**, initial value `X'00'`, public authority `*ALL`, text `Sample Application Log`, **replace `*YES`**. It then retrieves a pointer to the new space with `QUSPTRUS` and writes the 7-byte header (`c02`): `pos = 7`, `data = '***'`. No parameter, no screen, no message, no menu entry (`c06`). Because replace is `*YES`, **running `LOG100` again resets the log** — the previous `SAMLOG` (and every entry in it) is replaced by a fresh 5000-byte space.

## Entrypoints

- `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:5` — `h dftactgrp(*no)` (no `actgrp` → `QILE`, inference)
- `LOG100.PGM.RPGLE:6-7` — `fparameter if e k disk` / `f infds(info)`
- `LOG100.PGM.RPGLE:11-12` — `d info ds` / `D lib 93 102`
- `LOG100.PGM.RPGLE:18-22` — `usrspc 20`; `usrspc = 'SAMLOG    ' + Lib; crtusrspc(usrspc:'LOG':5000:X'00':'*ALL':'Sample Application Log':'*YES':errcod);`
- `LOG100.PGM.RPGLE:23-26` — `rtvusrspcptr(usrspc:p1); pos = 7; data = '***'; *inlr = *on;`
- `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4-12` — `crtusrspc` = `extpgm('QUSCRTUS')` (name 20, attr 10 const, size 10i 0 const, init 1 const, aut 10 const, text 50 const, replace 10 const, errcod 256); `:14-16` — `rtvusrspcptr` = `extpgm('QUSPTRUS')` (name 20 const, pointer) — **no error-code parameter**

## Inputs / outputs / observables

- In: nothing from the caller; the library of `PARAMETER` as opened (`*LIBL` resolution at run time). — `LOG100.PGM.RPGLE:6-7,11-12`
- Out: `*USRSPC SAMLOG` in that library, 5000 bytes, attribute `LOG`, `*ALL`, text `Sample Application Log`; bytes 0–3 = binary `7`, bytes 4–6 = `'***'`, bytes 7–4999 = `X'00'`. — `LOG100.PGM.RPGLE:14-16,20-25`
- Observable: `DSPOBJD SAMLOG *USRSPC` next to `PARAMETER`; `DSPOBJD` text `Sample Application Log`; a previously existing `SAMLOG` in that library is gone (replace). — `LOG100.PGM.RPGLE:21-22`

## Behaviour as implemented

1. Implicit open of `PARAMETER` (`if e k disk`, not `usropn`) fills the INFDS; `lib` = the library actually opened. No record is read. — `LOG100.PGM.RPGLE:6-7,11-12`
2. `usrspc = 'SAMLOG    ' + Lib` — 10-character object name padded to 10 + 10-character library = the 20-byte qualified name the API expects. — `:18,20`
3. `QUSCRTUS` creates (or replaces) the space; the error-code DS `errcod` is passed with `bytes provided = 256`, so any API failure comes back in the DS and **is not inspected** (`c05`). — `:21-22`, `APICALL.RPGLEINC:25-33`
4. `QUSPTRUS` returns `p1` → the based DS (`pos 10i 0`, `data 3`) overlays the first 7 bytes of the space. — `:14-16,23`
5. `pos = 7; data = '***'` — header written (`c02`). `*inlr = *on`; the file is closed by the cycle. — `:24-26`

## Validation rules found in code

None. No check that `SAMLOG` already exists (replace is unconditional), no check on the API result, no confirmation, no message.

## Edge cases found in code

- **Re-run = reset.** `replace '*YES'` replaces an existing `SAMLOG` in that library; all entries are lost (the replaced object goes to `QRPLOBJ` per platform rules — inference). A job that already holds a pointer to the old space (`c03` `init` once per activation group) keeps writing to the old copy, not the new one (inference; runtime-confirmable). — `LOG100.PGM.RPGLE:21-22`, `LOG300.RPGLE:24-26,41-43`
- **`PARAMETER` not on `*LIBL`:** the implicit open fails → unmonitored RPG status 01216/01217 → inquiry message; nothing is created. (`par-maintain-c13`, inference.) — `LOG100.PGM.RPGLE:6`
- **Library resolution asymmetry:** created where `PARAMETER` is (INFDS at install time); found later via `'SAMLOG    *LIBL'` (`LOG300.RPGLE:41`). If that library is not on the run-time `*LIBL`, every `AddLogEntry` fails (`c06`). — `par-maintain-c13`
- **No auto-extend:** `QUSCRTUS` does not set the auto-extend attribute and `QUSCUSAT` is never called anywhere in `ATU_SRC` (structural grep) — the 5000-byte size is a hard capacity (`c04`). — `LOG100.PGM.RPGLE:21`
- **Authority `*ALL`:** every user can read, replace or delete the log. As-is.

## Dependencies

- `PARAMETER.PF` as an object (its library) — `par-maintain-c12` / `c13`
- `QUSCRTUS`, `QUSPTRUS` (`APICALL.RPGLEINC:4-16`)
- `SAMLOG` `*USRSPC` — runtime object, not in the tree (created by this program only)

## Assumptions / unknowns

- Platform: INFDS 93–102 = library of the opened file; `QUSCRTUS` size is an *initial* size and the system may allocate in page units, so the physical capacity may exceed 5000 bytes (`c04`, runtime-confirmable).
- Operational: who runs `LOG100`, when, and in which job (`*LIBL`) — `c06` (needs-SME).
- Target stance (room): `LOG100` is an install step, not application behaviour; the ORD vertical already carries the log as a `samlog` table (`modern/db/schema.sql:132-140`), so there is nothing of `LOG100` to convert — recommendation only, decided by the room.

## Evidence

`ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:5-27` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4-16,25-33` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:24-26,41-43` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14` · structural grep `ATU_SRC/**` for `QUSCUSAT` (none)
