# Verification REPORT — COU vertical, FCOUNTRY half (atuMerlin), run `2026-09-09-r1`

pack_id@version: **`atu-merlin-ts-cou-v1@1`** (`architecture/atu-merlin-cou/PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded; BOUND tip ad697f3)
Station: Verification · Mode: **COMPARE at the TypeScript boundary only** (plus the additive `country` / `countr1` mapping) · Characterization: **`WAIVED_PATHFINDER`** (ADR 0001)
Authorisation: Verification `ROOM_OK` in `overnight/AGENT_JOB.md` (line 5: "ROOM_OK: Ash standing clearance 2026-09-08 + proceed last-10 2026-09-09; Field+CTO Convert ROOM_OK residual batch 2026-09-09"), separate from BIND and from the convert `ROOM_OK`. Paste: `PASTE-verify-cou-vertical-atu-merlin.md` (job body @ `66c1801`).
Branch `cursor/atu-merlin-estate-discovery` @ `66c1801` · PR [#1](https://github.com/ashosborne/atuMerlin/pull/1) → `master` · 2026-09-09 18:43–19:05 UTC · Cloud Agent (atuMerlin factory job runner, sole run)

## 1. Verdict

**`parity: TS_BOUNDARY_GREEN`** — see `PARITY.yaml`.

What that means, exactly:

- `npm run typecheck` is clean and `npm test` is 306/306 against live PostgreSQL 16.15 (41 COU in `test/fcountry.test.ts`; the 55 CUS, 56 ORD, 27 VAT, 63 DAT, 40 PAR and 24 LOG tests unchanged and green).
- Every export of `modern/src/shared/fcountry/index.ts` behaves the way the six FCOUNTRY cards (`cou-maintain-c07` … `c12`) and the README COU section say it should, checked by a probe whose oracles were written from the cards, not from the module or its vitest suite. The COU301 keyed read (`s01prp` SETLL + read, `S01lod` 20 rows + one look-ahead) is replayed in JavaScript over a byte-order sort of a plain `SELECT` and compared with `sltCountry` page by page on 1 020 (position, offset) pairs in both orders over 53 rows; the `S01chk` row loop, the control-line checks in card order and the `S01act` branch order are an explicit state machine that the module's reducer is driven against on a 512-row truth table, 192 F8 combinations and 1 500 random sessions (8 634 steps) — 27/27 cases (`evidence/results.json`).
- The buffer rules the cards describe are observed, not inferred: a query-counting proxy around the pool shows **0** SQL statements for a blank code from all three getters with a blank-keyed row present (c07 kept) and **5** reads for 5 calls on one code / **2** on the CUS200 prompt-then-check path (CR-C1 — the deliberate no-cache delta, seen as such).
- The planted behaviours and known risks are present and asserted as-is, not fixed (§4, "Preserved").
- Every card is either matched at the boundary or carries a reason that traces to the pack; there are **no unexplained card gaps**. Four **observations** were recorded (§4, G-C1 … G-C4): a wrong sentence in the README's CR-C4 rationale, `dft` returned verbatim while `keycod` is its 2A view, the CUS-consumed getters now normalise inputs CUS cannot pass, and OFFSET-based resume between loads. None changes an answer for any input reachable in modern today.

What it does **not** mean:

- **Not `PARITY=GREEN` against IBM i.** No IBM i / RPG goldens exist for this pathfinder and none were invented. `REPLAY_GREEN` is not claimed; `legacy_green` and `parity_green` stay `false`; `replay_green_run_ids` stays `[]`. The oracle here is the Discovery cards (read from source, never executed on the box) and the README's stated contract.
- Not "Merlin migrated", and not "COU migrated": the COU200 "Work with Countries" panel half (`c01`–`c06`, `c13`) — the only writer of `COUNTRY` — is deferred / `stay_legacy` in the pack and was neither compared nor modelled here; its absence in modern was verified (P27). The FCOUNTRY half is a shared TypeScript module with no HTTP surface and no web selector; the CUS form still uses its datalist.
- CUS, ORD, VAT, DAT, PAR and LOG are not re-verified as this job's claim. The CUS consumer shape is *read* by one probe case (P24) to confirm the CUS-reachable answers did not move; nothing under `features/customer/**` is edited and no sibling pack is widened.

**Talk-track:** COU FCOUNTRY residual verified at TS API under waiver — not Merlin migrated; the COU200 panel half is still on IBM i.

## 2. Gate checks

| Gate | Result |
| --- | --- |
| `PACK.yaml` status | `BOUND` — proceed |
| Verification `ROOM_OK` in job body | present (`overnight/AGENT_JOB.md` line 5) |
| Convert complete | yes — `architecture/atu-merlin-cou/CONVERT_RECORD.md`, `modern/src/shared/fcountry/index.ts` at `e90dfb2`, docs `0a6aa22`, DONE stamp `418d5cf`, handoff `PARITY=UNVERIFIED` |
| Another job `RUN` (Smith gate) | no — `list-cloud-agents` showed this run as the only active automation run at start and again before the first commit; branch head = trigger head `66c1801`; `AGENT_JOB.md` line 1 `RUN` on origin both times |
| `overnight/stop.txt` | absent |
| Scope | COU FCOUNTRY half only (`cou-maintain` c07–c12, shared `fcountry`). COU200 (c01–c06, c13) not compared, not modelled. CUS / ORD / VAT / DAT / PAR / LOG not re-verified; ART untouched |
| Edit surface (STRICT per job) | written: `verification/cou-vertical/2026-09-09-r1/**` and `overnight/AGENT_JOB.md` line 1 only. Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**` (this pack's `PACK.yaml` stays `verification: DEFERRED` — BOUND is immutable), `modern/**` including `modern/README.md` (its COU status sentences still read "Verification deferred" — see §8) |
| CUS / ORD packs not widened | `git diff 6246243..HEAD -- modern/src/features modern/openapi modern/src/db modern/src/app.ts modern/src/server.ts architecture/atu-merlin architecture/atu-merlin-ord architecture/atu-merlin-vat architecture/atu-merlin-dat` shows only `modern/src/features/par/**` and the additive `app.ts` registration — the PAR pack's own convert; the first 308 lines of `modern/db/schema.sql` (CUS + ORD + VAT + DAT objects, including the `country` `CREATE TABLE`) are byte-identical to the pre-convert tip `6246243`; CUS / ORD suites 55 / 56 unchanged |
| `ATU_SRC/**` | `git diff origin/master..HEAD -- ATU_SRC` is empty |
| FCountry shape CUS consumes | `existCountry` / `getCountryName` / `listCountries` signatures unchanged from `6246243`; `customer.api.test.ts` 29 + `customer.web.test.ts` 10 + `fcustomer.test.ts` 16 green without edit; P24 confirms the CUS-reachable answers are the same (G-C3 records the widening outside that domain) |
| Goldens | none exist; nothing RECORDed, nothing rewritten |

## 3. Commands run

Environment: Node v22.14.0 (pack minimum 20), PostgreSQL 16.15 (`modern/scripts/local-pg.sh`, port 54329), fresh `npm ci`.

| Command | Result | Evidence |
| --- | --- | --- |
| `cd modern && npm run typecheck` | `tsc --noEmit` exit 0, no diagnostics | `evidence/typecheck-and-vitest.log` |
| `cd modern && npm test` | vitest 3.2.7: **11 files, 306 tests, 306 passed** (`dat.test.ts` 63, `order.api.test.ts` 47, `fcountry.test.ts` 41, `customer.api.test.ts` 29, `fvat.test.ts` 27, `par.api.test.ts` 27, `samlog.test.ts` 24, `fcustomer.test.ts` 16, `parm.test.ts` 13, `customer.web.test.ts` 10, `order.web.test.ts` 9), 8.04 s | `evidence/typecheck-and-vitest.log` |
| independent COMPARE probe (`DATABASE_URL=... npx tsx evidence/probe.mjs`) | **27 PASS / 0 FAIL** (run three times; counts stable, random sessions differ) | `evidence/results.json` |

The vitest suite is modern's own; on its own it never sets a green flag (Field Guide anti-greenwash). The probe is the independent check. Its three oracles are written from the cards: (1) the fixed-length `2A` / `30A` parameter (truncate right, ignore trailing blanks) for c07 / c09 keys; (2) the COU301 keyed read — every `country` row fetched with a plain `SELECT` (no `ORDER BY`), sorted by `Buffer.compare` on the key with code as tie-break, `SETLL` as "first key ≥ position", 20 rows, one look-ahead read for More / Bottom; (3) the selector state machine — the `S01chk` row loop with the `SLT01` / `STS01` / `ERR01` latches, the control-line checks in the card's order (41, then 42, then the F8-while-options-typed guard), and the `S01act` branch order (`IN08` before `OPTC1 = 8` before the selected row) with the key of the order *entered* cleared on toggle. It then builds a throw-away schema through `modern/test/helpers/db.ts`, wraps the pool in a query-counting proxy, and exercises the five methods and the four reducer functions.

Two probe cases failed on their first run, both probe-script faults, neither a module fault: P26 inserted a 32-character name into the `varchar(30)` column (22001) — shortened; P25 ran on the fixture alone because an earlier case had cleared the extra rows, so its "module order == byte order" check had one element — the sample codes are now inserted inside the case. No module or server behaviour was changed. The committed `results.json` is the clean run.

## 4. Card COMPARE — cards vs module exports vs tests vs probe

Legend: export = function or method in `modern/src/shared/fcountry/index.ts`; test = vitest block in `test/fcountry.test.ts`; probe = case id in `evidence/results.json`.

### cou-maintain (FCOUNTRY half — c07 … c12)

| Card | README status | Export | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c07 GetCountryName / GetCountryIso3 / ExistCountry over one cached keyed chain; unknown → cleared buffer; blank never reads; no delete flag | converted (as-is) | `existCountry`, `getCountryName`, `getCountryIso3` (private `chain`) | c07 (7) | P01–P08 | match: every fixture row returns `COUNTR` / `COISO` / `true`; 668 unknown `AA`..`ZZ` codes give blanks / `false` and throw nothing; **0** SQL statements for `""` / `" "` / `"  "` with a blank-keyed row present (**blank code never reads** kept); 32 case / leading-blank / swapped variants miss unless byte-equal; `2A` by-value == fixed-length-alpha oracle on 2 000 random strings and through the table (`FRA` → FR, `FR ` → France, `F` → miss). `country` is `coid varchar(2)` PK, `countr varchar(30)`, `coiso varchar(3)`, no delete flag; 3 / 31 / 4-character values rejected (22001). The **hit cache is not reproduced**: 5 reads for 5 calls, a changed row seen at once (CR-C1, observed) |
| c08 GetCountryIso3 has no caller; closeCOUNTRY not exported | converted (needs-SME) | `getCountryIso3`; no `close*` | c08 (3) | P09, P10, P22 | match: `getCountryIso3` is a method; no consumer in `modern/src` outside `shared/fcountry` (32 `.ts` files scanned); nothing named `close*` on the instance or among the module's exports; the window rows are `{ coid, countr }` only — `COISO` never reaches the selector. Nothing invented, `coiso` kept — **needs-SME stays open** |
| c09 SltCountry: SETLL `pcod`, by code or by name over COUNTR1, 20 rows per load, More / Bottom by look-ahead, option 1 returns the COID, F3 / F12 return `pcod`; beyond the last key → empty window | converted (as-is) | `sltCountry`, `sltCountryOpen`, `sltCountryRequest`, `sltCountryAct` (return / select) | c09 (13) | P10–P16, P26 | match: 546 by-code and 474 by-name (position, offset) pairs over 53 rows (digit / upper / lower codes, exact-case name pairs, three literal `Korea` rows, `Åland` / `Ørland`) equal the keyed-read oracle; 19 / 20 / 21 / 40 / 41-row tables page `[19 Bottom]`, `[20 Bottom]` (exactly 20 left shows Bottom at once), `[20 More, 1 Bottom]`, `[20, 20 Bottom]`, `[20, 20, 1]`; beyond the last key → `{ rows: [], more: false, nextOffset: null }` with nothing thrown and **no message invented**; entry state `{ code, keycod = pcod, keydes "", dft = pcod }`, F3 / F12 return `dft` even with options typed, option 1 returns the row's COID. Duplicate names adjacent with code tie-break (CR-C4). **G-C2** and **G-C4** below |
| c10 F8 toggles and clears the key of the order *entered*; `pcod` lost after toggle away and back; F8 ignored while options typed; F8 + position-to toggles and discards | converted (as-is) | `sltCountryAct` (toggle branch) | c10 (6) | P17, P18, P20 | match: the card's four-step trace reproduced exactly (`name:""`, `name:"Ne"`, `code:""`, `name:""`; `dft` stays `IT`; K kept after the first toggle, D = `Ne` kept after the second, neither ever read); 192 F8 × row-set × control × position × order combinations equal the oracle; 1 500 random sessions match state, outcome and `s01prp` request at every one of 8 634 steps. **Position retention is not invented — needs-SME stays open** |
| c11 S01chk: row 0 / 1 only (35), one `1` (36), control 0 / 8 only (41), 8 refused with a selection pending (42); cumulative; first offending row; option 8 repositions, text not validated | converted | `sltCountryCheck`, `sltCountryAct` (position-to branch) | c11 (9) | P18–P21 | match: the 512-row truth table (3 rows × {0,1,2,9} × control {0,1,8,9} × F8) equals the oracle on the indicator set in order, `firstErrorRrn`, `selected`, `optionsTyped` and the branch taken — 26 distinct indicator sets seen, including `35,36,41,42`; option 8 repositions and the reload equals the oracle page in both orders; blank position returns to the top (the recovery from an empty window); `zz` / 40 × `x` → empty window (text not validated). RI / cursor attributes are presentation (CR-C5) |
| c12 Export surface: four symbols under `'V1'`, `ACTGRP(*CALLER)`, two binding routes, four callers | converted | `FCountry` methods; module exports | c12 (3) | P22–P24 | match: instance keys are exactly `existCountry, getCountryIso3, getCountryName, sltCountry` (the four `FCOUNTRY.BND` symbols) + `listCountries` (CUS surface); module exports are `createFCountry`, `normaliseCountryCode`, `normaliseCountryName`, `sltCountryOpen / Check / Act / Request` and four constants; `countr1` index on `(countr COLLATE "C", coid COLLATE "C")` next to the PK only, comments cite c13 / c08 / c09. Signature / binding directory / activation group have no TS equivalent (CR-C2, explained). CUS-reachable inputs (136 values, ≤ 2 chars right-trimmed) answer exactly as the pre-convert surface did; `listCountries` unchanged. The RPG callers map: CUS200 / CUS250 → the CUS pack (already on `getCountryName` / `existCountry` / `listCountries`), PRO200 / PRO250 → `pro-interactive` (unbound, not converted) |
| c01–c06, c13 COU200 panel half | deferred (not in this pack) | — (deliberately absent) | — | P27 | **absence verified**, nothing modelled: the only route naming countries is the CUS `GET /api/countries` datalist (no POST / PUT / DELETE), no `src/features/cou`, the only writer of `country` in `src` is the CUS seed (`src/db/seed.ts`), no COU OpenAPI file. `BLOCKED_BY_PACK` in `PARITY.yaml` |

**Unexplained gaps: none.** Every card is either matched at the boundary or carries a reason that traces to the pack (`stay_legacy` COU200, `contract_paths: []`, `deny` on `features/customer/**`, stateless server) or to a bind-time needs-SME.

### Schema — `country` / `countr1` mapping (pack mapping rule "PF COUNTRY / LF COUNTR1 → postgres table / index (additive)")

| Check | Probe | Observed |
| --- | --- | --- |
| Column-for-column from `COUNTRY.PF` | P08 | `coid varchar(2)` PK, `countr varchar(30)`, `coiso varchar(3)`, all `NOT NULL`; no delete flag (exists = row present, as the card says) |
| Field bounds | P08 | a 3-character code, a 31-character name and a 4-character ISO are rejected by the column types (22001) |
| `COUNTR1.LF` → index | P23 | `CREATE INDEX countr1 ON country (countr COLLATE "C", coid COLLATE "C")`; PK + `countr1` are the only indexes; comments name COU200 (c13) as the only writer and cite c08 / c09 |
| Additive | §2 | first 308 lines of `schema.sql` byte-identical to `6246243`; the COU section is one `CREATE INDEX IF NOT EXISTS` and three `COMMENT ON` |

### Preserved (planted / known_risk / as-is), asserted, not fixed

| Behaviour | Where asserted | Observed |
| --- | --- | --- |
| Blank code never reads `COUNTRY` (c07) | P03 | 0 SQL statements; blank-keyed row `Nowhere` invisible |
| Unknown code → blanks / `false`, no message (c07) | P02 | 668 codes, nothing thrown |
| `GetCountryIso3` exported with no caller; nothing to close (c08) | P09, P22 | method present, 0 consumers outside the module, no `close*` |
| Empty window beyond the last key, no message (c09) | P14, P21 | empty page, nothing thrown, in both orders and via option 8 |
| F8 clears the key of the order entered; `pcod` position lost (c10) | P17 | trace reproduced; `dft` unaffected |
| Option 8 with a `1` pending refused (42), position not applied; text not validated (c11) | P19, P21 | truth table; `zz` → empty window |
| No COU200 maintenance path; no writer of `country` (deferred half) | P27 | one GET route, one seed writer, no `features/cou` |
| Last-key hit cache (c07) — **not** reproduced | P06, P07 | recorded and observed as CR-C1; the SME question (cache staleness acceptable for reference data) decides whether it is ever noticed, not whether the code changes |

### Observations found (not behaviour drift on any card for a reachable input)

| Id | Gap | Severity | Suggested owner |
| --- | --- | --- | --- |
| G-C1 | `modern/README.md` COU section, CR-C4 "Why" column says "Digits before letters and upper before lower hold in both" byte order and the EBCDIC keyed order. They do not: in EBCDIC (CP037) lower-case letters (`0x81`–`0xA9`) sort before upper-case (`0xC1`–`0xE9`) and digits (`0xF0`–`0xF9`) sort after every letter. P25 shows the eleven sample codes in module order `1A 9Z A AA AZ BE ZZ a aa az zz` and in EBCDIC order `a aa az zz A AA AZ BE ZZ 1A 9Z`. Only "blank first" and the relative order of upper-case-only codes agree. The delta itself (byte order, not EBCDIC) is correctly declared, tested and dispositioned below; the sentence describing where it is invisible is wrong. The same sentence appears in the PAR section (CR-P3, "digits before upper before lower hold in both") — noted, not this pack's claim | low | Conversion documentation fix at the next README touch: replace with "blank first and the relative order of upper-case-only codes / capitalised names hold in both; digits, lower-case and accented characters order differently". Not this station's edit (STRICT surface) |
| G-C2 | `sltCountryOpen(pcod)` sets `keycod = normaliseCountryCode(pcod)` but `dft = pcod` verbatim, so `sltCountryOpen("FRA")` positions at `FR` and returns `"FRA"` on F3 / F12 (P16). On the box `pcod` is a `2A` field passed by reference so the two views cannot differ. No modern caller passes anything to `sltCountryOpen` yet — the CUS form keeps its datalist (deny) | low | Conversion at the next pack version: `dft: normaliseCountryCode(pcod)` or document that callers pass a `2A` value. One line, no card behaviour changes |
| G-C3 | `existCountry` / `getCountryName` are consumed by the CUS pack (`customer.service.ts`) and now normalise their argument — cut to two characters, trailing blanks ignored, blank short-circuits with no read — where the pre-convert surface compared the raw value (`WHERE coid = $1`, one read even for blank). `FRA` and `FR ` now hit `FR` (P24). Every input CUS `parseInput` can pass (≤ 2 characters, right-trimmed) answers identically — 136 values checked — so nothing CUS-reachable changed and the CUS suites are green without edit; but `CONVERT_RECORD.md` and the README's "Edit surface honoured" describe the CUS surface as "unchanged", which is true of the signatures and of `listCountries`, not of the two getters' acceptance | low | Conversion documentation: state that the CUS-facing getters were widened to the `2A` by-value contract (CR-C3) with identical answers on the CUS-reachable domain. No code change needed |
| G-C4 | `sltCountry` resumes the next load with `OFFSET $3` from the position; the legacy `S01lod` resumed from the saved look-ahead row (`SAVCOD` / `SAVDES`), a key-based resume. With a row that sorts before the resume point inserted between two loads, the module repeats the last row of the previous page (P26: `R2` appears on both pages) and would skip one after a delete; the legacy would not. `COUNTRY` has no writer in modern (COU200 deferred) and is reference data, so the case is not reachable in the demo | low | Conversion at the next pack version: resume from the last row's key (`WHERE key > $last`) instead of `OFFSET` — the ORD / CUS lists already use key cursors (`cursorName` / `cursorId`). Not this station's edit |

## 5. CONTRACT_RISK CR-C1..CR-C5 and pack `known_risks` — accept-for-demo or defer

No line below claims an IBM i match. "Accept-for-demo" means the delta is acceptable for the pathfinder demo as documented in `modern/README.md`; "defer" means the room or an SME must decide before anything beyond a demo. No SME answer is invented here.

| Id | Delta (from `modern/README.md`) | Disposition | One sentence |
| --- | --- | --- | --- |
| CR-C1 | No last-key cache and no activation-group state: every getter call reads `country`; a row changed between two calls is seen at once; there is nothing to close | **accept-for-demo** | The only observable difference is the read count (P06: 5 reads for 5 calls; P07: 2 on the CUS200 prompt-then-check path) and that a row changed mid-session is seen at once rather than at the next code switch — `COUNTRY` has no writer in modern and its legacy writer COU200 is deferred, so the case is reachable only by out-of-band edits; a per-request re-read is the direction any stateless target takes, and the open c07 SME question (staleness acceptable for reference data?) decides whether anyone would notice, not whether the code should hold stale names. |
| CR-C2 | No binder signature / binding directory / activation group | **accept-for-demo** | A TypeScript import resolves the four symbols at build time (P22: exactly four methods plus `listCountries`, nothing named `close*`), which is a stricter check than the hand-written `'V1'` literal that never protected callers against an export change (c12); the `'V1'` bump practice, the callers' activation group and `PRO200`'s explicit `BNDSRVPGM` stay build-owner questions with no TS counterpart. |
| CR-C3 | `2A` by-value contract: a longer code is cut to two characters, trailing blanks ignored, case kept as typed | **accept-for-demo** | It reproduces what the by-value call did for free on the box (P05: 2 000 random strings equal the fixed-length-alpha oracle; `FRA` → FR, `F` → miss), case is not folded because the uppercasing was the 5250 session's (`POSCOD` without `CHECK(LC)`), and the two edges it leaves — `dft` returned verbatim (G-C2) and the widened acceptance on the CUS-consumed getters (G-C3) — are recorded with no modern path to them. |
| CR-C4 | Ordering is byte order (`COLLATE "C"`), not the EBCDIC keyed order; equal names tie-broken by code | **accept-for-demo** | The module does exactly what it declares (P11 / P12: 1 020 pages equal a `Buffer.compare` oracle; P15: `Korea` × 3 adjacent in code order) and the fixture's upper-case codes and capitalised names order identically under EBCDIC (P25 `upperOnly: true`), so the demo shows no difference; the README's claim about *where* the orders agree is wrong (G-C1) and should be corrected, but the correction does not change the disposition — a code starting with a digit or a name starting lower-case would list in a different place than on the box, and there are none. |
| CR-C5 | The COU301D window (subfile, 10-row pages, `SFLRCDNBR`, RI / cursor attributes, F8 legend) is not reproduced; no HTTP or web surface | **defer** | The demo does not need it — the CUS form keeps its datalist and `sltCountry` + the reducer carry every rule and indicator number as data (P19: 512-row truth table; P21: reposition + reload) — but whether a web selector ever consumes them, and whether the CUS F4 prompt is rewired to it, is the room's decision at the next pack version (`contract_paths`, possibly a CUS SUPERSEDE + re-bind), together with the c09 / c10 needs-SME items (empty-window message, position retention) that only matter once there is a presentation; nothing is invented by this run. |

Totals: 4 accept-for-demo, 1 defer (CR-C5).

Pack `known_risks` (from `PACK.yaml`):

| Known risk | Disposition | Evidence / one sentence |
| --- | --- | --- |
| Pathfinder waiver: no IBM i goldens; COMPARE only at TypeScript API | accept-for-demo (structural) | This whole run; `PARITY.yaml` `legacy_replay: SKIPPED`, `ibm_i_parity: NOT_CLAIMED`. |
| GetCountryIso3 unused export (c08) — do not invent consumer or dispose COISO without SME | accept-for-demo — verified preserved | P09: method present, 0 consumers outside the module; P08: `coiso varchar(3)` still a column; P10: never in a window row. The SME question (carry or reject) stays in `discovery/cou-maintain/SME_BRIEF.md`. |
| Do not invent COU200 presentation — panel half stay_legacy / deferred | accept-for-demo — verified absent | P27: one GET datalist route (CUS), no `features/cou`, the only writer of `country` is the CUS seed, no COU OpenAPI file. |
| Convert must consume FCOUNTRY/COU300/COU301 cards only until COU200 is carded and pack SUPERSEDEd | accept-for-demo — verified | §4: every export traces to c07–c12; nothing traces to c01–c06 / c13. |
| COU301 selector open questions (empty position message, F8 position retention) stay needs-SME | accept-for-demo — verified as-is | P14 / P21: empty window, no message; P17: `pcod` lost after toggle away and back. Both stay open in `SME_BRIEF.md`; see CR-C5. |
| Architecture DRAFT/BOUND does not authorize Convert; separate ROOM_OK required | n/a (procedural) | Chain honoured: BIND `ad697f3` → convert `ROOM_OK` (`6246243`) → convert `e90dfb2` / `0a6aa22` / `418d5cf` → verification `ROOM_OK` (`66c1801`) → this run. |
| CUS modern already has shared/fcountry; accidental rewrite of customer feature or widen of CUS pack is a fail | accept-for-demo — verified | §2: `features/customer/**`, `openapi/customer.yaml`, `architecture/atu-merlin/**` untouched since `6246243`; CUS suites 55 green without edit; P24: CUS-reachable answers unchanged, `listCountries` unchanged (G-C3 records the widening outside that domain as a documentation item). |
| modern/db/** additive only — do not reshape CUS or ORD schema | accept-for-demo — verified | §2 + P08 / P23: first 308 lines of `schema.sql` byte-identical to `6246243`; COU section is one index + comments; `country` column shape unchanged. |

## 6. Explicitly not claimed / refused

- IBM i parity, `PARITY=GREEN`, `REPLAY_GREEN`, `legacy_green`, `parity_green`, behaviour `status: verified` — none. `inventory/atu-merlin/APP_MANIFEST.yaml` was not touched (pack `edit_surface.deny` and Field Guide: under a waiver the maximum is `converted` + `parity: WAIVED`).
- `PACK.yaml` `quality_gates.verification: DEFERRED` was not edited — BOUND is immutable; this run is the evidence the room reads next to it.
- Whole-estate verification — CUS / ORD / VAT / DAT / PAR / LOG not re-verified as this job's claim; ART untouched.
- COU200 panel half — not compared, not modelled, not invented; `BLOCKED_BY_PACK`.
- "Repo fully migrated" or "COU fully migrated" — no; see §1.
- Golden creation or RECORD — no `tests/characterization/**` exists and none was created.
- Discovery card edits — none needed; no harness bug blocked COMPARE.
- Fixing G-C1 … G-C4 or deciding CR-C5 — not this station's edit (the job's edit surface is STRICT: `verification/cou-vertical/**` only); recorded for Conversion (G-C1 … G-C4) and the room (CR-C5). For the same reason `modern/README.md`'s two COU status sentences ("PARITY=UNVERIFIED (Verification deferred)") were **not** updated to point here, unlike the VAT / DAT verify runs — see §8.
- Any edit under `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`, `modern/**`.
- SME answers — none invented; `discovery/cou-maintain/SME_BRIEF.md` stays unsigned with its open questions (c07 cache staleness, c08 carry-or-reject, c09 empty-window message / position retention, c10 one selector rule with `fam-maintain`, c07 / c12 build-owner questions).

## 7. Reproduce

```bash
cd modern && npm ci && ./scripts/local-pg.sh start
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run typecheck && npm test
npx tsx ../verification/cou-vertical/2026-09-09-r1/evidence/probe.mjs
```

The probe needs only a live `DATABASE_URL`: it builds a throw-away schema through `modern/test/helpers/db.ts` (schema + CUS seed + ORD seed), runs every SQL-backed case there and drops it. The page sweeps and truth tables are deterministic; the random selector sessions (P20) and the random strings (P05) are drawn fresh each run (`crypto.randomBytes`), so `results.json` counts are stable but the sampled values (and the step total) are not.

## 8. Follow-ups (not done here)

- Conversion (next README touch, documentation only): close G-C1 (correct the CR-C4 rationale — and the same sentence under CR-P3), G-C3 (say the CUS-facing getters were widened to the `2A` contract with identical answers on the CUS-reachable domain), and point the two COU status sentences in `modern/README.md` (header line and the COU section's "PARITY=UNVERIFIED — Verification is deferred") at `verification/cou-vertical/2026-09-09-r1/PARITY.yaml` (`TS_BOUNDARY_GREEN` under the waiver), as the VAT / DAT sections do. This run did not touch `modern/README.md` because the job's edit surface was STRICT.
- Conversion (next pack version, one line each, no card behaviour changes): G-C2 (`dft` as the `2A` view of `pcod`), G-C4 (key-based resume instead of `OFFSET`).
- Room / SME: sign off `discovery/cou-maintain/SME_BRIEF.md` — c07 cache staleness, c08 carry-or-reject `GetCountryIso3` / `COISO`, c09 empty-window message, c09 / c10 position retention across the toggle, c10 one keyed-selector rule shared with `fam-maintain`, c07 / c12 build-owner questions (activation group, `'V1'` bump, `PRO200` `BNDSRVPGM`).
- Room: decide CR-C5 — whether a web selector consumes `sltCountry` + the reducer and whether the CUS F4 prompt is rewired to it (CUS pack version bump + SUPERSEDE + re-bind).
- COU200 panel half: Pack B cards c01–c06 / c13, then SUPERSEDE + re-bind before any maintenance path over `country`.
- Next per the job header: Verify PAR, then Verify LOG (each its own `AGENT_JOB` RUN). Pack B night-residual queue held.
- If the room ever wants parity against IBM i: legacy RECORD on the box first (Test execution station), then a real COMPARE — this run cannot be upgraded into that.
