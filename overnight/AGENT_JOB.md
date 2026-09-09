RUN

# CONVERT — COU vertical FCOUNTRY half (atuMerlin) — FIRE after Field+CTO Convert ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: convert COU FCOUNTRY / COU300 / COU301 only (atu-merlin-ts-cou-v1@1 BOUND tip ad697f3)
# Field + CTO Convert ROOM_OK 2026-09-09 (batch of five). Paste: PASTE-convert-cou-vertical-atu-merlin.md @ f2f7e6c
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. No IBM i goldens. No REPLAY_GREEN.
# Scope: FCOUNTRY half ONLY. Refuse COU200 invent. Never rewrite CUS/ORD. Sibling architecture deny.
# After DONE: Convert par → log (each needs its own ROOM_OK in this body). Then Verify per pack.
# Prior: Verify VAT DONE at 90d5e27. Field landing AGENT_JOB after Smith Auto-review block.
# House style: never use pin / pinned / landed.

# PASTE — Convert COU vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-cou-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin-cou/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if job body does not contain ROOM_OK for convert.
3. Cite pack_id@version `atu-merlin-ts-cou-v1@1` in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Honour edit_surface STRICTLY from BOUND pack:

   ALLOW only:

   - modern/src/shared/fcountry/**
   - modern/db/** (additive COU tables only — do not reshape CUS or ORD schema)
   - modern/test/** for cou/fcountry only (pack-scoped)
   - modern/src/app.ts, modern/src/server.ts (additive wiring only)
   - modern/package.json, package-lock.json, tsconfig.json, vitest.config.ts, README.md, .gitignore, scripts/**
   - architecture/atu-merlin-cou/**

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
   - architecture/atu-merlin-par/**
   - architecture/atu-merlin-log/**

6. Characterization WAIVED_PATHFINDER. No invent IBM i goldens. No claim REPLAY_GREEN against legacy.
7. Scope: cou-maintain FCOUNTRY / COU300 / COU301 ONLY. Refuse COU200 until Pack B cards it and pack is SUPERSEDEd. May extend shared/fcountry without rewriting customer. Never widen CUS or ORD packs. No ART.

## Target (from BOUND pack)

- TypeScript modular monolith Node 20 + Fastify
- Extend existing shared/fcountry (CUS dependency surface)
- GetCountryName, GetCountryIso3, ExistCountry, SltCountry as documented
- COUNTRY / COUNTR1 additive under modern/db/**
- Prefer shared module reuse; HTTP only if Convert needs it
- COU200 panel half stay_legacy / deferred — do not invent presentation

## Inputs (read-only)

- architecture/atu-merlin-cou/PACK.yaml (BOUND)
- architecture/atu-merlin-cou/ADR/0001-cou-fcountry-ts-postgres.md
- discovery/cou-maintain/features/*.md (FCOUNTRY/COU300/COU301 cards only)
- discovery/cou-maintain/SME_BRIEF.md — open SME questions stay as-is; do not invent answers

## Work

1. Extend modern/src/shared/fcountry. Do not rewrite modern/src/features/customer/**.
2. Implement documented FCOUNTRY/COU300/COU301 behaviours from accepted cards only. Leave inferred/needs-SME stubbed with TODO citing card id.
3. Map PF→Postgres (COUNTRY, …); LF→index/query; DSPF COU301D→web selector only if Convert includes SltCountry UI.
4. Refuse COU200 panel conversion. Do not invent COU200 presentation.
5. GetCountryIso3 unused export (c08) — do not invent consumer or dispose COISO without SME.
6. COU301 selector open questions (empty position message, F8 position retention) stay needs-SME.
7. modern/db and modern/test are additive and pack-scoped only.
8. Add API tests at TypeScript boundary only.
9. Keep known_risks visible in modern/README.md (COU section).

## Done

- Documented COU (FCOUNTRY/COU300/COU301) behaviours present in TypeScript, or listed as residual.
- Talk-track: residual lives in TypeScript under waiver — not Merlin migrated.
- Tests pass for what you claimed.
- PR to master updated; description cites pack + WAIVED_PATHFINDER.
- Rewrite overnight/AGENT_JOB.md so line 1 is exactly DONE, with result paths.

## Refuse

- Convert while pack DRAFT
- COU200 panel convert until pack SUPERSEDEd after Pack B cards it
- Inventing COU200 presentation
- Whole-estate convert / ART work
- Rewrite CUS under modern/src/features/customer/** or modern/openapi/customer.yaml
- Rewrite ORD under modern/src/features/order/** or modern/openapi/order.yaml
- Reshape CUS or ORD schema under modern/db/**
- Edit sibling architecture packs (CUS/ORD/VAT/DAT/PAR/LOG)
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated / claiming COU is fully migrated
- Inventing SME answers or “fixing” planted defects
