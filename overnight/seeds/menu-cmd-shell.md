## Slice inputs (operator-scoped) — iter 23 (residual run)

SLICE_ID: menu-cmd-shell
SLICE_SEED: Application shell — SAMMNU UIM menu (the entry map for every interactive program), SAMHELP help panel group (stubs), SAMMSGF message file (the ERR* ids used by the screens), and the CVTSPLPDF command definition (processing program not in tree)
SEED_ENTRYPOINTS:
  - ATU_SRC/QPNLSRC/SAMMNU.MENU
  - ATU_SRC/QPNLSRC/SAMHELP.PNLGRP
  - ATU_SRC/QMSGFSRC/SAMMSGF.MSGF
  - ATU_SRC/QCMDSRC/CVTSPLPDF.CMD
DEPS (not slice members):
  - Every program the menu calls (their own slices)
  - QM queries CUSQRY / ARTQRY / form CUSQRYFMT, command ADSPUSRSPC — referenced by the menu, NOT in tree (blind spots)
  - CRTORD.CMD (ord-entry-ord100, accepted) — not re-scanned
OUT_OF_SCOPE_HINTS:
  - Behaviour of the called programs
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 4 non-program members (~320 lines). Adapter layer — the menu is a UI entry map, not a behaviour seam; most value is the cross-reference (which options reach objects that are not in the tree).
