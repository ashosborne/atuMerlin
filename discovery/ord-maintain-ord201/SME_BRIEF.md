# SME_BRIEF — ord-maintain-ord201 (Phase A, awaiting human bind)

## What was found

`ORD201` is the menu-reachable (opt 3) order work-with across all customers. Same lifecycle options as `ORD200`, paged 14 rows, with the closed-order guard written correctly. 11 candidates, all `observed-in-code`.

Divergences from `ORD200` found this pass (both directions):

| Topic | ORD200 | ORD201 |
| --- | --- | --- |
| Paging | loads all rows | 14 per page |
| Option 2 closed guard | broken precedence (always rejects) | correct |
| Delete order | header then lines | lines then header |
| Option 3 | rejected | accepted, no action (dead) |
| Cursor at end | not closed | closed |

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Merge with `ord-maintain-ord200`? | Charter says no (thin seams). Recommend: bind separately, document lifecycle rules **once** in Pack B and reference from both. |
| Which twin is the "reference" behaviour for close/deliver/delete? | `ORD201` (menu-reachable, guard correct). SME to confirm. |

## Recommended bind (recommendation only)

- **accept:** c01, c03, c04, c06, c07, c08
- **accept as thin seam-edge / entry:** c02, c05, c09
- **quirk notes (fold):** c10, c11

## Open questions

1. Confirm `ORD201` is the operational path for order lifecycle and `ORD200` is secondary (reached only via `CUS200` opt 5).
2. Dead option 3 — was it meant to be something (copy? release?)?
3. Delete has no confirmation in either twin — carry forward or not?

Did not: bind, deepen Phase B, generate tests, or convert.
