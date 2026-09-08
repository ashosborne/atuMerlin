# ord-maintain-ord200-c10 — Caller CUS200 option 5

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — call graph) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The only caller of `ORD200` under `ATU_SRC` is `CUS200` (customer list), option `5`, via `orders extpgm('ORD200')` with the customer id by reference. There is no menu entry, command or CL wrapper; the alternative is a direct `CALL ORD200 PARM(&CUID)` with a `5P 0` value. `ORD200` ends with `*inlr` on `F3` **or** `F12` (both keys behave identically) and never changes the parameter; `CUS200` clears its option and does not re-read its list.

## Entrypoints

- `CUS200` prototype `orders extpgm('ORD200') id like(cuid)` and `s01act when opt01 = 5; orders(cuid); opt01 = 0; update sfl01;` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:37-38,230-233`
- `ORD200` entry `pi cuid like(orcuid)` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:15-19`
- Exit: `s01key` `when exit → panel = 0`; `when cancel → panel = panel - 1` (= 0); `pnl00 → *inlr = *on`. — `ORD200.PGM.SQLRPGLE:146-153,286-288`

## Inputs / outputs / observables

- In: `cuid` `5P 0` by reference (`CUSTOMER.CUID` via `SAMREF`). — `ATU_SRC/QDDSSRC/SAMREF.PF:15`
- Out: none returned; `cuid` unchanged (`savId` unused). Side effects only through options (`c04`, `c06`, `c07`) and `F6` (`c02`).
- Program state between calls: `*inlr` on every exit → files closed, static storage reinitialised (`panel = 1`, `step01 = prp`); the SQL cursor is already closed after each load (`c01`). — `ORD200.PGM.SQLRPGLE:59-60,129,287`

## Behaviour as implemented

1. `CUS200` calls synchronously; the customer list is not reloaded on return (the customer's `CULASTORD` / credit shown there may be stale after an `F6` create — `cus-interactive` card "Navigate to customer's orders"). — `CUS200.PGM.SQLRPGLE:230-233`
2. `F3` (`CA03`) and `F12` (`CA12`) both lead to `pnl00`; the `F12=Cancel` legend implies a different semantic but the effect is the same single-panel exit. — `ATU_SRC/QDDSSRC/ORD200D.DSPF:8-9,87-90`, `ORD200.PGM.SQLRPGLE:148-153`
3. Absence: structural grep of `ATU_SRC/**` for `ORD200` finds `CUS200`, `ORD200D` itself and the literal `'ORD200-1'` reused as the panel id in `ORD201D`; no `SAMMNU` entry, no `*CMD`, no CL.

## Validation rules found in code

None on entry: `cuid` is not validated (`c11`); a `CALL` with the wrong parameter length is a caller error, not detected.

## Edge cases found in code

- **Panel id collision.** `ORD201D.DSPF:50` also displays `'ORD200-1'` at row 1, so the two order lists are indistinguishable by screen id; only the header (customer line present in `ORD200`, `F5`/`F11` legends in `ORD201`) tells them apart. — `ORD200D.DSPF:46`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:50`
- **Activation group.** `dftactgrp(*no)` with no `ACTGRP` → default `QILE` on `CRTBNDRPG`/`CRTSQLRPGI` (inferred; build owner to confirm). `*inlr` closes files each call regardless. — `ORD200.PGM.SQLRPGLE:5`
- **Direct `CALL`** with a customer that has no orders / does not exist → header with blank name, empty list (`c01`, `c11`); `F6` still offered.

## Dependencies

- `CUS200.PGM.SQLRPGLE` (`cus-interactive`, documented) — cited only

## Assumptions / unknowns

- Activation group inferred from the `H` spec; not asserted.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:37-38,230-233` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:5,15-19,59-61,129,146-153,286-288` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:8-9,46,87-90` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:50` · `ATU_SRC/QDDSSRC/SAMREF.PF:15`
