RUN

# CONVERT — DAT vertical (atuMerlin) — FIRE after Field+CTO Convert ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: convert DAT only (atu-merlin-ts-dat-v1@1 BOUND tip ad697f3 / pack at architecture/atu-merlin-dat/)
# Field + CTO Convert ROOM_OK 2026-09-09 (batch of five). Paste: PASTE-convert-dat-vertical-atu-merlin.md
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. Date lock matches ORD (NULL / sentinel at boundary).
# edit_surface STRICT: never rewrite Customer/Order; modern/db/** + tests additive/pack-scoped; sibling architecture deny
# known_risks as-is. Never claim Merlin migrated.
# Done: VAT Convert. Next after DONE: cou → par → log. Pack B held.
# House style: never use pin / pinned / landed.

# PASTE — Convert DAT vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-dat-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin-dat/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if job body does not contain ROOM_OK for convert.
3. Cite pack_id@version `atu-merlin-ts-dat-v1@1` in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Honour edit_surface STRICTLY from BOUND pack:

   ALLOW only:

   - modern/src/shared/dat/**
   - modern/src/features/dat/**
   - modern/db/** (additive DAT only — do not reshape CUS or ORD schema)
   - modern/test/** for dat only (pack-scoped)
   - modern/src/app.ts, modern/src/server.ts (additive wiring only)
   - modern/package.json, package-lock.json, tsconfig.json, vitest.config.ts, README.md, .gitignore, scripts/**
   - architecture/atu-merlin-dat/**

   DENY:

   - ATU_SRC/**, discovery/**, inventory/**, overnight/** (except stamp AGENT_JOB.md DONE)
   - modern/src/features/customer/**
   - modern/src/features/order/**
   - modern/openapi/customer.yaml
   - modern/openapi/order.yaml
   - architecture/atu-merlin/** (CUS pack)
   - architecture/atu-merlin-ord/**
   - architecture/atu-merlin-vat/**
   - architecture/atu-merlin-cou/**
   - architecture/atu-merlin-par/**
   - architecture/atu-merlin-log/**

6. Characterization WAIVED_PATHFINDER. No invent IBM i goldens. No claim REPLAY_GREEN against legacy.
7. Scope: dat-utils only. Never widen or edit atu-merlin-ts-cus-v1 or atu-merlin-ts-ord-v1. Never rewrite customer or order features. No ART.
8. Date lock MUST match ORD. Refuse any different blank/never sentinel.

## Target (from BOUND pack)

- TypeScript modular monolith Node 20 + Fastify
- Shared date helpers under modern/src/shared/dat/ (or features/dat if needed)
- Date lock matching ORD: store NULL in Postgres for blank/never; map IBM i 1940-01-01 / zero-date only at the boundary
- Do NOT invent a different sentinel
- Prefer shared helpers consumed by existing verticals; HTTP only if Convert needs it

## Inputs (read-only)

- architecture/atu-merlin-dat/PACK.yaml (BOUND)
- architecture/atu-merlin-dat/ADR/0001-dat-utils-ts-postgres.md
- discovery/dat-utils/features/*.md
- discovery/dat-utils/SME_BRIEF.md — open SME questions stay as-is; do not invent answers

## Work

1. Extend modern/src/shared/dat for date utilities. Do not rewrite customer or order features.
2. Implement documented DAT behaviours from accepted cards only. Leave inferred/needs-SME stubbed with TODO citing card id.
3. Enforce date lock matching ORD: NULL for blank/never; sentinel only at boundary. Do not store 1940-01-01 as a real date.
4. Preserve 99999999 branch (c01) as known_risk until SME names parity. Do not invent.
5. Dead ISO_Num_To_Date if QM queries unused (c03) stays residual.
6. modern/db and modern/test are additive and pack-scoped only.
7. Align with existing ORD/CUS date boundary rules without widening those packs.
8. Add API tests at TypeScript boundary only.
9. Keep known_risks visible in modern/README.md (DAT section).

## Done

- Documented DAT behaviours present in TypeScript, or listed as residual.
- Talk-track: residual lives in TypeScript under waiver — not Merlin migrated.
- Tests pass for what you claimed.
- PR to master updated; description cites pack + WAIVED_PATHFINDER.
- Rewrite overnight/AGENT_JOB.md so line 1 is exactly DONE, with result paths.

## Refuse

- Convert while pack DRAFT
- Whole-estate convert / ART work
- Inventing a different date sentinel than ORD
- Rewrite CUS under modern/src/features/customer/** or modern/openapi/customer.yaml
- Rewrite ORD under modern/src/features/order/** or modern/openapi/order.yaml
- Reshape CUS or ORD schema under modern/db/**
- Edit sibling architecture packs (CUS/ORD/VAT/COU/PAR/LOG)
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated / claiming DAT is fully migrated
- Inventing SME answers or “fixing” planted defects
