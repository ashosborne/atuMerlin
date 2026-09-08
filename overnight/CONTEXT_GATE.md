# CONTEXT_GATE — Pack A estate radar (atu-merlin)

Run: `discovery-phase-a` via `overnight/AGENT_JOB.md` (requested 2026-09-08T12:12:52Z by Migration Engineer)
Started: 2026-09-08T12:13Z (UTC)
Agent: estate-discovery-loop (Cloud Agent, automation job runner)

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `4be981575ba252f60909f939e2fe5e4ee97d50fd` ("Fire Pack A: AGENT_JOB discovery-phase-a") |
| Base / PR target | `master` (`db72c72`) |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start (re-checked before each iteration) |

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery (v0.2), Portfolio inventory (APP_MANIFEST), Experimental estate discovery loop, glossary
- `migration-factory/docs/OPERATOR-RUNBOOK.md`
- `migration-factory/prompts/estate-discovery-loop-v0.1.md`
- `migration-factory/prompts/discovery-agent-v0.2.md`
- `migration-factory/skills/operator/slice-scoping/SKILL.md`
- `migration-factory/schemas/app-manifest.schema.md` + `.json`
- `migration-factory/schemas/discovery-manifest.schema.md`
- `operator/atu-merlin-factory-loop/PASTE-estate-discovery-atu-merlin.md`, `CHARTER.yaml`, `SLICE_SEED_QUEUE.md`, `TRIGGER-CONTRACT.md`

Factory pack present at `migration-factory/` — no BLOCKED.

## Charter in force (Pack A)

`PHASE_B: false`, `AUTO_BIND: false`, `AUTO_ACCEPT: false`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`,
`MAX_ITERATIONS: 12`, `MAX_NEW_SEEDS_PER_ITER: 1`, `MAX_SLICES_PHASE_A: 12`, `STOP_WHEN_NO_NEW_SURFACES: 2`,
`ALLOWLIST_PATHS: ATU_SRC/**` (read-only), `WRITE_SCOPE: discovery/**, inventory/**, overnight/** (+ optional docs/estate/INDEX.md)`.

`ROOM_OK: false` in the job file — irrelevant for this station (no Architecture-bind / Convert attempted).

## Inventory state at start

- `inventory/atu-merlin/APP_MANIFEST.yaml` — did not exist; created as stub (`status: in_progress`, `completeness: incomplete`) at iter 0, then grown additively.
- `discovery/**` — did not exist.
- `docs/estate/INDEX.md` — did not exist; created as optional readability mirror.

## Schema note (honest)

`app-manifest.schema.json` surface `kind` enum is integration-flavoured (`http_listener`, `apikit`, `flow`, `vm_queue`, `scheduler`, `connector`, `other`).
IBM i surfaces (PGM, DSPF, CMD, CL, SRVPGM, trigger, PRTF) are recorded as `kind: other` with the IBM i object type in `notes`. No schema change made — flagged as an open decision for the Field Guide, not invented here.
