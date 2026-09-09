## Slice inputs (operator-scoped) — iter 9

SLICE_ID: ord-maintain-ord202
SLICE_SEED: Display one order (read-only) — ORD202(orid): header, customer, lines, totals
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE   (called by ORD200 opt 5, ORD201 opt 5)
  - ATU_SRC/QDDSSRC/ORD202D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ORDER1.LF, DETORD1.LF, CUSTOME1.LF, ARTICLE1.LF (all input-only)
OUT_OF_SCOPE_HINTS:
  - Any update behaviour (none exists here)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (~155 lines) + 1 DSPF. Very thin, read-only; ideal low-risk first bind for a display seam.
Naming note: charter id says "maintain"; program is display-only. Kept for traceability.
