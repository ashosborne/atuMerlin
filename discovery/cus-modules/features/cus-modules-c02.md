# cus-modules-c02 — ExistCus (found and not deleted)

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ExistCus(id)` runs the shared cached `CHAIN` on `CUSTOME1` and returns `%found(custome1) and CUDEL <> 'X'`: true only for a stored customer row whose delete code is not an uppercase `X`. No program under `ATU_SRC` calls it.

## Entrypoints

- Exported symbol `EXISTCUS` — `ATU_SRC/QSRVSRC/FCUSTOMER.BND:5`
- Prototype `ExistCus PR n; P_CUID 5 0 value` — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:71-72`
- Implementation — `ATU_SRC/QRPGLESRC/CUS300.RPGLE:152-160`

## Inputs / outputs / observables

- In: customer id `5 0` by value.
- Out: indicator (`n`). No message, no side effect other than the cached record buffer now holding that id (or cleared).

## Behaviour as implemented

1. `chainCUSTOME1(P_CUID)` — lazy open + last-key cache, see `cus-modules-c04`. — `CUS300.RPGLE:156`
2. `return %found(custome1) and CUDEL <> 'X';` — `CUS300.RPGLE:158`
3. Truth table (static derivation):

| Row state | `%found` | `CUDEL` | `ExistCus` |
| --- | --- | --- | --- |
| stored, not deleted | 1 | `' '` (or anything but `X`) | **true** |
| stored, soft-deleted | 1 | `'X'` | false |
| no such id | 0 | `' '` (buffer cleared) | false |

4. Only uppercase `X` counts as deleted (`SAMREF` `DLCODE` text "DELETE CODE X=DELETED"). A lowercase `x` or any other marker makes the customer "exist". — `ATU_SRC/QDDSSRC/SAMREF.PF:26-27`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:29`

## Validation rules found in code

None beyond the two-part predicate. The id itself is not validated.

## Edge cases found in code

- **No callers in `ATU_SRC`.** Structural grep finds `ExistCus` only in `CUS300`, the include and the binder source. The "deleted customers do not exist" rule is therefore not enforced by any observed screen or batch path; `CUS200`/`CUS250` list, edit and display `CUDEL = 'X'` rows (`cus-interactive-c11`), and `SltCustomer` lists them too (`cus-modules-c11`).
- **Cache interaction.** Repeating the same id skips the `CHAIN`; `%found(custome1)` then still reflects the last real I/O on `CUSTOME1`, which was the `CHAIN` for that same id — consistent. After a miss the buffer `CUID` is `0`, so a following `ExistCus(0)` also skips the `CHAIN` and returns false from the failed `CHAIN` — correct by coincidence. — `CUS300.RPGLE:180-184`
- **Zero id as the very first call.** The buffer field `CUID` is numerically initialised to `0`, so `ExistCus(0)` before any other `FCUSTOMER` call never performs a `CHAIN`; `%found(custome1)` is then evaluated with no prior operation on the file. IBM documents `%FOUND` only relative to "the most recent relevant operation"; the value with no operation is not documented. Result **unknown** (not runtime-confirmed). `CUSSEQ` starts at 1551, so id `0` should not be a real customer. — `CUS300.RPGLE:13,180`, `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-6`
- `%found(custome1)` names the file explicitly, so unrelated `CHAIN`s on other files in the caller do not leak into the result. — `CUS300.RPGLE:158`

## Dependencies

- `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`; `ATU_SRC/QDDSSRC/CUSTOMER.PF:29` (`CUDEL`); `ATU_SRC/QDDSSRC/SAMREF.PF:26-27` (`DLCODE`)
- `chainCUSTOME1` (`cus-modules-c04`)

## Assumptions / unknowns

- Is `ExistCus` called from anything outside `ATU_SRC` (QM queries, other libraries, CL not in tree)? If not, the soft-delete rule has no live consumer — **needs-SME**.
- `%FOUND` before any file operation — runtime detail, not resolvable from source.

## Evidence

`ATU_SRC/QRPGLESRC/CUS300.RPGLE:13,152-160,173-186` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:71-72` · `ATU_SRC/QSRVSRC/FCUSTOMER.BND:5` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:29` · `ATU_SRC/QDDSSRC/SAMREF.PF:26-27` · `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-6`
