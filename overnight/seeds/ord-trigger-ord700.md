## Slice inputs (operator-scoped) — iter 11

SLICE_ID: ord-trigger-ord700
SLICE_SEED: Order trigger seam — ORD700 external trigger program on DETORD (insert/delete/update → ARTICLE.ARCUSQTY) + ORD701 SQL trigger on ORDER insert (→ CUSTOMER.CULASTORD)
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE
  - ATU_SRC/QTRGSRC/ORD700A.SYSTRG  (ADDPFTRG DETORD *AFTER *INSERT)
  - ATU_SRC/QTRGSRC/ORD700D.SYSTRG  (ADDPFTRG DETORD *AFTER *DELETE)
  - ATU_SRC/QTRGSRC/ORD700U.SYSTRG  (ADDPFTRG DETORD *AFTER *UPDATE TRGUPDCND(*CHANGE))
  - ATU_SRC/QSQLSRC/ORD701.SQLTRG   (CREATE TRIGGER AFTER INSERT ON ORDER)
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/DETORD.PF (trigger buffer EXTNAME), ARTICLE1.LF (updated), ORDER.PF, CUSTOMER.PF
  - ATU_SRC/QPROTOSRC/LOG.RPGLEINC + LOG srvpgm (AddLogEntry → SAMLOG user space) — log-programs seed
  - Writers that fire these: ORD100 (insert), ORD101 (update/delete), ORD200/201 (delete, deliver-update)
OUT_OF_SCOPE_HINTS:
  - ART801 reconciliation procedure (sql-objects seed) — related, referenced only
  - Writer programs' own behaviour
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (110 lines) + 3 trigger defs + 1 SQL trigger. Thin, but high-consequence (async-by-effect on every order write). Flagged for humans to split cards if needed.
