# CONVERT record — VAT vertical (atuMerlin)

pack_id@version: `atu-merlin-ts-vat-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded; BOUND tip ad697f3)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` body (Field + CTO Convert ROOM_OK 2026-09-09, batch of five), separate from BIND. Paste: `PASTE-convert-vat-vertical-atu-merlin.md`.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.** No IBM i goldens, no `REPLAY_GREEN` claim, `replay_green_run_ids: []` stays empty.
Run: 2026-09-09 (Cloud Agent, atuMerlin factory job runner)

Talk-track: **the VAT rule lives in TypeScript under the waiver — the repo is not fully migrated, and VAT is not fully migrated.**

## Hard gate (checked before any edit)

- `PACK.yaml` `status: BOUND` — yes.
- Job body contains convert `ROOM_OK` — yes (`overnight/AGENT_JOB.md` line 4).
- Sole runner — one automation run active at start (`list-cloud-agents`), branch head = trigger head `fda5292`.
- Scope: `vat-module` only. CUS / ORD packs not widened; ART not touched.

## Edit surface (STRICT, from the BOUND pack)

- Written (allow): `modern/src/shared/fvat/index.ts` (extended in place; the `FVat.getVatRate` / `FVat.clcVat` shape ORD consumes is unchanged, `getVatDesc` / `existVatRate` / `normaliseVatCode` added), `modern/db/schema.sql` (VAT section **appended** — CUS and ORD objects above it byte-identical; `vatdef` not altered, `COMMENT ON` only), `modern/test/fvat.test.ts` (new, pack-scoped), `modern/package.json` (description), `modern/README.md` (VAT section + header/layout lines), `architecture/atu-merlin-vat/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Not needed (allow, untouched): `modern/src/app.ts`, `modern/src/server.ts` — no HTTP surface is added (`contract_paths: []`; the legacy exposes VAT only through its callers, and ORD already reuses the shared module). `modern/src/features/vat/` not created.
- Untouched (deny): `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `modern/src/features/customer/**`, `modern/src/features/order/**`, `modern/openapi/customer.yaml`, `modern/openapi/order.yaml`, `modern/src/db/**`, `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-{dat,cou,par,log}/**`, this pack's `PACK.yaml`, `BIND.md`, ADR 0001.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| RPGLE service program FVAT -> TS shared module | `modern/src/shared/fvat/index.ts` — `createFVat(db)` with the four binder exports (`GetVATRate`, `GetVATDesc`, `ClcVAT`, `ExistVATRate` -> `getVatRate`, `getVatDesc`, `clcVat`, `existVatRate`); `clcVatWithRate` pure arithmetic; `normaliseVatCode` = the `1A` by-value parameter |
| PF VATDEF -> postgres table (additive) | `vatdef` already present (ORD dependency), column-for-column from `VATDEF.PF`; VAT pack documents the mapping and adds table/column comments, alters nothing |
| LF -> index/query | no logical file over `VATDEF` in `ATU_SRC` (`QDDSSRC` holds `VATDEF.PF` only); PK on `vatcode` = `K VATCODE` |
| Callers reuse shared fvat | `modern/src/features/order/order.service.ts` (unchanged) already calls `fvat.clcVat` then `fvat.getVatRate` per line (c08) |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| vat-module-c01 | DONE | — | `(net * rate) / 100` half-adjusted to 2 dp in integer hundredths; VAT amount, not gross; grid incl. ties, negatives, extremes |
| vat-module-c02 | DONE (as-is) | — | **planted defect preserved**: unknown code -> cleared buffer -> 0 / blank / 0, no message |
| vat-module-c03 | DONE | — | both getters exported; ART200 dead fields not wired (ART scope) |
| vat-module-c04 | DONE (as-is) | — | `existVatRate` = found and `vatdel <> 'X'`; ClcVAT / getters still apply a soft-deleted rate |
| vat-module-c05 | DONE / residual | CONTRACT_RISK | blank code never reads (kept); lazy open / close / cache have no equivalent (CR-V1) |
| vat-module-c06 | residual | CONTRACT_RISK | CR-V1 no last-key cache — changed row seen at once; tested as the delta |
| vat-module-c07 | as-is / needs-SME | CONTRACT_RISK | no maintenance path built; `TODO(vat-module-c07)`; fixture rows via ORD dev seed (CR-V4) |
| vat-module-c08 | DONE (ORD) / residual (ART) | — | ORD paths reuse shared fvat unchanged; ART250 stay_legacy |
| vat-module-c09 | DONE / n/a | CONTRACT_RISK | four exports as four methods; `'V1'` / BNDDIR / ACTGRP have no TS equivalent (CR-V2) |
| vat-module-c10 | DONE | CONTRACT_RISK | contract `ClcVAT(char(1), decimal(9,2)) -> decimal(9,2)`; `normaliseVatCode` (CR-V3) |

CONTRACT_RISK ids (CR-Vn) are defined in `modern/README.md`, VAT section, "Deliberate deltas". Left open for Verification.

## Planted defects / known_risks — preserved, not fixed

- VAT silent zero (c02) — `CLEARED` buffer path in `createFVat`.
- Soft-deleted `VATDEL = 'X'` still applied (c04).
- Blank code never reads `VATDEF` (c05).
- Session-buffered rates (c06) — not reproducible on a stateless server; recorded as CR-V1, not "fixed".
- VATDEF maintenance path unknown (c07) — nothing invented.
- Dead ART200 `VATRATE` / `VATDESC` / `WITHVAT` fields (c03) — ART scope, untouched.

## Quality gates

Pack `quality_gates.commands` is empty; pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here:

- `npm run typecheck` — clean
- `npm test` — 138 tests, 6 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`): 55 CUS (unchanged), 56 ORD (unchanged — confirms the extended `FVat` did not move the ORD callers), 27 VAT (`test/fvat.test.ts`, new)
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Follow-ups (not done here)

- Verification station for VAT: COMPARE at the TS API under the waiver; decide CR-V1 … CR-V4.
- SME sign-off on `discovery/vat-module/SME_BRIEF.md`: unknown-code policy (c02), soft-delete semantics (c04), intra-day rate changes (c06), VATDEF maintenance (c07).
- If the room wants a VATDEF maintenance surface or an HTTP contract for VAT: needs a pack version bump + SUPERSEDE + re-bind (new `contract_paths`, possibly `features/vat/`).
- Next Convert per the job header: dat -> cou -> par -> log (each needs its own ROOM_OK in the job body).
