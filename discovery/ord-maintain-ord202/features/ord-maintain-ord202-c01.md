# ord-maintain-ord202-c01 — Order header display with sentinel dates

| | |
| --- | --- |
| Slice | `ord-maintain-ord202` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD202(id)` chains `ORDER1` by the order id it is given, then `CUSTOME1` by the order's `ORCUID`, converts the three `8 0` ISO dates to `L` fields and shows them in `dd/mm/yy` (`DATFMT(*DMY)`) on the `CTL01` header: order id/year, customer id/name, creation, delivery and close dates. Delivery and close are converted only when `> 0` and otherwise keep the `*inzsr` preset `1940-01-01`, which the DSPF maps to blanks; the **creation date is converted unconditionally**. Neither `chain` tests `%found`: an order id that does not exist (the ghost `orid` both list twins can pass after a delete) leaves `ORDATE` at `0`, and `%date(0:*iso)` raises an **unmonitored date exception** before anything is displayed.

## Entrypoints

- Program entry `ORD202`, one parameter `id` (`like(orid)`, `6P 0`, by reference) — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:16-19`
- Panel 1 state machine `pnl01` → `s01prp` (header) → `s01lod` → `s01dsp` (`exfmt ctl01`) → `s01key` → `s01act`, one step per RPG cycle iteration until `pnl00` sets `*inlr` — `ORD202.PGM.RPGLE:60-80,153-155`
- Header fields on `CTL01` rows 2–6 — `ATU_SRC/QDDSSRC/ORD202D.DSPF:50-63`
- Callers: `ORD200` / `ORD201` option 5 (`c04`)

## Inputs / outputs / observables

- In: `id` (never written back); `ORDER1` record (`FORDE`: `ORID`, `ORYEAR`, `ORCUID`, `ORDATE`, `ORDATDEL`, `ORDATCLO` — the three dates are `8 0` numeric ISO); `CUSTOME1` record (`FCUST`: `CUID`, `CUSTNM`). — `ORD202.PGM.RPGLE:7,10,83-84`, `ATU_SRC/QDDSSRC/ORDER.PF:5-14`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-7`
- Out (screen, `CTL01`, all output-only): row 2 `Order . . .` `ORID` (`EDTCDE(Z)` via `REFFLD`) `ORYEAR`; row 3 `Customer  .` `CUID` (`EDTCDE(Z)`) `CUSTNM` (30); row 4 `Création  .` `DATORD` (`L`, `DATFMT(*DMY)`, **no `MAPVAL`**); row 5 `Delivery  .` `DATLIV` and row 6 `Close . . .` `DATCLO` (both `DATFMT(*DMY)`, `MAPVAL(('01/01/40' *BLANK))`). Row 1: panel id `'ORD202-1'` (blue), title `'Display a Customer Orders'`, `DATE` (`EDTCDE(Y)`) and `TIME` at 1/68, 2/68. — `ORD202D.DSPF:42-63`, `ATU_SRC/QDDSSRC/SAMREF.PF:15-17,24,34-36,68`
- No writes: all four files are `if` (input only); the display file is the only `cf`. — `ORD202.PGM.RPGLE:7-11`

## Behaviour as implemented

1. `*inzsr` presets `datord`, `datclo`, `datliv` to the constant `datBlank = d'1940-01-01'`. — `ORD202.PGM.RPGLE:58,147-151`
2. `s01prp`: `chain id order1` (key `ORID`, `UNIQUE`), then `chain orcuid custome1` (key `CUID`, `UNIQUE`); `%found` is not tested after either. — `ORD202.PGM.RPGLE:83-84`, `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`
3. `datord = %date(ordate:*iso)` — unconditional. `if ordatdel > 0` → `datliv = %date(ordatdel:*iso)`; `if ordatclo > 0` → `datclo = %date(ordatclo:*iso)`. A zero delivery/close date therefore leaves the field at `1940-01-01` by *not assigning it* (the "implicit sentinel" recorded by `dat-utils-c01`): it relies on `*inzsr` having run, which holds because every call ends with `*inlr` (`c03`). — `ORD202.PGM.RPGLE:85-91,154`
4. `RRN01 = 0`; `SFLCLR` write of `CTL01`; `step01 = lod` (lines, `c02`). The header fields are sent to the display with the `exfmt ctl01` in `s01dsp` after the lines are loaded. — `ORD202.PGM.RPGLE:92-96,122`
5. On the screen `1940-01-01` under `*DMY` is `01/01/40`, which is exactly the `MAPVAL` literal on `DATLIV`/`DATCLO` — so an undelivered / open order shows blank delivery / close lines. `DATORD` has no `MAPVAL` and would show `01/01/40` for a zero creation date — but see the edge case: a zero `ORDATE` never gets that far. — `ORD202D.DSPF:56-60`

## Validation rules found in code

None. There is no existence check on the order, no check on the customer, no check that `ORDATE` is a valid date, and no message is ever issued by this program (`SFLMSG` indicator 35 is declared and never set; `ERRSFL` unused). — `ORD202.PGM.RPGLE:34`, `ORD202D.DSPF:11,41`

## Edge cases found in code

- **Not-found order id → unmonitored exception, no screen.** With `%found` untested, a `chain` miss leaves the `FORDE` fields at their initial values (`ORDATE = 0` on a fresh call — every call is fresh, `c03`). `%date(0:*iso)` is invalid (`00000000`) → RPG status 00112 "Date, Time or Timestamp value is not valid", no `monitor` / `(e)` / `*PSSR` in the program → the default handler (inference from ILE RPG semantics: an `RNQ0112` inquiry message in an interactive job). Nothing has been displayed yet. Both callers can produce this: `ORD201` blanks the deleted row to `orid = 0` and `ORD200` leaves the deleted order's id on the row; option `5` on either ghost row calls `ORD202` with an id `ORDER1` no longer has (`ord-maintain-ord201-c04`/`c05`, `ord-maintain-ord200-c04`/`c05`). `ORD500` has the same unguarded conversion (`ORD500.PGM.RPGLE:31-32`; `ord-print-ord500`, queued). — `ORD202.PGM.RPGLE:83,85`
- **Zero or invalid stored `ORDATE` → same exception.** No in-tree writer stores `ORDATE = 0` (`ORD100:194` writes today's date; `ORD901:21` shifts an existing date), so in-tree data never hits this, but an order that does would list normally in `ORD200`/`ORD201` (`ISOTODATE40(0)` → `1940-01-01`, `dat-utils-c01`) and fail on option `5`. A non-zero invalid `ORDATDEL`/`ORDATCLO` (e.g. `20161301`) passes the `> 0` guard and fails the same way; the guard is a zero test, not a validity test. — `ORD202.PGM.RPGLE:85-91`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194`, `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21`
- **Missing customer → blank customer line, no message.** A `CUSTOME1` miss leaves `CUID = 0` (shown blank by `EDTCDE(Z)`) and `CUSTNM` blank. Such an orphaned order is not reachable through either list (the `ORDERCUS` inner join drops it — `ord-maintain-ord201-c01`), only through a direct `CALL ORD202`. — `ORD202.PGM.RPGLE:84`, `ORD202D.DSPF:54-55`
- **Two-digit years.** `DATFMT(*DMY)` shows every date as `dd/mm/yy`; `2016-12-01` is `01/12/16`. The list twins use `DATFMT(*JOB)` with the `MAPVAL` literal `'1940-01-01'` — the three ORD screens do not share a date presentation. `*DMY` is a 2-digit-year format whose range is 1940-01-01 … 2039-12-31 (the `*LOVAL`/`*HIVAL` that `dat-utils-c01` identifies as the two sentinels); a date outside it cannot be presented in this field (DDS contract; no in-tree producer). — `ORD202D.DSPF:56-60`, `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-27`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-30`
- **The id parameter is trusted and never echoed back.** `ORID`/`ORYEAR` on the header come from the `FORDE` record buffer, not from `id`; on a miss they show blank (`EDTCDE(Z)` on `0`) — moot, because the exception fires first. — `ORD202.PGM.RPGLE:16-19`, `ORD202D.DSPF:51-52`
- **Sentinel constant declared a fourth time.** `d'1940-01-01'` is declared independently in `ORD200`, `ORD201`, `CUS200` and here (plus `DAT002`); no shared definition. Here it is only ever a preset (never compared). — `ORD202.PGM.RPGLE:58`, `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:89`, `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:46`
- **Dead declarations.** `User` (`inz(*user)`), `count`, `mode`, `crt`, `upd`, `chk`, `rrs01`, `err01` and the indicators `help`, `prompt`, `refresh`, `create`, `morekeys`, `pagedown`, `sflnxtchg`, `dspatr_ri`, `sflmsg` are declared and never referenced (`c05` for the key indicators). `ORYEAR` and `CUSTNM` are never referenced in calculations — they reach the screen straight from the record buffers via the shared field names. — `ORD202.PGM.RPGLE:21,23-28,32-34,41-42,46-48,50-51,56`

## Dependencies

- `ORDER1.LF` (`UNIQUE`, `K ORID`) over `ORDER.PF`; `CUSTOME1.LF` (`UNIQUE`, `K CUID`) over `CUSTOMER.PF` — `ORDER1.LF:4-6`, `CUSTOME1.LF:4-6`
- `ORD202D.DSPF` `CTL01` header fields; `REFFLD` to `ORDER` and `CUSTOMER` (via `SAMREF`) — `ORD202D.DSPF:50-60`
- Compile: `dftactgrp(*no) bnddir('SAMPLE')`. No service-program procedure is called, so the binding directory resolves nothing (`c06`). Activation group inferred `QILE` (no `ACTGRP` keyword) — build owner to confirm. — `ORD202.PGM.RPGLE:5`

## Assumptions / unknowns

- The exception surface (status 00112 → `RNQ0112` inquiry) is stated from ILE RPG runtime semantics; the source shows only the unguarded `%date` and the absence of any handler. Runtime-confirmable.
- needs-SME: the target must decide what "display order" does for an id that no longer exists (the legacy answer is an exception). Room question for the ORD pack; not fixed here.
- needs-SME (with `dat-utils`): the bind's date lock (`NULL` in Postgres, sentinel only at the boundary) means the target header shows blank for a `NULL` delivery/close date — the same observable as here; `ORDATE` has no sentinel path in this program.

## Evidence

`ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:5,7-11,16-19,21-28,32-34,41-42,46-48,50-51,56,58,60-80,82-96,122,147-155` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:11,41-63` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-7` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:15-17,24,34-36,68` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:31-32` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:89` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:46` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-27` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:23-30`
