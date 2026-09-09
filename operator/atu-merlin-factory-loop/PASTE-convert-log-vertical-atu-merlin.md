# PASTE — Convert LOG vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-log-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin-log/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if job body does not contain ROOM_OK for convert.
3. Cite pack_id@version `atu-merlin-ts-log-v1@1` in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Honour edit_surface STRICTLY from BOUND pack:

   ALLOW only:

   - modern/src/shared/samlog/**
   - modern/src/shared/logging/**
   - modern/db/** (additive / shared reuse only — do not reshape CUS or ORD schema non-additively)
   - modern/test/** for log/samlog only (pack-scoped)
   - modern/src/app.ts, modern/src/server.ts (additive wiring only)
   - modern/package.json, package-lock.json, tsconfig.json, vitest.config.ts, README.md, .gitignore, scripts/**
   - architecture/atu-merlin-log/**

   DENY:

   - ATU_SRC/**, discovery/**, inventory/**, overnight/** (except stamp AGENT_JOB.md DONE)
   - modern/src/features/customer/**
   - modern/src/features/order/**
   - modern/openapi/customer.yaml
   - modern/openapi/order.yaml
   - architecture/atu-merlin/** (CUS pack)
   - architecture/atu-merlin-ord/**
   - architecture/atu-merlin-vat/**
   - architecture/atu-merlin-dat/**
   - architecture/atu-merlin-cou/**
   - architecture/atu-merlin-par/**

6. Characterization WAIVED_PATHFINDER. No invent IBM i goldens. No claim REPLAY_GREEN against legacy.
7. Scope: log-programs only. Prefer align with existing samlog. Never widen ORD pack. Never rewrite order or customer features. No ART.

## Target (from BOUND pack)

- TypeScript modular monolith Node 20 + Fastify
- Shared logging under modern/src/shared/samlog/** and/or modern/src/shared/logging/**
- ORD already has samlog table — prefer align/reuse via shared logging without widening atu-merlin-ts-ord-v1
- Document residual vs reuse
- Prefer shared logging module; HTTP only if Convert needs it

## Inputs (read-only)

- architecture/atu-merlin-log/PACK.yaml (BOUND)
- architecture/atu-merlin-log/ADR/0001-log-programs-ts-postgres.md
- discovery/log-programs/features/*.md
- discovery/log-programs/SME_BRIEF.md — open SME questions stay as-is; do not invent answers

## Work

1. Extend modern/src/shared/samlog and/or modern/src/shared/logging. Do not rewrite order or customer features.
2. Implement documented LOG behaviours from accepted cards only. Leave inferred/needs-SME stubbed with TODO citing card id.
3. Prefer align with existing ORD samlog table. Extend shared helpers or document residual vs reuse. Do not widen atu-merlin-ts-ord-v1.
4. Capacity silent fail (c04) stays residual. Do not invent.
5. Whole-slice may be non-functional side effect — do not invent business value claims.
6. modern/db and modern/test are additive and pack-scoped only.
7. Add API tests at TypeScript boundary only.
8. Keep known_risks visible in modern/README.md (LOG section).

## Done

- Documented LOG behaviours present in TypeScript, or listed as residual.
- Talk-track: residual lives in TypeScript under waiver — not Merlin migrated.
- Tests pass for what you claimed.
- PR to master updated; description cites pack + WAIVED_PATHFINDER.
- Rewrite overnight/AGENT_JOB.md so line 1 is exactly DONE, with result paths.

## Refuse

- Convert while pack DRAFT
- Whole-estate convert / ART work
- Widen atu-merlin-ts-ord-v1 or atu-merlin-ts-cus-v1
- Rewrite order feature to re-own samlog
- Rewrite CUS under modern/src/features/customer/** or modern/openapi/customer.yaml
- Rewrite ORD under modern/src/features/order/** or modern/openapi/order.yaml
- Reshape CUS or ORD schema under modern/db/** non-additively
- Edit sibling architecture packs (CUS/ORD/VAT/DAT/COU/PAR)
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated / claiming LOG is fully migrated
- Inventing SME answers or “fixing” planted defects
