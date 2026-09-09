DONE

# RESULT 2026-09-09 (run 2026-09-09-r1): parity TS_BOUNDARY_GREEN under WAIVED_PATHFINDER — not IBM i parity, not Merlin migrated.
# typecheck clean; 201/201 tests (63 DAT); independent probe 29/29 (130k sweep + 200k random; SQL twins via unnest).
# Date lock matches ORD (dat_date_to_iso_num == ORD701 inline to_char on 4384 dates; NULL inside, 0 / 1940-01-01 at boundary only).
# CR-D1 / CR-D2 / CR-D4 accept-for-demo; CR-D3 defer (CUS pack). G-D1 doc gap: README/CONVERT_RECORD c07 identity holds on {0} U valid dates only.
# Artefacts: verification/dat-vertical/2026-09-09-r1/{PARITY.yaml,REPORT.md,HANDOFF.yaml,evidence/,narrative/}. README status sentences updated.
# Next: Verify VAT if still open, then Convert cou -> par -> log (each needs its own ROOM_OK in this body).

# VERIFY — DAT utilities (atuMerlin) — FIRE after Field+CTO Verify ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: verification DAT only (atu-merlin-ts-dat-v1@1 BOUND; Convert DONE tip 5957461 / 03e8bc1)
# Field + CTO Verify ROOM_OK batch of five 2026-09-09. Paste: PASTE-verify-dat-vertical-atu-merlin.md @ 744ac29
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. No IBM i goldens. No REPLAY_GREEN. PARITY at most TS_BOUNDARY_GREEN / UNVERIFIED.
# Date lock must match ORD. Never rewrite CUS/ORD. Never claim Merlin migrated.
# After DONE: Verify VAT if still open, then Convert cou → par → log (or Verify then Convert per room).
# House style: never use pin / pinned / landed.

# PASTE — Verify DAT vertical (atuMerlin)

Use only after DAT convert is DONE under `modern/src/shared/dat/` (or pack-allowed `features/dat/`) and the room posts Verification ROOM_OK in `overnight/AGENT_JOB.md`.

## Hard gate

1. Read `architecture/atu-merlin-dat/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if the job body does not contain ROOM_OK for verification.
3. Cite pack_id@version `atu-merlin-ts-dat-v1@1` in every commit and PR description.
4. Never edit `ATU_SRC/**`. Never push master directly. Open or update PR to master.
5. Mode is COMPARE at the TypeScript API only. Characterization is WAIVED_PATHFINDER.
6. Do not invent IBM i goldens. Do not claim REPLAY_GREEN against legacy.
7. Do not claim PARITY=GREEN against IBM i. At most claim TS-boundary evidence under the waiver.
8. Scope DAT only (`dat-utils`). CUS and ORD stay under their own packs — do not re-verify or rewrite them as this job claim. ART out of scope.
9. Honour Smith gate: if another Cloud Agent job is still RUN, stop and do not stamp a new job.
10. Never rewrite CUS under `modern/src/features/customer/**` or `modern/openapi/customer.yaml`. Never rewrite ORD under `modern/src/features/order/**` or `modern/openapi/order.yaml`. Do not reshape CUS or ORD schema.
11. Sibling architecture deny: do not edit `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-vat/**`, `architecture/atu-merlin-cou/**`, `architecture/atu-merlin-par/**`, or `architecture/atu-merlin-log/**`.
12. `modern/db/**` and `modern/test/**` are additive and pack-scoped only — do not reshape CUS or ORD schema; tests only for this pack's surface.
13. Date lock MUST match ORD: NULL for blank/never; IBM i 1940-01-01 / zero-date only at the boundary. Refuse any different sentinel.

## Inputs (read-only)

- `architecture/atu-merlin-dat/PACK.yaml` (BOUND)
- `architecture/atu-merlin-dat/CONVERT_RECORD.md` if present (else `modern/README.md` DAT section)
- `modern/README.md` (DAT card coverage + CONTRACT_RISK / known_risks)
- `modern/src/shared/dat/**` and/or `modern/src/features/dat/**`
- `modern/test/**` (dat-related)
- `discovery/dat-utils/features/`

## Work

1. Run typecheck and tests in modern. Record the summary.
2. COMPARE converted cards in README against shared dat exports/tests (and any OpenAPI if Convert added it). List gaps.
3. For each DAT CONTRACT_RISK / pack known_risks (including date lock, 99999999 branch c01, dead ISO_Num_To_Date c03): mark accept-for-demo or defer in one sentence. Do not invent SME answers. Do not claim IBM i match.
4. Preserve planted / residual behaviours; do not invent a different date sentinel than ORD.
5. Write `verification/dat-vertical/<RUN_ID>/PARITY.yaml` and `REPORT.md` with WAIVED_PATHFINDER. Parity UNVERIFIED or TS_BOUNDARY_GREEN only if checks pass and gaps are explained. Never IBM i GREEN.
6. Do not rewrite Discovery cards except a clear harness bug that blocks COMPARE.

## Done

- PARITY.yaml and REPORT.md under `verification/dat-vertical/`
- Explicit accept/defer table for DAT risks
- PR updated; talk-track DAT residual under waiver — not Merlin migrated
- AGENT_JOB line 1 DONE

## Refuse

- Verification while convert incomplete
- IBM i parity claims
- Whole-estate verification or ART
- Editing ATU_SRC
- Starting while AGENT_JOB is still RUN
- Rewriting CUS/ORD features or OpenAPI
- Inventing a different date sentinel than ORD
- Claiming the repo is fully migrated
