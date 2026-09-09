# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 13 · 2026-09-09 08:18 – 09:15 UTC (09:18–10:15 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `a653c21` (RUN tip `a1ecae1`)
Previous briefs preserved in git: Pack B run 12 at `ee67225:overnight/MORNING_BRIEF.md`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`par-maintain`** (job preference; first of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, Ash authorized, Field recorded). The parameter subsystem: `PAR200` "Work with Parameters" (314-line RPGLE list/create/edit/delete, `PAR200D` 151-line DSPF, menu option 20), `PAR201` "Work with IFS output" (10-line CL, menu option 83, bound by `PAR201.ILEPGM`), `FPARAMETER` service program (`PAR300` 108-line `nomain`, `GetPARM1..5`, `EXPORT(*ALL)`), `PARAMETER.PF` (14 lines); 4 surfaces (`pgm:PAR200`, `cl:PAR201`, `srvpgm:FPARAMETER`, `mod:PAR300`), 13 candidates, **all accepted** by the bind (12 `observed-in-code`, `c08` `inferred`). `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, `modern/` and `verification/` were **not** touched; no Architecture pack drafted (job header / bind record: ME drafts new residual-domain packs after the cards, `ROOM_OK` then).

## 2. Cards written / needs-SME left

- **13 / 13** accepted behaviours now have as-is behaviour cards: `discovery/par-maintain/features/par-maintain-c01.md` … `c13.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 13 `documented`; `c08` keeps `confidence: inferred` on its card (source half exact, runtime half outside the tree).
- **0** candidates left without a card (the bind held nothing back); **0** `blocked`. Auto-accept policy not exercised.
- **10 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c11` — **`PATH` is the whole subsystem.** Four callers, all `GetParm2('PATH':' ')` with the literal key (`ORD500`, `PRO202`, `PRO203`, `PAR201`); `GetPARM1/3/4/5` and `ClosePARAMETER` have no caller; `PARM1/3/4/5` are maintained and read by nobody. Recommendation unchanged and sharpened: **`PATH` is target configuration**, and `PAR200` / `PAR201` / `PARAMETER` then have nothing to carry. Room decision.
  - `c07` / `c11` — **`PATH` must end with `/` for half the estate.** `PRO202`/`PRO203` concatenate `%trim(path) + fileName` with no separator; `ORD500C` uses `TODIR` and does not care; `PAR201` lists `<PATH>*`, which is the directory's contents only with the slash — and without it shows exactly the mis-placed files the two writers would have produced. Data question for the box: does the value end with `/`?
  - `c05` — **the `*** Deleted ****` marker never reaches the screen.** `PARM2` is not a subfile field (the list shows `PARM2S`); a deleted row shows blank Code / Sub-Code / `1` and the old `2`–`5` values, stays selectable, and option `4` on the ghost **deletes the blank/blank row if one exists**; option `2` on it ends in an unmonitored 01221. Phase A `c05` corrected.
  - `c09` — **first `PATH` read in a job is the value for the job.** Cache keyed on the record buffer's own key (the `FCOUNTRY` idiom); nothing in the tree ever asks for a different key; `ACTGRP(*CALLER)` + `QILE` everywhere → one buffer per interactive job across all four consumers; a blank key never reads; `closePARAMETER` (`c10`) would close the file but **not** reset the cache. A `PAR200` change is invisible to running jobs.
  - `c08` (`inferred`) — **blank `PATH` is silent end to end**: 100 blanks from the getter, `WRKLNK '*'`, relative XML / spreadsheet names into the sourceless `XML`/`XSS` service programs, blank `TODIR` to `CVTSPLPDF`. Where the files end up is a box question; no seed of the `PATH` row exists in the tree.
- Other facts recorded in the cards (as-is, cited): F6 (create **or** cancel) runs the Page Down path from the saved key and, at `Bottom`, appends the former last row a second time (`c03`, Phase A sharpened); edited rows keep pre-edit values in the list until F5, the edit `chain` locks the row across the screen, an unchanged panel still updates (`c04`); the duplicate check `chain`s the update-capable file — the existing row is locked and loaded while the error shows, typed values stay on screen under `ERRMSG`; keys are upper-cased by the display (why `'PATH'` matches); blank/blank key accepted (`c02`); 14 rows with an exact `Bottom` (look-ahead read), one changed row per cycle pass, options typed before Page Down / F6 survive to the next Enter, leading zeros in columns `4`/`5`, no filter/position-to/search/help, `PAR200` has no `H` spec and bypasses `FPARAMETER` (`c01`); F3 = F12 on the list (end), F3 = F12 on detail panels (back, lock kept) (`c06`); `PAR201` is the only CL calling a service-program procedure, no `MONMSG`, `WRKLNK` gives the operator remove/rename over the output files (`c07`); `EXPORT(*ALL)`, no binder source, no `*PRV`, `chainPARAMETER` not in the copybook (`c10`); `PARAMETER` has no delete flag / audit / text / trigger / SQL consumer, zoned in file, packed on return (`c12`); `LOG100` uses `PARAMETER`'s library from the INFDS to place `SAMLOG`, `LOG300` finds it via `*LIBL` — two rules, and no anchor if the table goes (`c13`).
- Pointer-only observations left for other slices (not deepened): `LOG100` body (`log-programs-c01`, next in queue); `SAMMNU` options 20/83 (`menu-cmd-shell`); `SAMPLE.BNDDIR`, `PAR201.ILEPGM`, `PRO200.ILEPGM`, missing `bnddir` on `ORD500`/`PRO203` (`srvpgm-supporting-c04`/`c05`); `PRO202`/`PRO203` file-name rules (`pro-interactive-c05`/`c13`); `ORD500C` (`ord-print-ord500-c02`, documented). No card outside `discovery/par-maintain/` edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/par-maintain/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. Neither pack's `WAIVED_PATHFINDER` is extended. The note lists what a future RECORD would capture (list for 0/14/15/28+ rows; invalid option; two `2`s / two `4`s in one Enter; create at `Bottom` → duplicate row; duplicate-key error and the lock seen from a second session; edit lock, unconditional update, stale list; delete ghost row and `2`/`4` on it; F3 vs F12 per panel; `PAR201` with slash / no slash / blank; stale `PATH` in a running job vs fresh in a new one; `DSPSRVPGM *PROCEXP`; `DSPFD`; `SAMLOG` library) and the two facts to settle first (`PATH` value on the box; activation group / binding of `ORD500` and `PRO203`).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice par-maintain`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 113 | **126** (+13 `par-maintain`) |
| behaviours `candidate` | 148 | 135 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 25 / 36 / 3 / 7 | **29** / 32 / 3 / 7 (`pgm:PAR200`, `cl:PAR201`, `srvpgm:FPARAMETER`, `mod:PAR300` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `par-maintain`: 4 surfaces, 13 behaviours, **13 documented**, weakest status `documented`.
- **Bind mirror (cap 1):** only `par-maintain` was mirrored this run. The other nine night-wave slices (`log-programs`, `menu-cmd-shell`, `srvpgm-supporting`, `sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive`, `pro-modules`, `pro-cobol-pro201`) read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` (or `deferred`) in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–12.
- `docs/estate/INDEX.md`: row 18 `par-maintain` → **done** with the headline findings; header line notes the night residual bind and run 13.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 12).

## 5. Remaining accepted undocumenteds (queue for next run)

Nine, in the bind record's preferred order (cap 1 per run; Ash sets `overnight/AGENT_JOB.md` line 1 back to `RUN` each time):

1. `log-programs` (10 candidates; 4 `inferred`)
2. `menu-cmd-shell` (9; adapter — the bind accepted it for documentation)
3. `srvpgm-supporting` (9 + 4 `unknown` surfaces)
4. `sql-objects` (10; `CUSSEQ` / `ART801` pointer surfaces)
5. `ord-batch-ord900` (9)
6. `cou-maintain` COU200 half (`c01`–`c06`, `c13`; FCOUNTRY half already documented in run 7)
7. `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes)
8. `pro-modules` (14)
9. `pro-cobol-pro201` (10)

Still held per the bind record: `art-interactive`, `art-modules` (wait `ART302` / SME), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, and now `par-maintain`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1` untouched; residual packs are new packs, later, behind `ROOM_OK`). `modern/` and `verification/` not touched. The job body's `ROOM_OK` line was recorded, not consumed — this station does not need it.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). `LOG100`, `SAMMNU`, `SAMPLE.BNDDIR`, `PAR201.ILEPGM`/`PRO200.ILEPGM`, `ORD500`/`ORD500C`, `PRO202`/`PRO203`, `LOG300` were cited as call sites, contrasts or build facts only — their slices were not deepened and no card outside `discovery/par-maintain/` was edited.
- Did **not** fix any found defect (marker never displayed, duplicate row after create at `Bottom`, stale list after edit, ghost-row 01221, lock across screens, blank-`PATH` pass-through, trailing-slash dependency, cache never invalidated, `EXPORT(*ALL)`) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `par-maintain-cNN` (same decision as runs 1–12; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- `c08` was bound as `inferred` and accepted (not held as needs-SME, unlike `ord-print-ord500-c04`); carded with the confidence kept and the source/runtime split stated. If the room prefers `inferred` rows to stay card-less, the card can be withdrawn — flagged, not decided here.
- `c05` bound under the Phase A name "Option 4 immediate delete, no confirmation"; the card keeps the id and adds the corrected display outcome to the name (`MANIFEST.yaml`, `SME_BRIEF.md`). `c03` name sharpened likewise. `CANDIDATES.md` left as the Phase A record.
- The automation fired on `e311156` (sql-objects BIND.md) but the branch head was `a653c21` by the time this run started (ten more bind commits: ord-batch-ord900, cou-maintain COU200 half, pro-*); worked from the head. The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-process-f3c1`) checked out at a stale SHA; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before writing anything, as the job requires.
- Several statements are platform semantics rather than source: RPG-cycle looping, `READ` at end of file leaving the buffer unchanged (`c03`), `DELETE` by key with no match raising nothing (`c05`), `UPDATE` after a failed `CHAIN` → 01221 (`c04`), record-lock lifetime (`c02`, `c04`), `ERRMSG` not rewriting fields (`c02`), `N80 PAGEDOWN` / MDT survival (`c01`, `c06`), default activation groups (`c09`), `*TCAT` / `WRKLNK` pattern semantics (`c07`), INFDS 93–102 (`c13`). Each is flagged inference / runtime-confirmable on the card and in `needs_sme`.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Nine accepted slices are still undocumented (queue above); the estate scan is partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; `fam-maintain` held; thirteen `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 back to `RUN` (job header already prefers `log-programs` next) — one slice per run, nine to go. **Room:** decide `PATH` as configuration (`c11`) before any residual Architecture pack is drafted; it decides whether `PAR200` / `PAR201` / `PARAMETER` are carried at all, and `log-programs` needs a new `SAMLOG` location rule if the table goes (`c13`). **SME / box:** confirm the `PATH` value (present? trailing `/`? file system?) — the one data fact three cards hinge on (`c07`, `c08`, `c11`).
