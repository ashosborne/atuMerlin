# JOURNAL — Pack B document-slices conveyor, atu-merlin

One row per run. Branch `cursor/atu-merlin-estate-discovery`. Times UTC (Ash is Europe/London, +1h in September).

| run | started (UTC) | HEAD at start | SLICE_ID | result |
| ---: | --- | --- | --- | --- |
| 1 | 2026-09-08T13:22Z | `ab342e9` | `cus-interactive` | 12/12 accepted cards written; MANIFEST → `documented`; APP_MANIFEST bumped; COVERAGE regenerated; INDEX row mirrored. `CHARACTERIZATION: deferred-waived`. |

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
