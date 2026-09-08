# ord-entry-ord101-c09 — Callers: ORD200 / ORD201 option 2

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD101` has exactly two callers under `ATU_SRC`: the order lists `ORD200` (orders of one customer) and `ORD201` (all orders), both through a prototype `Updord … extpgm('ORD101')` on option `2`, passing the listed order's `ORID`. There is no menu option, command or CL wrapper. In `ORD200` the option-2 branch is **unreachable** because of an operator-precedence defect in the closed-order guard (`opt01 = 2 or opt01 = 4 and datclo > datBlank` — `and` binds first, so every `2` is rejected as "Closed order"); in practice line maintenance is reached only from `ORD201`. Neither caller reloads its list after `ORD101` returns. Planted defect — documented as-is, not fixed.

## Entrypoints

- `ORD200`: prototype `:21-22`, guard `:187-195`, call `:225-228` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE`
- `ORD201`: prototype `:18-19`, guard `:191-199`, call `:229-232` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE`
- `ORD101` PI: one parameter `id like(orid)` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:23-25`

## Inputs / outputs / observables

- In (to `ORD101`): `orid` of the changed subfile row, by reference, `6P 0`. Never modified by `ORD101`. — `ORD201.PGM.SQLRPGLE:230`, `ATU_SRC/QDDSSRC/SAMREF.PF:34-36`
- Out (back in the caller): `opt01 = 0; update sfl01` — the row's option is cleared; the row's amounts (`sumord`, dates) are **not** refreshed. — `ORD201.PGM.SQLRPGLE:231-232`, `ORD200.PGM.SQLRPGLE:227-228`

## Behaviour as implemented

1. Caller `s01chk` validates the option and applies the closed-order guard on `2` / `4` (`c12`) and the delivered-lines guard on `4`. — `ORD201.PGM.SQLRPGLE:191-216`
2. Caller `s01act` `when opt01 = 2`: `Updord(orid)` — a dynamic `CALL`. Caller and `ORD101` are both `dftactgrp(*no) bnddir('SAMPLE')` with no `ACTGRP` keyword, so with default compile options both run in `QILE`; `ORD101` ends with `*inlr = *on`, which closes its files and releases its locks (`c02`, `c03`) before control returns. — `ORD201.PGM.SQLRPGLE:229-230`, `ORD101.PGM.RPGLE:5,287-289`
3. `ORD101` runs its own screen cycle until `F3` / `F12` on the list (`c10`), then returns.
4. Caller clears the option, updates the row and continues its `readc` loop; the list is rebuilt from SQL only on `F5` / next `prp`. — `ORD201.PGM.SQLRPGLE:231-232`

## Validation rules found in code

- Caller-side only (`c12`): `ORD201` refuses `2` when `datclo > d'1940-01-01'` (order closed); `ORD200` refuses **every** `2`. `ORD101` validates nothing about the order.

## Edge cases found in code

- **`ORD200` option 2 unreachable (planted defect, as-is).** `if opt01 = 2 or opt01 = 4 and datclo > datBlank;` parses as `opt01 = 2 or (opt01 = 4 and closed)`, so option `2` always sets `sflmsg2` 36 "Closed order can not be edited or deleted" and `step01 = dsp`; the `when opt01 = 2 → Updord(orid)` branch at `:225-228` is dead code. `ORD201` has the parentheses. Owner for the fix decision: `ord-maintain-ord200`. — `ORD200.PGM.SQLRPGLE:187-195,225-228`, `ATU_SRC/QDDSSRC/ORD200D.DSPF:41-42`, `ORD201.PGM.SQLRPGLE:191`
- **Stale list after return (derived).** `ORD201`'s row shows `sumord` from its SQL fetch; edits / deletes in `ORD101` change `DETORD` totals but the row is only `update sfl01`'d with `opt01 = 0`, so the amount column is stale until `F5`. Pointer for `ord-maintain-ord201`. — `ORD201.PGM.SQLRPGLE:119,231-232`
- **Direct call.** `CALL ORD101 PARM(&ORID)` bypasses both guards (`c12`) and accepts an unknown id (`c02`).
- **No caller from `ORD100`**: order creation stages lines in `QTEMP` and never calls `ORD101` (`ord-entry-ord100-c02`).
- Absence: grep of `ATU_SRC/**` for `ORD101` → only `ORD200.PGM.SQLRPGLE`, `ORD201.PGM.SQLRPGLE` (plus its own two members). No `QMNUSRC`, `QCMDSRC`, `QCLSRC` reference.

## Dependencies

- `ORD200` / `ORD201` (`ord-maintain-ord200` / `ord-maintain-ord201` — bound, queued for Pack B; cited as call sites only).
- `SAMREF.ORID` (`6P 0`) as the shared parameter type — `SAMREF.PF:34-36`

## Assumptions / unknowns

- needs-SME (owner `ord-maintain-ord200`): confirm the `ORD200` precedence defect is the known "option-2 unreachable" planted defect from the bind record; target decision is that slice's, not this one's.
- Activation group is inferred from the `H` spec (no `ACTGRP` → compile default `QILE`, shared with the callers and with the `FVAT` / `FARTICLE` / `FCUSTOMER` caches — `vat-module-c06`). Build owner to confirm the actual `CRTBNDRPG` options; `*inlr` closes `ORD101`'s files either way.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:5,21-22,187-195,225-228` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:18-19,119,191-216,229-232` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:41-42` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:5,23-25,287-289` · `ATU_SRC/QDDSSRC/SAMREF.PF:34-36`
