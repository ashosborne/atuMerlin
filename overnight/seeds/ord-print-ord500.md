## Slice inputs (operator-scoped) — iter 10

SLICE_ID: ord-print-ord500
SLICE_SEED: Print a customer order — ORD500(orid) spool via PRTF ORD500O, then ORD500C converts the spool to PDF on the IFS
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE   (called by ORD100 after confirm, ORD200 opt 6, ORD201 opt 6)
  - ATU_SRC/QCLSRC/ORD500C.PGM.CLLE      (PARM &ORD &PATH → CVTSPLPDF)
  - ATU_SRC/QDDSSRC/ORD500O.PRTF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ORDER1.LF, DETORD1.LF, CUSTOME1.LF, ARTICLE1.LF (input)
  - ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC + FPARAMETER (getParm2('PATH') → IFS directory)
  - ATU_SRC/QCMDSRC/CVTSPLPDF.CMD (command definition present; processing program NOT in tree)
OUT_OF_SCOPE_HINTS:
  - Order creation/maintain screens
  - PDF rendering internals (third-party / missing)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (60 lines) + 1 CL + 1 PRTF + 1 CMD def. Thin; observable output = spool + PDF file.
