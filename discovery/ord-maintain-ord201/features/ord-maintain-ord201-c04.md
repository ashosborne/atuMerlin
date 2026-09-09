# ord-maintain-ord201-c04 — Option 4 delete lines then header

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `4` — after the guards (not closed by the screen `datclo`; no `DETORD` line with `ODQTYLIV > 0` by live file read, `c07`) — deletes the order's **lines first** (`dou not %found / delete orid detord1` by partial key until none) and **then the header** (`delete orid order1`, not-found untested), then zeroes `orid`/`oryear` in the subfile row so the row shows a blank order number and year. No confirmation, no commitment control. `ORD200` deletes header first and leaves the row as loaded (`ord-maintain-ord200-c13` carries the twin comparison).

## Entrypoints

- Legend `4=Delete` on `CTL01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:65`
- Guards: `s01chk` closed test (36) and deliveries test (37) — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:191-216`
- Action: `s01act` `when opt01 = 4` — `ORD201.PGM.SQLRPGLE:233-241`

## Inputs / outputs / observables

- In: row `orid`; `DETORD1` (`UF`, keys `ODORID`, `ODLINE`), `ORDER1` (`UF`, key `ORID`). — `ORD201.PGM.SQLRPGLE:7,10`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`, `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`
- Out (data): every `DETORD` row with `ODORID = orid` deleted, then the `ORDER` row. Each line delete fires `ORD700` (`*AFTER *DELETE`, if attached): `UpdArt(-ODQTY + ODQTYLIV)` = `-ODQTY` since the guard ensured `ODQTYLIV = 0`, plus a `SAMLOG` entry (`ord-trigger-ord700-c03`). No `ORDER` delete trigger exists under `ATU_SRC` (`ORD701` is after-insert only). — `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7`, `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82`, `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-6`
- Out (screen): `orid = 0; oryear = 0; opt01 = 0; update sfl01` — `ORID` (`EDTCDE(2)`) and `ORYEAR` (`EDTCDE(Z)`) display blank; `DATORD`, `SUMORD`, `DATLIV`, `DATCLO`, `CUID`, `CUSTNM` keep the deleted order's values. No message, no reload. — `ORD201.PGM.SQLRPGLE:238-241`, `ORD201D.DSPF:19-22`

## Behaviour as implemented

1. `dou not %found(); delete orid detord1; enddo;` — keyed delete by the first key field only (partial key `ODORID`); each iteration deletes the first remaining line; `%found()` (no file operand → last operation) goes off when none is left. Zero lines → one not-found delete, loop ends. — `ORD201.PGM.SQLRPGLE:234-236`
2. `delete orid order1;` — `%found` **not tested**; a not-found delete is not an exception. — `ORD201.PGM.SQLRPGLE:237`
3. `orid = 0; oryear = 0; opt01 = 0; update sfl01;` — row rewritten; `rrn01` still points at it. — `ORD201.PGM.SQLRPGLE:238-241`
4. `step01` stays `act` → next changed row on the next cycle (several `4`s on one pass are all executed, one per cycle).

## Validation rules found in code

- Refused if the screen `datclo > 1940-01-01` (36) or if any `DETORD` line of the order has `ODQTYLIV > 0` (37, read with `reade(n)` — no lock, live file) — both in `c07`. The two tests are not exclusive; a closed order with deliveries raises both.
- No confirmation prompt. No check that the header exists.

## Edge cases found in code

- **Ghost row is cosmetic, not a guard.** Re-selecting the blanked row: `4` → `setll 0 detord1` / `reade(n) 0` finds no lines (unless an order `0` exists), `delete 0 detord1` and `delete 0 order1` are silent not-founds → no-op. `5`/`6` → `ORD202(0)` / `ORD500(0)` (callee `chain` miss — their slices). `7`/`8` → `chain (0) order1` misses, `%found` untested, `update forde` without a locked record → **unmonitored exception**, program ends abnormally. The row's `datclo`/`datliv` copies still carry the deleted order's dates, so the `7`/`8` guards behave as for that order. — `ORD201.PGM.SQLRPGLE:200-216,233-241,250-265`
- **Failure residue is header-without-lines.** No commitment control. If the header delete fails after the lines are gone — e.g. the header is locked by an open `ORD101` session (`ord-entry-ord101-c02`) and `WAITRCD` expires — the `ORDER` row survives with no `DETORD` rows: still listed by `ORDERCUS` with `TOTVAL = 0`, still counted by `ART801` as an open order (no lines → no aggregate contribution), deletable again later. `ORD200` (header first) leaves the opposite residue — orphan lines. Which twin is the parity reference is a room question (`ord-maintain-ord200-c13`). — `ORD201.PGM.SQLRPGLE:234-237` vs `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:229-235`
- **Line delete waits on line locks, not the header lock.** `delete orid detord1` locks each line as it goes; a line held by another job (an `ORD101` edit in progress on that line) blocks with `WAITRCD` and then fails unmonitored — after the earlier lines are already gone. — `ORD201.PGM.SQLRPGLE:235`
- **Trigger effects are per line.** `ORD700` subtracts the outstanding quantity per deleted line and logs each; a failure part-way leaves the article aggregates partially adjusted (no rollback). `CUSTOMER.CULASTORD` is not maintained on delete (`ord-trigger-ord700-c08`; `ord-maintain-ord200-c12` needs-SME) — the same consequence applies here but was not raised as a candidate for this slice. — `ORD700.PGM.RPGLE:76-82`
- **Delete of a zero-quantity line.** A line with `ODQTY = 0` passes the guard and is deleted with a zero `UpdArt` delta (`ord-trigger-ord700-c05`).
- **Row order on screen after blanking.** The blank row stays in its sorted position; `SUMORD` still shows the old value under "Value" — visually a row with a total and no order number.

## Dependencies

- `ORDER1.LF` / `ORDER.PF`, `DETORD1.LF` / `DETORD.PF` — `ORDER1.LF:4-6`, `ATU_SRC/QDDSSRC/ORDER.PF:5-14`, `DETORD1.LF:4-7`, `ATU_SRC/QDDSSRC/DETORD.PF:5-23`
- `ORD700D.SYSTRG` → `ORD700` (`ord-trigger-ord700`, documented; attachment on the box inferred there) — cited only

## Assumptions / unknowns

- needs-SME: no confirmation before a destructive delete — carry forward or not? (Phase A question 3; same for `ORD200`.)
- needs-SME / room: lines-first (`ORD201`) vs header-first (`ORD200`) — one transactional delete in the target removes both residues; which screen behaviour (blank row vs row as loaded) is the reference?
- `%found()` without a file name refers to the most recent file operation; stated from the RPG contract.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:7,10,191-216,233-241,250-265` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:19-22,65` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/DETORD.PF:5-23` · `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-6` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:229-235`
