# atuMerlin — modern CUS vertical (pathfinder)

TypeScript modular monolith for the **CUS vertical only** (`cus-interactive` + `cus-modules`),
built under Architecture pack **`atu-merlin-ts-cus-v1@1`** (`architecture/atu-merlin/PACK.yaml`,
`status: BOUND`) with a separate convert `ROOM_OK`.

This is a **pathfinder**, not "Merlin migrated". ORD, ART and everything else stays on IBM i.
Characterization is `WAIVED_PATHFINDER`: there are no IBM i goldens and no `REPLAY_GREEN`;
behaviour is compared at the TypeScript API only. **parity: TS_BOUNDARY_GREEN** under the waiver
(`verification/cus-vertical/2026-09-08-r1/PARITY.yaml`) — evidence at the TS boundary, **not** parity against IBM i.

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
  db/schema.sql                    PF -> table, LF -> index, CUSSEQ -> sequence, COUNTRY dependency table
  openapi/customer.yaml            HTTP contract
  src/app.ts, src/server.ts        Fastify app / entry
  src/db/                          pool, migrate, seed (fixtures), cli
  src/shared/fcustomer/            FCUSTOMER (CUS300 getters, ExistCus, IsCusDeleted, CUS301 SltCustomer)
  src/shared/fcountry/             FCOUNTRY dependency surface (ExistCountry, GetCountryName, list) — read-only
  src/features/customer/           CUS200 / CUS250: types, repository, service (validation), routes, web
  test/                            vitest suites at the TS boundary (real Postgres)
  scripts/local-pg.sh              throw-away local Postgres cluster
```

## Run

```bash
cd modern
npm install
./scripts/local-pg.sh start            # or point DATABASE_URL at any Postgres 14+
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run db:seed                         # schema + dev fixtures (not legacy data)
npm run dev                             # http://127.0.0.1:3000/customers
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

- ORD / ART / country maintenance conversion; any interop with IBM i.
- IBM i goldens, RECORD/REPLAY, `REPLAY_GREEN`, or any parity claim.
- Production auth, migrations tooling, deployment.
- Edits under `ATU_SRC/**`, `discovery/**`, `inventory/**`.
