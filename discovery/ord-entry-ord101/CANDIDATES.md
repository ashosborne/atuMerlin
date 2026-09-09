# CANDIDATES — ord-entry-ord101 (Phase A, unbound)

Seed: maintain lines of an existing order — `ORD101(orid)`. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-entry-ord101-c01 | Load all lines of order id from `DETORD1` with article description and running totals (net, with VAT) | `QRPGLESRC/ORD101.PGM.RPGLE:105-120` | observed-in-code | Primary screen |
| ord-entry-ord101-c02 | Header context: chain `ORDER1`, show customer name via `GetCusName` | `ORD101.PGM.RPGLE:281-283` | observed-in-code | Entry contract |
| ord-entry-ord101-c03 | Edit line (option 2): ordered qty, delivered qty, unit price editable; totals + VAT recomputed; `DETORD` updated | `ORD101.PGM.RPGLE:218-228`, `:258-260`, `:264-275` | observed-in-code | Core maintain |
| ord-entry-ord101-c04 | Validation: delivered ≤ ordered (`ERR1001`), ordered ≥ delivered (`ERR1002`) | `ORD101.PGM.RPGLE:250-257`, `QDDSSRC/ORD101D.DSPF:120`, `:138`, `QMSGFSRC/SAMMSGF.MSGF:16-20` | observed-in-code | Business rule |
| ord-entry-ord101-c05 | Delete line (option 4) blocked when delivered qty > 0 (`SFLMSG 36 'Line with delivery can not…'`) | `ORD101.PGM.RPGLE:164-172`, `QDDSSRC/ORD101D.DSPF:40` | observed-in-code | Guard rule |
| ord-entry-ord101-c06 | Delete line (option 4) removes `DETORD1` row, adjusts totals, marks row `**** Delete ***` | `ORD101.PGM.RPGLE:188-199` | observed-in-code | Core maintain |
| ord-entry-ord101-c07 | Option 6 passes validation but has no action (dead option) | `ORD101.PGM.RPGLE:155` (allows 6) vs `:182-199` (no `when opt01 = 6`) | observed-in-code | As-is quirk |
| ord-entry-ord101-c08 | Unused declarations: `ORD500` prototype, `create` indicator (F6 not in DSPF) | `ORD101.PGM.RPGLE:27-28`, `:38`, `QDDSSRC/ORD101D.DSPF:28-40` (no CF06) | observed-in-code | Prevents phantom "print from ORD101" card |
| ord-entry-ord101-c09 | Callers: `ORD200` opt 2, `ORD201` opt 2 (both pass ORID) | `QRPGLESRC/ORD200.PGM.SQLRPGLE:21-22,225-228`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:18-19,229-232` | observed-in-code | Call graph |
| ord-entry-ord101-c10 | No add-line path for an existing order (observed absence) | `ORD101.PGM.RPGLE:134-146` (keys: exit, cancel, refresh only) | observed-in-code (absence) | Boundary fact: lines can only be added at creation (ORD100) |
| ord-entry-ord101-c11 | Side effects: `DETORD` update/delete fire `ORD700` (ARCUSQTY delta, delete log entry) | `QTRGSRC/ORD700U.SYSTRG:4-8`, `QTRGSRC/ORD700D.SYSTRG:4-7` | inferred (trigger attachment on the box) | Pointer to ord-trigger-ord700 |
| ord-entry-ord101-c12 | Editing a closed order is prevented upstream (ORD200/201 refuse opt 2 when closed) — ORD101 itself has no closed check | `ORD101.PGM.RPGLE` (no `ORDATCLO` test), `QRPGLESRC/ORD201.PGM.SQLRPGLE:191-199` | observed-in-code | Guard lives in the caller, not here |

## Deferred recommendations (prose only)

- c07, c08 → record as as-is quirks (accept as thin card or fold into c03/c06); do not "fix" in Discovery.
- c11 → pointer only; owner `ord-trigger-ord700`.
