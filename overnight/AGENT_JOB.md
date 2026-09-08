RUN

# PACK B — Document-slices conveyor (atuMerlin) — ORD wave run 11
# Prefer: ord-maintain-ord202, then ord-print-ord500
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# Bind tip: overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md + discovery/*/BIND.md
# Cap 1 slice. ord-maintain-ord201 DONE run 10. CHARACTERIZATION deferred-waived.
# Do not convert. Do not widen atu-merlin-ts-cus-v1. Planted defects: document as-is, do not fix.
# After five ORD carded: ME drafts new ORD Architecture pack (ROOM_OK then).

# PASTE THIS as the entire Cloud Agent prompt
# PACK B — Document-slices conveyor (atuMerlin)
# Phase B behaviour cards ONLY — after human bind of accepted SLICE_IDs
#
# NOT estate radar. NOT test-gen / goldens / characterization RECORD.
# NOT conversion (target stack is noted in TARGET.md for later convert stations only).

You are running a **re-runnable document-slices conveyor** on **atuMerlin**.

**Job this run:** pick **one** accepted but not-yet-documented slice, run Discovery **Phase B** deepen (behaviour cards from source), update MANIFEST → `documented`, regenerate COVERAGE, commit on factory branch, stop.

**Cap:** 1 slice per run (re-run until brief says done or no remaining seeds).

**Law:** Field Guide + `discovery-agent-v0.2` + deepen-phase-b skill win. Never invent factory rules.

**Branch:** `cursor/atu-merlin-estate-discovery` (from `master` or latest radar/bind branch as appropriate). Never commit to `master`. Never edit `ATU_SRC/**`.

**House style:** never use pin / pinned / landed.

**Explicit non-goals for this pack:**
- No estate Phase A re-hunt (that is Pack A)
- No conversion (see `TARGET.md` — TypeScript modular monolith + PostgreSQL + simple web UI — for **later** convert stations only)
- No test generation, no RECORD/REPLAY, no goldens
- Characterization: **deferred / waived** where no IBM i runtime (documentation from source only). You may leave a one-line `CHARACTERIZATION: deferred-waived` note under the slice; do **not** invent WAIVED_PATHFINDER unlocks for Conversion here.

---

## Operator charter (filled — Pack B)

```yaml
OPERATOR: Ash Osborne
APP_ID: atu-merlin
REPO_ROOT: .
FACTORY_ROOT: migration-factory
WORK_BRANCH: cursor/atu-merlin-estate-discovery
NO_COMMITS_TO_DEFAULT_BRANCH: true
PHASE_A: false
PHASE_B: true
CAP_SLICES_PER_RUN: 1
ALLOW_CONVERSION: false
ALLOW_TEST_GEN: false
ALLOW_TEST_EXEC: false
CHARACTERIZATION: deferred-waived
AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only
# inferred / needs-SME candidates stay needs-SME — do not deepen as accepted
WRITE_SCOPE:
  - discovery/**
  - inventory/**
  - overnight/**
  - docs/estate/**          # dual-write INDEX status for Ash
  - migration-factory/**    # copy pack in if missing only
COMMIT_AS: document-slices-conveyor
TARGET_STACK_DOC: TARGET.md  # read for context only — do not convert
```

---

## Preconditions (hard)

1. Factory pack present under `migration-factory/` (copy from operator pack / `ashosborne/migration-factory` main if missing). If still missing → `overnight/BLOCKED.md` and STOP.
2. Read: Field Guide, Operator runbook, `prompts/discovery-agent-v0.2.md`, `skills/operator/deepen-phase-b/SKILL.md`, `skills/operator/waive-characterization/SKILL.md` (for deferred note only), discovery + app-manifest schemas, optional `TARGET.md` (context only).
3. `inventory/atu-merlin/APP_MANIFEST.yaml` exists (from Pack A).
4. Human bind has occurred for at least one `SLICE_ID` (`accepted` in slice `discovery/<SLICE_ID>/MANIFEST.yaml` and/or bind record). If **no** accepted slices → write MORNING_BRIEF "waiting on human bind" and STOP (do not self-bind).
5. Emit `overnight/CONTEXT_GATE.md` (files read + HEAD SHA + chosen SLICE_ID).

---

## Pick next slice (exactly one)

Priority order:

1. Accepted features/slices in `discovery/*/MANIFEST.yaml` with status not yet `documented` (missing behaviour cards).
2. Else APP_MANIFEST behaviours/surfaces marked accepted / in-scope but not documented.
3. Else `INITIAL_SEEDS` / `SLICE_SEED_QUEUE.md` rows that are human-accepted in INDEX or bind notes but lack `discovery/<id>/features/`.
4. Else unscanned_hints **only if** they already have a human accept bind — never promote radar candidates here.
5. If none → MORNING_BRIEF "document conveyor idle — no remaining accepted undocumenteds" + `completeness: incomplete` and STOP.

Refuse mega-slices. Shared PF/LF remain **deps**, not the slice.

---

## Auto-accept policy (within the chosen seed only)

During deepen, you may treat Phase A candidates as deepen-able **only when**:

- Human bind already `accepted` them, **or**
- Charter allows auto-accept of **`observed-in-code`** candidates that clearly sit inside the bound seed entrypoints

**`inferred` stay `needs-SME`.** Do not invent accepts. Do not widen outside seed + deps citations.

---

## Per-run loop body (one slice)

### 1) Journal start
Append `overnight/document-conveyor/JOURNAL.md`: SLICE_ID, HEAD SHA, timestamp (UTC; Ash is Europe/London).

### 2) Phase B deepen
Follow Discovery agent Phase B + deepen-phase-b skill:

- Behaviour cards under `discovery/<SLICE_ID>/features/<FEATURE_ID>.md` for **accepted** items only
- As-is behaviour from source (RPGLE/COBOL/CL/DDS citations); no desired-future / target-stack redesign
- Update `discovery/<SLICE_ID>/MANIFEST.yaml` → `documented` for completed cards; keep `needs-SME` / `blocked` explicit
- Refresh `SME_BRIEF.md` sign-off checklist (human SME still signs later)

### 3) Characterization stance
Add brief note in slice README or `discovery/<SLICE_ID>/CHARACTERIZATION.md`:

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Do **not** run test-gen or waive-characterization as a Conversion unlock path.

### 4) Portfolio inventory
Upsert `inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + pointers only; do not invent new estate surfaces beyond what deepen observed inside the seed). Regenerate `COVERAGE.md` (never hand-edit).

### 5) Optional dual-write INDEX
Update `docs/estate/INDEX.md` row for this slice: status mirror (`doing`→`done` when documented), members summary, deps. INDEX is for Ash readability; slice MANIFEST remains deep SoT.

### 6) Commit
On `cursor/atu-merlin-estate-discovery` only. Message prefix: `document-slices: <SLICE_ID>`.

### 7) Stop
Always stop after one slice. If more accepted undocumenteds remain, MORNING_BRIEF says "re-run conveyor". If none remain, MORNING_BRIEF says document pass idle / waiting on more binds or residual human gate.

---

## MORNING_BRIEF.md (end of every run)

1. Banner: **`PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION`**
2. Slice processed (or idle reason)
3. Cards written / needs-SME left
4. Characterization deferred-waived note present
5. COVERAGE / APP_MANIFEST / optional INDEX delta
6. Remaining accepted undocumenteds (queue)
7. Explicit: Did **not** convert (target remains `TARGET.md` for later stations), did **not** test-gen/RECORD
8. `completeness: incomplete`
9. Next action: re-run this paste **or** bind more slices from Pack A radar

---

## Anti-patterns (refuse)

- Self-bind of Pack A candidates
- Phase A estate crawl disguised as deepen
- Writing modern TypeScript / SQL migrations / UI (that is Conversion later)
- Generating characterization suites or goldens
- Editing `ATU_SRC/**` or committing to `master`
- Merging ORD* because of shared `ORDER.PF`
- Claiming parity, verified, or "% documented complete"
