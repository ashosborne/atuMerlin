# ord-maintain-ord200-c03 — Option 2 update lines → ORD101 (unreachable as coded)

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — seam edge; dead branch) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The action branch for option `2` calls `ORD101(orid)` (line maintenance) and clears the option. It is **never executed**: `s01chk` refuses every `2` with the closed-order message because of the precedence defect in `c09`, and any refused row stops all actions on that pass. The legend `2=Edit` is shown regardless. This card records the coded intent; the reachable path exists only in `ORD201`. Planted defect — documented as-is, not fixed.

## Entrypoints

- Legend `2=Edit` on `CTL01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:59`
- `s01act` `when opt01 = 2; Updord(orid); opt01 = 0; update sfl01;` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:225-228`
- Prototype `Updord extpgm('ORD101')` with one parameter `like(orid)` — `ORD200.PGM.SQLRPGLE:21-22`

## Inputs / outputs / observables

- Would pass the row's `orid` (`6P 0`) by reference; `ORD101` never modifies it (`ord-entry-ord101-c02`). — `ATU_SRC/QDDSSRC/SAMREF.PF:34`
- Would clear the option and rewrite the row without reloading, leaving `SUMORD` stale after line edits (the same "amount column stale until reload" as `ORD201`, `ord-entry-ord101-c09`).
- Observed effect on the box: typing `2` on any row → that row `DSPATR(RI)`, `SFLMSG` 36 "Closed order can not be edited or deleted", page positioned to the row, nothing executed (`c08`, `c09`). — `ORD200D.DSPF:41-42`

## Behaviour as implemented

1. `s01chk` line 187: `if opt01 = 2 or opt01 = 4 and datclo > datBlank` — `and` binds tighter, so `opt01 = 2` alone satisfies the condition and sets `step01 = dsp`. — `ORD200.PGM.SQLRPGLE:187-195`
2. `s01act` is entered only when `step01` is still `act` after the check loop; with any `2` on the screen it never is. Lines 225–228 are therefore dead. — `ORD200.PGM.SQLRPGLE:162-163,220-228`
3. The refused `2` stays typed in the row (the `update sfl01` in `s01chk` writes the row back with `SFLNXTCHG`), so the next Enter re-validates and refuses it again until the operator blanks it. — `ORD200.PGM.SQLRPGLE:165,213`

## Validation rules found in code

- Intended: `2` and `4` refused when the order is closed (`datclo > 1940-01-01`); actual: `2` always refused (`c09`).

## Edge cases found in code

- **Line maintenance is unreachable per customer.** `ORD200` is the only order list reached from the customer screen (`CUS200` option 5, `c10`); operators must use `ORD201` (all customers) to reach `ORD101`. — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:230-233`
- **Collateral refusal.** Because one error sets `step01 = dsp` for the whole pass, a `2` typed next to valid `5`/`6`/`7`/`8` options blocks those too until the `2` is removed (`c08`).
- **Twin.** `ORD201:191` has `(opt01 = 2 or opt01 = 4) and datclo > datBlank` and its option 2 works; `ORD201` likewise does not reload after `ORD101` returns. — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:191,229-232`

## Dependencies

- `ORD101.PGM.RPGLE` (`ord-entry-ord101`, documented) — would be the callee
- `c09` (this slice) — the guard that makes the branch dead

## Assumptions / unknowns

- needs-SME / room: preserve "option 2 never works in `ORD200`" as-is in the target, or adopt the `ORD201` rule? Not a Discovery decision (bind record: planted defects stay as-is/residual for now).

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:21-22,162-165,187-195,213,220-228` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:41-42,59` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:191,229-232` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:230-233` · `ATU_SRC/QDDSSRC/SAMREF.PF:34`
