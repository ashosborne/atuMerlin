# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 18 · 2026-09-09 22:05 – 22:4x UTC (23:05–23:4x Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `e81562f` (the RUN tip itself)
Previous briefs preserved in git: Pack B run 17 at `72340fd:overnight/MORNING_BRIEF.md`; run 16 at `369065b`; run 15 at `22eab31`; run 14 at `b8feaf9`; run 13 at `0de4efa`; run 12 at `ee67225`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`ord-batch-ord900`** (job preference; sixth of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, Ash authorized, Field recorded; supersedes the 2026-09-08 residual bind's `deferred` on this slice). Two menu utilities: `ORD900` (11 lines — reset `LASTORDNO` to `MAX(ORID)`) and `ORD901` (52 lines — shift every order's dates so the newest is today, derive delivery / close dates, resync `DETORD.ODYEAR` and `CUSTOMER.CULASTORD`). 2 surfaces, 9 candidates, **all accepted** by the bind (8 `observed-in-code`, 1 `inferred`). Both members read in full; neighbours (`ORD100`, `ORD200` / `ORD201`, `ORD700` / `ORD700U`, `ART801`, `ORD701`) cited via their existing cards — CUS / ORD not widened.

## 2. Cards written / needs-SME left

- **9 / 9** accepted behaviours now have as-is cards: `discovery/ord-batch-ord900/features/ord-batch-ord900-c01.md` … `c09.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 9 `documented`; `c07` keeps `confidence: inferred` on its card (menu wording, blank `%TEXT`, ARCAD-generated data-area source and the absence of parameters / scheduling / logging are source; "these are demo-refresh tools" is a reading — run-13..17 practice).
- **0** candidates left without a card (the bind held nothing back); **0** `blocked`. Auto-accept policy not exercised.
- **9 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - **`c07` — room / product owner (Phase A Q1, the slice's main question):** are `ORD900` / `ORD901` / `ART801` run against real data, or only to refresh the Arcad sample between demos? Source says: Utilities group with "Reset …" texts; `%TEXT` blank on **exactly** these three programs (+ `ORD700`, `PRO203`) while the other 33 `QRPGLESRC` members carry one; `LASTORDNO.DTAARA` is ARCAD-generated with a snapshot `VALUE(60719)`; no parameters, no scheduling, no logging. If sample-only → **defer the slice from conversion scope** (Phase A recommendation unchanged; the ORD pack already lists all three as not converted). `DSPOBJD` last-used dates + `WRKJOBSCDE` (`c08`) settle it from the box.
  - **`c04` — room (ORD pack, Phase A Q2):** a **hidden 10-day auto-close rule** — an open order delivered strictly more than 10 days before today gets `ORDATCLO = ORDATDEL + 10`. It exists only in `ORD901`; `ORD200` / `ORD201` close on demand at today's date. Business rule or sample convenience? Also the only in-tree path to a **closed order with no delivery date** (delivery shifted past today → 0, close kept).
  - **`c04` / `c05` — room (ORD pack) + ops:** `ORD901` can close orders but resyncs only `ODYEAR` and `CULASTORD` — **`ARCUSQTY` / `CUCREDIT` are left stale** until menu option 82 (`ART801`); nothing sequences 81 → 82. Same gap the `ord-trigger-ord700` cards record for the interactive close.
  - **`c05` — room (ORD pack):** `CULASTORD = MAX(ORDATE)` is implemented **twice** (`ORD901:46-50` is character-for-character `ART801:35-37`) and once differently (`ORD701` assigns the inserted date). Fold or keep? And `ORD901` is the **estate's only writer of `DETORD.ODYEAR`** (`ORD100` writes 0, nothing reads it) — is the column needed in the target at all?
  - **`c06` / `c02` — source owner, one command:** `PRTSQLINF ORD901` — the `COMMIT` option the object was built with (the member has no `SET OPTION COMMIT`; under the `*CHG` default the two tail `UPDATE`s need journaled files) and whether `from order` undelimited (`:11,43,45`) compiled as-is (`sql-objects-c10`).
  - **`c06` — room (ORD pack):** if a target counterpart exists at all, atomic or as-is? As-is is three independent parts, no handler, no `COMMIT`; **a rerun after a mid-loop failure shifts the already-done rows a second time** (when the newest order was not among them) and their delivery / close dates are then zeroed by the future guard.
  - **`c01` — room (ORD pack):** the target replaces the data area with a sequence — is a "reset sequence to `MAX(id)`" operator action wanted, or does `ORD900` fall with `c07`? As-is on an empty file: `LASTORDNO` is **written as 0** (Phase A said "readp fails" — it does not fail), so the next confirm allocates order 1.
- **Phase A corrected:** `c01` ("readp fails/undefined" → the `READP` does not fail; the data area is written as 0). **Sharpened:** `c02` (guard works via the `-305` `NULL` path; silent exit on any `SELECT` failure), `c03` (sign follows the data; same-day rerun no-op; `RNQ0112` on a bad date; double shift on rerun after partial run; `ORDER3` has no reader), `c04` (strict boundary; closed-without-delivery reachable; summary fields stale; complete writer set of the two fields enumerated), `c05` (only `ODYEAR` writer; differential; `ORD700U` fires as `UpdArt(0)`; orphan lines skipped; verbatim `ART801`; `ORD701` differs), `c06` (native vs SQL commitment stance; `SET OPTION` census; `SQL7008` case; concurrency with `ORD100`), `c07` (`%TEXT` survey of all 37 members; ARCAD provenance), `c08` (CL / CMD directory census; `wrksbmjob` is the only job string; no `*ENTRY` / `PI`; job date is the only knob), `c09` (line-by-line meaning table; `%days(10)` twice, only in `ORD901`; reordering hazard).
- Pointer-only observations left for other slices (not deepened): `ART801` (`sql-objects-c08` / `-c09`, `ord-trigger-ord700-c10`) cited for the duplicated statement and the open-order summaries only; `ORD700` / `ORD700U` (`ord-trigger-ord700-c04`) for the zero-delta path; `ORD100` (`ord-entry-ord100-c07`) for the `LASTORDNO` contract and `ODYEAR = 0`; `ORD200` / `ORD201` options 7 / 8 for the interactive writers of the same two date fields. No card outside `discovery/ord-batch-ord900/` edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-batch-ord900/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The note lists the checks an SME would run instead (`DSPDTAARA` before / after option 80 on a populated and an empty file; `MAX` / `MIN` / `COUNT` of `ORDATE` around option 81; counts of closed-without-delivery and 10-day closes; `COUNT(*) WHERE ODYEAR = 0`; `CULASTORD` vs `MAX(ORDATE)` drift; `ARCUSQTY` / `CUCREDIT` before 81 / after 81 / after 82; `PRTSQLINF ORD901`; one deliberate `RNQ0112` plus rerun; `WRKJOBSCDE`; `DSPOBJD` last-used dates).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-batch-ord900`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 164 | **173** (+9 `ord-batch-ord900`) |
| behaviours `candidate` | 97 | 88 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 42 / 19 / 3 / 7 | **44** / 19 / **1** / 7 (`pgm:ORD900`, `pgm:ORD901` deferred → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-batch-ord900`: 2 surfaces, 9 behaviours, **9 documented**.
- **Tooling change (small):** `mark_documented.py` previously lifted only `candidate` surfaces on an accepted bind. `pgm:ORD900` / `pgm:ORD901` had been set `deferred` by the 2026-09-08 residual bind and were re-accepted by the night bind, so the tool now re-evaluates `deferred` surfaces too on an accepted bind (never anything past `accepted`). Verified: with `--slice ord-batch-ord900` exactly those two surfaces moved; a no-`--slice` dry run was inspected and **reverted** (it would have mirrored the four not-yet-run slices' binds, which the cap-1 practice leaves for their runs).
- **Bind mirror (cap 1):** only `ord-batch-ord900` was mirrored this run. The other four night-wave slices (`cou-maintain` COU200 half, `pro-interactive`, `pro-modules`, `pro-cobol-pro201`) read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` (or `deferred`) in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–17.
- `docs/estate/INDEX.md`: row 12 `ord-batch-ord900` → **done** with the headline findings (was `deferred (bind)` from the 2026-09-08 bind); header line notes run 18 and the superseded deferral.

## 5. Remaining accepted undocumenteds (queue for next run)

Four accepted and undocumented; **one runnable** under the run-18 job header (cap 1 per run; Ash sets `overnight/AGENT_JOB.md` line 1 back to `RUN`):

1. `cou-maintain` COU200 half (`c01`–`c06`, `c13`; FCOUNTRY half already documented in run 7; the 2026-09-08 bind's `deferred` on these seven was superseded by the night bind — same lift the tool now handles)

**Room-held by the job header ("Hold: pro-interactive, pro-modules, pro-cobol-pro201")** — accepted in the bind record, not to be run until the header releases them: `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes; `c07` / `c12` outputs cannot get past "file written to `PATH`" until `XML` / `XSS` are seen — `srvpgm-supporting-c02`), `pro-modules` (14), `pro-cobol-pro201` (10).

Still held per the bind record and the job header: `art-interactive`, `art-modules` (wait `ART302` / SME), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `par-maintain`, `log-programs`, `menu-cmd-shell`, `srvpgm-supporting`, `sql-objects`, and now `ord-batch-ord900`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted, read or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1` and the five residual packs untouched; `modern/db/schema.sql:59-61` and `modern/README.md:210,287,379,405` cited read-only for the `lastordno` sequence and the "ORD900 / ORD901 / ART801 not converted" statement — no line of `modern/` or `verification/` changed). Convert / Verify are different stations with their own `ROOM_OK` gates, which this run neither needs nor consumes.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). Neighbour members were cited via their existing cards — their slices were not deepened.
- Did **not** fix any found defect (empty-file write of 0, silent `-305` exit, double shift on rerun, closed-without-delivery, stale summary fields, duplicated `CULASTORD` statement, undelimited `order`, `lastdate` reuse) — all recorded as-is per the job header.
- Did **not** decide `c07`. The Phase A recommendation ("defer from conversion scope if confirmed demo tooling") is restated as a recommendation; Discovery does not set that status.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-batch-ord900-cNN` (same decision as runs 1–17; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- One `inferred` row (`c07`) was bound `accepted` (not held as needs-SME); carded with the confidence kept and the source/reading split stated, as runs 13–17 did. If the room prefers `inferred` rows to stay card-less, the card can be withdrawn — flagged, not decided here.
- **Tool change** in `overnight/tools/mark_documented.py` (deferred → accepted lift on a re-accepting bind) — the first tool change since run 12's `gen_coverage.py` lint. Six lines; behaviour for `candidate` surfaces unchanged; the `--slice` scoping is what keeps the other slices' binds unmirrored, as before. `cou-maintain`'s COU200 half will need the same lift on its run.
- Several statements are ILE RPG / DB2 for i semantics rather than source, each flagged inference / runtime-confirmable on the card and in `needs_sme`: `-305` leaves the host variable unchanged; `READP` at BOF leaves input fields unchanged; numeric field initialisation; `RNQ0112` unhandled halts; precompiler `COMMIT` default; `SQL7008` on unjournaled files; `TRGUPDCND(*CHANGE)`; `UNIQUE` LF rejecting a duplicate on `WRITE` to the PF; `OUT` without `*LOCK` unlocks.
- **Single run this time.** The RUN tip (`e81562f`) fired exactly one run; the only other automation entry was a NOT_YET_STARTED stub from the 20:15Z DONE push that never started. Checked before the first write, and `origin` re-fetched before the first commit and before the push.
- The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-process-108f`) checked out at the trigger commit; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before any write.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Four accepted slices are still undocumented (one runnable, three `pro-*` room-held — queue above); the estate scan is partial (`overnight/METHOD_COVERAGE.md` — the QM queries `ARTQRY` / `CUSQRY` remain the report-side blind spot; this run adds the operational blind spot that scheduling of the three reset utilities is invisible from source); ART slices unbound pending ART302; `fam-maintain` held; eighteen `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 back to `RUN` (job header should prefer `cou-maintain` COU200 half next — the last runnable slice; after it only the three `pro-*` remain, room-held) — one slice per run. A Pack B run takes ~40–60 minutes; **any push to the branch while line 1 is `RUN` fires another run on the same slice** — this run was clean, but the pattern from runs 13–16 stands. Cheapest protection: push operator / ME / room artefacts only while line 1 reads `DONE`. **Room / product owner (one yes/no that reshapes the slice):** are `ORD900` / `ORD901` / `ART801` demo-refresh tooling (`c07`)? If yes, record the slice as *deferred from conversion scope* and the eight mechanics cards become the record of what the sample tooling does; if no, `c04`'s 10-day auto-close and `c03`'s date shift are business rules the ORD pack does not implement. **Source owner (one command):** `PRTSQLINF ORD901` — `COMMIT` option + whether the undelimited `order` compiled. **Ops:** `WRKJOBSCDE` on the box. **ME (when the room answers `c07` = real):** the `CULASTORD` rule is defined three ways in the estate (`ORD701` assigns, `ART801` / `ORD901` recompute `MAX`) — the target should have one.
