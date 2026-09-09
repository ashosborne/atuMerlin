## Slice inputs (operator-scoped) — iter 1

SLICE_ID: cus-interactive
SLICE_SEED: Customer interactive inquiry/maintain (CUS200 work-with + CUS250 display-by-id entry programs)
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE   (menu SAMMNU opt 2 "Work with Customers")
  - ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE      (menu SAMMNU opt 8 "Customer by id")
  - ATU_SRC/QDDSSRC/CUS200D.DSPF
  - ATU_SRC/QDDSSRC/CUS250D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/CUSTOMER.PF, CUSTOME1.LF (UNIQUE CUID), CUSTOME2.LF (CUSTNM+CUID)
  - ATU_SRC/QDDSSRC/SAMREF.PF (field reference)
  - ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ (customer id sequence; sql-objects seed)
  - ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC + FCOUNTRY srvpgm (ExistCountry / GetCountryName / SltCountry)
  - ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC + FCUSTOMER srvpgm (SltCustomer used by CUS250)
  - ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE (called on option 5 — ord-maintain-ord200 seam)
  - ATU_SRC/QMSGFSRC/SAMMSGF.MSGF (ERR0002, ERR0103, ERR2000-2002)
OUT_OF_SCOPE_HINTS:
  - Order list/maintain behaviour (ORD200) — separate seam
  - FCUSTOMER getter/selector internals (cus-modules)
  - CUSTADRE.PF / ADDRESS.PF — charter lists them as deps, but neither CUS200 nor CUS250 reference them (observed); noted as an unknown surface
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 2 entry PGMs + 2 DSPFs (~730 lines) — mid-size, characterizable via 5250 screen flows. Not a mega-slice.
