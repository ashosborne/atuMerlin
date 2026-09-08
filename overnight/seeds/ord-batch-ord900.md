## Slice inputs (operator-scoped) — iter 12

SLICE_ID: ord-batch-ord900
SLICE_SEED: Order batch/utility programs — ORD900 (reset LASTORDNO to max order id) and ORD901 (shift all order dates so the latest order is today; resync years and customer last-order dates)
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE      (menu opt 80 "Reset LASTORDNO")
  - ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE   (menu opt 81 "Reset Order dates to current")
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ORDER.PF, ORDER1.LF, DETORD.PF, CUSTOMER.PF
  - ATU_SRC/QDTASRC/LASTORDNO.DTAARA
OUT_OF_SCOPE_HINTS:
  - ART801 (sql-objects seed) — sibling "reset" utility (menu opt 82)
  - Interactive ORD screens
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 small PGMs (11 + 52 lines). Batch/CLI-style callable seams; observable = file state before/after.
