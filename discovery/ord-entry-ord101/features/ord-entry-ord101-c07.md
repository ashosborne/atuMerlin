# ord-entry-ord101-c07 — Dead option 6 (advertised as "6=Deliver")

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CTL01` displays the legend **`6=Deliver`** next to `2=Edit` and `4=Delete`, and `s01chk` accepts `6` as a valid option, but `s01act` has no `when opt01 = 6` branch. Typing `6` therefore does nothing: no message, no I/O, the `6` stays visible in the option column, and the row is no longer flagged "changed", so a second Enter does not reprocess it either. Phase A asked whether `6` was a removed print action; the DSPF says it is **deliver** — a per-line delivery action that was advertised but never implemented (or removed), matching the order-level `8=Deliver` in `ORD200` / `ORD201`.

## Entrypoints

- Legend `5 29 '6=Deliver'` on `CTL01` — `ATU_SRC/QDDSSRC/ORD101D.DSPF:79-80`
- `s01chk` option validity test — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:155`
- `s01act` `select` — `ORD101.PGM.RPGLE:182-199`

## Inputs / outputs / observables

- In: `OPT01 = 6` on any row.
- Out: none. No file I/O, no indicator, no message.
- Observable: after Enter, the list is redisplayed (once all changed rows have been consumed) with the `6` still shown on the row.

## Behaviour as implemented

1. `s01chk`: `if opt01 <> 0 and opt01 <> 2 and opt01 <> 4 and opt01 <> 6` → invalid; so `6` passes and the row is `update`d with `SFLNXTCHG` on (stays changed for `s01act`). — `ORD101.PGM.RPGLE:155-163,173`
2. `s01act`: `readc(e) sfl01` consumes the row (clears its changed flag); `select` has `when %error or %eof`, `when opt01 = 2`, `when opt01 = 4` only → falls through. `step01` remains `act`; the next cycle pass reads the next changed row; at `%eof` → `dsp`. — `ORD101.PGM.RPGLE:180-200`
3. The row is not rewritten (`update sfl01` only happens in the `4` branch and in `S02act`), so `OPT01` keeps displaying `6`. — `ORD101.PGM.RPGLE:198,272`

## Validation rules found in code

- `6` is in the accepted set; every other non-zero value except `2` and `4` raises `SFLMSG` 35 "Invalid Option". — `ORD101.PGM.RPGLE:155`, `ORD101D.DSPF:39`

## Edge cases found in code

- **Mixed pass.** `6` on one row and `4` on another: the `4` is executed, the `6` is skipped silently; the operator sees the `6` still typed and may assume it is pending.
- **What "deliver" means elsewhere.** `ORD200` / `ORD201` option `8` at order level sets `ORDATDEL` and `ODQTYLIV = ODQTY` on every line still at 0; per-line delivered quantity can only be changed here through `c03` (`DSQTYLIV`). — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:261-278`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:83`
- **Not print.** `ORD500` is prototyped in `ORD101` but never called (`c08`); the `ORD200` / `ORD201` legend for print is `6=Print` at order level — the `6` numbering coincidence is probably why Phase A guessed print. — `ORD101.PGM.RPGLE:27-28`, `ORD201D.DSPF:67`

## Dependencies

- None beyond the subfile mechanics (`c05`).

## Assumptions / unknowns

- needs-SME: was per-line deliver (`6`) removed deliberately in favour of the order-level `8=Deliver`, or never finished? Decides whether the target carries a per-line deliver action or drops the legend. As-is: legend present, action absent; document, do not fix (planted-defects rule).

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:27-28,155-163,173,180-200,272` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:39,47,53,79-80` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:261-278` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:67,83`
