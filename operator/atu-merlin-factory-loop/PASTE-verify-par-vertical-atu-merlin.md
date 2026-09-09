# PASTE — Verify PAR vertical (atuMerlin)

Use only after PAR convert is DONE under `modern/src/shared/parm/` and/or `modern/src/features/par/` and the room posts Verification ROOM_OK in `overnight/AGENT_JOB.md`.

## Hard gate

1. Read `architecture/atu-merlin-par/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if the job body does not contain ROOM_OK for verification.
3. Cite pack_id@version `atu-merlin-ts-par-v1@1` in every commit and PR description.
4. Never edit `ATU_SRC/**`. Never push master directly. Open or update PR to master.
5. Mode is COMPARE at the TypeScript API only. Characterization is WAIVED_PATHFINDER.
6. Do not invent IBM i goldens. Do not claim REPLAY_GREEN against legacy.
7. Do not claim PARITY=GREEN against IBM i. At most claim TS-boundary evidence under the waiver.
8. Scope PAR only (`par-maintain` / PATH as config). CUS and ORD stay under their own packs — do not rewrite order for PATH consumers (e.g. ORD500); document interop as config reuse. ART out of scope.
9. Honour Smith gate: if another Cloud Agent job is still RUN, stop and do not stamp a new job.
10. Never rewrite CUS under `modern/src/features/customer/**` or `modern/openapi/customer.yaml`. Never rewrite ORD under `modern/src/features/order/**` or `modern/openapi/order.yaml`. Do not reshape CUS or ORD schema.
11. Sibling architecture deny: do not edit `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-vat/**`, `architecture/atu-merlin-dat/**`, `architecture/atu-merlin-cou/**`, or `architecture/atu-merlin-log/**`.
12. `modern/db/**` and `modern/test/**` are additive and pack-scoped only — do not reshape CUS or ORD schema; tests only for this pack's surface.

## Inputs (read-only)

- `architecture/atu-merlin-par/PACK.yaml` (BOUND)
- `architecture/atu-merlin-par/CONVERT_RECORD.md` if present (else `modern/README.md` PAR section)
- `modern/README.md` (PAR card coverage + CONTRACT_RISK / known_risks)
- `modern/src/shared/parm/**` and/or `modern/src/features/par/**`
- `modern/test/**` (par-related)
- `discovery/par-maintain/features/`

## Work

1. Run typecheck and tests in modern. Record the summary.
2. COMPARE converted cards in README against parm/par exports/tests (and any OpenAPI if Convert added it). List gaps.
3. For each PAR CONTRACT_RISK / pack known_risks (PATH config vs table c11, PATH trailing slash c07, unused GetPARM getters): mark accept-for-demo or defer in one sentence. Do not invent SME answers. Do not claim IBM i match.
4. Preserve residuals; document PATH interop for ORD500 as config reuse without rewriting order.
5. Write `verification/par-vertical/<RUN_ID>/PARITY.yaml` and `REPORT.md` with WAIVED_PATHFINDER. Parity UNVERIFIED or TS_BOUNDARY_GREEN only if checks pass and gaps are explained. Never IBM i GREEN.
6. Do not rewrite Discovery cards except a clear harness bug that blocks COMPARE.

## Done

- PARITY.yaml and REPORT.md under `verification/par-vertical/`
- Explicit accept/defer table for PAR risks
- PR updated; talk-track PAR residual under waiver — not Merlin migrated
- AGENT_JOB line 1 DONE

## Refuse

- Verification while convert incomplete
- IBM i parity claims
- Whole-estate verification or ART
- Editing ATU_SRC
- Starting while AGENT_JOB is still RUN
- Rewriting CUS/ORD features or OpenAPI
- Claiming the repo is fully migrated
