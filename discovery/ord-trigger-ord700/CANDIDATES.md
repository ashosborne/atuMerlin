# CANDIDATES — ord-trigger-ord700 (Phase A, unbound)

Seed: order triggers — `ORD700` (DETORD → ARTICLE.ARCUSQTY) + `ORD701` (ORDER → CUSTOMER.CULASTORD). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-trigger-ord700-c01 | Trigger registration: three `ADDPFTRG` on `DETORD` (*AFTER insert/delete/update, update only on *CHANGE), all calling `ORD700`, `RPLTRG(*YES)`, named `ORD700_DETORD_ARTICLE_{INSERT,DELETE,UPDATE}` | `QTRGSRC/ORD700A.SYSTRG:4-7`, `ORD700D.SYSTRG:4-7`, `ORD700U.SYSTRG:4-8` | observed-in-code (definition) / inferred (attached on the box) | Wiring contract |
| ord-trigger-ord700-c02 | Insert: `ARCUSQTY += new.ODQTY` for the line's article | `QRPGLESRC/ORD700.PGM.RPGLE:73-75`, `:97-110` (`UpdArt`) | observed-in-code | Core rule |
| ord-trigger-ord700-c03 | Delete: `ARCUSQTY -= (old.ODQTY − old.ODQTYLIV)` and an application log entry "ORD700:Order Line deleted …" via `AddLogEntry` (LOG srvpgm, `callp(e)` — log failure swallowed) | `ORD700.PGM.RPGLE:76-82`, `QPROTOSRC/LOG.RPGLEINC:4-5` | observed-in-code | Core rule + audit side effect |
| ord-trigger-ord700-c04 | Update: same article → delta `(Δqty − Δdelivered)`; article changed → subtract old outstanding, add new outstanding | `ORD700.PGM.RPGLE:83-93` | observed-in-code | Core rule (outstanding = ordered − delivered) |
| ord-trigger-ord700-c05 | `UpdArt` no-ops when qty delta is 0 or article not found; no error raised | `ORD700.PGM.RPGLE:101-107` | observed-in-code | Edge behaviour (silent skip) |
| ord-trigger-ord700-c06 | Standard trigger buffer parsing (`PARM1` layout, `%parms = 0` early return, offsets to old/new records) | `ORD700.PGM.RPGLE:14-48`, `:65-71` | observed-in-code | Integration mechanics; conversion must replace, not copy |
| ord-trigger-ord700-c07 | `ORD701`: after insert on `ORDER`, `UPDATE CUSTOMER SET CULASTORD = new.ORDATE WHERE CUID = new.ORCUID` | `QSQLSRC/ORD701.SQLTRG:4-14` | observed-in-code | Core rule |
| ord-trigger-ord700-c08 | Asymmetry: `ORD701` has no update/delete counterpart; `ORD700` has no `ORDER`-level effect. Deleting an order leaves `CULASTORD` stale until `ART801` / `ORD901` recompute | `ORD701.SQLTRG` (insert only), `QSQLSRC/ART801.SQLPRC:33-36`, `QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50` | inferred (consequence) | Data-consistency fact for SME |
| ord-trigger-ord700-c09 | `ORD100` staging copy is created with `TRG(*NO)` so staged lines never fire `ORD700`; only the final `DETORD` writes do | `QCLSRC/ORD100C.PGM.CLLE:8-9`, `QRPGLESRC/ORD100.PGM.RPGLE:206` | observed-in-code | Boundary with ord-entry-ord100 |
| ord-trigger-ord700-c10 | `ART801` (`UPDATE_ON_CUS_ORD_QTY`) recomputes `ARCUSQTY`, `CUCREDIT`, `CULASTORD` from open orders — the batch reconciliation of what these triggers maintain incrementally (menu opt 82) | `QSQLSRC/ART801.SQLPRC:22-36`, `QPNLSRC/SAMMNU.MENU:152-155` | observed-in-code | Related surface (owned by sql-objects seed) |
| ord-trigger-ord700-c11 | `ARCUSQTY` semantics differ between trigger and reconciliation: `ORD700` insert adds full `ODQTY` (not outstanding), while `ART801` sums `ODQTY − ODQTYLIV` on open orders only → drift when lines are delivered via ORD200/201 opt 8 (update fires with Δdelivered, so trigger path is consistent) but on **closed** orders `ART801` excludes them while trigger never subtracts | `ORD700.PGM.RPGLE:75` vs `ART801.SQLPRC:24-27` (`ORDATCLO = 0`) | inferred (needs SME arithmetic check) | Potential business-rule divergence |

## Deferred recommendations (prose only)

- Humans should decide whether c02–c04 (incremental) and c10 (batch) are one behaviour with two implementations or two behaviours. Discovery lists both; does not merge.
- c11 is an inferred arithmetic divergence — verify before it becomes a card.
