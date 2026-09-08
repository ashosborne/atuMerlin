# atu-merlin estate INDEX (readability mirror)

> Status mirror for Ash. **Factory SoT for radar = `inventory/atu-merlin/APP_MANIFEST.yaml`**; slice truth = `discovery/<SLICE_ID>/MANIFEST.yaml`.
> This file never grants accepts and is not permission to run Phase B. Refreshed by Pack A on 2026-09-08 (run `discovery-phase-a`).

Legend: `candidate` = Pack A proposed, unbound · `unscanned` = in queue, not yet Phase A'd · counts are candidate behaviours (not progress).

## Scanned this run (Phase A candidates — bind pending)

| # | slice_id | domain | status | members (entry) | cand. | deps (not members) | notes |
| ---: | --- | --- | --- | --- | ---: | --- | --- |
| 1 | `cus-interactive` | CUS | candidate | CUS200, CUS250 (+CUS200D, CUS250D) | 12 | CUSTOMER/CUSTOME1/2, CUSSEQ, FCOUNTRY, FCUSTOMER, ORD200, SAMMSGF | No delete path; CUSSEQ id allocation |
| 2 | `cus-modules` | CUS | candidate | CUS300, CUS301 (+CUS301D) | 11 | CUSTOMER/CUSTOME1, FCUSTOMER.ILESRVPGM/.BND | Recommend merging `srvpgm-fcustomer` here at bind |
| 3 | `art-interactive` | ART | candidate | ART200, ART201, ART202, ART250 (+4 DSPF) | 16 | ARTICLE/1/2, ARTIPROV/1/2, ARTIINF, FARTICLE, FFAMILLY, FPROVIDER, FVAT | ART202 called from PRO side |
| 4 | `art-modules` | ART | candidate | ART300, ART301, ART302 (+ART301D) | 11 | ARTICLE/1, ARTIINF, FARTICLE.ILESRVPGM/.BND, FFAMILLY | **ART302 not bound in FARTICLE source** |
| 5 | `ord-entry-ord100` | ORD | candidate | ORD100, ORD100C, ORD100C2, CRTORD (+ORD100D) | 14 | ORDER, DETORD (QTEMP staging), LASTORDNO, FCUSTOMER, FARTICLE, FVAT, ORD500 | Core create transaction |
| 6 | `ord-entry-ord101` | ORD | candidate | ORD101 (+ORD101D) | 12 | ORDER1, DETORD1, FCUSTOMER, FARTICLE, FVAT, SAMMSGF | Line maintenance (not "entry") |
| 7 | `ord-maintain-ord200` | ORD | candidate | ORD200 (+ORD200D) | 13 | ORDERCUS view, ISOTODATE40, ORDER1, DETORD1, CUSTOME1 | **Option 2 unreachable (precedence bug)** |
| 8 | `ord-maintain-ord201` | ORD | candidate | ORD201 (+ORD201D) | 11 | ORDERCUS view, ISOTODATE40, ORDER1, DETORD1 | Menu opt 3; twin of ORD200 |
| 9 | `ord-maintain-ord202` | ORD | candidate | ORD202 (+ORD202D) | 6 | ORDER1, DETORD1, CUSTOME1, ARTICLE1 | Read-only display |
| 10 | `ord-print-ord500` | ORD | candidate | ORD500, ORD500C (+ORD500O.PRTF) | 8 | ORDER1, DETORD1, CUSTOME1, ARTICLE1, FPARAMETER, CVTSPLPDF | PDF impl not in tree |
| 11 | `ord-trigger-ord700` | ORD | candidate | ORD700, ORD700A/D/U.SYSTRG, ORD701.SQLTRG | 11 | DETORD, ARTICLE1, ORDER, CUSTOMER, LOG srvpgm | Hidden side effects of every order write |
| 12 | `ord-batch-ord900` | ORD | candidate | ORD900, ORD901 | 9 | ORDER/ORDER1, DETORD, CUSTOMER, LASTORDNO | Likely demo-refresh tools (inferred) |

## Not yet scanned (queue order — residual, not a completeness claim)

| # | slice_id | domain | status | hint |
| ---: | --- | --- | --- | --- |
| 13 | `pro-interactive` | PRO | unscanned | PRO200/202/203/250 + DSPFs; PRO200.ILEPGM binds `XML` srvpgm (no source) |
| 14 | `pro-modules` | PRO | unscanned | PRO300/301 (FPROVIDER body) |
| 15 | `pro-cobol-pro201` | PRO | unscanned | only COBOL member |
| 16 | `fam-maintain` | FAM | unscanned | FAM300/301 (FFAMILLY) |
| 17 | `cou-maintain` | COU | unscanned | COU200.RPG (OPM) + COU300/301 (FCOUNTRY) |
| 18 | `par-maintain` | PAR | unscanned | PAR200/201/300 (FPARAMETER; `PATH` used by ORD500) |
| 19 | `vat-module` | VAT | unscanned | VAT300 (FVAT) |
| 20 | `log-programs` | LOG | unscanned | LOG100/300 (SAMLOG user space) |
| 21 | `dat-utils` | DAT | unscanned | DAT001/002 (behind ISOTODATE UDFs) |
| 22 | `srvpgm-fcustomer` | SRVPGM | unscanned | recommend merge into #2 |
| 23 | `srvpgm-farticle` | SRVPGM | unscanned | recommend merge into #4 |
| 24 | `srvpgm-fprovider` | SRVPGM | unscanned | versioned signatures |
| 25 | `srvpgm-supporting` | SRVPGM | unscanned | includes SAMPLE.BNDDIR with 4 missing srvpgms |
| 26 | `menu-cmd-shell` | SHELL | unscanned | menu references QM queries / ADSPUSRSPC not in tree |
| 27 | `sql-objects` | SQL | unscanned | ART801 reconciliation, views, UDFs, sequence |

## Blind spots (see `overnight/METHOD_COVERAGE.md`)

XML/ORDER/TXT/XSS service programs; QM queries; CVTSPLPDF and ADSPUSRSPC implementations; CMD→PGM bindings; trigger attachment; runtime-only behaviour (no IBM i available).
