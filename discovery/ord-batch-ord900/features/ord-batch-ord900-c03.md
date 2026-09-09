# ord-batch-ord900-c03 — `ORD901`: shift every order's `ORDATE` forward by `days = today − MAX(ORDATE)` so the newest order is dated today, recompute `ORYEAR` from the shifted date; relative spacing preserved, idempotent on a same-day rerun, sign follows the data

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

After the empty-file guard (`c02`), `ORD901` computes one offset for the whole file: `days = %diff(%date() : %date(lastdate:*iso) : *d)` — today minus the latest order date, in days, `5 0`. It then reads `ORDER` in arrival sequence and, for every row, sets `ordate = %dec(%date(ordate:*iso) + %days(days) : *iso)` and `oryear = %subdt(%date(ordate:*iso) : *Y)`, then `update forde`. Every order moves by the same number of days, so the gaps between orders are unchanged and the most recent order comes to rest on today. Run twice on the same day the second pass computes `days = 0` and rewrites each row with its own values. If the latest order is *in the future* relative to the job date, `days` is negative and the whole file moves **backwards** — the code has no sign check. Any `ORDATE` that is not a valid `yyyymmdd` (0, or a malformed value) raises `RNQ0112` on `%date(ordate:*iso)` and, unhandled, stops the program mid-file (`c06` describes what that leaves behind). `ORYEAR` is derived, never read as an input; `ORDER3.LF` (`K ORDATE, ORID`) has no reader in the tree, so nothing depends on the old date order.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:16-21` — `today`, `days`, `lastdate` (see `c09`), first `read order`, loop head, the `ORDATE` assignment
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:38-41` — `oryear = %subdt(…:*Y)`, `update forde`, `read order`, `ENDDO`

## Inputs / outputs / observables

- In: `ORDER.ORDATE 8 0` (numeric ISO date, written by `ORD100:194` as today's date at confirm), `MAX(ORDATE)` from `c02`, the job date (`%date()`). — `ATU_SRC/QDDSSRC/ORDER.PF:9`; `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194`
- Out: `ORDATE := ORDATE + days`, `ORYEAR := year(ORDATE)` for every row (`ORYEAR 4P 0` via `SAMREF` `YEAR`). — `ORD901.PGM.SQLRPGLE:21,38-39`; `ORDER.PF:7`; `SAMREF.PF:68`
- Observable: `ORD200` / `ORD201` lists (`ORDERCUS` → `ISOTODATE40(ORDATE)`), `ORD202` detail, the `ORD500` print (`datord = %date(ORDATE:*iso)`, `ORYEAR` printed) — all show the shifted dates; the newest order shows today. — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:32`; `ATU_SRC/QDDSSRC/ORD500O.PRTF:48-49`

## Behaviour as implemented

1. **Offset.** `today = %dec(%date():*iso)` (8-digit `yyyymmdd`); `days = %diff(%date() : %date(lastdate:*iso) : *d)` — first operand minus second: positive when the newest order is in the past. `days` is `5 0` (max 99 999 days ≈ 273 years). — `ORD901.PGM.SQLRPGLE:7-8,16-17`
2. **`lastdate` is then overwritten** with `today − 10 days` for use in `c04` (`c09` — the trap). — `ORD901.PGM.SQLRPGLE:18`
3. **Loop.** `read order; dow not %eof; … update forde; read order; ENDDO` — arrival sequence over the physical file (`ORDER.PF` has no key), every row, no `WHERE`. — `ORD901.PGM.SQLRPGLE:19-20,39-41`; `ORDER.PF:5-14`
4. **Shift.** `ordate = %dec(%date(ordate:*iso) + %days(days) : *iso)` — date arithmetic, calendar-correct across month and year ends and leap days (`%days` on a date — language semantics). — `ORD901.PGM.SQLRPGLE:21`
5. **Year.** `oryear = %subdt(%date(ordate:*iso) : *Y)` — from the **shifted** date, so `ORYEAR` and `ORDATE` agree after the run even if they did not before. — `ORD901.PGM.SQLRPGLE:38`
6. **Write.** `update forde` — native update of the current record (record format `FORDE`). — `ORD901.PGM.SQLRPGLE:39`; `ORDER.PF:5`

## Validation rules found in code

- None on the data. The only rule is arithmetic: after the run, `MAX(ORDATE) = today` (provided the run completes and no order was already dated after today — see edge cases).

## Edge cases found in code

- **Same-day rerun.** `MAX(ORDATE) = today` → `days = 0` → every row is rewritten unchanged (still one `UPDATE` per row; `ORDER` has no trigger, `ORD701` is `AFTER INSERT` only — `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-6`). Idempotent in effect. — `ORD901.PGM.SQLRPGLE:17,21`
- **Newest order dated after today.** `days < 0` — the whole file moves backwards to make that order "today". Not producible in-tree (`ORD100` writes today), reachable after a restore taken on a later date or a system-date change. No guard. — `ORD901.PGM.SQLRPGLE:17`
- **`ORDATE = 0` or malformed.** `%date(0:*iso)` / `%date(20230230:*iso)` raise `RNQ0112`; there is no `MONITOR` and no `(E)` extender → inquiry message, program stops at that row. Rows already processed stay shifted (`c06`). Not producible in-tree for `ORDATE` (`ORD100:194`), producible for `ORDATDEL` / `ORDATCLO` only if non-zero and malformed (`c04` guards the zero case for those two). — `ORD901.PGM.SQLRPGLE:21-23,29`
- **Rerun after a partial run.** If the failure row came *before* the newest order in arrival sequence, `MAX(ORDATE)` is still the old maximum, `days` is recomputed **the same**, and the rows already shifted are shifted **again** — they end up `days` past today. If the newest order was already processed, `days = 0` and the rerun is harmless. Non-idempotent after failure; nothing in the program detects it. — `ORD901.PGM.SQLRPGLE:11,17,19-21`
- **`ORYEAR` disagreement repaired as a side effect.** `ORYEAR` is recomputed from `ORDATE` for every row, so any row where the two disagreed before (no in-tree writer produces that — `ORD100:193-194` sets both from the same day) agrees afterwards. `DETORD.ODYEAR` is resynced separately (`c05`).
- **`days` width.** `5 0` — an estate whose newest order is more than 99 999 days old would overflow the assignment (`RNQ0103`). Theoretical.

## Dependencies

- `ORDER.PF` (shared PF — **dep**, not the slice); `ORDER1.LF` / `ORDER2.LF` / `ORDER3.LF` access paths maintained by the system on each `UPDATE` (`ORDER3` is keyed on `ORDATE` — the update moves the row in that path; no reader exists).
- `c02` (guard), `c04` (delivery / close dates in the same loop), `c05` (`ODYEAR` / `CULASTORD` resync after the loop), `c06` (open mode, no commitment control), `c09` (`lastdate` reuse).
- Readers of the shifted fields: `ord-maintain-ord200-c01`, `ord-maintain-ord201-c01` (via `ORDERCUS` — `sql-objects-c01`), `ord-maintain-ord202`, `ord-print-ord500` (pointers only).

## Assumptions / unknowns

- Language semantics relied on (not source): `%diff(a:b:*d)` = a − b in days; `%date(numeric:*iso)` requires a valid `yyyymmdd` and raises `RNQ0112` otherwise; `%dec(date:*iso)` yields the 8-digit numeric. Inference, runtime-confirmable.
- **needs-SME (room, ORD pack / Phase A Q1):** is date-shifting ever run against real data, or only to refresh the sample? If real, the target needs the rule "newest order = today, everything else keeps its distance" as an operator action; if sample-only, the slice is demo tooling (`c07`) and has no target. Not decided here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:4,6-8,11,16-21,38-41` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/ORDER3.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:68` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:193-194` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:32` · `ATU_SRC/QDDSSRC/ORD500O.PRTF:48-49` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-6` · structural grep of `ATU_SRC/**` for `ORDER3` (no reader), for `MONITOR` / `(E)` in the member (none)
