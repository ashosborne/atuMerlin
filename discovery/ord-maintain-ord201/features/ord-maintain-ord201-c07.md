# ord-maintain-ord201-c07 — Option guards and dead option 3

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`s01chk` validates every changed row before any action: `1` or `>8` invalid (35); `7` on a closed or `8` on a delivered order (35, the same generic `Invalid Option` text); `2` or `4` on a closed order (36); `4` on an order with any delivered line, by live file read (37, DDS typo "whith"). One refused row cancels **every** action on the pass; valid options stay typed. Option **`3` passes validation and has no action**: it is not in the invalid list, not in `s01act`'s `select`, and — because the `other` branch does not `update sfl01` — it **stays typed and re-read on every subsequent Enter** until the user blanks it. A diff of `s01chk` against `ORD200` shows exactly two differing lines: `ORD200` also rejects `3`, and `ORD200` lacks the parentheses on the `2`/`4` guard (`c03`).

## Entrypoints

- `s01key` `other` → `step01 = chk` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:161-162`
- `s01chk` — `ORD201.PGM.SQLRPGLE:166-222`
- `s01act` `select` (`2`, `4`, `5`, `6`, `7`, `8`, `other`) — `ORD201.PGM.SQLRPGLE:224-282`
- Messages on `CTL01`: `SFLMSG('Invalid Option' 35)`, `SFLMSG('Closed order can not be edited or deleted' 36)`, `SFLMSG('Order whith deliveries can not be deleted' 37)`; `ERRSFL` on the file — `ATU_SRC/QDDSSRC/ORD201D.DSPF:11,44-48`

## Inputs / outputs / observables

- In: `OPT01` (`2Y 0B`) of each changed row; screen copies `datclo`, `datliv`; for `4`, `DETORD1` rows of the order (`reade(n)`, no lock). — `ORD201D.DSPF:15`, `ORD201.PGM.SQLRPGLE:181-182,191,200-216`
- Out (screen), on any refusal: `DSPATR(RI)` + `DSPATR(PC)` on the refused option(s) (indicator 34), the message(s) whose indicator is on, page positioned (`RRB01 = rrn01`) to the **first** refused row, `step01 = dsp` → redisplay; no action executed. — `ORD201.PGM.SQLRPGLE:173-179`, `ORD201D.DSPF:16-17,49`
- Out (screen), all rows valid: `step01 = act` → `s01act` processes the changed rows one per cycle.

## Behaviour as implemented

1. `step01 = act; err01 = *off; sflnxtchg = *on; readc(e) sfl01; dow not %error and not %eof;` — every row the user modified since the last `READC`/clear. — `ORD201.PGM.SQLRPGLE:167-171`
2. Four independent `if` blocks per row (not `else`-chained): (a) `opt01 = 1 or opt01 > 8` → 35; (b) `opt01 = 7 and datclo > datBlank or opt01 = 8 and datliv > datBlank` → 35; (c) `(opt01 = 2 or opt01 = 4) and datclo > datBlank` → 36; (d) `opt01 = 4` → `setll orid detord1; reade(n) orid detord1; dow not %eof: if odqtyliv > 0 → 37, leave`. Each hit sets `step01 = dsp`, `dspatr_ri`, the message indicator, and (first hit only) `rrb01 = rrn01; err01 = *on`. — `ORD201.PGM.SQLRPGLE:172-216`
3. `update sfl01; dspatr_ri = *off; readc(e) sfl01;` — the row is rewritten **with `SFLNXTCHG` on**, so it is flagged changed again and `s01act`'s `READC` will see it. — `ORD201.PGM.SQLRPGLE:217-219`, `ORD201D.DSPF:14`
4. `sflnxtchg = *off` after the loop. If `step01` is still `act`, `s01act` runs on the next cycle: `readc` → matching `when` → action → `opt01 = 0; update sfl01` (flag cleared) → next cycle → next row → `%eof` → `dsp`. — `ORD201.PGM.SQLRPGLE:221,224-282`
5. **Option 3**: passes (a)–(d); in `s01act` falls to `other` — empty. No `update sfl01`, so the changed flag set in step 3 stays; every later Enter re-reads the row through `s01chk` and `s01act` with the same non-result. The `3` remains visible until overtyped. `0`/blank on a modified row behaves the same way (harmless). — `ORD201.PGM.SQLRPGLE:279-281`

## Validation rules found in code

| Option | Rule | Msg | Text |
| --- | --- | --- | --- |
| `1`, `9`–`99` | always | 35 | Invalid Option |
| `3` | **none** — passes; no action (dead) | — | — |
| `2` | refused if screen `datclo > 1940-01-01` | 36 | Closed order can not be edited or deleted |
| `4` | refused if screen `datclo > 1940-01-01` | 36 | (same) |
| `4` | refused if any `DETORD` line has `ODQTYLIV > 0` (live read) | 37 | Order whith deliveries can not be deleted |
| `5`, `6` | none | — | — |
| `7` | refused if screen `datclo > 1940-01-01` | 35 | Invalid Option |
| `8` | refused if screen `datliv > 1940-01-01` | 35 | Invalid Option |
| `0`/blank | none; no action | — | — |

## Edge cases found in code

- **State refusals share the invalid-option text.** "Already closed" (`7`) and "already delivered" (`8`) look exactly like typing `9`. Only `2`/`4`-on-closed and `4`-with-deliveries have specific wording. Same as `ORD200` (`ord-maintain-ord200-c08`). — `ORD201.PGM.SQLRPGLE:181-185`, `ORD201D.DSPF:44`
- **Tests are not exclusive.** `4` on a closed order that also has deliveries raises 36 **and** 37; `ERRSFL` lets both messages show. — `ORD201.PGM.SQLRPGLE:191-216`, `ORD201D.DSPF:11`
- **One bad row cancels the pass; good rows stay typed.** Valid options on other rows are neither executed nor cleared; they run on the next Enter once the bad one is fixed — or are re-refused with it. — `ORD201.PGM.SQLRPGLE:173,183,192,205`
- **Options typed before `PAGEDOWN` survive.** `s01key` handles `pagedown` before `chk`, and `s01lod` only appends rows (`SFLCLR` is not written), so the typed options keep their changed flags and are validated and executed on the next Enter — possibly pages later. `F5`/`F6` (which `SFLCLR`) discard them. — `ORD201.PGM.SQLRPGLE:112-130,152-160`
- **Screen-copy vs live guards.** (b) and (c) use the subfile's `datclo`/`datliv` (as loaded, or as set by an earlier `7`/`8` this session); (d) reads `DETORD1` live. An order closed by another job after the load still passes (b)/(c) (`c06`).
- **Ghost row (`c04`).** `orid = 0` → (d) reads lines of order `0` (none); (b)/(c) use the deleted order's dates. `7`/`8` on it then chain-miss → exception; `2` → `ORD101(0)`; `4` → silent no-op.
- **Message indicators are never set off by the program.** 35/36/37 are only ever set `*on`; with `INDARA`, the indicator area is refreshed from the display on the next input, so a shown message does not persist to the following pass (same reliance as `ORD200`). Stated from the DDS/RPG contract; runtime-confirmable. — `ORD201.PGM.SQLRPGLE:175,185,194,207`, `ORD201D.DSPF:7`
- **First-error positioning.** `rrb01 = rrn01` only on the first refusal; later refused rows on other pages are highlighted but the user lands on the first. — `ORD201.PGM.SQLRPGLE:176-178`
- **Legend has no `3` and no `1`.** `2 4 5 6 7 8` are advertised; `3` is neither advertised nor rejected — a silent no-op rather than a hidden feature. — `ORD201D.DSPF:61-70,83-84`
- **`readc(e)`.** The `(e)` extender on `READC` swallows I/O errors into `%error`, which ends the loop as if `%eof` — no message. — `ORD201.PGM.SQLRPGLE:170,219,225`

## Dependencies

- `DETORD1.LF` (deliveries test, read-only) — `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
- `ORD201D.DSPF` `SFLNXTCHG`, `DSPATR(RI)`/`(PC)`, `SFLMSG` ×3, `ERRSFL`, `SFLRCDNBR` — `ORD201D.DSPF:11,14-17,44-49`

## Assumptions / unknowns

- needs-SME: dead option `3` — was it meant to be something (copy? release?) — Phase A question 2. One rule for the target (`ORD200` rejects it)?
- needs-SME: whole-pass cancellation on one refused row — keep, or execute the valid rows?
- needs-SME: `Invalid Option` as the text for state refusals — accepted wording, or surface the reason in the target? (Owned by `ord-maintain-ord200-c08`; one answer for both twins.)
- needs-SME: options surviving a `PAGEDOWN` and executing later — known to users? Keep in the target?

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:112-130,152-162,166-222,224-282` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:7,11,14-17,44-49,61-70,83-84` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:168,187` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
