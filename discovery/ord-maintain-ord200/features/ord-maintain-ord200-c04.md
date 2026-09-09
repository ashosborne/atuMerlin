# ord-maintain-ord200-c04 — Option 4 delete order and lines

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `4` (after the guards in `c08`: not closed, no line with `ODQTYLIV > 0`) deletes the `ORDER` header by key, then loop-deletes `DETORD` rows by partial key `ODORID` until none is left, clears the option and rewrites the subfile row. There is no confirmation, no commitment control, and the deleted row **stays on the screen with its data** — `ORD200` does not blank `ORID` / `ORYEAR` as `ORD201` does. Each line delete fires the `ORD700` delete trigger if attached; nothing maintains `CUSTOMER.CULASTORD` (`c12`, needs-SME).

## Entrypoints

- Legend `4=Delete` on `CTL01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:63`
- Guard: `s01chk` closed-order test (correctly applied to `4`) and the deliveries loop — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:187-212`
- Action: `s01act` `when opt01 = 4` — `ORD200.PGM.SQLRPGLE:229-235`

## Inputs / outputs / observables

- In: the row's `orid` (from the subfile buffer), `ORDER1` (`UF`, unique key `ORID`), `DETORD1` (`UF`, unique key `ODORID, ODLINE`). — `ORD200.PGM.SQLRPGLE:7-8`, `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
- Out (data): `ORDER` row removed; all `DETORD` rows with `ODORID = orid` removed. Per line, `ORD700` delete event → `UpdArt(-ODQTY + ODQTYLIV, ODARID)` and a log entry (`ord-trigger-ord700-c03`); since the guard requires `ODQTYLIV = 0` on every line, the full ordered quantity is subtracted from the article's customer-order quantity. — `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7`, `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82`
- Out (screen): option cleared, row rewritten with the same `ORID`, `ORYEAR`, dates and `SUMORD`; no message. — `ORD200.PGM.SQLRPGLE:234-235`

## Behaviour as implemented

1. Guard pass (`c08`): `opt01 = 4 and datclo > datBlank` → `SFLMSG` 36; then `setll orid detord1; reade(n) orid detord1` loop — first line with `odqtyliv > 0` → `SFLMSG` 37 "Order whith deliveries can not be deleted" (DDS literal, typo as-is), `leave`. The deliveries test reads the **file**, not a screen copy (contrast `ord-entry-ord101-c05`). — `ORD200.PGM.SQLRPGLE:187-212`, `ORD200D.DSPF:43-44`
2. Action: `delete orid order1` — keyed delete with no prior `chain`; not-found is not an exception (`%found` off) and is not tested. — `ORD200.PGM.SQLRPGLE:230`
3. `dou not %found(); delete orid detord1; enddo;` — `orid` alone is a partial key on `DETORD1` (`ODORID`), so each iteration deletes the first remaining line; `dou` runs the body at least once, so an order with no lines performs one not-found delete. — `ORD200.PGM.SQLRPGLE:231-233`
4. `opt01 = 0; update sfl01;` — the row keeps `orid`, `oryear`, `datord`, `datliv`, `datclo`, `sumord` as loaded. — `ORD200.PGM.SQLRPGLE:234-235`
5. Control returns to `s01act` for the next changed row (several `4`s in one pass are processed in sequence), then `step01 = dsp` redisplays **without reload**. — `ORD200.PGM.SQLRPGLE:220-224`

## Validation rules found in code

- Refused if `datclo > 1940-01-01` (closed) — message 36.
- Refused if any `DETORD` line has `ODQTYLIV > 0` — message 37.
- No confirmation prompt. No check that the header exists.

## Edge cases found in code

- **Ghost row.** After a delete the order is still displayed. Re-selecting it: `4` → guards pass (file has no lines; screen `datclo` unchanged) → not-found header delete, one not-found line delete, silent no-op. `5`/`6` → `ORD202` / `ORD500` called with a non-existent `orid` (their behaviour). `7`/`8` → `chain` misses, then `update forde` **without a locked record → unmonitored `RNX1221`-class exception** (`c06`, `c07`). `ORD201` avoids this by zeroing `orid`/`oryear` on the row. — `ORD200.PGM.SQLRPGLE:229-235,244-259` vs `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:233-241`
- **Header first, lines second** (`c13`). A failure between the two deletes — e.g. a `DETORD` row locked by another job (`delete` waits `WAITRCD`, then unmonitored exception) — leaves orphan lines with no header. `ORD201` does the reverse and would leave a header with fewer lines. No commitment control on the native I/O. — `ORD200.PGM.SQLRPGLE:230-233`
- **Header locked elsewhere.** `ord-entry-ord101-c02`: an `ORD101` session holds an update lock on the `ORDER` row for its duration; `delete orid order1` on that order waits and then fails unmonitored. Same for `7`/`8`.
- **Stale guard data.** The closed-order test uses the subfile's `datclo` as loaded; an order closed by another job after the load is still deletable here (the deliveries test, being a file read, is current). — `ORD200.PGM.SQLRPGLE:187`
- **Aggregates not maintained.** No trigger on `ORDER` delete: `CUSTOMER.CULASTORD` may keep the deleted order's date until `ART801` recomputes (`c12`, inferred, needs-SME; mechanism documented as `ord-trigger-ord700-c08`). `CUCREDIT` / `ARCUSQTY` are recomputed by `ART801` from open orders only. — `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-16`, `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-37`
- **Zero-line order** (possible after `ORD101` deletes the last line, `ord-entry-ord101-c06`): deletable; `SUMORD` shows 0.

## Dependencies

- `ORDER1.LF` / `ORDER.PF`; `DETORD1.LF` / `DETORD.PF` — `ORDER1.LF:4-6`, `DETORD1.LF:4-7`, `ATU_SRC/QDDSSRC/DETORD.PF:5-23`
- `ORD700D.SYSTRG` → `ORD700` (`ord-trigger-ord700`, documented) — cited only
- `ORD701.SQLTRG` (insert-only), `ART801.SQLPRC` (reconciliation) — cited only for `c12`

## Assumptions / unknowns

- needs-SME: no confirmation before a destructive delete — acceptable to carry forward? (Phase A question 3.)
- needs-SME: ghost row after delete and the `7`/`8`-on-ghost exception — known? Preserve `ORD200`'s screen behaviour or adopt `ORD201`'s?
- needs-SME (`c12`): stale `CULASTORD` after delete — confirm on the box.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7-8,187-212,220-235,244-259` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:43-44,63` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/DETORD.PF:5-23` · `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-16` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-37` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:233-241`
