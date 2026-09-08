# SQLite experiment — slice discovery from sqllogictest (overnight)

> **EXPERIMENTAL inventory radar only.** Candidates only. No bind, no characterisation exec, no architecture pack, no conversion.
> Purpose: grow an honest candidate-slice inventory so Ash can estimate token/cost before seeking sign-off for a later factory run.
> Repo: https://github.com/ashosborne/sqlite-experiment

Paste as the **entire** Cloud Agent / long-run prompt.

---

## Operator charter (edit before launch)

```yaml
OPERATOR: Ash Osborne
APP_ID: sqlite-experiment
REPO: https://github.com/ashosborne/sqlite-experiment
REPO_ROOT: .
# REQUIRED: path to sqllogictest corpus inside the workspace (clone/submodule/vendor before launch)
SQLLOGICTEST_ROOT: sqllogictest   # change if you place the corpus elsewhere
SQLITE_SRC_ROOT: src              # C estate for evidence cross-links (read-only)
SQLITE_EXT_ROOT: ext              # extensions; discover but default recommend defer unless tests force in-scope
MAX_ITERATIONS: 20
MAX_NEW_SEEDS_PER_ITER: 1
PHASE_B: false                    # MUST stay false
AUTO_BIND: false                  # MUST stay false — candidates only
AUTO_ACCEPT: false
ALLOW_CONVERSION: false
ALLOW_TESTGEN: false
ALLOW_TEST_EXEC: false
STOP_WHEN_NO_NEW_SURFACES: 3
INITIAL_SEEDS: []                 # optional ordered seeds (e.g. select, insert, join, index, transaction)
OUT_OF_SCOPE_HINTS:
  - art/
  - autoconf/
  - autosetup/
  - doc/                          # prose docs are not slice seeds; may cite only as secondary evidence
  - tool/                         # build tooling — note separately, do not migrate as app slices
MAX_FILES_TOUCHED: 8000
MAX_RUNTIME_HINT_HOURS: 10
MAX_NEW_CANDIDATES: 80
WRITE_SCOPE: factory-artefacts-only
# Write ONLY under:
#   discovery/**
#   inventory/**
#   overnight/**
#   migration-factory/** (if pack present)
NO_EDITS_TO_SQLITE_SOURCE: true   # never modify src/, ext/, test/, configure, etc.
NO_COMMITS_TO_DEFAULT_BRANCH: true
COMMIT_AS: sqlite-sqllogictest-discovery
COST_ESTIMATE: true               # write overnight/COST_ESTIMATE.md for sign-off
```

---

## What this experiment is (and is not)

**Is:** Factory-shaped **discovery** of migration candidate slices for a future SQLite→Rust modernisation pathfinder, using **sqllogictest** as the primary surface map / evidence ladder for cost estimation.

**Is not:** Cursor’s agent-swarm “build SQLite from the manual” experiment. Do not rebuild from docs. Do not withhold or ignore source. Do not start a Rust rewrite.

**Is not:** Completeness certification. sqllogictest is a strong SQL behavioural corpus; it is **not** “the whole of SQLite.” Never claim the estate is fully found, fully covered, or parity-ready.

**Critical honesty rule:** Do **not** treat sqllogictest as a definitive characterisation suite that removes the need for later RECORD/COMPARE against legacy. For this run, the suite is an **inventory and cost-estimation lens**. Later factory stages (not this prompt) will decide how goldens are recorded. Do not write prose that says “we already have the definitive tests, so characterisation is done.”

---

## Context hard gate (once, before any loop)

1. Confirm repo identity: remote URL, HEAD SHA, default branch. Write `overnight/CONTEXT_GATE.md`.
2. Confirm `SQLLOGICTEST_ROOT` exists and contains `.test` / sqllogictest-format files (or documented layout).
   - If missing: write `overnight/BLOCKED.md` explaining that the sqllogictest corpus is not in the workspace, list how to add it, and **STOP**. Do not silently fall back to TCL `test/` as if it were sqllogictest.
3. Confirm `SQLITE_SRC_ROOT` is readable (for cross-links only).
4. If `migration-factory/` pack is present, read Field Guide discovery rules; if absent, follow this prompt’s schemas stub and still produce the artefacts below.
5. Create stub dirs: `inventory/sqlite-experiment/`, `discovery/`, `overnight/`.

---

## Non-negotiables

- Surfaces/behaviours only as `candidate` or `unknown` (plus prose recommendations to defer/reject — never MANIFEST accepts).
- Never flip candidates to `accepted` / `documented` / `converted`.
- Never run Phase B deepen, test generation, test execution, architecture BIND, or conversion.
- No completion percentages. Counts and histograms only.
- Never claim “all slices found” or “suite implies complete behaviour.”
- Prefer evidence citations (paths + test identifiers) over vibes.
- Label every finding `confidence: observed-in-corpus` | `observed-in-code` | `inferred` | `needs-human`.
- `inferred` never auto-promoted.
- Keep `overnight/JOURNAL.md` every iteration.
- Abort cleanly if `overnight/stop.txt` appears; still write MORNING_BRIEF + COST_ESTIMATE from progress.

---

## Slice model for this estate

A **slice** here is a bounded SQL/behavioural unit that could later be converted and verified independently, for example:

- a language feature cluster (SELECT core, JOINs, aggregates, window functions, CTEs, …)
- a DML/DDL cluster (INSERT/UPDATE/DELETE, CREATE TABLE, indexes, …)
- a transactional / concurrency behaviour cluster (only if evidenced in sqllogictest)
- a type/affinity/null-handling cluster
- an expression/function cluster

Prefer **thin, characterizable seams** over “parser” or “whole VDBE.”

Refuse mega-slices: `whole-engine`, `all-sql`, `entire-src`.

Default **recommend defer** (do not bind later without explicit human choice): FTS, RTREE, sessions, WASM, unrelated `ext/` modules, build/tooling, unless sqllogictest evidence clearly forces a thin in-scope dependency note.

---

## Bootstrap (iteration 0)

1. **Index the sqllogictest corpus (read-only):**
   - Map directory tree, file naming conventions, and any README/manifest.
   - Build `overnight/SQLLOGICTEST_INDEX.md`: file counts by folder, naming patterns, rough topic clusters.
   - Extract provisional topic seeds from paths/filenames/headers (not by executing tests).

2. **Cheap structural index of SQLite C (read-only):**
   - High-level map of `src/` modules (parse, vdbe, btree, pager, os, …) and major `ext/` areas.
   - Write `overnight/SQLITE_SRC_MAP.md` (module → path → one-line role). This is for cross-linking, not for claiming slices from C alone.

3. Ensure `inventory/sqlite-experiment/APP_MANIFEST.yaml` exists (stub OK) with:
   - `status: discovery_in_progress` (never `complete_bound`)
   - `oracle_lens: sqllogictest`
   - `oracle_path: <SQLLOGICTEST_ROOT>`
   - `sqlite_sha: <HEAD>`
   - `scanned_seeds: []`
   - `unscanned_hints: []` (populate from corpus clusters)
   - `candidates: []`

4. Regenerate `inventory/sqlite-experiment/COVERAGE.md` (counts only; no % complete).

---

## Loop algorithm (iterations 1..MAX_ITERATIONS)

Each iteration:

1. **Pick next seed** (in order):
   - Operator `INITIAL_SEEDS` not yet tried
   - Else highest-value cluster from `unscanned_hints` (prefer core DQL/DML before exotic)
   - Else STOP and write residual register

2. **Propose a thin SLICE_ID** for that seed.
   Write `overnight/seeds/<SLICE_ID>.md` with: seed text, in-scope behaviours, out-of-scope, entry evidence from corpus.

3. **Discovery Phase A only** for that slice:
   Outputs under `discovery/<SLICE_ID>/`:
   - `CANDIDATES.md` — candidate behaviours/surfaces
   - `MANIFEST.yaml` — all status `candidate`
   - `SME_BRIEF.md` — ambiguities, recommended accept/defer/reject for a human later
   - `EVIDENCE.md` — sqllogictest file/test-id citations; optional `src/` cross-links

   Every candidate must include:
   - provisional name / id
   - behaviour summary (as evidenced)
   - evidence: sqllogictest paths + identifiers
   - optional code cross-link into `src/` (observed-in-code) if clear; else leave unknown
   - dependencies / likely shared modules
   - confidence
   - notes on skips / platform conditionals **only if visible in corpus metadata** (do not invent)

4. **Upsert APP_MANIFEST** with new candidates; update `scanned_seeds` / `unscanned_hints` honestly.

5. **Regenerate COVERAGE.md**.

6. Append `overnight/JOURNAL.md` (what scanned, new counts, blockers).

7. If no new surfaces/hints for `STOP_WHEN_NO_NEW_SURFACES` consecutive iters → exit loop.

---

## Required end artefacts

### `overnight/MORNING_BRIEF.md`
- What was scanned
- Candidate counts (new / cumulative)
- Top proposed human binds for a later session (still recommendations)
- Residuals / unscanned hints
- Explicit statement: discovery incomplete by design; no conversion started

### `overnight/COST_ESTIMATE.md` (for sign-off)
Estimate **order-of-magnitude** cost for a *later* factory wave, using discovery outputs only. Include:

1. **Inventory size:** candidate slice count; behaviours/surfaces count; evidence file count touched
2. **Suggested wave-1 bind set:** smallest set of slices that covers core SQL evidenced by corpus (list ids)
3. **Rough effort model (transparent assumptions):**
   - Assume per accepted slice later: discovery deepen + characterisation wiring + convert + verify
   - Provide low/med/high agent-hour and token bands with stated assumptions (model class, retries, review)
   - Separate: (A) cost to finish discovery residuals only; (B) cost to run factory on wave-1 bind set; (C) cost if wave expands to all current candidates
4. **Risk adders:** unclear corpus layout, weak src cross-links, extension pressure, suite gaps
5. **Do not** present estimates as quotes or commitments; label as pre-sign-off planning ranges

### `overnight/RESIDUALS.md`
Unscanned clusters, blocked areas, questions for Ash.

### `inventory/sqlite-experiment/APP_MANIFEST.yaml` + `COVERAGE.md`
Always consistent with journals.

---

## Schemas (minimum fields)

If full factory schemas are absent, still emit YAML with at least:

```yaml
# discovery/<SLICE_ID>/MANIFEST.yaml
slice_id: ...
status: phase_a_candidates
candidates:
  - id: ...
    name: ...
    summary: ...
    status: candidate
    confidence: observed-in-corpus  # or observed-in-code | inferred | needs-human
    evidence:
      - path: sqllogictest/...
        locator: ...
    code_cross_links: []            # optional src/ paths
    deps: []
    notes: ...
```

---

## Stop conditions

Stop when any of:
- MAX_ITERATIONS reached
- STOP_WHEN_NO_NEW_SURFACES triggered
- MAX_RUNTIME_HINT_HOURS exceeded
- MAX_FILES_TOUCHED exceeded
- `overnight/stop.txt` present
- SQLLOGICTEST_ROOT missing/unreadable (immediate BLOCKED)

On stop: finalise MORNING_BRIEF + COST_ESTIMATE + JOURNAL; do not start conversion “to use remaining time.”

---

## Anti-greenwash checklist (must pass before finishing)

- [ ] No “100%” / “complete” / “fully discovered” language
- [ ] No accepted/bound features without human
- [ ] No test execution claimed
- [ ] No Rust conversion code written
- [ ] sqllogictest treated as lens, not definitive characterisation
- [ ] COST_ESTIMATE assumptions stated explicitly
