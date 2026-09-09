RUN

# VERIFY — VAT vertical (atuMerlin) — FIRE after Field+CTO Verify ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: verification VAT only (atu-merlin-ts-vat-v1@1 BOUND; Convert DONE tip b6d3af0 / 02a9916)
# Field + CTO Verify ROOM_OK batch of five 2026-09-09. Paste: PASTE-verify-vat-vertical-atu-merlin.md @ 744ac29
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. No IBM i goldens. No REPLAY_GREEN. PARITY at most TS_BOUNDARY_GREEN / UNVERIFIED.
# Never rewrite CUS/ORD. Never claim Merlin migrated.
# After DONE: Convert cou → par → log (each needs its own ROOM_OK in this body).
# Prior: Verify DAT DONE at 81d0763. Field landing AGENT_JOB after Smith Auto-review block.
# House style: never use pin / pinned / landed.

# PASTE — Verify VAT vertical (atuMerlin)

Use only after VAT convert is DONE under `modern/src/shared/fvat/` and the room posts Verification ROOM_OK in `overnight/AGENT_JOB.md`.

## Hard gate

1. Read `architecture/atu-merlin-vat/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if the job body does not contain ROOM_OK for verification.
3. Cite pack_id@version `atu-merlin-ts-vat-v1@1` in every commit and PR description.
4. Never edit `ATU_SRC/**`. Never push master directly. Open or update PR to master.
5. Mode is COMPARE at the TypeScript API only. Characterization is WAIVED_PATHFINDER.
6. Do not invent IBM i goldens. Do not claim REPLAY_GREEN against legacy.
7. Do not claim PARITY=GREEN against IBM i. At most claim TS-boundary evidence under the waiver.
8. Scope VAT only (`vat-module` / shared `fvat`). CUS and ORD already verified or owned under their own packs — do not re-verify or rewrite them as this job claim. ART out of scope.
9. Honour Smith gate: if another Cloud Agent job is still RUN, stop and do not stamp a new job.
10. Never rewrite CUS under `modern/src/features/customer/**` or `modern/openapi/customer.yaml`. Never rewrite ORD under `modern/src/features/order/**` or `modern/openapi/order.yaml`. Do not reshape CUS or ORD schema.
11. Sibling architecture deny: do not edit `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-dat/**`, `architecture/atu-merlin-cou/**`, `architecture/atu-merlin-par/**`, or `architecture/atu-merlin-log/**`.
12. `modern/db/**` and `modern/test/**` are additive and pack-scoped only — do not reshape CUS or ORD schema; tests only for this pack's surface.

## Inputs (read-only)

- `architecture/atu-merlin-vat/PACK.yaml` (BOUND)
- `architecture/atu-merlin-vat/CONVERT_RECORD.md` if present (else `modern/README.md` VAT section)
- `modern/README.md` (VAT card coverage + CONTRACT_RISK CR-V1..CR-V4 / known_risks)
- `modern/src/shared/fvat/**`
- `modern/test/**` (vat/fvat-related)
- `discovery/vat-module/features/`

## Work

1. Run typecheck and tests in modern. Record the summary.
2. COMPARE converted cards in README against shared fvat exports/tests (and any OpenAPI if Convert added it). List gaps.
3. For each VAT CONTRACT_RISK CR-V1 through CR-V4 (and pack known_risks): mark accept-for-demo or defer in one sentence. Do not invent SME answers. Do not claim IBM i match.
4. Preserve planted defects as residual: silent zero for unknown VAT (c02), soft-deleted VATDEL still applied (c04), session-buffered rates (c06) as CR-V1 delta, dead ART200 VATRATE/VATDESC (c03).
5. Write `verification/vat-vertical/<RUN_ID>/PARITY.yaml` and `REPORT.md` with WAIVED_PATHFINDER. Parity UNVERIFIED or TS_BOUNDARY_GREEN only if checks pass and gaps are explained. Never IBM i GREEN.
6. Do not rewrite Discovery cards except a clear harness bug that blocks COMPARE.

## Done

- PARITY.yaml and REPORT.md under `verification/vat-vertical/`
- Explicit accept/defer table for VAT risks
- PR updated; talk-track VAT residual under waiver — not Merlin migrated
- AGENT_JOB line 1 DONE

## Refuse

- Verification while convert incomplete
- IBM i parity claims
- Whole-estate verification or ART
- Editing ATU_SRC
- Starting while AGENT_JOB is still RUN
- Rewriting CUS/ORD features or OpenAPI
- Claiming the repo is fully migrated
