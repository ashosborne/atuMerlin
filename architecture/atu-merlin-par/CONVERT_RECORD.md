# CONVERT record — PAR vertical (atuMerlin)

pack_id@version: `atu-merlin-ts-par-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded; BOUND tip ad697f3)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` body (Field + CTO Convert ROOM_OK 2026-09-09, batch of five), separate from BIND. Paste: `PASTE-convert-par-vertical-atu-merlin.md` @ f2f7e6c.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.** No IBM i goldens, no `REPLAY_GREEN` claim, `replay_green_run_ids: []` stays empty.
Run: 2026-09-09 (Cloud Agent, atuMerlin factory job runner, RUN tip ae99393).

Talk-track: **the PAR parameter store lives in TypeScript under the waiver — the repo is not fully migrated, and PAR is not fully migrated: PAR201's IFS panel, the subfile mechanics and the PATH-as-configuration decision (c11) stay on IBM i or open.**

## Hard gate (checked before any edit)

- `PACK.yaml` `status: BOUND` — yes.
- Job body contains convert `ROOM_OK` — yes (`overnight/AGENT_JOB.md` line 4).
- Sole runner — `list-cloud-agents` showed one RUNNING automation run (this one); branch head = trigger head `ae99393`; `AGENT_JOB.md` line 1 `RUN` on origin. No convert commit for this pack existed on origin.
- Scope: `par-maintain` only (cards c01–c13). CUS / ORD / VAT / DAT / COU packs not widened; ART, PRO, LOG not touched.

## Edit surface (STRICT, from the BOUND pack)

- Written (allow): `modern/src/shared/parm/index.ts` (new), `modern/src/features/par/{index,par.repository,par.service,par.routes}.ts` (new), `modern/db/schema.sql` (PAR section **appended** — CUS, ORD, VAT, DAT and COU objects above it byte-identical; one new table, nothing altered), `modern/test/parm.test.ts` + `modern/test/par.api.test.ts` (new, pack-scoped; `test/helpers/db.ts` untouched), `modern/src/app.ts` (additive: two imports, register the feature, chain `parApiErrorHandler`), `modern/package.json` (description), `modern/README.md` (PAR section + header / layout lines), `architecture/atu-merlin-par/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Not needed (allow, untouched): `modern/src/server.ts`, `modern/tsconfig.json`, `modern/vitest.config.ts`, `modern/package-lock.json` (no dependency change), `modern/scripts/**`.
- Untouched (deny): `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `modern/src/features/customer/**`, `modern/src/features/order/**`, `modern/openapi/customer.yaml`, `modern/openapi/order.yaml`, `modern/src/db/**`, `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-{vat,dat,cou,log}/**`, this pack's `PACK.yaml`, `BIND.md`, ADR 0001. No `modern/openapi/par.yaml` (`openapi/**` is not on the allow list; `contract_paths: []`).

## Mapping rules applied

| Rule | Where |
| --- | --- |
| RPGLE FPARM / PAR maintain programs -> TS shared module and/or features/par | `modern/src/shared/parm/index.ts` — `createFParameter(db)`: `getParm1..getParm5` (PAR300 over one keyed chain, no cache) + `getPath()` (= `GetParm2('PATH':' ')`, c11); `normaliseParameterKey` (10A by value); `wrklnkPattern` (PAR201 `*TCAT '*'`, c07). `modern/src/features/par/` — PAR200 (c01–c06) as a JSON maintain API: `par.repository.ts` (bound-parameter SQL: list with look-ahead, chain, write, update, delete), `par.service.ts` (the rules the cards found: duplicate-key-only create, unconditional update, silent keyed delete, display upper-casing, width checks), `par.routes.ts` |
| PF PARM / PATH -> postgres table or config surface (choose at convert; document choice; c11 open) | **Table chosen as the mapping**: `parameter` (composite PK = PF UNIQUE; `varchar` 10/10/10/100/2; `smallint` + width `CHECK` for zoned `1 0` / `3 0`), appended to `db/schema.sql`. `getPath()` / `GET /api/parameters/path` is the **config surface** consumers reuse; a switch to environment configuration would be a second `FParameter` implementation behind the same interface. **The disposition (retire PAR200 / PARAMETER for configuration) is not decided** — needs-SME item 2 of `SME_BRIEF.md` stays open. No PATH row seeded (c08) |
| DSPF -> web (if Convert includes maintain UI) | PAR200D -> **HTTP JSON only** (`GET/POST/PUT/DELETE /api/parameters…`); no server-rendered page. Convert needs a writer (PAR200 is the only writer of PARAMETER and there is no seed); the API is the smallest one. A page is left for after c11 |
| PATH consumers (ORD500) -> reuse of config; do not rewrite order | `features/order/**` untouched. Modern ORD500 has no PDF / PATH step (ord-print-ord500-c02/c04 needs-SME); when converted under an ORD pack version it reads `getPath()` |
| PAR201 / WRKLNK -> not carried | `wrklnkPattern(path)` reproduces the pattern string and its edge cases; no IFS browser, no filesystem access |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| par-maintain-c01 | DONE / residual | CONTRACT_RISK | `GET /api/parameters`: key order, 14 per load, exact Bottom by look-ahead, `parm2s` (32) on list rows, empty -> `[]`; byte order (CR-P3); subfile mechanics residual (CR-P2) |
| par-maintain-c02 | DONE (as-is) | CONTRACT_RISK | `POST /api/parameters`: duplicate-key check only, DDS text kept; blank/blank row creatable; values unvalidated; upper-casing of non-`CHECK(LC)` fields reproduced in the service (CR-P4); lock during error / 01021 race -> same duplicate error (CR-P2, CR-P5); over-long / non-numeric -> 400 (CR-P6) |
| par-maintain-c03 | residual | CONTRACT_RISK | list re-read per call: created row visible at once, no duplicate after Bottom (CR-P2). Tested as the delta |
| par-maintain-c04 | DONE (as-is) / residual | CONTRACT_RISK | `GET` + `PUT /api/parameters/:pacode/:pasubcode`: unconditional update, key immutable, absent field -> blank / zero; no lock (CR-P2); vanished row -> 404 (CR-P5); list shows new values (CR-P2) |
| par-maintain-c05 | DONE (as-is) / residual | CONTRACT_RISK | `DELETE`: 204 always, no confirmation, no in-use check (PATH deletable; `getPath` then `""`), blank/blank key deletes the blank/blank row; no ghost row / marker (CR-P2) |
| par-maintain-c06 | residual | CONTRACT_RISK | F3 / F5 / F12 / Page Down have no equivalent beyond `GET` and `?offset=` (CR-P2) |
| par-maintain-c07 | DONE (pattern) / residual (panel) | — | `wrklnkPattern`: `'<dir>/*'` vs `'<dir>*'`, blank -> `'*'`, 100-char truncation (tested); WRKLNK not invented; trailing-slash contract stays known_risk, not normalised |
| par-maintain-c08 | DONE (as-is, `inferred` kept) | — | `getPath()` returns `""` for a missing row and for a blank PARM2, silently; `TODO(par-maintain-c08)` fail-fast vs default location; runtime half outside the tree |
| par-maintain-c09 | DONE (as-is) | CONTRACT_RISK | five getters: miss -> blanks / zeros, blank/blank key never reads, case-sensitive, 10A cut; hit cache / activation-group lifetime not reproduced (CR-P1, tested as the delta) |
| par-maintain-c10 | DONE | CONTRACT_RISK | `FParameter` = five getters + `getPath`, nothing to close (test asserts the surface); signature / BNDDIR / ACTGRP have no TS equivalent (CR-P7) |
| par-maintain-c11 | DONE (as-is) / needs-SME | — | `getPath()` named for the one live call; PARM1/3/4/5 carried unused, no consumer invented; PATH-as-configuration NOT decided (mapping = table, disposition = room) |
| par-maintain-c12 | DONE | — | `parameter` table: PK, five typed columns, width CHECKs, no delete flag / audit / index / trigger; tested (PK 23505, CHECK 23514, `information_schema` widths) |
| par-maintain-c13 | residual (LOG pack) | — | the object exists in the modern schema; the location-anchor rule belongs to `log-programs` (`architecture/atu-merlin-log/**` deny-listed) |

CONTRACT_RISK ids (CR-Pn) are defined in `modern/README.md`, PAR section, "Deliberate deltas". Left open for Verification.

## Findings surfaced (not fixed here — outside the edit surface)

- Modern ORD500 (`features/order/order.document.ts`) has no PATH read because the PDF step (`CVTSPLPDF`, `TODIR(&PATH)`) is needs-SME under the ORD pack. `getPath()` now exists for it; wiring is an ORD pack version bump.
- The list/edit template question (locks across the panel, ghost rows, unmonitored 01221) is now recorded four times in the estate (CR-8, CR-O8, CR-C1-adjacent, CR-P2 / CR-P5). One room answer would close all of them.

## Planted defects / known_risks — preserved, not fixed

- Blank / missing PATH silent (c08) — `""`, no error; needs-SME.
- Trailing-slash contract (c07 / c11) — value verbatim, no normalisation; needs-SME (data).
- Blank/blank row creatable via the API and unreachable by the getters (c02, c09) — as-is.
- Unconditional update, no audit, no validation (c04) — as-is.
- Immediate unconfirmed delete of the one live setting, no in-use check (c05) — as-is.
- Unused GetPARM1/3/4/5 (c11) — exported, no consumer invented.
- PATH as configuration vs maintained table (c11) — table chosen as the mapping only; disposition open.
- Hit cache / stale read per job (c09) — not reproduced; CR-P1.

## Quality gates

Pack `quality_gates.commands` is empty; pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here:

- `npm run typecheck` — clean
- `npm test` — 282 tests, 10 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`): 55 CUS (unchanged), 56 ORD (unchanged), 27 VAT (unchanged), 63 DAT (unchanged), 41 COU (unchanged), 40 PAR (`test/parm.test.ts` 13 — cards c07..c12; `test/par.api.test.ts` 27 — cards c01..c06, c11, incl. the CR-P2 deltas)
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Follow-ups (not done here)

- Verification station for PAR: COMPARE at the TS API under the waiver; decide CR-P1 … CR-P7.
- Room: c11 PATH-as-configuration (collapses c01–c07, c12 to "not carried" if yes); SME sign-off on `discovery/par-maintain/SME_BRIEF.md` (c07 / c11 data, c08 stance, c09 cache, c05 delete, c02 / c04 lock template).
- ORD pack version: PDF step reusing `getPath()`. LOG pack: c13 location anchor. PRO: the other two PATH consumers.
- Next Convert per the job header: log (needs its own ROOM_OK in the job body), then Verify per pack. Pack B night-residual queue still held.
