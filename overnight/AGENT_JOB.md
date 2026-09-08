RUN

# PACK A — Estate radar residual (atuMerlin) — FIRE after CUS Verification DONE
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# Goal context: full-repo migrate (Ash). This job is Phase A candidates ONLY — no bind, no convert.
# Prefer unscanned seeds 13+ / unscanned_hints from inventory (providers, families, countries, params, VAT, log, DAT, COBOL PRO201, menus, SQL objects, srvpgm gaps).
# Do NOT re-scan already-documented CUS/ORD bound slices as new work. Extend estate inventory only.
# AUTO_BIND false. AUTO_ACCEPT false. No widening atu-merlin-ts-cus-v1. No ORD/ART convert.
# AGENT_JOB was idle (Verification DONE) before this fire.
# House style: never use pin / pinned / landed.

# PASTE THIS as the entire Cloud Agent prompt
# PACK A — Estate radar (atuMerlin) — Phase A candidates ONLY
# NOT documentation deepen. NOT tests. NOT conversion.

You are running the **estate discovery loop** (inventory radar) on Arcad IBM i sample **atuMerlin**.

**This pack does Phase A candidate hunting only.** It does **not** bind, deepen behaviour cards, generate tests/goldens, or convert. Ash runs Pack B (`PASTE-document-slices-conveyor-atu-merlin.md`) later — **after human bind** — for Phase B cards only.

Adapt from `migration-factory/prompts/estate-discovery-loop-v0.1.md`. **Law:** Field Guide + schemas win. Never invent factory rules.

**Branch:** `cursor/atu-merlin-estate-discovery` off `master`. Open/update PR **to `master`**. Never commit to default branch directly. Never edit `ATU_SRC/**`.

**House style:** never use the words pin / pinned / landed.

---

## Operator charter (filled — Pack A)

```yaml
OPERATOR: Ash Osborne
APP_ID: atu-merlin
REPO_ROOT: .
FACTORY_ROOT: migration-factory
MAX_ITERATIONS: 12
MAX_NEW_SEEDS_PER_ITER: 1
PHASE_B: false
AUTO_BIND: false
AUTO_ACCEPT: false
ALLOW_CONVERSION: false
ALLOW_TEST_GEN: false
ALLOW_TEST_EXEC: false
STOP_WHEN_NO_NEW_SURFACES: 2
ALLOWLIST_PATHS:
  - ATU_SRC/**
OUT_OF_SCOPE_HINTS:
  - conversion / modern code
  - test gen / RECORD / goldens
  - whole-ORD mega-slice
  - treating shared PF/LF as slices (they are deps)
WRITE_SCOPE: factory-artefacts-only   # discovery/**, inventory/**, overnight/** only
OPTIONAL_DUAL_WRITE:
  - docs/estate/INDEX.md              # status mirror for Ash; INDEX is readability SoT, APP_MANIFEST is factory SoT for radar
NO_COMMITS_TO_DEFAULT_BRANCH: true
COMMIT_AS: estate-discovery-loop
WORK_BRANCH: cursor/atu-merlin-estate-discovery
PR_TARGET: master
MAX_FILES_TOUCHED: 5000
MAX_RUNTIME_HINT_HOURS: 8
MAX_NEW_CANDIDATES: 40
MAX_SLICES_PHASE_A: 12
```

### INITIAL_SEEDS (prefer first; callable seams; PF/LF = deps)

Use charter / `SLICE_SEED_QUEUE.md` order. Summary:

1. `cus-interactive`, `cus-modules`
2. `art-interactive`, `art-modules`
3. ORD thin seams: `ord-entry-ord100`, `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `ord-trigger-ord700`, `ord-batch-ord900`
4. `pro-interactive`, `pro-modules`, `pro-cobol-pro201`
5. `fam-maintain`, `cou-maintain`, `par-maintain`, `vat-module`, `log-programs`, `dat-utils`
6. SRVPGM API seams: `srvpgm-fcustomer`, `srvpgm-farticle`, `srvpgm-fprovider`, `srvpgm-supporting`
7. Residuals: `menu-cmd-shell`, `sql-objects`

**Do not** create slices whose only members are shared PF/LF. List those files as `deps` on the callable seam.

---

## Ensure factory pack

1. If `migration-factory/` missing: copy from known pack (operator may attach `/workspace/migration-factory` or clone `ashosborne/migration-factory` main) into `migration-factory/`.
2. If still missing: write `overnight/BLOCKED.md` and STOP.

Attach/read: `docs/FIELD-GUIDE.md`, `OPERATOR-RUNBOOK.md`, `prompts/estate-discovery-loop-v0.1.md`, `prompts/discovery-agent-v0.2.md`, `skills/operator/slice-scoping/SKILL.md`, `schemas/app-manifest.schema.md` (+ `.json`), `schemas/discovery-manifest.schema.md`.

---

## Context hard gate (once)

1. Checkout/create `cursor/atu-merlin-estate-discovery` from `master`.
2. Read Field Guide (App Discovery + Portfolio inventory + Experimental estate discovery).
3. Identify repo remote + HEAD SHA → `overnight/CONTEXT_GATE.md`.
4. Ensure `inventory/atu-merlin/APP_MANIFEST.yaml` exists (stub if needed; `completeness: incomplete`).
5. Resume **additive** from existing APP_MANIFEST + prior `discovery/<SLICE_ID>/`. Do not thrash or downgrade human-set statuses.

---

## What success means

Richer, still-incomplete `inventory/atu-merlin/APP_MANIFEST.yaml` + regenerated `COVERAGE.md` + `overnight/MORNING_BRIEF.md` with proposed next human binds.

**Not** success: auto-accept, Phase B cards, tests, conversion, "% complete", "all slices found".

---

## Non-negotiables (Pack A)

- Write surfaces/behaviours only as `candidate` or `unknown` (defer/reject only as **recommendations** in prose / SME_BRIEF — not MANIFEST accepts).
- Never flip Discovery MANIFEST features to `accepted` / `documented`.
- Never run Phase B, Test gen, Test exec, Architecture BIND, or Conversion.
- Never set APP_MANIFEST `status: complete_bound` or any completeness that implies done.
- No completion percentages. Counts / histograms only.
- Prefer evidence citations (paths under allowlist) over vibes.
- Label every finding `confidence: observed-in-code` vs `inferred` (inferred never auto-promoted).
- Keep `overnight/JOURNAL.md` every iteration.
- Never edit `ATU_SRC/**`. Never push/commit to `master`.
- Secrets: skip credential-looking files; redact tokens in journals.
- Abort cleanly if `overnight/stop.txt` appears.

---

## Loop algorithm

### Bootstrap (iter 0)

Cheap structural index over `ATU_SRC/**`:

| Method family | What to note |
| --- | --- |
| DSPF | Display files tied to entry PGMs |
| CMD | Command objects (e.g. CRTORD) |
| CL | CLLE wrappers |
| SQLRPGLE / RPGLE / RPG | Entry programs + modules |
| COBOL | QCBLSRC |
| SRVPGM | QILESRVSRC / QSRVSRC / BNDDIR |
| SQL / SYSTRG | QSQLSRC / QTRGSRC |

Populate `unscanned_hints` with entrypoint clusters not yet seeded. Regenerate `COVERAGE.md`. Emit `overnight/METHOD_COVERAGE.md` (touched / skipped / could-not-see for the families above). Set APP_MANIFEST note `estate_scan: partial` until checklist addressed.

### Each iteration (1..MAX_ITERATIONS)

1. **Pick next seed** (order): unused `INITIAL_SEEDS` → else highest-value `unscanned_hints` (prefer CMD/entry PGM/CL callable seams) → else STOP with residual register.
2. **Slice-scope** (`slice-scoping` skill): propose mid-size `SLICE_ID`, seed text, entrypoints, out-of-scope, **deps** (shared PF/LF/protos/SRVPGM as deps). Refuse mega-slices ("whole ORD*", "whole ATU_SRC"). Write `overnight/seeds/<SLICE_ID>.md`.
3. **Discovery Phase A only** → `discovery/<SLICE_ID>/CANDIDATES.md`, stub `MANIFEST.yaml` (all `candidate`), `SME_BRIEF.md`.
4. **Upsert APP_MANIFEST**: surfaces + behaviour stubs as `candidate`/`unknown`; append `scanned_seeds`; adjust `unscanned_hints` honestly.
5. **Optional:** refresh `docs/estate/INDEX.md` rows (slice_id, status mirror of unscanned/candidate, member summary, deps) for Ash readability. Do **not** invent factory accepts in INDEX. Do **not** treat INDEX as permission to Phase B.
6. Regenerate `COVERAGE.md` (never hand-edit).
7. Journal; apply stop checks (MAX_ITERATIONS, STOP_WHEN_NO_NEW_SURFACES, blockers).

### End of run — MORNING_BRIEF.md

1. Banner: **`PHASE A ONLY - UNBOUND CANDIDATES`**
2. Counts: seeds scanned / new candidate features / deferred recommendations / errors
3. Top candidates table: id, slice, entry PGM/CMD/CL hint, confidence (observed vs inferred), evidence path
4. APP_MANIFEST / COVERAGE delta
5. Remaining `unscanned_hints` + `% allowlist seeds scanned` if useful (**honesty metric, not completeness**)
6. Recommended human priority for **bind** (not auto-bound) — prefer CUS/ART then ORD seams
7. Suspected blind spots (ARCAD metadata-only, missing sources, binding-dir-only, runtime-only)
8. Explicit: Did **not** bind, deepen Phase B, PACK, RECORD, test-gen, or Convert
9. Explicit: `completeness: incomplete` — human residual gate required
10. If METHOD_COVERAGE unmet: banner `ESTATE_SCAN_INCOMPLETE`
11. Closing ask: "Bind which slice IDs today?" (then Ash runs Pack B document conveyor on accepted only)

Safe claim only:

> Of the allowlisted seeds scanned, these candidate slices were proposed; APP_MANIFEST updated; nothing bound.

---

## Anti-patterns (refuse)

- Re-seeding same package without new entrypoints
- Accepting candidates because "looks core"
- Declaring estate fully sliced / "% complete" / "all slices found"
- Unlocking Test gen or document Phase B from unbound overnight candidates
- Silent deletion of human accepted/deferred/rejected rows
- Treating COVERAGE growth as migration progress
- Collapsing ORD* into one slice because they share `ORDER.PF`
- Making PF/LF-only "slices"
- Mixing this radar with conversion/conductor behaviour

---

## Morning human (after this pack)

1. Read MORNING_BRIEF + COVERAGE (+ optional `docs/estate/INDEX.md`).
2. Bind via `record-bind` (accept / reject / defer).
3. Only then launch **Pack B** document-slices conveyor for accepted SLICE_IDs (behaviour cards — still no tests/convert).
