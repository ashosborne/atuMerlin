# CANDIDATES — ord-batch-ord900 (Phase A, unbound)

Seed: order utilities `ORD900` and `ORD901` (menu "Utilities" group). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-batch-ord900-c01 | `ORD900`: set data area `LASTORDNO` to the highest existing `ORID` (`setgt *hival; readp` on `ORDER1`, `IN *LOCK`, `OUT`) | `QRPGLESRC/ORD900.PGM.RPGLE:4-11` | observed-in-code | Order-number source reset |
| ord-batch-ord900-c02 | `ORD901`: early exit when no orders (`max(ORDATE) = 0`) | `QRPGLESRC/ORD901.PGM.SQLRPGLE:11-15` | observed-in-code | Edge case |
| ord-batch-ord900-c03 | `ORD901`: shift every order's `ORDATE` forward by (today − latest order date) days so the newest order lands on today; `ORYEAR` recomputed | `ORD901.PGM.SQLRPGLE:16-21`, `:38-39` | observed-in-code | Core rule |
| ord-batch-ord900-c04 | `ORD901`: delivery/close dates shifted by the same offset; any resulting future date is reset to 0; an order delivered more than 10 days before the new "today" with no close date gets `ORDATCLO = ORDATDEL + 10` | `ORD901.PGM.SQLRPGLE:18`, `:22-37` | observed-in-code | Derived-date rules |
| ord-batch-ord900-c05 | `ORD901`: resync `DETORD.ODYEAR` to its order's `ORYEAR`; recompute `CUSTOMER.CULASTORD = max(ORDATE)` per customer | `ORD901.PGM.SQLRPGLE:42-50` | observed-in-code | Consistency repair (overlaps `ART801` third UPDATE) |
| ord-batch-ord900-c06 | `ORD901` reads `ORDER` in arrival sequence with update and no commitment control; whole-file rewrite | `ORD901.PGM.SQLRPGLE:4`, `:19-41` | observed-in-code | Runtime characteristic |
| ord-batch-ord900-c07 | Purpose: demo-data refresh utilities (menu group "Utilities", texts "Reset …"), not business batch | `QPNLSRC/SAMMNU.MENU:143-155`, `ORD901.PGM.SQLRPGLE:2` (%TEXT) | inferred | Scope signal for bind: candidates to **defer/reject** for conversion |
| ord-batch-ord900-c08 | Neither program is scheduled or parameterised; both are menu `CALL`s (no CL, no JOBSCDE in tree) | `SAMMNU.MENU:143-150`, absence of `*.CLLE` wrappers | observed-in-code (absence) | Blind spot: real scheduling would be runtime-only |
| ord-batch-ord900-c09 | `ORD901` variable `today` is computed but only used for the future-date guard; `lastdate` is reused as "today − 10 days" after the first select (name shadowing) | `ORD901.PGM.SQLRPGLE:16-18`, `:34` | observed-in-code | Readability trap for Pack B / conversion |

## Deferred recommendations (prose only)

- c07: if the SME confirms these are sample-refresh tools, recommend **defer** the whole slice from conversion scope (keep in inventory as known surface). Discovery does not set that status.
