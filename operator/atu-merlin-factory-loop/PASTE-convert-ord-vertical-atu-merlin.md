# PASTE — Convert ORD vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-ord-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin-ord/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if job body does not contain ROOM_OK for convert.
3. Cite pack_id@version `atu-merlin-ts-ord-v1@1` in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Honour edit_surface STRICTLY from BOUND pack:

   ALLOW only:

   - modern/src/features/order/**
   - modern/src/shared/** (reuse only)
   - modern/openapi/order.yaml
   - modern/db/** (additive ORD tables only — do not reshape CUS schema)
   - modern/test/** for order
   - modern/src/app.ts, modern/src/server.ts (additive wiring only)
   - modern/package.json, package-lock.json, tsconfig.json, vitest.config.ts, README.md, .gitignore, scripts/**
   - architecture/atu-merlin-ord/**

   DENY:

   - ATU_SRC/**, discovery/**, inventory/**, overnight/** (except stamp AGENT_JOB.md DONE)
   - modern/src/features/customer/**
   - modern/openapi/customer.yaml
   - architecture/atu-merlin/** (CUS pack)

6. Characterization WAIVED_PATHFINDER. No invent IBM i goldens. No claim REPLAY_GREEN against legacy.
7. Scope: the seven ORD slices only. Never widen or edit atu-merlin-ts-cus-v1. No ART. No rewrite/re-convert CUS.

## Target (from BOUND pack)

- TypeScript modular monolith Node 20 + Fastify
- PostgreSQL for ORDER/DETORD and related PFs
- Simple web UI off 5250
- OpenAPI at modern/openapi/order.yaml
- Layout under modern/src/features/order/
- May reuse shared modules under modern/src/shared/ (fcustomer/fcountry)
- Date lock: store NULL in Postgres for blank/never; map IBM i 1940-01-01 / zero-date only at the boundary

## Inputs (read-only)

- architecture/atu-merlin-ord/PACK.yaml (BOUND)
- architecture/atu-merlin-ord/ADR/0001-ord-vertical-ts-postgres.md
- discovery/ord-entry-ord100/features/*.md
- discovery/ord-entry-ord101/features/*.md
- discovery/ord-maintain-ord200/features/*.md
- discovery/ord-maintain-ord201/features/*.md
- discovery/ord-maintain-ord202/features/*.md
- discovery/ord-print-ord500/features/*.md
- discovery/ord-trigger-ord700/features/*.md
- SME_BRIEFs for those slices — open SME questions stay as-is; do not invent answers

## Work

1. Extend modern/ for order feature (do not rewrite customer feature).
2. Implement documented ORD behaviours from accepted cards only. Leave inferred/needs-SME stubbed with TODO citing card id.
3. Map PF→Postgres (ORDER, DETORD, …); LF→index/query; DSPF→web+HTTP; PRTF/spool→printable artifact/PDF endpoint only within documented scope (PDF scope via c04 is needs-SME — do not invent).
4. Date mapping: NULL for blank/never; sentinel only at boundary.
5. ORD700/701: choose app-level side effects or Postgres triggers; document the choice in README.
6. Preserve planted defects as-is/residual: ORD200 option-2 unreachable, ORDERCUS inner-join, VAT silent zero — do not “fix”.
7. Do not invent ORD200/201 SoT twin; sticky option 3 + c03/c04 stay residual/needs-SME.
8. Do not invent answers for option-5 not-found %date, description-until-F11, print not-found option 6, 5-char PDF name truncate, sync print on confirm.
9. Add API tests at TypeScript boundary only.
10. Keep known_risks visible in modern/README.md (ORD section).

## Done

- Documented ORD behaviours present in TypeScript, or listed as residual.
- Tests pass for what you claimed.
- PR to master updated; description cites pack + WAIVED_PATHFINDER.
- Rewrite overnight/AGENT_JOB.md so line 1 is exactly DONE, with result paths.

## Refuse

- Convert while pack DRAFT
- Whole-estate convert / ART work
- Rewrite CUS under modern/src/features/customer/** or modern/openapi/customer.yaml
- Reshape CUS schema under modern/db/**
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated / claiming ORD is fully migrated
- Inventing SME answers or “fixing” planted defects
