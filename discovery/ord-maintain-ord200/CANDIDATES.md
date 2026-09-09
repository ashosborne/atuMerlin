# CANDIDATES — ord-maintain-ord200 (Phase A, unbound)

Seed: orders of one customer — `ORD200(cuid)`. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-maintain-ord200-c01 | List a customer's orders from view `ORDERCUS` with `ISOTODATE40` date conversion and order total, newest first; whole result loaded (no paging) | `QRPGLESRC/ORD200.PGM.SQLRPGLE:105-131`, `QSQLSRC/ORDERCUS.VIEW:4-19`, `QSQLSRC/ISOTODATE4.SQLUDF:4-14` | observed-in-code | Primary screen |
| ord-maintain-ord200-c02 | F6 create new order for this customer → `ORD100C(cuid)` | `ORD200.PGM.SQLRPGLE:30-31`, `:154-156` | observed-in-code | Seam edge |
| ord-maintain-ord200-c03 | Option 2 update lines → `ORD101(orid)` | `ORD200.PGM.SQLRPGLE:21-22`, `:225-228` | observed-in-code | Seam edge |
| ord-maintain-ord200-c04 | Option 4 delete order: delete `ORDER1` then loop-delete `DETORD1` rows by ORID | `ORD200.PGM.SQLRPGLE:229-235` | observed-in-code | Destructive action |
| ord-maintain-ord200-c05 | Option 5 display → `ORD202(orid)`; option 6 print → `ORD500(orid)` | `ORD200.PGM.SQLRPGLE:24-28`, `:236-243` | observed-in-code | Seam edges |
| ord-maintain-ord200-c06 | Option 7 close: sets `ORDATCLO` = today; sets `ORDATDEL` = today if still 0 | `ORD200.PGM.SQLRPGLE:244-254` | observed-in-code | Lifecycle rule |
| ord-maintain-ord200-c07 | Option 8 deliver: sets `ORDATDEL` = today; for each line with `ODQTYLIV = 0` sets `ODQTYLIV = ODQTY` (partially delivered lines untouched, unlocked) | `ORD200.PGM.SQLRPGLE:255-272` | observed-in-code | Lifecycle rule |
| ord-maintain-ord200-c08 | Guards: 7 rejected if already closed; 8 rejected if already delivered; 4 rejected if any line delivered (`sflmsg3`); options 1, 3, >8 invalid | `ORD200.PGM.SQLRPGLE:168-212`, `QDDSSRC/ORD200D.DSPF:40-43` | observed-in-code | Business rules |
| ord-maintain-ord200-c09 | **Precedence quirk:** `if opt01 = 2 or opt01 = 4 and datclo > datBlank` → option 2 is *always* rejected with "Closed order can not be edited" regardless of close date (AND binds tighter than OR) | `ORD200.PGM.SQLRPGLE:187-195` vs `QRPGLESRC/ORD201.PGM.SQLRPGLE:191` (parenthesised correctly) | observed-in-code | As-is defect; ORD200 opt 2 effectively unreachable |
| ord-maintain-ord200-c10 | Caller: `CUS200` option 5 | `QRPGLESRC/CUS200.PGM.SQLRPGLE:37-38`, `:230-233` | observed-in-code | Call graph |
| ord-maintain-ord200-c11 | Header context: chain `CUSTOME1` for customer name; sentinel dates 1940-01-01 | `ORD200.PGM.SQLRPGLE:74`, `:279-284` | observed-in-code | Screen contract |
| ord-maintain-ord200-c12 | Delete order (c04) does not touch `CUSTOMER.CULASTORD`/`ARCUSQTY` directly; relies on `ORD700` delete trigger per line; `ORD701` has no delete trigger → `CULASTORD` may point to a deleted order until `ART801`/`ORD901` recompute | `ORD200.PGM.SQLRPGLE:229-235`, `QSQLSRC/ORD701.SQLTRG:4-14` (insert only), `QSQLSRC/ART801.SQLPRC:33-36` | inferred | Data-consistency consequence for SME |
| ord-maintain-ord200-c13 | Delete loop semantics: `dou not %found(); delete orid detord1; enddo` deletes by partial key until none left; header delete first (opposite order to ORD201) | `ORD200.PGM.SQLRPGLE:230-233` vs `ORD201.PGM.SQLRPGLE:233-237` | observed-in-code | Divergence between twins |

## Deferred recommendations (prose only)

- c09 is the single most important finding in this seam: SME must decide whether the modern target preserves "option 2 never works in ORD200" (as-is) or adopts ORD201's corrected rule. Discovery does not decide.
- c12 is inferred from trigger definitions; confirm on the box.
