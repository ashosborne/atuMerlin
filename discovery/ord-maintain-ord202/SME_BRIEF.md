# SME_BRIEF — ord-maintain-ord202 (Phase A, awaiting human bind)

## What was found

`ORD202(orid)` is a read-only order display: header + customer, lines with article description, totals. Any key exits. 6 candidates, all `observed-in-code`. Smallest seam scanned this run.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Merge into `ord-maintain-ord200/201`? | Keep separate: it is the only pure read seam in ORD and a low-risk first bind. |
| Charter name says "maintain" | Program is display-only; consider renaming to `ord-display-ord202` at bind (cosmetic). |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03
- **thin / fold:** c04, c06
- **needs runtime confirmation:** c05 (subfile capacity 7 lines, no paging)

## Open questions

1. Orders with more than 7 lines: does the display truncate silently? (`SFLSIZ 7`, `SFLPAG 6`, no PAGEDOWN handling.) Cannot be confirmed from source.

Did not: bind, deepen Phase B, generate tests, or convert.
