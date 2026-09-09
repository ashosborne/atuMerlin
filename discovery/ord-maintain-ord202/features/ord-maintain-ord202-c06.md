# ord-maintain-ord202-c06 — Direct ARTICLE1 access bypasses FARTICLE

| | |
| --- | --- |
| Slice | `ord-maintain-ord202` |
| Status | `documented` (as-is behaviour card, Phase B — dependency fact) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD202` declares `ARTICLE1` as its own `if e k disk` file and chains it per line for `ARDESC`, where `ORD100` and `ORD101` call `GetArtDesc(odarid)` from the `FARTICLE` service program. The two paths behave differently on a miss: `FARTICLE`'s `chainARTICLE1` **clears the `FARTI` buffer** before chaining, so `GetArtDesc` returns blanks for an unknown article; `ORD202`'s bare `chain` leaves the buffer untouched, so the **previous line's description is repeated** (`c02`). `ORD202` also opens and closes `ARTICLE1` on every call (`*inlr`), where `FARTICLE` keeps a lazily-opened, last-key-cached file for the activation group. `bnddir('SAMPLE')` is on the `H` spec but nothing from it is used — `ORD202` has no service-program dependency at all; it depends on the four logical files being on `*LIBL`.

## Entrypoints

- F-spec `farticle1 if e k disk` and `chain odarid article1` — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:8,108`
- Contrast: `artdesc = GetArtDesc(odarid)` in `ORD100` and `ORD101` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:117,266`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:114,223`
- `FARTICLE` implementation — `ATU_SRC/QRPGLESRC/ART300.RPGLE:6,19-27,114-127`, prototype `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8`

## Inputs / outputs / observables

- In: `ODARID` (`6A`) of each `DETORD1` row. — `ORD202.PGM.RPGLE:108`, `ATU_SRC/QDDSSRC/DETORD.PF:9`
- Out: `ARDESC` (`50A`) on `SFL01` row 9 (visible after `F11`, `c02`), straight from the `FARTI` record buffer — the field is shared by name between the file and the display record via `REFFLD(FARTI/ARDESC)`. — `ORD202D.DSPF:28`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7`
- No other `ARTICLE` field is used (`ARDEL` is not tested — soft-deleted articles display like any other). — `ORD202.PGM.RPGLE:108`, `ARTICLE.PF:39`

## Behaviour as implemented

1. `ARTICLE1` is opened at program start (no `usropn`) and closed at `*inlr` — once per display, per order. `CUSTOME1`, `DETORD1`, `ORDER1` likewise. — `ORD202.PGM.RPGLE:7-10,154`
2. Per line: `chain odarid article1;` — no `%found`, no clear, no `(e)`. — `ORD202.PGM.RPGLE:108`
3. `FARTICLE.GetArtDesc(P_ARID)`: `chainARTICLE1(P_ARID)` → open if not open; `if P_ARID <> ARID` (last-key cache) → `K_ARID = P_ARID; clear *all FARTI; chain kf ARTICLE1`; `return ARDESC`. A miss returns blanks (buffer cleared, `chain` does not refill it); a repeated key does not re-read. — `ART300.RPGLE:19-27,114-127`
4. `ORD202` does not `/COPY` `ARTICLE.RPGLEINC` and calls no bound procedure; the `bnddir('SAMPLE')` on the `H` spec is inert for this program. `SAMPLE.BNDDIR` lists `FARTICLE` among its service programs — relevant only to programs that reference an export. — `ORD202.PGM.RPGLE:5`, `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:11`

## Validation rules found in code

None. No existence or deleted-flag test on the article.

## Edge cases found in code

- **Miss semantics differ from the line editor's.** Same order, same missing article: `ORD101` shows a blank description (`FARTICLE` clears), `ORD202` shows the description of the line above (or blank if it is the first line). Neither says the article is missing. — `ORD202.PGM.RPGLE:108-110`, `ART300.RPGLE:121-124`
- **Freshness differs.** `ORD202` re-reads `ARTICLE` on every call, so a description changed by `ART200` in another job is shown at the next option `5`; `FARTICLE`'s last-key cache in the caller's activation group can show a stale description in `ORD100`/`ORD101` for a repeated key (`art-modules` "Lazy open and last-key cache" — unbound, cited). — `ORD202.PGM.RPGLE:7-10,154`, `ART300.RPGLE:6,118-125`
- **Length.** `ARDESC` is `50A` from `SAMREF`; `ORD202D` shows all 50 (row 9, cols 8–57); `GetArtDesc` returns 50 and `ORD101D` truncates to 30 (`ord-entry-ord101-c01`). — `ATU_SRC/QDDSSRC/SAMREF.PF:13-14`, `ORD202D.DSPF:28`
- **Object dependency without a binding dependency.** `ORD202` needs `ARTICLE1`, `CUSTOME1`, `DETORD1`, `ORDER1` (and their physical files) on `*LIBL` at open, and `ORD202D`; it does not need `FARTICLE`, `FCUSTOMER` or any `*SRVPGM`. `ORD200`/`ORD201` likewise call no bound procedure (their date conversion is the SQL UDF `ISOTODATE40`, `dat-utils`); `ORD100`/`ORD101` `/COPY` the `CUSTOMER`/`ARTICLE`/`VAT` prototypes and bind `FCUSTOMER`/`FARTICLE`/`FVAT`. `dftactgrp(*no)` remains required for the `bnddir` keyword to compile but has no runtime consequence here beyond the activation group (inferred `QILE`). — `ORD202.PGM.RPGLE:5-11`
- **Customer lookup is the same pattern.** `chain orcuid custome1` (`c01`) bypasses `FCUSTOMER.GetCusName` in exactly the same way (`ORD200` also chains `CUSTOME1` directly; `ORD100:328` / `ORD101:283` use `GetCusName`). One rule for both lookups in the target. — `ORD202.PGM.RPGLE:7,84`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:328`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:283`
- **Phase A pointer for conversion.** Recorded as a dependency fact only: the target ORD display reads article and customer descriptions through whatever the ORD pack chooses (the bound CUS pack owns the customer side); no redesign here.

## Dependencies

- `ARTICLE1.LF` (`UNIQUE`, `K ARID`) over `ARTICLE.PF` — `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`
- Contrast only (not deepened): `FARTICLE` / `ART300.RPGLE` (`art-modules`, unbound), `ORD100` / `ORD101` call sites (`ord-entry-ord100`, `ord-entry-ord101`, documented), `SAMPLE.BNDDIR` (`srvpgm-supporting`)

## Assumptions / unknowns

- The "no service-program dependency" statement is from source (`H` spec, no `/COPY`, no prototype, no call); the build definition is not in the tree, so a `CRTPGM` that binds extra modules cannot be excluded (`overnight/METHOD_COVERAGE.md`). 
- needs-SME (room, ORD pack): one article/customer lookup rule for the target — blank, "unknown", or error on a miss? Legacy has two different answers (`FARTICLE` blank, `ORD202` stale carry-over). Recorded, not decided.

## Evidence

`ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:5-11,84,108-110,154` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:28` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7,39` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD.PF:9` · `ATU_SRC/QDDSSRC/SAMREF.PF:13-14` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:6,19-27,114-127` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:7-8` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:117,266` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:114,223` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:11`
