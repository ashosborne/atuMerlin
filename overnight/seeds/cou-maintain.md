## Slice inputs (operator-scoped) — iter 17 (residual run)

SLICE_ID: cou-maintain
SLICE_SEED: Countries — COU200 Work with Countries (OPM RPG III, menu opt 21; edit name / ISO-3 only) plus the FCOUNTRY service program (COU300 getters/ExistCountry, COU301 SltCountry window) used by CUS200 / CUS250 / PRO200 / PRO250
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGSRC/COU200.RPG              (*PGM RPG III / OPM — the only fixed-form OPM member)
  - ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM   (CRTSRVPGM MODULE(COU300 COU301) EXPORT(*SRCFILE))
  - ATU_SRC/QSRVSRC/FCOUNTRY.BND            (4 exports, SIGNATURE('V1'))
  - ATU_SRC/QRPGLESRC/COU300.RPGLE          (*MODULE nomain: GetCountryName, GetCountryIso3, ExistCountry)
  - ATU_SRC/QRPGLESRC/COU301.RPGLE          (*MODULE nomain: SltCountry; window COU301D)
  - ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC
  - ATU_SRC/QDDSSRC/COU200D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/COUNTRY.PF (UNIQUE K COID; COID 2A, COUNTR 30A, COISO 3A — no delete flag), COUNTR1.LF (K COUNTR), COU301D.DSPF (evidence on COU301)
  - Callers: CUS200 (GetCountryName, SltCountry, ExistCountry), CUS250 (GetCountryName), PRO200 (same three), PRO250 (GetCountryName); PRO200.ILEPGM BNDSRVPGM(FCOUNTRY)
OUT_OF_SCOPE_HINTS:
  - Customer / provider screens (callers only)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 OPM PGM (138 lines) + 2 modules (~330 lines) + 2 DSPF. Thin. Language outlier (RPG III) alongside the COBOL one.
