# METHOD_COVERAGE — atu-merlin Pack A (run 1 2026-09-08 12:xx UTC; residual run 2026-09-08 19:xx UTC)

Status: **ESTATE_SCAN_INCOMPLETE** (`estate_scan: partial` stays set in APP_MANIFEST notes).

Every source member under `ATU_SRC/**` (136 members, ~11k lines) has now been deep-read by one of the two Pack A runs. **That is not completeness**: the "could not see" column below is about objects the tree does not contain and facts only the box knows; those are the residual, and a human gate decides whether they matter.

| Method family (CHARTER) | Members in tree | Touched (Phase A, run 1 + residual) | Skipped | Could not see |
| --- | --- | --- | --- | --- |
| DSPF | 22 in `QDDSSRC/*.DSPF` | All 22 (run 1: CUS/ART/ORD 13; residual: PRO200D/201D/202D/250D/301D, FAM301D, COU200D/301D, PAR200D) | — | — |
| CMD | `CRTORD.CMD`, `CVTSPLPDF.CMD` | Both (CRTORD in ord-entry-ord100; CVTSPLPDF parameter contract in menu-cmd-shell c07) | — | CMD → PGM binding (`CRTCMD PGM()`) is ARCAD metadata. CVTSPLPDF processing program not in tree. |
| CL | `ORD100C`, `ORD100C2`, `ORD500C`, `PAR201` | All 4 (PAR201 in par-maintain) | — | — |
| ILEPGM (CRTPGM sources) | `PRO200.ILEPGM`, `PAR201.ILEPGM` | Both (srvpgm-supporting c04) | — | Build definitions for every other `*PGM` (ARCAD/elias metadata, `.elias/`, `iproj.json`) |
| SQLRPGLE | 11 | All 11 (residual: PRO202, PRO203, PRO301) | — | `qprotosrc,xml` / `qprotosrc,Xss` copybooks missing → PRO202/PRO203 not compilable from tree |
| RPGLE | 24 | All 24 (residual: PRO200, PRO250, PRO300, FAM300/301, COU300/301, PAR200/300, VAT300, LOG100/300, DAT001/002) | — | — |
| RPG (fixed, OPM) | `QRPGSRC/COU200.RPG` | Yes (cou-maintain) | — | — |
| COBOL | `QCBLSRC/PRO201.CBL` | Yes (pro-cobol-pro201) | — | — |
| SRVPGM | 8 `QILESRVSRC/*.ILESRVPGM`, 6 `QSRVSRC/*.BND`, `QBNDSRC/SAMPLE.BNDDIR` | All read; procedures scanned in cus-modules, art-modules, pro-modules, fam-maintain, cou-maintain, par-maintain, vat-module, log-programs; binding layer in srvpgm-supporting | — | `XML`, `ORDER`, `TXT`, `XSS` *SRVPGM in `SAMPLE.BNDDIR` — **no source** (recorded as `unknown` surfaces). `FPARAMETER` / `LOG` have no binder (`EXPORT(*ALL)`). How `PRO203`/`ORD500`/`ORD700`/`LOG100` bind is not in source. |
| SQL | 8 `QSQLSRC/*` | All 8 (ORD701 in ord-trigger-ord700; UDFs in dat-utils; views/table/sequence/procedure in sql-objects) | — | QM queries `CUSQRY`, `ARTQRY`, form `CUSQRYFMT` (menu opts 12/13) — **no source**; probable consumers of `ARTLSTDAT` / `ISO_Num_To_Date` |
| SYSTRG / SQLTRG | `ORD700A/D/U.SYSTRG`, `ORD701.SQLTRG` | All (ord-trigger-ord700, documented) | — | Trigger attachment on the box |
| PRTF | `ORD500O.PRTF` | Skeleton (ord-print-ord500) | — | Field-level layout deferred to Phase B |
| MENU / PNLGRP / MSGF | `SAMMNU.MENU`, `SAMHELP.PNLGRP`, `SAMMSGF.MSGF` | All 3 (menu-cmd-shell) | — | `ADSPUSRSPC` command (menu opt 84) not in tree |
| DTAARA | `LASTORDNO.DTAARA` | Yes (ord-entry-ord100 / ord-batch-ord900) | — | — |
| PF / LF (deps only) | 33 | All 33 read as deps (residual: PROVIDER, PROVIDE1/2, FAMILLY, FAMILL1, COUNTRY, COUNTR1, PARAMETER, VATDEF) | — | `PROVIDE2.LF` keys on `PROVA1`, not a `PROVIDER` field — stale/uncompilable, no consumer |
| Copybooks (QPROTOSRC) | 9 | All 9 read | — | `qprotosrc,xml`, `qprotosrc,Xss` referenced by PRO202/PRO203 — **not in tree** |

## Not searched / cannot see (first-class residual)

- **Objects referenced but absent from `ATU_SRC`**: `XML`, `ORDER`, `TXT`, `XSS` service programs and their copybooks; QM queries `CUSQRY`, `ARTQRY`, form `CUSQRYFMT`; commands `CVTSPLPDF` (processing program) and `ADSPUSRSPC`. Two reports (menu 12/13), the log viewer (84) and the two IFS file outputs (PRO202 XML, PRO203 spreadsheet) cannot be characterized until these are seen.
- **Compiled-object-only facts**: CMD→PGM bindings, import resolution for programs without `bnddir`/`.ILEPGM`, actual library list, activation-group behaviour at runtime, trigger attachment, `SAMLOG` user space contents and capacity behaviour.
- **Data-only facts**: which `PARAMETER` rows exist besides `PATH`; whether `ARPURQTY` is ever non-zero; whether soft-deleted providers/families/VAT codes exist; who maintains `PROVIDER` / `COUNTRY` / `FAMILLY` / `VATDEF` rows (no create/delete path in source).
- **Runtime-only behaviour** (no IBM i available): every `inferred` row (21 of 268) is a runtime or build question.
- `.elias/hashList.json` and `iproj.json` (ARCAD/Elias build metadata) not treated as behaviour evidence.

Zero-diff re-scan of these rows would not make the estate complete; residual remains a human gate.
