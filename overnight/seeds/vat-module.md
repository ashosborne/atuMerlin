## Slice inputs (operator-scoped) — iter 19 (residual run)

SLICE_ID: vat-module
SLICE_SEED: VAT service program FVAT — VAT300 GetVATRate / GetVATDesc / ClcVAT / ExistVATRate over VATDEF; the VAT arithmetic used by order entry (ORD100/ORD101) and the article inquiry (ART250)
SEED_ENTRYPOINTS:
  - ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM       (CRTSRVPGM MODULE(VAT300) EXPORT(*SRCFILE))
  - ATU_SRC/QSRVSRC/FVAT.BND                (4 exports, SIGNATURE('V1'))
  - ATU_SRC/QRPGLESRC/VAT300.RPGLE          (*MODULE nomain)
  - ATU_SRC/QPROTOSRC/VAT.RPGLEINC
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/VATDEF.PF (K VATCODE 1A; VATRATE 4P 2; VATDESC; VATDEL; audit columns) — no maintenance program, no writer in the tree
  - Callers: ORD100 (CLCVat, GetVatRate), ORD101 (CLCVat, GetVatRate), ART250 (CLCVat) — all via GetArtVatCode(FARTICLE)
OUT_OF_SCOPE_HINTS:
  - Order / article screens (callers only; ORD100 is documented, ORD101 / ART250 are Phase A)
  - FAMILLY.FAVATCD default VAT code (fam-maintain c12 — never read)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 module (85 lines). Very thin; the arithmetic rule is the whole value. Already a dependency of the converted CUS vertical's neighbours (ORD100 documented cards cite CLCVat) — do not widen atu-merlin-ts-cus-v1 from here.
