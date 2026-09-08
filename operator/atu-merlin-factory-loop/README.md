# atuMerlin factory loop — operator pack

Paste-ready prompts for documenting slices of [ashosborne/atuMerlin](https://github.com/ashosborne/atuMerlin) (Arcad IBM i sample under `ATU_SRC/**`) using the migration-factory pack.

**Two packs — do not merge:**

| Pack | File | What it does | What it does *not* do |
| --- | --- | --- | --- |
| **A — Estate radar** | `PASTE-estate-discovery-atu-merlin.md` | Phase A candidates → APP_MANIFEST + COVERAGE | No bind, no Phase B cards, no tests, no convert |
| **B — Document conveyor** | `PASTE-document-slices-conveyor-atu-merlin.md` | Phase B behaviour cards for **human-accepted** slices (1 per run) | No radar re-hunt, no goldens/test-gen, no convert |

Target stack for **later** convert stations only: see `TARGET.md` (TypeScript modular monolith + PostgreSQL + simple web UI). **Not** used by Pack A/B to implement code.

Charter: `CHARTER.yaml`. Proposed seed order: `SLICE_SEED_QUEUE.md`.

Factory rules live in the pack (`FIELD-GUIDE`, `estate-discovery-loop`, `discovery-agent-v0.2`) — do not invent rules.

House style: never use pin / pinned / landed.

---

## Operator steps (Ash)

### (a) Add factory pack to an atuMerlin branch

1. Clone atuMerlin; default branch is `master`.
2. On a working branch (radar uses `cursor/atu-merlin-estate-discovery`), copy the migration-factory pack into `migration-factory/` if missing (from `/workspace/migration-factory` or `ashosborne/migration-factory` on main).
3. Never edit `ATU_SRC/**`. Never commit factory work to `master` directly — PR into `master`.

### (b) Run estate discovery once (Pack A)

1. Launch a Cloud Agent with **entire** contents of `PASTE-estate-discovery-atu-merlin.md`.
2. Branch: `cursor/atu-merlin-estate-discovery` → PR to `master`.
3. Expect: `inventory/atu-merlin/APP_MANIFEST.yaml`, regenerated `COVERAGE.md`, Phase A artefacts under `discovery/<SLICE_ID>/`, `overnight/MORNING_BRIEF.md` with banner **`PHASE A ONLY - UNBOUND CANDIDATES`**.
4. Optional readability mirror: `docs/estate/INDEX.md` (status from manifests — not a second factory SoT for accepts).

### (c) Human bind

1. Read MORNING_BRIEF + COVERAGE.
2. Bind accept / reject / defer via `record-bind` (do not skip this).
3. Only **accepted** SLICE_IDs feed Pack B.

### (d) Loop document-slices conveyor until brief says idle (Pack B)

1. Launch Cloud Agent with **entire** contents of `PASTE-document-slices-conveyor-atu-merlin.md`.
2. Branch: `factory/atu-merlin-document-slices`.
3. One accepted undocumenteds slice per run → behaviour cards → `documented` → COVERAGE refresh → stop.
4. Re-run until MORNING_BRIEF says no remaining accepted undocumenteds (still `completeness: incomplete` until you residual-gate).
5. Characterization stays **deferred/waived** (IBM i not runnable here). **No tests from this loop.**

### Later (not these pastes)

Architecture PACK → Conversion toward `TARGET.md` → Verification. Separate stations.

---

## Recommended first Cloud Agent launch

**Start with Pack A (estate discovery)** — you need candidates + APP_MANIFEST before bind + document conveyor.

Paste file: `PASTE-estate-discovery-atu-merlin.md`  
Repo: `https://github.com/ashosborne/atuMerlin`  
Branch to use: `cursor/atu-merlin-estate-discovery` off `master`

Only after bind, switch to `PASTE-document-slices-conveyor-atu-merlin.md`.
