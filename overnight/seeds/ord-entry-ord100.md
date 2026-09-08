## Slice inputs (operator-scoped) — iter 5

SLICE_ID: ord-entry-ord100
SLICE_SEED: Order entry ORD100 + CL wrappers ORD100C (with customer) / ORD100C2 (no parameter) + CRTORD command
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE
  - ATU_SRC/QCLSRC/ORD100C.PGM.CLLE     (PARM &CUID → CRTORD CUID(&CUID); called by ORD200 F6)
  - ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE    (no parm → CALL ORD100; menu opt 6; ORD201 F6)
  - ATU_SRC/QDDSSRC/ORD100D.DSPF
  - ATU_SRC/QCMDSRC/CRTORD.CMD           (PARM CUID DEC 5 DFT 0)
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ORDER.PF, DETORD.PF (written), QTEMP/DETORD copy via OVRDBF TMPDETORD
  - ATU_SRC/QDTASRC/LASTORDNO.DTAARA (order number source)
  - FCUSTOMER (SltCustomer, GetCusName), FARTICLE (SltArticle, GetArtDesc, GetArtRefSalPrice, GetArtVatCode), FVAT (CLCVat, GetVatRate)
  - ORD500 (print after confirm — ord-print-ord500)
  - ORD700 triggers on DETORD, ORD701 trigger on ORDER fire as side effects (ord-trigger-ord700)
OUT_OF_SCOPE_HINTS:
  - Maintaining existing order lines (ORD101), order lists (ORD200/201), print (ORD500), triggers (ORD700)
  - Whole-ORD mega-slice — refused; this seam is "create a new order" only
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (~340 lines) + 2 CL + 1 CMD + 1 DSPF. Callable boundaries: CRTORD command, ORD100C/ORD100C2 programs. Good seam.
