# srvpgm-supporting-c07 — All eight service programs are `ACTGRP(*CALLER)`; source names an activation group only for `PRO200` / `PAR201` (`QILE`), the other fourteen ILE programs take the compiler default — which is also `QILE` — so the getter caches are most likely **one per job**, shared by every program, not one per calling program

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is build-contract card, Phase B — corrects the Phase A reading "getter caches per calling program") |
| Confidence | `observed-in-code` for the keywords and their absence; the caller activation group is a **platform default** (inference, runtime-confirmable) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Every `.ILESRVPGM` says `ACTGRP(*CALLER)`: a service program has no activation group of its own; its static storage — the `usropn` file, the record buffer and the last-key cache in each getter module, the user-space pointer in `LOG300` — lives in whichever group the *calling program* runs in, and is shared by every program in that group. Source fixes the callers' group in exactly two places: `PRO200.ILEPGM` and `PAR201.ILEPGM`, `ACTGRP(QILE)` (`c04`). The other fourteen ILE programs (`c03`, `c05`) say `dftactgrp(*no)` and **no `actgrp` keyword**, so `CRTBNDRPG` / `CRTSQLRPGI` apply their default `ACTGRP` parameter — `*STGMDL`, which for single-level-storage programs means **`QILE`**. Unless the ARCAD / elias build overrides that default (not in source — `c05`, `c09`), **all sixteen ILE programs and all eight service programs share one `QILE` activation group per job**, and every getter cache is job-wide: primed by the first program that asks, served stale to any later program in the same job, cleared only by `RCLACTGRP QILE` or sign-off. Phase A's "each getter cache lives per calling program's activation group" would require `ACTGRP(*NEW)`, which nothing in the tree specifies. Programs with no H-spec at all (`DAT001`, `DAT002`, `ORD900`, `ORD901`, `PAR200`), the RPG III `COU200` and the CL / COBOL members do not touch a service program.

## Entrypoints

- `ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:9`, `FCOUNTRY.ILESRVPGM:8`, `FCUSTOMER.ILESRVPGM:8`, `FFAMILLY.ILESRVPGM:8`, `FPARAMETER.ILESRVPGM:8`, `FPROVIDER.ILESRVPGM:8`, `FVAT.ILESRVPGM:8`, `LOG.ILESRVPGM:8` — `ACTGRP(*CALLER)` (eight of eight)
- `ATU_SRC/QILESRC/PRO200.ILEPGM:9`, `PAR201.ILEPGM:9` — `ACTGRP(QILE)`
- The sixteen `dftactgrp(*no)` lines with no `actgrp` (`c03` twelve + `c05` four); structural grep of `ATU_SRC/**` for `actgrp` → exactly the ten lines above (no `*NEW`, no other named group)
- Static state that the group scopes: `usropn` F-specs `ART300.RPGLE:6`, `COU300:6`, `CUS300:6`, `FAM300:6`, `PRO300:6`, `VAT300:6`, `PAR300:6`; last-key cache shape `CUS300.RPGLE:173-186` (representative); `LOG300.RPGLE:12-16,37-46` (`p1`, `inz`, `User`)

## Inputs / outputs / observables

- In: the calling program's activation group (a build-time attribute of each `*PGM`).
- Out: one instance of each service program's static storage per activation group per job.
- Observable: `DSPPGM <pgm> DETAIL(*BASIC)` → "Activation group attribute" for any of the fourteen (expect `QILE` if the default was taken; `*NEW` would confirm Phase A's reading instead); `DSPSRVPGM <srvpgm> DETAIL(*BASIC)` → `*CALLER`; at run time `WRKJOB OPTION(*ACTGRP)` (or the `DSPJOB` activation-group display) on a signed-on job after using two programs — one `QILE` entry containing all of them, or one group per program (runtime-confirmable; settles the question).

## Behaviour as implemented

1. **`*CALLER` everywhere.** No service program ever has its own group; there is no `ACTGRP(<name>)` on any `CRTSRVPGM`. Consequence: the same service program activated from two *different* groups has two independent static states (two file opens, two caches); activated from the same group by any number of programs, one. — the eight `ACTGRP(*CALLER)` lines
2. **Two callers are explicitly `QILE`** (`PRO200` with its `FCOUNTRY` / `FPARAMETER` / `XML` bindings; `PAR201` with `FPARAMETER`) — `c04`.
3. **Fourteen callers default.** `dftactgrp(*no)` only says "not the default (OPM) activation group"; *which* ILE group is the `ACTGRP` parameter of the create command, and no H-spec sets it. `CRTBNDRPG` / `CRTSQLRPGI` default `ACTGRP(*STGMDL)` → `QILE` when `STGMDL(*SNGLVL)` (also the default). So by default the fourteen join the same group as `PRO200` / `PAR201`. — the sixteen H-spec lines; platform default (inference)
4. **What is scoped by the group** — the static state each getter module keeps: (a) the `usropn` file, opened on first use and never closed (the `close*` procedures are not exported — `c06`); (b) the record buffer; (c) the "same key → skip the `chain`" test that makes the buffer a one-entry cache (`if P_CUID <> CUID; … chain …; endif` — `CUS300.RPGLE:180-185`; identical shape in the other six getter modules — documented per slice: `cus-modules`, `vat-module-c05/c06`, `par-maintain-c09`, `cou-maintain`, `art-modules`/`fam-maintain` held, `pro-modules` queue); (d) in `LOG300`, the user-space pointer `p1`, the `inz` flag and `User inz(*USER)` — set once per activation (`log-programs-c03/c06`). — cited lines
5. **Consequence under the default (`QILE` shared):** a `CUSTOMER` row updated by `CUS200` and then read by `ORD100` through `GetCusName` in the same job is served from `CUS300`'s buffer if the same `CUID` was the last one asked — stale across *programs*, not just within one. The `*-modules` cards describe the staleness *mechanism*; this card fixes its **scope**: per job, all programs, until `RCLACTGRP QILE` / sign-off. Under Phase A's `*NEW` reading the scope would be per program invocation (a new group each `CALL`, reclaimed at return); the source does not support that reading. — step 3 + step 4
6. **`QILE` is persistent.** A named group is not destroyed when the program that created it ends; it lives until `RCLACTGRP` or job end. So the seven `usropn` files stay open and the seven caches stay primed across the whole 5250 session — e.g. from the first `CUS250` display through every later `ORD100` order. — platform (inference)
7. **Outside the group:** `COU200.RPG` (RPG III — OPM, default activation group), the five H-spec-less RPG programs (`DFTACTGRP(*YES)` default), `PRO201.CBL`, `ORD100C` / `ORD100C2` / `ORD500C` (CL, `CRTBNDCL DFTACTGRP(*YES)` default — no `DFTACTGRP` / `ACTGRP` in their source) — none calls a service program, so none participates. — `QRPGSRC/COU200.RPG`; `DAT001`/`DAT002`/`ORD900`/`ORD901`/`PAR200` (no H-spec); `QCLSRC/*.PGM.CLLE` (no `DFTACTGRP`)

## Validation rules found in code

- None. Nothing in source reclaims a group, closes a service-program file, or invalidates a cache; there is no `RCLACTGRP`, no `RCLRSC`, no exported `Close*` (`c06`).

## Edge cases found in code

- **Phase A `c07` corrected.** "bnddir programs have no actgrp keyword (default new AG per program)" is not what the compiler does: the default is `QILE`, not `*NEW`. The observable difference is large (job-wide vs per-call cache lifetime) and cheap to settle (`DSPPGM DETAIL(*BASIC)` on any one of the fourteen). Recorded as needs-SME / runtime-confirm; the card states the default reading and flags it.
- **Explicit `QILE` on `PRO200` / `PAR201` is redundant with the default** — but it is also the only place the intent is written down; if the build overrides the default for the other fourteen (e.g. `ACTGRP(*NEW)` in an elias template), these two would be the *only* programs sharing state with each other.
- **`PRO200` + `PAR201` + `PRO203` + `ORD500` + `PRO202` all read `PATH` through `FPARAMETER`** (`c04`, `c05`): under the default, one `PAR300` buffer serves all five — and `PAR200` (the maintenance program) writes `PARAMETER` directly with its own F-spec, so a `PATH` change made in `PAR200` is not seen by any of the five until the group is reclaimed (`par-maintain-c09` states the same for "all four consumers"; `PRO203` makes five).
- **`LOG300`'s `User` is `inz(*USER)`** — stamped at service-program activation; in a shared, persistent `QILE` that is the user of the job, fixed for the session — consistent with a 5250 job (`log-programs-c03`). The interesting case is a server / prestart job reusing `QILE` across users — outside the tree.
- **Two file-open counts per file.** Because `*CALLER` state is per group, on a box that *does* run the fourteen in `*NEW` groups each program call re-opens `CUSTOME1` etc. inside the service program (and closes them at group end); under `QILE` they open once per job. Performance profile differs — a runtime-confirm item, not a source fact.
- **No `*NEW` anywhere; no `RCLACTGRP` anywhere** — the estate has no explicit activation-group hygiene.

## Dependencies

- `c04` (the two explicit groups), `c03` / `c05` (the fourteen defaulted callers), `c06` (unexported `close*`).
- Cache mechanism per module: `cus-modules`, `vat-module-c05/c06`, `par-maintain-c09`, `cou-maintain` (FCOUNTRY half), `log-programs-c03/c06` — cited, not re-derived; `art-modules` / `fam-maintain` held; `pro-modules` queue.

## Assumptions / unknowns

- **Platform default `ACTGRP(*STGMDL)` → `QILE`** for `CRTBNDRPG` / `CRTSQLRPGI` / `CRTBNDCBL` with `DFTACTGRP(*NO)` and single-level storage — inference; the whole scope conclusion rests on the build not overriding it. **needs-SME (build owner / runtime):** `DSPPGM ORD100 DETAIL(*BASIC)` (any one of the fourteen) — one command settles it.
- Named-group persistence, `*CALLER` static-storage placement — platform, runtime-confirmable.
- Target stance (room, prose only — `SME_BRIEF.md`): the target has no activation groups; the question the room must answer is *which* staleness the target should reproduce — none (always read fresh: the recommendation every `*-modules` card already makes), per-request, or per-session. Under the default reading the legacy behaviour is "per session, across all screens", which is the least desirable of the three to copy.

## Evidence

`ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:9` · `FCOUNTRY.ILESRVPGM:8` · `FCUSTOMER.ILESRVPGM:8` · `FFAMILLY.ILESRVPGM:8` · `FPARAMETER.ILESRVPGM:8` · `FPROVIDER.ILESRVPGM:8` · `FVAT.ILESRVPGM:8` · `LOG.ILESRVPGM:8` · `ATU_SRC/QILESRC/PRO200.ILEPGM:9` · `PAR201.ILEPGM:9` · the sixteen `dftactgrp(*no)` lines (`c03`, `c05`) · `ATU_SRC/QRPGLESRC/CUS300.RPGLE:6,173-190` · `ART300.RPGLE:6` · `COU300.RPGLE:6` · `FAM300.RPGLE:6` · `PRO300.RPGLE:6` · `VAT300.RPGLE:6` · `PAR300.RPGLE:6` · `LOG300.RPGLE:12-16,37-46` · `ATU_SRC/QRPGSRC/COU200.RPG` (RPG III) · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE`, `ORD100C2.PGM.CLLE`, `ORD500C.PGM.CLLE` (no `DFTACTGRP` / `ACTGRP`) · structural grep of `ATU_SRC/**` for `actgrp` (ten lines), `\*NEW` (none), `RCLACTGRP` / `RCLRSC` (none), H-spec presence in `DAT001` / `DAT002` / `ORD900` / `ORD901` / `PAR200` (none)
