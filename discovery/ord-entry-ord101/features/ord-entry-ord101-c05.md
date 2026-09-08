# ord-entry-ord101-c05 — Delete blocked when line has deliveries

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

In `s01chk`, option `4` on a row whose hidden subfile field `ODQTYLIV` is greater than 0 is rejected: the row is highlighted (`DSPATR(RI)`), `SFLMSG` 36 "Line with delivery can not be deleted." is shown, the page is repositioned to the first offending row and the whole pass is redisplayed without executing **any** option typed on that screen. The test reads the subfile row's copy of the delivered quantity, not the file.

## Entrypoints

- `s01chk`, second test in the `readc` loop — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:164-172`
- `SFLMSG('Line with delivery can not be deleted.' 36)` on `CTL01`; hidden `ODQTYLIV` on `SFL01` — `ATU_SRC/QDDSSRC/ORD101D.DSPF:26,40-41`

## Inputs / outputs / observables

- In: `OPT01 = 4`, hidden `ODQTYLIV` of the changed row (as loaded in `s01lod` or rewritten by `c03` / `c06`). — `ORD101.PGM.RPGLE:164`
- Out: indicator 34 (`dspatr_ri`) on for that row's `update sfl01`, indicator 36 (`sflmsg2`) on, `RRB01 = RRN01` of the first error row, `err01 = *on`, `step01 = dsp`. — `ORD101.PGM.RPGLE:165-171,173`
- Observable: message on the `CTL01` message line; row shown in reverse image with the `4` still typed; no line deleted **and no other option on the screen executed**.

## Behaviour as implemented

1. `s01chk` starts with `step01 = act; err01 = *off; sflnxtchg = *on` and `readc(e)`s every changed row. — `ORD101.PGM.RPGLE:150-154`
2. First test: option validity (`0`, `2`, `4`, `6` accepted) → `SFLMSG` 35 "Invalid Option" (`c07`). — `ORD101.PGM.RPGLE:155-163`, `ORD101D.DSPF:39`
3. Second test: `if opt01 = 4 and odqtyliv > 0` → `step01 = dsp`, `dspatr_ri = *on`, `sflmsg2 = *on`, and if it is the first error on the pass `rrb01 = rrn01`. — `ORD101.PGM.RPGLE:164-172`
4. `update sfl01` with `SFLNXTCHG` on (the row stays "changed" so it is re-read on the next Enter), `dspatr_ri` off, next `readc`. — `ORD101.PGM.RPGLE:173-176`
5. Because `step01` ends as `dsp` when any row failed, `s01act` is skipped for the whole pass: valid `2`s and `4`s on other rows wait until the operator clears or fixes the bad one. — `ORD101.PGM.RPGLE:78-93,150,165`

## Validation rules found in code

- `ODQTYLIV > 0` blocks delete. Equality with `ODQTY` (fully delivered) and partial delivery are treated the same; `ODQTYLIV < 0` (possible via `c04`) does **not** block.

## Edge cases found in code

- **Value tested is the subfile copy.** After an edit (`c03`) the row is rewritten with the new `ODQTYLIV`, so the guard follows the edit. It cannot see a delivery made by another job after the load (the order-level deliver `ORD200` / `ORD201` option 8 sets `ODQTYLIV = ODQTY`), so a `4` typed on a stale screen passes the guard and `c06` deletes a delivered line. `F5` reloads. — `ORD101.PGM.RPGLE:105-120`, `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:266-276`
- **Both messages at once.** Indicators 35 and 36 are independent; an invalid option on one row and a blocked `4` on another light both `SFLMSG`s on the same display (`ERRSFL` is on the file). — `ORD101D.DSPF:9,39-41`
- **Reset of 34/35/36.** `dspatr_ri` is set off after each `update`; `sflmsg` / `sflmsg2` are never set off in RPG — `SFLMSG('…' 36)` uses the same indicator as option and response indicator, the DDS idiom by which the display resets it on input (runtime semantics, same note as `ord-entry-ord100-c06`). — `ORD101.PGM.RPGLE:174`, `ORD101D.DSPF:39-41`
- **Mirror at order level.** `ORD200` / `ORD201` option 4 (delete the whole order) walks the lines and refuses with their `SFLMSG` 37 "Order whith deliveries can not be deleted" if any `ODQTYLIV > 0` — same rule, read from the file there. — `ORD201.PGM.SQLRPGLE:200-216`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:47`
- **Already-deleted row (`c06`).** The blanking in `s01act` leaves hidden `ODQTYLIV` / `ODTOTVAT` untouched, so a second `4` on a blanked row of a delivered line is still refused — for a line that no longer exists.

## Dependencies

- Subfile hidden field `ODQTYLIV` (`REFFLD(FDETO/ODQTYLIV)`) — `ORD101D.DSPF:26`
- `SFLNXTCHG(33)` / `readc` mechanics — `ORD101D.DSPF:14`, `ORD101.PGM.RPGLE:47,152-153,177`
- Message text is a DDS literal (not `SAMMSGF`). — `ORD101D.DSPF:40-41`

## Assumptions / unknowns

- needs-SME: should partially delivered lines be deletable in the target (as-is: no), and should the guard read the file rather than the screen copy?

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:47,78-93,105-120,150-177` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:9,14,26,39-41` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:200-216,266-276` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:47`
