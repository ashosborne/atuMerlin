# COVERAGE — atu-merlin

> Generated from `APP_MANIFEST.yaml` by `overnight/tools/gen_coverage.py`. **Do not hand-edit.**
> Counts only. No completion percentage exists or should be derived from this file.

- app status: `in_progress` · completeness: `incomplete` (human residual gate)
- last_updated: `2026-09-09T22:55:54Z` by `document-slices-conveyor`
- notes:
  - estate_scan: partial (see overnight/METHOD_COVERAGE.md). Pack A radar output: candidates only, nothing bound. Surfaces are callable IBM i objects (PGM/MODULE/SRVPGM/CL/CMD/trigger); DSPF/PRTF are evidence on the owning program. kind=other for all IBM i surfaces (schema enum is integration-flavoured). Human residual gate required.
  - Room bind 2026-09-08: accepted cus-interactive, cus-modules (fold srvpgm-fcustomer), ord-entry-ord100, ord-trigger-ord700; deferred ord-batch-ord900; skip art-* until ART302 answered. Pack B document only; inferred stay needs-SME; convert later CUS-only.
  - Pack B run 1 (2026-09-08): cus-interactive 12/12 accepted behaviours documented (cards under discovery/cus-interactive/features/); bind statuses (accepted/deferred) mirrored from slice MANIFESTs for cus-modules, ord-entry-ord100, ord-trigger-ord700, ord-batch-ord900. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 2 (2026-09-08): cus-modules 10/10 accepted behaviours documented (cards under discovery/cus-modules/features/); c10 stays needs-SME (inferred), no card.
  - Pack B run 3 (2026-09-08): ord-entry-ord100 12/12 accepted behaviours documented (cards under discovery/ord-entry-ord100/features/); c09, c11 stay needs-SME (inferred), no card.
  - Pack B run 4 (2026-09-08): ord-trigger-ord700 8/8 accepted behaviours documented (cards discovery/ord-trigger-ord700/features/); c01, c08, c11 stay needs-SME. Bind queue now empty; conveyor idle until more slices are bound. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 6 (2026-09-08): dat-utils 8/8 accepted behaviours documented (cards discovery/dat-utils/features/); no needs-SME candidates; surfaces udf:ISOTODATE40 / udf:ISO_Num_To_Date candidate -> accepted (bind mirror). Remaining queue: cou-maintain FCOUNTRY c07-c12. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 7 (2026-09-08): cou-maintain FCOUNTRY half c07-c12 6/6 accepted behaviours documented (cards discovery/cou-maintain/features/); c01-c06, c13 deferred (bind mirror); surfaces srvpgm:FCOUNTRY / mod:COU300 / mod:COU301 candidate -> accepted, pgm:COU200 -> deferred. Residual-wave queue empty; conveyor idle until the next ORD bind wave. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 8 (2026-09-08): ord-entry-ord101 documented (11 cards; c11 needs-SME); ORD wave queue left: ord-maintain-ord200, ord-maintain-ord201, ord-maintain-ord202, ord-print-ord500
  - Pack B run 9 (2026-09-08): ord-maintain-ord200 documented (12 cards; c12 needs-SME); ORD wave queue left: ord-maintain-ord201, ord-maintain-ord202, ord-print-ord500
  - Pack B run 10 (2026-09-08): ord-maintain-ord201 documented (11/11 accepted cards; no needs-SME candidates); CHARACTERIZATION deferred-waived; ORD-wave queue left: ord-maintain-ord202, ord-print-ord500
  - Pack B run 11 (2026-09-08): ord-maintain-ord202 documented (6/6 accepted cards; no needs-SME candidates); CHARACTERIZATION deferred-waived; ORD-wave queue left: ord-print-ord500
  - Pack B run 12 (2026-09-08): ord-print-ord500 documented (7/7 accepted cards; c04 needs-SME inferred, no card); CHARACTERIZATION deferred-waived; ORD-wave queue EMPTY - all five ORD slices carded; next: ME drafts the new ORD Architecture pack (ROOM_OK then)
  - Pack B run 13 (2026-09-09): par-maintain 13/13 accepted behaviours documented (cards discovery/par-maintain/features/); c08 inferred carded (bind accepted it); surfaces pgm:PAR200 / cl:PAR201 / srvpgm:FPARAMETER / mod:PAR300 candidate -> accepted. Night residual-wave queue left: log-programs, menu-cmd-shell, srvpgm-supporting, sql-objects, ord-batch-ord900, cou-maintain COU200 half, pro-interactive, pro-modules, pro-cobol-pro201. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 14 (2026-09-09): log-programs 10/10 accepted behaviours documented (cards discovery/log-programs/features/); c04, c06, c09, c10 inferred carded (bind accepted them); surfaces pgm:LOG100 / srvpgm:LOG / mod:LOG300 candidate -> accepted. Night residual-wave queue left: menu-cmd-shell, srvpgm-supporting, sql-objects, ord-batch-ord900, cou-maintain COU200 half, pro-interactive, pro-modules, pro-cobol-pro201. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 15 (2026-09-09): menu-cmd-shell 9/9 accepted behaviours documented (cards discovery/menu-cmd-shell/features/); c02 inferred carded (bind accepted it); surfaces menu:SAMMNU / pnlgrp:SAMHELP / msgf:SAMMSGF / cmd:CVTSPLPDF candidate -> accepted. Phase A corrected: ERR0001 is live (ART200D.DSPF:98) - dead messages are ERR0003/0004/0005 (three). Night residual-wave queue left: srvpgm-supporting, sql-objects, ord-batch-ord900, cou-maintain COU200 half, pro-interactive, pro-modules, pro-cobol-pro201. CHARACTERIZATION: deferred-waived. No conversion, no tests.
  - Pack B run 16 (2026-09-09): srvpgm-supporting 9/9 accepted behaviours documented (cards discovery/srvpgm-supporting/features/); c05 inferred carded (bind accepted it); surface bnddir:SAMPLE candidate -> accepted; srvpgm:XML / XSS / ORDER / TXT stay unknown (absence recorded in c02). Phase A c07 corrected: default activation group is QILE (job-wide caches), not new-per-program - runtime-confirm. par-maintain-c10 corrected via srvpgm-supporting-c06: EXPORT(*ALL) exports 5 (not 7). CHARACTERIZATION deferred-waived. Night residual queue left: sql-objects, ord-batch-ord900, cou-maintain COU200 half, pro-interactive, pro-modules, pro-cobol-pro201.
  - Pack B run 17 (2026-09-09): sql-objects 10/10 accepted behaviours documented (cards discovery/sql-objects/features/); c04 inferred carded (bind accepted it); surfaces view:ORDERCUS / view:ARTLSTDAT / table:ARTIINF / seq:CUSSEQ / sqlprc:ART801 candidate -> accepted. c07 / c08 are object-surface cards pointing at cus-interactive-c02 / ord-trigger-ord700-c10 (CUS/ORD not widened). CHARACTERIZATION deferred-waived. No conversion, no tests. Night residual queue left: ord-batch-ord900, cou-maintain COU200 half, pro-interactive, pro-modules, pro-cobol-pro201.
  - Pack B run 18 (2026-09-09): ord-batch-ord900 9/9 accepted behaviours documented (cards discovery/ord-batch-ord900/features/; c07 inferred carded, confidence kept); pgm:ORD900 / pgm:ORD901 deferred -> accepted per night residual bind. Sharpened: ORD900 empty file writes LASTORDNO = 0; ORD901 guard works via -305 path; one offset, sign from data, double shift on rerun after partial run; 10-day auto-close rule only here, closed-without-delivery reachable; ORD901 is the only writer of DETORD.ODYEAR; CULASTORD statement verbatim ART801:35-37; ARCUSQTY/CUCREDIT left stale after closes; no SET OPTION COMMIT (build option not in tree); no scheduling/parameters; lastdate reuse trap. Recommendation unchanged: defer from conversion scope if c07 confirmed. CHARACTERIZATION: deferred-waived. No conversion, no tests. Night residual queue left: cou-maintain COU200 half; pro-interactive, pro-modules, pro-cobol-pro201 room-held.
  - Pack B run 19 (2026-09-09): cou-maintain COU200 half c01-c06, c13 7/7 accepted behaviours documented (cards discovery/cou-maintain/features/; slice now 13/13 across both halves); surface pgm:COU200 deferred -> accepted (night residual bind superseded the 2026-09-08 deferral; run-18 tool lift). Phase A sharpened: PAGEDOWN(25) keyword dead (N80 never true, *IN25 never tested); S02CHK empty - every Enter writes; COU200.RPG:7 the only UF declaration of COUNTRY in the tree, no WRITE/DELET/SQL anywhere; edit F12 goes to the next selected row with the row still locked; list F3 = F12; edited subfile row never rewritten. CHARACTERIZATION: deferred-waived. No conversion, no tests. Night residual queue left: pro-interactive, pro-modules, pro-cobol-pro201 (room-held) - runnable queue EMPTY.

## Histogram

| Metric | Count |
| --- | ---: |
| surfaces_total | 71 |
| surfaces `accepted` | 45 |
| surfaces `candidate` | 19 |
| surfaces `unknown` | 7 |
| behaviours_known | 268 |
| behaviours `candidate` | 88 |
| behaviours `documented` | 180 |
| behaviours confidence `inferred` | 21 |
| behaviours confidence `observed-in-code` | 247 |
| scanned_seeds | 24 |
| unscanned_hints | 17 |
| legacy_green | 0 |
| parity_green | 0 |
| parity_waived | 0 |

## Per slice (counts, not progress — weakest status wins)

| slice_id | surfaces | behaviours | documented | weakest status |
| --- | ---: | ---: | ---: | --- |
| `art-interactive` | 5 | 16 | 0 | `candidate` |
| `art-modules` | 4 | 11 | 0 | `candidate` |
| `cou-maintain` | 4 | 13 | 13 | `documented` |
| `cus-interactive` | 4 | 12 | 12 | `documented` |
| `cus-modules` | 3 | 11 | 10 | `candidate` |
| `dat-utils` | 2 | 8 | 8 | `documented` |
| `fam-maintain` | 3 | 13 | 0 | `candidate` |
| `log-programs` | 3 | 10 | 10 | `documented` |
| `menu-cmd-shell` | 4 | 9 | 9 | `documented` |
| `ord-batch-ord900` | 2 | 9 | 9 | `documented` |
| `ord-entry-ord100` | 4 | 14 | 12 | `candidate` |
| `ord-entry-ord101` | 1 | 12 | 11 | `candidate` |
| `ord-maintain-ord200` | 1 | 13 | 12 | `candidate` |
| `ord-maintain-ord201` | 1 | 11 | 11 | `documented` |
| `ord-maintain-ord202` | 1 | 6 | 6 | `documented` |
| `ord-print-ord500` | 2 | 8 | 7 | `candidate` |
| `ord-trigger-ord700` | 3 | 11 | 8 | `candidate` |
| `par-maintain` | 4 | 13 | 13 | `documented` |
| `pro-cobol-pro201` | 1 | 10 | 0 | `candidate` |
| `pro-interactive` | 4 | 15 | 0 | `candidate` |
| `pro-modules` | 3 | 14 | 0 | `candidate` |
| `sql-objects` | 5 | 10 | 10 | `documented` |
| `srvpgm-supporting` | 5 | 9 | 9 | `documented` |
| `vat-module` | 2 | 10 | 10 | `documented` |

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
- `cou-maintain`
- `dat-utils`
- `fam-maintain`
- `log-programs`
- `menu-cmd-shell`
- `par-maintain`
- `pro-cobol-pro201`
- `pro-interactive`
- `pro-modules`
- `sql-objects`
- `srvpgm-supporting`
- `vat-module`

## Unscanned hints (residual — not a completeness claim)

- blind-spot: XML, ORDER, TXT, XSS *SRVPGM in SAMPLE.BNDDIR have no source under ATU_SRC (PRO200.ILEPGM binds XML; PRO202 /copy qprotosrc,xml missing)
- blind-spot: QM query objects CUSQRY, ARTQRY, form CUSQRYFMT (menu opts 12/13) not in tree
- blind-spot: CVTSPLPDF processing program and ADSPUSRSPC command not in tree
- blind-spot: CMD->PGM bindings (CRTORD) and trigger attachment are compiled-object/ARCAD metadata, not source
- unknown-surface: CUSTADRE.PF / ADDRESS.PF (multi-address model) referenced by no program in ATU_SRC
- unknown-surface: ARTIPROV link creation - no program found that writes new ARTIPROV rows
- folded: srvpgm-fcustomer -> cus-modules (room bind 2026-09-08; export facts in cus-modules-c01/c05)
- folded: srvpgm-farticle -> art-modules (recommendation; surface srvpgm:FARTICLE + art-modules-c06/c10 carry the export facts and the ART302 gap)
- folded: srvpgm-fprovider -> pro-modules (residual run 2026-09-08; pro-modules-c11/c12)
- unknown-surface: ARTICLE.ARPURQTY (purchase order qty) has no writer in ATU_SRC; PRO202 XML export does not update it
- unknown-surface: PROVIDE2.LF keyed on PROVA1 (not a PROVIDER field) and referenced by no program - stale / uncompilable
- unknown-surface: no create or delete path for PROVIDER, COUNTRY, FAMILLY, VATDEF rows; PRDEL / FADEL / VATDEL have no writer
- blind-spot: PRO203, ORD500, ORD700, LOG100 compile dftactgrp(*no) with no bnddir and no .ILEPGM - import resolution is ARCAD/elias build metadata
- blind-spot: qprotosrc XML / XSS copybooks missing - PRO202 and PRO203 cannot be compiled from the tree
- blind-spot: ORDER and TXT *SRVPGM in SAMPLE.BNDDIR referenced by nothing - possibly dead entries
- runtime-only: SAMLOG user space is 5000 bytes without auto-extend - overflow behaviour and ADSPUSRSPC reader unknown
- unknown-surface: ARTLSTDAT view and ISO_Num_To_Date UDF have no consumer in ATU_SRC (QM query ARTQRY probable)

## Lint

APP_MANIFEST passed structural lint (schema_version 1, ids unique, enums, anti-greenwash flags).
