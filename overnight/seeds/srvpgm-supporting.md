## Slice inputs (operator-scoped) — iter 24 (residual run)

SLICE_ID: srvpgm-supporting
SLICE_SEED: Binding layer — SAMPLE.BNDDIR (the one binding directory; 11 service programs, 4 of them with no source in the tree: XML, ORDER, TXT, XSS) and the cross-service-program binding facts (which programs bind how, signature policy, activation groups). The individual supporting srvpgms (FFAMILLY / FCOUNTRY / FPARAMETER / FVAT / LOG) were scanned as members of their own seeds (fam-maintain, cou-maintain, par-maintain, vat-module, log-programs); this seed does not re-scan their procedures.
SEED_ENTRYPOINTS:
  - ATU_SRC/QBNDSRC/SAMPLE.BNDDIR
  - ATU_SRC/QILESRC/PRO200.ILEPGM, PAR201.ILEPGM (the only two CRTPGM sources)
  - ATU_SRC/QILESRVSRC/*.ILESRVPGM (8), ATU_SRC/QSRVSRC/*.BND (6) — read for binding facts only
DEPS (not slice members):
  - XML, ORDER, TXT, XSS *SRVPGM — NOT in tree (unknown surfaces)
  - Every program with bnddir('SAMPLE') on its H-spec (12) and the four with dftactgrp(*no) and no bnddir (PRO203, ORD500, ORD700, LOG100)
OUT_OF_SCOPE_HINTS:
  - Exported procedure behaviour (own seeds)
  - Conversion / tests / bind

Attach: migration-factory/docs/FIELD-GUIDE.md
Prompt: migration-factory/prompts/discovery-agent-v0.2.md
Schema: migration-factory/schemas/discovery-manifest.schema.md
Mode: Phase A map only — STOP for human bind

Size check: 1 BNDDIR + 2 ILEPGM + binder sources (~120 lines). Build-metadata seam: nothing here is business behaviour; it is the register of what the build does that the source does not say.
