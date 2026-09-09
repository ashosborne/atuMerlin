# ord-entry-ord100-c08 — Print and acknowledge after confirm

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B; thin seam-edge card to `ord-print-ord500`) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Immediately after the lines are written (`c07`), `ORD100` calls `ORD500` synchronously with the new order number, then shows the window `FMT03` ("Order *n* has been create for user *cuid name* / The order is printed. / Press Enter to continue.") and ends. The acknowledgement is unconditional — `ORD500` has no return value and no error is monitored — and every key on `FMT03` (Enter, `F3`, `F12`) leads to the same end of program.

## Entrypoints

- `s01act` confirm branch tail: `prtOrd(orid); exfmt fmt03; panel = 0; leavesr` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:209-212`
- Prototype `Prtord pr extpgm('ORD500')` with one parameter `like(orid)` — `ORD100.PGM.RPGLE:30-31`; callee entry `ord500 pi id like(orid)` — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19`
- `FMT03` `WINDOW(7 10 7 50)` — `ATU_SRC/QDDSSRC/ORD100D.DSPF:128-141`

## Inputs / outputs / observables

- In: `ORID` (6P 0) just allocated; `ORCUID`, `CUSTNAME` for the window text.
- Out: whatever `ORD500` produces (printer file `ORD500O` spool + a PDF via `ORD500C` — owned by `ord-print-ord500`, cited as the callee boundary only) — `ORD500.PGM.RPGLE:6,21-23,56-59`
- Observable: the confirmation window over the list; program ends on any key.

## Behaviour as implemented

1. `prtOrd(orid)` — dynamic call to `*LIBL/ORD500`, order number by reference. `ORD500` re-reads the order from `ORDER1`/`DETORD1`/`CUSTOME1`/`ARTICLE1` (the rows written a moment earlier by `c07`). — `ORD100.PGM.RPGLE:209`, `ORD500.PGM.RPGLE:8-11,30-38`
2. `exfmt fmt03` — window text uses `ORID`, `ORCUID`, `CUSTNAME` ("has been create for user" is the literal wording). — `ORD100.PGM.RPGLE:210`, `ORD100D.DSPF:132-140`
3. `panel = 0; leavesr` → next cycle pass `pnl00` sets `*inlr`. — `ORD100.PGM.RPGLE:211-212,333-335`

## Validation rules found in code

None. "The order is printed." is asserted, not verified.

## Edge cases found in code

- **Print failure.** `ORD500` runs unmonitored; an exception there surfaces as an RPG inquiry message *after* the order has been committed to `ORDER`/`DETORD` and the number consumed, and before the acknowledgement. — `ORD100.PGM.RPGLE:209`
- **Zero-line order** is printed too (header only; `ORD500` loops `reade (orid) detord1` zero times). — `ORD500.PGM.RPGLE:37-39`
- **`ODYEAR = 0`** (`c07`) is irrelevant to the print: `ORD500` positions `DETORD1` by `ORID` only. — `ORD500.PGM.RPGLE:37-38`, `ATU_SRC/QDDSSRC/DETORD1.LF:6-7`
- `F3` / `F12` on `FMT03` set indicators 03/12 but the code after `exfmt fmt03` ignores them (`panel = 0` regardless). — `ORD100D.DSPF:8-9`, `ORD100.PGM.RPGLE:210-211`
- `ORD500` is called by reference with a 6P 0 field, matching its `like(orid)` parameter (both reference `ORDER`'s `ORID`). — `ORD100.PGM.RPGLE:31`, `ORD500.PGM.RPGLE:16`

## Dependencies

- `ORD500.PGM.RPGLE` (and its callee `ORD500C` for PDF) — slice `ord-print-ord500` (Phase A candidate, unbound); this card documents only the call boundary.
- `ORDER1.LF`, `DETORD1.LF` read by the callee.

## Assumptions / unknowns

- None specific to this seam beyond the print station's own behaviour (out of scope here).

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:30-31,209-212,333-335` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:8-9,128-141` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:6,8-11,15-23,30-39,56-59` · `ATU_SRC/QDDSSRC/DETORD1.LF:6-7`
