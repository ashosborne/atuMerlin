#!/usr/bin/env python3
"""Additively upsert discovery/<slice>/MANIFEST.yaml Phase A output into inventory/<APP_ID>/APP_MANIFEST.yaml.

Rules (estate-discovery-loop v0.1 / app-manifest schema v1):
- New surfaces/behaviours enter as `candidate` (or `unknown`). Never `accepted`/`documented`.
- Existing rows whose status a human changed (accepted, deferred, rejected, documented, ...) are left untouched.
- `scanned_seeds` grows; `unscanned_hints` shrinks only for seeds actually scanned.
- Never sets status/completeness to anything implying done. No percentages.

Usage: python3 overnight/tools/upsert_app_manifest.py [--app-id atu-merlin] [--updated-by estate-discovery-loop]
"""
import argparse
import datetime as dt
import glob
from pathlib import Path

import yaml

HUMAN_SET = {"accepted", "deferred", "rejected", "documented", "converted", "verified"}

# Callable surfaces per slice. DSPF/PRTF are recorded as evidence on the program surface,
# not as surfaces themselves (a display file is not a callable seam).
SURFACES = {
    "cus-interactive": [
        ("pgm:CUS200", "ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE", "*PGM SQLRPGLE - Work with Customers (menu opt 2); screen CUS200D", ["ATU_SRC/QDDSSRC/CUS200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:88-91"]),
        ("pgm:CUS250", "ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE", "*PGM RPGLE - Customer by id (menu opt 8); screen CUS250D", ["ATU_SRC/QDDSSRC/CUS250D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:112-115"]),
    ],
    "cus-modules": [
        ("srvpgm:FCUSTOMER", "ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM", "*SRVPGM MODULE(CUS300 CUS301); exports per FCUSTOMER.BND", ["ATU_SRC/QSRVSRC/FCUSTOMER.BND"]),
        ("mod:CUS300", "ATU_SRC/QRPGLESRC/CUS300.RPGLE", "*MODULE nomain - GetCus* getters, ExistCus, IsCusDeleted", []),
        ("mod:CUS301", "ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE", "*MODULE nomain - SltCustomer selection window; screen CUS301D", ["ATU_SRC/QDDSSRC/CUS301D.DSPF"]),
    ],
    "art-interactive": [
        ("pgm:ART200", "ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE", "*PGM SQLRPGLE - Work with Articles (menu opt 1); screen ART200D", ["ATU_SRC/QDDSSRC/ART200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:84-87"]),
        ("pgm:ART201", "ATU_SRC/QRPGLESRC/ART201.PGM.RPGLE", "*PGM RPGLE - Providers of an article (called by ART200/ART250); screen ART201D", ["ATU_SRC/QDDSSRC/ART201D.DSPF"]),
        ("pgm:ART202", "ATU_SRC/QRPGLESRC/ART202.PGM.RPGLE", "*PGM RPGLE - Articles of a provider (called by PRO200/PRO250); screen ART202D", ["ATU_SRC/QDDSSRC/ART202D.DSPF"]),
        ("pgm:ART250", "ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE", "*PGM SQLRPGLE - Article by id (menu opt 7); screen ART250D", ["ATU_SRC/QDDSSRC/ART250D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:108-111"]),
    ],
    "art-modules": [
        ("srvpgm:FARTICLE", "ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM", "*SRVPGM MODULE(ART300 ART301) BNDSRVPGM(FFAMILLY); ART302 NOT listed", ["ATU_SRC/QSRVSRC/FARTICLE.BND"]),
        ("mod:ART300", "ATU_SRC/QRPGLESRC/ART300.RPGLE", "*MODULE nomain - GetArt* getters, ExistArt, IsArtDeleted", []),
        ("mod:ART301", "ATU_SRC/QRPGLESRC/ART301.SQLRPGLE", "*MODULE nomain - SltArticle selection window; screen ART301D", ["ATU_SRC/QDDSSRC/ART301D.DSPF"]),
        ("mod:ART302", "ATU_SRC/QRPGLESRC/ART302.SQLRPGLE", "*MODULE nomain - GetArtInfo (ARTIINF); binding into FARTICLE not in source", []),
    ],
    "ord-entry-ord100": [
        ("pgm:ORD100", "ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE", "*PGM RPGLE - Create customer order; screen ORD100D; needs TMPDETORD override", ["ATU_SRC/QDDSSRC/ORD100D.DSPF"]),
        ("cl:ORD100C", "ATU_SRC/QCLSRC/ORD100C.PGM.CLLE", "*PGM CLLE - stage QTEMP/DETORD then CRTORD CUID(&CUID)", []),
        ("cl:ORD100C2", "ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE", "*PGM CLLE - stage QTEMP/DETORD then CALL ORD100 (menu opt 6)", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:104-107"]),
        ("cmd:CRTORD", "ATU_SRC/QCMDSRC/CRTORD.CMD", "*CMD Create an Order (CUID); PGM binding not in source (inferred ORD100)", []),
    ],
    "ord-entry-ord101": [
        ("pgm:ORD101", "ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE", "*PGM RPGLE - Maintain lines of an existing order (called by ORD200/ORD201 opt 2); screen ORD101D", ["ATU_SRC/QDDSSRC/ORD101D.DSPF"]),
    ],
    "ord-maintain-ord200": [
        ("pgm:ORD200", "ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE", "*PGM SQLRPGLE - Orders of one customer (called by CUS200 opt 5); screen ORD200D", ["ATU_SRC/QDDSSRC/ORD200D.DSPF"]),
    ],
    "ord-maintain-ord201": [
        ("pgm:ORD201", "ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE", "*PGM SQLRPGLE - Work with Customer Orders (menu opt 3); screen ORD201D", ["ATU_SRC/QDDSSRC/ORD201D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:92-95"]),
    ],
    "ord-maintain-ord202": [
        ("pgm:ORD202", "ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE", "*PGM RPGLE - Display order (read-only; called by ORD200/ORD201 opt 5); screen ORD202D", ["ATU_SRC/QDDSSRC/ORD202D.DSPF"]),
    ],
    "ord-print-ord500": [
        ("pgm:ORD500", "ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE", "*PGM RPGLE - Print order to spool ORD500O then call ORD500C", ["ATU_SRC/QDDSSRC/ORD500O.PRTF"]),
        ("cl:ORD500C", "ATU_SRC/QCLSRC/ORD500C.PGM.CLLE", "*PGM CLLE - CVTSPLPDF spool to IFS PDF (command impl not in tree)", ["ATU_SRC/QCMDSRC/CVTSPLPDF.CMD"]),
    ],
    "ord-trigger-ord700": [
        ("trgpgm:ORD700", "ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE", "*PGM RPGLE - external trigger program on DETORD maintaining ARTICLE.ARCUSQTY", []),
        ("trg:DETORD.ORD700_DETORD_ARTICLE_*", "ATU_SRC/QTRGSRC/ORD700A.SYSTRG", "ADDPFTRG x3 (*AFTER insert/delete/update) on DETORD -> ORD700; attachment on box inferred", ["ATU_SRC/QTRGSRC/ORD700D.SYSTRG", "ATU_SRC/QTRGSRC/ORD700U.SYSTRG"]),
        ("trg:ORDER.ORD701_Insert_order", "ATU_SRC/QSQLSRC/ORD701.SQLTRG", "SQL AFTER INSERT trigger on ORDER -> CUSTOMER.CULASTORD", []),
    ],
    "ord-batch-ord900": [
        ("pgm:ORD900", "ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE", "*PGM RPGLE - Reset LASTORDNO to max ORID (menu opt 80)", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:143-146"]),
        ("pgm:ORD901", "ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE", "*PGM SQLRPGLE - Shift order dates to today; resync years and CULASTORD (menu opt 81)", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:147-150"]),
    ],
    # --- residual run (seeds 13+), 2026-09-08 ---
    "pro-interactive": [
        ("pgm:PRO200", "ATU_SRC/QRPGLESRC/PRO200.RPGLE", "*PGM (CRTPGM MODULE(PRO200 PRO202) ACTGRP(QILE)) - Work with Providers (menu opt 4); screen PRO200D; edit never saves (mode never set)", ["ATU_SRC/QILESRC/PRO200.ILEPGM", "ATU_SRC/QDDSSRC/PRO200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:95-98"]),
        ("mod:PRO202", "ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE", "*MODULE bound into PRO200 (extproc) - purchase proposal -> XML file at PATH; screen PRO202D; XML srvpgm/copybook not in tree", ["ATU_SRC/QDDSSRC/PRO202D.DSPF"]),
        ("pgm:PRO250", "ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE", "*PGM RPGLE - Provider by id (menu opt 9); screen PRO250D; F4 SltProvider, F7 -> ART202", ["ATU_SRC/QDDSSRC/PRO250D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:115-118"]),
        ("pgm:PRO203", "ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE", "*PGM SQLRPGLE - Goods-to-purchase spreadsheet via XSS srvpgm (menu opt 10); binding and XSS not in source", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:121-124"]),
    ],
    "pro-modules": [
        ("srvpgm:FPROVIDER", "ATU_SRC/QILESRVSRC/FPROVIDER.ILESRVPGM", "*SRVPGM MODULE(PRO300 PRO301); 14 exports; SIGNATURE(*GEN) with *PRV block (folds srvpgm-fprovider)", ["ATU_SRC/QSRVSRC/FPROVIDER.BND"]),
        ("mod:PRO300", "ATU_SRC/QRPGLESRC/PRO300.RPGLE", "*MODULE nomain - GetPro* getters x11, ExistProvider, IsProDeleted", []),
        ("mod:PRO301", "ATU_SRC/QRPGLESRC/PRO301.SQLRPGLE", "*MODULE nomain - SltProvider selection window; screen PRO301D", ["ATU_SRC/QDDSSRC/PRO301D.DSPF"]),
    ],
    "pro-cobol-pro201": [
        ("pgm:PRO201", "ATU_SRC/QCBLSRC/PRO201.CBL", "*PGM COBOL (only COBOL member) - Display Providers read-only list (menu opt 5); screen PRO201D; option 5 -> ART202", ["ATU_SRC/QDDSSRC/PRO201D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:99-102"]),
    ],
    "fam-maintain": [
        ("srvpgm:FFAMILLY", "ATU_SRC/QILESRVSRC/FFAMILLY.ILESRVPGM", "*SRVPGM MODULE(FAM300 FAM301); 4 exports; no family maintenance program exists (slice id is a charter misnomer)", ["ATU_SRC/QSRVSRC/FFAMILLY.BND"]),
        ("mod:FAM300", "ATU_SRC/QRPGLESRC/FAM300.RPGLE", "*MODULE nomain - GetArtFamDesc, ExistArtFam (ignores FADEL), IsArtFamDeleted", []),
        ("mod:FAM301", "ATU_SRC/QRPGLESRC/FAM301.RPGLE", "*MODULE nomain - SltArtFam keyed-read selection window (by code / by description); screen FAM301D", ["ATU_SRC/QDDSSRC/FAM301D.DSPF"]),
    ],
    "cou-maintain": [
        ("pgm:COU200", "ATU_SRC/QRPGSRC/COU200.RPG", "*PGM RPG III OPM (only OPM member) - Work with Countries, edit name/ISO only (menu opt 21); screen COU200D", ["ATU_SRC/QDDSSRC/COU200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:139-142"]),
        ("srvpgm:FCOUNTRY", "ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM", "*SRVPGM MODULE(COU300 COU301); 4 exports; used by CUS200/CUS250/PRO200/PRO250", ["ATU_SRC/QSRVSRC/FCOUNTRY.BND"]),
        ("mod:COU300", "ATU_SRC/QRPGLESRC/COU300.RPGLE", "*MODULE nomain - GetCountryName, GetCountryIso3 (unused), ExistCountry", []),
        ("mod:COU301", "ATU_SRC/QRPGLESRC/COU301.RPGLE", "*MODULE nomain - SltCountry keyed-read selection window; screen COU301D", ["ATU_SRC/QDDSSRC/COU301D.DSPF"]),
    ],
    "par-maintain": [
        ("pgm:PAR200", "ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE", "*PGM RPGLE - Work with Parameters list/create/edit/delete (menu opt 20); screen PAR200D", ["ATU_SRC/QDDSSRC/PAR200D.DSPF", "ATU_SRC/QPNLSRC/SAMMNU.MENU:135-138"]),
        ("cl:PAR201", "ATU_SRC/QCLSRC/PAR201.CLLE", "*PGM CLLE (CRTPGM BNDSRVPGM(FPARAMETER) ACTGRP(QILE)) - GetParm2 PATH -> WRKLNK (menu opt 83)", ["ATU_SRC/QILESRC/PAR201.ILEPGM", "ATU_SRC/QPNLSRC/SAMMNU.MENU:155-158"]),
        ("srvpgm:FPARAMETER", "ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM", "*SRVPGM MODULE(PAR300) EXPORT(*ALL) - no binder source; only PATH is a live parameter", []),
        ("mod:PAR300", "ATU_SRC/QRPGLESRC/PAR300.RPGLE", "*MODULE nomain - GetPARM1..GetPARM5 by (PACODE, PASUBCODE)", []),
    ],
    "vat-module": [
        ("srvpgm:FVAT", "ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM", "*SRVPGM MODULE(VAT300); 4 exports; no VAT maintenance program exists", ["ATU_SRC/QSRVSRC/FVAT.BND"]),
        ("mod:VAT300", "ATU_SRC/QRPGLESRC/VAT300.RPGLE", "*MODULE nomain - GetVATRate, GetVATDesc, ClcVAT (half-adjust 2dp; unknown code -> 0), ExistVATRate", []),
    ],
    "log-programs": [
        ("srvpgm:LOG", "ATU_SRC/QILESRVSRC/LOG.ILESRVPGM", "*SRVPGM MODULE(LOG300) EXPORT(*ALL) - AddLogEntry to SAMLOG user space; not in SAMPLE.BNDDIR", []),
        ("mod:LOG300", "ATU_SRC/QRPGLESRC/LOG300.RPGLE", "*MODULE nomain - AddLogEntry appends User/Date/Msg at pos; no capacity check", []),
        ("pgm:LOG100", "ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE", "*PGM RPGLE - create SAMLOG user space (5000 bytes) in PARAMETER's library; no caller, no menu entry (install step)", []),
    ],
    "dat-utils": [
        ("udf:ISOTODATE40", "ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF", "SQL UDF ISOTODATE40 -> DAT002: 0 -> 1940-01-01, 99999999 -> 2039-12-31, invalid -> NULL; used by ORD200/ORD201", ["ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE"]),
        ("udf:ISO_Num_To_Date", "ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF", "SQL UDF ISO_Num_To_Date (SPECIFIC ISOTODATE) -> DAT001: plain conversion, 0 -> NULL; no caller in ATU_SRC", ["ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE"]),
    ],
    "sql-objects": [
        ("view:ORDERCUS", "ATU_SRC/QSQLSRC/ORDERCUS.VIEW", "SQL VIEW - ORDER inner-joined to CUSTOMER with TOTVAL (sum ODTOTVAT); read by ORD200/ORD201", []),
        ("view:ARTLSTDAT", "ATU_SRC/QSQLSRC/ARTLSTDAT.VIEW", "SQL VIEW - per-article MAX(ORDATE) / SUM(ODQTY); no consumer in ATU_SRC (QM query ARTQRY probable)", []),
        ("table:ARTIINF", "ATU_SRC/QSQLSRC/ARTIINF.TABLE", "SQL TABLE article_full_description - ARID PK + VARCHAR(1520); written by ART200, read by ART302", []),
        ("seq:CUSSEQ", "ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ", "SQL SEQUENCE START WITH 1551 - customer ids (CUS200 F6; documented cus-interactive-c02)", []),
        ("sqlprc:ART801", "ATU_SRC/QSQLSRC/ART801.SQLPRC", "SQL PROCEDURE UPDATE_ON_CUS_ORD_QTY (menu opt 82) - behaviour documented as ord-trigger-ord700-c10", ["ATU_SRC/QPNLSRC/SAMMNU.MENU:151-154"]),
    ],
    "menu-cmd-shell": [
        ("menu:SAMMNU", "ATU_SRC/QPNLSRC/SAMMNU.MENU", "UIM MENU - application entry map (20 options); opts 12/13/84 reach QM queries / ADSPUSRSPC not in tree", []),
        ("pnlgrp:SAMHELP", "ATU_SRC/QPNLSRC/SAMHELP.PNLGRP", "PNLGRP - help stubs only; menu help= references mostly undefined", []),
        ("msgf:SAMMSGF", "ATU_SRC/QMSGFSRC/SAMMSGF.MSGF", "MSGF - 12 messages (8 referenced by screens, ERR0001/0003/0004/0005 unused)", []),
        ("cmd:CVTSPLPDF", "ATU_SRC/QCMDSRC/CVTSPLPDF.CMD", "*CMD Convert Spool to PDF - parameter definition only; processing program not in tree (used by ORD500C)", []),
    ],
    "srvpgm-supporting": [
        ("bnddir:SAMPLE", "ATU_SRC/QBNDSRC/SAMPLE.BNDDIR", "*BNDDIR - 11 srvpgms (XML ORDER TXT XSS without source; LOG absent); bound by 12 programs via bnddir('SAMPLE')", ["ATU_SRC/QILESRC/PRO200.ILEPGM", "ATU_SRC/QILESRC/PAR201.ILEPGM"]),
    ],
}

# Seeds intentionally not scanned as separate slices: their content lives in another slice.
FOLDED_SEEDS = {
    "srvpgm-fcustomer": "folded: srvpgm-fcustomer -> cus-modules (room bind 2026-09-08; export facts in cus-modules-c01/c05)",
    "srvpgm-farticle": "folded: srvpgm-farticle -> art-modules (recommendation; surface srvpgm:FARTICLE + art-modules-c06/c10 carry the export facts and the ART302 gap)",
    "srvpgm-fprovider": "folded: srvpgm-fprovider -> pro-modules (residual run 2026-09-08; pro-modules-c11/c12)",
}

# Seeds from CHARTER.yaml INITIAL_SEEDS in queue order; those not scanned stay as unscanned_hints.
ALL_SEEDS = [
    "cus-interactive", "cus-modules", "art-interactive", "art-modules",
    "ord-entry-ord100", "ord-entry-ord101", "ord-maintain-ord200", "ord-maintain-ord201",
    "ord-maintain-ord202", "ord-print-ord500", "ord-trigger-ord700", "ord-batch-ord900",
    "pro-interactive", "pro-modules", "pro-cobol-pro201",
    "fam-maintain", "cou-maintain", "par-maintain", "vat-module", "log-programs", "dat-utils",
    "srvpgm-fcustomer", "srvpgm-farticle", "srvpgm-fprovider", "srvpgm-supporting",
    "menu-cmd-shell", "sql-objects",
]

SEED_HINT_TEXT = {
    "pro-interactive": "seed pro-interactive: PRO200/PRO202/PRO203/PRO250 + PRO200D/201D/202D/250D (PRO200.ILEPGM binds XML srvpgm - source missing)",
    "pro-modules": "seed pro-modules: PRO300/PRO301 + PRO301D (FPROVIDER body)",
    "pro-cobol-pro201": "seed pro-cobol-pro201: QCBLSRC/PRO201.CBL (only COBOL member; menu opt 5)",
    "fam-maintain": "seed fam-maintain: FAM300/FAM301 + FAM301D (FFAMILLY body; SltArtFam used by ART200/ART301)",
    "cou-maintain": "seed cou-maintain: COU200.RPG (OPM RPG, menu opt 21) + COU300/COU301 (FCOUNTRY body; used by CUS200/CUS250)",
    "par-maintain": "seed par-maintain: PAR200 (menu opt 20) + PAR201 CL/ILEPGM (menu opt 83, WRKLNK on PATH) + PAR300 (FPARAMETER getParm*; PATH used by ORD500)",
    "vat-module": "seed vat-module: VAT300 (FVAT: CLCVat/GetVatRate used by ORD100/ORD101/ART250)",
    "log-programs": "seed log-programs: LOG100 (create SAMLOG user space) + LOG300 (AddLogEntry; used by ORD700 delete)",
    "dat-utils": "seed dat-utils: DAT001/DAT002 (external programs behind SQL UDFs ISOTODATE/ISOTODATE40 used by ORD200/ORD201)",
    "srvpgm-fcustomer": "seed srvpgm-fcustomer: FCUSTOMER binding/export view - recommend merging into cus-modules at bind",
    "srvpgm-farticle": "seed srvpgm-farticle: FARTICLE binding/export view - recommend merging into art-modules at bind (ART302 gap)",
    "srvpgm-fprovider": "seed srvpgm-fprovider: FPROVIDER.ILESRVPGM + FPROVIDER.BND (versioned signatures *GEN/*PRV)",
    "srvpgm-supporting": "seed srvpgm-supporting: FFAMILLY/FCOUNTRY/FPARAMETER/FVAT/LOG srvpgms + SAMPLE.BNDDIR (lists XML/ORDER/TXT/XSS srvpgms with no source)",
    "menu-cmd-shell": "seed menu-cmd-shell: SAMMNU.MENU (entry map), SAMHELP.PNLGRP, SAMMSGF.MSGF, CVTSPLPDF.CMD; menu references QM queries CUSQRY/ARTQRY and ADSPUSRSPC not in tree",
    "sql-objects": "seed sql-objects: ART801.SQLPRC (menu opt 82 reconciliation), ARTIINF.TABLE, ARTLSTDAT.VIEW, CUSSEQ.SQLSEQ, ISOTODATE/ISOTODATE4.SQLUDF, ORDERCUS.VIEW",
}

STRUCTURAL_HINTS = [
    "blind-spot: XML, ORDER, TXT, XSS *SRVPGM in SAMPLE.BNDDIR have no source under ATU_SRC (PRO200.ILEPGM binds XML; PRO202 /copy qprotosrc,xml missing)",
    "blind-spot: QM query objects CUSQRY, ARTQRY, form CUSQRYFMT (menu opts 12/13) not in tree",
    "blind-spot: CVTSPLPDF processing program and ADSPUSRSPC command not in tree",
    "blind-spot: CMD->PGM bindings (CRTORD) and trigger attachment are compiled-object/ARCAD metadata, not source",
    "unknown-surface: CUSTADRE.PF / ADDRESS.PF (multi-address model) referenced by no program in ATU_SRC",
    "unknown-surface: ARTIPROV link creation - no program found that writes new ARTIPROV rows",
    # residual run 2026-09-08
    "unknown-surface: ARTICLE.ARPURQTY (purchase order qty) has no writer in ATU_SRC; PRO202 XML export does not update it",
    "unknown-surface: PROVIDE2.LF keyed on PROVA1 (not a PROVIDER field) and referenced by no program - stale / uncompilable",
    "unknown-surface: no create or delete path for PROVIDER, COUNTRY, FAMILLY, VATDEF rows; PRDEL / FADEL / VATDEL have no writer",
    "blind-spot: PRO203, ORD500, ORD700, LOG100 compile dftactgrp(*no) with no bnddir and no .ILEPGM - import resolution is ARCAD/elias build metadata",
    "blind-spot: qprotosrc XML / XSS copybooks missing - PRO202 and PRO203 cannot be compiled from the tree",
    "blind-spot: ORDER and TXT *SRVPGM in SAMPLE.BNDDIR referenced by nothing - possibly dead entries",
    "runtime-only: SAMLOG user space is 5000 bytes without auto-extend - overflow behaviour and ADSPUSRSPC reader unknown",
    "unknown-surface: ARTLSTDAT view and ISO_Num_To_Date UDF have no consumer in ATU_SRC (QM query ARTQRY probable)",
]


def load_yaml(p: Path):
    return yaml.safe_load(p.read_text()) if p.exists() else None


def stub(app_id: str, now: str) -> dict:
    return {
        "schema_version": 1,
        "app_id": app_id,
        "repo": "https://github.com/ashosborne/atuMerlin",
        "status": "in_progress",
        "completeness": "incomplete",
        "scanned_seeds": [],
        "unscanned_hints": [],
        "surfaces": [],
        "behaviours": [],
        "last_updated": now,
        "updated_by": None,
        "notes": None,
    }


def _obj_name(sid: str) -> str:
    return sid.split(":", 1)[1].split(".")[0]


def pick_surface(slice_id: str, feature: dict, surfaces: list[tuple]) -> str:
    """Owner surface = the one whose object name appears earliest in the entrypoint locator
    (so "PRO202 (from PRO200 opt 7)" -> PRO202), else earliest in the evidence, else the first surface."""
    locator = " ".join(e.get("locator", "") for e in feature.get("entrypoints", []))
    evidence = " ".join(ev for e in feature.get("entrypoints", []) for ev in e.get("evidence", []))
    for text in (locator, evidence):
        best = None
        for sid, *_ in surfaces:
            obj = _obj_name(sid)
            pos = text.find(obj) if obj else -1
            # longer names win ties so ISOTODATE40 beats ISOTODATE at the same offset
            if pos >= 0 and (best is None or pos < best[0] or (pos == best[0] and len(obj) > len(_obj_name(best[1])))):
                best = (pos, sid)
        if best:
            return best[1]
    return surfaces[0][0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--app-id", default="atu-merlin")
    ap.add_argument("--updated-by", default="estate-discovery-loop")
    args = ap.parse_args()

    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    inv = Path(f"inventory/{args.app_id}")
    inv.mkdir(parents=True, exist_ok=True)
    mpath = inv / "APP_MANIFEST.yaml"
    manifest = load_yaml(mpath) or stub(args.app_id, now)

    surf_by_id = {s["surface_id"]: s for s in manifest["surfaces"]}
    beh_by_id = {b["behaviour_id"]: b for b in manifest["behaviours"]}
    added_s = added_b = updated_b = 0

    for path in sorted(glob.glob("discovery/*/MANIFEST.yaml")):
        sm = yaml.safe_load(Path(path).read_text())
        slice_id = sm["slice_id"]
        if sm.get("phase") != "A" and slice_id not in SURFACES:
            continue
        surfaces = SURFACES.get(slice_id, [])
        for sid, loc, notes, evidence in surfaces:
            if sid in surf_by_id:
                existing = surf_by_id[sid]
                for ev in [loc] + evidence:
                    existing.setdefault("discovery_evidence", [])
                    if ev not in existing["discovery_evidence"]:
                        existing["discovery_evidence"].append(ev)
                continue
            row = {
                "surface_id": sid,
                "kind": "other",
                "locator": loc,
                "repo_path": loc.split(":")[0],
                "status": "candidate",
                "slice_id": slice_id,
                "notes": notes,
                "discovery_evidence": [loc] + evidence,
            }
            manifest["surfaces"].append(row)
            surf_by_id[sid] = row
            added_s += 1

        for f in sm.get("features", []):
            bid = f["id"]
            note = f"confidence: {f.get('confidence')}; {f.get('summary', '')}".strip()
            if bid in beh_by_id:
                existing = beh_by_id[bid]
                if existing.get("status") in HUMAN_SET:
                    continue
                if existing.get("notes") != note or existing.get("name") != f.get("name"):
                    existing["notes"] = note
                    existing["name"] = f.get("name")
                    updated_b += 1
                continue
            row = {
                "behaviour_id": bid,
                "surface_id": pick_surface(slice_id, f, surfaces) if surfaces else "unknown",
                "name": f.get("name"),
                "status": "candidate" if f.get("status") == "candidate" else "unknown",
                "slice_id": slice_id,
                "discovery_card": None,
                "traceability": None,
                "pack_id": None,
                "pack_version": None,
                "conversion_prs": [],
                "parity": None,
                "legacy_green": False,
                "parity_green": False,
                "waiver": None,
                "notes": note,
            }
            manifest["behaviours"].append(row)
            beh_by_id[bid] = row
            added_b += 1

        for us in sm.get("unknown_surfaces", []) or []:
            sid = us.get("surface_id") or f"unknown:{Path(us['locator']).name}"
            if sid not in surf_by_id:
                row = {
                    "surface_id": sid,
                    "kind": "other",
                    "locator": us["locator"],
                    "repo_path": us["locator"].split(":")[0],
                    "status": "unknown",
                    "slice_id": slice_id,
                    "notes": us.get("note"),
                    "discovery_evidence": [us["locator"]],
                }
                manifest["surfaces"].append(row)
                surf_by_id[sid] = row
                added_s += 1

        if slice_id not in manifest["scanned_seeds"]:
            manifest["scanned_seeds"].append(slice_id)

    scanned = set(manifest["scanned_seeds"])
    # drop "seed X:" hints for seeds now scanned or folded; folded seeds get an explicit "folded:" line instead
    hints = [h for h in manifest["unscanned_hints"]
             if not h.startswith("seed ") or h.split(":")[0][5:] not in scanned | set(FOLDED_SEEDS)]
    for seed in ALL_SEEDS:
        if seed in scanned or seed in FOLDED_SEEDS:
            continue
        text = SEED_HINT_TEXT.get(seed, f"seed {seed}")
        if text not in hints:
            hints.append(text)
    for text in FOLDED_SEEDS.values():
        if text not in hints:
            hints.append(text)
    for h in STRUCTURAL_HINTS:
        if h not in hints:
            hints.append(h)
    manifest["unscanned_hints"] = hints

    manifest["status"] = "in_progress" if manifest.get("status") in (None, "in_progress") else manifest["status"]
    if manifest.get("completeness") not in ("bound_incomplete_ok", "complete_bound"):
        manifest["completeness"] = "incomplete"
    manifest["last_updated"] = now
    manifest["updated_by"] = args.updated_by
    radar_note = (
        "estate_scan: partial (see overnight/METHOD_COVERAGE.md). Pack A radar output: candidates only, nothing bound. "
        "Surfaces are callable IBM i objects (PGM/MODULE/SRVPGM/CL/CMD/trigger); DSPF/PRTF are evidence on the owning program. "
        "kind=other for all IBM i surfaces (schema enum is integration-flavoured). Human residual gate required."
    )
    # notes is string|null per schema; later stations (bind, Pack B) append " | "-separated entries — never clobber them
    existing = manifest.get("notes")
    if isinstance(existing, list):
        existing = " | ".join(str(n) for n in existing)
    if not existing:
        manifest["notes"] = radar_note
    elif radar_note not in existing:
        manifest["notes"] = f"{radar_note} | {existing}"
    else:
        manifest["notes"] = existing

    mpath.write_text(yaml.safe_dump(manifest, sort_keys=False, allow_unicode=True, width=200))
    print(f"surfaces +{added_s} (total {len(manifest['surfaces'])}); behaviours +{added_b} ~{updated_b} (total {len(manifest['behaviours'])}); "
          f"scanned_seeds {len(manifest['scanned_seeds'])}; unscanned_hints {len(manifest['unscanned_hints'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
