## Slice inputs (operator-scoped) — iter 4

SLICE_ID: art-modules
SLICE_SEED: Article ILE/SQL modules ART300 (getters/exists), ART301 (SltArticle selection window), ART302 (GetArtInfo) — the FARTICLE service program body
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ART300.RPGLE
  - ATU_SRC/QRPGLESRC/ART301.SQLRPGLE
  - ATU_SRC/QRPGLESRC/ART302.SQLRPGLE
  - ATU_SRC/QDDSSRC/ART301D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ARTICLE.PF, ARTICLE1.LF
  - ATU_SRC/QSQLSRC/ARTIINF.TABLE (read by ART302)
  - ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC, FAMILLY.RPGLEINC
  - ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM (MODULE(ART300 ART301) BNDSRVPGM(FFAMILLY)), ATU_SRC/QSRVSRC/FARTICLE.BND — binding view kept in srvpgm-farticle seed
  - FFAMILLY service program (SltArtFam / GetArtFamDesc used by ART301)
OUT_OF_SCOPE_HINTS:
  - ART200/201/202/250 screens (art-interactive)
  - FARTICLE export/signature policy (srvpgm-farticle) — overlap flagged
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 3 modules (~400 lines) + 1 DSPF. Callable boundary = exported procedures.
