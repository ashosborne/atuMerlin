# SME_BRIEF — ord-entry-ord100 (Phase A, awaiting human bind)

## What was found

The "create a new order" seam: customer chosen (parm or prompt), lines staged in a `QTEMP` copy of `DETORD` (triggers off), confirm (F8) allocates the number from `LASTORDNO` and writes `ORDER` + renumbered `DETORD` rows, then prints via `ORD500`. 14 candidates: 12 `observed-in-code`, 2 `inferred` (CMD→PGM binding; trigger attachment on the box).

This is the most transactional seam found so far and the natural first ORD bind.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Trigger side effects (c11) | Own under `ord-trigger-ord700`; keep a pointer card here. Do **not** merge ORD100 and ORD700 into one slice. |
| Print after confirm (c08) | Seam edge to `ord-print-ord500`; thin card here. |
| `CRTORD` command (c09) | Callable façade; binding is metadata-only. Needs confirmation from the build owner before it is treated as observed. |
| `ORD100C` vs `ORD100C2` | Same staging steps; differ only in whether CUID is passed. One card (c02) covers both. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c04, c05, c06, c07, c12, c13, c14
- **accept as thin seam-edge / pointer:** c08, c10, c11
- **needs-SME (build owner):** c09

## Open questions

1. No commitment control around header + lines (c07). Is a partially written order (header, some lines) an accepted failure mode today?
2. `LASTORDNO` starts at 60719 in source (`QDTASRC/LASTORDNO.DTAARA:8`) and `ORD900` resets it to max(ORID). Is the data area the intended single source of order numbers, or is it a demo convenience?
3. Deleted (`ARDEL='X'`) articles can be added to an order via `SltArticle` (see `art-modules-c09`). Intended?
4. Is `ORD100` ever called without the CL wrapper (would fail on `TMPDETORD`)?

Did not: bind, deepen Phase B, generate tests, or convert.
