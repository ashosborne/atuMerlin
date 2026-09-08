# CANDIDATES — art-interactive (Phase A, unbound)

Seed: `ART200` work-with, `ART201` providers-of-article, `ART202` articles-of-provider, `ART250` article-by-id. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| art-interactive-c01 | List articles by description with position-to, 14-row paging | `QRPGLESRC/ART200.PGM.SQLRPGLE:7` (ARTICLE2), `:94-132`, `QDDSSRC/ART200D.DSPF` | observed-in-code | Primary screen |
| art-interactive-c02 | Create article with id = max(ARID)+1, retry increment on duplicate-key write | `ART200.PGM.SQLRPGLE:245-250` (`setgt *hival; readp; NewId+1; %editc(X)`), `:300-306` (`write(e)… dow %error; NewId += 1`) | observed-in-code | Distinct id-allocation strategy (vs CUSSEQ for customers) |
| art-interactive-c03 | Update article (option 2) | `ART200.PGM.SQLRPGLE:197-202`, `:297-298` | observed-in-code | Core maintain |
| art-interactive-c04 | Article free-text info (option 3): read/insert/update `ARTIINF` SQL table (1520-char text) | `ART200.PGM.SQLRPGLE:203-207`, `:331-343` (select → mode crt/upd), `:367-377` (update/insert `trim(:text)`), `QSQLSRC/ARTIINF.TABLE:5-12` | observed-in-code | Only SQL-table write in the ART domain |
| art-interactive-c05 | Soft delete article (option 4 → `ARDEL='X'` + audit) | `ART200.PGM.SQLRPGLE:208-216` | observed-in-code | Contrast with customers (no delete path) |
| art-interactive-c06 | Navigate to providers of article (option 6 → `ART201`) | `ART200.PGM.SQLRPGLE:16-17`, `:217-220` | observed-in-code | Internal seam edge |
| art-interactive-c07 | Validation: description mandatory; family must exist (`ExistArtFam`); F4 family prompt (`SltArtFam`) | `ART200.PGM.SQLRPGLE:271-289`, `ART200D.DSPF` (errFamilly/errDesc indicators 40/41) | observed-in-code | Validation target |
| art-interactive-c08 | Option validation on list: allowed 2, 3, 4, 6 (reject >6, 1, 5) | `ART200.PGM.SQLRPGLE:166-186` | observed-in-code | Screen contract |
| art-interactive-c09 | `ART201`: list providers of an article (ARTIPRO1 by ARID) with provider name lookup; option 2 edits buy price / provider ref with audit stamp | `QRPGLESRC/ART201.PGM.RPGLE:7` (ARTIPRO1), `:101-114`, `:170-175`, `:227-233` (apmod/apmodid update) | observed-in-code | Article↔provider link maintenance |
| art-interactive-c10 | `ART202`: list articles of a provider (ARTIPROV by PRID) with article description lookup; option 2 edits link row | `QRPGLESRC/ART202.PGM.RPGLE:7`, `:101-113`, `:168-172`, `:224-232` | observed-in-code | Mirror of c09, called from provider side (`PRO200.RPGLE:13`, `PRO250.PGM.RPGLE:12`) |
| art-interactive-c11 | `ART250`: article by id — F4 `SltArticle`; detail shows family desc, VAT-inclusive price (`CLCVat`), stock value (`ARSTOCK*ARWHSPR`), info text (`GetArtInfo`) | `QRPGLESRC/ART250.PGM.SQLRPGLE:107-125`, `:151-157` | observed-in-code | Inquiry with derived fields |
| art-interactive-c12 | `ART250` not-found fallback: LIKE `%id%` search subfile (panel 3, 16 rows/page); option 1 opens detail; empty result → NotFound message | `ART250.PGM.SQLRPGLE:120-125`, `:209-254`, `:309-320` | observed-in-code | Distinctive UX rule |
| art-interactive-c13 | `ART250` F7 shows providers (→ `ART201`) | `ART250.PGM.SQLRPGLE:26`, `:172-174` | observed-in-code | Seam edge |
| art-interactive-c14 | Audit stamping ARMOD/ARMODID on save, ARCREA on create; APMOD/APMODID on link update | `ART200.PGM.SQLRPGLE:295-300`, `ART201.PGM.RPGLE:230-231`, `ART202.PGM.RPGLE:227-228` | observed-in-code | Persistence side-effect |
| art-interactive-c15 | Quirk: list `sflend` tests `%eof(article1)` while the loop reads `article2` | `ART200.PGM.SQLRPGLE:111-118` | observed-in-code | As-is defect candidate; SME decides preserve vs fix |
| art-interactive-c16 | `ART250` detail keeps `%parms`-free entry; header-less: `providers()` call from detail re-enters via extpgm ART201 | `ART250.PGM.SQLRPGLE:17-19` | observed-in-code | Call-graph fact |

## Unknown / not claimed

- `ARTIPRO2.LF` is declared in `ART250` (`:11`) but never read in the code shown — unused file declaration (observed).
- `ART200D.DSPF` FMT03 (info text) field length vs `ARTIINF.ARTINF VARCHAR(1520)` — not verified field-by-field.

## Deferred recommendations (prose only)

- Consider moving c10 (`ART202`) to `pro-interactive` at bind since its only callers are provider screens; kept here because it maintains the ARTIPROV link like c09.
