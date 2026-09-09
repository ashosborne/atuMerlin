RUN

# VERIFY — ORD vertical (atuMerlin) — FIRE after Field+CTO Verify ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: verification ORD vertical only (atu-merlin-ts-ord-v1@1 BOUND; Convert DONE tip 2684902)
# Field + CTO Verify ROOM_OK 2026-09-09. Paste: PASTE-verify-ord-vertical-atu-merlin.md @ tip (CR-O1..CR-O11)
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. No IBM i goldens. No REPLAY_GREEN. PARITY at most TS_BOUNDARY_GREEN / UNVERIFIED.
# Never rewrite CUS. Never reshape CUS schema. Never claim repo fully migrated.
# House style: never use pin / pinned / landed.

# PASTE — Verify ORD vertical (atuMerlin)

Use only after ORD convert is DONE under `modern/src/features/order/` and the room posts Verification ROOM_OK in `overnight/AGENT_JOB.md`.

## Hard gate

1. Read `architecture/atu-merlin-ord/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if the job body does not contain ROOM_OK for verification.
3. Cite pack_id@version `atu-merlin-ts-ord-v1@1` in every commit and PR description.
4. Never edit `ATU_SRC/**`. Never push master directly. Open or update PR to master.
5. Mode is COMPARE at the TypeScript API only. Characterization is WAIVED_PATHFINDER.
6. Do not invent IBM i goldens. Do not claim REPLAY_GREEN against legacy.
7. Do not claim PARITY=GREEN against IBM i. At most claim TS-boundary evidence under the waiver.
8. Scope ORD only (seven slices). CUS already verified under its own pack — do not re-verify CUS as this job claim. ART out of scope.
9. Honour Smith gate: if another Cloud Agent job is still RUN, stop and do not stamp a new job.
10. Never rewrite CUS under `modern/src/features/customer/**` or `modern/openapi/customer.yaml`. Do not reshape CUS schema.

## Inputs (read-only)

- `architecture/atu-merlin-ord/PACK.yaml` (BOUND)
- `architecture/atu-merlin-ord/CONVERT_RECORD.md` if present (else `modern/README.md` ORD section)
- `modern/README.md` (ORD card coverage + CONTRACT_RISK / known_risks)
- `modern/openapi/order.yaml`
- `modern/test/**` (order-related)
- `modern/src/features/order/**`
- `discovery/ord-entry-ord100/features/`
- `discovery/ord-entry-ord101/features/`
- `discovery/ord-maintain-ord200/features/`
- `discovery/ord-maintain-ord201/features/`
- `discovery/ord-maintain-ord202/features/`
- `discovery/ord-print-ord500/features/`
- `discovery/ord-trigger-ord700/features/`
## Work

1. Run typecheck and tests in modern. Record the summary.
2. COMPARE converted cards in README against OpenAPI order routes and tests. List gaps.
3. For each ORD CONTRACT_RISK CR-O1 through CR-O11 (and pack known_risks): mark accept-for-demo or defer in one sentence. Do not invent SME answers. Do not claim IBM i match.
4. Preserve planted defects as residual: ORD200 option-2 unreachable, ORDERCUS inner-join, VAT silent zero.
5. Write verification/ord-vertical/RUN_ID/PARITY.yaml and REPORT.md with WAIVED_PATHFINDER. Parity UNVERIFIED or TS_BOUNDARY_GREEN only if checks pass and gaps are explained. Never IBM i GREEN.
6. Do not rewrite Discovery cards except a clear harness bug that blocks COMPARE.

## Done
- PARITY.yaml and REPORT.md under verification/ord-vertical/
- Explicit accept/defer table for ORD risks
- PR updated; talk-track ORD under waiver not fully migrated
- AGENT_JOB line 1 DONE

## Refuse

- Verification while convert incomplete
- IBM i parity claims
- Whole-estate verification or ART
- Editing ATU_SRC
- Starting while AGENT_JOB is still RUN
- Claiming the repo is fully migrated
