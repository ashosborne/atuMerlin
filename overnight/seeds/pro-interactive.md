## Slice inputs (operator-scoped) — iter 13 (residual run)

SLICE_ID: pro-interactive
SLICE_SEED: Provider screens — PRO200 Work with Providers (menu opt 4) with its bound PRO202 "Prepare purchase order" module, PRO250 Provider by id (menu opt 9), and the PRO203 "Article to purchase" spreadsheet report (menu opt 10)
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/PRO200.RPGLE          (*MODULE, entry module of *PGM PRO200 per QILESRC/PRO200.ILEPGM)
  - ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE       (*MODULE bound into PRO200; extproc('PRO202'); XML purchase proposal)
  - ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE      (*PGM; F4 SltProvider, F7 → ART202)
  - ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE   (*PGM report; XSS spreadsheet of goods to purchase)
  - ATU_SRC/QILESRC/PRO200.ILEPGM           (CRTPGM MODULE(PRO200 PRO202) BNDSRVPGM(XML FCOUNTRY FPARAMETER))
  - ATU_SRC/QDDSSRC/PRO200D.DSPF, PRO202D.DSPF, PRO250D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/PROVIDER.PF, PROVIDE1.LF (input/update), ARTICLE.PF + ARTIPROV.PF (SQL, read-only)
  - FCOUNTRY (GetCountryName / SltCountry / ExistCountry) — cou-maintain
  - FPARAMETER (getParm2('PATH')) — par-maintain
  - FPROVIDER (SltProvider) — pro-modules
  - ART202 (articles of a provider) — art-interactive
  - XML / XSS service programs and their copybooks — NOT in tree (blind spot)
OUT_OF_SCOPE_HINTS:
  - PRO201 COBOL display list (own seed pro-cobol-pro201)
  - FPROVIDER getters / selector internals (pro-modules)
  - Article maintenance, order screens
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 PGM + 2 MODULE (~750 lines) + 3 DSPF. Mid-size. PRO203 is a report seam that shares only PRO202D.FMT03 with the screens — recommend the bind consider splitting it out (`pro-report-pro203`) if the XSS dependency is out of parity scope.
