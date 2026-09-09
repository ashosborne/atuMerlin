# PASTE — Convert CUS vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-cus-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin/PACK.yaml`. Refuse if `status` is not `BOUND`.
2. Refuse if the job body does not contain `ROOM_OK` for convert.
3. Cite `pack_id@version` (`atu-merlin-ts-cus-v1@1`) in every commit and PR description.
4. Never edit `ATU_SRC/**`. Never push `master` directly. Open or update PR to `master`.
5. Honour `edit_surface`: allow only `modern/**` and notes under `architecture/atu-merlin/**`. Deny rewrites of `discovery/**`, `inventory/**`, `overnight/**` (except stamp `AGENT_JOB.md` DONE).
6. Characterization is **WAIVED_PATHFINDER**. Do not invent IBM i / COBOL / RPG goldens. Do not claim `REPLAY_GREEN` against legacy.
7. ORD and ART are out of scope. CUS only (`cus-interactive` + `cus-modules`).

## Target (from BOUND pack)

- TypeScript modular monolith on Node 20 + Fastify
- PostgreSQL for CUSTOMER and related PFs
- Simple web UI off 5250
- OpenAPI at `modern/openapi/customer.yaml`
- Layout under `modern/features/customer/`

## Inputs (read-only)

- `architecture/atu-merlin/PACK.yaml` (BOUND)
- `architecture/atu-merlin/ADR/0001-cus-vertical-ts-postgres.md`
- `discovery/cus-interactive/features/*.md`
- `discovery/cus-modules/features/*.md`
- `discovery/cus-interactive/SME_BRIEF.md` (open SME questions stay as-is; do not invent answers)

## Work

1. Scaffold `modern/` if missing (Fastify app, Postgres access, test script).
2. Implement customer behaviours from accepted documented cards only. Leave inferred / needs-SME items unimplemented or stubbed with TODO citing the card id.
3. Map PF to Postgres tables; LF to indexes or queries; FCUSTOMER to a shared module; DSPF to web form plus HTTP routes.
4. Add API tests and fixtures at the TypeScript boundary only. No fake ATU_SRC execution.
5. Keep SME open questions (`c04`, `c08`, `c11`) visible in `modern/README.md`. Do not invent target intent.

## Done

- Documented CUS behaviours are present in TypeScript, or listed as residual.
- Tests named in the pack quality gates pass for what you claimed.
- PR to `master` is updated. Description cites pack and WAIVED_PATHFINDER.
- Rewrite `overnight/AGENT_JOB.md` so line 1 is exactly `DONE`, with result paths.

## Refuse

- Convert while pack is DRAFT
- Whole-estate convert
- ORD or ART work under this job
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated
