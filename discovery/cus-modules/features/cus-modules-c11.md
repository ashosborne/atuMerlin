# cus-modules-c11 — Blank criteria list-all semantics

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The `if / elseif / else` in `s01prp` has no both-blank branch: when name and city are both blank the `else` (city) branch runs with `LIKE '%%'`. `CUCITY` is a DDS `CHAR(30)` column without `ALWNULL`, so every customer — including soft-deleted ones — is listed, ordered by name, 14 per page.

## Entrypoints

- Branch logic — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:104-114`
- `CUCITY` definition — `ATU_SRC/QDDSSRC/CUSTOMER.PF:15` → `CITY 30` in `ATU_SRC/QDDSSRC/SAMREF.PF:22-23`

## Inputs / outputs / observables

| `SRCHNAME` | `SRCHCITY` | Branch taken | Predicate |
| --- | --- | --- | --- |
| non-blank | non-blank | `if` | name `AND` city |
| non-blank | blank | `elseif` | name only |
| blank | non-blank | `else` | city only |
| blank | blank | `else` | `UPPER(CUCITY) like '%%'` → all rows |

## Behaviour as implemented

1. Tests are `srchName <> ' '` / `srchCity <> ' '` (fixed-length compare, so all-blank = blank). — `CUS301.SQLRPGLE:104,108`
2. Both blank → `stm += 'Where UPPER(CUCITY) like ''%' + %trim(srchCity) + '%'' '` with an empty trim → `'%%'`. — `:111-113`
3. `LIKE '%%'` matches any non-null value, including an all-blank `CUCITY`. DDS physical-file fields are `NOT NULL` unless `ALWNULL` is coded (none is), so no row is excluded. — `CUSTOMER.PF:5-29`
4. `ORDER BY CUSTNM`; paged 14 rows per Page Down with one-row look-ahead (`c06`). — `:115,133-140`

## Validation rules found in code

None. There is no minimum-criteria rule and no "too many rows" guard.

## Edge cases found in code

- **First use lists everything.** `ORD100` with no parameter calls `SltCustomer(0)` at `*inzsr`; on the first call in an activation group the criteria fields are blank, so the operator sees the full customer list before typing anything. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:320-321`
- **Persisted criteria.** On later calls the previous criteria are still in the display-file fields (`c06`), so "blank → all" applies only until the user has typed something once in that activation group.
- **Soft-deleted rows included.** No `CUDEL` filter in any branch; `FCUSTOMER.ExistCus` (`c02`) would say these customers do not exist, yet they are selectable here.
- **Cost.** Full-table `ORDER BY CUSTNM` per prepare; only 15 rows are fetched before the first display, the rest on demand. Index usage is runtime (`CUSTOME2.LF` keyed on `CUSTNM`, `CUID` exists but the SQL path picks its own access plan).
- Blank city with non-blank name never reaches the city branch, so `'%%'` on `CUCITY` only occurs in the both-blank case.

## Dependencies

- `CUSTOMER` table (`ATU_SRC/QDDSSRC/CUSTOMER.PF`), `ATU_SRC/QDDSSRC/SAMREF.PF:22-23`

## Assumptions / unknowns

- Bind open question (from `SME_BRIEF`): should the modern seam keep "list all when criteria blank"? Documented as-is; decision is the SME's.

## Evidence

`ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:103-115,133-140` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:15` · `ATU_SRC/QDDSSRC/SAMREF.PF:22-23` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:320-321`
