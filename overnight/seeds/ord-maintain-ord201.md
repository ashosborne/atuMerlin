## Slice inputs (operator-scoped) — iter 8

SLICE_ID: ord-maintain-ord201
SLICE_SEED: All customer orders — ORD201 list (menu opt 3 "Work with Customer Orders") with the same lifecycle options as ORD200
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE
  - ATU_SRC/QDDSSRC/ORD201D.DSPF
DEPS (not slice members):
  - ATU_SRC/QSQLSRC/ORDERCUS.VIEW, ISOTODATE4.SQLUDF (DAT002)
  - ATU_SRC/QDDSSRC/ORDER1.LF, DETORD1.LF, CUSTOME1.LF, ARTICLE1.LF (declared; ARTICLE1/CUSTOME1 not used in observed code)
  - Called programs: ORD100C2 (create), ORD101, ORD202, ORD500
  - ORD700 triggers on DETORD delete/update
OUT_OF_SCOPE_HINTS:
  - ORD200 (per-customer twin) — shared rules noted, not merged
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (~295 lines) + 1 DSPF. Thin seam; menu-reachable, so the most likely human entry point for order lifecycle.
