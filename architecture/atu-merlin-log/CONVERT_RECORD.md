# CONVERT record — LOG vertical (atuMerlin)

pack_id@version: `atu-merlin-ts-log-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded; BOUND tip ad697f3)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` body (Field + CTO Convert ROOM_OK 2026-09-09, batch of five), separate from BIND. Paste: `PASTE-convert-log-vertical-atu-merlin.md` @ f2f7e6c.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.** No IBM i goldens, no `REPLAY_GREEN` claim, `replay_green_run_ids: []` stays empty.
Run: 2026-09-09 (Cloud Agent, atuMerlin factory job runner, RUN tip fc39676).

Talk-track: **the LOG line contract lives in TypeScript under the waiver, on the `samlog` table the ORD vertical already writes — the repo is not fully migrated, and LOG is not fully migrated: the `SAMLOG` user space, `LOG100`, the reader `ADSPUSRSPC` and every needs-SME item stay on IBM i or open. The whole slice may be a non-functional side effect; no business value is claimed.**

## Hard gate (checked before any edit)

- `PACK.yaml` `status: BOUND` — yes.
- Job body contains convert `ROOM_OK` — yes (`overnight/AGENT_JOB.md` line 4).
- Sole runner — `list-cloud-agents` showed one RUNNING automation run (this one); branch head = trigger head `fc39676`; `AGENT_JOB.md` line 1 `RUN` on origin. No convert commit for this pack existed on origin.
- Scope: `log-programs` only (cards c01–c10). CUS / ORD / VAT / DAT / COU / PAR packs not widened; ART, PRO not touched.

## Edit surface (STRICT, from the BOUND pack)

- Written (allow): `modern/src/shared/samlog/index.ts` (new), `modern/db/schema.sql` (LOG section **appended** — four `COMMENT ON` statements on the existing ORD `samlog` table; no `CREATE`, no `ALTER`, no new object; everything above byte-identical), `modern/test/samlog.test.ts` (new, pack-scoped; `test/helpers/db.ts` untouched), `modern/package.json` (description), `modern/README.md` (LOG section + header / parity / layout lines), `architecture/atu-merlin-log/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Not needed (allow, untouched): `modern/src/shared/logging/**` (one module, named after the object it aligns with), `modern/src/app.ts`, `modern/src/server.ts` (no HTTP surface — "HTTP only if Convert needs it", and a log with no in-tree reader does not), `modern/tsconfig.json`, `modern/vitest.config.ts`, `modern/package-lock.json` (no dependency change), `modern/scripts/**`.
- Untouched (deny): `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `modern/src/features/customer/**`, `modern/src/features/order/**`, `modern/openapi/customer.yaml`, `modern/openapi/order.yaml`, `modern/src/db/**`, `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-{vat,dat,cou,par}/**`, this pack's `PACK.yaml`, `BIND.md`, ADR 0001.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| RPGLE log programs -> TS shared logging module | `modern/src/shared/samlog/index.ts` — `createSamlog(db)` with the one binder export `addLogEntry(entry, user?)` (LOG300 AddLogEntry, c03 / c08); `normaliseLogEntry` (`entry 500A value` through `%trim`); `formatLegacyLine` + `toRpgTimestamp` (the line string rebuilt from a row); `decodeSamlogUserSpace` (c02 layout as a decoder over a copy). LOG100 (c01 / c05 / c06) has no module — residual |
| PF / samlog -> reuse or align with existing ORD samlog table; additive shared helpers; document residual vs reuse | **Reuse**: `addLogEntry` inserts into the ORD pack's `samlog (user_id, msg)` and defaults the actor to the ORD trigger's own `ord700_user()` — same table, same actor rule, same shape as `ord700_detord_delete` rows (tested). Nothing in ORD is changed or rewired; the LOG module is not called from ORD (that would be an ORD edit). `db/schema.sql` LOG section = comments on `samlog` only. Residual-vs-reuse table in `modern/README.md`, LOG section |
| api_contract_policy new-http-json, "HTTP only if Convert needs it" | Not needed. No route, page, OpenAPI. The only reader (`ADSPUSRSPC`, c09) has no source; inventing a viewer would answer a needs-SME question |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| log-programs-c01 | residual | CONTRACT_RISK | table created by `applySchema`; no replace / reset path (CR-L1); library anchor meaningless in one schema |
| log-programs-c02 | DONE (decoder) / residual (storage) | CONTRACT_RISK | `decodeSamlogUserSpace`: big-endian `pos`, `'***'` marker, split `7..pos-1` on `' ***'`, cut line as `tail`, injectable text/terminator; tested on synthetic spaces; no migration performed (CR-L2) |
| log-programs-c03 | DONE (as-is) / needs-SME | CONTRACT_RISK | `addLogEntry` (500 cut, `%trim`, user cut to 10 or `ord700_user()`); `formatLegacyLine` exact string incl. 63-byte fixed part, padded User, 26-char timestamp, 437/438 terminator loss (tested). Per-event actor (CR-L4); `msg` stored in full (CR-L3) |
| log-programs-c04 | residual (`inferred` kept) | CONTRACT_RISK | unbounded table; 40 lines all kept (tested delta, CR-L5); `TODO(log-programs-c04)` |
| log-programs-c05 | residual | — | no create step; nothing to swallow or reset; runtime confirmation stays needs-SME |
| log-programs-c06 | residual (`inferred` kept) | CONTRACT_RISK | no install step, no never-created state, no per-job init (tested delta, CR-L6); `TODO(log-programs-c06)` |
| log-programs-c07 | DONE (reuse) | — | ORD trigger keeps writing the one event; tested: trigger row and `addLogEntry` row of the same text share table, actor and formatted line; `addLogEntry` fires no ORD side effect |
| log-programs-c08 | DONE / n/a | CONTRACT_RISK | `Samlog` = exactly `addLogEntry` (test asserts surface); binding / ACTGRP / signature no TS equivalent (CR-L7) |
| log-programs-c09 | residual / needs-SME (`inferred` kept) | — | no reader invented (`TODO(log-programs-c09)`); `formatLegacyLine` offered as the one string a reader could depend on |
| log-programs-c10 | residual (`inferred` kept) | CONTRACT_RISK | transactional insert; 25 concurrent appends all kept (tested delta, CR-L8) |

CONTRACT_RISK ids (CR-Ln) are defined in `modern/README.md`, LOG section, "Deliberate deltas". Left open for Verification.

## Findings surfaced (not fixed here — outside the edit surface)

- The ORD pack's `samlog` had no `COMMENT ON` before this run; the LOG section adds them (additive metadata only). If the room prefers the ORD pack to own those comments, that is an ORD version bump.
- `test/helpers/db.ts` `reset()` already truncates `samlog` (ORD pack); the LOG suite relies on that and adds nothing to the helper.

## Planted defects / known_risks — preserved, not fixed

- 437-character cut losing `' ***'` (c03) — reproduced in `formatLegacyLine`; the stored `msg` is not cut (CR-L3).
- `%trim` strips leading blanks too; User padded not trimmed (c03) — reproduced.
- Capacity silent permanent stop (c04) — recorded, not reproduced (CR-L5), not "fixed" — there is no capacity to fix.
- Swallowed create error / silent header reset (c05), never-retried init (c06), unlocked shared cursor (c10) — recorded as residual; no counterpart.
- Activation-time `User` (c03) — per-event actor chosen to align with ORD; needs-SME (CR-L4).

## Quality gates

Pack `quality_gates.commands` is empty; pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here:

- `npm run typecheck` — clean
- `npm test` — 306 tests, 11 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`): 55 CUS (unchanged), 56 ORD (unchanged), 27 VAT (unchanged), 63 DAT (unchanged), 41 COU (unchanged), 40 PAR (unchanged), 24 LOG (`test/samlog.test.ts` — cards c02, c03, c04, c06, c07, c08, c10 + the schema shape)
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Follow-ups (not done here)

- Verification station for LOG: COMPARE at the TS API under the waiver; decide CR-L1 … CR-L8.
- Room: preserve the user-space log at all (SME_BRIEF item 1); line string vs `Msg` as the contract (item 7); SME sign-off on `discovery/log-programs/SME_BRIEF.md`.
- ORD pack version if the room wants one writer (`ord700_detord_delete` through `shared/samlog`).
- Per the job header: Verify residual packs still open (COU / PAR / LOG). Pack B night-residual queue still held.
