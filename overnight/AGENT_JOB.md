RUN

# CONVERT — PAR vertical (atuMerlin) — FIRE after Field+CTO Convert ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: convert PAR only (atu-merlin-ts-par-v1@1 BOUND tip ad697f3)
# Field + CTO Convert ROOM_OK 2026-09-09 (batch of five). Paste: PASTE-convert-par-vertical-atu-merlin.md @ f2f7e6c
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. No IBM i goldens. No REPLAY_GREEN.
# Never rewrite CUS/ORD. Sibling architecture deny. known_risks as-is.
# After DONE: Convert log (needs its own ROOM_OK in this body). Then Verify per pack.
# Prior: Convert COU DONE at 418d5cf. Field landing AGENT_JOB after Smith Auto-review block.
# House style: never use pin / pinned / landed.

# PASTE — Convert PAR vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-par-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin-par/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if job body does not contain ROOM_OK for convert.
3. Cite pack_id@version `atu-merlin-ts-par-v1@1` in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Honour edit_surface STRICTLY from BOUND pack:

   ALLOW only:

   - modern/src/shared/parm/**
   - modern/src/features/par/**
   - modern/db/** (additive PAR tables only — do not reshape CUS or ORD schema)
   - modern/test/** for par only (pack-scoped)
   - modern/src/app.ts, modern/src/server.ts (additive wiring only)
   - modern/package.json, package-lock.json, tsconfig.json, vitest.config.ts, README.md, .gitignore, scripts/**
   - architecture/atu-merlin-par/**

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
   - architecture/atu-merlin-log/**

6. Characterization WAIVED_PATHFINDER. No invent IBM i goldens. No claim REPLAY_GREEN against legacy.
7. Scope: par-maintain only. PATH as config. Do not rewrite order. Never widen or edit atu-merlin-ts-cus-v1 or atu-merlin-ts-ord-v1. No ART.

## Target (from BOUND pack)

- TypeScript modular monolith Node 20 + Fastify
- Shared parm/PATH under modern/src/shared/parm/ and/or features/par
- PATH consumers such as ORD500 already converted — document interop as reuse of config
- Do not rewrite modern/src/features/order/**
- Prefer shared config module; HTTP maintain UI only if Convert needs it

## Inputs (read-only)

- architecture/atu-merlin-par/PACK.yaml (BOUND)
- architecture/atu-merlin-par/ADR/0001-par-maintain-ts-postgres.md
- discovery/par-maintain/features/*.md
- discovery/par-maintain/SME_BRIEF.md — open SME questions stay as-is; do not invent answers

## Work

1. Extend modern/src/shared/parm and/or modern/src/features/par. Do not rewrite order or customer features.
2. Implement documented PAR behaviours from accepted cards only. Leave inferred/needs-SME stubbed with TODO citing card id.
3. Map PF→Postgres or config (PARM / PATH). PATH as config vs maintained table (c11) — choose at convert; document choice; do not invent disposition.
4. Document PATH interop for ORD500 as config reuse. Do not rewrite ORD500 / order feature.
5. PATH trailing slash / filesystem semantics (c07) stay known_risk. Unused GetPARM getters — do not invent consumers.
6. modern/db and modern/test are additive and pack-scoped only.
7. Add API tests at TypeScript boundary only.
8. Keep known_risks visible in modern/README.md (PAR section).

## Done

- Documented PAR behaviours present in TypeScript, or listed as residual.
- Talk-track: residual lives in TypeScript under waiver — not Merlin migrated.
- Tests pass for what you claimed.
- PR to master updated; description cites pack + WAIVED_PATHFINDER.
- Rewrite overnight/AGENT_JOB.md so line 1 is exactly DONE, with result paths.

## Refuse

- Convert while pack DRAFT
- Whole-estate convert / ART work
- Rewrite order feature for PATH consumers (ORD500)
- Widen atu-merlin-ts-ord-v1 or atu-merlin-ts-cus-v1
- Rewrite CUS under modern/src/features/customer/** or modern/openapi/customer.yaml
- Rewrite ORD under modern/src/features/order/** or modern/openapi/order.yaml
- Reshape CUS or ORD schema under modern/db/**
- Edit sibling architecture packs (CUS/ORD/VAT/DAT/COU/LOG)
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated / claiming PAR is fully migrated
- Inventing SME answers or “fixing” planted defects
