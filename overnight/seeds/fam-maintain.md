## Slice inputs (operator-scoped) — iter 16 (residual run)

SLICE_ID: fam-maintain
SLICE_SEED: Article family service program FFAMILLY — FAM300 getters/predicates over FAMILLY and FAM301 SltArtFam selection window (used by ART200 / ART301). NOTE: charter id says "maintain" but there is no family maintenance program in ATU_SRC; id kept stable, misnomer recorded (same treatment as ord-entry-ord101).
SEED_ENTRYPOINTS:
  - ATU_SRC/QILESRVSRC/FFAMILLY.ILESRVPGM   (CRTSRVPGM MODULE(FAM300 FAM301) EXPORT(*SRCFILE))
  - ATU_SRC/QSRVSRC/FFAMILLY.BND            (4 exports, SIGNATURE('V1'))
  - ATU_SRC/QRPGLESRC/FAM300.RPGLE          (*MODULE nomain: GetArtFamDesc, ExistArtFam, IsArtFamDeleted)
  - ATU_SRC/QRPGLESRC/FAM301.RPGLE          (*MODULE nomain: SltArtFam; window FAM301D; by code / by description)
  - ATU_SRC/QPROTOSRC/FAMILLY.RPGLEINC
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/FAMILLY.PF (UNIQUE K FAID; FAVATCD default VAT code; FADEL), FAMILL1.LF (K FADESC), FAM301D.DSPF (evidence on FAM301)
  - Callers: ART200 (GetArtFamDesc, SltArtFam, ExistArtFam), ART250 (GetArtFamDesc), ART301 (SltArtFam, GetArtFamDesc); FARTICLE binds FFAMILLY
OUT_OF_SCOPE_HINTS:
  - Article screens (art-interactive) — cited as callers only
  - VAT (FAVATCD is a family attribute but FVAT is vat-module)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 modules (~330 lines) + 1 DSPF. Thin. No maintenance program: family rows have no create / edit / delete path in the tree.
