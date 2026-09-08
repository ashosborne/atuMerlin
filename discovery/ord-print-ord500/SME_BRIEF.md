# SME_BRIEF — ord-print-ord500 (Phase A, awaiting human bind)

## What was found

`ORD500(orid)` prints the order document to spool `ORD500O` (page break every 14 lines, totals) and then hands off to `ORD500C`, which runs `CVTSPLPDF` to write `Custord<orid>.pdf` into the IFS directory held in parameter `PATH` (via `FPARAMETER.getParm2`). 8 candidates: 7 `observed-in-code`, 1 `inferred` (missing `CVTSPLPDF` implementation).

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| PDF step | `CVTSPLPDF` implementation is outside the tree. Recommend binding the spool content (c01) as the behaviour and treating PDF (c03/c04) as an **integration edge** with unknown internals. |
| PRTF layout | Record formats identified; field-level layout not verified this pass — Pack B should do it if accepted. |
| `PATH` parameter | Depends on `par-maintain` / `srvpgm-supporting` seeds (not scanned this run). |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c08
- **thin / fold:** c05, c06, c07
- **needs-SME:** c04 (who owns `CVTSPLPDF`; is PDF in parity scope)

## Open questions

1. Which product supplies `CVTSPLPDF` and is its output part of the behaviour to preserve, or is "a PDF exists at PATH" enough?
2. Printing an unknown order id produces a blank document (c08) — acceptable as-is?
3. `ORD500` runs synchronously after every order confirm (`ORD100`). Is the print mandatory in the target, or an optional side effect?

Did not: bind, deepen Phase B, generate tests, or convert.
