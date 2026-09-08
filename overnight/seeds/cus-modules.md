## Slice inputs (operator-scoped) — iter 2

SLICE_ID: cus-modules
SLICE_SEED: Customer ILE modules CUS300 (getters/exists) + CUS301 (SltCustomer selection window) that make up the FCUSTOMER service program
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/CUS300.RPGLE        (nomain; GetCus*, ExistCus, IsCusDeleted)
  - ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE     (nomain; SltCustomer)
  - ATU_SRC/QDDSSRC/CUS301D.DSPF          (selection window)
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/CUSTOMER.PF, CUSTOME1.LF
  - ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC (prototypes — shared include)
  - ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM + ATU_SRC/QSRVSRC/FCUSTOMER.BND (binding — charter keeps as separate seed srvpgm-fcustomer)
  - Callers observed: CUS250, ORD100, ORD101, ORD200 (via CUSTOME1 direct), ORD202, ORD500 (GetCusName / SltCustomer)
OUT_OF_SCOPE_HINTS:
  - CUS200 screens (cus-interactive)
  - Export/signature policy of FCUSTOMER (srvpgm-fcustomer) — overlap flagged in SME_BRIEF
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 modules + 1 DSPF (~500 lines). Callable boundary = exported procedures — good characterization seam.
