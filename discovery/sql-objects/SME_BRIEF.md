# SME_BRIEF — sql-objects (Phase A, awaiting human bind)

## What was found

Five SQL-defined objects: two views (`ORDERCUS` — the read contract behind both order lists; `ARTLSTDAT` — no in-tree consumer), one table (`ARTIINF` — article free text), one sequence (`CUSSEQ`) and one stored procedure (`ART801`). 10 candidates: 9 `observed-in-code`, 1 `inferred` (who reads `ARTLSTDAT`).

Two of the rows (c07 `CUSSEQ`, c08 `ART801`) are **surfaces for behaviours already documented** under `cus-interactive` and `ord-trigger-ord700`; this seed does not re-scan them, it gives them an object of their own in `APP_MANIFEST`.

The one new rule: **`ORDERCUS` inner-joins `CUSTOMER`** (c01), so an order whose customer row is missing is invisible in `ORD200` / `ORD201` — and its total is VAT-inclusive (c02).

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Views as "slices" | They are data contracts, not callable seams. Recommend binding c01 / c02 as **dependency notes** on `ord-maintain-ord200` / `ord-maintain-ord201` when those are bound, rather than as a standalone slice. |
| `ART801` home | Keep the card under `ord-trigger-ord700-c10`; accept `sqlprc:ART801` here as the callable surface only. |
| `ARTLSTDAT` | `defer` until the QM query sources are available. |
| `ARTIINF` | Table contract for the ART slices; card when `art-interactive` is bound. |

## Recommended bind (recommendation only)

- **accept as dependency notes:** c01, c02 (on the ORD200/201 slices), c05, c06 (on ART), c07, c08 (surfaces only)
- **thin / fold:** c09, c10
- **defer:** c03, c04

## Open questions

1. Should the target keep the inner-join semantics of `ORDERCUS` (orders for missing customers hidden)?
2. Where is `ARTLSTDAT` used (QM source)?

Did not: bind, deepen Phase B, generate tests, or convert.
