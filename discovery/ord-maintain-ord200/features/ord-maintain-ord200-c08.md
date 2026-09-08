# ord-maintain-ord200-c08 — Option guards

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — business rules) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`s01chk` walks every changed subfile row with `READC` and applies four tests: option value (`1`, `3`, `> 8` invalid), state guards for `7` (already closed) and `8` (already delivered), the closed-order guard for `2`/`4` (mis-parenthesised, `c09`) and the deliveries test for `4` (any line with `ODQTYLIV > 0`). Any failure marks the row reverse-image, raises one of three `SFLMSG` texts, positions the page to the first failing row and cancels **every** action on that pass. Three of the four refusals share the text **`Invalid Option`**; only `2`/`4`-on-closed and `4`-with-deliveries have specific messages.

## Entrypoints

- `s01chk` (entered from `s01key` `other`, i.e. Enter or any unhandled key) — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:157-158,162-218`
- Messages on `CTL01`: `SFLMSG('Invalid Option' 35)`, `SFLMSG('Closed order can not be edited or deleted' 36)`, `SFLMSG('Order whith deliveries can not be deleted' 37)`; row attribute `DSPATR(RI)`/`DSPATR(PC)` under 34 — `ATU_SRC/QDDSSRC/ORD200D.DSPF:16-17,40-44`

## Inputs / outputs / observables

- In: per changed row — `opt01` (`2Y 0`, so `0`–`99`), `datclo`, `datliv` (subfile copies), `orid`; `DETORD1` rows for the `4` test. — `ORD200D.DSPF:15,24-27`, `ORD200.PGM.SQLRPGLE:166-212`
- Out: row rewritten with `SFLNXTCHG` (stays "changed" for the next pass) and `DSPATR(RI)`; `RRB01` set to the first failing row; indicator 35/36/37 on; `step01 = dsp`. No data change. — `ORD200.PGM.SQLRPGLE:169-175,213-217`

## Behaviour as implemented

1. `step01 = act; err01 = *off; sflnxtchg = *on; readc(e) sfl01;` loop while not `%error` and not `%eof`. — `ORD200.PGM.SQLRPGLE:163-167`
2. **Value test:** `opt01 = 1 or opt01 = 3 or opt01 > 8` → `sflmsg` (35). Blank/`0` rows are not returned by `READC` unless the operator touched them. — `ORD200.PGM.SQLRPGLE:168-176`
3. **State test:** `opt01 = 7 and datclo > datBlank or opt01 = 8 and datliv > datBlank` → `sflmsg` (35). Precedence is correct here (`and` before `or`). — `ORD200.PGM.SQLRPGLE:177-186`
4. **Closed test:** `opt01 = 2 or opt01 = 4 and datclo > datBlank` → `sflmsg2` (36). Every `2`; `4` only when closed (`c09`). — `ORD200.PGM.SQLRPGLE:187-195`
5. **Deliveries test:** `opt01 = 4` → `setll orid detord1; reade(n)` loop; first `odqtyliv > 0` → `sflmsg3` (37), `leave`. Reads the file without lock. — `ORD200.PGM.SQLRPGLE:196-212`
6. Each failure: `step01 = dsp; dspatr_ri = *on; sflmsg[n] = *on; if not err01 → rrb01 = rrn01; err01 = *on`. Then `update sfl01; dspatr_ri = *off; readc(e)`. The tests are not exclusive — a row can trip several (e.g. `4` on a closed order with deliveries → 36 and 37 both on). — `ORD200.PGM.SQLRPGLE:169-175,213-215`
7. After the loop `sflnxtchg = *off`. If `step01` is still `act`, `s01act` executes the rows in `READC` order; otherwise the screen is redisplayed at the first error page with all options still typed. — `ORD200.PGM.SQLRPGLE:217,220-224`

## Validation rules found in code

| Option | Allowed when | Refusal text |
| --- | --- | --- |
| `1`, `3`, `9`–`99` | never | 35 `Invalid Option` |
| `2` | never as coded (`c09`) | 36 `Closed order can not be edited or deleted` |
| `4` | `datclo` blank **and** no line with `ODQTYLIV > 0` | 36 / 37 |
| `5`, `6` | always | — |
| `7` | `datclo` blank | 35 `Invalid Option` |
| `8` | `datliv` blank | 35 `Invalid Option` |

## Edge cases found in code

- **Generic text for state refusals.** "Already closed" (`7`) and "already delivered" (`8`) are reported as `Invalid Option`, indistinguishable from typing `9`. Only the DDS literal carries text; no message file is used by `ORD200`. — `ORD200D.DSPF:40`
- **One bad row blocks all.** `step01 = dsp` is global; valid options on other rows are neither executed nor cleared. They remain typed (rows updated with `SFLNXTCHG`) and run on a later Enter once the bad row is fixed. — `ORD200.PGM.SQLRPGLE:169,213`
- **Indicator lifetime.** 34 is reset per row in the program; 35/36/37 are never set off in RPG — as `SFLMSG` response indicators they are cleared by the display on the next input (same idiom as `ord-entry-ord101-c04`). Runtime detail; on the box only.
- **Guards read screen copies** of `datclo` / `datliv` (as loaded or as updated by `7`/`8` in-session), so state changed by another job is not seen until reload (`F6` or re-entry); the deliveries test is a live file read. — `ORD200.PGM.SQLRPGLE:177-178,187,196-199`
- **Option 3 divergence.** `ORD201` tests only `opt01 = 1 or opt01 > 8`; a `3` there passes validation, hits `other` in `s01act` and silently stays typed. `ORD200` rejects it. — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:172,279-281`
- **`READC` with `(e)`** — an I/O error ends the loop silently (`%error`), then `s01act` runs on whatever remains. — `ORD200.PGM.SQLRPGLE:166-167`
- **`opt01` is `2Y 0` with `EDTCDE(Z)`**: two digits, zero-suppressed; negative values are not enterable.

## Dependencies

- `DETORD1.LF` for the deliveries test — `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
- `ORD200D.DSPF` `SFLMSG` literals (no `MSGF`) — `ORD200D.DSPF:40-44`

## Assumptions / unknowns

- needs-SME: is the `Invalid Option` wording for "already closed / delivered" acceptable in the target, or should the reason be surfaced?
- needs-SME: keep "any error cancels the whole pass" or execute the valid rows?

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:157-158,162-224` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:15-17,24-27,40-44` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:172,279-281`
