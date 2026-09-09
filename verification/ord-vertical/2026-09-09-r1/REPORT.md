# Verification REPORT — ORD vertical (atuMerlin), run `2026-09-09-r1`

pack_id@version: **`atu-merlin-ts-ord-v1@1`** (`architecture/atu-merlin-ord/PACK.yaml`, `status: BOUND`, bound 2026-09-09T00:46:59Z by the atuMerlin migration room — Field 9.5/10 + CTO skim; Agent Smith recorded)
Station: Verification · Mode: **COMPARE at the TypeScript HTTP boundary only** · Characterization: **`WAIVED_PATHFINDER`** (ADR 0001)
Authorisation: Verification `ROOM_OK` in `overnight/AGENT_JOB.md` ("ROOM_OK: verification ORD vertical only", Field + CTO Verify ROOM_OK 2026-09-09), separate from BIND and from the convert `ROOM_OK`. Paste: `PASTE-verify-ord-vertical-atu-merlin.md` @ `3c4fb76`.
Branch `cursor/atu-merlin-estate-discovery` @ `3c4fb76` · PR [#1](https://github.com/ashosborne/atuMerlin/pull/1) → `master` · 2026-09-09 03:26–03:40 UTC · Cloud Agent (atuMerlin factory job runner)

## 1. Verdict

**`parity: TS_BOUNDARY_GREEN`** — see `PARITY.yaml`.

What that means, exactly:

- `npm run typecheck` is clean and `npm test` is 111/111 against live PostgreSQL 16.15 (47 ORD API, 9 ORD web, 55 CUS unchanged).
- Every OpenAPI order operation and every converted / as-is Discovery card behaves at the HTTP boundary the way the card, `modern/openapi/order.yaml` and the README ORD section say it should (48/48 live probe cases, `evidence/results.json`). The probe also reads the database after each write, so the ORD700 / ORD701 trigger arithmetic, the SAMLOG text, the date lock and the transactional delete are asserted, not assumed.
- The three planted defects are present and asserted as-is (§4, "Planted defects").
- Every card that is not fully carried (residual, needs-SME, not implemented, blocked by pack) has a stated reason; there are **no unexplained card gaps**.

What it does **not** mean:

- **Not `PARITY=GREEN` against IBM i.** No IBM i / RPG goldens exist for this pathfinder and none were invented. `REPLAY_GREEN` is not claimed; `legacy_green` and `parity_green` stay `false`; `replay_green_run_ids` stays `[]`. The oracle here is the Discovery cards (read from source, never executed on the box) plus the inferred OpenAPI contract.
- Not "Merlin migrated", and not "ORD fully migrated": ART, ORD900/ORD901, ART801, the `CVTSPLPDF` PDF step, the PARAMETER path lookup and every needs-SME item stay on IBM i or open. CUS was verified under its own pack (`verification/cus-vertical/2026-09-08-r1`) and is not re-verified here.

**Talk-track:** ORD pathfinder verified at TS API under waiver — not Merlin migrated.

## 2. Gate checks

| Gate | Result |
| --- | --- |
| `PACK.yaml` status | `BOUND` — proceed |
| Verification `ROOM_OK` in job body | present ("ROOM_OK: verification ORD vertical only (atu-merlin-ts-ord-v1@1 BOUND; Convert DONE tip 2684902)") |
| Convert complete | yes — `architecture/atu-merlin-ord/CONVERT_RECORD.md`, `modern/src/features/order/**` at `2684902`, handoff `PARITY=UNVERIFIED` |
| Another job `RUN` (Smith gate) | no — one job file; the previous job (convert) was stamped `DONE` at `2684902` before this fire; this run is the only RUN |
| `overnight/stop.txt` | absent |
| Scope | ORD only (seven slices). CUS not re-verified; ART untouched |
| Edit surface | written: `verification/ord-vertical/2026-09-09-r1/**`, `modern/README.md` (status paragraph, one sentence), `overnight/AGENT_JOB.md` line 1. Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`, `modern/src|test|db|openapi` |
| CUS pack not widened | `git diff 2860e7c..HEAD -- modern/src/features/customer modern/openapi/customer.yaml modern/src/db architecture/atu-merlin` is empty; the first 47 lines of `modern/db/schema.sql` (the CUS objects) are byte-identical to the CUS-verified file; the CUS list still has no link into ORD (P47) |
| `ATU_SRC/**` | `git diff origin/master..HEAD -- ATU_SRC` is empty |
| Goldens | none exist; nothing RECORDed, nothing rewritten |

## 3. Commands run

Environment: Node v22.14.0 (pack minimum 20), PostgreSQL 16.15 (`modern/scripts/local-pg.sh`, port 54329), fresh `npm ci`.

| Command | Result | Evidence |
| --- | --- | --- |
| `cd modern && npm run typecheck` | `tsc --noEmit` exit 0, no diagnostics | `evidence/typecheck-and-vitest.log` |
| `cd modern && npm test` | vitest 3.2.7: **5 files, 111 tests, 111 passed** (`order.api.test.ts` 47, `order.web.test.ts` 9, `customer.api.test.ts` 29, `fcustomer.test.ts` 16, `customer.web.test.ts` 10), 3.79 s | `evidence/typecheck-and-vitest.log` |
| live COMPARE probe (`evidence/probe.mjs`) against `PORT=3100 tsx src/server.ts` on a freshly seeded `atu_merlin_verify_ord` database (customer fixtures + article / VATDEF fixtures, no orders) | **48 PASS / 0 FAIL** | `evidence/results.json` |

The vitest suite is modern's own; on its own it never sets a green flag (Field Guide anti-greenwash). The probe is the independent check: it drives each OpenAPI operation over HTTP, asserts the response *shape* (exact key sets from the contract schemas) and the *behaviour* the card describes, and then reads `orders`, `detord`, `article.arcusqty`, `customer.culastord`, `samlog` and `lastordno` directly to confirm the side effects. Where a card describes a legacy quirk preserved as-is (VAT silent zero, inner join, ORD200 option 2, typed-vs-stored rules, `CULASTORD` not maintained on delete, insert adds ordered not outstanding) the probe asserts the quirk, not a fix.

Two probe cases failed on the first run for probe-script reasons (an unsorted key list; the option legend line matching a row counter) and were corrected; no server behaviour was changed. The committed `results.json` is the second, clean run.

## 4. Card COMPARE — cards vs OpenAPI routes vs tests vs probe

Legend: route = OpenAPI operation or web path; test = vitest block (`order.api.test.ts` unless `web`); probe = case id in `evidence/results.json`.

### ord-entry-ord100

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 customer parameter / SltCustomer; no ExistCus / IsCusDeleted | converted (as-is) | `POST /api/orders`, `/orders/new` redirect | c07 c01/c14, cancelled | P10 P11 P12 P44 | match: 99999 and CUDEL `X` accepted, 0 → 400 |
| c02 QTEMP staging, triggers off | residual | — | c13 | P06 | client-held draft; same observable (no trigger footprint before confirm) — explained |
| c03 add line, qty 1, GetArtRefSalPrice, CLCVat, description | converted | `POST /api/orders/lines/quote` | c03 (4) | P01 P03 P04 | match incl. **VAT silent zero** on X9 |
| c04 edit staged line, recompute | converted / residual | quote | c03 recompute, web create | P02 | match; half-adjust 1.056 → 1.06; two-Enter mechanic residual |
| c05 delete staged line, TOTVAT drift | converted / residual | web form | web option 4 | — | staged delete tested at the web boundary; drift not reproducible |
| c06 confirm blocked while options pending | residual | — | — | — | no pending-option state over HTTP (CR-O8) — explained |
| c07 confirm: LASTORDNO+1, header, renumber, ODYEAR 0, zero-line | converted (as-is) | `POST /api/orders` | c07 (6) | P07 P09 | match: first id 60720, gaps 1/3/7 → 1..3, `odyear` 0, `odqtyliv` 0, zero-line 201 |
| c08 print + acknowledgement | converted / needs-SME | 201 body `document`, `/orders/:id/confirmed` | web create | P07 P44 | link present; sync print open (500-c05) |
| c10 entry paths | converted | `/orders/new`, `?cuid=` | web create | P44 | match |
| c12 staged gaps, renumber | converted (as-is) | `POST /api/orders` | c07, web option 4 | P07 | match |
| c13 abandon writes nothing | converted | quote | c13 | P06 P12 | match: `orders` 0, `detord` 0, `lastordno` unconsumed after five quotes and one rejected confirm |
| c14 no stock / credit / date / existence checks | converted (as-is) | in quote / confirm / articles | c03 unknown article, c07 c01/c14 | P04 P10 P11 P42 | match; recorded absence |

### ord-entry-ord101

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 load every line, stored totals | converted | `GET /api/orders/{orid}` | c03, web lines | P18 | match; `tot`/`totvat` equal the sum of stored lines |
| c02 header + GetCusName; session-long lock | converted / residual | `GET /api/orders/{orid}` | c03 404 | P18 P26 | header yes; no lock (CR-O8); 404 (CR-O1) |
| c03 edit qty / delivered / price; silent re-rate | converted (as-is) | `PUT /api/orders/{orid}/lines/{odline}` | c03 (4) | P21 P25 | match; re-rate proven by changing VATDEF `2` 20 → 21 (600 → 605), then restored |
| c04 ERR1001 / ERR1002 typed-vs-STORED | converted (as-is) | in PUT | c04 (4) | P22 P23 P24 | match: 20/15 refused, both on together, inconsistent lowered pair accepted |
| c05 delete blocked when ODQTYLIV > 0 | converted (as-is) | `DELETE .../lines/{odline}` | c05/c06 | P27 | match; text `Line with delivery can not be deleted.` |
| c06 delete line, footer adjust | converted / residual | `DELETE .../lines/{odline}` | c05/c06 (3) | P28 P30 | match; SAMLOG text and outstanding subtraction; last line leaves a zero-line header |
| c07 dead `6=Deliver` legend | as-is | web legend | — | — | legend only; explained |
| c08 dead declarations | n/a | — | — | — | nothing derived |
| c09 callers ORD200 (unreachable) / ORD201 | converted (as-is) | web lists | web ORD200/ORD201 | P45 | match (see 200-c09) |
| c10 no add-line path | converted (as-is) | none | c10 | P29 | match: `POST .../lines` → 404 |
| c12 closed-order guard in callers only | converted (as-is) | — | c12 | P45 | match: API edits lines of a closed order; web list refuses `2` on closed rows |

### ord-maintain-ord200 / ord-maintain-ord201

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| 200-c01 / 201-c01 list from ORDERCUS | converted (as-is) | `GET /api/orders[?cuid]`, `/orders` | c01 (4) | P14 P15 P17 | match: orphan 60722 hidden (**inner join**), `ordate desc, orid desc`, TOTVAL VAT-inclusive, 14 + look-ahead on both twins (CR-O4, CR-O5) |
| 200-c02 / 201-c02 F6 create | converted | `/orders/new[?cuid]` | web | P44 | match |
| 200-c03 / 200-c09 option 2 unreachable | as-is, **planted defect** | `/orders?cuid=` | web ORD200 twin | P45 | match: 2/2 rows refused in the per-customer list incl. the open one; ORD201 links 20 open rows and refuses 2 closed rows over 2 pages |
| 200-c04 / 201-c04 / 200-c13 option 4 delete | converted | `DELETE /api/orders/{orid}` | c04/c08/c13 | P36 | match: lines + header gone together, 2 SAMLOG rows, `arcusqty` restored, `CULASTORD` untouched (200-c12 as-is) |
| 200-c05 / 201-c05 options 5 / 6 no guard | converted | GET detail / document | c01/c02, c01 print | P18 P38 | match on a closed order too |
| 200-c06 / 201-c06 option 7 close | converted (as-is) | `POST .../close` | c06 (2) | P31 P32 | match: `ordatdel` stamped when null, lines untouched, `arcusqty` unchanged, again → `Invalid Option` |
| 200-c07 option 8 deliver | converted (as-is) | `POST .../deliver` | c07 (3) | P33 P34 | match: `linesDelivered` 1, partial line kept at 1, not closed, `arcusqty` −2; again / after close → `Invalid Option` |
| 200-c08 / 201-c07 option guards, texts | converted / residual | in DELETE | c04/c08 | P35 | match incl. DDS typo `whith`; whole-pass cancellation and sticky `3` residual |
| 201-c08 F5 refresh | converted | `/orders` | web ORD201 | — | link on `/orders` only |
| 201-c09 / 200-c10 callers | converted / residual | `/orders` direct | — | P44 P47 | `/orders` reachable; CUS list link stays unwired — **blocked by CUS pack**, explained |
| 201-c10 / 201-c11 dead files, cursor close | n/a | — | — | — | nothing to carry |
| 200-c11 header context, sentinel dates | converted | `/orders?cuid=`, list rows | web ORD200 twin | P15 P44 | match; NULL renders blank |

### ord-maintain-ord202

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 header, sentinel dates, not-found exception | converted / needs-SME | `GET /api/orders/{orid}`, `/orders/:id` | c01/c02 (3) | P18 P20 | match; 404 is CR-O1 (recorded, not decided) |
| c02 lines, stored sums, description hidden until F11 | converted (as-is) | `?detail=1` | web display | P19 P46 | match; blank on unknown article (CR-O2) |
| c03 / c05 any key closes, dead F5/F6 | residual | — | — | — | stateless page — explained |
| c04 callers option 5 | converted | `/orders/:id` | — | P44 | match |
| c06 direct ARTICLE1 vs FARTICLE | changed (CR-O2) | in GET | c02 missing article | P19 | one lookup rule; blank, not the previous line's text |

### ord-print-ord500

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 spool layout, 15 details / page, stored sums, VAT = Total − Net | converted | `GET /api/orders/{orid}/document` | c01 (4) | P38 P39 P40 | match: 90 columns, `Order Number yyyy/ nnn`, ISO date (CR-O7), 16 lines → 2 pages with the customer block on page 1 only, silent-zero order prints a blank VAT amount |
| c02 PATH lookup, 5-char PDF name | needs-SME / not implemented | — | — | — | nothing invented; explained |
| c03 CVTSPLPDF | needs-SME / not implemented | — | — | — | text only; explained |
| c05 callers; sync print on confirm | needs-SME | `document` link | — | P07 P38 | reachable; the synchronous-side-effect question stays open |
| c06 direct file access, miss semantics | changed (CR-O2) | in document | — | P19 | blank description on a miss |
| c07 code quirks | n/a | — | — | — | none carried |
| c08 unknown order → exception | needs-SME | document | c01 empty/unknown | P41 | 404 (CR-O1) |

### ord-trigger-ord700

| Card | README status | Route | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c02 insert adds FULL ODQTY | converted (as-is) | trigger on `detord` | c02/c05 | P08 | match: A00001 +2, A00002 +1, B00010 +3 after confirm |
| c03 delete logs then subtracts outstanding | converted (as-is) | trigger | c05/c06 | P28 P36 | match: `ORD700:Order Line deleted 60720 3 article : B00010 quantity : 3`, user cut to 10 chars (`VERIFIER01`), `arcusqty` −3 |
| c04 update delta, `*CHANGE` | converted (as-is) | trigger | c03 | P21 P33 | match: (5−2)−(2−0) = +1; deliver −2 on the fully delivered line only |
| c05 silent no-op on zero / unknown | converted (as-is) | trigger | c02/c05 | P08 P19 | match: `GHOST1` line changes nothing (the fixture seed stamps `armod`, so the no-stamp rule is covered by the vitest block only) |
| c06 trigger buffer plumbing | replaced | PL/pgSQL | — | — | explained (bind note) |
| c07 ORD701 unconditional CULASTORD | converted (as-is) | trigger on `orders` | c07 | P08 P10 P11 P43 | match: 1002 → today yyyymmdd, `cumodid` untouched, 99999 → 0 rows silent, deleted customer stamped |
| c09 staging copy excludes triggers | converted | — | c13 | P06 | match |
| c10 ART801 reconciliation | residual | — | — | — | **stay_legacy** (sql-objects) — blocked by pack, explained |

**Unexplained gaps: none.** Every card is either matched at the boundary or carries a reason that traces to the pack (`stay_legacy`, `forbidden`, CUS pack boundary, stateless target) or to a bind-time needs-SME.

### Planted defects — present, asserted, not fixed

| Defect | Where asserted | Observed |
| --- | --- | --- |
| ORD200 option-2 unreachable | P45, `order.web.test.ts` ORD200 twin | `/orders?cuid=1002`: 2 rows (1 open), 2 refused with `Closed order can not be edited or deleted`, 0 linked; `/orders`: 20 open rows linked, 2 closed refused |
| ORDERCUS inner join | P14, P19 | order 60722 (customer 99999) absent from every list page; reachable by id with `custnm: ""` |
| VAT silent zero | P03, P39 | X9 (code `9`, no VATDEF row): `vatRate 0`, `vat 0`, stored `odtotvat = odtot`; document VAT line blank |

### Contract gaps found (documentation-level, not behaviour drift)

| Id | Gap | Severity | Suggested owner |
| --- | --- | --- | --- |
| G-O1 | `POST /api/orders/lines/quote` schema says `required: [odarid]`; the server accepts a body without `odarid` and quotes a blank article (price 0, blank description) — the "cancelled prompt still staged a line" behaviour of c03. A strict validator would 400 first | low | Conversion follow-up: drop `required` or state the blank-article rule in the description |
| G-O2 | `Orid` / `Odline` path schemas are `integer` with ranges; a non-numeric or 7-digit segment gets `404 ORDER_NOT_FOUND` with `orid: 0`, not `400`. Within the listed responses; a strict validator would answer 400 first (same class as CUS G-3) | low | Conversion follow-up: document 404 for malformed ids or add a 400 |
| G-O3 | `LineInput` says `required: [odqty, odqtyliv, odprice]`; the server defaults a missing field to 0 (5250 blank = zero), so `PUT {}` on an undelivered line zeroes quantity and price and passes ERR1001/ERR1002. Consistent with the DSPF (all three fields always arrive), but the contract promises a rejection it does not deliver | low | Conversion follow-up: either enforce the three fields with `FIELD_INVALID` or document the zero default |
| G-O4 | Malformed JSON on any POST / PUT answers `400 {code: BAD_REQUEST}` (shared CUS handler); the `BadRequest` response is only listed on `GET /api/orders` | low | Conversion follow-up: add `BadRequest` to the write operations or a top-level note |

Web paths (`/orders/**`) are intentionally outside the OpenAPI contract (`api_contract_policy.contract_paths` names only the JSON API); they were smoke-checked (P44) and the two web-only card behaviours were checked directly (P45 option 2, P46 F11).

## 5. CONTRACT_RISK CR-O1..CR-O11 and pack `known_risks` — accept-for-demo or defer

No line below claims an IBM i match. "Accept-for-demo" means the delta is acceptable for the pathfinder demo as documented in `modern/README.md`; "defer" means the room or an SME must decide before anything beyond a demo. No SME answer is invented here.

| Id | Delta (from `modern/README.md`) | Disposition | One sentence |
| --- | --- | --- | --- |
| CR-O1 | Unknown order / line → `404 ORDER_NOT_FOUND` | **defer** | 404 is the only defensible HTTP answer today and is tested (P20, P26, P37, P41), but the pack lists the not-found presentation as needs-SME and forbids inventing it, so the target rule (message, list refresh, whether a stale option 5/6 is an error at all) still has to be named by the SME. |
| CR-O2 | One article / customer lookup rule: blank on a miss | **accept-for-demo** | A single FARTICLE / FCUSTOMER rule for the whole vertical removes ORD202's repeat-the-previous-line artefact without touching any of the three planted defects, and the blank is asserted (P19). |
| CR-O3 | Confirm (header + lines) and delete (lines + header) are single transactions | **accept-for-demo** | Legacy had no commitment control and its partial-write residues are failure modes with no HTTP equivalent; the transactional shape is asserted (P07, P36) and only removes states nobody wants. |
| CR-O4 | Per-customer list uses the ORD201 sort (`ordate desc, orid desc`) | **accept-for-demo** | ORD200 left same-day rows in unspecified order, so the ORD201 tie-breaker is a superset ordering that no consumer can have relied on (P17). |
| CR-O5 | Per-customer list is paged 14 at a time | **accept-for-demo** | ORD200 loaded everything and ORD201 paged; one list serving both twins with `more`/`nextOffset` is asserted (P17) and only matters past 14 orders per customer. |
| CR-O6 | Delete-line and delete-order guards read the table | **accept-for-demo** | Reading the live row instead of the subfile's hidden copy can only be stricter, and the order-level test already read the file in legacy (P27, P35). |
| CR-O7 | Dates are ISO everywhere | **accept-for-demo** | There is no job date format to inherit; ISO is deterministic and asserted on the document and headers (P38), and a presentation format is a UI decision for later. |
| CR-O8 | No session-long header lock, no record locks, no ghost rows, no pending options | **defer** | Losing ghost rows and pending options is harmless, but losing the ORD101 header lock means two concurrent line edits are last-write-wins with no warning, which needs an optimistic-concurrency decision before multi-user use (same class as CUS CR-8). |
| CR-O9 | `article`, `vatdef` read-only fixture tables; `samlog` a table | **accept-for-demo** | ORD needs the getters and the deletion log, ART / VAT maintenance stay legacy, and the fixture rows (six articles incl. the retired VAT code and the soft-deleted item) are enough for the demo (P42); a data load is a later decision. |
| CR-O10 | Over-long / non-numeric fields → `400 FIELD_*`; `qty × price` beyond 9P 2 → `400 TOTAL_OVERFLOW` | **accept-for-demo** | 5250 field lengths made these inputs impossible and legacy raised an unmonitored size exception, so rejecting is safer than truncating (P05, P13). |
| CR-O11 | Line totals recomputed at confirm with the current VAT rate | **defer** | Identical to legacy unless the rate changes while a draft is open, but which rate governs a stored line total is a finance rule, not an engineering choice, and it interacts with the as-is silent re-rate on every ORD101 save (P25). |

Totals: 8 accept-for-demo, 3 defer (CR-O1, CR-O8, CR-O11).

Pack `known_risks` (from `PACK.yaml`):

| Known risk | Disposition | Evidence / one sentence |
| --- | --- | --- |
| Pathfinder waiver: no IBM i goldens; COMPARE only at TypeScript API | accept-for-demo (structural) | This whole run; `PARITY.yaml` `legacy_replay: SKIPPED`, `ibm_i_parity: NOT_CLAIMED`. |
| Date lock: NULL in Postgres for blank/never | accept-for-demo — verified | P43: no `1940-01-01` anywhere, `ordatdel`/`ordatclo` NULL for never, `culastord` stays a `yyyymmdd` integer at the CUS boundary. |
| No ORD200/ORD201 SoT twin; sticky option 3, c03/c04 stay needs-SME | defer | One list serves both twins with the ORD201 sort and paging (CR-O4/CR-O5); which twin is the parity reference for delete residue and screen behaviour is the SME's call. |
| option-5 not-found unguarded `%date`; description-hidden-until-F11 | defer (not-found, = CR-O1) / accept-for-demo (F11) | P20; P46 shows the description hidden by default and toggled by `?detail=1`. |
| Print side: not-found, PDF name truncation, sync print, PDF via CVTSPLPDF | defer | Not-found is CR-O1; PDF name, `CVTSPLPDF` and sync-print are not implemented and not invented (500-c02/c03/c05). |
| Planted defects stay as-is | accept-for-demo — verified | §4 "Planted defects": all three present and asserted. |
| Architecture BOUND does not authorise Convert | n/a (procedural) | Chain honoured: BIND `1308260` → convert `ROOM_OK` → convert `2684902` → verification `ROOM_OK` → this run. |
| CUS re-scope is a fail | accept-for-demo — verified | §2: CUS files unchanged since `2860e7c`; CUS list has no ORD link (P47); CUS tests 55/55 unchanged. |
| `modern/db/**` additive ORD tables only | accept-for-demo — verified | §2: the CUS part of `schema.sql` is byte-identical; ORD objects are appended. |
| ORD700/ORD701 shape undecided until Convert | accept-for-demo | Decided at convert as PL/pgSQL triggers and documented in the README; arithmetic asserted through the database (P08, P21, P28, P33, P36). |

## 6. Explicitly not claimed / refused

- IBM i parity, `PARITY=GREEN`, `REPLAY_GREEN`, `legacy_green`, `parity_green`, behaviour `status: verified` — none. `inventory/atu-merlin/APP_MANIFEST.yaml` was not touched (pack `edit_surface.deny` and Field Guide: under a waiver the maximum is `converted` + `parity: WAIVED`).
- Whole-estate verification — CUS not re-verified as this job's claim; ART untouched.
- "Repo fully migrated" or "ORD fully migrated" — no; see §1.
- Golden creation or RECORD — no `tests/characterization/**` exists and none was created.
- Discovery card edits — none needed; no harness bug blocked COMPARE.
- Any edit under `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`, `modern/src|test|db|openapi`.
- SME answers — none invented; the seven `discovery/ord-*/SME_BRIEF.md` files stay open.

## 7. Reproduce

```bash
cd modern && npm ci && ./scripts/local-pg.sh start
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run typecheck && npm test
createdb -h 127.0.0.1 -p 54329 atu_merlin_verify_ord
export VERIFY_URL=postgres://$(id -un)@127.0.0.1:54329/atu_merlin_verify_ord
DATABASE_URL=$VERIFY_URL npm run db:seed && DATABASE_URL=$VERIFY_URL npm run db:seed:order
DATABASE_URL=$VERIFY_URL PORT=3100 npx tsx src/server.ts &
BASE_URL=http://127.0.0.1:3100 DATABASE_URL=$VERIFY_URL \
  node ../verification/ord-vertical/2026-09-09-r1/evidence/probe.mjs
```

The probe expects a freshly seeded database with no orders (it asserts that the first confirm draws 60720 and that `lastordno` is unconsumed at start). It confirms 24 orders, closes two, delivers one, deletes one, and temporarily changes VATDEF code `2` to 21 % (restored before it ends).

## 8. Follow-ups (not done here)

- Conversion: close G-O1..G-O4 in `modern/openapi/order.yaml` (documentation only; G-O3 may instead become a `FIELD_INVALID` rule if the room prefers the contract as written).
- Room / SME: decide CR-O1, CR-O8 and CR-O11; sign off the seven `discovery/ord-*/SME_BRIEF.md` files — in particular the not-found presentation (202-c01 / 500-c08), PDF scope and name (500-c02/c03/c04), sync print (500-c05), the SoT twin for the two lists, the ORD200 option-2 decision, `CULASTORD` on delete (200-c12) and the ORD101 typed-vs-stored rules (101-c04).
- If the room wants the CUS list's `5=Orders` wired to `/orders?cuid=`: CUS pack version bump + SUPERSEDE + re-bind first.
- If the room ever wants parity against IBM i: legacy RECORD on the box first (Test execution station), then a real COMPARE — this run cannot be upgraded into that.
