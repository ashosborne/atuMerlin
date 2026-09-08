# CANDIDATES — ord-entry-ord100 (Phase A, unbound)

Seed: create a new customer order — `ORD100` + `ORD100C`/`ORD100C2` + `CRTORD`. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-entry-ord100-c01 | Customer selection at entry: optional CUID parm; if absent/0 → `SltCustomer(0)`; 0 result aborts; header shows `GetCusName` | `QRPGLESRC/ORD100.PGM.RPGLE:22-28` (`options(*nopass)`), `:318-331` (`*inzsr`) | observed-in-code | Entry contract |
| ord-entry-ord100-c02 | Order lines are staged in a job-scoped temp file: CL deletes/duplicates `DETORD` into `QTEMP` with `CST(*NO) TRG(*NO)` and overrides `TMPDETORD` | `QCLSRC/ORD100C.PGM.CLLE:6-10`, `QCLSRC/ORD100C2.PGM.CLLE:5-10`, `ORD100.PGM.RPGLE:4-5`, `:12` | observed-in-code | Staging semantics; triggers deliberately off for the temp copy |
| ord-entry-ord100-c03 | Add line (F6): `SltArticle` prompt (blank → back to list), qty defaults 1, price = `GetArtRefSalPrice`, VAT = `CLCVat(GetArtVatCode)`, rate shown via `GetVatRate` | `ORD100.PGM.RPGLE:252-270` | observed-in-code | Pricing rule |
| ord-entry-ord100-c04 | Edit line (option 2): recompute `ODTOT = qty*price`, VAT and `ODTOTVAT` on Enter; F27 "change" redisplays without saving | `ORD100.PGM.RPGLE:264`, `:291-296`, `:299-312` | observed-in-code | Recalculation rule |
| ord-entry-ord100-c05 | Delete staged line (option 4) with running totals adjusted and row shown as `**** Delete ***` | `ORD100.PGM.RPGLE:221-231` | observed-in-code | Screen behaviour |
| ord-entry-ord100-c06 | Confirm (F8) rejected while any row has pending option 2/4 (`SFLMSG 36 'Confirmation is not allowed…'`) | `ORD100.PGM.RPGLE:171-179`, `QDDSSRC/ORD100D.DSPF:32`, `:39` | observed-in-code | Guard rule |
| ord-entry-ord100-c07 | Confirm writes header: next `LASTORDNO` under `*lock`, `ORYEAR=*year`, `ORDATE=today (ISO numeric)`, delivery/close dates 0; then copies staged lines to `DETORD` renumbering `ODLINE` 1..n | `ORD100.PGM.RPGLE:56` (DTAARA), `:188-208` | observed-in-code | The core transaction |
| ord-entry-ord100-c08 | After confirm: print via `ORD500(orid)` then acknowledgement screen FMT03, program ends | `ORD100.PGM.RPGLE:30-31`, `:209-212`, `QDDSSRC/ORD100D.DSPF:128` | observed-in-code | Seam edge to ord-print-ord500 |
| ord-entry-ord100-c09 | `CRTORD` command (CUID parm, default 0) is the callable façade; `ORD100C` invokes `CRTORD CUID(&CUID)` | `QCMDSRC/CRTORD.CMD:4-6`, `QCLSRC/ORD100C.PGM.CLLE:11` | observed-in-code (CMD def) / **inferred** (CMD→ORD100 binding; `PGM()` lives in ARCAD metadata, not source) | Callable boundary |
| ord-entry-ord100-c10 | Entry paths: menu opt 6 → `ORD100C2`; `ORD200` F6 → `ORD100C(cuid)`; `ORD201` F6 → `ORD100C2` | `QPNLSRC/SAMMNU.MENU:104-107`, `QRPGLESRC/ORD200.PGM.SQLRPGLE:30-31,154-156`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:16,155-158` | observed-in-code | Call graph |
| ord-entry-ord100-c11 | Side effects on confirm: each `DETORD` write fires `ORD700` (ARCUSQTY += qty); `ORDER` write fires `ORD701` (CUSTOMER.CULASTORD) | `QTRGSRC/ORD700A.SYSTRG:4-7`, `QSQLSRC/ORD701.SQLTRG:4-14`, `ORD100.PGM.RPGLE:197,206` | observed-in-code (trigger definitions) / inferred (that triggers are attached on the box) | Cross-slice consequence; owner is ord-trigger-ord700 |
| ord-entry-ord100-c12 | Line numbering during staging uses a running `count` that is not decremented on delete → gaps until confirm renumbers | `ORD100.PGM.RPGLE:261-262`, `:224`, `:204-205` | observed-in-code | Edge case |
| ord-entry-ord100-c13 | Cancel / exit before confirm discards the staged order (nothing written; QTEMP copy dies with job or is deleted on next CL run) | `ORD100.PGM.RPGLE:140-145`, `ORD100C*.CLLE:5-6` (`DLTF QTEMP/DETORD` + MONMSG) | observed-in-code | Abandon semantics |
| ord-entry-ord100-c14 | No stock, credit-limit or delivery-date checks at order entry (observed absence: `CULIMCRE`, `ARSTOCK` never read) | `ORD100.PGM.RPGLE` (no reference), `QDDSSRC/CUSTOMER.PF:20-22` | observed-in-code (absence) | Prevents inventing rules later |

## Deferred recommendations (prose only)

- c11 is a consequence, not a behaviour of this seam — recommend binding it under `ord-trigger-ord700` and keeping only a pointer here.
- c09 CMD→PGM binding must be confirmed from the compiled object / ARCAD repository.
