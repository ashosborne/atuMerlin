## Slice inputs (operator-scoped) — iter 14 (residual run)

SLICE_ID: pro-modules
SLICE_SEED: Provider service program FPROVIDER — PRO300 getters/predicates over PROVIDE1 and PRO301 SltProvider selection window; folds the `srvpgm-fprovider` binding/export seed (same pattern the 2026-09-08 bind used for srvpgm-fcustomer → cus-modules)
SEED_ENTRYPOINTS:
  - ATU_SRC/QILESRVSRC/FPROVIDER.ILESRVPGM   (CRTSRVPGM MODULE(PRO300 PRO301) EXPORT(*SRCFILE))
  - ATU_SRC/QSRVSRC/FPROVIDER.BND            (SIGNATURE(*GEN) + *PRV block — the only versioned binder source in the tree)
  - ATU_SRC/QRPGLESRC/PRO300.RPGLE           (*MODULE nomain: GetPro* x11, ExistProvider, IsProDeleted)
  - ATU_SRC/QRPGLESRC/PRO301.SQLRPGLE        (*MODULE nomain: SltProvider; screen PRO301D)
  - ATU_SRC/QPROTOSRC/PROVIDER.RPGLEINC      (prototypes)
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/PROVIDER.PF, PROVIDE1.LF (input-only), PRO301D.DSPF (evidence on PRO301)
  - Callers: ART201 / ART202 (GetProName), PRO250 (SltProvider)
OUT_OF_SCOPE_HINTS:
  - PRO200 / PRO250 / PRO202 / PRO203 screens (pro-interactive)
  - PRO201 COBOL (pro-cobol-pro201)
  - SAMPLE.BNDDIR as a whole (srvpgm-supporting)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 modules (~400 lines) + 1 DSPF + binder source. Thin; twin of cus-modules.
