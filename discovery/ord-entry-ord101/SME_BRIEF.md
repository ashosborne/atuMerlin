# SME_BRIEF — ord-entry-ord101 (Phase A, awaiting human bind)

## What was found

`ORD101(orid)` maintains the lines of an existing order: edit ordered/delivered/price with two quantity rules (`ERR1001`/`ERR1002`), delete a line unless it has deliveries. No add-line path, no closed-order check of its own. 12 candidates: 11 `observed-in-code`, 1 `inferred` (trigger attachment).

Naming: the charter labels this seam "order entry follow-on"; the code is line maintenance. SLICE_ID kept as charter wrote it.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Merge with `ord-entry-ord100`? | No — different lifecycle (create vs amend), different files (temp vs live). Keep thin. |
| Closed-order guard (c12) | Belongs to `ord-maintain-ord200/201` cards; here record the absence. |
| Trigger effects (c11) | Pointer to `ord-trigger-ord700`. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c04, c05, c06, c10
- **accept as thin/quirk card or fold:** c07, c08, c09, c12
- **pointer only:** c11

## Open questions

1. Is option 6 (dead) a removed print action? `ORD500` prototype is declared but unused.
2. Should a direct call to `ORD101` on a closed order be possible (no guard inside)?
3. Quantity rules compare display copies against the stored row (`dsqtyliv > odqty`, `dsqty < odqtyliv`) rather than the two new values against each other — confirm this is the intended semantics before Pack B documents it as a rule.

Did not: bind, deepen Phase B, generate tests, or convert.
