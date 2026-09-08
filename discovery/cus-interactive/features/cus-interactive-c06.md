# cus-interactive-c06 — Navigate to customer's orders (option 5 → ORD200)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B — thin seam-edge card) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option 5 on a `CUS200` list row calls external program `ORD200` with the row's `CUID`; on return the option is cleared and the list continues. `ORD200` behaviour belongs to `ord-maintain-ord200` and is **not** documented here.

## Entrypoints

- Prototype `orders PR extpgm('ORD200')`, one parameter `like(cuid)` (5P 0) — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:37-38`
- `s01act` `when opt01 = 5` → `orders(cuid)` — `:230-233`
- Legend "5=Orders" — `ATU_SRC/QDDSSRC/CUS200D.DSPF:55`
- Callee interface: `ORD200 PI cuid like(orcuid)` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:18-19`

## Inputs / outputs / observables

- Input: `CUID` of the changed subfile row (value read back by `READC`).
- Output: none in `CUSTOMER`; after return `OPT01 = 0` and the subfile row is updated. — `:232-233`

## Behaviour as implemented

1. `READC SFL01` → `opt01 = 5` → synchronous `CALL ORD200(cuid)`; `CUS200`'s display is suspended while `ORD200` owns the screen. — `:216,230-231`
2. On return: clear option, `UPDATE SFL01`, remain in `s01act` so the next changed row is processed (multiple option-5 rows chain one call after another). — `:232-233,215-237`
3. No parameter is returned; `CUS200` does not re-read the customer after the call, so any `CULASTORD` change made by order maintenance is not visible in the list until reload. — `:129-144` (only load path)

## Validation rules found in code

- Option value validated in `c12` (only 2 and 5 allowed).
- No check that the customer has orders; `ORD200` decides what to show.

## Edge cases found in code

- `ORD200` is resolved at run time via `*LIBL` (`extpgm('ORD200')` with no library) — call fails with an RPG exception if not on the library list. — `:37`
- Both programs run in the same activation group family (`DFTACTGRP(*NO)`, default `ACTGRP` for `CRTBNDRPG`), so files opened by `ORD200` are independent of `CUS200`'s `CUSTOME1/2`.

## Dependencies

- `ORD200.PGM.SQLRPGLE` (slice `ord-maintain-ord200`, candidate/unbound — dep only).

## Assumptions / unknowns

- None specific; the seam edge is the call signature.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:37-38,215-237` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:55` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:16-19`
