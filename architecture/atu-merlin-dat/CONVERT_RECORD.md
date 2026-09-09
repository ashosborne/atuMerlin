# CONVERT record — DAT utilities (atuMerlin)

pack_id@version: `atu-merlin-ts-dat-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded; BOUND tip ad697f3)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` body (Field + CTO Convert ROOM_OK 2026-09-09, batch of five), separate from BIND. Paste: `PASTE-convert-dat-vertical-atu-merlin.md`.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.** No IBM i goldens, no `REPLAY_GREEN` claim, `replay_green_run_ids: []` stays empty.
Run: 2026-09-09 (Cloud Agent, atuMerlin factory job runner)

Talk-track: **the DAT date rule lives in TypeScript under the waiver — the repo is not fully migrated, and DAT is not fully migrated.**

## Hard gate (checked before any edit)

- `PACK.yaml` `status: BOUND` — yes.
- Job body contains convert `ROOM_OK` — yes (`overnight/AGENT_JOB.md` line 4).
- Sole runner — one automation run active at start (`list-cloud-agents`), branch head = trigger head `744ac29`, `AGENT_JOB.md` line 1 `RUN` on origin.
- Scope: `dat-utils` only. CUS / ORD / VAT packs not widened; ART not touched.
- Date lock matches ORD — NULL inside, 0 / 1940-01-01 only at the boundary; no other sentinel invented.

## Edit surface (STRICT, from the BOUND pack)

- Written (allow): `modern/src/shared/dat/index.ts` (new), `modern/db/schema.sql` (DAT section **appended** — CUS, ORD and VAT objects above it byte-identical; two functions, no table), `modern/test/dat.test.ts` (new, pack-scoped), `modern/package.json` (description), `modern/README.md` (DAT section + header/layout lines), `architecture/atu-merlin-dat/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Not needed (allow, untouched): `modern/src/app.ts`, `modern/src/server.ts` — no HTTP surface (`contract_paths: []`; the legacy exposes the rule only through SQL callers). `modern/src/features/dat/` not created.
- Untouched (deny): `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `modern/src/features/customer/**`, `modern/src/features/order/**`, `modern/openapi/customer.yaml`, `modern/openapi/order.yaml`, `modern/src/db/**`, `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, `architecture/atu-merlin-{vat,cou,par,log}/**`, this pack's `PACK.yaml`, `BIND.md`, ADR 0001.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| RPGLE date utilities -> TS shared module | `modern/src/shared/dat/index.ts` — `isoToDate40` (ISOTODATE40 / DAT002), `isoNumToDate` (ISO_Num_To_Date / DAT001), `testIsoNum` (`test(de) *iso` + `%date`), `DatArgumentError` (SQLSTATE 38I02, `*PSSR`) |
| IBM i blank/never date -> NULL; sentinel only at the boundary | `fromLegacyIsoNum` / `toLegacyIsoNum` (0 <-> `null`), `fromLegacySentinelDate` / `toLegacySentinelDate` (1940-01-01 <-> `null`); SQL `dat_iso_num_to_date(integer)` / `dat_date_to_iso_num(date)` (IMMUTABLE; the first STRICT). DAT001's semantics are the lock; DAT002's sentinel output is never stored |
| 99999999 branch (c01) -> preserve as known_risk | `isoToDate40(99999999) = "2039-12-31"` as-is; the lock treats 99999999 as invalid -> `null`; nothing invented, needs-SME kept |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| dat-utils-c01 | DONE (as-is) | — | sentinels by exact equality; years 0001–9999; leap-year check; 2039 branch kept (known_risk) |
| dat-utils-c02 | DONE | — | `isoNumToDate`; carried because its shape is the pack's date lock; dead-or-not (QM) stays needs-SME |
| dat-utils-c03 | residual | CONTRACT_RISK | modern ORD lists read `date NULL` columns, no UDF; list-truncation defect has no path (CR-D2); QM queries no source |
| dat-utils-c04 | DONE / n/a | CONTRACT_RISK | `null` in -> `null` out; pure; SQL twins IMMUTABLE / STRICT; indicators, names, `*LIBL`, `FENCED` have no equivalent (CR-D1) |
| dat-utils-c05 | DONE (as-is) | CONTRACT_RISK | `DatArgumentError { sqlstate: "38I02" }`, message cut to 70; invalid date stays `null`, not an error (CR-D4) |
| dat-utils-c06 | DONE | — | pure functions, nothing kept between calls; tested |
| dat-utils-c07 | DONE | — | one definition of the sentinel; `isoToDate40(n) === toLegacySentinelDate(fromLegacyIsoNum(n))`; CUS200 / ORD202 copies not rewritten (deny) |
| dat-utils-c08 | DONE | — | `IsoDate \| null` return; invalid -> `null`, never a stale value; no date-plus-flag shape |

CONTRACT_RISK ids (CR-Dn) are defined in `modern/README.md`, DAT section, "Deliberate deltas". Left open for Verification.

## Findings surfaced (not fixed here — outside the edit surface)

- **CR-D3 (CUS pack):** `modern/src/features/customer/customer.service.ts` `lastOrderDateOf` returns `null` for `CULASTORD` years 0001–0099 (`Date.UTC(1, 0, 1)` reads year 1 as 1901, so its round-trip check fails), where `test(de) *iso` — and this module — accept them. Out of any business window; recorded by `test/dat.test.ts` ("finding for the CUS pack") for the CUS pack to decide at its next version. `features/customer/**` is deny-listed here.
- ORD701 (`db/schema.sql`, ORD section) and `lastOrderDateOf` each carry their own copy of the lock; `dat_date_to_iso_num` / `fromLegacyIsoNum` are now the shared definitions they could adopt — version bump + SUPERSEDE + re-bind of those packs, not this one.

## Planted defects / known_risks — preserved, not fixed

- 99999999 -> 2039-12-31 with no MAPVAL (c01) — as-is in `isoToDate40`; not mapped to "never" by the lock.
- ISO_Num_To_Date possibly dead (c02 / c03) — carried as one function; no SQL name created; needs-SME.
- Three sentinel implementations across the estate (c07) — one definition offered; the CUS / ORD copies stay (deny).
- `*PSSR` error contract 38I02 (c05) — the statement fails, it does not yield a NULL row; reproduced as an exception class, not a `null`.
- Build metadata (c04 / c06: activation group, FENCED, target library) — no TS counterpart; recorded.

## Quality gates

Pack `quality_gates.commands` is empty; pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here:

- `npm run typecheck` — clean
- `npm test` — 201 tests, 7 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`): 55 CUS (unchanged), 56 ORD (unchanged), 27 VAT (unchanged), 63 DAT (`test/dat.test.ts`, new — 3 of them against the SQL lock functions in the throw-away schema)
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Follow-ups (not done here)

- Verification station for DAT: COMPARE at the TS API under the waiver; decide CR-D1 … CR-D4.
- SME sign-off on `discovery/dat-utils/SME_BRIEF.md`: sentinel vs NULL presentation (c01 / c07), 99999999 out-of-tree use (c01), QM-query callers (c02 / c03), build owner questions (c04 / c06).
- CUS pack: decide CR-D3 (years 0001–0099 in `lastOrderDateOf`) and whether to adopt `fromLegacyIsoNum`; ORD pack: whether ORD701 adopts `dat_date_to_iso_num`. Each is a pack version bump + SUPERSEDE + re-bind.
- Next Convert per the job header: cou -> par -> log (each needs its own ROOM_OK in the job body). Pack B night-residual queue still held.
