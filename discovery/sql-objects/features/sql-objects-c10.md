# sql-objects-c10 — Naming and reserved-word port traps in the SQL objects: `"ORDER"` delimited at eight places in `QSQLSRC` (`ORD901` mixes delimited and undelimited spellings); `ARTIINF` long / system names used inconsistently by its two readers; `LABEL ON` headings and texts; `*LIBL` resolution; CCSID 297

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is port-trap card, Phase B — facts a target schema must reproduce or consciously drop) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Five things in the SQL members are about *names*, not data, and each is a place a mechanical port breaks or silently changes. (1) The header file is called `ORDER` — a reserved word in DB2 for i and in every SQL dialect — so the SQL members write `"ORDER"` with delimiters: once each in `ORDERCUS` and `ARTLSTDAT`, six times in `ART801`; RPG programs avoid the issue by opening the logical `ORDER1` instead. `ORD901` writes `from order` **undelimited** three times and `FROM "ORDER"` twice in the same program. (2) `ARTIINF` is the only object with SQL long names (`article_full_description`, `ARTICLE_INFO_ID`, `ARTICLE_INFORMATION`) alongside `FOR SYSTEM NAME` / `FOR COLUMN` short names; `ART200` addresses it by the long names, `ART302` by the short ones — a target must keep both spellings valid or edit one reader. (3) `LABEL ON COLUMN … IS` (headings in 20-character segments, mirroring the DDS `COLHDG`s of `SAMREF`), `LABEL ON COLUMN … TEXT IS` and `LABEL ON TABLE` exist for some columns of `ORDERCUS`, `ARTLSTDAT`, `ARTIINF` — and reproduce a `SAMREF` typo (`DESCRPTION`). (4) Every object reference is unqualified and resolved via `*LIBL` (`SET PATH *LIBL`, system naming in the RPG); the members also carry ARCAD `%METADATA` comment headers in two comment syntaxes. (5) `ARTIINF`'s two columns are `CCSID 297` (`c05`). None of this is behaviour; all of it is contract.

## Entrypoints

- `"ORDER"` delimited: `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:20`; `ARTLSTDAT.VIEW:12`; `ART801.SQLPRC:23,26,29,32,35,37`
- `order` undelimited (embedded SQL): `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:11,43,45` vs delimited at `:47,49`
- Long / system names: `ATU_SRC/QSQLSRC/ARTIINF.TABLE:5-9`; readers `ART200.PGM.SQLRPGLE:333-335,371-376` (long), `ART302.SQLRPGLE:17-19` (short)
- Labels: `ORDERCUS.VIEW:24-34`; `ARTLSTDAT.VIEW:16-22`; `ARTIINF.TABLE:12-17`
- Path / naming: `ART801.SQLPRC:4` (`SET PATH *LIBL`); `CUS200.PGM.SQLRPGLE:185`, `ORD200.PGM.SQLRPGLE:111`, `ART200.PGM.SQLRPGLE:334` (unqualified, mixed-case references)

## Inputs / outputs / observables

- Not a runtime feature. Observable only through catalog views (`QSYS2.SYSCOLUMNS` `COLUMN_HEADING` / `COLUMN_TEXT`, `SYSTABLES` `TABLE_TEXT`, `SYSTABLES.SYSTEM_TABLE_NAME`) and through what report tools print as headings (`c04`).

## Behaviour as implemented

1. **`"ORDER"`.** Eight delimited references in `QSQLSRC`. The delimiter is required because `ORDER` is reserved; the *file* is nevertheless named `ORDER` (`ORDER.PF`) and the RPG programs never name it in SQL — they use `ORDER1` (F-spec, e.g. `ORD200:7`) or the view. `ORD901` is the exception in both directions: `select max(ordate) into :LastDate from order` (line 11), `from order where d.odorid = orid` (lines 43, 45) and `FROM "ORDER"` (lines 47, 49) in one program. Whether the precompiler accepts the undelimited form in that position is a compile-time fact of `ord-batch-ord900` (queue) — recorded here as the one inconsistent spelling, not decided. — `ORDERCUS.VIEW:20`; `ARTLSTDAT.VIEW:12`; `ART801.SQLPRC:23-37`; `ORD901.PGM.SQLRPGLE:11,42-50`
2. **Long names on `ARTIINF` only.** `CREATE TABLE article_full_description FOR SYSTEM NAME ARTIINF (ARTICLE_INFO_ID FOR COLUMN ARID …, ARTICLE_INFORMATION FOR COLUMN ARTINF …)`. `LABEL ON TABLE ARTIINF`, `LABEL ON COLUMN ARTIINF (ARTICLE_INFO_ID IS …)`, `ALTER TABLE ARTIINF …` then mix the system table name with the long column names. `ART200` writes `FROM artiinf WHERE ARTICLE_INFO_ID = :arid` / `SET ARTICLE_INFORMATION = …`; `ART302` writes `select artinf … from artiinf where arid = …`. Both compile on DB2 for i because a column with `FOR COLUMN` has two valid names. No other object in the estate (DDS or SQL) has a long name. — `ARTIINF.TABLE:5-20`; `ART200.PGM.SQLRPGLE:333-335,371-376`; `ART302.SQLRPGLE:17-19`
3. **Labels.** Two forms per object: `LABEL ON COLUMN x (col IS 'heading')` — a column *heading*, split into three 20-character segments by position, which is why `'ORD                 NUM'` (3 + 17 blanks + 3) renders as `ORD` over `NUM` — and `LABEL ON COLUMN x (col TEXT IS 'text')` — the column *text*. Coverage: `ORDERCUS` labels `ORID`, `ORCUID`, `CUSTNM`, `ORYEAR` (not the three dates, not `TOTVAL`); `ARTLSTDAT` labels `ARID`, `ARDESC` (not `LASTORDER`, `QUANTITY`); `ARTIINF` labels both columns and the table. Every heading is the `SAMREF` `COLHDG` for the same field (`'ORD' 'NUM'` ↔ `SAMREF:35`; `'CUST' 'ID'` ↔ `:16`; `'CUSTOMER' 'NAME'` ↔ `:25`; `'YEAR'` ↔ `:69`; `'ART.' 'ID'` ↔ `:12`; `'DESCRIPTION'` ↔ `:14`), and the texts copy `SAMREF` `TEXT` including `'ARTICLE DESCRPTION'` (`:13`). — `ORDERCUS.VIEW:24-34`; `ARTLSTDAT.VIEW:16-22`; `ARTIINF.TABLE:12-17`; `SAMREF.PF:11-14,15-16,24-25,34-35,68-69`
4. **Resolution.** `ART801.SQLPRC:4` `SET PATH *LIBL`; no member qualifies any table, view, sequence or procedure with a schema; the RPG programs have no `SET OPTION NAMING`, so they use `*SYS` naming and `*LIBL` (platform default for `CRTSQLRPGI`). References are mixed-case where the programmer typed them (`Ordercus`, `CusSeq`, `artiinf`) — DB2 folds unquoted identifiers to upper case. — `ART801.SQLPRC:4`; `ORD200.PGM.SQLRPGLE:111`; `CUS200.PGM.SQLRPGLE:185`; `ART200.PGM.SQLRPGLE:334`
5. **Member headers.** Each SQL member starts with an ARCAD `%METADATA … %TEXT … %EMETADATA` block, as `--` comments in the views / table and as `/* */` comments in the sequence / procedure; the `%TEXT` becomes the object text on the box (`c08`: `ART801`'s is blank). Valid SQL comments — harmless to a loader, but they are the *only* place the object texts live. — `ORDERCUS.VIEW:1-3`; `ARTLSTDAT.VIEW:1-3`; `ARTIINF.TABLE:1-3`; `CUSSEQ.SQLSEQ:1-3`; `ART801.SQLPRC:1-3`
6. **Constraint name.** `PRIM_ARTIINF` — the only named constraint in the estate (DDS files have none; `UNIQUE` on the logicals is not a named constraint). — `ARTIINF.TABLE:19-20`
7. **CCSID.** `ARTIINF`'s two columns are `CCSID 297`; nothing else in the SQL members or the DDS declares a CCSID (`c05`). — `ARTIINF.TABLE:7,9`

## Validation rules found in code

- None (naming).

## Edge cases found in code

- **A target that names the header table `order` unquoted fails in PostgreSQL exactly as it would here**; the ORD conversion sidestepped it by calling the table `orders` and keeping the view name `ordercus` (`modern/db/schema.sql:68-71,144` — cited read-only). Any *new* SQL that copies the legacy text (reports, ad-hoc queries, `ART801`'s body) must be re-spelled. — `ART801.SQLPRC:23-37`
- **Column heading segments are positional.** The 20-character split is a DB2 for i convention; a target that stores the heading string verbatim in a `COMMENT ON` keeps the 17 blanks as noise, and one that trims them loses the two-line layout. Decide once, not per column.
- **`DESCRPTION`.** The typo is in `SAMREF.PF:13` (`TEXT`), copied into `ARTLSTDAT.VIEW:22` and into a comment in `QPROTOSRC/ARTICLE.RPGLEINC:5`; every DDS file that takes `ARDESC` by `REFFLD` inherits it at compile time. Fixing it in `SAMREF` changes column text everywhere except the view, which has its own copy; nothing in the RPG reads the text. — `ARTLSTDAT.VIEW:22`; `SAMREF.PF:13`; `ARTICLE.RPGLEINC:5`
- **Two spellings for one column.** If the target exposes `ARTIINF` with only the long names, `ART302`-shaped code breaks; with only the short names, `ART200`-shaped code breaks. Neither reader is in a bound conversion slice (ART held), so this is a note for the ART pack, not a task.
- **Undelimited `order` in `ORD901`.** If the precompiler accepts it (DB2 for i tolerates some reserved words as identifiers in unambiguous positions — not asserted), the program has been running with a spelling a stricter dialect rejects. — `ORD901.PGM.SQLRPGLE:11,43,45`

## Dependencies

- `c01`, `c03`, `c05`, `c08` (the objects); `SAMREF.PF` (source of every heading and text); `ORD901` (`ord-batch-ord900`, queue — cited for the spelling only); `menu-cmd-shell-c05` (`SAMMSGF` CCSID 297 — the same language setting on the message side).

## Assumptions / unknowns

- Platform: reserved-word list; `FOR COLUMN` dual naming; heading-segment convention; identifier folding; `*SYS` naming default for `CRTSQLRPGI`. Inference, catalog-confirmable.
- **needs-SME (ME / room):** which of these to carry into the target as data (headings → `COMMENT ON`? long names as the canonical ones?) and which to drop. Recommendation: keep the *texts* as `COMMENT ON` for the migrated tables/views (they are the only human-readable column documentation the estate has), drop the positional headings, canonicalise `ARTIINF` on its long names when the ART pack is drafted, and treat `ORD901`'s undelimited `order` as a compile-time check for `ord-batch-ord900`.

## Evidence

`ATU_SRC/QSQLSRC/ORDERCUS.VIEW:1-3,20,24-34` · `ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW:1-3,12,16-22` · `ATU_SRC/QSQLSRC/ARTIINF.TABLE:1-20` · `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:1-3` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:1-4,23-37` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:11,42-50` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:333-335,371-376` · `ATU_SRC/QRPGLESRC/ART302.SQLRPGLE:17-19` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7,111` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:185` · `ATU_SRC/QDDSSRC/SAMREF.PF:11-16,24-25,34-35,68-69` · structural grep of `ATU_SRC/**` for `"ORDER"` (10 hits: 8 in `QSQLSRC`, `ORD901:47,49`), for undelimited `from order` (`ORD901:11,43,45`), for `DESCRPTION` (`SAMREF.PF:13`, `ARTLSTDAT.VIEW:22`, `ARTICLE.RPGLEINC:5`), for `FOR SYSTEM NAME` / `FOR COLUMN` (`ARTIINF.TABLE` only), for `LABEL ON` (the three members), for `SET OPTION NAMING` (none), for `CONSTRAINT` (`ARTIINF.TABLE:19` only)