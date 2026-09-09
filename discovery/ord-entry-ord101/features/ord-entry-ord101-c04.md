# ord-entry-ord101-c04 — Quantity validation (delivered vs ordered)

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`S02chk` applies two rules on Enter: `ERR1001` "Delivered quantity must be lower or equal to ordered quantity" when the **new** delivered quantity exceeds the **stored** ordered quantity, and `ERR1002` "Ordered quantity can not be lower that the quantity already delivered" when the **new** ordered quantity is below the **stored** delivered quantity. Each rule compares a typed value against the row as it was **before** the edit, never the two typed values against each other. Consequence (derived directly from the operands): raising both quantities together can be rejected, and lowering both together can be accepted with delivered > ordered stored.

## Entrypoints

- `S02chk` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:248-257`
- `FMT02` error keywords `ERRMSGID(ERR1002 *LIBL/SAMMSGF 38)` on `DSQTY`, `ERRMSGID(ERR1001 *LIBL/SAMMSGF 37)` on `DSQTYLIV` — `ATU_SRC/QDDSSRC/ORD101D.DSPF:119-120,137-138`

## Inputs / outputs / observables

- In: `dsqtyliv`, `dsqty` (typed); `odqty`, `odqtyliv` (record buffer from the `S02prp` chain — the stored values). — `ORD101.PGM.RPGLE:219-221,250,254`
- Out: indicator 37 (`ErrQtyLiv`) → message `ERR1001` under the field, cursor to `DSQTYLIV`; indicator 38 (`ErrQty`) → `ERR1002`, cursor to `DSQTY`; `step02 = dsp` (redisplay, nothing written). Both can be on together. — `ORD101.PGM.RPGLE:51-52,251-256`, `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:21-26`
- The totals are still recomputed from the rejected values and shown on the error screen (`c03` step 4). — `ORD101.PGM.RPGLE:258-260`

## Behaviour as implemented

1. `if dsqtyliv > odqty` → `errqtyliv = *on; step02 = dsp`. — `ORD101.PGM.RPGLE:250-253`
2. `if dsqty < odqtyliv` → `errqty = *on; step02 = dsp`. — `ORD101.PGM.RPGLE:254-257`
3. Both tests run every time (not `else`); `odqty` / `odqtyliv` are only overwritten in `S02act` **after** a clean check, so within one screen the "stored" side is stable. — `ORD101.PGM.RPGLE:267-268`
4. Indicators 37/38 are never set off in RPG; the DDS uses the same indicator as option and response indicator (`ERRMSGID(… 37)`), the idiom by which the display resets it on the next input. Message text and cursor position come from `SAMMSGF` / the field the keyword sits on. — `ORD101D.DSPF:120,138`, `ORD101.PGM.RPGLE:51-52`

## Validation rules found in code

| Rule | Operands | Message |
| --- | --- | --- |
| `ERR1001` | typed delivered `>` **stored** ordered | Delivered quantity must be lower or equal to ordered quantity. |
| `ERR1002` | typed ordered `<` **stored** delivered | Ordered quantity can not be lower that the quantity already delivered. |

No rule compares typed ordered with typed delivered; no rule on 0 or negative values; no rule on price.

## Edge cases found in code

Worked from the operands (stored `ODQTY = 10`, `ODQTYLIV = 5`):

- **Both raised, consistent** (`DSQTY = 20`, `DSQTYLIV = 15`): rule 1 `15 > 10` → `ERR1001` although 15 ≤ 20. Operator must save the quantity first, then the delivered quantity in a second edit.
- **Both lowered, inconsistent** (`DSQTY = 6`, `DSQTYLIV = 8`): rule 1 `8 > 10` false, rule 2 `6 < 5` false → **accepted**; row stored with delivered 8 > ordered 6. Nothing downstream re-checks: `ORD700` applies `(new.odqty − new.odqtyliv)` deltas as signed arithmetic (`ord-trigger-ord700-c04`), and the `ORD200` / `ORD201` deliver step only touches lines with `ODQTYLIV = 0`.
- **Delivered set to 0** on a line already delivered: rule 2 `dsqty < 5`? only if ordered was also lowered; otherwise accepted — a delivery can be "undone" per line here while the order-level `ORDATDEL` stays set (`ORD201.PGM.SQLRPGLE:261-265`).
- **Negative or zero quantity**: `DSQTY = 0` passes when `ODQTYLIV = 0`. A negative `DSQTY` always fails rule 2 (`−3 < 0` is true for any stored delivered ≥ 0), so negatives are blocked on ordered — as a side effect, not by design. A negative `DSQTYLIV` passes rule 1 (`−3 > 10` is false), so negatives are **not** blocked on delivered.
- Error screen shows recomputed `ODTOT` / `VAT` / `ODTOTVAT` for the rejected figures (`c03`).

## Dependencies

- `SAMMSGF` message file (`ERR1001`, `ERR1002`) — `SAMMSGF.MSGF:21-26`
- `INDARA` indicator area mapping (`indds`) — `ORD101.PGM.RPGLE:33-53`, `ORD101D.DSPF:8`
- Stored row from `S02prp` (`c03`).

## Assumptions / unknowns

- needs-SME (Phase A question 3, now with worked cases): is "compare against the stored row" the intended semantics, or should the target compare the two new values? The as-is rule rejects one legitimate sequence and admits one inconsistent state.
- needs-SME: negative delivered quantity is not blocked; negative ordered quantity is blocked only through rule 2.
- Runtime, not source: message persistence relies on the DDS response-indicator idiom, not on RPG code.

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:33-53,219-221,248-260,267-268` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:8,119-120,137-138` · `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:21-26` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:261-276`
