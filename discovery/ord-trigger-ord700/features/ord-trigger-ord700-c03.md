# ord-trigger-ord700-c03 — Delete subtracts outstanding quantity and logs

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

When a `DETORD` row is deleted, `ORD700` (event `'2'`) first appends an application-log line `ORD700:Order Line deleted <order> <line> article : <id> quantity : <qty>` through `AddLogEntry` (LOG service program → `SAMLOG` user space), with any log failure swallowed, then subtracts the deleted row's **outstanding** quantity `old.ODQTY - old.ODQTYLIV` from `ARTICLE.ARCUSQTY`. Delete is the only event that logs. The only in-tree deleter is `ORD101` option `4`, which refuses to delete a line with `ODQTYLIV > 0`, so in-tree the subtraction is always the full `ODQTY`.

## Entrypoints

- Trigger definition `ORD700_DETORD_ARTICLE_DELETE` — `ADDPFTRG FILE(DETORD) TRGTIME(*AFTER) TRGEVENT(*DELETE) PGM(ORD700) RPLTRG(*YES)` — `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` (definition only; attachment is `c01`)
- `ORD700` mainline `when teven = '2'` — `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82`
- Firing writer in `ATU_SRC`: `ORD101` `delete (id:odline) detord1` (via `DETORD1.LF`, `PFILE(DETORD)`) — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:9,191`, `ATU_SRC/QDDSSRC/DETORD1.LF:5-7`

## Inputs / outputs / observables

- In: trigger buffer with `TEVEN = '2'`, `OLDOFF` → before-image mapped onto `OLD` (`EXTNAME(detord)`, qualified, `based(po)`). — `ORD700.PGM.RPGLE:59-61,77`
- Out 1 (log): one entry appended to user space `SAMLOG` (`*LIBL`) in the form `User: <*USER> * Date: <timestamp> * Msg: ORD700:Order Line deleted <ODORID> <ODLINE> article : <ODARID> quantity : <ODQTY> ***`. — `ORD700.PGM.RPGLE:78-81`, `ATU_SRC/QRPGLESRC/LOG300.RPGLE:18-35,41-43`
- Out 2 (data): `ARTICLE` row `ARID = old.ODARID` rewritten with `ARCUSQTY = ARCUSQTY - (old.ODQTY - old.ODQTYLIV)`. — `ORD700.PGM.RPGLE:82,104-109`
- Observables: `ARCUSQTY` (as `c02`); the log is viewable from menu option 84 `ADSPUSRSPC SAMLOG` (command implementation not in tree). — `ATU_SRC/QPNLSRC/SAMMNU.MENU:159-162`

## Behaviour as implemented

1. `po = %addr(parm1) + oldoff` — `OLD` overlays the deleted row image. — `ORD700.PGM.RPGLE:77`
2. `callp(e) addlogEntry('ORD700:Order Line deleted ' + %char(Old.odorid) + ' ' + %char(Old.odline) + ' article : ' + old.odarid + ' quantity : ' + %char(old.odqty))` — the `(e)` extender means a failure inside the LOG call sets `%error` and execution continues; `%error` is never tested. Note the message carries `ODQTY` (ordered), not the outstanding quantity actually subtracted, and `ODARID` is not trimmed. — `ORD700.PGM.RPGLE:78-81`
3. `AddLogEntry` (`LOG300`, `nomain`, exported from `LOG.ILESRVPGM`): on first call resolves `SAMLOG *LIBL` with `rtvusrspcptr`; then writes `'User: ' + *USER + ' * Date: ' + %char(%timestamp()) + ' * Msg: ' + %trim(entry) + ' ***'` at the current offset held in the first 4 bytes of the user space and advances that offset. No wrap, no size check, no locking. — `LOG300.RPGLE:12-16,24-32,41-43`, `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8`
4. `UpdArt(-Old.odqty + Old.odqtyliv : old.odarid)` — i.e. `-(ODQTY - ODQTYLIV)`. — `ORD700.PGM.RPGLE:82`
5. `UpdArt` no-op rules (`c05`): zero delta or unknown article → nothing happens (but the log line has already been written). — `ORD700.PGM.RPGLE:101-107`

## Validation rules found in code

None in the trigger. The guard that a line with deliveries cannot be deleted lives in the writer (`ORD101`: option `4` with `odqtyliv > 0` → error indicator, line stays), not here. — `ORD101.PGM.RPGLE:164-171`

## Edge cases found in code

- **Log written even when the quantity update is a no-op** (fully delivered line: `ODQTY = ODQTYLIV`, or article missing). — `ORD700.PGM.RPGLE:78-82,101-107`
- **Log failure is silent** (`callp(e)`, `%error` unread): if `SAMLOG` does not exist in `*LIBL` or the LOG service program cannot be resolved at run time, the quantity update still runs. — `ORD700.PGM.RPGLE:78`
- **Fully delivered line deleted** (`ODQTYLIV = ODQTY`): delta 0, `ARCUSQTY` unchanged — consistent with "outstanding" semantics. In tree this cannot happen through `ORD101`. — `ORD700.PGM.RPGLE:82`, `ORD101.PGM.RPGLE:164`
- **Only the delete event logs.** Inserts (`c02`) and updates (`c04`) leave no trace in `SAMLOG`. — `ORD700.PGM.RPGLE:72-94`
- **Deleting a whole order** is not an in-tree operation: `ORD200` / `ORD201` never delete `ORDER` or `DETORD` rows (options 7/8 update only), and there is no SQL `DELETE` in `ATU_SRC`. Any external mass delete with triggers active would log one line per row. — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:249-270`, structural grep
- **`ORD100` option `4` during staging** deletes from the `QTEMP` copy (`TRG(*NO)`), so it never logs or adjusts (`c09`). — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:224`

## Dependencies

- `ARTICLE1.LF` (as `c02`).
- `LOG.RPGLEINC` prototype `AddLogEntry(entry 500 value)`; `LOG300.RPGLE` module; `LOG.ILESRVPGM` (`CRTSRVPGM ... MODULE(LOG300) ACTGRP(*CALLER) EXPORT(*ALL)`); `SAMLOG` `*USRSPC` (object not in tree; created elsewhere — `LOG100` is the `log-programs` seed). — `ATU_SRC/QPROTOSRC/LOG.RPGLEINC:4-5`, `LOG300.RPGLE:4`, `LOG.ILESRVPGM:8`
- **Binding is not in source:** `ORD700`'s H-spec is `dftactgrp(*no)` with no `bnddir`, `LOG` is **not** listed in `SAMPLE.BNDDIR`, and there is no `ORD700.ILEPGM` build description under `QILESRC`. How `AddLogEntry` is bound (bind directory on the compile command, or `LOG` added to a bind directory outside the tree) is a build-owner question. — `ORD700.PGM.RPGLE:4`, `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`, `ATU_SRC/QILESRC/` (only `PAR201`, `PRO200`)

## Assumptions / unknowns

- Whether the `SAMLOG` deletion log is an observable a target must preserve (Phase A open question; SME decision).
- Whether the delete trigger is attached on the box (`c01`).
- `AddLogEntry` binding at compile time (above).

## Evidence

`ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4,8,59-61,72-82,95,101-109` · `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` · `ATU_SRC/QPROTOSRC/LOG.RPGLEINC:4-5` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:4,12-16,18-35,41-43` · `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:9,164-171,191` · `ATU_SRC/QDDSSRC/DETORD1.LF:5-7` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:159-162` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:224` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:249-270`
