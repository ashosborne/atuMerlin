# CANDIDATES — cus-interactive (Phase A, unbound)

Seed: Customer interactive inquiry/maintain — `CUS200` (Work with Customers) + `CUS250` (Customer by id).
All rows are `candidate`. Nothing here is accepted. Line numbers cite `ATU_SRC/...` as-is.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| cus-interactive-c01 | List customers by name with position-to and 14-row paging | `QRPGLESRC/CUS200.PGM.SQLRPGLE:28` (CUSTOME2 keyed CUSTNM), `:129-155` (load 14, save/restore last read), `:124` (posTo → savName), `QDDSSRC/CUS200D.DSPF:27-41` (SFLCTL, PAGEDOWN, SFLPAG 7) | observed-in-code | Primary entry screen of the seed |
| cus-interactive-c02 | Create customer with id drawn from SQL sequence `CUSSEQ` | `CUS200.PGM.SQLRPGLE:179-185` (`NEXT VALUE FOR CusSeq`), `:321-328` (write FCUST), `QSQLSRC/CUSSEQ.SQLSEQ:5-9` (START 1551) | observed-in-code | F6 create path; id allocation is a behaviour worth a card |
| cus-interactive-c03 | Update customer (subfile option 2) | `CUS200.PGM.SQLRPGLE:224-229`, `:324-325` (update FCUST) | observed-in-code | Core maintain action |
| cus-interactive-c04 | Customer validation rules: country must exist, name mandatory, phone mandatory + digits only, duplicate name+phone rejected | `CUS200.PGM.SQLRPGLE:290-317` (ExistCountry, blanks checks, `%check('0123456789')`, `select count(*)` UPPER(name)+phone; CRT dup>0 / UPD dup>1), `QDDSSRC/CUS200D.DSPF:106-132` (ERR2000/2001/2002/ERR0002), `QMSGFSRC/SAMMSGF.MSGF:14-22` | observed-in-code | Validation is the highest-value characterization target |
| cus-interactive-c05 | Country prompt (F4) via FCOUNTRY selector | `CUS200.PGM.SQLRPGLE:281-284` (SltCountry, GetCountryName), `:35` (/COPY COUNTRY.RPGLEINC) | observed-in-code | Cross-seam call; boundary to cou-maintain / srvpgm-supporting |
| cus-interactive-c06 | Navigate to customer's orders (option 5 → `ORD200`) | `CUS200.PGM.SQLRPGLE:37-38` (extpgm ORD200), `:230-233` | observed-in-code | Seam edge into ord-maintain-ord200 (not a member) |
| cus-interactive-c07 | Last-order-date display: `CULASTORD = 0` shown as 1940-01-01 sentinel | `CUS200.PGM.SQLRPGLE:89` (datBlank), `:260-264`, `:336` | observed-in-code | Sentinel-date convention recurs across ORD screens — needs one card |
| cus-interactive-c08 | Audit stamping on save: `CUMOD = %timestamp()`, `CUMODID = *user`, `CUCREA = %date()` at init | `CUS200.PGM.SQLRPGLE:323`, `:334-335`, `:75` | observed-in-code | Persistence side-effect a modern target must keep or explicitly drop |
| cus-interactive-c09 | Customer-by-id inquiry with F4 prompt (`SltCustomer`) and not-found message ERR0103 | `QRPGLESRC/CUS250.PGM.RPGLE:85-87`, `:96-104`, `QDDSSRC/CUS250D.DSPF:28` | observed-in-code | Second entry PGM of the seed |
| cus-interactive-c10 | Customer detail display with resolved country name | `CUS250.PGM.RPGLE:129-131` (GetCountryName), `:133-137` (fmt02) | observed-in-code | Read-only detail card |
| cus-interactive-c11 | Soft-delete flag `CUDEL` exists on file but no delete path in CUS200/CUS250 | `QDDSSRC/CUSTOMER.PF:28` (CUDEL), `CUS200.PGM.SQLRPGLE:199` (options allowed: 2, 5 only) | observed-in-code (absence) | Boundary question: where are customers deleted? (`IsCusDeleted` exists in FCUSTOMER) |
| cus-interactive-c12 | Option validation: only 2 and 5 accepted; invalid highlighted with SFLMSG | `CUS200.PGM.SQLRPGLE:193-213`, `QDDSSRC/CUS200D.DSPF:40` | observed-in-code | Screen contract |

## Unknown / not claimed

- `CUSTADRE.PF` / `ADDRESS.PF` (multi-address model) are not referenced by any program read this pass (`rg` across `ATU_SRC`: only the DDS). Recorded as `unknown` surface, not a candidate behaviour.
- Help panels `SAMHELP` name `CUS200` but body is placeholder "Text" (`QPNLSRC/SAMHELP.PNLGRP:5-7`).

## Deferred recommendations (prose only — not MANIFEST statuses)

- Defer `c11` to the bind conversation rather than inventing a delete behaviour.
