# SME_BRIEF — pro-cobol-pro201 (Phase A, awaiting human bind)

## What was found

`PRO201` is a read-only "Display Providers" list in COBOL (the only COBOL member in `ATU_SRC`), reached from menu opt 5. It reads `PROVIDE1` directly (no service programs), shows 14 rows per page, offers option 2 (display detail from subfile-carried hidden fields) and option 5 (`CALL "ART202"`). 10 candidates: 9 `observed-in-code`, 1 `inferred` (c05 — the visible effect of F3 on the detail panel).

Everything `PRO201` shows is also available from `PRO200` (pro-interactive), which additionally edits and prepares orders. `PRO201` contributes no data or rule the RPG screens lack.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Convert vs retire | Recommend the room decide **retire** (superseded by `PRO200`) or **convert as thin read-only**; do not let the COBOL language drive a separate target decision for one 300-line program. |
| c05 F3 behaviour | Code path is unambiguous; the visible effect (empty list) depends on file positioning at runtime. Confirm on the box before carding. |
| `PRO201D` leftovers (c09) | Display-file noise, not behaviour. Fold. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c04, c06
- **thin / fold:** c07, c08, c09, c10
- **needs-SME:** c05 (confirm on box; preserve or fix)

## Open questions

1. Retire or convert (c10)?
2. Is stale detail data (c02 — detail comes from the subfile, not a re-read) acceptable as-is?
3. Confirm c05 on the box.

Did not: bind, deepen Phase B, generate tests, or convert.
