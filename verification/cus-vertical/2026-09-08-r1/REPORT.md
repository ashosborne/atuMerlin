# Verification REPORT — CUS vertical (atuMerlin), run `2026-09-08-r1`

pack_id@version: **`atu-merlin-ts-cus-v1@1`** (`architecture/atu-merlin/PACK.yaml`, `status: BOUND`, bound 2026-09-08T16:06:38Z)
Station: Verification · Mode: **COMPARE at the TypeScript HTTP boundary only** · Characterization: **`WAIVED_PATHFINDER`**
Authorisation: Verification `ROOM_OK` in `overnight/AGENT_JOB.md` (Field + CTO room), separate from BIND and from the convert `ROOM_OK`.
Branch `cursor/atu-merlin-estate-discovery` @ `2860e7c` · PR [#1](https://github.com/ashosborne/atuMerlin/pull/1) → `master` · 2026-09-08 18:23–18:35 UTC · Cloud Agent (atuMerlin factory job runner)

## 1. Verdict

**`parity: TS_BOUNDARY_GREEN`** — see `PARITY.yaml`.

What that means, exactly:

- `npm run typecheck` is clean and `npm test` is 55/55 against live PostgreSQL 16.15.
- Every OpenAPI operation and every converted / as-is Discovery card behaves at the HTTP boundary the way the card and `modern/openapi/customer.yaml` say it should (31/31 live probe cases, `evidence/results.json`).
- Every card that is not fully carried (residual, blocked by pack, not implemented) has a stated reason; there are **no unexplained card gaps**.

What it does **not** mean:

- **Not `PARITY=GREEN` against IBM i.** No IBM i / COBOL / RPG goldens exist for this pathfinder and none were invented. `REPLAY_GREEN` is not claimed; `legacy_green` and `parity_green` stay `false`. The oracle here is the Discovery cards (read from source, never executed on the box) plus the inferred OpenAPI contract.
- Not "Merlin migrated". ORD, ART, country maintenance and everything else stay on IBM i with `interop: none`.

**Talk-track:** CUS pathfinder verified at TS API under waiver — not Merlin migrated.

## 2. Gate checks

| Gate | Result |
| --- | --- |
| `PACK.yaml` status | `BOUND` — proceed |
| Verification `ROOM_OK` in job body | present ("ROOM_OK: verification CUS vertical only (COMPARE at TypeScript API)") |
| Convert complete | yes — `CONVERT_RECORD.md`, `modern/**` at `a63d416`, handoff `PARITY=UNVERIFIED` |
| Another job `RUN` | no — job header records AGENT_JOB was `DONE` before this fire; single job file |
| `overnight/stop.txt` | absent |
| Scope | CUS only (`cus-interactive`, `cus-modules`); ORD/ART untouched |
| Edit surface | written: `verification/cus-vertical/2026-09-08-r1/**`, `modern/README.md` (one status line), `overnight/AGENT_JOB.md` line 1. Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`, `modern/src|test|db|openapi` |
| Goldens | none exist; nothing RECORDed, nothing rewritten |

## 3. Commands run

Environment: Node v22.14.0 (pack minimum 20), PostgreSQL 16.15 (`modern/scripts/local-pg.sh`, port 54329), fresh `npm ci`.

| Command | Result | Evidence |
| --- | --- | --- |
| `cd modern && npm run typecheck` | `tsc --noEmit` exit 0, no diagnostics | `evidence/typecheck-and-vitest.log` |
| `cd modern && npm test` | vitest 3.2.7: **3 files, 55 tests, 55 passed** (`customer.api.test.ts` 29, `fcustomer.test.ts` 16, `customer.web.test.ts` 10), 1.12 s | `evidence/typecheck-and-vitest.log` |
| live COMPARE probe (`evidence/probe.mjs`) against `PORT=3100 tsx src/server.ts` on a freshly seeded `atu_merlin_verify` database | **31 PASS / 0 FAIL** | `evidence/results.json` |

The vitest suite is modern's own; on its own it never sets a green flag (Field Guide anti-greenwash). The probe is the independent check: it drives each OpenAPI operation over HTTP and asserts the response *shape* (exact key sets from the contract schemas) and the *behaviour* the card describes. Where the card describes a legacy quirk preserved as-is (c04 `dup > 1`, c08 `CUMODID` create-only, c11 no `CUDEL` writer) the probe asserts the quirk, not a fix.

## 4. Card COMPARE — cards vs OpenAPI routes vs tests vs probe

Legend: route = OpenAPI operation or web path; test = vitest block; probe = case id in `evidence/results.json`.

### cus-interactive

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 list, POSTO, 14/page, More/Bottom, resume | converted | `GET /api/customers`, `/customers` | api c01 (4), web list (3) | P01 P02 P03 P28 | match; byte-order collation is CR-1 |
| c02 create, CUSSEQ 1551 | converted | `POST /api/customers`, `/customers/new` | api c02/c08 (3) | P05 P06 | match; first id drawn was 1551 |
| c03 update option 2 | converted | `PUT /api/customers/{cuid}`, `/customers/:id/edit` | api c03/c08 (5) | P11 P13 P14 | match; 404 on unknown id is CR-4 |
| c04 validation | **as-is** | in POST/PUT | api c04 (9) | P07 P08 P09 P10 P12 | match incl. one-pass reporting, blank-phone skip, CRT `dup > 0`, UPD `dup > 1` gap preserved |
| c05 F4 country prompt | converted | `GET /api/countries` | api c05 | P04 | match |
| c06 option 5 → ORD200 | **residual** | none (by pack) | api c06 | P23 P30 | no orders route; web shows `5=Orders` as a non-link muted marker citing c06. Blocked by pack `stay_legacy`, explained |
| c07 sentinel last-order date | converted | in GET detail | api c07 | P15 P16 P17 | match; invalid stored date → `null` is CR-6 |
| c08 audit stamping | **as-is** | in POST/PUT | api c02/c08, c03/c08 | P05 P11 | match; `CUMODID` untouched on `PUT` even with a different `X-User-Id` |
| c09 inquiry, ERR0103 | converted | `GET /api/customers/{cuid}`, `/customers/inquiry` | api c09/c10, web inquiry | P20 P21 | match incl. zero-suppressed id (`Code  Unknown.` for 0) |
| c10 detail with country name | converted | `GET /api/customers/{cuid}`, `/customers/:id` | api c09/c10, web detail | P15 P18 | match; blank name for unknown code |
| c11 no delete path | **as-is** | no `DELETE` | api c11 | P19 P22 P24 | match; `DELETE` → 404, row still readable, only fixture 1005 has `CUDEL='X'` |
| c12 subfile option validation | residual | per-row links | web list | P29 P30 | nothing to compare over HTTP; explained |

### cus-modules

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 eleven getters | converted | none (TS module) | fcustomer c01 (4) | — | tested at module boundary only; no HTTP surface by design (no `ATU_SRC` caller except `GetCusName`) |
| c02 ExistCus | converted | none | fcustomer c02/c03 | — | module boundary |
| c03 IsCusDeleted | converted | none | fcustomer c02/c03 | — | module boundary; only uppercase `X` counts |
| c04 lazy open + last-key cache | **residual** | — | fcustomer "not cached" | — | miss semantics kept; cache deliberately absent — CR-8, explained |
| c05 CloseCUSTOME1 | residual | — | — | — | nothing to close; explained |
| c06 SltCustomer 14/page look-ahead | converted | `GET /api/customers/search`, `/customers/select` | fcustomer c06/c11 (8) | P24 P25 P27 P28 | match; 20-row seed pages 14 + 6 with `more`/`nextOffset` |
| c07 option 1 single selection | residual | per-row link | web selector | — | explained |
| c08 criteria re-prepare, F3/F12 | residual | stateless form | web selector | — | explained |
| c09 dynamic SQL concatenation | **resolved by pack** | in search | fcustomer c09 | P26 | quote is literal, `%` still a wildcard — CR-7 |
| c10 dormant GetCusLastOrdDate | not implemented | — | — | — | no card exists (needs-SME at bind); nothing to compare |
| c11 blank criteria list all incl. deleted | converted | in search | fcustomer c11 | P24 | match |

**Unexplained gaps: none.** Every card is either matched at the boundary or carries a reason that traces to the pack (`stay_legacy`, `forbidden`, stateless target) or to a bind-time needs-SME.

### Contract gaps found (documentation-level, not behaviour drift)

| Id | Gap | Severity | Suggested owner |
| --- | --- | --- | --- |
| G-1 | `GET /health` exists (`src/app.ts`) but is not in `openapi/customer.yaml` | low | Conversion follow-up: add or mark operational |
| G-2 | `positionTo` schema says `maxLength: 10`; the server *cuts* to 10 (POSTO 10A) rather than rejecting. The description text is right, the schema constraint would make a strict validator 400 | low | Conversion follow-up: drop `maxLength`, keep the description |
| G-3 | `{cuid}` schema is `integer 0..99999`; a six-digit or non-numeric segment gets `404 ERR0103` (`Code 100000 Unknown.` / `Code  Unknown.`), not `400`. Within the listed responses for `GET`; a strict validator would answer 400 first | low | Conversion follow-up: document 404 for malformed ids or add a 400 |

Web paths (`/customers/**`) are intentionally outside the OpenAPI contract (`api_contract_policy.contract_paths` names only the JSON API); they were smoke-checked (P29) and the CUS200 option-5 rendering was checked (P30).

## 5. CONTRACT_RISK CR-1..CR-9 — accept-for-demo or defer

No line below claims an IBM i match. "Accept-for-demo" means the delta is acceptable for the pathfinder demo as documented in `modern/README.md`; "defer" means the room or an SME must decide before anything beyond a demo.

| Id | Delta (from `modern/README.md`) | Disposition | One sentence |
| --- | --- | --- | --- |
| CR-1 | List/search order is byte order (`COLLATE "C"`), not EBCDIC | **accept-for-demo** | Ordering is deterministic and tested; digits/upper/lower interleave differently from the IBM i, which no CUS consumer depends on, but a cutover would need an explicit collation decision. |
| CR-2 | Id drawn from `cusseq` at save, not when the create form opens | **accept-for-demo** | Stateless HTTP makes "reserve on F6" meaningless and the change only reduces gaps; `START WITH 1551, NO CYCLE` is preserved (P05: first id 1551). |
| CR-3 | `CUCREA` is the save date, not the program start date | **accept-for-demo** | The two differ only when a legacy session straddles midnight; save date is the defensible modern reading. |
| CR-4 | Unknown id on update → `404 ERR0103` | **accept-for-demo** | Replaces an unchecked RPG exception on a stale row with a defined error using the existing message (P13). |
| CR-5 | Over-long values → `400 FIELD_TOO_LONG`; non-numeric credit → `400 FIELD_INVALID` | **accept-for-demo** | 5250 field lengths made these inputs impossible, so the modern boundary must choose and rejecting is safer than truncating (P10). |
| CR-6 | Invalid stored `CULASTORD` presents `lastOrderDate: null` | **defer** | Legacy surfaced bad data as a hard failure in `S02prp`; silently presenting `null` hides a data-quality problem and an SME should decide between tolerate, flag, or reject before real data is loaded. |
| CR-7 | Selector criteria are bound parameters | **accept-for-demo** | Mandated by pack `forbidden: String-concat SQL`; the user-visible `%`/`_` wildcard behaviour is kept as-is and quotes are now literal (P26). |
| CR-8 | No per-activation-group state: getter cache, persisted selector criteria, record lock across the edit screen | **defer** | Losing the cache and criteria is harmless, but losing the record lock means two concurrent edits are last-write-wins with no warning, which needs an optimistic-concurrency decision (for example `cumod` as a version) before multi-user use. |
| CR-9 | `COUNTRY` exists as a read-only dependency table with fixture rows | **accept-for-demo** | c04/c05/c10 need `ExistCountry`/`GetCountryName` and the pack keeps `cou-maintain` legacy; fixture rows are enough for the demo and a data load is a later decision. |

Totals: 7 accept-for-demo, 2 defer (CR-6, CR-8).

## 6. Explicitly not claimed / refused

- IBM i parity, `PARITY=GREEN`, `REPLAY_GREEN`, `legacy_green`, `parity_green`, behaviour `status: verified` — none. `inventory/atu-merlin/APP_MANIFEST.yaml` was not touched (pack `edit_surface.deny` and Field Guide: under a waiver the maximum is `converted` + `parity: WAIVED`).
- Whole-estate verification — ORD/ART untouched.
- Golden creation or RECORD — no `tests/characterization/**` exists and none was created.
- Discovery card edits — none needed; no harness bug blocked COMPARE.
- Any edit under `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`.

## 7. Reproduce

```bash
cd modern && npm ci && ./scripts/local-pg.sh start
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run typecheck && npm test
createdb -h 127.0.0.1 -p 54329 atu_merlin_verify
DATABASE_URL=postgres://$(id -un)@127.0.0.1:54329/atu_merlin_verify npm run db:seed
DATABASE_URL=postgres://$(id -un)@127.0.0.1:54329/atu_merlin_verify PORT=3100 npx tsx src/server.ts &
BASE_URL=http://127.0.0.1:3100 DATABASE_URL=postgres://$(id -un)@127.0.0.1:54329/atu_merlin_verify \
  node ../verification/cus-vertical/2026-09-08-r1/evidence/probe.mjs
```

The probe expects a freshly seeded database (it mutates rows 1003/1004 and inserts 20 paging rows).

## 8. Follow-ups (not done here)

- Conversion: close G-1..G-3 in `modern/openapi/customer.yaml` (documentation only).
- Room / SME: decide CR-6 and CR-8; sign off `discovery/cus-interactive/SME_BRIEF.md` and `discovery/cus-modules/SME_BRIEF.md` (c04, c08, c11 quirks are still preserved as-is).
- If the room ever wants parity against IBM i: legacy RECORD on the box first (Test execution station), then a real COMPARE — this run cannot be upgraded into that.
