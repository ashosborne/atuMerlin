# SME_BRIEF — ord-batch-ord900 (Phase A, awaiting human bind)

## What was found

Two menu-invoked utilities. `ORD900` resets the `LASTORDNO` data area to the highest order id. `ORD901` slides every order's dates forward so the newest order is dated today, derives delivery/close dates (future → 0; delivered >10 days and open → closed at delivery+10), then resyncs `DETORD.ODYEAR` and `CUSTOMER.CULASTORD`. 9 candidates: 8 `observed-in-code`, 1 `inferred` (purpose).

Reading the menu texts ("Reset LASTORDNO", "Reset Order dates to current", "Reset Summary Fields" for `ART801`) these look like **sample-data refresh tools**, not business batch. That is an inference; the SME should confirm.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Are these in conversion scope at all? | If confirmed as demo tooling → recommend **defer** the slice (keep in inventory as a known surface). |
| `CULASTORD` recompute duplicates `ART801` | One rule, two implementations — bind the rule once (suggest under `ord-trigger-ord700` or `sql-objects`), reference here. |
| `ORD900` and order numbering | Pairs with `ord-entry-ord100-c07` (`LASTORDNO` consumption). |

## Recommended bind (recommendation only)

- **accept (if slice is kept):** c01, c03, c04, c05
- **thin / fold:** c02, c06, c09
- **needs-SME:** c07 (purpose), c08 (scheduling is runtime-only)

## Open questions

1. Are `ORD900`/`ORD901`/`ART801` ever run in a real environment, or only to refresh the Arcad sample?
2. If `ORD901` is business behaviour, the "auto-close after 10 days delivered" rule (`ORD901.PGM.SQLRPGLE:34-36`) is a hidden business rule nobody has documented — confirm.

Did not: bind, deepen Phase B, generate tests, or convert.
