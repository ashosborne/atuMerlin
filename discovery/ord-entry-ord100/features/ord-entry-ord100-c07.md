# ord-entry-ord100-c07 — Confirm writes ORDER header and DETORD lines

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`F8` (after `s01chk` passes, `c06`) allocates the next order number from data area `LASTORDNO` (`IN *LOCK` → `+1` → `OUT`), writes one `ORDER` row (`ORID`, `ORYEAR = *year`, `ORCUID`, `ORDATE = today as yyyymmdd`, delivery and close dates `0`), then copies every staged row from `QTEMP/DETORD` to the real `DETORD`, setting `ODORID` and renumbering `ODLINE` `1..n` in staged-key order. **`ODYEAR` is never assigned and is written as `0`.** No commitment control: header first, then lines, each write independent. Then print + acknowledgement (`c08`). An order with zero lines can be confirmed.

## Entrypoints

- `F8` → `s01key` `other` → `s01chk` → `s01act` `if confirm` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:151-153,187-213`
- `CTL01` `CF08(08 'Confirm')` — `ATU_SRC/QDDSSRC/ORD100D.DSPF:32`
- Files: `forder o e disk` (output, unkeyed), `fdetord o e k disk` (output) — `ORD100.PGM.RPGLE:10-11`; data area `Ordno 6s 0 DTAARA('LASTORDNO')` — `ORD100.PGM.RPGLE:56`

## Inputs / outputs / observables

- In: staged rows in `TMPDETORD`; `ORCUID` from `c01`; `LASTORDNO` current value.
- Out:
  - `LASTORDNO` := old + 1 (6 0; source seeds it at `60719`). — `ATU_SRC/QDTASRC/LASTORDNO.DTAARA:8`
  - `ORDER` row: `ORID` (6P 0) = new number, `ORYEAR` (4P 0) = `*year`, `ORCUID`, `ORDATE` (8 0) = `%dec(%date():*iso)` → `yyyymmdd`, `ORDATDEL = 0`, `ORDATCLO = 0`. That is every field of `FORDE`. — `ORD100.PGM.RPGLE:192-197`, `ATU_SRC/QDDSSRC/ORDER.PF:5-14`
  - `DETORD` rows: `ODORID = ORID`, `ODLINE = 1..n`, `ODARID`, `ODQTY`, `ODPRICE`, `ODTOT`, `ODTOTVAT` copied from the staged row; `ODYEAR = 0`, `ODQTYLIV = 0` (as staged, `c03`). — `ORD100.PGM.RPGLE:198-207`, `ATU_SRC/QDDSSRC/DETORD.PF:6-20`
- Observable side effects (if triggers are attached on the box — `c11`, needs-SME, owned by `ord-trigger-ord700`): `ORD701` after-insert on `ORDER` (`CUSTOMER.CULASTORD`), `ORD700` after-insert on each `DETORD` row.

## Behaviour as implemented

1. `in *lock ordno; ordno += 1; out ordno;` — the data area is read with a lock, incremented and written back (the `OUT` releases the lock). — `ORD100.PGM.RPGLE:189-191`
2. Header fields set (`ORID`, `ORYEAR`, `ORDATE`, `ORDATDEL`, `ORDATCLO`; `ORCUID` already holds the customer) and `write forde`. — `ORD100.PGM.RPGLE:192-197`
3. `odorid = orid; setll *loval tmpdetord; read tmpdetord; count = 0;` then for each staged row: `odorid = orid; count += 1; odline = count; write fdeto; read tmpdetord`. Because `TMPDETORD` and `DETORD` share the `FDETO` field names, all other columns pass through unchanged. — `ORD100.PGM.RPGLE:198-208`
4. Rows are read in the staging file's key order `(ODLINE, ODORID, ODYEAR)` = ascending staged line number, so the final `1..n` preserves entry order with the gaps of `c12` closed. — `DETORD.PF:21-23`
5. `prtOrd(orid); exfmt fmt03; panel = 0; leavesr` (`c08`). — `ORD100.PGM.RPGLE:209-212`

## Validation rules found in code

None: no check that at least one line exists, that the customer exists, or that totals are non-zero. `s01chk` only blocks pending row options (`c06`).

## Edge cases found in code

- **`ODYEAR` = 0.** Nothing in `ORD100` assigns `ODYEAR`; the only writer of that column under `ATU_SRC` is the batch `ORD901`, which sets `odyear = oryear` where they differ — i.e. the as-is design relies on a later batch repair (slice `ord-batch-ord900`, deferred by bind; pointer only). `ODYEAR` is also the third key field of `DETORD`. — `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:42-45`, `DETORD.PF:7,23`
- **No commitment control.** No `COMMIT` on the F-specs; a failure after `write forde` leaves a header with 0..k lines and a consumed order number. Unmonitored I/O → RPG inquiry message. — `ORD100.PGM.RPGLE:10-12`
- **Zero-line order.** `F8` on an empty list writes a header and no lines; `ORD500` then prints an order with no detail (`c08`).
- **Header before lines.** `ORD701` (if attached) sees the header before any line exists; `ORD700` fires once per line.
- **Number allocation is not rolled back** on later failure or on `F3` — but `F3` never reaches this code, so abandoned orders do not consume numbers (`c13`).
- **Sizes.** `LASTORDNO` is `6 0` and `ORID` `6P 0`; `999999 + 1` would be an unmonitored size error (theoretical). `count` is `3 0` → a 1,000th staged line would overflow at renumbering (theoretical). — `ORD100.PGM.RPGLE:56,62`, `ATU_SRC/QDDSSRC/SAMREF.PF:34-36`
- `ORDER` is opened output-only and unkeyed; duplicate `ORID` is not checked here (uniqueness, if any, is a file-level fact on the box — `ORDER1.LF` not read by this program).
- `TMPDETORD` is not cleared after confirm; the rows stay in `QTEMP` until the next wrapper run or job end (`c02`).

## Dependencies

- `LASTORDNO` data area — `LASTORDNO.DTAARA:8`
- `ORDER.PF:5-14`, `DETORD.PF:5-23`, `SAMREF.PF:34-39,68-69` (`ORID`, `ODLINE`, `YEAR` sizes)
- `ORD500` (`c08`); triggers `ORD700A.SYSTRG:4-7`, `ORD701.SQLTRG:5-16` (pointer, `c11`)
- `ORD901.PGM.SQLRPGLE:42-45` (pointer: `ODYEAR` backfill lives in the deferred batch slice)

## Assumptions / unknowns

- Phase A open question stands: is a partially written order an accepted failure mode today? (needs-SME)
- Whether `LASTORDNO` is the single source of order numbers or a demo convenience (Phase A `SME_BRIEF` question 2; `ORD900` resets it — deferred slice).
- Whether `ODYEAR = 0` between confirm and the next `ORD901` run matters to any reader (readers under `ATU_SRC` key `DETORD1` by `ODORID, ODLINE`, not `ODYEAR` — `ATU_SRC/QDDSSRC/DETORD1.LF:6-7`).

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-12,56,62,151-153,187-213` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:32` · `ATU_SRC/QDTASRC/LASTORDNO.DTAARA:8` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/DETORD.PF:5-23` · `ATU_SRC/QDDSSRC/DETORD1.LF:6-7` · `ATU_SRC/QDDSSRC/SAMREF.PF:34-39,68-69` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:42-45` · `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-16`
