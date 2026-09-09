# srvpgm-supporting-c02 — Four listed service programs have no source: `XML` (7 procedures, used by `PRO202`) and `XSS` (16, used by `PRO203`) are needed and their copybooks are missing too; `ORDER` and `TXT` are referenced by nothing

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is absence card, Phase B — records what the tree does **not** contain; the four objects stay `unknown` surfaces) |
| Confidence | `observed-in-code` (the absence and the call sites are source facts; what the objects do is outside the tree) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMPLE.BNDDIR` names `XML`, `ORDER`, `TXT` and `XSS` as `*SRVPGM`s, and `PRO200.ILEPGM` binds `XML` by name; **none of the four has a `CRTSRVPGM` member, a module, a binder source or a prototype copybook under `ATU_SRC`**. Two are genuinely needed: `PRO202` (the purchase-order XML writer, a module of `PRO200`) calls **seven** distinct `xml*` procedures and `PRO203` (the spreadsheet export) calls **sixteen** distinct `xss*` procedures. Both pull their prototypes with a *member-style* copy — `/copy qprotosrc,xml` and `/copy qprotosrc,Xss` — and `QPROTOSRC` holds nine members, none of them `XML` or `XSS`; so **`PRO202` and `PRO203` do not compile from this tree**, before any binding question arises. `ORDER` and `TXT` are named in the directory and nowhere else: no `BNDSRVPGM`, no `/copy`, no procedure call whose name suggests them. Whether they are dead directory entries or serve programs outside the tree cannot be decided from source (needs-SME).

## Entrypoints

- `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:10-11` — `(*LIBL/XML *SRVPGM) (*LIBL/ORDER *SRVPGM) (*LIBL/TXT *SRVPGM) (*LIBL/XSS *SRVPGM)` — the four entries (positions 1–4 of eleven, `c01`)
- `ATU_SRC/QILESRC/PRO200.ILEPGM:9` — `BNDSRVPGM(XML FCOUNTRY FPARAMETER)` — the only explicit binder naming one of the four
- `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:11` — `/copy qprotosrc,xml`; `:152-174` — the `xml*` calls
- `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:7` — `/copy qprotosrc,Xss`; `:33-94` — the `xss*` calls

## Inputs / outputs / observables

- In (to this card): the tree only. Out: nothing — this card documents absence.
- Observable on a box that has the objects: `DSPSRVPGM XML DETAIL(*PROCEXP)` / `DSPSRVPGM XSS DETAIL(*PROCEXP)` would show whether the exported names match the 7 + 16 below; `DSPOBJD` on the four would show the owning library and product (runtime-confirmable; the answer to Phase A Q1).

## Behaviour as implemented

### What the tree asks of `XML` (via `PRO202`, module of `PRO200`)

Seven distinct procedure names, in first-use order (case as written; RPG names are case-insensitive):

| # | Procedure | First call | Role implied by the call site (name only — no source) |
| ---: | --- | --- | --- |
| 1 | `xmlopen` | `PRO202.SQLRPGLE:152` | open the output file (path from `getParm2('PATH':' ')` at `:151`) |
| 2 | `xmlStrTable` | `:153` | start a table element |
| 3 | `XmlStrRec` / `xmlstrRec` | `:154`, `:163` | start a record element |
| 4 | `xmladdcol` | `:155-158`, `:164-168` | add a column / value |
| 5 | `xmlendrec` / `XmlEndRec` | `:159`, `:169` | end a record |
| 6 | `xmlEndTable` | `:173` | end the table |
| 7 | `xmlclose` | `:174` | close the file |

— `PRO202.SQLRPGLE:151-174`; prototypes expected from `/copy qprotosrc,xml` (`:11`), member absent

### What the tree asks of `XSS` (via `PRO203`)

Sixteen distinct procedure names:

`xssopenfile` (`:33`), `XssSetDocProperties` (`:34`), `xsscreatestyle` (`:35`, `:39`, `:41`), `xssSetFontSize` (`:36`), `XssSetalign` (`:37`), `Xsssetwrap` (`:38`), `XssSetFormat` (`:40`), `XsssetForcolor` (`:42`), `Xssaddsheet` (`:43`), `XssSetColWidth` (`:44`), `xssaddrow` (`:45`, `:72`), `xssaddcellChar` / `XssAddCellChar` (`:46-57`, `:74-88`), `XssGetCellId` (`:47`, `:92`), `XssAddCellNum` / `xssaddcellNum` (`:80-87`), `XssSetAutoFilter` (`:93`), `Xssclosefile` (`:94`). Output path again from `GetParm2('PATH':' ')` (`:32`). — `PRO203.PGM.SQLRPGLE:32-94`; prototypes expected from `/copy qprotosrc,Xss` (`:7`), member absent

### What the tree asks of `ORDER` and `TXT`

Nothing. Structural grep of `ATU_SRC/**` for `ORDER` as a `*SRVPGM`, in a `BNDSRVPGM`, or in a `/copy`, and for `TXT` anywhere outside DDS text keywords, finds only `SAMPLE.BNDDIR:10`. (`ORDER` the *file* — `ORDER.PF`, `ORDER1`–`ORDER3` — is a different object type and is fully in the tree.) — `SAMPLE.BNDDIR:10`; absence grep

1. Both copies use the *member* form (`/copy qprotosrc,xml` = source file `QPROTOSRC`, member `XML`) while every other copy in the tree uses the *path* form (`/COPY ../QPROTOSRC/PARAMETER.RPGLEINC`). `iproj.json` lists `ATU_SRC/QPROTOSRC` as `includePath`, which is how the member form would resolve in an IFS build — to `ATU_SRC/QPROTOSRC/XML.*` / `XSS.*`, which do not exist. Nine members exist: `APICALL`, `ARTICLE`, `COUNTRY`, `CUSTOMER`, `FAMILLY`, `LOG`, `PARAMETER`, `PROVIDER`, `VAT`. — `PRO202.SQLRPGLE:11-12`, `PRO203.PGM.SQLRPGLE:7-8`, `iproj.json` `includePath`, `QPROTOSRC/` listing
2. Because the prototypes are missing, the compile of `PRO202` / `PRO203` fails at the copy, not at the bind: the 23 procedure names above are the *only* specification of the two service programs' interfaces the tree contains — parameter lists, return types and error behaviour are unknown. — as above
3. `XML` is bound by name in `PRO200.ILEPGM` and listed first in `SAMPLE.BNDDIR`; the explicit `BNDSRVPGM` makes the directory entry redundant for `PRO200` (`PRO200` has no `bnddir` at all — `c04`). `XSS` has *only* the directory entry and its single caller `PRO203` has no `bnddir` — so, from source, nothing binds `XSS` into anything (`c05`). — `PRO200.ILEPGM:9`, `PRO203.PGM.SQLRPGLE:4`
4. `ORDER` and `TXT`: listed, never named again. A binder entry for a service program that exists but exports nothing anyone imports is harmless; an entry for an object that does not exist is skipped at bind time (platform — inference). Either way they have no effect on the twelve `bnddir` programs (`c03`). — `SAMPLE.BNDDIR:10`

## Validation rules found in code

- None. No program tests for the presence of these objects; the only failure mode is at build (missing copybook → compile error; missing service program → unresolved import at `CRTPGM` for `PRO200`).

## Edge cases found in code

- **Two outputs of the estate are unspecifiable.** The purchase-order XML (`pro-interactive` `c07`) and the article spreadsheet (`pro-interactive` `c12`) are produced entirely through these 23 calls; their file formats cannot be characterised or reproduced until `XML` / `XSS` (or at least their copybooks and a sample output) are seen. Recorded as `known_risk` in the bind — "document as-is, do not fix XSS" (job header). No PRO behaviour is documented here.
- **Case drift in the call sites** (`XmlStrRec` / `xmlstrRec`, `xssaddcellChar` / `XssAddCellChar`, `xssaddcellNum` / `XssAddCellNum`) — cosmetic; RPG folds procedure names. The *distinct* counts above (7, 16) fold case.
- **`xsscreatestyle` is called three times** (`:35`, `:39`, `:41`) — three styles are created; whatever handle they return is consumed by the following `xssSet*` calls. Interface unknown.
- **The member-style `/copy` is the only one of its kind in the tree** — 41 `/COPY` lines use the relative-path form; these two do not (43 copy lines in `QRPGLESRC` in all). Whether that is a leftover from a member-based (`QSYS.LIB`) build predating the IFS layout is a history question (`c09`).

## Dependencies

- Surfaces: `srvpgm:XML`, `srvpgm:XSS`, `srvpgm:ORDER`, `srvpgm:TXT` — all `unknown` in `inventory/atu-merlin/APP_MANIFEST.yaml`; this card does not promote them.
- Callers: `PRO202` (module of `PRO200`, `pro-interactive` / `pro-modules` — cited for the call sites only), `PRO203` (`pro-interactive` — cited for the call sites only).
- `PARAMETER` `PATH` row for the output directory (`par-maintain-c11`, documented — the same `GetParm2('PATH':' ')` literal).

## Assumptions / unknowns

- needs-SME (source owner — Phase A Q1): who owns `XML` / `XSS`? Are they ARCAD sample-library service programs or third-party? Can source, or at minimum `QPROTOSRC/XML` + `QPROTOSRC/XSS` and one sample output file each, be added to the allowlist?
- needs-SME (Phase A Q2): are `ORDER` / `TXT` dead entries, or do programs outside the tree use them? `DSPBNDDIR SAMPLE` + `DSPOBJD` on the box answers both.
- Platform: an absent `*LIBL` binding-directory entry is skipped, not fatal, for programs that do not import from it — inference.
- Target stance (room, prose only): the target must produce the same purchase-order file and spreadsheet **by specification, not by port** — there is nothing to port. Until the objects or samples arrive, `pro-interactive` `c07` / `c12` cannot get past "file is written to `PATH`".

## Evidence

`ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:10-11` · `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:11-12,151-174` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:4,7-8,32-94` · `ATU_SRC/QPROTOSRC/` listing (nine members; no `XML`, no `XSS`) · `iproj.json` (`includePath`) · structural grep of `ATU_SRC/**` for `xml` / `xss` outside `PRO202` / `PRO203` (none), for `ORDER` / `TXT` as `*SRVPGM` / `BNDSRVPGM` / `/copy` (the `.BNDDIR` line only), for `/copy` with a comma (these two lines only)
