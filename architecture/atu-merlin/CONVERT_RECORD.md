# CONVERT record — CUS vertical (atuMerlin)

pack_id@version: `atu-merlin-ts-cus-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-08T16:06:38Z)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` (Field + CTO room), separate from BIND.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.**
Run: 2026-09-08 (Cloud Agent, atuMerlin factory job runner)

## Edit surface

- Written: `modern/**` (new), `architecture/atu-merlin/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `PACK.yaml`, `BIND.md`, ADR.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| DSPF -> web | `modern/src/features/customer/customer.web.ts` (CUS200D, CUS250D, CUS301D) |
| RPGLE -> TS service | `customer.service.ts` (CUS200 S02chk / S02act, CUS250 S01chk), `customer.routes.ts` |
| FCUSTOMER -> shared module | `modern/src/shared/fcustomer/` (CUS300 + CUS301) |
| PF -> postgres table | `modern/db/schema.sql` `customer` (+ `country` dependency table), `cusseq` sequence |
| LF -> index/query | `customer` PK = CUSTOME1; index `custome2 (custnm COLLATE "C", cuid)` = CUSTOME2 |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| cus-interactive-c01 | DONE | CONTRACT_RISK | CR-1 collation |
| cus-interactive-c02 | DONE | CONTRACT_RISK | CR-2 id drawn at save; CR-3 CUCREA |
| cus-interactive-c03 | DONE | CONTRACT_RISK | CR-4 404 on unknown id; CR-8 no record lock |
| cus-interactive-c04 | DONE (as-is) | — | UPD `dup > 1` preserved; needs-SME open |
| cus-interactive-c05 | DONE | — | via `country` dependency table (CR-9) |
| cus-interactive-c06 | BLOCKED | SCOPE_VIOLATION (by pack) | ORD200 is `stay_legacy`, `interop: none`; shown disabled |
| cus-interactive-c07 | DONE | CONTRACT_RISK | CR-6 invalid stored date -> null |
| cus-interactive-c08 | DONE (as-is) | — | CUMODID create-only preserved; needs-SME open |
| cus-interactive-c09 | DONE | — | |
| cus-interactive-c10 | DONE | — | |
| cus-interactive-c11 | DONE (as-is) | — | no DELETE route; needs-SME open |
| cus-interactive-c12 | residual | — | subfile option mechanics -> links |
| cus-modules-c01 | DONE | — | TS module, not exposed over HTTP |
| cus-modules-c02 | DONE | — | |
| cus-modules-c03 | DONE | — | |
| cus-modules-c04 | residual (miss semantics DONE) | CONTRACT_RISK | CR-8 no cache; needs-SME open |
| cus-modules-c05 | residual | — | nothing to close |
| cus-modules-c06 | DONE | — | `GET /api/customers/search`, `/customers/select` |
| cus-modules-c07 | residual | — | one link per row |
| cus-modules-c08 | residual | — | stateless form |
| cus-modules-c09 | DONE (changed by pack) | CONTRACT_RISK | CR-7 bound parameters (pack `forbidden`) |
| cus-modules-c10 | not implemented | — | needs-SME, no card |
| cus-modules-c11 | DONE | — | |

CONTRACT_RISK ids (CR-n) are defined in `modern/README.md`, "Deliberate deltas". Left open for Verification.

## Quality gates

Pack `quality_gates.commands` is empty; the pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here:

- `npm run typecheck` — clean
- `npm test` — 55 tests, 3 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`)
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Talk-track

Pathfinder CUS vertical on TypeScript + Fastify + Postgres, converted from Discovery cards under a
BOUND pack. Not Merlin migrated: ORD/ART/country maintenance remain on IBM i; no interop; SME
questions c04 / c08 / c11 stay open and are preserved as-is in the code.

## Follow-ups (not done here)

- Verification station: COMPARE at the TS API against whatever oracle the room accepts under the waiver.
- SME sign-off on `discovery/cus-interactive/SME_BRIEF.md` and `discovery/cus-modules/SME_BRIEF.md`.
- Pack B document conveyor run 4 (`ord-trigger-ord700`) was interrupted — re-fire after this job (per AGENT_JOB note).
