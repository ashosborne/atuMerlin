# ord-maintain-ord200-c09 — Precedence quirk: option 2 always rejected

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — planted defect, preserved) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`; "planted defect — preserve as-is/residual; do not fix in discovery") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD200.PGM.SQLRPGLE:187` reads `if opt01 = 2 or opt01 = 4 and datclo > datBlank;`. RPG evaluates `and` before `or`, so the condition is `opt01 = 2 or (opt01 = 4 and closed)`: every option `2` is refused with `SFLMSG` 36 "Closed order can not be edited or deleted" whatever the close date, and the `ORD101` call in `s01act` (`c03`) is dead code. The twin `ORD201:191` has the intended `(opt01 = 2 or opt01 = 4) and datclo > datBlank`. The `4` half behaves correctly in both. Recorded as-is; the room decides later whether the target preserves or corrects it.

## Entrypoints

- `s01chk` closed-order test — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:187-195`
- Dead branch — `ORD200.PGM.SQLRPGLE:225-228`
- Corrected twin — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:191`

## Inputs / outputs / observables

- In: any row with `opt01 = 2`. — `ORD200.PGM.SQLRPGLE:187`
- Out: `step01 = dsp`, row `DSPATR(RI)`, indicator 36 → "Closed order can not be edited or deleted", `RRB01` to that row if first error; the `2` remains typed. No call, no data change. — `ORD200.PGM.SQLRPGLE:188-194`, `ATU_SRC/QDDSSRC/ORD200D.DSPF:41-42`

## Behaviour as implemented

1. `datBlank = d'1940-01-01'`; `datclo` is the subfile's `L` field (sentinel when never closed). — `ORD200.PGM.SQLRPGLE:74`, `ORD200D.DSPF:26-27`
2. For `opt01 = 2`: the left operand of `or` is true → refused regardless of `datclo`.
3. For `opt01 = 4`: left operand false → right operand `opt01 = 4 and datclo > datBlank` → refused only when closed (intended).
4. Because the guard fires for every `2`, `s01act`'s `when opt01 = 2` can only be reached if `s01chk` is bypassed, which the state machine never does (`s01key other → chk`, `chk → act` only with no error). — `ORD200.PGM.SQLRPGLE:157-158,162-163,220-228`

## Validation rules found in code

- Intended (per `ORD201` and the message text): `2` and `4` refused on a closed order.
- Actual: `2` refused always; `4` as intended.

## Edge cases found in code

- **Misleading message and legend.** The operator sees "Closed order…" on an open order, under a `2=Edit` legend. — `ORD200D.DSPF:41-42,59`
- **Collateral block.** A single `2` anywhere on the screen cancels all other options on that pass (`c08`).
- **Customer-scoped line maintenance does not exist.** `CUS200 → ORD200` is the only path from a customer to their orders (`c10`); line edits must go through `ORD201` (all customers). `ORD101` has no closed-order test of its own (`ord-entry-ord101-c12`), so the *only* working closed-order guard for line edits in the estate is `ORD201`'s.
- **Not a compile-time warning.** Mixed `and`/`or` without parentheses is legal RPG; nothing in the source flags it.

## Dependencies

- `c03` (dead branch), `c08` (guard mechanics) — this slice
- `ord-maintain-ord201` (corrected twin; bound, queued) — cited only
- `ord-entry-ord101-c09` / `c12` (callee's view of the same defect) — documented, cited

## Assumptions / unknowns

- needs-SME / room (Phase A question 1, bind record): is "option 2 never works in `ORD200`" known to users? Preserve as-is in the target (parity) or adopt the `ORD201` rule? Discovery does not decide; the bind record says planted defects stay as-is/residual for now.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,157-158,162-163,187-195,220-228` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:26-27,41-42,59` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:191`
