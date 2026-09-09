# sql-objects-c04 — `ARTLSTDAT` has no reader in `ATU_SRC`; the probable reader is the QM query `ARTQRY` behind menu option 13 "Article by Last Order Date" (object not in the tree)

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is blind-spot card, Phase B — carded because the bind accepted it; the source half is exact, the reader half is outside the tree) |
| Confidence | `inferred` — kept |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Exact (source): the string `ARTLSTDAT` occurs in exactly one member of `ATU_SRC` — its own DDL. No RPG, COBOL, CL, DDS, panel or SQL member selects from it; there is no `QMQRYSRC` directory and no QM member of any kind in the 16 source directories. Exact (source): `SAMMNU` option 13 is `cmd STRQMQRY QMQRY(ARTQRY)` with the visible text "Article by Last Order Date" and the right-hand tag `QMQRY:ARTQRY`; unlike option 12 it names **no** `QMFORM`. Inferred: `ARTQRY` reads `ARTLSTDAT` — the menu text is the view's `LASTORDER` column in words, the view has column headings for `ARID` / `ARDESC` that only a report tool would print, and no other object in the estate produces "article by last order date". The QM query and any form live on the box, not in the repository; `menu-cmd-shell-c01` / `-c02` already register option 13 as an out-of-tree target. This card gives the view its probable purpose without asserting it.

## Entrypoints

- Menu: `:menui option=13 action='cmd STRQMQRY QMQRY(ARTQRY) ' help=nohelp.` / `Article by Last Order Date … QMQRY:ARTQRY` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:129-132`
- For contrast, option 12: `action='cmd STRQMQRY QMQRY(CUSQRY) QMFORM(CUSQRYFMT)'` / `Customer with Open Order … QMQRY:CUSQRY` — `SAMMNU.MENU:125-128`
- View: `ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW:5-14` (`c03`)

## Inputs / outputs / observables

- In (inferred): `ARTLSTDAT` rows (`c03`).
- Out (inferred): a QM report to the display or spool — `STRQMQRY` defaults (`OUTPUT(*)`, `QMFORM(*SYSDFT)`) apply because option 13 supplies neither (platform default — inference).
- Observable in the tree: only the menu line. On a box without `ARTQRY` the option fails with the `STRQMQRY` object-not-found escape (`menu-cmd-shell-c02`).

## Behaviour as implemented

1. **Source side.** `ARTLSTDAT` is defined (`c03`) and referenced by nothing else: grep over `ATU_SRC/**` for `ARTLSTDAT` returns the DDL member; grep for `LASTORDER` returns the DDL member. — `ARTLSTDAT.VIEW:5-14`; structural grep
2. **Menu side.** Option 13 runs `STRQMQRY QMQRY(ARTQRY)` with no `QMFORM`, no `OUTPUT`, no `SETVAR`. Its text is "Article by Last Order Date". — `SAMMNU.MENU:129-132`
3. **Link (inferred).** The only object whose columns match the menu text is `ARTLSTDAT` (`LASTORDER`, per `ARID` / `ARDESC`). `CUSQRY` (option 12, "Customer with Open Order") is the analogous report on the customer side and equally absent; whether it reads `ORDERCUS` or the base tables is unknown (`c01`).
4. **Headings support the inference, weakly.** `ARTLSTDAT` labels `ARID` ('ART.' / 'ID') and `ARDESC` ('DESCRIPTION') but not `LASTORDER` / `QUANTITY`; a QM default report prints column headings, so the report would show the two labelled headings and the bare names `LASTORDER` / `QUANTITY` for the other two — or `ARTQRY` selects with its own column names / a form (`QMFORM`), in which case the labels are moot. Not decidable from the tree. — `ARTLSTDAT.VIEW:16-22`

## Validation rules found in code

- None in the tree.

## Edge cases found in code

- **Option 12 has a form, option 13 does not.** Either `ARTQRY` is meant to run with the system default form or a form was lost / never made. Cannot be settled here. — `SAMMNU.MENU:125-132`
- **A build from the tree alone produces a menu option that fails.** `ARTQRY` (and `CUSQRY`, `CUSQRYFMT`) must come from elsewhere — same class of gap as `XML` / `XSS` / `ADSPUSRSPC` (`srvpgm-supporting-c02`, `menu-cmd-shell-c02`). — `SAMMNU.MENU:126,130,160`
- **If `ARTQRY` does *not* read `ARTLSTDAT`, the view is dead.** Its DDL would then be the only trace of a report that was replaced or never finished. The Phase A `defer` recommendation covers both cases.

## Dependencies

- `c03` (the view), `menu-cmd-shell-c01` / `-c02` (the menu entry and the blind-spot register — not re-derived), `srvpgm-supporting-c02` (the sibling class of out-of-tree objects).

## Assumptions / unknowns

- Platform: `STRQMQRY` parameter defaults (`QMFORM(*SYSDFT)`, `OUTPUT(*)`); QM prints column headings when no form overrides them. Inference, runtime-confirmable (`DSPOBJD ARTQRY *QMQRY`, `RTVQMQRY ARTQRY` → source, `WRKOBJ *ALL/ARTQRY`).
- **needs-SME (source owner):** obtain `ARTQRY` (`RTVQMQRY`) and, if any, its form (`RTVQMFORM`); likewise `CUSQRY` / `CUSQRYFMT`. This single retrieval settles `c03`'s purpose and closes the estate's largest *functional* blind spot on the report side (`menu-cmd-shell` CANDIDATES §deferred).
- Confidence stays `inferred` on purpose: the card states what is source (the view, the menu line) and what is not (the query text); nothing about `ARTQRY`'s SQL is asserted.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:125-132` · `ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW:5-22` · structural grep of `ATU_SRC/**` for `ARTLSTDAT` (1 hit), `LASTORDER` (1 hit), `ARTQRY` / `STRQMQRY` / `QMQRY` (menu lines 126, 128, 130, 132 only) · `ATU_SRC/` directory listing (16 source directories; no `QMQRYSRC`, no `QQMQRYSRC`, no `QQMFORMSRC`)
