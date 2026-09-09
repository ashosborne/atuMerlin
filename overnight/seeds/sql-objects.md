## Slice inputs (operator-scoped) — iter 22 (residual run)

SLICE_ID: sql-objects
SLICE_SEED: SQL-defined objects that are not triggers or UDFs — ORDERCUS view (order list with customer name + total), ARTLSTDAT view (article last-order date, no consumer), ARTIINF table (article free text), CUSSEQ sequence (customer ids), ART801 stored procedure (menu opt 82 "Reset Summary Fields")
SEED_ENTRYPOINTS:
  - ATU_SRC/QSQLSRC/ORDERCUS.VIEW
  - ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW
  - ATU_SRC/QSQLSRC/ARTIINF.TABLE
  - ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ
  - ATU_SRC/QSQLSRC/ART801.SQLPRC
DEPS (not slice members):
  - ORDER.PF, DETORD.PF, CUSTOMER.PF, ARTICLE.PF (base tables)
  - Consumers: ORD200 / ORD201 (ORDERCUS), CUS200 (CUSSEQ — documented cus-interactive-c02), ART200 / ART302 (ARTIINF — art-* candidates), menu opt 82 (ART801 — documented as ord-trigger-ord700-c10)
OUT_OF_SCOPE_HINTS:
  - ORD701.SQLTRG (documented in ord-trigger-ord700)
  - ISOTODATE / ISOTODATE4 UDFs (dat-utils)
  - Re-documenting ART801 / CUSSEQ behaviour already carded under bound slices — this seed only gives them a surface
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 5 short DDL members (~130 lines). Data-shaped seam: the views are read contracts, the procedure is the only callable.
