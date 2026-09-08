# cus-modules-c03 — IsCusDeleted

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`IsCusDeleted(id)` runs the shared cached `CHAIN` and returns `CUDEL = 'X'`. Because a miss leaves the buffer cleared, an unknown id returns false — "not deleted" and "does not exist" are indistinguishable from this call alone. No program under `ATU_SRC` calls it.

## Entrypoints

- Exported symbol `ISCUSDELETED` — `ATU_SRC/QSRVSRC/FCUSTOMER.BND:18`
- Prototype `IsCusDeleted PR n; CUID 5P 0 value` — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:76-77`
- Implementation — `ATU_SRC/QRPGLESRC/CUS300.RPGLE:163-171`

## Inputs / outputs / observables

- In: customer id `5 0` by value. Out: indicator. Side effect: record buffer now holds that id (or is cleared).

## Behaviour as implemented

1. `chainCUSTOME1(P_CUID)` (`cus-modules-c04`). — `CUS300.RPGLE:167`
2. `return CUDEL = 'X';` — no `%found` test. — `CUS300.RPGLE:169`
3. Combined with `ExistCus` (`c02`):

| Row state | `ExistCus` | `IsCusDeleted` |
| --- | --- | --- |
| stored, not deleted | true | false |
| stored, `CUDEL = 'X'` | false | **true** |
| no such id | false | false |

So `not ExistCus(id) and not IsCusDeleted(id)` is the only way to infer "missing" through this API (subject to the `%found` initial-state caveat in `c02`).

## Validation rules found in code

None.

## Edge cases found in code

- Exact, case-sensitive comparison with `'X'`; any other value in the 1-character `CUDEL` is "not deleted". — `CUS300.RPGLE:169`, `ATU_SRC/QDDSSRC/SAMREF.PF:26-27`
- Unknown id → buffer cleared by `chainCUSTOME1` → `CUDEL = ' '` → false. — `CUS300.RPGLE:182-183`
- Cached: a customer soft-deleted by another program after it was chained here keeps reporting false for the same id until a different id is requested (no invalidation; `c04`).
- No writer of `CUDEL` for customers exists under `ATU_SRC` (`cus-interactive-c11`), so as far as the tree shows this call can only return true for rows flagged outside the application.
- **No callers in `ATU_SRC`** (structural grep).

## Dependencies

- `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`; `ATU_SRC/QDDSSRC/CUSTOMER.PF:29`; `chainCUSTOME1` (`c04`)

## Assumptions / unknowns

- Callers outside `ATU_SRC` — same needs-SME question as `c02`.

## Evidence

`ATU_SRC/QRPGLESRC/CUS300.RPGLE:163-171,180-184` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:76-77` · `ATU_SRC/QSRVSRC/FCUSTOMER.BND:18` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:29` · `ATU_SRC/QDDSSRC/SAMREF.PF:26-27`
