# CONVERT record — COU vertical, FCOUNTRY half (atuMerlin)

pack_id@version: `atu-merlin-ts-cou-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded; BOUND tip ad697f3)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` body (Field + CTO Convert ROOM_OK 2026-09-09, batch of five), separate from BIND. Paste: `PASTE-convert-cou-vertical-atu-merlin.md` @ f2f7e6c.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.** No IBM i goldens, no `REPLAY_GREEN` claim, `replay_green_run_ids: []` stays empty.
Run: 2026-09-09 (Cloud Agent, atuMerlin factory job runner) — code commit e90dfb2 by the first runner, whose turn ended after the push; docs, `DONE` stamp and PR update completed by the following runner (see "Run notes").

Talk-track: **the FCOUNTRY service program lives in TypeScript under the waiver — the repo is not fully migrated, and COU is not fully migrated: the COU200 panel half is deferred.**

## Hard gate (checked before any edit)

- `PACK.yaml` `status: BOUND` — yes.
- Job body contains convert `ROOM_OK` — yes (`overnight/AGENT_JOB.md` line 4).
- Sole runner — one automation run active at the start of the first runner (`list-cloud-agents`), branch head = trigger head `6246243`, `AGENT_JOB.md` line 1 `RUN` on origin. The second runner confirmed the first had gone IDLE before touching the branch.
- Scope: `cou-maintain` FCOUNTRY / COU300 / COU301 half only (cards c07–c12). COU200 (c01–c06, c13) not read into code. CUS / ORD / VAT / DAT packs not widened; ART and PRO not touched.

## Edit surface (STRICT, from the BOUND pack)

- Written (allow): `modern/src/shared/fcountry/index.ts` (extended in place), `modern/db/schema.sql` (COU section **appended** — CUS, ORD, VAT and DAT objects above it byte-identical; one index and comments, no table altered), `modern/test/fcountry.test.ts` (new, pack-scoped), `modern/package.json` (description), `modern/README.md` (COU section + header / layout lines), `architecture/atu-merlin-cou/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Not needed (allow, untouched): `modern/src/app.ts`, `modern/src/server.ts` — no HTTP surface (`contract_paths: []`; the legacy exposes FCOUNTRY only through its four RPG callers). `modern/src/features/cou/` not created.
- Untouched (deny): `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `modern/src/features/customer/**`, `modern/src/features/order/**`, `modern/openapi/customer.yaml`, `modern/openapi/order.yaml`, `modern/src/db/**`, `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-{vat,dat,par,log}/**`, this pack's `PACK.yaml`, `BIND.md`, ADR 0001.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| RPGLE service program FCOUNTRY (COU300 / COU301) -> TS shared module | `modern/src/shared/fcountry/index.ts` — `createFCountry(db)`: `existCountry`, `getCountryName`, `getCountryIso3` (COU300 over one keyed chain, no cache), `sltCountry` (COU301 positioned page reader), `listCountries` (CUS surface, unchanged); pure reducer `sltCountryOpen` / `sltCountryCheck` / `sltCountryAct` / `sltCountryRequest` for the COU301 state machine; `normaliseCountryCode` (2A) / `normaliseCountryName` (30A) |
| PF COUNTRY / LF COUNTR1 -> postgres table / index (additive) | `country` (CUS section) taken over by `COMMENT ON` only; `CREATE INDEX IF NOT EXISTS countr1 ON country (countr COLLATE "C", coid COLLATE "C")` for `COUNTR1.LF` |
| DSPF COU301D -> web selector (if Convert includes SltCountry UI) | Not exercised — no UI added; the reducer carries indicators 35 / 36 / 41 / 42 and the DDS message texts as data for a future presentation |
| DSPF COU200D / program COU200 -> deferred | Not mapped; no writer of `country` in modern |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| cou-maintain-c07 | DONE (as-is) | CONTRACT_RISK | one keyed read per call; blank code never reads; unknown -> blanks / false; exact 2-char match; exists = row present; hit cache not reproduced (CR-C1); 2A by-value contract (CR-C3) |
| cou-maintain-c08 | DONE (needs-SME) | — | `getCountryIso3` exported, no consumer invented, `coiso` kept; `TODO(cou-maintain-c08)`; no close on the module |
| cou-maintain-c09 | DONE (as-is) | CONTRACT_RISK | SETLL at `pcod`, 20 rows per load, look-ahead More / Bottom, option 1 -> COID, F3 / F12 -> `pcod`; empty window beyond last key kept (`TODO(cou-maintain-c09)`); byte order (CR-C4); window not reproduced (CR-C5) |
| cou-maintain-c10 | DONE (as-is) | — | F8 clears the key of the order entered; card trace reproduced (codes from the top, `pcod` lost); F8 ignored while options typed; F8 + position-to toggles and discards; retention is a target decision (`TODO(cou-maintain-c10)`) |
| cou-maintain-c11 | DONE | CONTRACT_RISK | 35 / 36 per row, 41 / 42 on the control line, cumulative, `firstErrorRrn` = RRB01; option 8 repositions at POSCOD / POSDES, text not validated; RI / cursor attributes are presentation (CR-C5) |
| cou-maintain-c12 | DONE | CONTRACT_RISK | four methods + CUS `listCountries`; `countr1` index asserted by test; signature `'V1'`, BNDDIR, `ACTGRP(*CALLER)` have no TS equivalent (CR-C2) |

CONTRACT_RISK ids (CR-Cn) are defined in `modern/README.md`, COU section, "Deliberate deltas". Left open for Verification.

## Findings surfaced (not fixed here — outside the edit surface)

- The CUS web (`features/customer/customer.web.ts`) keeps its own `GET /api/countries` datalist over `listCountries` for the F4 prompt; `sltCountry` and the reducer are available but not wired (deny). Adopting them is a CUS pack version bump + SUPERSEDE + re-bind.
- `SltCountry` and `SltArtFam` (FAM301) are behaviourally identical per c10 / c11; the reducer here is COU-scoped. Whether `fam-maintain` reuses it is that bind's decision (needs-SME in `SME_BRIEF.md`).

## Planted defects / known_risks — preserved, not fixed

- `GetCountryIso3` unused export (c08) — carried unused; `coiso` not disposed; needs-SME.
- Empty window with no message beyond the last key (c09) — as-is; needs-SME.
- F8 clears the position key of the order entered; caller's position lost after toggle away and back (c10) — as-is; needs-SME.
- Blank code never reads `COUNTRY`, even if a blank-keyed row exists (c07) — as-is.
- Copybook publishes five prototypes for four exports; `closeCOUNTRY` unreachable (c08) — no equivalent; nothing to close.
- COU200 panel half (c01–c06, c13) — deferred; not read into code; no maintenance path.

## Quality gates

Pack `quality_gates.commands` is empty; pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here (both runners, same result):

- `npm run typecheck` — clean
- `npm test` — 242 tests, 8 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`): 55 CUS (unchanged), 56 ORD (unchanged), 27 VAT (unchanged), 63 DAT (unchanged), 41 COU (`test/fcountry.test.ts`, new — cards c07..c12, including one schema assertion on the `countr1` index)
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Run notes

The first runner (triggered by the RUN tip 6246243) did the hard gate, wrote the module, schema section and tests, ran 242/242 green + typecheck, committed e90dfb2 and pushed — then its turn ended with no further steps (no README, no record, no `DONE`). The push of e90dfb2 fired this second runner, which found line 1 still `RUN`, confirmed via `list-cloud-agents` that the first runner was IDLE and was the only other run, re-ran typecheck + the full suite on the pushed commit (242/242), and completed the documentation, the `DONE` stamp and the PR update. No code was changed by the second runner.

## Follow-ups (not done here)

- Verification station for COU: COMPARE at the TS API under the waiver; decide CR-C1 … CR-C5.
- SME sign-off on `discovery/cou-maintain/SME_BRIEF.md`: c08 carry-or-reject, c09 empty-window message / position retention, c10 one selector rule with `fam-maintain`, c07 cache staleness stance, c07 / c12 build-owner questions.
- COU200 panel half: Pack B cards c01–c06 / c13, then SUPERSEDE + re-bind before any maintenance path.
- CUS pack: whether the F4 prompt adopts `sltCountry` + reducer (version bump + SUPERSEDE + re-bind).
- Next Convert per the job header: par -> log (each needs its own ROOM_OK in the job body). Pack B night-residual queue still held.
