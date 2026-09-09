# menu-cmd-shell-c09 — Menu titles vs program text: the `PRO250` "Display Article" mismatch is in source comments only (the screen says "Provider by Id"); the user-visible differences are option 6's `ORD100` label for `ORD100C2`, "Article by id" vs "Article by Code", and `SQLPRC:ART801` for `UPDATE_ON_CUS_ORD_QTY`

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — cosmetic register for target navigation labels) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Phase A flagged option 9 "Provider by id" calling `PRO250` whose `%TEXT` says "Display Article". Reading the display file settles what the *user* sees: `PRO250D` puts **`Provider by Id`** on row 1 (`PRO250D.DSPF:24`) and `PRO250 ` as the screen id (`:16,36`); only the `%TEXT` header comments of `PRO250.PGM.RPGLE:2` and `PRO250D.DSPF:2` say "Display Article" — a copy-paste from `ART250` left in metadata (ARCAD uses `%TEXT` for the object text, so `DSPOBJD PRO250` would show "Display Article" — that is the one place the mismatch surfaces). Comparing every option title against its target's `%TEXT` and row-1 heading yields a short register of genuinely visible differences: option **6** shows the label `ORD100` while the action calls the wrapper `ORD100C2`; option **7** "Article by id" opens a screen headed "Article by Code"; option **82** labels the SQL procedure `SQLPRC:ART801` though the procedure's SQL name is `UPDATE_ON_CUS_ORD_QTY` (`ART801` is its `SPECIFIC` / program name); option **10** `PRO203` sits under "Reports" but is a selection screen; the `SAMHELP` title for `PRO200` is singular ("Work with Provider"). Everything else matches or differs only in case/plural ("Work with article", "Display customer", "Work with countries" vs `COU200D` "Work with Countries"). Cosmetic throughout; recorded so the target's navigation labels are chosen once, deliberately.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:83-167` — the 20 option titles and labels
- `ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE:2` — `%TEXT Display Article`; `ATU_SRC/QDDSSRC/PRO250D.DSPF:2` — `%TEXT Display Article`; `PRO250D.DSPF:16,24,36` — `'PRO250 '` / `'Provider by Id'` / `'PRO250 '`
- `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:2` — `%TEXT Display Article`; `ATU_SRC/QDDSSRC/ART250D.DSPF:24` — `'Article by Code'`
- `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:2` — `%TEXT Display customer`; `ATU_SRC/QDDSSRC/CUS250D.DSPF:24` — `'Customer by Id'`
- `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:2` — `%TEXT Create new order without parameter`; `SAMMNU.MENU:104-106` — `action='cmd call ORD100C2'` / `Create a Customer Order. … ORD100`
- `ATU_SRC/QSQLSRC/ART801.SQLPRC:6-8` — `CREATE PROCEDURE UPDATE_ON_CUS_ORD_QTY ( ) … SPECIFIC ART801`; `SAMMNU.MENU:152-154` — `Reset Summary Fields … SQLPRC:ART801`
- Row-1 headings read for the comparison: `PRO201D.DSPF:64` (`Display Providers`), `PRO200D.DSPF:41` (`Work with Providers`), `ART200D.DSPF:42` (`Work with Articles`), `CUS200D.DSPF:48` (`Work with Customers`), `ORD201D.DSPF:56` (`Work with Customer Orders`), `PAR200D.DSPF:49` (`Work with Parameters`), `COU200D.DSPF:42` (`Work with Countries`)
- `ATU_SRC/QPNLSRC/SAMHELP.PNLGRP:11` — `:help name=PRO200.Work with Provider`

## Inputs / outputs / observables

- Observable: the menu line text (title + label) before selection; the screen heading after selection; `DSPOBJD` object text (from `%TEXT`) — three places a name can be read, and they do not always agree.

## Behaviour as implemented

Title ↔ target comparison, as-is (blank = matches apart from case/plural):

| Opt | Menu title | Label | Target `%TEXT` | Target screen row 1 | Visible difference |
| ---: | --- | --- | --- | --- | --- |
| 1 | Work with Articles | `ART200` | Work with article | Work with Articles | — |
| 2 | Work with Customers | `CUS200` | Work with Customers | Work with Customers | — |
| 3 | Work with Customer Orders | `ORD201` | Work with Customer Orders | Work with Customer Orders (screen id `ORD200-1` — `ord-maintain-ord201`) | — (screen-id oddity belongs to that slice) |
| 4 | Work with Providers | `PRO200` | Work with Providers | Work with Providers | — (`SAMHELP` says "Provider") |
| 5 | Display Providers | `PRO201` | *(blank)* | Display Providers | — |
| 6 | Create a Customer Order. | `ORD100` | Create new order without parameter (`ORD100C2`) | `ORD100D` (`ord-entry-ord100`) | **label names the inner program, not the object called**; trailing full stop in the title |
| 7 | Article by id | `ART250` | Display Article | **Article by Code** | **"id" vs "Code"** |
| 8 | Customer by id | `CUS250` | Display customer | Customer by Id | — |
| 9 | Provider by id | `PRO250` | **Display Article** (wrong) | Provider by Id | none for the user; `%TEXT` / object text wrong |
| 10 | Article to purchase | `PRO203` | *(blank)* | (`PRO202D` selection screen) | **in "Reports" but interactive** |
| 12 / 13 | Customer with Open Order / Article by Last Order Date | `QMQRY:…` | — (absent, `c02`) | — | — |
| 20 | Work with Parameters | `PAR200` | Work with parameters | Work with Parameters | — |
| 21 | Work with countries | `COU200` | *(blank)* | Work with Countries | — |
| 80 | Reset LASTORDNO | `ORD900` | *(blank)* | — (no screen) | — |
| 81 | Reset Order dates to current | `ORD901` | *(blank)* | — (no screen) | — |
| 82 | Reset Summary Fields | `SQLPRC:ART801` | *(blank)* | — | **label is the `SPECIFIC` name; SQL name is `UPDATE_ON_CUS_ORD_QTY`** |
| 83 | Work with IFS output | `PAR201` | Work with generated output (`PAR201.ILEPGM`) | — (`WRKLNK`) | wording differs (IFS output / generated output) |
| 84 | Display Application log | — | — (absent) | — | — |
| 90 | Signoff | — | system | — | — |

— `SAMMNU.MENU:83-167` and the sources cited under Entrypoints

1. The menu title and the label are two constants on the same `:menui` text line, separated by spaces to right-align the label — purely presentational. — `SAMMNU.MENU:86,106,128,154`
2. `%TEXT` is ARCAD's metadata for the object's text attribute (`TEXT()` on the create command — inference from the generated build members which carry the same `%TEXT`); it is never shown by the application itself.

## Validation rules found in code

Not applicable.

## Edge cases found in code

- **`PRO250` object text "Display Article"** would be visible in `WRKOBJ` / `DSPOBJD` / ARCAD lists — an operator-facing mislabel, not a user-facing one. Correction is a metadata edit in `pro-interactive`'s scope, not this slice's, and not made (`ATU_SRC` untouched). — `PRO250.PGM.RPGLE:2`, `PRO250D.DSPF:2`
- **Six targets have blank `%TEXT`** (`PRO201`, `PRO203`, `COU200`, `ORD900`, `ORD901`, `ART801`): their objects carry no text unless the build supplies one; the menu title is then the only human name they have. — the `:2` lines of each
- **Option 6's full stop** ("Create a Customer Order.") is the only title ending in punctuation. — `SAMMNU.MENU:106`
- **Option 83 "Work with IFS output"** opens `WRKLNK` on the `PATH` parameter directory (`par-maintain`), so "output" here means the PDF directory (`c07`) — the title is accurate but opaque.

## Dependencies

- All target programs' `%TEXT` lines and DSPF headings (their slices own the screens; cited for the heading text only).
- `SAMHELP.PNLGRP:11` (`c04`).

## Assumptions / unknowns

- Inference: `%TEXT` → object `TEXT()` via the ARCAD build; whether the box's `PRO250` object text really reads "Display Article" is runtime-confirmable (`DSPOBJD PRO250 *PGM`).
- Target stance (room, prose only): use the **menu titles** as navigation labels (they are the names users know), normalise case/plural once, drop the technical labels (`ART200`, `QMQRY:…`, `SQLPRC:…`) or keep them as tooltips; rename option 7 to match its screen ("Article by Code") or vice versa — a wording decision, not behaviour.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:83-167` · `ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE:2` · `ATU_SRC/QDDSSRC/PRO250D.DSPF:2,16,24,36` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:2` · `ATU_SRC/QDDSSRC/ART250D.DSPF:24` · `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:2` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:24` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:2` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:6-8` · `ATU_SRC/QILESRC/PAR201.ILEPGM:2` · `%TEXT` lines (`:2`) of `ART200`, `CUS200`, `ORD201`, `PRO200`, `PRO201.CBL`, `PRO203`, `PAR200`, `COU200.RPG`, `ORD900`, `ORD901` · row-1 headings of `PRO201D`, `PRO200D`, `ART200D`, `CUS200D`, `ORD201D`, `PAR200D`, `COU200D` · `ATU_SRC/QPNLSRC/SAMHELP.PNLGRP:11`
