DONE

# RESULT 2026-09-08 — verify CUS vertical under atu-merlin-ts-cus-v1@1 (WAIVED_PATHFINDER, parity: TS_BOUNDARY_GREEN — not IBM i parity)
# - verification/cus-vertical/2026-09-08-r1/PARITY.yaml           rollup + per-card status; parity_green/legacy_green stay false
# - verification/cus-vertical/2026-09-08-r1/REPORT.md             gates, commands, card COMPARE, gaps G-1..G-3, CR-1..CR-9 table (7 accept-for-demo, 2 defer: CR-6, CR-8)
# - verification/cus-vertical/2026-09-08-r1/HANDOFF.yaml          inputs, oracle (cards + OpenAPI, no goldens), conversion commits
# - verification/cus-vertical/2026-09-08-r1/evidence/             typecheck-and-vitest.log (55/55), probe.mjs + results.json (31/31 live HTTP cases)
# - verification/cus-vertical/2026-09-08-r1/narrative/HOW_IT_WORKS.md
# - modern/README.md                                              status line now points at PARITY.yaml
# Talk-track: CUS pathfinder verified at TS API under waiver — not Merlin migrated. Follow-ups: OpenAPI doc gaps G-1..G-3; room decides CR-6, CR-8.

# VERIFY — CUS vertical (atuMerlin) — FIRE after Field+CTO Verification ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: verification CUS vertical only (COMPARE at TypeScript API)
# Pack: atu-merlin-ts-cus-v1@1 BOUND
# WAIVED_PATHFINDER — no IBM i / COBOL goldens; no REPLAY_GREEN against legacy; no PARITY=GREEN vs IBM i
# Accept or defer CR-1..CR-9 explicitly in REPORT.md
# Talk-track: CUS pathfinder verified at TS API under waiver — not Merlin migrated
# AGENT_JOB was idle (DONE) before this fire. Honour: do not start overlapping jobs.
# House style: never use pin / pinned / landed.

# PASTE — Verify CUS vertical (atuMerlin)

Use only after CUS convert is DONE under modern/ and the room posts Verification ROOM_OK in overnight/AGENT_JOB.md.

## Hard gate
1. Read architecture/atu-merlin/PACK.yaml. Refuse if status is not BOUND.
2. Refuse if the job body does not contain ROOM_OK for verification.
3. Cite pack_id@version atu-merlin-ts-cus-v1@1 in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Mode is COMPARE at the TypeScript API only. Characterization is WAIVED_PATHFINDER.
6. Do not invent IBM i / COBOL / RPG goldens. Do not claim REPLAY_GREEN against legacy.
7. Do not claim PARITY=GREEN against IBM i. At most claim TS-boundary evidence under the waiver.
8. ORD and ART stay out of scope. CUS only.
9. Honour Smith gate: if another Cloud Agent job is still RUN, stop and do not stamp a new job.

## Inputs (read-only)
- architecture/atu-merlin/PACK.yaml (BOUND)
- architecture/atu-merlin/CONVERT_RECORD.md
- modern/README.md (card coverage + CONTRACT_RISK CR-1 to CR-9)
- modern/openapi/customer.yaml
- modern/test/**
- discovery/cus-interactive/features/ and discovery/cus-modules/features/ (read-only)

## Work
1. Run cd modern && npm run typecheck && npm test against live Postgres. Record output summary.
2. COMPARE converted/as-is cards in README against OpenAPI routes and tests. List gaps.
3. For each CONTRACT_RISK CR-1 to CR-9: mark accept-for-demo or defer with one sentence. Do not claim IBM i match.
4. Write verification/cus-vertical/<RUN_ID>/PARITY.yaml and REPORT.md with characterization WAIVED_PATHFINDER; parity UNVERIFIED or TS_BOUNDARY_GREEN only if typecheck+tests pass and no unexplained card gaps; never parity GREEN against IBM i.
5. Do not rewrite Discovery cards except clear harness bug that blocks COMPARE.

## Done
- PARITY.yaml + REPORT.md on branch
- Explicit CR-1..CR-9 accept/defer table
- PR updated; talk-track CUS pathfinder verified at TS API under waiver — not Merlin migrated
- AGENT_JOB line 1 DONE

## Refuse
- Verification while convert incomplete
- IBM i parity claims
- Whole-estate verification
- Editing ATU_SRC
- Starting while AGENT_JOB is still RUN
