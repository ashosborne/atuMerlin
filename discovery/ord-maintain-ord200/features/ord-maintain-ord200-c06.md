# ord-maintain-ord200-c06 — Option 7 close order

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — lifecycle rule) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `7` chains the `ORDER` header for update and sets `ORDATCLO` = today; if `ORDATDEL` is still `0` it also sets `ORDATDEL` = today. It writes nothing to the lines: closing an undelivered order stamps a delivery date on the header while every `DETORD.ODQTYLIV` stays `0`. The subfile row is updated in place (close date, and delivery date if it was blank). Refused when the row already shows a close date — with the generic **`Invalid Option`** message, not the closed-order text.

## Entrypoints

- Legend `7=Close` on `CTL01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:67`
- Guard: `s01chk` `if opt01 = 7 and datclo > datBlank or opt01 = 8 and datliv > datBlank` → `sflmsg` (35) — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:177-186`
- Action: `s01act` `when opt01 = 7` — `ORD200.PGM.SQLRPGLE:244-254`

## Inputs / outputs / observables

- In: row `orid`; `ORDER1` (`UF`), fields `ORDATDEL`, `ORDATCLO` (`8 0`, ISO `YYYYMMDD`, `0` = never). — `ORD200.PGM.SQLRPGLE:7`, `ATU_SRC/QDDSSRC/ORDER.PF:11-14`
- Out (data): `ORDATCLO = %dec(%date():*iso)`; `ORDATDEL` likewise only if it was `0`; `update forde`. No `DETORD` change. No trigger on `ORDER` update exists under `ATU_SRC` (only `ORD701` after insert). — `ORD200.PGM.SQLRPGLE:246-251`, `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-6`
- Out (screen): `datclo = %date()` (and `datliv` if set); option cleared; row rewritten. Column "Close" now shows today. — `ORD200.PGM.SQLRPGLE:248,252-254`, `ORD200D.DSPF:24-27`

## Behaviour as implemented

1. Guard uses the **subfile copy** of `datclo` (as loaded, or as set by an earlier `7` in this session): `datclo > d'1940-01-01'` → refused, `DSPATR(RI)`, `SFLMSG` 35 "Invalid Option", page positioned to the first error row, no action on that pass. — `ORD200.PGM.SQLRPGLE:74,177-186`, `ORD200D.DSPF:40`
2. `chain (orid) order1` — `%found` **not tested**. — `ORD200.PGM.SQLRPGLE:245`
3. `if ordatdel = 0; ordatdel = today; datliv = %date(); endif; ordatclo = today; update forde;` — one header write; `%date()` is the job date. — `ORD200.PGM.SQLRPGLE:246-251`
4. `datclo = %date(); opt01 = 0; update sfl01;` — no reload; the row's `SUMORD` and `datord` are untouched. — `ORD200.PGM.SQLRPGLE:252-254`
5. After a `7`, the same row refuses `7` (closed), `8` (`datliv` now set), `4` and `2` (closed / `c09`); only `5` and `6` remain. — `ORD200.PGM.SQLRPGLE:177-195`

## Validation rules found in code

- Refused if `datclo > 1940-01-01` — message 35 (`Invalid Option`), the same text as for an invalid option number. Message 36 ("Closed order…") is reserved for `2`/`4`.
- No check that the order has lines, that all lines are delivered, or that the header exists.

## Edge cases found in code

- **Close ≠ deliver for the lines.** Close stamps `ORDATDEL` when blank but leaves `ODQTYLIV = 0` on every line, so the `ORD700`-maintained article outstanding quantity (`ARCUSQTY`) is **not** reduced by a close; `ART801` recomputes article and customer aggregates from orders with `ORDATCLO = 0` only, so the two views of "outstanding" diverge until the batch runs (`ord-trigger-ord700-c11`). Phase A question 2. — `ORD200.PGM.SQLRPGLE:246-251`, `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`
- **Chain miss → exception.** On a ghost row (`c04`) or an order deleted by another job, `chain` misses and `update forde` runs without a locked record: unmonitored exception, program ends abnormally. — `ORD200.PGM.SQLRPGLE:245,251`
- **Stale guard.** An order closed by another job after the load still passes the screen-copy guard; the `chain` then re-reads the current row and overwrites `ORDATCLO` with today (and leaves `ORDATDEL` as found). No "already closed" detection from the file.
- **Lock wait.** `chain` on `UF` waits for a record held by another job (e.g. an open `ORD101` session on this order, `ord-entry-ord101-c02`), then fails unmonitored after `WAITRCD`.
- **Date domain.** `%dec(%date():*iso)` → `8 0` `YYYYMMDD`; displayed via `ISOTODATE40` on reload, directly via `%date()` in-session. `1940-01-01` is the blank sentinel for both the SQL conversion and the guards (`dat-utils-c01`/`c07`). — `ORD200.PGM.SQLRPGLE:74,247,250`
- **Identical in `ORD201`.** Same guard, same body (`ORD201.PGM.SQLRPGLE:181-190,250-260`); no divergence for `7`.

## Dependencies

- `ORDER1.LF` / `ORDER.PF` — `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `ORDER.PF:5-14`
- `ART801.SQLPRC` (`ord-trigger-ord700-c10`), `ORD701.SQLTRG` — cited only

## Assumptions / unknowns

- needs-SME: is "close implies delivery date, not delivered quantities" the intended distinction between `7` and `8`? (Phase A question 2.)
- needs-SME: the `Invalid Option` text for "already closed" — accepted wording, or should the target say why?
- Target date rule (bind record): `NULL` in Postgres for never-closed / never-delivered; `0` / `1940-01-01` only at the boundary. Recorded for the later ORD pack, not applied here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7,74,177-195,244-254` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:24-27,40,67` · `ATU_SRC/QDDSSRC/ORDER.PF:11-14` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-6` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:181-190,250-260`
