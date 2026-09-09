# sql-objects-c05 — `ARTIINF` (`article_full_description`) table contract: `ARID CHAR(6)` primary key + `ARTINF VARCHAR(1520)`, both `CCSID 297 NOT NULL DEFAULT ''`; written by `ART200` option 3 (insert-or-update of `TRIM(:text)`), read by `ART302.GetArtInfo`

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is data-contract card, Phase B — table behind the held `art-*` slices; ART screens and getters are cited for their `ARTIINF` statements only) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md` — "Never invent ART302") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ARTIINF` is the only SQL-defined table in the estate (every other file is DDS). `CREATE TABLE article_full_description FOR SYSTEM NAME ARTIINF` with two columns — `ARTICLE_INFO_ID FOR COLUMN ARID CHAR(6) CCSID 297 NOT NULL DEFAULT ''` and `ARTICLE_INFORMATION FOR COLUMN ARTINF VARCHAR(1520) CCSID 297 NOT NULL DEFAULT ''` — a table label, two column headings, and a separate `ALTER TABLE … ADD CONSTRAINT PRIM_ARTIINF PRIMARY KEY (ARTICLE_INFO_ID)`. No foreign key to `ARTICLE`. Exactly two programs touch it: `ART200` panel 3 (menu option 3 on an article) reads the row into a `1520A CHECK(LC)` screen field, and on Enter writes `TRIM(:text)` back — `UPDATE` if the read found a row, `INSERT` otherwise — with no error check after the write; `ART302.GetArtInfo` reads `artinf` by `arid` into a fixed 1520-byte field. `ART200` uses the **long** column names, `ART302` the **short** ones. The `CCSID 297` (EBCDIC France) is the only explicit CCSID on a data column anywhere in `ATU_SRC`. 1520 = 19 × 80: the free text is one screen page of 19 lines.

## Entrypoints

- DDL — `ATU_SRC/QSQLSRC/ARTIINF.TABLE:5-20`
- Writer: `ART200` option 3 → `panel = 3` (`ART200.PGM.SQLRPGLE:203-207`) → `S03prp` read (`:331-343`) → `FMT03` (`:345-348`; `ART200D.DSPF:116-134`) → `S03act` write (`:367-378`)
- Reader: `ART302` `GetArtInfo(P_ARID)` — `ATU_SRC/QRPGLESRC/ART302.SQLRPGLE:11-24` (`art-modules`, held — cited for the statement only)
- No other reference (structural grep `ARTIINF` / `artiinf` / `ARTICLE_INFO`: the four statements above and the DDL).

## Inputs / outputs / observables

- Columns: `ARID` `CHAR(6)` — same width as `SAMREF.ARID 6A`, so the key matches `ARTICLE.ARID` byte for byte (no constraint enforces it); `ARTINF` `VARCHAR(1520)`. Both `NOT NULL DEFAULT ''`. — `ARTIINF.TABLE:6-9`; `ATU_SRC/QDDSSRC/SAMREF.PF:11`
- Labels: table 'Article Informations File'; column headings 'ARTICLE ID', 'ARTICLE INFORMATION'; member `%TEXT` "Article Informations File". — `ARTIINF.TABLE:2,12-17`
- In (`ART200`): screen field `TEXT 1520A B 4 1 CHECK(LC)` — 19 rows × 80 columns from row 4, lowercase allowed. — `ATU_SRC/QDDSSRC/ART200D.DSPF:134`
- Out (`ART200`): `ARTICLE_INFORMATION = TRIM(:text)`. Out (`ART302`): `savinfo` `1520` fixed, returned as the `GetArtInfo` value. — `ART200.PGM.SQLRPGLE:371-376`; `ART302.SQLRPGLE:8,12,17-19,22`
- Observable: `FMT03` "Article Informations" (title `ART200-3`, F3 Exit / F12 Cancel, article id + description on row 2). — `ART200D.DSPF:116-134`

## Behaviour as implemented

1. **Table shape.** Two columns, both with SQL long names and `FOR COLUMN` system names; `CCSID 297` on each; `NOT NULL DEFAULT ''`. The primary key is added afterwards by `ALTER TABLE` and named `PRIM_ARTIINF`. No `REFERENCES`, no `CHECK`, no trigger. — `ARTIINF.TABLE:5-10,19-20`
2. **Read for edit (`ART200` `S03prp`).** `SELECT ARTICLE_INFORMATION INTO :text FROM artiinf WHERE ARTICLE_INFO_ID = :arid`; `if sqlcod <> 0` → `mode = crt`, `clear text`; else `mode = upd`. The precompiler directive `set option commit = *none` sits in the same subroutine (position is irrelevant to a `SET OPTION`; it applies to the whole program — the only `SET OPTION` in `QRPGLESRC`). — `ART200.PGM.SQLRPGLE:331-343`
3. **Write (`ART200` `S03act`).** `mode = upd` → `UPDATE artiinf SET ARTICLE_INFORMATION = trim(:text) WHERE ARTICLE_INFO_ID = :arid`; else `INSERT INTO artiinf VALUES(:arid, trim(:text))`. No `sqlcod` test after either statement; control returns to panel 1 regardless. — `ART200.PGM.SQLRPGLE:367-378`
4. **Exit paths (`S03key`).** F3 (`exit`) and F12 (`cancel`) both go back to panel 1 without writing; any other key falls through `S03chk` (no checks) to `S03act`. So *Enter always writes*, even with unchanged text. — `ART200.PGM.SQLRPGLE:350-365`
5. **Read for display (`ART302.GetArtInfo`).** `if P_arid <> savId` → `select artinf into :savinfo from artiinf where arid = :savid`; returns `savinfo` (1520 fixed). Short column names; no `sqlcod` test. The procedure's caching and its caller (`ART250`) are `art-modules` / `art-interactive` matters — not documented here. — `ART302.SQLRPGLE:11-24`
6. **Name forms.** The same table is addressed as `artiinf` / `ARTICLE_INFORMATION` / `ARTICLE_INFO_ID` in `ART200` and as `artiinf` / `artinf` / `arid` in `ART302`; DB2 for i accepts both forms for a column that has a `FOR COLUMN` name. — `ART200.PGM.SQLRPGLE:333-335,371-376`; `ART302.SQLRPGLE:17-19`

## Validation rules found in code

- Only the primary key: a second `INSERT` for the same `ARID` fails (`SQLSTATE 23505` — platform). Nothing checks that `ARID` names an existing article — the DDL has no foreign key and `ART200` reaches panel 3 only from a listed article row, so in-tree writes are always for existing ids, but the table would accept any six characters. — `ARTIINF.TABLE:19-20`
- `NOT NULL DEFAULT ''` on both columns: an `INSERT` that omits `ARID` (ad-hoc SQL only — `ART200` always supplies it) gets the blank key; at most one such row can exist. — `ARTIINF.TABLE:6-9`
- No length check beyond the column: `TRIM` can only shorten the 1520-byte screen value, so `VARCHAR(1520)` is never exceeded from `ART200`.

## Edge cases found in code

- **Any read error is treated as "no row".** `if sqlcod <> 0` covers `+100` (not found) but also every negative SQLCODE (table missing from `*LIBL`, authority, CCSID conversion failure…). In those cases `mode = crt` and Enter performs an `INSERT` — which, if the row does exist, fails on the primary key, and the failure is not checked: the user's edit is **silently lost**. — `ART200.PGM.SQLRPGLE:336-341,374-377`
- **`TRIM` strips both ends.** Leading blanks (indentation of the first line) are removed as well as trailing ones; the stored value can be `''` if the screen was left blank — a row with empty text is then created in `crt` mode (Enter on an empty page writes `INSERT … VALUES(:arid, '')`). — `ART200.PGM.SQLRPGLE:372,376`
- **1520 fixed in, 1520 varying out.** `ART302` fetches `VARCHAR(1520)` into a fixed `1520A`, so consumers of `GetArtInfo` see the text blank-padded to 1520 again — `TRIM`ming on write buys nothing at that reader. — `ART302.SQLRPGLE:8,17-19`
- **`CCSID 297` vs everything else.** The DDS files carry no CCSID (they take the job / system default); this table fixes EBCDIC France on both columns. Text entered from a job running another CCSID is converted on write and read (platform); a target that stores UTF-8 must decide what the existing bytes mean. Also the message file: `SAMMSGF` messages are `CCSID(297)` too (`menu-cmd-shell-c05`), so 297 is the estate's implied language, not an accident. — `ARTIINF.TABLE:7,9`; `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:10-23`; structural grep `CCSID`
- **No row for most articles.** The table is populated one article at a time by option 3; articles never given a text have no row, and `GetArtInfo` for them returns whatever the `SELECT INTO` left in `savinfo` (no `sqlcod` check — `ART302.SQLRPGLE:17-19`; the consequence is an `art-modules` matter).
- **Soft-deleted articles keep (and can still edit) their text** — `c06`.

## Dependencies

- `ARTICLE.PF` (`ARID` — logical, not declared), `SAMREF.PF:11` (`ARID 6A`).
- Writer `ART200` (`art-interactive`, held), reader `ART302` (`art-modules`, held), reader's caller `ART250` (held) — cited for the `ARTIINF` statements only.
- `c06` (never deleted), `c10` (long / short names, `CCSID`, labels).

## Assumptions / unknowns

- Platform: duplicate-key SQLSTATE; CCSID conversion on host-variable transfer; `SET OPTION` scope. Inference, runtime-confirmable.
- **needs-SME (`art-*` owner, when ART is bound):** is the "any error → create" path (`sqlcod <> 0`) acceptable as-is, or is the lost-edit case a defect to record for the target? Not fixed here — the job header holds ART, and this card documents the table, not the screen.
- **needs-SME (room, data migration):** the bytes in `ARTINF` are `CCSID 297`; confirm the target's character-set mapping for the free text (accents). Only this table and the message file carry an explicit CCSID.
- Existing target counterpart: none — no `art` pack exists and `modern/` has no `artiinf` (grep). Nothing to widen.

## Evidence

`ATU_SRC/QSQLSRC/ARTIINF.TABLE:2-20` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:66-75,203-207,331-378` · `ATU_SRC/QDDSSRC/ART200D.DSPF:116-134` · `ATU_SRC/QRPGLESRC/ART302.SQLRPGLE:8-24` · `ATU_SRC/QDDSSRC/SAMREF.PF:11-14` · `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:8-23` · structural grep of `ATU_SRC/**` for `artiinf` / `ARTIINF` / `ARTICLE_INFO` (DDL + `ART200:334,371,375` + `ART302:18`), for `CCSID` (`ARTIINF.TABLE`, `SAMMSGF.MSGF`, one `ORD700` API parameter), for `SET OPTION` in `QRPGLESRC` (`ART200:332` only), for `artiinf` under `modern/` (none)
