## Slice inputs (operator-scoped) — iter 18 (residual run)

SLICE_ID: par-maintain
SLICE_SEED: Parameters — PAR200 Work with Parameters (menu opt 20; list / create / edit / delete of PARAMETER rows), PAR201 Work with IFS output (menu opt 83; CL that resolves PATH via GetParm2 and runs WRKLNK), and the FPARAMETER service program (PAR300 GetPARM1..5 by code + sub-code) whose only in-tree consumer is parameter PATH
SEED_ENTRYPOINTS:
  - ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE      (*PGM; screen PAR200D)
  - ATU_SRC/QCLSRC/PAR201.CLLE + ATU_SRC/QILESRC/PAR201.ILEPGM (CRTPGM BNDSRVPGM(FPARAMETER) ACTGRP(QILE))
  - ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM (CRTSRVPGM MODULE(PAR300) EXPORT(*ALL) — no binder source)
  - ATU_SRC/QRPGLESRC/PAR300.RPGLE          (*MODULE nomain: GetPARM1..GetPARM5, chainPARAMETER, closePARAMETER)
  - ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC
  - ATU_SRC/QDDSSRC/PAR200D.DSPF
DEPS (not slice members):
  - ATU_SRC/QDDSSRC/PARAMETER.PF (UNIQUE K PACODE+PASUBCODE; PARM1 10A, PARM2 100A, PARM3 2A, PARM4 1P0, PARM5 3P0)
  - Consumers of GetParm2('PATH',' '): ORD500 (PDF dir), PRO202 (XML dir), PRO203 (spreadsheet dir), PAR201 (WRKLNK); LOG100 opens PARAMETER only to learn its library
OUT_OF_SCOPE_HINTS:
  - The programs that consume PATH (their own slices)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 PGM (314 lines) + 1 CL + 1 module (109 lines) + 1 DSPF. Thin; generic key/value store with one live key.
