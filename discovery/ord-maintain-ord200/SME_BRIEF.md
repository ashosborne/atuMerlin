# SME_BRIEF — ord-maintain-ord200 (Phase A, awaiting human bind)

## What was found

`ORD200(cuid)` lists one customer's orders from the `ORDERCUS` view and offers the order lifecycle: create (→ORD100C), update (→ORD101), delete, display (→ORD202), print (→ORD500), close (7), deliver (8). 13 candidates: 12 `observed-in-code`, 1 `inferred`.

Headline: **option 2 (update) is unreachable in `ORD200` as coded** — a missing pair of parentheses makes the "closed order" guard fire for every option-2 row (`ORD200.PGM.SQLRPGLE:187`). Its twin `ORD201` has the correct form. Discovery records this as as-is behaviour; whether to preserve it is not a Discovery decision.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| `ORD200` vs `ORD201` | ~85% duplicated logic with three observed divergences (paging, option-2 guard, delete ordering). Charter keeps them as separate thin seams. Recommend: bind both, but let Pack B write **one shared lifecycle card set** (close/deliver/delete/guards) referenced by both slices rather than duplicating cards. |
| Close (7) vs deliver (8) semantics | Both here; they are the domain rules of this seam. |
| Stale `CULASTORD` after delete (c12) | Consequence, `inferred`; keep as open question, not a card, until confirmed. |

## Recommended bind (recommendation only)

- **accept:** c01, c04, c06, c07, c08, c11, c13
- **accept as thin seam-edge:** c02, c03, c05, c10
- **needs-SME:** c09 (preserve defect or not), c12 (confirm on box)

## Open questions

1. Is "option 2 never works in ORD200" known to users (they use ORD201 instead)? Preserve or fix?
2. Close (7) sets delivery date if unset but does not set line delivered quantities — intended distinction from deliver (8)?
3. Delete (4) has no confirmation; is that acceptable to carry forward?
4. `ORD200` loads the entire order list without paging (`dow sqlcod = 0`), unlike `ORD201`. Any customer with >9999 orders would overflow the subfile — irrelevant for the sample, relevant for a real estate.

Did not: bind, deepen Phase B, generate tests, or convert.
