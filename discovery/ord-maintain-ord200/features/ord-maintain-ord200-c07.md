# ord-maintain-ord200-c07 — Option 8 deliver order

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — lifecycle rule) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `8` chains the `ORDER` header for update, sets `ORDATDEL` = today unconditionally, then walks the order's `DETORD` lines with update locks: a line with `ODQTYLIV = 0` gets `ODQTYLIV = ODQTY` and is rewritten (firing `ORD700` update per line); a line already partly or fully delivered is left as is and unlocked. The order is **not** closed. Refused when the row already shows a delivery date — with the generic `Invalid Option` message. Because `7` also stamps `ORDATDEL`, a closed order can never be delivered afterwards.

## Entrypoints

- Legend `8=Deliver` on `CTL01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:83`
- Guard: `s01chk` `… or opt01 = 8 and datliv > datBlank` → `sflmsg` (35) — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:177-186`
- Action: `s01act` `when opt01 = 8` — `ORD200.PGM.SQLRPGLE:255-272`

## Inputs / outputs / observables

- In: row `orid`; `ORDER1` (`UF`); `DETORD1` (`UF`, partial key `ODORID`); fields `ODQTY`, `ODQTYLIV` (`5 0`). — `ORD200.PGM.SQLRPGLE:7-8`, `ATU_SRC/QDDSSRC/DETORD.PF:10-15`
- Out (data): `ORDATDEL = %dec(%date():*iso)`, `update forde`; for each line with `ODQTYLIV = 0`: `ODQTYLIV = ODQTY`, `update fdeto`. `ORDATCLO` untouched. — `ORD200.PGM.SQLRPGLE:257-270`
- Trigger effect per rewritten line (`ORD700U`, `teven = '3'`, same article): `UpdArt((new.odqty - old.odqty) - (new.odqtyliv - old.odqtyliv))` = `-ODQTY` → article outstanding quantity reduced by the full line (`ord-trigger-ord700-c04`). Lines skipped by the `else` branch fire nothing. — `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:83-93`
- Out (screen): `datliv = %date()`; option cleared; row rewritten; "Delivery" column shows today. — `ORD200.PGM.SQLRPGLE:258,271-272`

## Behaviour as implemented

1. Guard on the **subfile copy** of `datliv` (`> 1940-01-01` → refused with `Invalid Option`). — `ORD200.PGM.SQLRPGLE:177-186`, `ORD200D.DSPF:40`
2. `chain (orid) order1` — `%found` not tested; `ordatdel = today; datliv = %date(); update forde;`. — `ORD200.PGM.SQLRPGLE:256-259`
3. `setll orid detord1; reade orid detord1;` — **with lock** (no `(n)`), unlike the `c08` guard reads. Loop to `%eof`: `if odqtyliv = 0 → odqtyliv = odqty; update fdeto; else → unlock detord1;` then `reade`. — `ORD200.PGM.SQLRPGLE:260-270`
4. `opt01 = 0; update sfl01;` — no reload; `SUMORD` unchanged (delivery does not alter `ODTOT`/`ODTOTVAT`). — `ORD200.PGM.SQLRPGLE:271-272`
5. After an `8`, the row refuses `8` again; `7` remains allowed (closes without changing `ORDATDEL`, since it is non-zero); `4` is refused by the deliveries test once any line has `ODQTYLIV > 0`; `2` refused (`c09`).

## Validation rules found in code

- Refused if `datliv > 1940-01-01` — message 35.
- No check that the order is open, that it has lines, or that the header exists. No partial-delivery input: the operation is all-or-nothing per undelivered line.

## Edge cases found in code

- **Partially delivered lines are frozen.** A line with `0 < ODQTYLIV < ODQTY` (set per line in `ORD101`, `ord-entry-ord101-c03`) is skipped, so after "deliver" the order may still carry outstanding quantity while the header says delivered. The header date is set regardless of line state.
- **Zero-quantity lines.** `ODQTY = 0` and `ODQTYLIV = 0` → `ODQTYLIV = 0`, `update fdeto` still runs (trigger delta 0 → `ord-trigger-ord700-c05` silent no-op).
- **Deliver after close impossible.** `7` sets `ORDATDEL` when blank, so a closed order always fails the `8` guard; the only route to "delivered quantities" on a closed order is per line via `ORD101` reached from `ORD201` (`ord-entry-ord101-c12`).
- **Delivered but open.** `8` leaves `ORDATCLO = 0`, so `ART801` still counts the order in `CUCREDIT` / `ARCUSQTY` (filter `ORDATCLO = 0`) although the trigger path has already reduced the article quantity — the same trigger-vs-batch divergence as `c06`, mirrored. — `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`
- **Chain miss → exception** on a ghost row (`c04`) or an order deleted elsewhere: `update forde` without a locked record, unmonitored. — `ORD200.PGM.SQLRPGLE:256-259`
- **Locks.** Header `chain` and each `reade` on `DETORD1` wait for locks held by other jobs (an `ORD101` session holds the header, `ord-entry-ord101-c02`); a timeout is unmonitored. Skipped lines are explicitly unlocked; rewritten lines are released by the `update`.
- **Stale guard.** An order delivered by another job after the load passes the screen-copy guard; `chain` then re-reads and `ORDATDEL` is overwritten with today; lines already at `ODQTYLIV = ODQTY` are skipped, so the data effect is limited to the header date.
- **Identical in `ORD201`.** — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:181-190,261-278`

## Dependencies

- `ORDER1.LF` / `ORDER.PF`; `DETORD1.LF` / `DETORD.PF` — `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `ORDER.PF:11-12`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`, `DETORD.PF:10-15`
- `ORD700U.SYSTRG` → `ORD700` (`ord-trigger-ord700-c04`, documented) — cited only
- `ART801.SQLPRC` — cited only

## Assumptions / unknowns

- needs-SME: "deliver" = set every untouched line to fully delivered, skip partial lines, do not close — intended business rule? Should the target offer partial delivery at order level or require `ORD101`?
- needs-SME: header delivered while lines remain outstanding (partial lines) — accepted state today?
- Trigger attachment on the box (`ORD700U`) is inferred from `QTRGSRC`; owned by `ord-trigger-ord700`.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7-8,177-195,255-272` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:40,83` · `ATU_SRC/QDDSSRC/ORDER.PF:11-12` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD.PF:10-15` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:83-93` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:181-190,261-278`
