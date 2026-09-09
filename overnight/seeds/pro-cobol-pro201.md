## Slice inputs (operator-scoped) — iter 15 (residual run)

SLICE_ID: pro-cobol-pro201
SLICE_SEED: PRO201 "Display Providers" — the only COBOL member in the estate (menu opt 5); read-only provider list with option 2 display and option 5 items (→ ART202)
SEED_ENTRYPOINTS:
  - ATU_SRC/QCBLSRC/PRO201.CBL             (*PGM COBOL; PROVIDE1 sequential, PRO201D transaction file)
  - ATU_SRC/QDDSSRC/PRO201D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/PROVIDE1.LF, PROVIDER.PF (input-only)
  - ART202 (articles of a provider) — art-interactive
  - SAMMSGF (ERR0002 referenced by the DSPF, never raised)
OUT_OF_SCOPE_HINTS:
  - PRO200 maintenance (pro-interactive)
  - FPROVIDER (not used by PRO201 — it reads PROVIDE1 directly)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 COBOL PGM (316 lines) + 1 DSPF. Thin. Language outlier — the only COBOL in `ATU_SRC`; a target-stack decision for COBOL is a room question, not a radar one.
