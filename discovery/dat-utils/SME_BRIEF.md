# SME_BRIEF — dat-utils (Phase A, awaiting human bind)

## What was found

Two SQL UDFs backed by RPG programs that convert the estate's 8-digit numeric ISO dates to `DATE`: `ISOTODATE40` (`DAT002`; `0 → 1940-01-01`, `99999999 → 2039-12-31`, invalid → NULL) and `ISO_Num_To_Date` (`DAT001`; no sentinels, unused in the tree). 8 candidates, all `observed-in-code`.

This is the smallest and purest seam in the estate: no I/O, deterministic, a handful of edge cases. The same `0 → 1940-01-01` sentinel is re-implemented in RPG in `CUS200` (documented) and `ORD202` (candidate) — three copies of one rule (c07).

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| One rule or three? | Recommend the room accept **one** "numeric ISO date with sentinels" rule here and have the CUS / ORD cards reference it. |
| `ISO_Num_To_Date` | Unused in `ATU_SRC`; possibly used by the QM queries (not in tree). `defer` until the QM sources are seen. |
| Test candidate | When Test generation is unlocked (not by this radar), this seam is the natural first golden set. Noted, not actioned. |

## Recommended bind (recommendation only)

- **accept:** c01, c07
- **thin / fold:** c04, c05, c06, c08
- **defer:** c02, c03 (unused function)

## Open questions

1. Is `1940-01-01` the agreed "no date" sentinel for the target, or should the target use NULL and let the UI decide?
2. Do the QM queries use `ISO_Num_To_Date`?

Did not: bind, deepen Phase B, generate tests, or convert.
