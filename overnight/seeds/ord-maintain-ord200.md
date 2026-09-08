## Slice inputs (operator-scoped) — iter 7

SLICE_ID: ord-maintain-ord200
SLICE_SEED: Orders of one customer — ORD200(cuid) list with create/update/delete/display/print/close/deliver options
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE   (called by CUS200 opt 5; no menu entry)
  - ATU_SRC/QDDSSRC/ORD200D.DSPF
DEPS (not slice members):
  - ATU_SRC/QSQLSRC/ORDERCUS.VIEW (list source, joins ORDER+CUSTOMER, TOTVAL subselect)
  - ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF → DAT002 (ISOTODATE40 date conversion)
  - ATU_SRC/QDDSSRC/ORDER1.LF (update/delete), DETORD1.LF (delete/deliver), CUSTOME1.LF (header)
  - Called programs: ORD100C (create), ORD101 (update), ORD202 (display), ORD500 (print)
  - ORD700 triggers fire on DETORD delete/update
OUT_OF_SCOPE_HINTS:
  - ORD201 (all-customers list) — near-duplicate logic, separate seam per charter; divergences flagged in SME_BRIEF
  - Internals of ORD100/101/202/500
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (~290 lines) + 1 DSPF. Thin seam; observable outcomes = ORDER/DETORD state changes.
