# METHOD_COVERAGE — atu-merlin Pack A (run 2026-09-08)

Status: **ESTATE_SCAN_INCOMPLETE** (`estate_scan: partial` set in APP_MANIFEST notes).

Bootstrap (iter 0) built a cheap structural index over `ATU_SRC/**` (136 members, ~11k lines). Per-family result for this pass:

| Method family (CHARTER) | Members in tree | Touched this pass (Phase A) | Skipped (in later seeds) | Could not see |
| --- | --- | --- | --- | --- |
| DSPF | 22 in `QDDSSRC/*.DSPF` | CUS200D, CUS250D, CUS301D, ART200D, ART201D, ART202D, ART250D, ART301D, ORD100D, ORD101D, ORD200D, ORD201D, ORD202D (record/key/msg skeleton) | PRO200D/201D/202D/250D/301D, FAM301D, COU200D/301D, PAR200D | — |
| CMD | `CRTORD.CMD`, `CVTSPLPDF.CMD` | CRTORD (ord-entry-ord100), CVTSPLPDF (definition only, via ord-print-ord500) | — | CMD → PGM binding (CRTCMD `PGM()`) is ARCAD metadata, not in source. CVTSPLPDF processing program not in tree. |
| CL | `ORD100C`, `ORD100C2`, `ORD500C`, `PAR201` | ORD100C, ORD100C2, ORD500C | PAR201.CLLE (par-maintain) | — |
| SQLRPGLE | 11 | CUS200, CUS301, ART200, ART250, ART301, ART302, ORD200, ORD201, ORD901 | PRO202, PRO203, PRO301 | — |
| RPGLE | 24 | CUS250, CUS300, ART201, ART202, ART300, ORD100, ORD101, ORD202, ORD500, ORD700, ORD900 | PRO200, PRO250, PRO300, FAM300/301, COU300/301, PAR200/300, VAT300, LOG100/300, DAT001/002 (VAT300/PAR300/LOG300 skimmed only as deps) | — |
| RPG (fixed, OPM) | `QRPGSRC/COU200.RPG` | — | COU200 (cou-maintain) | — |
| COBOL | `QCBLSRC/PRO201.CBL` | — | PRO201 (pro-cobol-pro201) | — |
| SRVPGM | 8 `QILESRVSRC/*.ILESRVPGM`, 6 `QSRVSRC/*.BND`, `QBNDSRC/SAMPLE.BNDDIR` | All read for structural index (module lists + export symbols). FCUSTOMER / FARTICLE modules covered via cus-modules / art-modules | srvpgm-* seeds (binding/export seams as own slices) | `XML`, `ORDER`, `TXT`, `XSS` *SRVPGM listed in `SAMPLE.BNDDIR` — **no source in tree**. `FPARAMETER.BND` / `LOG.BND` absent (EXPORT(*ALL)). |
| SQL | 8 `QSQLSRC/*` | ORDERCUS.VIEW, CUSSEQ.SQLSEQ, ARTIINF.TABLE, ART801.SQLPRC, ISOTODATE/ISOTODATE4.SQLUDF read as deps | sql-objects seed (own Phase A) | QM queries `CUSQRY`, `ARTQRY`, form `CUSQRYFMT` referenced by menu — **no source in tree** |
| SYSTRG / SQLTRG | `ORD700A/D/U.SYSTRG`, `ORD701.SQLTRG` | All (ord-trigger-ord700) | — | — |
| PRTF | `ORD500O.PRTF` | Skeleton (ord-print-ord500) | — | — |
| MENU / PNLGRP / MSGF | `SAMMNU.MENU`, `SAMHELP.PNLGRP`, `SAMMSGF.MSGF` | Read for entrypoint map + message ids | menu-cmd-shell seed | `ADSPUSRSPC` command (menu opt 84) not in tree |
| DTAARA | `LASTORDNO.DTAARA` | Yes (ord-entry-ord100 / ord-batch-ord900) | — | — |
| PF / LF (deps only) | 33 | CUSTOMER, CUSTOME1/2, CUSTADRE, ADDRESS, SAMREF, ARTICLE, ARTICLE1/2, ARTIPROV, ARTIPRO1/2, ORDER, ORDER1/2/3, DETORD, DETORD1 | PROVIDER*, FAMILLY*, COUNTRY*, PARAMETER, VATDEF | — |
| Copybooks (QPROTOSRC) | 9 | CUSTOMER, ARTICLE, APICALL, LOG read; COUNTRY/FAMILLY/VAT/PARAMETER/PROVIDER referenced | — | `qprotosrc,xml` copybook (`PRO202.SQLRPGLE:11`) **not in tree** |

## Not searched / cannot see (first-class residual)

- Compiled-object-only facts: CMD→PGM bindings, actual library list, activation group behaviour, QM query definitions, `SAMLOG` user space contents.
- Sources outside `ATU_SRC/**`: `XML`, `ORDER`, `TXT`, `XSS` service programs; `CVTSPLPDF` processing program; `ADSPUSRSPC`.
- Runtime-only behaviour (no IBM i available): trigger firing order, commitment control, `*LIBL` resolution, `QTEMP` override lifetime.
- `.elias/hashList.json` and `iproj.json` (ARCAD/Elias build metadata) not treated as behaviour evidence.

Zero-diff re-scan of these rows would not make the estate complete; residual remains a human gate.
