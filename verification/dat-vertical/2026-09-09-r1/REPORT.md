# Verification REPORT — DAT utilities (atuMerlin), run `2026-09-09-r1`

pack_id@version: **`atu-merlin-ts-dat-v1@1`** (`architecture/atu-merlin-dat/PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded)
Station: Verification · Mode: **COMPARE at the TypeScript boundary only** (plus the two additive SQL lock functions) · Characterization: **`WAIVED_PATHFINDER`** (ADR 0001)
Authorisation: Verification `ROOM_OK` in `overnight/AGENT_JOB.md` ("ROOM_OK: verification DAT only", Field + CTO Verify ROOM_OK batch of five 2026-09-09), separate from BIND and from the convert `ROOM_OK`. Paste: `PASTE-verify-dat-vertical-atu-merlin.md` @ `744ac29`.
Branch `cursor/atu-merlin-estate-discovery` @ `1b9049c` · PR [#1](https://github.com/ashosborne/atuMerlin/pull/1) → `master` · 2026-09-09 15:19–15:35 UTC · Cloud Agent (atuMerlin factory job runner)

## 1. Verdict

**`parity: TS_BOUNDARY_GREEN`** — see `PARITY.yaml`.

What that means, exactly:

- `npm run typecheck` is clean and `npm test` is 201/201 against live PostgreSQL 16.15 (63 DAT; the 55 CUS, 56 ORD and 27 VAT tests unchanged and green).
- Every exported function of `modern/src/shared/dat/index.ts` behaves the way the `dat-utils` cards and the README DAT section say it should, checked by a probe whose oracle was written from the cards (not from the module or its vitest suite): a 130 000-value calendar sweep (every mm/dd 00–99 for 13 years that exercise the leap-year and year-boundary rules) plus 200 000 random `DECIMAL(8,0)` values, negatives included — 29/29 cases (`evidence/results.json`). The two SQL twins are probed through the same sweep in a throw-away schema built from `db/schema.sql`.
- The date lock matches ORD: `NULL` inside, `0` / `1940-01-01` only at the boundary; `dat_date_to_iso_num` gives the same value as ORD701's inline `to_char(...)::integer` on every valid sweep date; the ORD date columns are nullable `date`; no `1940` / `2039` literal exists in the DAT SQL code (P22, P25, P26, P29). No other sentinel was invented.
- The known-risk behaviours are present and asserted as-is, not fixed (§4, "Preserved").
- The one card not fully carried (`c03`, callers) has a stated reason; there are **no unexplained card gaps**. One **documentation** gap was found (G-D1, §4): the c07 composition identity is stated more broadly than it holds. Behaviour of each function matches its own documentation.

What it does **not** mean:

- **Not `PARITY=GREEN` against IBM i.** No IBM i / RPG goldens exist for this pathfinder and none were invented. `REPLAY_GREEN` is not claimed; `legacy_green` and `parity_green` stay `false`; `replay_green_run_ids` stays `[]`. The oracle here is the Discovery cards (read from source, never executed on the box) and the README's stated contract.
- Not "Merlin migrated", and not "DAT fully migrated": the two IBM i SQL functions themselves, their possible QM-query callers (`CUSQRY` / `ARTQRY`, no source in the tree), the CUS200 / ORD202 sentinel copies and every needs-SME item stay on IBM i or open. Nothing in modern consumes the module yet — CUS and ORD keep their own copies of the lock (their packs, not this one).
- CUS, ORD and VAT are not re-verified as this job's claim. The CUS helper `lastOrderDateOf` is *read* by one probe case (P21) to characterise CR-D3; it is not edited and its pack is not widened.

**Talk-track:** DAT residual verified at TS API under waiver — not Merlin migrated.

## 2. Gate checks

| Gate | Result |
| --- | --- |
| `PACK.yaml` status | `BOUND` — proceed |
| Verification `ROOM_OK` in job body | present ("ROOM_OK: verification DAT only (atu-merlin-ts-dat-v1@1 BOUND; Convert DONE tip 5957461 / 03e8bc1)") |
| Convert complete | yes — `architecture/atu-merlin-dat/CONVERT_RECORD.md`, `modern/src/shared/dat/index.ts` at `03e8bc1`, handoff `PARITY=UNVERIFIED` |
| Another job `RUN` (Smith gate) | no — `list-cloud-agents` showed this run as the only active automation run at start; branch head = trigger head `1b9049c`; `AGENT_JOB.md` line 1 `RUN` on origin |
| `overnight/stop.txt` | absent |
| Scope | DAT only (`dat-utils`, one slice). CUS / ORD / VAT not re-verified; ART untouched |
| Edit surface | written: `verification/dat-vertical/2026-09-09-r1/**`, `modern/README.md` (two status sentences), `overnight/AGENT_JOB.md` line 1. Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**` (this pack's `PACK.yaml` stays `verification: DEFERRED` — BOUND is immutable), `modern/src|test|db|openapi` |
| CUS / ORD / VAT packs not widened | `git diff 744ac29..HEAD -- modern/src/features modern/openapi modern/src/db modern/src/app.ts modern/src/server.ts architecture/atu-merlin architecture/atu-merlin-ord architecture/atu-merlin-vat architecture/atu-merlin-cou architecture/atu-merlin-par architecture/atu-merlin-log` is empty; the first 261 lines of `modern/db/schema.sql` (CUS + ORD + VAT objects) are byte-identical to the pre-convert tip `744ac29`; CUS / ORD / VAT suites 55 / 56 / 27 unchanged |
| `ATU_SRC/**` | `git diff origin/master..HEAD -- ATU_SRC` is empty |
| Date lock sentinel | none other than `0` / `1940-01-01` at the boundary (P22, P25, P29); `2039-12-31` is a DAT002 presentation value kept as-is, never stored (P18, P25) |
| Goldens | none exist; nothing RECORDed, nothing rewritten |

## 3. Commands run

Environment: Node v22.14.0 (pack minimum 20), PostgreSQL 16.15 (`modern/scripts/local-pg.sh`, port 54329), fresh `npm ci`.

| Command | Result | Evidence |
| --- | --- | --- |
| `cd modern && npm run typecheck` | `tsc --noEmit` exit 0, no diagnostics | `evidence/typecheck-and-vitest.log` |
| `cd modern && npm test` | vitest 3.2.7: **7 files, 201 tests, 201 passed** (`dat.test.ts` 63, `order.api.test.ts` 47, `customer.api.test.ts` 29, `fvat.test.ts` 27, `fcustomer.test.ts` 16, `customer.web.test.ts` 10, `order.web.test.ts` 9), 6.88 s | `evidence/typecheck-and-vitest.log` |
| independent COMPARE probe (`DATABASE_URL=... npx tsx evidence/probe.mjs`) | **29 PASS / 0 FAIL** | `evidence/results.json` |

The vitest suite is modern's own; on its own it never sets a green flag (Field Guide anti-greenwash). The probe is the independent check: its oracle re-derives `test(de) *iso` from the c01 validation rules through the JS `Date` engine (proleptic Gregorian, the same calendar as RPG `*ISO` and PostgreSQL `make_date`, with `setUTCFullYear` so years 0001–0099 are read literally), adds the two DAT002 sentinels by exact equality, and compares every module export against it over the sweep and the random sample. It then pushes the same sweep through `dat_iso_num_to_date` / `dat_date_to_iso_num` with one `unnest` query each, checks the declared `IMMUTABLE` / `STRICT` attributes in `pg_proc`, and reads the ORD schema (`information_schema.columns`, the ORD701 trigger text) to confirm the lock shape.

Two probe cases failed on the first run. P08 was a probe-script bug (99999999 counted twice: it is also the sweep's year-9999 / md-9999 value). P19 was written from the README's c07 identity and failed for a real reason — see G-D1 below; the case was rewritten to assert the identity's actual domain. No module or server behaviour was changed. The committed `results.json` is the second, clean run.

## 4. Card COMPARE — cards vs module exports vs tests vs probe

Legend: export = function in `modern/src/shared/dat/index.ts` (or SQL function in `db/schema.sql`); test = vitest block in `test/dat.test.ts`; probe = case id in `evidence/results.json`.

### dat-utils

| Card | README status | Export | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 ISOTODATE40: 0 → 1940-01-01, 99999999 → 2039-12-31, valid → date, else NULL | converted (as-is) | `isoToDate40`, `testIsoNum`, constants | c01 (23) | P01–P05, P18 | match on 330 000 values: exact-equality sentinels (99999998, 1, −99999999 → null), 1900 / 2100 not leap, 2000 / 2024 leap, 00010101 and 99991231 convert, year 0000 null; 2039 branch kept and **not** blanked (known_risk) |
| c02 ISO_Num_To_Date: test(de) only, 0 → NULL | converted / needs-SME | `isoNumToDate` | c02 (22) | P06–P08 | match on 330 000 values; differs from DAT002 on exactly {0, 99999999}; dead-or-not stays open |
| c03 callers: ORD200 / ORD201 cursors; ISO_Num_To_Date unused | **residual** | — | — | P22, P28, P29 | explained: the modern ORD repository reads nullable `date` columns and no UDF appears in any query; the un-indicated-fetch truncation defect has no path (CR-D2); no function with a legacy name exists (CR-D1); the QM queries have no source |
| c04 UDF contract: PARAMETER STYLE SQL, DETERMINISTIC, NO SQL, RETURNS NULL ON NULL INPUT | converted / n/a | `null` handling in every entry point; SQL twins `IMMUTABLE` / `STRICT` | c04 (2) | P09, P10, P27 | match: null in → null out without evaluating; pure; `dat_iso_num_to_date` `i` + strict, `dat_date_to_iso_num` `i` + not strict (NULL must give 0). Indicators, names, `*LIBL`, `FENCED` have no equivalent — CR-D1, explained |
| c05 `*PSSR` → SQLSTATE 38I02 + text ≤ 70; statement fails, not a NULL row | converted (as-is) | `DatArgumentError` | c05 (7) | P12–P14 | match: 28 non-`DECIMAL(8,0)` cases raise `DatArgumentError { sqlstate: "38I02" }` with `message.length <= 70` from all four entry points; 0 exceptions across 330 002 in-range values (an invalid date is a null, not an error) |
| c06 programs stay active; no state kept | converted | pure functions | c04 (purity line) | P10 | match: 1 341 values in order, shuffled, and again — identical |
| c07 0 → 1940-01-01 implemented three times; no shared definition | converted | `LEGACY_LOVAL_DATE`, `toLegacySentinelDate`, `fromLegacySentinelDate` | c07 (1), lock (5) | P18–P20 | match on the sentinel shape and on "never stored"; CUS200 / ORD202 copies untouched (deny). The composition identity is narrower than documented — **G-D1** below |
| c08 result unassigned on invalid input (port trap) | converted | `IsoDate \| null` | c04 (c08 line) | P11 | match: 5 000 valid/invalid alternations, every invalid result null, never the previous value |

**Unexplained gaps: none.** Every card is either matched at the boundary or carries a reason that traces to the pack (`deny`, `contract_paths: []`, `stay_legacy`) or to a bind-time needs-SME.

### Date lock — matches ORD (job gate 13)

| Check | Probe | Observed |
| --- | --- | --- |
| Boundary in, numeric: 0 → null; invalid → null; no 2039 sentinel inside | P15 | `fromLegacyIsoNum` == DAT001 semantics on the sweep; `fromLegacyIsoNum(99999999) === null` |
| Boundary out, numeric: null → 0; round-trip | P16, P17 | 4 384 valid sweep dates round-trip; 9 malformed strings rejected with `DatArgumentError` |
| SQL twin in == TS lock | P23, P24, P25 | 180 000 values incl. negatives, 0 mismatches; `NULL` / 0 / 99999999 → `NULL` |
| SQL twin out == ORD701's inline expression == TS | P26 | `dat_date_to_iso_num(d) = to_char(d,'YYYYMMDD')::integer = toLegacyIsoNum(d)` on 4 384 dates; `NULL` → 0 |
| ORD schema shape | P22, P29 | ORD701 trigger text still carries its own `to_char(NEW.ordate, 'YYYYMMDD')::integer` (not rewritten — ORD pack); `ordate` / `ordatdel` / `ordatclo` are `date`, delivery / close nullable, no sentinel default |
| DAT SQL section | P22, P28 | no `CREATE TABLE`; no `'1940-01-01'` / `'2039-12-31'` / `19400101` / `20391231` in code (comments only); no function named `ISOTODATE40` / `ISO_Num_To_Date` |
| CUS alignment (read-only) | P21 | `lastOrderDateOf` agrees with the lock on every sweep value except years 0001–0099 (730 values in the sweep's years 1 and 99): CUS `null`, DAT a date — CR-D3 |

### Preserved (known_risk / as-is), asserted, not fixed

| Behaviour | Where asserted | Observed |
| --- | --- | --- |
| 99999999 → 2039-12-31, no MAPVAL (c01) | P01, P18 | `isoToDate40(99999999) === "2039-12-31"`; `fromLegacySentinelDate("2039-12-31") === "2039-12-31"` (not mapped to null) |
| ISO_Num_To_Date carried though possibly dead (c02 / c03) | P06–P08 | `isoNumToDate` present and correct; no SQL function with the legacy name |
| `*PSSR` is an error, not a NULL row (c05) | P12, P13 | raises for non-`DECIMAL(8,0)`; never for an in-range integer |
| CUS `lastOrderDateOf` years 0001–0099 → null (CR-D3) | P21 | left as-is; `features/customer/**` not touched |

### Contract gaps found (documentation-level, not behaviour drift)

| Id | Gap | Severity | Suggested owner |
| --- | --- | --- | --- |
| G-D1 | `modern/README.md` (DAT c07 row and mapping-rules table) and `architecture/atu-merlin-dat/CONVERT_RECORD.md` (c07 row) state `isoToDate40(n) === toLegacySentinelDate(fromLegacyIsoNum(n))` without qualification. It holds on exactly {0} ∪ valid dates (4 385 sweep values) and fails for every invalid `n` (125 616 sweep values, including 99999999): DAT002 answers `NULL` (or `2039-12-31`), the composition answers `1940-01-01`, because the lock folds "invalid" into "never" — the documented CR-6 stance of `fromLegacyIsoNum`. The vitest c07 block asserts the identity only at 0 and 20240315, so it is correct but does not cover the claim. Each function behaves as its own doc comment says | low | Conversion follow-up: qualify the identity ("for 0 and valid dates") in README + CONVERT_RECORD, or state that the lock's invalid → never fold is the intended difference from DAT002 |

## 5. CONTRACT_RISK CR-D1..CR-D4 and pack `known_risks` — accept-for-demo or defer

No line below claims an IBM i match. "Accept-for-demo" means the delta is acceptable for the pathfinder demo as documented in `modern/README.md`; "defer" means the room or an SME must decide before anything beyond a demo. No SME answer is invented here.

| Id | Delta (from `modern/README.md`) | Disposition | One sentence |
| --- | --- | --- | --- |
| CR-D1 | No SQL-function surface for the two legacy names; indicators, `Function_Name`, `Specific_Name`, `*LIBL`, `FENCED` / activation group have no equivalent | **accept-for-demo** | Nothing in modern needs the legacy names (the only candidate callers are QM queries with no source, c02 / c03 needs-SME), the two lock functions carry the rule under new names (P23–P28), and if a ported query ever needs `ISOTODATE40` it is a pack version bump, not a behaviour question. |
| CR-D2 | An invalid `8 0` date cannot reach the modern order lists | **accept-for-demo** | Postgres `date` columns cannot hold an invalid value (P29), so the legacy silent list-truncation (`-305` on an un-indicated fetch) has no path; this is recorded as a delta, not "fixed", and the SME question about tolerating invalid stored dates stays in `discovery/dat-utils/SME_BRIEF.md`. |
| CR-D3 | The DAT lock accepts years 0001–0099 as `test(de) *iso` does; the CUS pack's `lastOrderDateOf` returns `null` for them | **defer** | The two boundaries disagree on 730 sweep values (P21), all outside any business window; which rule the CUS boundary should follow is that pack's decision (`features/customer/**` is deny-listed here), taken at its next version with SUPERSEDE + re-bind, not invented by this run. |
| CR-D4 | `DatArgumentError` (38I02) for a non-`DECIMAL(8,0)` argument in TS and for a malformed ISO string on the way out | **accept-for-demo** | It is the as-is `*PSSR` contract (the statement fails, no NULL row — c05) applied to the only inputs a TS caller can pass that a packed `8 0` field could not hold (P12–P14); nothing consumes the module yet, so how a future HTTP surface presents it (400 vs 500) is that consumer's pack decision. |

Totals: 3 accept-for-demo, 1 defer (CR-D3).

Pack `known_risks` (from `PACK.yaml`):

| Known risk | Disposition | Evidence / one sentence |
| --- | --- | --- |
| Pathfinder waiver: no IBM i goldens; COMPARE only at TypeScript API | accept-for-demo (structural) | This whole run; `PARITY.yaml` `legacy_replay: SKIPPED`, `ibm_i_parity: NOT_CLAIMED`. |
| Date lock MUST match ORD: NULL for blank/never; 1940-01-01 / zero-date only at the boundary — do NOT invent a different sentinel | accept-for-demo — verified | §4 "Date lock": `dat_date_to_iso_num` equals ORD701's inline expression on every valid date (P26); no sentinel literal in DAT SQL code; ORD date columns nullable `date` (P22, P29); nothing else invented. |
| Dead ISO_Num_To_Date if QM queries unused (c03) | defer | `isoNumToDate` is one line and is the lock's shape, so carrying it costs nothing (P06–P08); whether to drop it is the SME's QM-query answer, not an engineering call. |
| 99999999 branch (c01) | defer | Reproduced as-is in `isoToDate40` and deliberately not folded into "never" by `fromLegacySentinelDate` (P01, P18); whether out-of-tree data ever holds 99999999 is the SME question that decides if the branch can go at the next pack version. |
| Align with existing ORD/CUS date boundary rules without widening those packs | accept-for-demo — verified (with CR-D3 open) | ORD701 expression equivalence (P26) and CUS `lastOrderDateOf` agreement outside years 0001–0099 (P21) are probed read-only; neither pack edited (§2). |
| Architecture DRAFT/BOUND does not authorize Convert; separate ROOM_OK required | n/a (procedural) | Chain honoured: BIND `ad697f3` → convert `ROOM_OK` (`c2a4762`) → convert `03e8bc1` / `5957461` → verification `ROOM_OK` (`1b9049c`) → this run. |
| CUS and ORD modern already exist; accidental re-scope of those packs is a fail | accept-for-demo — verified | §2: `features/customer/**`, `features/order/**`, both OpenAPI files, `src/db/**`, both packs untouched since `744ac29`; CUS / ORD / VAT suites unchanged and green. |

## 6. Explicitly not claimed / refused

- IBM i parity, `PARITY=GREEN`, `REPLAY_GREEN`, `legacy_green`, `parity_green`, behaviour `status: verified` — none. `inventory/atu-merlin/APP_MANIFEST.yaml` was not touched (pack `edit_surface.deny` and Field Guide: under a waiver the maximum is `converted` + `parity: WAIVED`).
- `PACK.yaml` `quality_gates.verification: DEFERRED` was not edited — BOUND is immutable; this run is the evidence the room reads next to it.
- Whole-estate verification — CUS / ORD / VAT not re-verified as this job's claim; ART untouched.
- "Repo fully migrated" or "DAT fully migrated" — no; see §1.
- Golden creation or RECORD — no `tests/characterization/**` exists and none was created.
- Discovery card edits — none needed; no harness bug blocked COMPARE.
- Fixing G-D1 or CR-D3 — not this station's edit; recorded for Conversion (G-D1) and the CUS pack (CR-D3).
- Any edit under `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`, `modern/src|test|db|openapi`.
- SME answers — none invented; `discovery/dat-utils/SME_BRIEF.md` stays unsigned with its five open questions.

## 7. Reproduce

```bash
cd modern && npm ci && ./scripts/local-pg.sh start
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run typecheck && npm test
npx tsx ../verification/dat-vertical/2026-09-09-r1/evidence/probe.mjs
```

The probe needs only a live `DATABASE_URL`: it creates a throw-away schema from `db/schema.sql`, runs the SQL cases there and drops it. The random sample is drawn fresh each run (`crypto.randomBytes`), so `results.json` counts are stable but the sampled values are not; the sweep is deterministic.

## 8. Follow-ups (not done here)

- Conversion: close G-D1 in `modern/README.md` (DAT c07 row, mapping-rules table) and `architecture/atu-merlin-dat/CONVERT_RECORD.md` (c07 row) — documentation only.
- Room / SME: sign off `discovery/dat-utils/SME_BRIEF.md` — the five open questions (QM-query callers of `ISO_Num_To_Date`; 1940-01-01 vs NULL presentation; collapsing the three sentinel copies; out-of-tree use of 99999999; build owner questions). Decide whether the 99999999 branch and `isoNumToDate` stay at the next pack version.
- CUS pack: decide CR-D3 (years 0001–0099 in `lastOrderDateOf`) and whether to adopt `fromLegacyIsoNum`; ORD pack: whether ORD701 adopts `dat_date_to_iso_num`. Each is a pack version bump + SUPERSEDE + re-bind.
- Next per the job header: Verify VAT if still open, then Convert cou → par → log (each needs its own `ROOM_OK` in the `AGENT_JOB.md` body).
- If the room ever wants parity against IBM i: legacy RECORD on the box first (Test execution station), then a real COMPARE — this run cannot be upgraded into that.
