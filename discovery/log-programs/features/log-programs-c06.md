# log-programs-c06 — LOG100 has no caller and no menu entry; if it never ran, every AddLogEntry fails for the rest of the job, silently

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — deployment dependency) |
| Confidence | `inferred` (the absence of any caller is `observed-in-code`; that `LOG100` is run manually as an install step, and the exact failure mode when it was not, are operational / runtime) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound as `inferred`, kept `inferred`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Nothing in `ATU_SRC` calls `LOG100`: no `CALL`, no prototype, no menu option (`SAMMNU` options 1–90 name every other utility), no CL, no `.ILEPGM` build member. It is a one-off environment step someone runs by hand (`CALL LOG100`) after the objects are built and `PARAMETER` is on `*LIBL` — inference from the absence. If it has **not** been run (fresh library, restored library without `SAMLOG`, or `SAMLOG` created in a library that is not on the run-time `*LIBL` — `c01`), the first `AddLogEntry` in a job runs `init`: `inz = *on` is set, then `QUSPTRUS` on `'SAMLOG    *LIBL'` escapes (`CPF9801`, inference); `ORD700` swallows it (`callp(e)`) and carries on with the quantity update. Because `inz` was set **before** the failed resolution, `init` is never retried in that activation group: every later `AddLogEntry` in the job dereferences the null `p1` (`MCH3601`, inference) and is swallowed too. Net effect: **the application works, no line is ever logged, nobody is told**, until the job ends and a new activation group tries again.

## Entrypoints

- Absence: structural grep of `ATU_SRC/**` for `LOG100` → only `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE` itself; `ATU_SRC/QPNLSRC/SAMMNU.MENU:82-167` (menu items: `ART200`, `CUS200`, `ORD201`, `PRO200`, `PRO201`, … `ORD901`, `ART801`, `PAR201`, `adspusrspc samlog`, `signoff` — no `LOG100`); `ATU_SRC/QILESRC/` (`PAR201.ILEPGM`, `PRO200.ILEPGM` only); `ATU_SRC/QCLSRC/` (no CL names `LOG100`)
- `ATU_SRC/QRPGLESRC/LOG300.RPGLE:24-26` — `if not inz; init(); endif;`
- `LOG300.RPGLE:41-43` — `usrspc = 'SAMLOG    *LIBL'; inz = *on; rtvusrspcptr(usrspc:p1);` — flag set **before** the call
- `LOG300.RPGLE:27` — `p2 = p1 + pos;` — the statement that fails on every later call
- `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:78-82` — `callp(e) addlogEntry(…)` then `callp UpdArt(…)` — `%error` unread

## Inputs / outputs / observables

- Precondition for any logging: `*USRSPC SAMLOG` exists in a library on the writer's `*LIBL`. — `LOG300.RPGLE:41`
- Observable when missing: deletes succeed, `ARCUSQTY` is adjusted (`ord-trigger-ord700-c03`), `SAMLOG` does not grow (or does not exist); the deleting job's joblog holds the escape as a handled message (runtime). Menu option 84 (`c09`) would fail to find the object.

## Behaviour as implemented

1. First `AddLogEntry` in an activation group → `init`. — `LOG300.RPGLE:24-26`
2. `inz = *on` — committed before the resolution attempt. — `:42`
3. `rtvusrspcptr` escapes (no error-code parameter) → out of `init`, out of `AddLogEntry`, into the caller's `callp(e)`. `p1` remains `*null`. — `:43`, `APICALL.RPGLEINC:14-16`, `ORD700.PGM.RPGLE:78`
4. Every later call skips `init` (`inz` on) and fails at `p2 = p1 + pos` (null-based `pos`). Swallowed again. — `:24-27`
5. Activation group end (job end for `QILE`, inference) resets the statics; the next job retries once.

## Validation rules found in code

None. No "log not initialised" message, no fallback (joblog, `QSYSOPR`, `QHST`), no self-create (`LOG300` never calls `QUSCRTUS`).

## Edge cases found in code

- **Order of operations in `init` is the trap.** Swapping lines 42 and 43 would make the failure retryable; as written, one failure per activation group is final. Record as-is (job header: do not fix). — `LOG300.RPGLE:41-43`
- **`SAMLOG` in the wrong library** behaves exactly like "never run": `LOG100` creates it beside `PARAMETER` (`c01`), `LOG300` looks on `*LIBL` — a job whose library list lacks that library logs nothing. — `LOG100.PGM.RPGLE:20`, `LOG300.RPGLE:41`
- **Restore / re-deploy:** `SAMLOG` is a runtime object outside the source tree; a rebuild from `ATU_SRC` alone does not recreate it — `LOG100` must be part of the install runbook. — absence
- **`LOG100` run twice** = log reset (`c01`).

## Dependencies

- `c01` (what `LOG100` creates and where), `c03` (`init` once per activation group), `c07` (the only caller swallows the escape), `c08` (binding)
- `menu-cmd-shell` owns the `SAMMNU` inventory; cited here for the absence only.

## Assumptions / unknowns

- needs-SME (ops): who runs `LOG100`, when, in which job / library list? Is it in an ARCAD deployment script outside the tree?
- Platform (inference): `CPF9801` from `QUSPTRUS`; `MCH3601` on a null basing pointer; activation-group lifetime for a trigger program in `QILE`.
- Target: recommendation unchanged from Phase A — install step, not application behaviour; move to the ops runbook; the ORD vertical's `samlog` table is created by `modern/db/schema.sql` as part of the schema, so the "was the log initialised" failure class does not exist there. Room decision.

## Evidence

`ATU_SRC/QRPGLESRC/LOG300.RPGLE:24-27,41-43` · `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:20-23` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:14-16` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:78-82` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:82-167` · structural grep `ATU_SRC/**` for `LOG100` (self only); `ATU_SRC/QILESRC/` listing
