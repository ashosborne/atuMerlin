## Slice inputs (operator-scoped) — iter 3

SLICE_ID: art-interactive
SLICE_SEED: Article interactive inquiry/maintain — ART200 (work-with), ART201 (providers of an article), ART202 (articles of a provider), ART250 (article by id)
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE  (menu opt 1 "Work with Articles")
  - ATU_SRC/QRPGLESRC/ART201.PGM.RPGLE     (called by ART200 opt 6, ART250 F7)
  - ATU_SRC/QRPGLESRC/ART202.PGM.RPGLE     (called by PRO200 / PRO250 — cross-domain)
  - ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE  (menu opt 7 "Article by id")
  - ATU_SRC/QDDSSRC/ART200D.DSPF, ART201D.DSPF, ART202D.DSPF, ART250D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ARTICLE.PF, ARTICLE1.LF (UNIQUE ARID), ARTICLE2.LF (ARDESC+ARID)
  - ATU_SRC/QDDSSRC/ARTIPROV.PF (UNIQUE PRID+ARID), ARTIPRO1.LF, ARTIPRO2.LF  (ARTIPRO1/2 not in charter dep list — added from F-specs)
  - ATU_SRC/QSQLSRC/ARTIINF.TABLE (article free-text info; SQL table)
  - ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC, FAMILLY.RPGLEINC, PROVIDER.RPGLEINC, VAT.RPGLEINC
  - FARTICLE, FFAMILLY, FPROVIDER, FVAT service programs (via bnddir SAMPLE)
OUT_OF_SCOPE_HINTS:
  - FARTICLE module internals (art-modules)
  - Provider master screens PRO200/PRO250 (pro-interactive) — they call ART202 but are not members
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 4 entry PGMs (~1200 lines) + 4 DSPFs. Upper end of mid-size; ART202 could be split to the provider side at bind (flagged in SME_BRIEF). Not a mega-slice.
