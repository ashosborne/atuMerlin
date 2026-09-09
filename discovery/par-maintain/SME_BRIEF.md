# SME_BRIEF — par-maintain (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-09 (night residual wave — Ash authorized, Field recorded; `BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`); 13/13 accepted candidates documented by the Pack B conveyor on 2026-09-09 (run 13). The one `inferred` row (`c08`, blank `PATH`) was accepted by the bind and is carded with its `inferred` confidence kept — the source half is exact, the runtime half is outside the tree. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; residual-wave slices are document-only per the bind record.

## What was documented

A generic two-key key/value store (`PARAMETER`) with a maintenance screen (`PAR200`: list / create / edit / delete), a CL utility (`PAR201`: `WRKLNK` over the `PATH` directory) and a getter service program (`FPARAMETER` / `PAR300`, `GetPARM1..5`). Cards live in `features/par-maintain-c01.md` … `c13.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). Three hundred lines of RPG, a 150-line display file, ten lines of CL, a 108-line `nomain` module and a 14-line physical file — the deepen corrected one Phase A statement, sharpened two, and found a data contract nobody had written down.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c05` — **the `*** Deleted ****` marker never reaches the screen.** The program assigns it to `PARM2`, but `SFL01` displays `PARM2S` (the 32-char copy) and does not contain `PARM2`. A deleted row shows blank Code / Sub-Code / `1` and the **old** `2`–`5` values. The ghost stays selectable: `2` on it chains nothing and the following `update` is an unmonitored 01221; `4` on it is a silent no-op — **unless a blank/blank row exists, which it then deletes**. Phase A's `c05` is corrected.
- `c03` — **F6 behaves like a Page Down, and duplicates the last row after `Bottom`.** `step01 = lod` on return from create (write, F3 or F12 alike) appends the next page from the saved key. At `Bottom` the saved key is the last *displayed* row (`READ` at end of file leaves the buffer unchanged), so that row is appended a second time — one duplicate per F6 round-trip. Phase A's "appends next page instead" is right; the duplicate and the cancel path were missing.
- `c04` — **edited rows keep their pre-edit values in the list.** The subfile row is rewritten (option cleared) *before* `FMT02` and never after it; F5 is the only refresh. The edit `chain` locks the row for as long as the panel is open; F3/F12 leave the lock; an unchanged panel still issues `update`.
- `c02` — **the duplicate check locks and loads the existing row.** `chain` on the update-capable file: indicator 40 shows the error while the existing row is locked and its values sit in the program buffer (the screen keeps the typed values — `ERRMSG` does not rewrite fields). Keys are stored upper-case because the display folds every non-`CHECK(LC)` field — the only reason `GetParm2('PATH')` matches mixed-case typing. A blank/blank key is accepted.
- `c07` / `c11` — **`PATH` must end with `/` for half the estate.** `PRO202` and `PRO203` build `%trim(path) + fileName` with no separator; `ORD500C` uses `TODIR` and does not care; `PAR201` lists `<PATH>*`, which shows the directory's contents only with the slash — and, without it, shows exactly the mis-placed siblings the two writers would have produced. One data value, two conventions, no normalisation anywhere.
- `c09` — **the getter cache is keyed on the record buffer's own key**, the same idiom as `FCOUNTRY` (`cou-maintain-c07`): a hit is served until a *different* key is requested — and nothing in the tree ever requests a different key, so the first `PATH` read in a job is the value for the job; a miss is never cached; a **blank key never reads** (the blank/blank row `PAR200` can create is unreachable). `ACTGRP(*CALLER)` and `QILE` everywhere (explicit for `PAR201`/`PRO200`, default for `ORD500`/`PRO203`) → one buffer and one open data path per interactive job across all four consumers. No `(e)`, no `monitor`: an open failure propagates.
- `c10` — **`closePARAMETER` would not reset the cache.** It closes the data path but leaves the buffer, so a same-key request after a close still skips the `chain`. Exported by `EXPORT(*ALL)` with `chainPARAMETER`; no binder source, no `*PRV`.
- `c01` — **14 rows with an exact `Bottom`**: the load reads one row ahead, so a file of exactly 14 shows `Bottom` at once (no empty trailing page); `s01act` processes one changed row per cycle pass (several `2`s / `4`s in RRN order); options typed before Page Down / F6 survive to the next Enter; columns `4`/`5` show leading zeros (no `EDTCDE`); no filter, position-to, search or help; `PAR200` has no `H` spec (default activation group, inference) and never goes through `FPARAMETER`, so it always sees the file as it is.
- `c08` — **blank `PATH` is silent end to end**: `GetPARM2` returns 100 blanks, `PAR201` runs `WRKLNK '*'`, `PRO202`/`PRO203` hand relative names to the sourceless `XML`/`XSS` service programs, `ORD500C` passes a blank `TODIR`. Blank value and missing row are indistinguishable; because of the cache the incident appears per job, not at once. No seed or install of the `PATH` row exists in the tree.
- `c13` — `LOG100` reads no parameter row; it uses `PARAMETER`'s library from the INFDS to decide where `SAMLOG` is created, and `LOG300` finds it via `*LIBL` — two resolution rules. Dropping the table in the target removes the log's anchor.
- `c06`, `c12` — as Phase A: F3 = F12 on the list (end), F3 = F12 on detail panels (back, lock kept); `PARAMETER` has no delete flag, no audit, no text, no trigger, no SQL consumer; `PARM4`/`PARM5` zoned in the file, packed on return.

Phase A statements corrected: `c05` "row rewritten blank with `PARM2 = '*** Deleted ****'`" → assignment exists, display does not (blank key + old values). Sharpened: `c03` (duplicate after `Bottom`, cancel path pages too), `c04` (stale values in the list, lock across screen, 01221 on the ghost), `c02` (lock + buffer overwrite on duplicate, upper-casing), `c09` (blank key never reads, miss never cached, cache shared job-wide), `c07`/`c11` (trailing-slash contract). No Phase A rule about what a valid operation does was wrong.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c13`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c11` **`PATH` as target configuration** (environment / settings) rather than a converted key/value screen — one key, one column, four literal readers, `GetPARM1/3/4/5` unused. Decide; it collapses `c01`–`c07` and `c12` to "not carried" if yes.
- [ ] `c07` / `c11` (data) — does the `PATH` value on the box **end with `/`**? Which file system? Do any other `PARAMETER` rows exist (nothing in source would read them)?
- [ ] `c08` (`inferred`) — blank / missing `PATH` is silent in the legacy chain; target: required setting (fail fast) or default location? Where do the legacy writers actually put a relative name (box check)?
- [ ] `c09` — read-once-per-job cache with no invalidation: acceptable for a single setting, or read-through / configuration (same question as `cou-maintain-c07`)?
- [ ] `c05` — immediate physical delete, no confirmation, marker never displayed, ghost row can delete the blank/blank row — acceptable as-is if the screen survives?
- [ ] `c03` / `c04` — list quirks (duplicate row after create at `Bottom`; pre-edit values shown after edit) — preserve-as-is only if the screen is kept; otherwise nothing to carry.
- [ ] `c02` / `c04` — locks held across `FMT02` / duplicate-error, unconditional update, no audit, 01221 on the ghost row — record as-is; one lock/ghost-row answer for the estate's list/edit template (`CUS200` is the same shape).
- [ ] `c10` build owner / ME — target exports getters only; confirm activation group of `ORD500` / `PRO203` and how they bind `FPARAMETER` (`srvpgm-supporting-c05`).
- [ ] `c13` — `SAMLOG` location rule if `PARAMETER` is not carried (hand to `log-programs`).
- [ ] `c01` / `c06` — page geometry, leading zeros, MDT survival across F6 / Page Down, undefined keys on detail panels — DDS / platform contract, runtime-confirm on the box when available.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `par-maintain`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c11` `PATH` as configuration vs converting the screen (room).
2. `c07` / `c11` `PATH` value on the box: trailing slash, file system, other rows (data).
3. `c08` blank / missing `PATH` — target stance; where legacy relative names end up (runtime).
4. `c09` cache semantics for the target.
5. `c05` unconfirmed delete; ghost-row effects.
6. `c03` / `c04` list quirks.
7. `c02` / `c04` locks, unconditional update, 01221 on ghost.
8. `c10` exports / signature / activation group / binding (build owner).
9. `c13` log location anchor (log-programs).
10. `c01` / `c06` DDS-contract facts, runtime-confirmable.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Convert the screen or make `PATH` configuration? | Bind accepted all 13 for **documentation**; the configuration decision is left to the room (checklist item 2). Cards written so either answer is supported. |
| `PAR201` | Carded (`c07`) as an operator utility with the pattern semantics spelled out; reject / runbook remains the recommendation. |
| `EXPORT(*ALL)` (`c10`) | Carded as a build note (the bind accepted it); the `closePARAMETER`-does-not-refresh fact is why. |
| `LOG100` dependency (`c13`) | Carded as the object-anchor fact only; `LOG100`'s log behaviour stays with `log-programs-c01` (accepted, next in queue). |
| `PATH` consumers (`ORD500`, `PRO202`, `PRO203`) | Cited for the `PATH` contract (`c07`, `c08`, `c11`); their own file-name rules live in `ord-print-ord500-c02` (documented) and `pro-interactive-c05`/`c13` (accepted, not yet carded). |
| Cache idiom | `cou-maintain-c07` cross-referenced, not re-derived; `PAR300` differs only in having five typed getters and no `Exist*`. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any found defect (marker never displayed, duplicate row after create, stale list after edit, ghost-row exception, blank-`PATH` pass-through, trailing-slash dependency, cache never invalidated), edit any card outside `discovery/par-maintain/`, or edit `ATU_SRC/**`.
