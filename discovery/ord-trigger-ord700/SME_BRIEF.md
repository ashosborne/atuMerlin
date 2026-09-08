# SME_BRIEF — ord-trigger-ord700 (Phase A, awaiting human bind)

## What was found

Two database-side effects on order writes: `ORD700` (external trigger on `DETORD`) keeps `ARTICLE.ARCUSQTY` in step with outstanding ordered quantity on insert/delete/update and logs deletions; `ORD701` (SQL trigger on `ORDER` insert) stamps `CUSTOMER.CULASTORD`. 11 candidates: 7 `observed-in-code`, 4 `inferred` (trigger attachment on the box; two consistency consequences; one arithmetic divergence).

This is the "fire-and-forget / async by effect" seam the estate loop is told to flag: every order write in `ORD100/101/200/201` has hidden consequences here. It must **not** be smashed into the writer slices.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Incremental (triggers) vs batch (`ART801`) maintenance of the same fields | Two implementations of overlapping rules. Recommend one **rule card** ("ARCUSQTY = outstanding ordered qty on open orders") with two implementation notes, owned here, referenced from `sql-objects`. |
| `ORD701` placement | Keep here (order-write side effect) even though it touches CUSTOMER. |
| `AddLogEntry` / `SAMLOG` user space | Dependency on `log-programs` seed; whether the log is an observable is an SME decision. |

## Recommended bind (recommendation only)

- **accept:** c02, c03, c04, c05, c07, c09
- **accept as wiring/mechanics note:** c01, c06
- **needs-SME:** c08, c11 (inferred consistency findings — verify with data)
- **pointer to sql-objects:** c10

## Open questions

1. Are the triggers actually attached on the reference box (`DSPFD DETORD` / `ORDER`)? Source definitions exist; attachment is runtime state.
2. On order **close** (ORD200/201 opt 7) nothing adjusts `ARCUSQTY`, yet `ART801` excludes closed orders. Which value is "right" for the business?
3. Is the `SAMLOG` deletion log consulted by anyone (menu opt 84 `ADSPUSRSPC SAMLOG`, command not in tree)?

Did not: bind, deepen Phase B, generate tests, or convert.
