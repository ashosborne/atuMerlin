# SME_BRIEF — cou-maintain (FCOUNTRY half: Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) — **split bind**: the `FCOUNTRY` service-program half (`c07`–`c12`) accepted, the `COU200` OPM screen half (`c01`–`c06`, `c13`) deferred. 6/6 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 7). No `needs-SME` / `inferred` candidates in the accepted set — every row was `observed-in-code`. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; the converted CUS vertical already depends on this service program through a read-only surface, and this brief does not propose widening `atu-merlin-ts-cus-v1`.

## What was documented

The `FCOUNTRY` service program (2 `nomain` modules, ~325 lines, 1 window display file, 4 exports): `COU300` — `GetCountryName`, `GetCountryIso3`, `ExistCountry` over one cached keyed chain; `COU301` — the `SltCountry` keyed-read selection window with by-code / by-name toggle, position-to and single-select rules; plus the export / binding / caller surface. Cards live in `features/cou-maintain-c07.md` … `c12.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). `COU200` was **not** deepened; its seven rows are marked `deferred` in the MANIFEST to mirror the bind.

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c07` — the cache key is the record buffer's own `COID`, not a saved last-key: a hit is cached (stale until a different code is requested), a miss clears the buffer first so it is never cached, a blank code never reads, and `ExistCountry(blank)` as the first call in an activation group returns `*off` from the initial `%found` — the callers' "country must exist" rule rejects a blank country without any I/O. No sequence returns a wrong answer; only the number of reads varies. `COUNTRY` has no delete flag, so there is no `IsCountryDeleted` and "exists" means "row present".
- `c08` — `GetCountryIso3` has no caller; `COISO` is a literal `3A` (not in `SAMREF`) read and written only by the deferred `COU200` panel. `closeCOUNTRY` is not exported (copybook publishes five prototypes for four exports, the same drift as `FVAT`), and nothing inside the module calls it, so the `COU300` ODP and `COU301`'s separate `COUNTRY` / `COUNTR1` / display-file opens live for the activation group.
- `c09` — `SltCountry` is a **native keyed read** positioned at the caller's current code (`SETLL pcod`), not a filtered SQL list like `SltCustomer`; 20 rows per load into a 10-row page (two pages per load); option 1 returns the row's `COID`, F3/F12 return `pcod`. Position beyond the last key shows the window frame with **no rows and no message**. `pcod` is passed by reference (the only by-reference prototype in the copybook) and never written.
- `c10` — **correction to Phase A:** the "F8 clears the opposite key to `FAM301`" divergence is source-level only. Traced through both modules, every toggle shows the new order from the top in both windows and both lose the caller's code position after the first toggle away and back; the retained key in `COU301` is cleared again before it could be read. Phase A recommended carding the two windows separately on the strength of this divergence; this card withdraws that reason. F8 is ignored when any row option was typed; F8 + position-to on one Enter toggles and discards the position.
- `c11` — `S01chk` and the position-to branch are **byte-identical** to `sltArtFam` (diff); `FAM301D` differs from `COU301D` only in `%TEXT`, `REFFLD`s, titles and window geometry. Invalid row option + option 8 leaves the position unapplied with the `8` still typed; valid `1` + option 8 gives 42 and returns nothing; message texts are DDS literals, not `SAMMSGF`.
- `c12` — four exports under a literal `SIGNATURE('V1')` with no `*PRV` (only `FPROVIDER` versions); `PRO200.RPGLE` has no `H` spec, so its imports resolve only because `PRO200.ILEPGM` names `FCOUNTRY` in `BNDSRVPGM`; the other three callers go through `SAMPLE.BNDDIR`. `ACTGRP(*CALLER)` puts the getter cache in the caller's activation group (`PRO200` = `QILE` explicitly; the others are compile metadata). Four display files and two physical files compile against the `COUNTRY` layout.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c07`–`c12`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggest `c07`, `c09`, `c10`).
- [ ] `c08` `GetCountryIso3` / `COISO`: carry into the target unused, or `reject` until a consumer exists? Does anything outside the tree read `COISO`?
- [ ] `c10` Given `SltCountry` and `SltArtFam` behave identically, should the target card the keyed selector **once** (a shared rule the `fam-maintain` bind can cite) rather than twice as Phase A recommended?
- [ ] `c09` Target selector: show a message when the position is beyond the last key (as-is: empty frame)? Keep the caller's current code as the position across the F8 toggle (neither legacy window does)?
- [ ] `c07` Hit-cache with no invalidation: acceptable as-is for reference data (a `COU200` rename in another job is served stale until a different code is requested)? The converted CUS surface queries per call — confirm that is the intended target rule rather than an accident.
- [ ] `c07`/`c12` Build owner: activation group `CUS200` / `CUS250` / `PRO250` compile into (decides whether one job's `CUS200` and `PRO200` share the cache / ODPs); has `'V1'` ever been bumped; target library of `FCOUNTRY` relative to the callers.
- [ ] `c12` Is `PRO200`'s explicit `BNDSRVPGM(FCOUNTRY)` (no `H` spec) intentional or a build artefact?
- [ ] Deferred half acknowledged: `c01`–`c06`, `c13` (`COU200`) stay `deferred`; the Phase A questions on ISO-3 validation (`c02`), how countries are created (`c04`) and retire-vs-convert (`c13`) remain open for that bind, not this one.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock; the CUS pack's `WAIVED_PATHFINDER` is not extended by this slice).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `cou-maintain` (FCOUNTRY half).

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c08` `GetCountryIso3` / `COISO` — unused export: carry or reject.
2. `c10` one selector rule for `SltCountry` / `SltArtFam` (behaviour identical).
3. `c09` empty-position message; position across toggle (target).
4. `c07`/`c12` activation group of three callers; signature policy; library.
5. `c07` cache staleness acceptable / read-through in the target.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Split `FCOUNTRY` from `COU200`? (Phase A recommendation) | **Yes** — room accepted `c07`–`c12` and deferred `c01`–`c06`, `c13`. `COU200` cited only as the direct `COUNTRY` writer (`c07`, `c12`) and the only other `COISO` reader (`c08`); not deepened. |
| `COU200` target (retire-and-replace vs convert) | Deferred with the `COU200` half; not decided here. |
| Window template (`SltCountry` vs `SltArtFam`) | Phase A: "card separately" because of `c10`. Phase B finds the behaviour identical; the question is now the reverse (card once?) and is carried as needs-SME for the `fam-maintain` bind. |
| No delete flag | Documented in `c07` as a data-model fact (`ExistCountry` = row present); the deferred `c04` keeps the "how are countries added" question. |
| Callers `CUS200` / `CUS250` / `PRO200` / `PRO250` | Cited as call sites and for what they do with the result (`c07`, `c09`, `c12`); `cus-interactive` already documented, `pro-interactive` unbound. |
| Converted CUS dependency surface (`modern/src/shared/fcountry/`) | Pointer only in `c07` / `c08` / `c09` / `c12`; not changed; `atu-merlin-ts-cus-v1` not widened. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, deepen the deferred `COU200` half, widen `atu-merlin-ts-cus-v1`, or edit `ATU_SRC/**`.
