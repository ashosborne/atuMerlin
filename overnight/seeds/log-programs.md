## Slice inputs (operator-scoped) — iter 20 (residual run)

SLICE_ID: log-programs
SLICE_SEED: Application log — LOG100 creates the SAMLOG user space (one-off setup program, not on the menu) and the LOG service program (LOG300 AddLogEntry) appends "User / Date / Msg" lines to it; menu opt 84 displays it via ADSPUSRSPC (command not in tree). Only in-tree writer: ORD700 on order-line delete.
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE      (*PGM; QUSCRTUS SAMLOG 5000 bytes in PARAMETER's library)
  - ATU_SRC/QILESRVSRC/LOG.ILESRVPGM        (CRTSRVPGM MODULE(LOG300) EXPORT(*ALL))
  - ATU_SRC/QRPGLESRC/LOG300.RPGLE          (*MODULE nomain: AddLogEntry)
  - ATU_SRC/QPROTOSRC/LOG.RPGLEINC, ATU_SRC/QPROTOSRC/APICALL.RPGLEINC (QUSCRTUS / QUSPTRUS / QCMDEXC prototypes)
DEPS (not slice members):
  - SAMLOG *USRSPC (runtime object, not in tree); ATU_SRC/QDDSSRC/PARAMETER.PF (opened by LOG100 only for its library name)
  - Caller: ORD700 (documented ord-trigger-ord700-c03) — callp(e), failure swallowed
  - Menu opt 84 ADSPUSRSPC SAMLOG — command not in tree (blind spot)
OUT_OF_SCOPE_HINTS:
  - ORD700 trigger behaviour (documented)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (27 lines) + 1 module (46 lines). Very thin; the interesting facts are capacity and binding, both runtime / build questions.
