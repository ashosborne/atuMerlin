# cus-interactive-c11 — No delete path for customers in this seam (CUDEL never set)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B — absence finding) |
| Confidence | `observed-in-code` (absence within `ATU_SRC`) |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUSTOMER.CUDEL` (1A, `'X'` = deleted per `SAMREF.DLCODE`) exists and is honoured by `FCUSTOMER.ExistCus`, but neither `CUS200` nor `CUS250` sets, clears, or filters on it; no program under `ATU_SRC` writes `CUDEL` for customers.

## Entrypoints

- Field: `CUDEL R REFFLD(DLCODE)` — `ATU_SRC/QDDSSRC/CUSTOMER.PF:29`; `DLCODE 1 TEXT('DELETE CODE X=DELETED')` — `ATU_SRC/QDDSSRC/SAMREF.PF:26-27`
- `CUS200` allowed options: `2`, `5` only — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:199`; legend "2=Edit 5=Orders" — `ATU_SRC/QDDSSRC/CUS200D.DSPF:53-56`
- `CUS200` list shows `CUDEL` in column "Del" — `CUS200D.DSPF:22,63`

## Inputs / outputs / observables

- Observable: a customer with `CUDEL = 'X'` still appears in the `CUS200` list (flag visible), is editable via option 2 (the flag is not on `FMT02`, so it survives the update unchanged), can be opened in `CUS250`, and can be passed to `ORD200` via option 5.

## Behaviour as implemented

1. `CUS200` list load reads `CUSTOME2` unfiltered. — `CUS200.PGM.SQLRPGLE:129-144`
2. `FMT02` has no `CUDEL` field; `RESET FCUST` on create leaves it blank; update preserves the stored value. — `CUS200D.DSPF:84-145`, `:184,258`
3. `CUS250` chains without a `CUDEL` test. — `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:98-99`
4. Contrast, dep only: `FCUSTOMER.ExistCus` returns `%found and CUDEL <> 'X'` and `IsCusDeleted` returns `CUDEL = 'X'` — the service program treats `'X'` customers as non-existent, while the interactive programs do not. — `ATU_SRC/QRPGLESRC/CUS300.RPGLE:155-171`

## Validation rules found in code

- None relating to deletion in this seam.

## Edge cases found in code

- A customer flagged `'X'` by some external process is still fully maintainable here, but `ORD100` (order entry, via `ExistCus`) would reject it — behavioural asymmetry across seams. — `CUS300.RPGLE:158`
- No hard delete either: no `DELETE` op on `CUSTOME1` in `CUS200`; the file is `UF A` (update/add). — `CUS200.PGM.SQLRPGLE:29`
- Article maintenance (`ART200`, slice `art-interactive`) has a soft-delete option; customers do not — known gap, not a behaviour to invent.

## Dependencies

- `CUSTOMER.PF`, `SAMREF.PF`; `FCUSTOMER` (`CUS300`) for the contrast only.

## Assumptions / unknowns

- **needs-SME:** is customer soft-delete performed outside `ATU_SRC` (SQL, QM query, another library), or never? Search across `ATU_SRC` finds no writer of `CUDEL` for `CUSTOMER` (`rg -i CUDEL`: only `CUSTOMER.PF`, `CUS200D.DSPF` display, `CUS300.RPGLE` reads).
- A modern target must decide whether to keep "deleted customers remain listable" as-is; not decided here.

## Evidence

`ATU_SRC/QDDSSRC/CUSTOMER.PF:29` · `ATU_SRC/QDDSSRC/SAMREF.PF:26-27` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:29,129-144,184,199,258` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:22,53-56,63,84-145` · `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:98-99` · `ATU_SRC/QRPGLESRC/CUS300.RPGLE:155-171`
