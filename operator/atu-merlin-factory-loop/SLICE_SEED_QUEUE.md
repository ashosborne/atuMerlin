# SLICE_SEED_QUEUE — atuMerlin (`ATU_SRC`)

Proposed ordered queue of **callable-seam** slices for Pack A radar then (after human bind) Pack B document conveyor.

**Rules:** mid-size seams (entry PGM / CMD / CL + related DSPF). Domain prefixes ART/CUS/ORD/PRO/FAM/COU/PAR/VAT/LOG (+ DAT, SRVPGM, shell, SQL). **Shared PF/LF are deps, not slices.** Do not merge ORD* just because they share `ORDER.PF`.

Statuses below are **queue proposal** only (`todo` until radar/bind/document updates manifests / optional INDEX).

| # | SLICE_ID | Domain | Seed (short) | Entrypoint paths | Deps (not slice members) |
| ---: | --- | --- | --- | --- | --- |
| 1 | `cus-interactive` | CUS | Customer interactive CUS200/CUS250 | `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE`, `CUS250.PGM.RPGLE`, `QDDSSRC/CUS200D.DSPF`, `CUS250D.DSPF` | `CUSTOMER.PF`, `CUSTOME1/2.LF`, `CUSTADRE.PF`, `ADDRESS.PF`, `QPROTOSRC/CUSTOMER.RPGLEINC`, `FCUSTOMER.ILESRVPGM` |
| 2 | `cus-modules` | CUS | Customer modules CUS300/301 | `CUS300.RPGLE`, `CUS301.SQLRPGLE`, `CUS301D.DSPF` | `CUSTOMER.PF`, `CUSTOMER.RPGLEINC`, `FCUSTOMER.ILESRVPGM` |
| 3 | `art-interactive` | ART | Article interactive ART200/201/202/250 | `ART200.PGM.SQLRPGLE`, `ART201.PGM.RPGLE`, `ART202.PGM.RPGLE`, `ART250.PGM.SQLRPGLE`, `ART200D/201D/202D/250D.DSPF` | `ARTICLE.PF`, `ARTICLE1/2.LF`, `ARTIPROV.PF`, `ARTICLE.RPGLEINC`, `FARTICLE.ILESRVPGM` |
| 4 | `art-modules` | ART | Article modules ART300/301/302 | `ART300.RPGLE`, `ART301.SQLRPGLE`, `ART302.SQLRPGLE`, `ART301D.DSPF` | `ARTICLE.PF`, `ARTICLE.RPGLEINC`, `FARTICLE.ILESRVPGM` |
| 5 | `ord-entry-ord100` | ORD | Order entry ORD100 + CL + CRTORD | `ORD100.PGM.RPGLE`, `ORD100C.PGM.CLLE`, `ORD100C2.PGM.CLLE`, `ORD100D.DSPF`, `CRTORD.CMD` | `ORDER.PF`, `DETORD.PF`, `LASTORDNO.DTAARA` |
| 6 | `ord-entry-ord101` | ORD | Order entry ORD101 | `ORD101.PGM.RPGLE`, `ORD101D.DSPF` | `ORDER.PF`, `DETORD.PF` |
| 7 | `ord-maintain-ord200` | ORD | Order maintain ORD200 | `ORD200.PGM.SQLRPGLE`, `ORD200D.DSPF` | `ORDER.PF`, `ORDER1/2/3.LF` |
| 8 | `ord-maintain-ord201` | ORD | Order maintain ORD201 | `ORD201.PGM.SQLRPGLE`, `ORD201D.DSPF` | `ORDER.PF` |
| 9 | `ord-maintain-ord202` | ORD | Order maintain ORD202 | `ORD202.PGM.RPGLE`, `ORD202D.DSPF` | `ORDER.PF` |
| 10 | `ord-print-ord500` | ORD | Order print ORD500 | `ORD500.PGM.RPGLE`, `ORD500C.PGM.CLLE`, `ORD500O.PRTF` | `ORDER.PF`, `DETORD.PF` |
| 11 | `ord-trigger-ord700` | ORD | Order triggers ORD700* | `ORD700.PGM.RPGLE`, `ORD700A/D/U.SYSTRG`, `ORD701.SQLTRG` | `ORDER.PF` |
| 12 | `ord-batch-ord900` | ORD | Order batch ORD900/901 | `ORD900.PGM.RPGLE`, `ORD901.PGM.SQLRPGLE` | `ORDER.PF` |
| 13 | `pro-interactive` | PRO | Provider interactive (non-COBOL) | `PRO200.RPGLE`, `PRO202.SQLRPGLE`, `PRO203.PGM.SQLRPGLE`, `PRO250.PGM.RPGLE`, `PRO200D/201D/202D/250D.DSPF`, `PRO200.ILEPGM` | `PROVIDER.PF`, `PROVIDER.RPGLEINC`, `FPROVIDER.ILESRVPGM` |
| 14 | `pro-modules` | PRO | Provider modules PRO300/301 | `PRO300.RPGLE`, `PRO301.SQLRPGLE`, `PRO301D.DSPF` | `PROVIDER.PF`, `FPROVIDER.ILESRVPGM` |
| 15 | `pro-cobol-pro201` | PRO | Provider COBOL PRO201 | `QCBLSRC/PRO201.CBL` | `PROVIDER.PF`, `PRO201D.DSPF` |
| 16 | `fam-maintain` | FAM | Family FAM300/301 | `FAM300.RPGLE`, `FAM301.RPGLE`, `FAM301D.DSPF` | `FAMILLY.PF`, `FAMILL1.LF`, `FAMILLY.RPGLEINC`, `FFAMILLY.ILESRVPGM` |
| 17 | `cou-maintain` | COU | Country COU200/300/301 | `COU200.RPG`, `COU300.RPGLE`, `COU301.RPGLE`, `COU200D/301D.DSPF` | `COUNTRY.PF`, `COUNTR1.LF`, `COUNTRY.RPGLEINC`, `FCOUNTRY.ILESRVPGM` |
| 18 | `par-maintain` | PAR | Parameter PAR200/201/300 | `PAR200.PGM.RPGLE`, `PAR300.RPGLE`, `PAR201.CLLE`, `PAR201.ILEPGM`, `PAR200D.DSPF` | `PARAMETER.PF`, `PARAMETER.RPGLEINC`, `FPARAMETER.ILESRVPGM` |
| 19 | `vat-module` | VAT | VAT VAT300 | `VAT300.RPGLE` | `VATDEF.PF`, `VAT.RPGLEINC`, `FVAT.ILESRVPGM` |
| 20 | `log-programs` | LOG | Log LOG100/300 | `LOG100.PGM.RPGLE`, `LOG300.RPGLE` | `LOG.RPGLEINC`, `LOG.ILESRVPGM` |
| 21 | `dat-utils` | DAT | Date utils DAT001/002 | `DAT001.PGM.RPGLE`, `DAT002.PGM.RPGLE` | — |
| 22 | `srvpgm-fcustomer` | SRVPGM | FCUSTOMER API seam | `FCUSTOMER.ILESRVPGM`, `FCUSTOMER.BND`, `CUSTOMER.RPGLEINC` | `CUSTOMER.PF` |
| 23 | `srvpgm-farticle` | SRVPGM | FARTICLE API seam | `FARTICLE.ILESRVPGM`, `FARTICLE.BND`, `ARTICLE.RPGLEINC` | `ARTICLE.PF` |
| 24 | `srvpgm-fprovider` | SRVPGM | FPROVIDER API seam | `FPROVIDER.ILESRVPGM`, `FPROVIDER.BND` | `PROVIDER.PF` |
| 25 | `srvpgm-supporting` | SRVPGM | FFAMILLY/FCOUNTRY/FPARAMETER/FVAT/LOG + SAMPLE.BNDDIR | matching `QILESRVSRC/*`, `QBNDSRC/SAMPLE.BNDDIR` | domain PFs as cited in code |
| 26 | `menu-cmd-shell` | SHELL | Menu/panel/msg/cmd residuals | `SAMMNU.MENU`, `SAMHELP.PNLGRP`, `SAMMSGF.MSGF`, `CVTSPLPDF.CMD` | — |
| 27 | `sql-objects` | SQL | SQL objects excl. ORD701 (lives under ord-trigger-ord700) | `ART801.SQLPRC`, `ARTIINF.TABLE`, `ARTLSTDAT.VIEW`, `CUSSEQ.SQLSEQ`, `ISOTODATE.SQLUDF`, `ISOTODATE4.SQLUDF`, `ORDERCUS.VIEW` | — |

**First wakes (recommended):** Pack A radar starting at `#1 cus-interactive` (then ART). After bind, Pack B documents accepted rows one at a time in this order unless MORNING_BRIEF reprioritises.

**Paths** are under `ATU_SRC/` as listed in CHARTER; shortenings in the table refer to the same tree (`QRPGLESRC/`, `QDDSSRC/`, etc.).
