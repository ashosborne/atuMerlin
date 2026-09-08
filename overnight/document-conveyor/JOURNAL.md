# JOURNAL — Pack B document-slices conveyor, atu-merlin

One row per run. Branch `cursor/atu-merlin-estate-discovery`. Times UTC (Ash is Europe/London, +1h in September).

| run | started (UTC) | HEAD at start | SLICE_ID | result |
| ---: | --- | --- | --- | --- |
| 1 | 2026-09-08T13:22Z | `ab342e9` | `cus-interactive` | 12/12 accepted cards written; MANIFEST → `documented`; APP_MANIFEST bumped; COVERAGE regenerated; INDEX row mirrored. `CHARACTERIZATION: deferred-waived`. |
| 2 | 2026-09-08T15:11Z | `0e32c19` | `cus-modules` | 10/10 accepted cards written (`c01`–`c09`, `c11`); `c10` stays needs-SME (inferred, no card); MANIFEST → `documented`; APP_MANIFEST bumped (documented 12→22); COVERAGE regenerated; INDEX row 2 done. `CHARACTERIZATION: deferred-waived`. |

## Run 1 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN`.
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD.
- Pick: `cus-interactive` (job preference; CUS-first prove path). Other accepted undocumenteds left in queue: `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`.
- FEATURE_IDs: kept the Phase A / bind ids `cus-interactive-c01..c12` rather than renumbering to `<SLICE_ID>-NNN`. The bind record, `BIND.md` and APP_MANIFEST `behaviour_id`s all reference the `cNN` ids; renumbering would break that trace for no gain. Flagged as a Field Guide open decision, not silently changed.
- Phase A summaries corrected from source during deepen (as-is, observed): `c08` — `CUMODID` is set only at `*inzsr`; on update the `chain` reloads the stored `CUMODID`, so update refreshes `CUMOD` but **not** `CUMODID`. `c04` — update-mode duplicate check counts DB rows matching the *new* values, so changing name+phone to collide with exactly one other customer passes (`dup = 1`).
- Phase A open question on `CUCREA` answered from source: update path chains the record first, so stored `CUCREA` is preserved; create uses the `*inzsr` date (program start date, not save date).
- `APP_MANIFEST.yaml`: `notes` had been changed to a list by the bind commit; `gen_coverage.py` rendered it as a Python list. Added `overnight/tools/mark_documented.py` (status bump + pointers only) and made `gen_coverage.py` render list notes as bullets. No inventory content invented.
- Timestamps in `discovery/cus-interactive/MANIFEST.yaml` normalised to run time.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## Run 2 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN` (job header: "run 2 prefer cus-modules").
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD. `ROOM_OK` not required for this station and not claimed.
- Pick: `cus-modules` (job preference; CUS-first prove path). Remaining accepted undocumenteds: `ord-entry-ord100`, `ord-trigger-ord700`.
- `srvpgm-fcustomer` folded per bind: no new feature invented; export/signature facts documented inside `c01` and `c05`.
- `c10` (inferred scaffold) kept `needs-SME`, no card written. Auto-accept policy not exercised.
- Findings beyond Phase A summaries (as-is, cited in cards): `ExistCus`/`IsCusDeleted` have no callers in `ATU_SRC` and only `GetCusName` of the getters is called; misses are not cached but hits are (stale reads possible in one activation group); `ExistCus(0)` as first call never chains (`%found` undefined); `SltCustomer` criteria persist across calls; SQL errors silent; F8 unhandled → Enter; criteria change beats selection.
- Evidence corrections: `SLTCUSTOMER` export `FCUSTOMER.BND:19`; `c10` include comment `CUSTOMER.RPGLEINC:64-67`.
- Tooling: `MANIFEST.yaml` summaries quoted (unquoted `: ` broke PyYAML before `mark_documented.py` ran; no tool changes needed). `gen_coverage.py` 0 problems.
- Pushed once at the end with `AGENT_JOB.md` already `DONE`.
