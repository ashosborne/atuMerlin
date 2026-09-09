DONE

# RESULT — CONVERT DAT utilities (atuMerlin) — atu-merlin-ts-dat-v1@1 — 2026-09-09
# Station: Convert · ROOM_OK honoured (body) · pack BOUND @ ad697f3 · WAIVED_PATHFINDER · PARITY=UNVERIFIED
# Branch: cursor/atu-merlin-estate-discovery · PR #1 to master updated by the runner · convert commit 03e8bc1
# Result paths:
#   modern/src/shared/dat/index.ts          DAT001 / DAT002 as shared module: isoToDate40 (c01 as-is), isoNumToDate (c02), testIsoNum, DatArgumentError 38I02 (c05); date lock matching ORD: fromLegacyIsoNum / toLegacyIsoNum (0 <-> null), fromLegacySentinelDate / toLegacySentinelDate (1940-01-01 <-> null); LEGACY_LOVAL_DATE single sentinel definition (c07)
#   modern/db/schema.sql                    DAT section APPENDED: dat_iso_num_to_date(integer) STRICT IMMUTABLE, dat_date_to_iso_num(date) IMMUTABLE; no table; CUS / ORD / VAT objects byte-identical
#   modern/test/dat.test.ts (63)            201/201 green (55 CUS, 56 ORD, 27 VAT unchanged, 63 DAT incl. 3 SQL), typecheck clean
#   modern/README.md                        DAT section: edit surface, mapping rules, card coverage c01-c08, SME open questions, CR-D1..CR-D4, known_risks table
#   architecture/atu-merlin-dat/CONVERT_RECORD.md
# Date lock: NULL inside, 0 / 1940-01-01 only at the boundary — same rule as ORD (ORD701 expression equivalence tested) and CUS (lastOrderDateOf agreement tested read-only); no sentinel stored; no other sentinel invented.
# Preserved known_risks (as-is): 99999999 -> 2039-12-31 branch in isoToDate40 (c01, not a "never" in the lock); ISO_Num_To_Date carried as one function, no SQL name created (c02/c03 dead-or-not open); 38I02 is an error class, not a NULL row (c05).
# Residual: c03 callers (modern ORD lists read date NULL columns, no UDF; list-truncation defect has no path, CR-D2); c04 indicators / names / *LIBL / FENCED (CR-D1).
# FINDING for the CUS pack (not fixed — features/customer/** deny): lastOrderDateOf returns null for CULASTORD years 0001-0099 (Date.UTC reads year 1 as 1901) where test(de) *iso accepts them — CR-D3, out of any business window; decide at the next CUS pack version.
# No HTTP / OpenAPI surface (contract_paths empty); no features/dat/; app.ts / server.ts untouched. Nothing consumes the module yet (CUS / ORD copies of the lock stay; adopting it is their pack version bump).
# Not touched: ATU_SRC/**, discovery/**, inventory/**, modern/src/features/customer/**, modern/src/features/order/**, both openapi files, modern/src/db/**, architecture/atu-merlin/**, architecture/atu-merlin-ord/**, architecture/atu-merlin-{vat,cou,par,log}/** — CUS/ORD/VAT never widened.
# Talk-track: DAT date rule lives in TypeScript under waiver — not Merlin migrated.
# Next: Verification station for DAT (COMPARE at TS API, decide CR-D1..CR-D4); SME sign-off on discovery/dat-utils/SME_BRIEF.md; then per header cou -> par -> log (each needs its own ROOM_OK in this body). Pack B night-residual queue still held.


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
