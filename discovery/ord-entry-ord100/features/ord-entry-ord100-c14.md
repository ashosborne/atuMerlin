# ord-entry-ord100-c14 — No stock / credit / date checks at entry (absence)

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B; recorded absence) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD100` performs no business validation beyond option syntax (`c06`). It opens no `CUSTOMER` or `ARTICLE` file itself and calls only seven service-program procedures: `SltCustomer`, `GetCusName`, `SltArticle`, `GetArtDesc`, `GetArtRefSalPrice`, `GetArtVatCode`, `CLCVat`/`GetVatRate`. Therefore: no credit-limit or credit-balance check (`CULIMCRE`, `CUCREDIT` never read), no stock check (`ARSTOCK`, `GetArtStock` never read), no customer/article existence or soft-delete check (`ExistCus`, `IsCusDeleted`, `ExistArt`, `IsArtDeleted` never called), no delivery-date capture (`ORDATDEL` is written as `0`), no quantity/price range check, no duplicate-article check. This card exists so later stations do not invent those rules.

## Entrypoints

- F-specs — only `ORDER`, `DETORD`, `TMPDETORD`, `ORD100D` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-16`
- Prototype includes — `CUSTOMER`, `ARTICLE`, `VAT` — `ORD100.PGM.RPGLE:18-20`
- Procedure calls actually made — `ORD100.PGM.RPGLE:117,253,259,266-269,294,321,328`

## Inputs / outputs / observables

- Observable absence: any customer id (existing, missing, `CUDEL = 'X'`) and any article returned by `SltArticle` are accepted; any quantity/price that fits the fields is accepted; every order is created with `ORDATDEL = 0`, `ORDATCLO = 0`.

## Behaviour as implemented

1. Customer: `orcuid = cuid` or `SltCustomer(0)`; only `GetCusName` is called afterwards (`c01`). — `ORD100.PGM.RPGLE:320-328`
2. Article: `sltArticle(' ')`, then `GetArtDesc`, `GetArtRefSalPrice`, `GetArtVatCode` (`c03`). — `ORD100.PGM.RPGLE:253-269`
3. Amounts: `odtot = odqty * odprice`; VAT via `CLCVat`; no comparison against any limit (`c03`, `c04`). — `ORD100.PGM.RPGLE:260,293-295`
4. Dates: `ORDATE = today`, `ORDATDEL = ORDATCLO = 0` (`c07`). — `ORD100.PGM.RPGLE:194-196`

## Validation rules found in code

None of the business kind. The complete list of checks in the program is: option ∈ {0, 2, 4}; no `F8` with pending options (`c06`); `SltCustomer(0)` result `≠ 0` (`c01`); `sltArticle` result `≠ ' '` (`c03`, and even that does not stop the line counter).

## Edge cases found in code

- **Available but unused guards.** `FCUSTOMER` exports `ExistCus` / `IsCusDeleted` (no caller anywhere under `ATU_SRC`, `cus-modules-c02`/`c03`); `FARTICLE` exports `ExistArt`, `IsArtDeleted`, `GetArtStock`, `GetArtMinStock`; none are called here. — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:71-77`, `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:29-35,44-50`
- **Data that would support checks exists**: `CUSTOMER.CULIMCRE` / `CUCREDIT` (9 2), `ARTICLE.ARSTOCK` (5 0). — `ATU_SRC/QDDSSRC/CUSTOMER.PF:17-20`, `ATU_SRC/QDDSSRC/ARTICLE.PF:17`
- **Stock is affected only indirectly**: `ARTICLE.ARCUSQTY` is maintained by the `ORD700` trigger on `DETORD` insert, if attached (`c11`, needs-SME; slice `ord-trigger-ord700`). `ORD100` itself never reads or writes `ARTICLE`. — `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7`
- **Soft-deleted articles** can be ordered if `SltArticle` lists them (Phase A `SME_BRIEF` question 3 → `art-modules-c09`, skipped this round).
- Prices are taken from `ARSALEPR` at entry and may be overtyped freely (`c03`, `c04`).

## Dependencies

- `FCUSTOMER`, `FARTICLE`, `FVAT` prototypes — `CUSTOMER.RPGLEINC`, `ARTICLE.RPGLEINC`, `VAT.RPGLEINC`
- `CUSTOMER.PF:17-20`, `ARTICLE.PF:17` (fields that exist but are not consulted)

## Assumptions / unknowns

- Whether credit / stock control is expected to live elsewhere (batch `ORD9xx`, deferred; or outside `ATU_SRC`) — needs-SME. As-is: not at order entry.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-20,117,194-196,253-269,293-295,320-328` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:71-77` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:29-35,44-50` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:17-20` · `ATU_SRC/QDDSSRC/ARTICLE.PF:17` · `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7`
