# How the modern CUS vertical works — plain English

Pack `atu-merlin-ts-cus-v1@1` · Conversion commits `677d682` … `a63d416` on PR [#1](https://github.com/ashosborne/atuMerlin/pull/1) · Verification run `2026-09-08-r1`

## What moved

Two Discovery slices, `cus-interactive` (the CUS200 work-with/create/update screens and the CUS250 inquiry) and `cus-modules` (the `FCUSTOMER` service program: getters, `ExistCus`, `IsCusDeleted`, the `SltCustomer` selection window), were rebuilt as one small TypeScript service under `modern/`. Nothing else moved. Orders (ORD), articles (ART) and country maintenance stay on the IBM i and the new service has no link to them.

## How the new path works

- **Storage.** The `CUSTOMER` physical file becomes a Postgres table `customer` with the same field names; the `CUSTOME2` logical file becomes an index on `(custnm, cuid)`; the `CUSSEQ` data area becomes a Postgres sequence starting at 1551. A read-only `country` table stands in for `FCOUNTRY` so the country checks and F4 prompt work.
- **Business rules.** `customer.service.ts` carries the CUS200 validation (`S02chk`) as written on the card: every rule runs in one pass, the country must exist, name and phone are mandatory, the phone is trimmed and must be digits, and duplicates are checked on `UPPER(name)+phone`. The three quirks the SME has not yet ruled on are kept deliberately: the update-mode duplicate rule is still `dup > 1`, `CUMODID` is stamped on create only, and nothing ever writes `CUDEL`.
- **HTTP API.** Six operations in `modern/openapi/customer.yaml`: list (`GET /api/customers`), create (`POST`), read (`GET /api/customers/{cuid}`), update (`PUT`), selector search (`GET /api/customers/search`) and countries (`GET /api/countries`). There is no delete and no orders endpoint on purpose. Errors reuse the legacy message ids (`ERR0002`, `ERR2000`–`ERR2002`, `ERR0103 "Code &1 Unknown."`).
- **Web.** Server-rendered pages under `/customers/**` mirror the 5250 screens: list with position-to and Page Down, create/edit form, inquiry prompt, detail, selector. Option 5 (orders) is shown but disabled.
- **Auth.** Pathfinder-open: the caller sends `X-User-Id` (default `WEB`); it is not production identity.

## What Verification checked, and what it did not

Verification ran the type checker and the 55 TS-boundary tests against a live Postgres, then booted the server and drove every API operation with a probe that asserts the response shape from the OpenAPI contract and the behaviour from the Discovery cards (31 cases, all passed). It then walked every card and confirmed each is either matched at the boundary or has a documented reason for not being carried, and dispositioned the nine deliberate deltas (CR-1..CR-9: seven acceptable for the demo, two deferred to the room).

It did **not** compare against the IBM i. There are no legacy goldens for this pathfinder, so the result is `TS_BOUNDARY_GREEN` under the `WAIVED_PATHFINDER` waiver, never `PARITY=GREEN`. The honest one-liner is: **CUS pathfinder verified at TS API under waiver — not Merlin migrated.**
