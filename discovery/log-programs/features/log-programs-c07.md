# log-programs-c07 — The only log event in the tree is ORD700 on order-line delete

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — call graph; pointer card) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

A structural grep of `ATU_SRC/**` for `AddLogEntry` (case-insensitive) finds the prototype, the procedure and **one** call: `ORD700`, the `DETORD` `*AFTER *DELETE` trigger, event `'2'`. No other program, CL, trigger or SQL object logs anything: inserts and updates of `DETORD` (`ORD700` events `'1'`/`'3'`), the `ORDER` trigger `ORD701`, the maintenance screens, the batch program — none. The message is `'ORD700:Order Line deleted ' + %char(Old.odorid) + ' ' + %char(Old.odline) + ' article : ' + old.odarid + ' quantity : ' + %char(old.odqty)` — the *ordered* quantity (not the outstanding quantity that is subtracted right after), `ODARID` untrimmed (6 characters). The call is `callp(e)` and `%error` is never tested, so the log is a best-effort side effect of every in-tree delete (`ORD101` option `4`). The behaviour of the trigger itself is documented at **`ord-trigger-ord700-c03`** (documented, run 4) and is not re-derived here; this card records what the log receives.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:8` — `/COPY ../QPROTOSRC/LOG.RPGLEINC`
- `ORD700.PGM.RPGLE:76-81` — `when teven = '2'` / `eval po = %addr(parm1) + oldoff` / `callp(e) addlogEntry('ORD700:Order Line deleted ' + %char(Old.odorid) + ' ' + %char(Old.odline) + ' article : ' + old.odarid + ' quantity : ' + %char(old.odqty))`
- `ORD700.PGM.RPGLE:82` — `callp UpdArt(-Old.odqty + Old.odqtyliv:old.odarid)` — runs whether or not the log call failed
- `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` — `ADDPFTRG FILE(DETORD) TRGTIME(*AFTER) TRGEVENT(*DELETE) PGM(ORD700)`
- Absence: grep `ATU_SRC/**` for `addlogentry` (i) → `LOG.RPGLEINC:4`, `LOG300.RPGLE:18,19,35`, `ORD700.PGM.RPGLE:78` only; grep for `SAMLOG` → `LOG100:20`, `LOG300:4,41`, `SAMMNU.MENU:160` only

## Inputs / outputs / observables

- In (to the log): one `entry` per deleted `DETORD` row. Field widths: `ODORID` `6P 0` (`%char` → up to 6 digits, no leading zeros), `ODLINE` `5P 0`, `ODARID` `6A` (as stored, blank-padded), `ODQTY` `5S 0` (`%char` → digits, sign only if negative). — `ATU_SRC/QDDSSRC/DETORD.PF:6-12`, `ATU_SRC/QDDSSRC/SAMREF.PF:11,34,37,47`
- Out: one `SAMLOG` line `User: <*USER> * Date: <ts> * Msg: ORD700:Order Line deleted 123 1 article : ART001 quantity : 10 ***` (`c03`). — `LOG300.RPGLE:28-30`
- Observable: the line appears (or not — `c04`, `c06`) after each `ORD101` option-`4` delete; menu option 84 would show it (`c09`).

## Behaviour as implemented

1. Trigger buffer, old image mapped (`po`). — `ORD700.PGM.RPGLE:59-61,77`
2. Log call, `(e)` extender, result ignored. — `:78-81`
3. Quantity update proceeds regardless. — `:82`

## Validation rules found in code

None in the log path. The rule that a delivered line cannot be deleted lives in `ORD101` (`ORD101.PGM.RPGLE:164-171`; `ord-trigger-ord700-c03`).

## Edge cases found in code

- **The logged quantity is `ODQTY`, the subtracted quantity is `ODQTY − ODQTYLIV`.** In-tree they coincide (only undelivered lines can be deleted through `ORD101`); an external delete of a part-delivered line logs the ordered quantity and subtracts less. — `ORD700.PGM.RPGLE:78-82`
- **Every in-tree delete logs, every other change does not** — no audit of order creation, header changes, article or customer maintenance. The "application log" is a single event type. — `ORD700.PGM.RPGLE:72-95`, grep
- **Mass deletes** (external SQL, `CLRPFM` does not fire triggers) log one line per row with the trigger active — at ≈125 bytes per line the 5000-byte space is exhausted by ≈35 rows (`c04`). — `ORD700D.SYSTRG:4-7`
- **`ORD100` deletes during staging** hit the `QTEMP` copy with `TRG(*NO)` → no log (`ord-trigger-ord700-c03`, `ord-entry-ord100-c09`).

## Dependencies

- `ord-trigger-ord700-c03` (owner of the trigger behaviour), `ord-entry-ord101-c06` (the in-tree deleter)
- `c03` (line format), `c08` (how `ORD700` reaches `AddLogEntry`)

## Assumptions / unknowns

- None new. The needs-SME question "is the `SAMLOG` log an observable a target must preserve?" is already carried on `ord-trigger-ord700-c03` and was answered in practice by the ORD convert: the line text is written to a `samlog` table as-is (`modern/db/schema.sql:187-199`, `verification/ord-vertical/2026-09-09-r1/PARITY.yaml:96` — `c03` `TS_BOUNDARY_GREEN`, `as_is: true`). Not widened here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4,8,59-61,72-82,95` · `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` · `ATU_SRC/QDDSSRC/DETORD.PF:6-12` · `ATU_SRC/QDDSSRC/SAMREF.PF:11,34,37,47` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:18-20,28-30` · structural grep `ATU_SRC/**` for `addlogentry` (i) and `SAMLOG`
