# atu-merlin estate INDEX (readability mirror)

> Status mirror for Ash. **Factory SoT for radar = `inventory/atu-merlin/APP_MANIFEST.yaml`**; slice truth = `discovery/<SLICE_ID>/MANIFEST.yaml`.
> This file never grants accepts and is not permission to run Phase B. Refreshed by Pack A on 2026-09-08 (run `discovery-phase-a`); status column mirrored by Pack B run 1 (2026-09-08, `document-slices: cus-interactive`) run 2 (2026-09-08, `document-slices: cus-modules`), run 3 (2026-09-08, `document-slices: ord-entry-ord100`) and run 4 (2026-09-08, `document-slices: ord-trigger-ord700` — last slice in the 2026-09-08 bind; conveyor idle until more slices are bound).

Legend: `candidate` = Pack A proposed, unbound · `accepted` = room bind 2026-09-08, cards not yet written · `done` = Phase B cards written for every accepted behaviour (SME sign-off still pending) · `deferred` = bind deferred · `unscanned` = in queue, not yet Phase A'd · counts are behaviours (not progress).

## Scanned (Phase A candidates; bind + Pack B status mirrored)

| # | slice_id | domain | status | members (entry) | cand. | deps (not members) | notes |
| ---: | --- | --- | --- | --- | ---: | --- | --- |
| 1 | `cus-interactive` | CUS | **done** (12/12 cards; 3 needs-SME questions) | CUS200, CUS250 (+CUS200D, CUS250D) | 12 | CUSTOMER/CUSTOME1/2, CUSSEQ, FCOUNTRY, FCUSTOMER, ORD200, SAMMSGF | Cards `discovery/cus-interactive/features/`; CUMODID not refreshed on update; UPD duplicate gap; no delete path; CHARACTERIZATION deferred-waived |
| 2 | `cus-modules` | CUS | **done** (10/10 cards; `c10` needs-SME, no card) | CUS300, CUS301 (+CUS301D) | 11 | CUSTOMER/CUSTOME1, FCUSTOMER.ILESRVPGM/.BND, SAMPLE.BNDDIR | Cards `discovery/cus-modules/features/`; `srvpgm-fcustomer` folded in (export facts in c01/c05); ExistCus/IsCusDeleted have no callers in ATU_SRC; last-key cache stale after external updates; SltCustomer criteria persist across calls, SQL errors silent; CHARACTERIZATION deferred-waived |
| 3 | `art-interactive` | ART | candidate (skipped at bind until ART302 answered) | ART200, ART201, ART202, ART250 (+4 DSPF) | 16 | ARTICLE/1/2, ARTIPROV/1/2, ARTIINF, FARTICLE, FFAMILLY, FPROVIDER, FVAT | ART202 called from PRO side |
| 4 | `art-modules` | ART | candidate (skipped at bind until ART302 answered) | ART300, ART301, ART302 (+ART301D) | 11 | ARTICLE/1, ARTIINF, FARTICLE.ILESRVPGM/.BND, FFAMILLY | **ART302 not bound in FARTICLE source** |
| 5 | `ord-entry-ord100` | ORD | **done** (12/12 cards; `c09`, `c11` needs-SME, no card) | ORD100, ORD100C, ORD100C2, CRTORD (+ORD100D) | 14 | ORDER, DETORD (QTEMP staging), LASTORDNO, FCUSTOMER, FARTICLE, FVAT, ORD500 | Cards `discovery/ord-entry-ord100/features/`; core create transaction; starts in add-line panel; F3/F12 on F6 add screen ends program, cancelled F6 prompt re-prompts; footer TOTVAT drifts after delete, totals stale after edit; DETORD.ODYEAR written 0 (ORD901 backfills); no commitment control; no credit/stock/existence checks; CHARACTERIZATION deferred-waived |
| 6 | `ord-entry-ord101` | ORD | candidate | ORD101 (+ORD101D) | 12 | ORDER1, DETORD1, FCUSTOMER, FARTICLE, FVAT, SAMMSGF | Line maintenance (not "entry") |
| 7 | `ord-maintain-ord200` | ORD | candidate | ORD200 (+ORD200D) | 13 | ORDERCUS view, ISOTODATE40, ORDER1, DETORD1, CUSTOME1 | **Option 2 unreachable (precedence bug)** |
| 8 | `ord-maintain-ord201` | ORD | candidate | ORD201 (+ORD201D) | 11 | ORDERCUS view, ISOTODATE40, ORDER1, DETORD1 | Menu opt 3; twin of ORD200 |
| 9 | `ord-maintain-ord202` | ORD | candidate | ORD202 (+ORD202D) | 6 | ORDER1, DETORD1, CUSTOME1, ARTICLE1 | Read-only display |
| 10 | `ord-print-ord500` | ORD | candidate | ORD500, ORD500C (+ORD500O.PRTF) | 8 | ORDER1, DETORD1, CUSTOME1, ARTICLE1, FPARAMETER, CVTSPLPDF | PDF impl not in tree |
| 11 | `ord-trigger-ord700` | ORD | **done** (8/8 cards; `c01`, `c08`, `c11` needs-SME, no card) | ORD700, ORD700A/D/U.SYSTRG, ORD701.SQLTRG | 11 | DETORD/DETORD1, ARTICLE1, ORDER, CUSTOMER, LOG srvpgm + SAMLOG (not in tree), ART801 (related, sql-objects) | Cards `discovery/ord-trigger-ord700/features/`; hidden side effects of every order write; insert adds full ODQTY, delete/update use ODQTY−ODQTYLIV; only delete logs (SAMLOG, failure swallowed); order close never reaches ORD700; no in-tree writer changes ODARID; UpdArt silent on unknown article, no error handling, can go negative; ORD701 assigns (not MAX) CULASTORD; ART801 "Reset" leaves rows without open orders untouched, only writer of CUCREDIT; AddLogEntry binding not in source; CHARACTERIZATION deferred-waived |
| 12 | `ord-batch-ord900` | ORD | deferred (bind) | ORD900, ORD901 | 9 | ORDER/ORDER1, DETORD, CUSTOMER, LASTORDNO | Likely demo-refresh tools (inferred) |

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
| 22 | `srvpgm-fcustomer` | SRVPGM | folded into #2 (bind 2026-09-08); export facts documented in #2 cards c01/c05 | no separate Phase A |
| 23 | `srvpgm-farticle` | SRVPGM | unscanned | recommend merge into #4 |
| 24 | `srvpgm-fprovider` | SRVPGM | unscanned | versioned signatures |
| 25 | `srvpgm-supporting` | SRVPGM | unscanned | includes SAMPLE.BNDDIR with 4 missing srvpgms |
| 26 | `menu-cmd-shell` | SHELL | unscanned | menu references QM queries / ADSPUSRSPC not in tree |
| 27 | `sql-objects` | SQL | unscanned | ART801 reconciliation, views, UDFs, sequence |

## Blind spots (see `overnight/METHOD_COVERAGE.md`)

XML/ORDER/TXT/XSS service programs; QM queries; CVTSPLPDF and ADSPUSRSPC implementations; CMD→PGM bindings; trigger attachment; runtime-only behaviour (no IBM i available).
