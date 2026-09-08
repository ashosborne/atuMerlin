# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 4 · 2026-09-08 17:45–18:30 UTC (18:45–19:30 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `fa5b77f`
Previous briefs preserved in git: run 3 at `efb5e2a:overnight/MORNING_BRIEF.md`; run 2 at `5ac7f0d:overnight/MORNING_BRIEF.md`; run 1 at `0e32c19:overnight/MORNING_BRIEF.md`; Pack A at `ab342e9:overnight/MORNING_BRIEF.md`.

## 1. Slice processed

**`ord-trigger-ord700`** (job preference; the only accepted-but-undocumented slice left in the 2026-09-08 bind). `ORD700` external trigger program on `DETORD` (three `ADDPFTRG` definitions) + `ORD701` SQL trigger on `ORDER`, plus the two boundary facts the bind accepted: `ORD100`'s staging copy is untriggered (`c09`) and `ART801` is the batch reconciliation of the same fields (`c10`). The CUS PACK / `modern/` convert were **not** touched — ORD is document-only per the bind record.

## 2. Cards written / needs-SME left

- **8 / 8** accepted behaviours now have as-is behaviour cards: `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c02.md` … `c07.md`, `c09.md`, `c10.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 8 `documented`.
- **`c01`** (trigger attachment on the box), **`c08`** (`CULASTORD` stale on delete) and **`c11`** (trigger vs reconciliation arithmetic) were `needs-SME` / `inferred` at bind → **no card**, stay `needs-SME` in `MANIFEST.yaml`; not promoted. Their summaries now carry the observed facts from the cards (status and confidence unchanged).
- **0** accepted items left undocumented in this slice. **0** `blocked`.
- **8 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c02` vs `c03`/`c04`/`c10` — **the insert path adds the full `ODQTY`; every other path (delete, update, `ART801`) works in `ODQTY − ODQTYLIV`.** Coincides today because `ORD100` stages `ODQTYLIV = 0`; latent asymmetry.
  - `c04` / `c11` — **order close (`ORD200`/`ORD201` option 7) updates `ORDER` only and never reaches `ORD700`**, while `ART801` excludes closed orders. Delivery (option 8) does reach it (`−ODQTY` per undelivered line; partially delivered lines are skipped by the writer). **No in-tree writer ever changes `ODARID`**, so the article-changed branch has no in-tree caller.
  - `c03` — only the **delete** event logs; the `SAMLOG` line carries `ODQTY`, not the outstanding quantity subtracted; the log call is `callp(e)` with `%error` never read. **How `AddLogEntry` is bound into `ORD700` is not in source** (no `bnddir` on the H-spec, `LOG` absent from `SAMPLE.BNDDIR`, no `ORD700.ILEPGM`) — build owner.
  - `c05` — `UpdArt` has **no error handling** (`chain`/`update` without `(e)`): a record lock or 5-digit overflow inside the trigger is an unhandled exception that lands on the writer's I/O, which none of the writers monitor. Unknown article → silent skip; `ARCUSQTY` can go negative; `ARMOD`/`ARMODID` not stamped; `ARDEL` ignored.
  - `c07` — `ORD701` **assigns** `n.ordate` (no `MAX`) — a back-dated insert moves `CULASTORD` backwards (only reachable outside `ORD100` today); unknown customer → 0 rows, silent; fires **before** the lines are written, no commitment control.
  - `c10` — `ART801` "Reset Summary Fields" is `WHERE EXISTS`-guarded: **articles with no open lines and customers with no open orders keep their old values.** `CUCREDIT` has **no incremental maintainer** anywhere in `ATU_SRC`; `ART801` is its only writer.
  - `c06` — `*inlr` is set only on the no-parameter path; `TTIME`, `CMTLCK`, null maps, lengths and `PARM2` are never read; `dftactgrp(*no)` with no `actgrp` (compile-time).
- Evidence corrections to Phase A recorded in the cards: `ORD701` body `ORD701.SQLTRG:5-16` (was `:4-14`); menu option 82 `SAMMNU.MENU:151-154` (was `:152-155`); `ART801` `CULASTORD` statement `:34-37` (was `:33-36`).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-trigger-ord700/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. Two runtime facts the future RECORD must settle first are listed there (are the four triggers attached at all — `c01`; what an unhandled exception inside `ORD700` does to the writer — `c05`).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-trigger-ord700`; no new surfaces/behaviours):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 34 | 42 (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8) |
| behaviours `accepted` | 8 | **0** (bind queue drained) |
| behaviours `candidate` | 92 | 92 (incl. bind `needs-SME` rows kept as candidate — schema has no needs-SME status) |
| surfaces `accepted` / `deferred` | 12 / 2 | 12 / 2 (unchanged; `ord-trigger-ord700` surfaces were already `accepted` from run 1) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-trigger-ord700`: 11 behaviours, **8 documented**, weakest status `candidate` (that is `c01`/`c08`/`c11`, the needs-SME rows — weakest-wins column working as intended). The `behaviours accepted` histogram row disappears because the count is now zero.
- `docs/estate/INDEX.md`: row 11 `ord-trigger-ord700` → **done** (cards written; SME sign-off pending) with the headline findings; header line notes run 4 and that the conveyor is idle.

## 5. Remaining accepted undocumenteds (queue for next run)

**None.** Every slice accepted in the 2026-09-08 room bind is documented: `cus-interactive` (run 1), `cus-modules` (run 2), `ord-entry-ord100` (run 3), `ord-trigger-ord700` (run 4). **Document conveyor idle** — re-running this paste will report idle until more slices are bound.

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): all four documented slices. Deferred by bind: `ord-batch-ord900`. Skipped by bind: `art-interactive`, `art-modules` (ART302 question). Unbound Phase A candidates: 7 slices (`art-*`, `ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500`). Unscanned seeds: 15 (see COVERAGE / INDEX rows 13–27).

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `operator/atu-merlin-factory-loop/TARGET.md` / the bound CUS PACK for later stations; ORD is not in that vertical (bind record). `modern/` was not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08; `c01`, `c08`, `c11` stay needs-SME). `inferred`/`needs-SME` rows in other slices were not promoted. `ORD100` / `ORD101` / `ORD200` / `ORD201` / `ORD901` / `LOG300` / `PRO202` / `PRO203` / `CUS200` / `CUS300` were cited as call sites, log format or consumers only — their slices were not deepened. `ART801` was documented only as the related surface the bind accepted (`c10`); the `sql-objects` seed remains unscanned.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-trigger-ord700-cNN` (same decision as runs 1–3; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- The Cloud Agent VM checked out a scratch branch at `fa5b77f`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Phase A's SME_BRIEF recommended "one rule card with two implementation notes" for incremental vs batch maintenance; the bind accepted `c02`–`c04` and `c10` as separate candidates, so they are separate cards cross-referencing each other. Not merged.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Estate scan still partial (`overnight/METHOD_COVERAGE.md`). Bind queue drained does not mean discovery complete — 7 Phase A slices are unbound and 15 seeds unscanned.

## 9. Next action

**Bind more slices from the Pack A radar** (this paste has nothing left to document; re-running it will report idle). Candidates ready for a room bind: `ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500` (Phase A done, `CANDIDATES.md` + `SME_BRIEF.md` in place); `art-*` once the ART302 question is answered; or resume Pack A radar on the 15 unscanned seeds (`sql-objects` would give `ART801` its own home). In parallel, a human SME should work the sign-off checklists in `discovery/cus-interactive/SME_BRIEF.md`, `discovery/cus-modules/SME_BRIEF.md`, `discovery/ord-entry-ord100/SME_BRIEF.md` and now `discovery/ord-trigger-ord700/SME_BRIEF.md`; those signatures, not this brief, are what unlock Test generation.
