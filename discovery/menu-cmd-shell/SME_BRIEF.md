# SME_BRIEF — menu-cmd-shell (Phase A, awaiting human bind)

## What was found

The application shell: `SAMMNU` (UIM menu — 20 options, all parameterless `CALL`s, plus a command line and system function keys), `SAMHELP` (help stubs, mostly mis-mapped), `SAMMSGF` (12 messages, 8 live) and the `CVTSPLPDF` command definition (no processing program). 9 candidates: 8 `observed-in-code`, 1 `inferred` (the out-of-tree targets).

This is an **adapter layer**, not a behaviour seam. Its value to the migration is (a) the navigation spec and (b) the register of menu options that reach objects **outside the tree**: two QM query reports (12, 13) and the log viewer (84). Those three are the largest functional blind spot in the estate.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Is the menu a slice? | No — `reject` as a conversion slice; use c01 as the navigation spec for the target UI. |
| Messages | Carry the 8 live messages as a resource file in the target (c05); drop the 4 dead ones (c06). |
| `CVTSPLPDF` | Integration edge, as already recommended in `ord-print-ord500`. |
| QM queries / `ADSPUSRSPC` | Ask the source owner. Until seen, options 12/13/84 stay `unknown`. |

## Recommended bind (recommendation only)

- **accept as navigation / resource spec (not behaviour cards):** c01, c05
- **thin / fold:** c03, c04, c06, c08, c09
- **needs-SME (obtain sources):** c02, c07

## Open questions

1. Can the room obtain `CUSQRY`, `ARTQRY`, `CUSQRYFMT` and `ADSPUSRSPC`? Two reports and the log viewer are otherwise unscannable.
2. Should the target expose a command line equivalent (c03), or is that an IBM i-ism to drop?

Did not: bind, deepen Phase B, generate tests, or convert.
