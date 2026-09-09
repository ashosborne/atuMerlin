# atuMerlin — modern CUS + ORD verticals (pathfinder)

TypeScript modular monolith holding two converted verticals, each under its own BOUND
Architecture pack with a separate convert `ROOM_OK`:

- **CUS** (`cus-interactive` + `cus-modules`) — pack **`atu-merlin-ts-cus-v1@1`**
  (`architecture/atu-merlin/PACK.yaml`). Sections below up to "Not done in this pack".
- **ORD** (`ord-entry-ord100`, `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`,
  `ord-maintain-ord202`, `ord-print-ord500`, `ord-trigger-ord700`) — pack
  **`atu-merlin-ts-ord-v1@1`** (`architecture/atu-merlin-ord/PACK.yaml`). See
  [ORD vertical](#ord-vertical-pack-atu-merlin-ts-ord-v11) at the end of this file.

This is a **pathfinder**, not "Merlin migrated": CUS and ORD live in TypeScript under the
waiver; ART, country / VAT / article maintenance, the ORD9xx batches and everything else stay on
IBM i. Characterization is `WAIVED_PATHFINDER`: there are no IBM i goldens and no `REPLAY_GREEN`;
behaviour is compared at the TypeScript API only. CUS: **parity: TS_BOUNDARY_GREEN** under the
waiver (`verification/cus-vertical/2026-09-08-r1/PARITY.yaml`); ORD: **parity: TS_BOUNDARY_GREEN**
under the waiver (`verification/ord-vertical/2026-09-09-r1/PARITY.yaml`). Neither is parity
against IBM i.

## Stack (from the pack)

| Concern | Choice |
| --- | --- |
| Runtime | Node 20+, TypeScript, Fastify 5 |
| Data | PostgreSQL, greenfield from PF (`db/schema.sql`) |
| UI | Server-rendered simple web (no client framework) |
| Auth | pathfinder-open: `X-User-Id` header, default `WEB` |
| Contract | `openapi/customer.yaml` (new HTTP JSON, inferred — not preserve-wire) |

## Layout

```
modern/
  db/schema.sql                    PF -> table, LF -> index, CUSSEQ -> sequence, COUNTRY dependency table;
                                   ORD section appended (orders, detord, article, vatdef, samlog, lastordno,
                                   ordercus view, ORD700 / ORD701 triggers)
  openapi/customer.yaml            HTTP contract (CUS)
  openapi/order.yaml               HTTP contract (ORD)
  src/app.ts, src/server.ts        Fastify app / entry
  src/db/                          pool, migrate, seed (CUS fixtures), cli
  src/shared/fcustomer/            FCUSTOMER (CUS300 getters, ExistCus, IsCusDeleted, CUS301 SltCustomer)
  src/shared/fcountry/             FCOUNTRY dependency surface (ExistCountry, GetCountryName, list) — read-only
  src/shared/farticle/             FARTICLE dependency surface (GetArtDesc, GetArtRefSalPrice, GetArtVatCode, list) — read-only
  src/shared/fvat/                 FVAT dependency surface (GetVATRate, CLCVat) — read-only
  src/features/customer/           CUS200 / CUS250: types, repository, service (validation), routes, web
  src/features/order/              ORD100 / ORD101 / ORD200 / ORD201 / ORD202 / ORD500: types, repository,
                                   service, document (ORD500O), routes, web, seed (ORD fixtures)
  test/                            vitest suites at the TS boundary (real Postgres)
  scripts/local-pg.sh              throw-away local Postgres cluster
```

## Run

```bash
cd modern
npm install
./scripts/local-pg.sh start            # or point DATABASE_URL at any Postgres 14+
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run db:seed                         # schema + CUS dev fixtures (not legacy data)
npm run db:seed:order                   # ORD dev fixtures: articles, VAT codes (not legacy data)
npm run dev                             # http://127.0.0.1:3000/customers  ·  /orders
```

Tests (each file uses its own throw-away schema, so they need a live `DATABASE_URL`):

```bash
npm run typecheck && npm test
```

## Screen mapping (DSPF -> web)

| Legacy | Web | HTTP |
| --- | --- | --- |
| CUS200 CTL01/SFL01 work-with list, POSTO, Page Down, F5, F6 | `/customers` | `GET /api/customers` |
| CUS200 FMT02 mode CRT | `/customers/new` | `POST /api/customers` |
| CUS200 FMT02 mode UPD (option 2) | `/customers/:id/edit` | `PUT /api/customers/:id` |
| CUS200 F4 country prompt (SltCountry) | datalist on the form | `GET /api/countries` |
| CUS250 FMT01 id prompt + F4 SltCustomer | `/customers/inquiry`, `/customers/select` | `GET /api/customers/search` |
| CUS250 FMT02 detail | `/customers/:id` | `GET /api/customers/:id` |
| CUS200 option 5 -> ORD200 | shown disabled | none (ORD is legacy) |

## Card coverage

`converted` = behaviour present at the TS boundary with a test; `as-is` = converted with a known
legacy quirk deliberately preserved; `residual` = not carried, with the reason.

### cus-interactive

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c01 | List by name, position-to, 14/page, More/Bottom, resume from first unseen row | converted | byte-order collation (`COLLATE "C"`) instead of EBCDIC — see deltas |
| c02 | Create, id from CUSSEQ (1551, NO CYCLE) | converted | id drawn at save, not at "F6" — see deltas |
| c03 | Update option 2 | converted | unknown id -> 404 instead of unchecked chain; record lock across the screen not reproducible over HTTP |
| c04 | Validation: country exists, name, phone mandatory + digits, duplicate | **as-is** | UPD duplicate rule `dup > 1` preserved (needs-SME); phone trimmed in place; all rules one pass |
| c05 | F4 country prompt | converted | list + name lookup; no validation on the prompt path |
| c06 | Option 5 -> ORD200 | **residual** | ORD is `stay_legacy`; `interop: none`. Shown disabled in the list |
| c07 | Sentinel last-order date | converted | API carries raw `culastord` and `lastOrderDate` (null when 0); invalid stored value -> null instead of RPG exception |
| c08 | Audit stamping | **as-is** | CUMOD every save; CUMODID and CUCREA create-only (needs-SME) |
| c09 | Inquiry by id, ERR0103 `Code &1 Unknown.` | converted | zero-suppressed id: id 0 reads `Code  Unknown.` |
| c10 | Detail with country name | converted | blank name for unknown code; audit fields not on the web detail |
| c11 | No delete path, CUDEL never written | **as-is** | no DELETE route; deleted rows listed / editable / viewable (needs-SME) |
| c12 | Subfile option validation (2, 5) | residual | 5250 subfile mechanics replaced by per-row links |

### cus-modules

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c01 | Eleven getters, blanks/zeros on miss | converted | `src/shared/fcustomer` |
| c02 | ExistCus = found and CUDEL <> 'X' | converted | |
| c03 | IsCusDeleted = CUDEL = 'X' | converted | |
| c04 | Lazy open + last-key cache | **residual** | stateless server, no cache: stale-read quirk not reproduced; miss semantics kept (needs-SME) |
| c05 | CloseCUSTOME1 not exported | residual | nothing to close |
| c06 | SltCustomer window, 14/page, look-ahead | converted | `GET /api/customers/search`, `/customers/select` |
| c07 | Option 1 only, single selection | residual | selector uses one link per row |
| c08 | Criteria change re-prepares, F3/F12 return default | residual | stateless form; cancel link returns to caller |
| c09 | Dynamic SQL concatenation | **resolved by pack** | `forbidden: String-concat SQL` -> bound parameters. `%`/`_` wildcards kept (as-is); `'` is literal; no silent SQL failure |
| c10 | Dormant GetCusLastOrdDate | not implemented | needs-SME, no card |
| c11 | Blank criteria list all (incl. deleted) | converted | |

## SME open questions — kept visible, not answered here

These come from `discovery/*/SME_BRIEF.md` and are **preserved as-is** in the code (comments cite
the card id; residuals carry a `TODO(<card>)`). Nothing below is a target decision.

- **c04 (cus-interactive)** — update-mode duplicate check uses `dup > 1` on rows holding the *new*
  name+phone. Changing a customer to collide with exactly one other customer passes. Preserved;
  test `update-mode duplicate gap (as-is, needs-SME c04)` documents it. Also open: stored `CUPHONE`
  values written outside CUS200 with leading blanks escape the duplicate match.
- **c08 (cus-interactive)** — `CUMODID` is stamped on create only; update refreshes `CUMOD` only and
  keeps the previous modifier. Preserved (`customer.repository.ts` `update`). The `X-User-Id` sent
  on `PUT` is therefore ignored.
- **c11 (cus-interactive)** — no writer of `CUDEL` exists. Deleted customers remain listable,
  editable and viewable in the interactive paths while `ExistCus` says they do not exist. Preserved:
  no DELETE route, no filter.
- **cus-modules c01/c02** — no `ATU_SRC` caller of the getters (except `GetCusName`) or of
  `ExistCus` / `IsCusDeleted`; they are implemented as a TS module, not exposed over HTTP.
- **cus-modules c04** — getters return blanks/zeros on a missing id (kept) and the last-key cache is
  not reproduced (see residuals).
- **cus-modules c05, c10** — see coverage table.
- **c02** — gap-free ids: not guaranteed (never was; sequence is `NO CYCLE`, Postgres sequences are
  non-transactional).

## Deliberate deltas (CONTRACT_RISK — left open for Verification)

| Id | Delta | Why |
| --- | --- | --- |
| CR-1 | List/search ordering is byte order of the stored text (`COLLATE "C"`), not EBCDIC | No IBM i collation in Postgres; digits/upper/lower order differs between EBCDIC and ASCII |
| CR-2 | Customer id is drawn from `cusseq` at save, not when the create form opens | Stateless HTTP; a cancelled form no longer consumes an id. Gaps still possible |
| CR-3 | `CUCREA` is the save date, not the program start date | No long-lived program instance |
| CR-4 | Unknown id on update -> `404 ERR0103` | Legacy chain was unchecked (RPG exception on a stale row) |
| CR-5 | Over-long field values -> `400 FIELD_TOO_LONG`; non-numeric credit limit -> `400 FIELD_INVALID` | 5250 field lengths made this impossible; modern boundary must decide — reject rather than truncate |
| CR-6 | Invalid stored `CULASTORD` presents `lastOrderDate: null` | Legacy raised an RPG exception in `S02prp` |
| CR-7 | Selector criteria are bound parameters | Pack `forbidden` rules out string-concat SQL; `'` no longer breaks the query, SQL errors are no longer silent |
| CR-8 | No per-activation-group state: getter cache, persisted selector criteria, record lock across the edit screen | Stateless HTTP server |
| CR-9 | `COUNTRY` reference table exists in the CUS schema as a **read-only dependency** with fixture rows | c04/c05/c10 need `ExistCountry` / `GetCountryName`; the `cou-maintain` slice is **not** converted and has no maintenance path here |

## Not done in this pack

- ORD / ART / country maintenance conversion; any interop with IBM i. (ORD was converted
  afterwards under its **own** pack `atu-merlin-ts-ord-v1@1` — see below; the CUS pack, code and
  schema were not widened for it. The CUS list's `5=Orders` action therefore stays unwired:
  wiring it would edit `features/customer/**`, which the ORD pack forbids.)
- IBM i goldens, RECORD/REPLAY, `REPLAY_GREEN`, or any parity claim.
- Production auth, migrations tooling, deployment.
- Edits under `ATU_SRC/**`, `discovery/**`, `inventory/**`.

---

# ORD vertical (pack `atu-merlin-ts-ord-v1@1`)

Converted under Architecture pack **`atu-merlin-ts-ord-v1@1`** (`architecture/atu-merlin-ord/PACK.yaml`,
`status: BOUND`, bound 2026-09-09T00:46:59Z) with a separate convert `ROOM_OK` carried in
`overnight/AGENT_JOB.md`. Waiver record: `architecture/atu-merlin-ord/ADR/0001-ord-vertical-ts-postgres.md`.
**WAIVED_PATHFINDER — COMPARE at the TypeScript API only. No IBM i goldens. No REPLAY_GREEN.**
Verification `2026-09-09-r1`: **parity: TS_BOUNDARY_GREEN** under the waiver
(`verification/ord-vertical/2026-09-09-r1/PARITY.yaml`) — not parity against IBM i.

**Talk-track:** ORD lives in TypeScript under the waiver — the repo is not fully migrated, and
ORD is not "fully migrated" either: the seven bound slices are present at the TS boundary or listed
as residual below; ART, ORD900/ORD901, ART801, the `CVTSPLPDF` PDF step and every needs-SME item
stay on IBM i or open.

## Edit surface honoured

Written: `src/features/order/**`, `src/shared/farticle/`, `src/shared/fvat/`, `openapi/order.yaml`,
`db/schema.sql` (ORD section **appended**; the CUS objects above it are byte-identical), `test/**`
(`order.*.test.ts`, `helpers/db.ts` reset widened to the ORD tables), `src/app.ts` (two additive
lines: register the feature, chain the error handler), `package.json` (`db:seed:order` script,
description), this README. Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`,
`src/features/customer/**`, `openapi/customer.yaml`, `src/db/**`, `architecture/atu-merlin/**`.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| DSPF -> web | `order.web.ts`: ORD100D (`/orders/new`, `/orders/:id/confirmed`), ORD101D (`/orders/:id/lines`), ORD200D (`/orders?cuid=`), ORD201D (`/orders`), ORD202D (`/orders/:id`) |
| RPGLE -> TS service | `order.service.ts` (ORD100 S02prp/S02chk/confirm, ORD101 S02chk, ORD200/201 s01chk guards + options 4/7/8), `order.routes.ts` |
| PRTF/spool -> printable artifact | `order.document.ts`: ORD500O as text pages at `GET /api/orders/:id/document`. **No PDF** (c04 needs-SME) |
| PF -> postgres table | `orders` (ORDER — `order` is a reserved word; legacy quoted `"ORDER"` too), `detord`; dependency tables `article`, `vatdef`; `samlog` for the ORD700 log; sequence `lastordno` (START 60720 = DTAARA 60719 + 1, MAXVALUE 999999) |
| LF -> index/query | `orders` PK = ORDER1; `order2 (orcuid, orid)`, `order3 (ordate, orid)`; `detord` PK `(odorid, odline)` = DETORD1, index `(odline, odorid, odyear)` = PF key; view `ordercus` = ORDERCUS.VIEW as-is (inner join) |
| IBM i blank/never date -> NULL | `ordatdel`, `ordatclo` are `date NULL`; `ordate` `date NOT NULL` (ORD100 always writes today). `1940-01-01` / `0` never stored. The one boundary: ORD701 writes `customer.culastord` as the CUS pack's `yyyymmdd` integer |
| Triggers ORD700/ORD701 -> **Postgres triggers** | `db/schema.sql`: `ord700_detord_article_{insert,delete,update}` on `detord`, `ord701_insert_order` on `orders`. Choice recorded below |

### ORD700 / ORD701: why Postgres triggers

The pack left the shape open ("application-level side effects or DB triggers; choose at
convert; document"). Chosen: **PL/pgSQL triggers**, because the legacy contract is "any writer of
DETORD/ORDER — RPG, SQL, DFU — produces the side effect", and the discovery cards lean on that
(`ord-trigger-ord700-c02` "any insert from outside the tree would also fire"). Application-level
code would only cover the modern writers. Each trigger runs inside the writer's transaction, so
the as-is "header stamped, then a line insert fails" partial states cannot occur; the arithmetic
is otherwise reproduced exactly, asymmetries included:

- insert adds the **full** `odqty` and ignores `odqtyliv` (c02); delete and update work in
  `odqty - odqtyliv` (c03, c04); zero delta / unknown article -> silent no-op, `armod`/`armodid`
  not stamped (c05); update fires only when the row changed (`WHEN (OLD.* IS DISTINCT FROM NEW.*)`
  = `TRGUPDCND(*CHANGE)`); article-changed branch credits the new and debits the old article.
- delete logs `ORD700:Order Line deleted <order> <line> article : <id> quantity : <odqty>`
  (ordered, not outstanding, quantity; id blank-padded to 6 as-is) to `samlog` with the caller
  (`X-User-Id`, set per transaction via `set_config('atu.user')`; legacy `*USER`).
- ORD701 assigns the inserted order's date unconditionally (no `MAX`), no customer / `CUDEL`
  check, `cumod`/`cumodid` untouched (c07). No update/delete twin on `orders` (c08, needs-SME).
- `arcusqty` can go negative (as-is); the `CHECK` on the 5 0 range is the modern stand-in for the
  unmonitored size exception. ART801 reconciliation (c10) is **not** converted.

## Screen mapping (DSPF -> web)

| Legacy | Web | HTTP |
| --- | --- | --- |
| ORD201 CTL01/SFL01 all orders, F5, F6, Page Down | `/orders` | `GET /api/orders` |
| ORD200 CTL01/SFL01 one customer's orders, F6 (customer preselected) | `/orders?cuid=N` | `GET /api/orders?cuid=N` |
| ORD200/201 option 2 -> ORD101 | `/orders/:id/lines` (**refused on every row of the ORD200 twin** — planted defect) | `PUT` / `DELETE /api/orders/:id/lines/:line` |
| ORD200/201 option 4 / 7 / 8 | POST forms on the list rows | `DELETE /api/orders/:id`, `POST …/close`, `POST …/deliver` |
| ORD200/201 option 5 -> ORD202 | `/orders/:id` (F11=Detail toggles the description line) | `GET /api/orders/:id` |
| ORD200/201 option 6 -> ORD500; ORD100 print after confirm | `/orders/:id/document` | `GET /api/orders/:id/document` |
| ORD100 customer prompt (SltCustomer) | redirect to `/customers/select?returnTo=/orders/new` | — |
| ORD100 F6 SltArticle + FMT02 defaults / Enter recompute | `/orders/new` (staged lines carried in the form) | `POST /api/orders/lines/quote` |
| ORD100 F8 confirm + FMT03 acknowledgement | `POST /orders/new` -> `/orders/:id/confirmed` | `POST /api/orders` |
| ORD100 F3/F12 abandon | links back to `/orders` (nothing written) | — |

## Card coverage

`converted` = behaviour present at the TS boundary with a test; `as-is` = converted with a known
legacy quirk deliberately preserved; `residual` = not carried, with the reason; `needs-SME` = left
open on purpose (no answer invented).

### ord-entry-ord100

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c01 | Customer parameter or SltCustomer prompt; no ExistCus / IsCusDeleted | converted (**as-is**) | any non-zero id accepted; missing / deleted customer ordered; `orcuid = 0` = prompt cancelled -> nothing to confirm (400) |
| c02 | QTEMP staging copy, triggers off | **residual** | no job; the draft is client-held (form hidden fields / request body) and touches no table until confirm — same observable: no trigger footprint before F8 |
| c03 | Add line: qty 1, price GetArtRefSalPrice, VAT CLCVat, description 30 | converted | `POST /api/orders/lines/quote`; unknown VAT code -> VAT 0 silently (**planted defect kept**); F6 re-prompt loop and F3/F12-ends-program are 5250 state-machine residuals |
| c04 | Edit staged line, recompute; two-Enter save | converted / residual | recompute yes; the CHANGE(27) two-Enter mechanic is not reproduced; footer totals on the web draft are correct (stale-footer defect is display-only, residual) |
| c05 | Delete staged line; TOTVAT drift | converted / residual | delete yes; the drift comes from a program-memory value with no web equivalent — not reproduced |
| c06 | Confirm blocked while options pending | residual | one action per request, no pending options |
| c07 | Confirm: LASTORDNO + 1, header, lines renumbered 1..n, `ODYEAR = 0`, no commitment control, zero-line order | converted (**as-is**) | header + lines in **one transaction** (CR-O3); `odyear` stays 0 (only the deferred ORD901 backfills it); zero-line orders confirmed |
| c08 | Print + acknowledgement | converted / needs-SME | acknowledgement page + `document` link; whether the print is a mandatory synchronous side effect is **needs-SME** (ord-print-ord500-c05) — document rendered on request |
| c10 | Entry paths (menu, ORD200 F6, ORD201 F6) | converted | `/orders/new`, `/orders/new?cuid=` |
| c12 | Staged numbering gaps, renumber at confirm | converted (**as-is**) | web draft keeps the running counter (a blank article prompt still counts); confirm renumbers |
| c13 | Abandon writes nothing | converted | quote / draft posts touch no table and no sequence |
| c14 | No stock / credit / date / existence checks | converted (**as-is**) | recorded absence: nothing invented |

### ord-entry-ord101

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c01 | Load every line, stored TOT/TOTVAT, 30-char description | converted | `GET /api/orders/:id`; web truncates to 30 |
| c02 | Header from ORDER1 + GetCusName; session-long header lock | converted / residual | header yes; no record lock over HTTP (CR-O8); not-found -> 404 (CR-O1) |
| c03 | Edit qty / delivered / price; silent re-rate on plain Enter | converted (**as-is**) | `PUT …/lines/:line` always recomputes at today's rate |
| c04 | ERR1001 / ERR1002 typed-vs-STORED | converted (**as-is**) | worked cases (20/15 rejected, 6/8 accepted, negatives) are tests; needs-SME preserved |
| c05 | Delete blocked when ODQTYLIV > 0 | converted (**as-is**) | guard reads the table, not a screen copy (CR-O6) |
| c06 | Delete line, footer adjust, blanked row | converted / residual | delete + ORD700 yes; blanked-row double subtraction is a subfile residual |
| c07 | Dead `6=Deliver` legend | **as-is** | legend shown, no action (needs-SME) |
| c08 | Dead declarations | n/a | nothing derived from them (no print, no add, no deliver here) |
| c09 | Callers ORD200 (unreachable) / ORD201 | converted (**as-is**) | see ord-maintain-ord200-c09 |
| c10 | No add-line path for existing orders | converted (**as-is**) | no route; `POST /api/orders/:id/lines` is 404 |
| c12 | Closed-order guard lives in the callers only | converted (**as-is**) | no closed / delivered test in the line surface; the web list refuses `2` on closed rows, the API does not |

### ord-maintain-ord200 / ord-maintain-ord201

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| 200-c01 / 201-c01 | List from ORDERCUS, dates, TOTVAL | converted (**as-is**) | inner join hides orphans (**planted defect kept**); ORD201 tie-breaker used for both (CR-O4); 14/page with offset paging for both (ORD200 loaded all — CR-O5); ORD200 unhandled F5 -> no F5 on that page |
| 200-c02 / 201-c02 | F6 create | converted | preselected customer vs prompt |
| 200-c03 / 200-c09 | Option 2 **unreachable** (precedence defect) | **as-is, planted defect kept** | `/orders?cuid=` shows `2=Edit` refused with "Closed order can not be edited or deleted" on every row; `/orders` (ORD201, correct parentheses) allows it on open orders |
| 200-c04 / 201-c04 / 200-c13 | Option 4 delete, guards, twin ordering | converted | lines then header in **one transaction** (CR-O3) — no orphan-lines / header-without-lines residue; ghost rows not reproduced (list reloads); `CULASTORD` **not** maintained on delete (200-c12, as-is, needs-SME) |
| 200-c05 / 201-c05 | Options 5 / 6 with no guard | converted | display / print any order at any state |
| 200-c06 / 201-c06 | Option 7 close | converted (**as-is**) | stamps delivery date when blank, lines untouched, `arcusqty` not reduced; already closed -> `Invalid Option` |
| 200-c07 | Option 8 deliver | converted (**as-is**) | undelivered lines -> fully delivered, partial lines skipped, not closed; deliver-after-close impossible; already delivered -> `Invalid Option` |
| 200-c08 / 201-c07 | Option guards, generic text, one-bad-row-cancels-pass, dead sticky `3` | converted / residual | texts and rules yes (first hit reported); whole-pass cancellation and sticky `3` are subfile residuals |
| 201-c08 | F5 refresh | converted | link on `/orders` only |
| 201-c09 / 200-c10 | Menu / CUS200 callers | converted / residual | `/orders` reachable directly; the CUS list link stays unwired (CUS pack) |
| 201-c10 / 201-c11 | Dead files, cursor close | n/a | nothing to carry |
| 200-c11 | Header context, sentinel dates | converted | header name via GetCusName (blank on miss); NULL dates render blank |

### ord-maintain-ord202

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c01 | Header, sentinel dates, **not-found exception** | converted / needs-SME | dates: NULL -> blank / `null`; not-found -> **404** (CR-O1, legacy crashed; no presentation invented) |
| c02 | Every line, stored sums, description hidden until F11 | converted (**as-is**) | `?detail=1` = F11; sums are stored values; missing article -> blank via FARTICLE (CR-O2; legacy repeated the previous line) |
| c03 / c05 | Any key closes; dead F5/F6; display-side paging | residual | stateless page; no dead keys rendered |
| c04 | Callers option 5 | converted | |
| c06 | Direct ARTICLE1 access vs FARTICLE | changed (CR-O2) | one lookup rule (FARTICLE) for the whole vertical |

### ord-print-ord500

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c01 | Spool layout, 15 details / page, stored sums, VAT = total - net | converted | text pages; positions from SKIPB/SPACEB (page length assumed 66); order date ISO not `*JOB` (CR-O7) |
| c02 | PATH lookup, 5-char PDF name truncation | **needs-SME / not implemented** | no PARAMETER table, no PDF name — nothing invented |
| c03 | CVTSPLPDF | **needs-SME / not implemented** | c04 blind spot; only the spool content is converted |
| c05 | Callers; print as unconditional synchronous side effect of confirm | needs-SME | confirm returns the document link; rendering is on request |
| c06 | Direct file access, miss semantics | changed (CR-O2) | blank description / blank customer block on a miss |
| c07 | Code quirks | n/a | none carried; the load-bearing `close` has no equivalent |
| c08 | Unknown order id -> exception | needs-SME | **404** (CR-O1) |

### ord-trigger-ord700

| Card | Behaviour | Status | Notes |
| --- | --- | --- | --- |
| c02 | Insert adds full ODQTY | converted (**as-is**) | Postgres trigger |
| c03 | Delete logs then subtracts outstanding | converted (**as-is**) | `samlog` table; log line format kept; log never fails silently here (no user space) |
| c04 | Update delta, article change, `*CHANGE` | converted (**as-is**) | `WHEN (OLD.* IS DISTINCT FROM NEW.*)` |
| c05 | Silent no-op on zero / unknown; negative allowed | converted (**as-is**) | |
| c06 | Trigger buffer plumbing | replaced | not ported (bind note) |
| c07 | ORD701 unconditional CULASTORD | converted (**as-is**) | yyyymmdd at the CUS boundary |
| c09 | Staging copy excludes triggers | converted | the draft never touches `detord` |
| c10 | ART801 reconciliation | **residual** | owned by `sql-objects`, not in this pack |

## SME open questions — kept visible, not answered here

From the seven `discovery/ord-*/SME_BRIEF.md` files; preserved as-is in the code (comments cite
the card id). Nothing below is a target decision.

- **ORD200 option 2 unreachable** (200-c09 / 101-c09): preserved — the per-customer web list
  refuses every `2=Edit`; line maintenance is reached from `/orders` only.
- **ORDERCUS inner join** (201-c01): preserved — orphan orders are listed nowhere; `GET /api/orders/:id`
  still shows them with a blank customer.
- **VAT silent zero** (100-c03, vat-module-c02): preserved in `shared/fvat`.
- **No SoT twin for ORD200/ORD201**: both twins are served by one list with the ORD201 sort and
  paging; which twin is the parity reference for delete residue and screen behaviour stays open.
- **Not-found order on display / print / close / deliver** (202-c01, 500-c08): legacy raised an
  exception; the API answers 404 with `ORDER_NOT_FOUND`. Recorded as CR-O1, not as the answer.
- **Description hidden until F11** (202-c02): reproduced as the default (F11 link toggles).
- **PDF scope** (500-c02/c03/c04), **5-char name truncation**, **sync print on confirm** (500-c05):
  not implemented, not decided; the document is text on request.
- **ODYEAR = 0** until ORD901 (100-c07): preserved.
- **Typed-vs-stored quantity rules, negative delivered** (101-c04): preserved.
- **Close vs deliver semantics, `Invalid Option` wording, partial lines frozen, header delivered
  with outstanding lines** (200-c06/c07/c08): preserved.
- **CULASTORD not maintained on delete** (200-c12, 700-c08); **ARCUSQTY not reduced by close**
  (700-c11); **insert adds ordered, not outstanding** (700-c02): preserved.
- **Dead `6=Deliver`** (101-c07), **dead sticky `3`** (201-c07): legend kept / not reproducible.

## Deliberate deltas (CONTRACT_RISK — left open for Verification)

| Id | Delta | Why |
| --- | --- | --- |
| CR-O1 | Unknown order / line -> `404 ORDER_NOT_FOUND` | Legacy had no not-found path (unmonitored `%date(0)` exception in ORD202/ORD500, update-without-lock in ORD200/201). HTTP must answer something; the answer is recorded, not decided |
| CR-O2 | One article / customer lookup rule: blank on a miss (FARTICLE / FCUSTOMER semantics) | ORD202 and ORD500 chained the files directly and repeated the previous line's description; two rules for one fact in the estate |
| CR-O3 | Confirm (header + lines) and delete (lines + header) are single transactions | No commitment control in legacy; the partial-write residues (100-c07, 200-c13, 201-c04) cannot be reproduced meaningfully over HTTP and would be invented failure modes |
| CR-O4 | Per-customer list uses the ORD201 sort (`ordate desc, orid desc`) | ORD200 had no tie-breaker (order of same-day rows unspecified); a superset ordering |
| CR-O5 | Per-customer list is paged 14 at a time | ORD200 loaded the whole result; ORD201 paged. One list serves both |
| CR-O6 | Delete-line guard and delete-order deliveries guard read the table | Legacy ORD101 tested the subfile's hidden copy; the order-level test already read the file |
| CR-O7 | Dates are ISO everywhere (`ordate` on the document, headers) | Legacy used `*JOB` on lists/print and `*DMY` two-digit years on ORD202; no job date format exists |
| CR-O8 | No session-long header lock (101-c02), no record locks on lines, no ghost rows, no pending-option mechanics | Stateless HTTP; every action reloads |
| CR-O9 | `article`, `vatdef` are read-only dependency tables with fixture rows; `samlog` is a table | ORD needs GetArtDesc / GetArtRefSalPrice / GetArtVatCode / CLCVat / the deletion log; ART, VAT maintenance and the `SAMLOG` user space are not converted |
| CR-O10 | Over-long / non-numeric fields -> `400 FIELD_*`; `qty x price` beyond 9P 2 -> `400 TOTAL_OVERFLOW` | 5250 field lengths made this impossible; legacy raised an unmonitored size exception |
| CR-O11 | Line totals recomputed at confirm with the current VAT rate | Legacy copied the staged `ODTOT`/`ODTOTVAT` computed when the line was typed; identical unless the rate changed while the draft was open |

## Not done in this pack

- ART conversion; ORD900 / ORD901 batches; ART801 reconciliation; VAT / article / PARAMETER
  maintenance; any PDF; any interop with IBM i.
- IBM i goldens, RECORD/REPLAY, `REPLAY_GREEN`, or any IBM i parity claim (the Verification
  verdict is TS-boundary evidence only).
- Widening or editing pack `atu-merlin-ts-cus-v1` or its code (the CUS list's `5=Orders` stays unwired).
- Edits under `ATU_SRC/**`, `discovery/**`, `inventory/**`, `src/db/**`.
