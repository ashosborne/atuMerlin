# menu-cmd-shell-c02 — Three menu options reach objects that are not in the tree: 12 / 13 (QM queries `CUSQRY`, `ARTQRY`, form `CUSQRYFMT`) and 84 (`ADSPUSRSPC`); option 11 does not exist

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — blind-spot register) |
| Confidence | `inferred` (the menu actions and the absence of the objects from `ATU_SRC` are `observed-in-code`; what the queries return, what the form renders and what `ADSPUSRSPC` shows are outside the tree) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound as `inferred`, kept `inferred`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Two of the three entries in the **Reports** group and one in **Utilities** run objects that have no source anywhere under `ATU_SRC`: option 12 `STRQMQRY QMQRY(CUSQRY) QMFORM(CUSQRYFMT)` ("Customer with Open Order"), option 13 `STRQMQRY QMQRY(ARTQRY)` ("Article by Last Order Date"), option 84 `adspusrspc samlog` ("Display Application log"). The tree has no `QQMQRYSRC` / `QQMFORMSRC` directory, no member named `CUSQRY`, `ARTQRY` or `CUSQRYFMT`, and no `ADSPUSRSPC.CMD` (`QCMDSRC` holds `CRTORD` and `CVTSPLPDF` only); the strings occur in the menu and nowhere else. From source the only specification of the two reports is their **menu titles**; the log viewer is `log-programs-c09` (documented — pointer, not re-derived). All three object names are unqualified, so they resolve on `*LIBL` at run time. This is the largest *functional* blind spot in the estate — two reports and the only reader of the application log — and the Phase A recommendation stands: ask the source owner for the four objects before declaring the estate scanned.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:125-128` — `:menui option=12 action='cmd STRQMQRY QMQRY(CUSQRY) QMFORM(CUSQRYFMT)' help=nohelp.` / `Customer with Open Order … QMQRY:CUSQRY`
- `SAMMNU.MENU:129-132` — `:menui option=13 action='cmd STRQMQRY QMQRY(ARTQRY) ' help=nohelp.` / `Article by Last Order Date … QMQRY:ARTQRY`
- `SAMMNU.MENU:159-162` — `:menui option=84 action='cmd adspusrspc samlog' help=nohelp.` / `Display Application log`
- Absence: grep `ATU_SRC/**` (i) for `cusqry`, `artqry`, `cusqryfmt`, `strqmqry`, `qmqry`, `adspusrspc` → the menu lines only; directory listing of `ATU_SRC/` (16 source directories, none for QM queries or forms); `ATU_SRC/QCMDSRC/` = `CRTORD.CMD`, `CVTSPLPDF.CMD`

## Inputs / outputs / observables

- In: none from the menu — no parameters, no library, no output-type override (`STRQMQRY` defaults: `OUTPUT(*)` → display when interactive, `QMFORM(*SYSDFT)` for option 13 which gives no form — platform defaults, inference). — `SAMMNU.MENU:126,130`
- Out (12): a displayed / printed QM report "Customer with Open Order" formatted by `CUSQRYFMT` — columns, sort, selection unknown.
- Out (13): a QM report "Article by Last Order Date" with the **system default form** (no `QMFORM`) — unknown content.
- Out (84): whatever `ADSPUSRSPC` renders of `SAMLOG` — `log-programs-c09`.
- Observable when the objects are missing from `*LIBL`: `STRQMQRY` fails with its object-not-found escape (`QWM2701`-class, inference) and `ADSPUSRSPC` with `CPD0030 Command … not found` (inference); UIM shows the message on the menu's message line and stays on the menu.

## Behaviour as implemented

1. Option 12 → command analyzer runs `STRQMQRY QMQRY(CUSQRY) QMFORM(CUSQRYFMT)`; both objects resolved on `*LIBL`. — `SAMMNU.MENU:126`
2. Option 13 → `STRQMQRY QMQRY(ARTQRY)` with a trailing blank inside the quoted action (harmless); no form named, so the default form applies. — `SAMMNU.MENU:130`
3. Option 84 → `adspusrspc samlog`; positional parameter, unqualified. — `SAMMNU.MENU:160`; behaviour and reader blind spot at `discovery/log-programs/features/log-programs-c09.md`
4. None of the three has help (`help=nohelp`, `c04`).

## Validation rules found in code

Not applicable — nothing in the menu validates or constrains these actions.

## Edge cases found in code

- **Option 11 does not exist.** The Reports group goes 10 → 12; UIM treats 11 as "not valid" (`c08`). Nothing in the tree hints at what 11 was (inference: a removed option; the two remaining query options may once have been 11/12). — `SAMMNU.MENU:121-129`
- **Titles are the only specification.** "Customer with Open Order" reads as a customer list filtered on open orders (`ORDER` status — `ord-maintain-ord200` owns the status semantics); "Article by Last Order Date" reads as an article list ordered by a last-order date — which `ARTICLE` or `DETORD` column that is, and whether it relies on `ART801`'s summary fields (option 82, `sql-objects`), cannot be told. Both readings are **inference from the title text**; neither is a documented rule.
- **Two different absence kinds.** 12/13 are *data objects* (QM query text + form) that the room can request as source; 84 is a *command* that is probably a vendor utility (`log-programs-c09`) and may never have had source in this tree.
- **The Reports group's one in-tree member is not a report:** option 10 `PRO203` is a workstation program (`c01`). So the group "Reports", as far as the tree is concerned, contains **zero** documentable reports.

## Dependencies

- `log-programs-c09` (documented) — option 84 / `ADSPUSRSPC` / `SAMLOG`; cited, not re-derived.
- `ORDER` / `ARTICLE` / `DETORD` PFs as the probable data behind 12/13 — inference only; no citation possible without the query text.

## Assumptions / unknowns

- needs-SME (source owner): supply `CUSQRY`, `ARTQRY` (QM query source, `*QMQRY`) and `CUSQRYFMT` (`*QMFORM`); confirm which library holds them and `ADSPUSRSPC`. Until then options 12/13/84 stay `unknown` in the inventory sense and no target report can be specified from source.
- Platform: `STRQMQRY` defaults (`QMFORM(*SYSDFT)`, `OUTPUT(*)`), object-not-found escape ids, `*LIBL` resolution of unqualified names on a UIM `cmd` action — inference / runtime-confirmable.
- Target stance (room, prose only): if the query sources cannot be obtained, the two reports must be re-specified from the data (a room / SME task, not a documentation fact); the ORD vertical's `samlog` table already gives option 84 a trivial counterpart (`log-programs-c09`, not widened here).

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:120-133,159-162` · `ATU_SRC/QCMDSRC/` listing · `ATU_SRC/` directory listing (no `QQMQRYSRC` / `QQMFORMSRC`) · structural grep `ATU_SRC/**` for `cusqry`, `artqry`, `cusqryfmt`, `strqmqry`, `qmqry`, `adspusrspc` (menu only) · `discovery/log-programs/features/log-programs-c09.md` (pointer)
