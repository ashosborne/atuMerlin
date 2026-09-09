## Slice inputs (operator-scoped) — iter 6

SLICE_ID: ord-entry-ord101
SLICE_SEED: Order line maintenance for an existing order — ORD101(orid): edit quantities/delivered/price, delete lines
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE   (called by ORD200 opt 2, ORD201 opt 2; no menu entry)
  - ATU_SRC/QDDSSRC/ORD101D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/ORDER1.LF (header read), DETORD1.LF (lines by ORID+ODLINE, updated/deleted)
  - FCUSTOMER (GetCusName), FARTICLE (GetArtDesc, GetArtVatCode), FVAT (CLCVat, GetVatRate)
  - ATU_SRC/QMSGFSRC/SAMMSGF.MSGF (ERR1001, ERR1002)
  - ORD700 triggers fire on DETORD update/delete (ord-trigger-ord700)
OUT_OF_SCOPE_HINTS:
  - Creating orders (ord-entry-ord100), order lists (ORD200/201), display (ORD202)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (~290 lines) + 1 DSPF. Thin, characterizable seam (input: ORID; observable: DETORD rows + messages).
Naming note: charter calls this "order entry follow-on"; code is line maintenance of an existing order. Kept the charter SLICE_ID for traceability.
