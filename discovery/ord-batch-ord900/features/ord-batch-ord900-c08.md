# ord-batch-ord900-c08 — Neither utility is scheduled, submitted, wrapped or parameterised: two bare interactive `cmd call` menu options, no CL, no command, no `SBMJOB`, no `*ENTRY` / `PI`; real scheduling, if any, lives on the box (`WRKJOBSCDE`) and is invisible from source

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is absence card, Phase B) |
| Confidence | `observed-in-code` (absence) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The only callers of `ORD900` and `ORD901` in `ATU_SRC` are `SAMMNU` options 80 and 81, each `action='cmd call ord9xx'` — the program runs **in the interactive job** of the user who took the option, to completion, with the screen blocked; the menu adds no confirmation (`menu-cmd-shell-c01`). There is no CL wrapper (`QCLSRC` holds `ORD100C`, `ORD100C2`, `ORD500C`, `PAR201` only), no command definition (`QCMDSRC`: `CRTORD`, `CVTSPLPDF`), no `SBMJOB` / `ADDJOBSCDE` anywhere in the tree — the single job-related string is the menu's `F14 = cmd wrksbmjob *user`, a viewer. Neither program declares `*ENTRY PLIST` or a procedure interface, so there is nothing to pass: no "as-of" date for `ORD901`, no target value for `ORD900`. The consequence for the room: whether these run nightly, monthly or only before a demo (`c07`) cannot be read from the repository; a job-schedule entry, a robot / scheduler definition or an operator habit would all leave no trace here. Blind spot, registered.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:143-150` — options 80 / 81, `cmd call ord900` / `cmd call ord901`
- `ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE:4-11`, `ORD901.PGM.SQLRPGLE:4-52` — no `*ENTRY`, no `PI`, no `PLIST`

## Inputs / outputs / observables

- In: none (no parameters; `ORD901` takes "today" from the job date, `%date()`). — `ORD901.PGM.SQLRPGLE:16-17`
- Out: none to the caller — no return code, no message, no spool, no log entry (`AddLogEntry` is not called; `LOG300` is bound into `ORD700` only). — structural grep
- Observable: the menu returns when the program ends; a failure surfaces as an inquiry / escape message in the interactive session (`c06`).

## Behaviour as implemented

1. **Invocation.** UIM menu item → `cmd call ord900` / `cmd call ord901` — unqualified, resolved on `*LIBL`; `CALL` with no parameter list. — `SAMMNU.MENU:144,148`
2. **No wrapper.** `QCLSRC` and `QCMDSRC` contain nothing for either program; the four CL members wrap `ORD100`, `ORD500` and `PAR201`. — directory listings
3. **No submission.** No `SBMJOB`, `SBMDBJOB`, `ADDJOBSCDE`, `CHGJOBSCDE`, `QSYSSCD` reference anywhere in `ATU_SRC`; `wrksbmjob` (`SAMMNU:49`) is a display command on the menu's `F14`. — structural grep
4. **No parameters.** Fixed-form `ORD900` has no `*ENTRY PLIST`; free-form `ORD901` has no `dcl-pi` / `PI` and no `*ENTRY`. A `CALL ORD901 PARM(…)` from the command line would be accepted by the system and ignored by the program (language semantics — inference). — `ORD900.PGM.RPGLE:4-11`; `ORD901.PGM.SQLRPGLE:4-10`
5. **"Today" is the job date.** `%date()` — so a job started with `CHGJOB DATE(…)` or a different `QDATE` would shift to that day. The only knob the operator has. — `ORD901.PGM.SQLRPGLE:16-17`

## Validation rules found in code

- None. No authority check, no "are you sure", no environment test (e.g. library name) that would stop the utilities running against production data.

## Edge cases found in code

- **Runs in the foreground.** A large `ORDER` file blocks the user's session for the duration (`c06`) and holds record locks other sessions wait on. — `ORD901.PGM.SQLRPGLE:19-41`
- **Accidental invocation.** Options 80 / 81 are one keystroke from the maintenance options 20 / 21 in the same group and carry no confirmation; `ORD901` rewrites every order. Same observation as `menu-cmd-shell-c01` ("three utilities are destructive resets offered without confirmation"). — `SAMMNU.MENU:134-154`
- **Scheduling on the box** (`ADDJOBSCDE … CMD(CALL ORD901)`) would be invisible here; so would a `QSTRUP` / robot entry. Phase A's open question "Runtime JOBSCDE cannot be seen from source" stands.

## Dependencies

- `menu-cmd-shell-c01` (the menu surface — pointer), `c06` (foreground whole-file rewrite), `c07` (purpose).

## Assumptions / unknowns

- Platform: a `CALL` with extra parameters to a program without `*ENTRY` does not fail; UIM `cmd` actions run in the interactive job. Inference.
- **needs-SME (ops / source owner):** `WRKJOBSCDE` and any external scheduler on the box — is `ORD901` (or `ART801`) scheduled? One screen answers it and settles the `c07` reading.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:45-49,143-150` · `ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE:4-11` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:4-17` · directory listings `ATU_SRC/QCLSRC/` (4 members), `ATU_SRC/QCMDSRC/` (2 members) · structural grep of `ATU_SRC/**` for `ORD900` / `ORD901` (members + menu only), `SBMJOB` / `SBMDBJOB` / `JOBSCDE` (none), `AddLogEntry` / `LOG300` in the two members (none), `*ENTRY` / `PLIST` / `PI` / `dcl-pi` in the two members (none)
