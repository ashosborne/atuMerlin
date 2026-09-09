DONE

# RESULT — CONVERT VAT vertical (atuMerlin) — atu-merlin-ts-vat-v1@1 — 2026-09-09
# Station: Convert · ROOM_OK honoured (body) · pack BOUND @ ad697f3 · WAIVED_PATHFINDER · PARITY=UNVERIFIED
# Branch: cursor/atu-merlin-estate-discovery · PR #1 to master updated by the runner · convert commit 02a9916
# Result paths:
#   modern/src/shared/fvat/index.ts         FVAT (VAT300) as shared module: getVatRate / getVatDesc / clcVat / existVatRate; clcVatWithRate; normaliseVatCode (1A contract)
#   modern/db/schema.sql                    VAT section APPENDED (vatdef mapping note + COMMENT ON); CUS and ORD objects byte-identical, vatdef not altered
#   modern/test/fvat.test.ts (27)           138/138 green (55 CUS, 56 ORD unchanged, 27 VAT), typecheck clean
#   modern/README.md                        VAT section: edit surface, mapping rules, card coverage c01-c10, SME open questions, CR-V1..CR-V4, known_risks table
#   architecture/atu-merlin-vat/CONVERT_RECORD.md
# Preserved planted defects / known_risks: VAT silent zero (c02), soft-deleted VATDEL still applied (c04), blank code never reads (c05); dead ART200 fields untouched (c03).
# Residual / not reproduced: last-key cache (c06, CR-V1 stateless); binder signature / BNDDIR / ACTGRP (c09, CR-V2).
# Not invented (needs-SME, open): unknown-code policy (c02), soft-delete semantics (c04), intra-day rate changes (c06), VATDEF maintenance path (c07) — no route, no screen, no seed of its own (fixture rows via ORD dev seed, CR-V4).
# No HTTP / OpenAPI surface (contract_paths empty); no features/vat/; app.ts / server.ts untouched. ORD callers reuse shared fvat unchanged (c08).
# Not touched: ATU_SRC/**, discovery/**, inventory/**, modern/src/features/customer/**, modern/src/features/order/**, both openapi files, modern/src/db/**, architecture/atu-merlin/**, architecture/atu-merlin-ord/**, architecture/atu-merlin-{dat,cou,par,log}/** — CUS/ORD never widened.
# Talk-track: VAT rule lives in TypeScript under waiver — not Merlin migrated.
# Next: Verification station for VAT (COMPARE at TS API, decide CR-V1..CR-V4); SME sign-off on discovery/vat-module/SME_BRIEF.md; then per header dat -> cou -> par -> log (each needs its own ROOM_OK in this body).

# CONVERT — VAT vertical (atuMerlin) — FIRE after Field+CTO Convert ROOM_OK
# Branch: cursor/atu-merlin-estate-discovery. Never master. Never ATU_SRC.
# ROOM_OK: convert VAT only (atu-merlin-ts-vat-v1@1 BOUND tip ad697f3 / pack at architecture/atu-merlin-vat/)
# Field + CTO Convert ROOM_OK 2026-09-09 (batch of five). Paste: PASTE-convert-vat-vertical-atu-merlin.md
# WAIVED_PATHFINDER — COMPARE at TypeScript API only. No IBM i goldens. No REPLAY_GREEN claim.
# edit_surface STRICT: never rewrite Customer/Order; modern/db/** + tests additive/pack-scoped; sibling architecture deny
# known_risks as-is — silent zero VAT etc. Never claim Merlin migrated.
# Next after DONE: dat → cou → par → log. Hold Pack B until Convert wave or idle gap.
# House style: never use pin / pinned / landed.

# PASTE — Convert VAT vertical (atuMerlin)

Use only after Architecture pack `atu-merlin-ts-vat-v1` is **BOUND** and the job body contains convert **ROOM_OK**.

## Hard gate

1. Read `architecture/atu-merlin-vat/PACK.yaml`. Refuse if status is not BOUND.
2. Refuse if job body does not contain ROOM_OK for convert.
3. Cite pack_id@version `atu-merlin-ts-vat-v1@1` in every commit and PR description.
4. Never edit ATU_SRC/**. Never push master directly. Open or update PR to master.
5. Honour edit_surface STRICTLY from BOUND pack:

   ALLOW only:

   - modern/src/shared/fvat/**
   - modern/db/** (additive VAT tables only — do not reshape CUS or ORD schema)
   - modern/test/** for vat/fvat only (pack-scoped)
   - modern/src/app.ts, modern/src/server.ts (additive wiring only)
   - modern/package.json, package-lock.json, tsconfig.json, vitest.config.ts, README.md, .gitignore, scripts/**
   - architecture/atu-merlin-vat/**

   DENY:

   - ATU_SRC/**, discovery/**, inventory/**, overnight/** (except stamp AGENT_JOB.md DONE)
   - modern/src/features/customer/**
   - modern/src/features/order/**
   - modern/openapi/customer.yaml
   - modern/openapi/order.yaml
   - architecture/atu-merlin/** (CUS pack)
   - architecture/atu-merlin-ord/**
   - architecture/atu-merlin-dat/**
   - architecture/atu-merlin-cou/**
   - architecture/atu-merlin-par/**
   - architecture/atu-merlin-log/**

6. Characterization WAIVED_PATHFINDER. No invent IBM i goldens. No claim REPLAY_GREEN against legacy.
7. Scope: vat-module only. Never widen or edit atu-merlin-ts-cus-v1 or atu-merlin-ts-ord-v1. Never rewrite customer or order features. No ART.

## Target (from BOUND pack)

- TypeScript modular monolith Node 20 + Fastify
- PostgreSQL for VATDEF and related PFs (additive)
- Prefer shared module under modern/src/shared/fvat/
- Feature surface under modern/src/features/vat/ only if Convert needs it and pack allows via shared path first
- OpenAPI not required by pack (contract_paths empty); prefer shared reuse by ORD/CUS callers
- Callers already under ORD/CUS must reuse shared fvat; do not rewrite those feature trees

## Inputs (read-only)

- architecture/atu-merlin-vat/PACK.yaml (BOUND)
- architecture/atu-merlin-vat/ADR/0001-vat-shared-fvat-ts-postgres.md
- discovery/vat-module/features/*.md
- discovery/vat-module/SME_BRIEF.md — open SME questions stay as-is; do not invent answers

## Work

1. Extend modern/src/shared/fvat for VAT helpers. Do not rewrite customer or order features.
2. Implement documented VAT behaviours from accepted cards only. Leave inferred/needs-SME stubbed with TODO citing card id.
3. Map PF→Postgres (VATDEF, …); LF→index/query. Prefer GetVATRate, GetVATDesc, ClcVAT, ExistVATRate as shared exports.
4. modern/db and modern/test are additive and pack-scoped only.
5. Preserve planted defects as-is/residual: VAT silent zero (c02), soft-deleted VATDEL still applied (c04), session-buffered rates (c06), VATDEF maintenance path unknown (c07), dead ART200 VATRATE/VATDESC (c03) — do not “fix”.
6. Do not invent SME answers for known_risks.
7. Add API tests at TypeScript boundary only.
8. Keep known_risks visible in modern/README.md (VAT section).

## Done

- Documented VAT behaviours present in TypeScript, or listed as residual.
- Talk-track: residual lives in TypeScript under waiver — not Merlin migrated.
- Tests pass for what you claimed.
- PR to master updated; description cites pack + WAIVED_PATHFINDER.
- Rewrite overnight/AGENT_JOB.md so line 1 is exactly DONE, with result paths.

## Refuse

- Convert while pack DRAFT
- Whole-estate convert / ART work
- Rewrite CUS under modern/src/features/customer/** or modern/openapi/customer.yaml
- Rewrite ORD under modern/src/features/order/** or modern/openapi/order.yaml
- Reshape CUS or ORD schema under modern/db/**
- Edit sibling architecture packs (CUS/ORD/DAT/COU/PAR/LOG)
- Silent overwrite of Discovery cards
- Claiming Merlin is fully migrated / claiming VAT is fully migrated
- Inventing SME answers or “fixing” planted defects
