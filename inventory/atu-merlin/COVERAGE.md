# COVERAGE — atu-merlin

> Generated from `APP_MANIFEST.yaml` by `overnight/tools/gen_coverage.py`. **Do not hand-edit.**
> Counts only. No completion percentage exists or should be derived from this file.

- app status: `in_progress` · completeness: `incomplete` (human residual gate)
- last_updated: `2026-09-08T15:30:19Z` by `document-slices-conveyor`
- notes:
  - estate_scan: partial (see overnight/METHOD_COVERAGE.md). Pack A radar output: candidates only, nothing bound. Surfaces are callable IBM i objects (PGM/MODULE/SRVPGM/CL/CMD/trigger); DSPF/PRTF are evidence on the owning program. kind=other for all IBM i surfaces (schema enum is integration-flavoured). Human residual gate required.
  - Room bind 2026-09-08: accepted cus-interactive, cus-modules (fold srvpgm-fcustomer), ord-entry-ord100, ord-trigger-ord700; deferred ord-batch-ord900; skip art-* until ART302 answered. Pack B document only; inferred stay needs-SME; convert later CUS-only.
  - Pack B run 1 (2026-09-08): cus-interactive 12/12 accepted behaviours documented (cards under discovery/cus-interactive/features/); bind statuses (accepted/deferred) mirrored from slice MANIFESTs for cus-modules, ord-entry-ord100, ord-trigger-ord700, ord-batch-ord900. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 2 (2026-09-08): cus-modules 10/10 accepted behaviours documented (cards under discovery/cus-modules/features/); c10 stays needs-SME (inferred), no card.

## Histogram

| Metric | Count |
| --- | ---: |
| surfaces_total | 31 |
| surfaces `accepted` | 12 |
| surfaces `candidate` | 14 |
| surfaces `deferred` | 2 |
| surfaces `unknown` | 3 |
| behaviours_known | 134 |
| behaviours `accepted` | 20 |
| behaviours `candidate` | 92 |
| behaviours `documented` | 22 |
| behaviours confidence `inferred` | 10 |
| behaviours confidence `observed-in-code` | 124 |
| scanned_seeds | 12 |
| unscanned_hints | 21 |
| legacy_green | 0 |
| parity_green | 0 |
| parity_waived | 0 |

## Per slice (counts, not progress — weakest status wins)

| slice_id | surfaces | behaviours | documented | weakest status |
| --- | ---: | ---: | ---: | --- |
| `art-interactive` | 5 | 16 | 0 | `candidate` |
| `art-modules` | 4 | 11 | 0 | `candidate` |
| `cus-interactive` | 4 | 12 | 12 | `documented` |
| `cus-modules` | 3 | 11 | 10 | `candidate` |
| `ord-batch-ord900` | 2 | 9 | 0 | `candidate` |
| `ord-entry-ord100` | 4 | 14 | 0 | `candidate` |
| `ord-entry-ord101` | 1 | 12 | 0 | `candidate` |
| `ord-maintain-ord200` | 1 | 13 | 0 | `candidate` |
| `ord-maintain-ord201` | 1 | 11 | 0 | `candidate` |
| `ord-maintain-ord202` | 1 | 6 | 0 | `candidate` |
| `ord-print-ord500` | 2 | 8 | 0 | `candidate` |
| `ord-trigger-ord700` | 3 | 11 | 0 | `candidate` |

## Scanned seeds

- `art-interactive`
- `art-modules`
- `cus-interactive`
- `cus-modules`
- `ord-batch-ord900`
- `ord-entry-ord100`
- `ord-entry-ord101`
- `ord-maintain-ord200`
- `ord-maintain-ord201`
- `ord-maintain-ord202`
- `ord-print-ord500`
- `ord-trigger-ord700`

## Unscanned hints (residual — not a completeness claim)

- seed pro-interactive: PRO200/PRO202/PRO203/PRO250 + PRO200D/201D/202D/250D (PRO200.ILEPGM binds XML srvpgm - source missing)
- seed pro-modules: PRO300/PRO301 + PRO301D (FPROVIDER body)
- seed pro-cobol-pro201: QCBLSRC/PRO201.CBL (only COBOL member; menu opt 5)
- seed fam-maintain: FAM300/FAM301 + FAM301D (FFAMILLY body; SltArtFam used by ART200/ART301)
- seed cou-maintain: COU200.RPG (OPM RPG, menu opt 21) + COU300/COU301 (FCOUNTRY body; used by CUS200/CUS250)
- seed par-maintain: PAR200 (menu opt 20) + PAR201 CL/ILEPGM (menu opt 83, WRKLNK on PATH) + PAR300 (FPARAMETER getParm*; PATH used by ORD500)
- seed vat-module: VAT300 (FVAT: CLCVat/GetVatRate used by ORD100/ORD101/ART250)
- seed log-programs: LOG100 (create SAMLOG user space) + LOG300 (AddLogEntry; used by ORD700 delete)
- seed dat-utils: DAT001/DAT002 (external programs behind SQL UDFs ISOTODATE/ISOTODATE40 used by ORD200/ORD201)
- seed srvpgm-fcustomer: FCUSTOMER binding/export view - recommend merging into cus-modules at bind
- seed srvpgm-farticle: FARTICLE binding/export view - recommend merging into art-modules at bind (ART302 gap)
- seed srvpgm-fprovider: FPROVIDER.ILESRVPGM + FPROVIDER.BND (versioned signatures *GEN/*PRV)
- seed srvpgm-supporting: FFAMILLY/FCOUNTRY/FPARAMETER/FVAT/LOG srvpgms + SAMPLE.BNDDIR (lists XML/ORDER/TXT/XSS srvpgms with no source)
- seed menu-cmd-shell: SAMMNU.MENU (entry map), SAMHELP.PNLGRP, SAMMSGF.MSGF, CVTSPLPDF.CMD; menu references QM queries CUSQRY/ARTQRY and ADSPUSRSPC not in tree
- seed sql-objects: ART801.SQLPRC (menu opt 82 reconciliation), ARTIINF.TABLE, ARTLSTDAT.VIEW, CUSSEQ.SQLSEQ, ISOTODATE/ISOTODATE4.SQLUDF, ORDERCUS.VIEW
- blind-spot: XML, ORDER, TXT, XSS *SRVPGM in SAMPLE.BNDDIR have no source under ATU_SRC (PRO200.ILEPGM binds XML; PRO202 /copy qprotosrc,xml missing)
- blind-spot: QM query objects CUSQRY, ARTQRY, form CUSQRYFMT (menu opts 12/13) not in tree
- blind-spot: CVTSPLPDF processing program and ADSPUSRSPC command not in tree
- blind-spot: CMD->PGM bindings (CRTORD) and trigger attachment are compiled-object/ARCAD metadata, not source
- unknown-surface: CUSTADRE.PF / ADDRESS.PF (multi-address model) referenced by no program in ATU_SRC
- unknown-surface: ARTIPROV link creation - no program found that writes new ARTIPROV rows

## Lint

APP_MANIFEST passed structural lint (schema_version 1, ids unique, enums, anti-greenwash flags).
