# CANDIDATES — ord-print-ord500 (Phase A, unbound)

Seed: print an order — `ORD500(orid)` + `ORD500C` + `ORD500O.PRTF`. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-print-ord500-c01 | Print order document to spool `ORD500O`: HEADER/HEADER2/HEADER3 (order + customer), DETAIL per line with article description, page break after 14 details (footer + reheader), TOTAL (net, VAT = total − net, total) and FOOTER | `QRPGLESRC/ORD500.PGM.RPGLE:30-57`, `QDDSSRC/ORD500O.PRTF:6,18,43,65,83,106` (record formats) | observed-in-code | Core output |
| ord-print-ord500-c02 | After spooling: resolve IFS directory from parameter `PATH` (`getParm2('PATH':' ')`) and call `ORD500C(orid, path)` | `ORD500.PGM.RPGLE:13`, `:21-23`, `:58-59` | observed-in-code | Seam edge to FPARAMETER |
| ord-print-ord500-c03 | `ORD500C`: `CVTSPLPDF FROMFILE(ORD500O) TOSTMF('Custord<orid>.pdf') TODIR(&PATH) SPLNBR(*LAST) STMFOPT(*REPLACE) PAGESIZE(*A4 *PORTRAIT) FONT(*COURIER 11)` | `QCLSRC/ORD500C.PGM.CLLE:4-14` | observed-in-code | Output contract (file naming, replace semantics) |
| ord-print-ord500-c04 | `CVTSPLPDF` command definition exists in tree; its processing program does not (blind spot) | `QCMDSRC/CVTSPLPDF.CMD:4-26` (parms), no `CVTSPLPDF*` PGM under `ATU_SRC` | observed-in-code (def) / unknown (impl) | Cannot characterize PDF output from source |
| ord-print-ord500-c05 | Callers: `ORD100` (always after confirm), `ORD200` opt 6, `ORD201` opt 6; `ORD101` declares but never calls | `QRPGLESRC/ORD100.PGM.RPGLE:30-31,209`, `ORD200.PGM.SQLRPGLE:27-28,240-243`, `ORD201.PGM.SQLRPGLE:24-25,246-249`, `ORD101.PGM.RPGLE:27-28` | observed-in-code | Call graph |
| ord-print-ord500-c06 | Article description read directly from `ARTICLE1` (not `GetArtDesc`); customer from `CUSTOME1` (not FCUSTOMER); `PARAMETER.RPGLEINC` is the only service dependency | `ORD500.PGM.RPGLE:8-13`, `:33`, `:46` | observed-in-code | Dependency fact |
| ord-print-ord500-c07 | Quirks: `datord` set to today then immediately overwritten from ORDATE; `oflind(overflow)` declared but page breaks driven by manual count; `*inlr` set before totals are written | `ORD500.PGM.RPGLE:6`, `:30-32`, `:40-45`, `:53-56` | observed-in-code | As-is oddities; harmless but document |
| ord-print-ord500-c08 | Unknown order id: `chain` not checked; prints with blank header fields (no error path) | `ORD500.PGM.RPGLE:31-33` (no `%found` test) | observed-in-code | Edge behaviour |

## Deferred recommendations (prose only)

- c04: the PDF step cannot be characterized from source. Recommend the SME confirm which product provides `CVTSPLPDF` (ARCAD? third-party?) and whether the PDF is in scope for parity at all.
