# ord-print-ord500-c05 — Callers of ORD500

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B — call graph) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Exactly three call sites under `ATU_SRC/**`, all RPG, all synchronous, all passing `orid` by reference through the prototype `Prtord … extpgm('ORD500')`, none monitored and none reading a result: `ORD100` prints **every** confirmed order immediately after writing it and before the confirmation window; `ORD200` and `ORD201` print on option `6` with no state or existence guard. `ORD101` declares the prototype and never calls it. There is no menu, command, CL or job-scheduler entry — the print is never invoked on its own.

## Entrypoints

- `ORD100` — `d Prtord pr extpgm('ORD500')` / `x like(orid)`; call `prtOrd(orid)` in the confirm branch — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:30-31,209`
- `ORD200` — prototype and `when opt01 = 6; Prtord(orid); opt01 = 0; update sfl01;` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:27,240-243`
- `ORD201` — same — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:24,246-249`
- `ORD101` — prototype only (`ord-entry-ord101-c08`, dead declaration) — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:27-28`
- Callee interface: `ord500 pi` / `id like(orid)` — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19`

## Inputs / outputs / observables

- In (every site): the caller's `orid` (`6P 0`), by reference; `ORD500` reads it once for the `chain` and never writes it (`c01`).
- Out: none returned. Observables are the spooled file and the PDF (`c01`, `c03`) and — on failure — an unmonitored exception in the caller's session (`c03`, `c08`).
- `ORD100` after the call: `exfmt fmt03` — `WINDOW(7 10 7 50)` `'Confirmation'`: `Order <ORID> has been create for user <ORCUID> <CUSTNAME>` / `'The order is printed.'` / `'Press Enter to continue.'` — then `panel = 0` (program ends). — `ORD100.PGM.RPGLE:210-212`, `ATU_SRC/QDDSSRC/ORD100D.DSPF:128-141`
- `ORD200` / `ORD201` after the call: option cleared, subfile row rewritten, **no reload** — the screen looks unchanged. Legend `6=Print` (`ord-maintain-ord200-c05`, `ord-maintain-ord201-c05`).

## Behaviour as implemented

1. **`ORD100` (order entry)**: in the confirm branch, `ORDER` header written (`ORID = ordno`, `ORDATE = today`, `ORDATDEL = ORDATCLO = 0`), the `DETORD` lines copied from the temporary file, then `prtOrd(orid)`, then the confirmation window. The print is **unconditional** — there is no "print? Y/N" and no way to confirm without printing. The user waits for spool + PDF before the window appears. The window's `'The order is printed.'` is a literal; it is shown only because control came back (a failure would have surfaced as an exception first — `c03`). `ord-entry-ord100-c08` owns the caller-side card. — `ORD100.PGM.RPGLE:190-212`, `ORD100D.DSPF:128-141`
2. **`ORD200` (orders of one customer) / `ORD201` (all orders)**: option `6` on any subfile row → `Prtord(orid)` → `opt01 = 0; update sfl01`. No check that the order is open, delivered, closed or still exists; `orid` is whatever the row holds. — `ORD200.PGM.SQLRPGLE:240-243`, `ORD201.PGM.SQLRPGLE:246-249`
3. **`ORD101`**: prototype declared, `Prtord` never referenced — no print from line maintenance; a line change is reflected in the document only when someone re-prints from a list. — `ORD101.PGM.RPGLE:27-28`
4. **`ORD500C`** is called by `ORD500` only (`c03`); `CVTSPLPDF` is referenced only there.

## Validation rules found in code

None at any call site: no state guard, no existence guard, no `monitor`, no check of the print outcome.

## Edge cases found in code

- **Ghost row → exception in the list program's session** (`c08`): after a delete, `ORD201` blanks the row to `orid = 0` and `ORD200` leaves the deleted id on the row (`ord-maintain-ord201-c04`/`c05`, `ord-maintain-ord200-c04`/`c05`); option `6` on such a row, or on an order deleted by another job since the load, calls `ORD500` with an id `ORDER1` no longer has → `%date(0)` → unmonitored status 00112 inside `ORD500`. Twin of `ord-maintain-ord202-c01`/`c04` (option `5`). — `ORD500.PGM.RPGLE:31-32`
- **Re-print at any state**: option `6` on a delivered or closed order prints the same document as for an open one (`c01`) and replaces the PDF (`c03`).
- **Print as a side effect of entry**: every order created through `ORD100` produces one spooled file and one PDF at creation time, synchronously in the interactive job. Orders created any other way (none in the tree — `ORD100` is the only writer of new `ORDER` rows) would have no PDF until re-printed.
- **Failure in the print path aborts the caller's step, not the order**: in `ORD100` the header and lines are already written when `prtOrd` runs; an exception in `ORD500`/`ORD500C` leaves the order on file and the confirmation window unshown (inference from statement order; no commitment control in the tree). — `ORD100.PGM.RPGLE:190-209`
- **Parameter by reference, never modified**: `ORD500` does not assign `id`; the caller's `orid` is unchanged (`c01`, `c07`). — `ORD500.PGM.RPGLE:18-19,31`

## Dependencies

- `ORD100.PGM.RPGLE` (`ord-entry-ord100`, documented), `ORD200.PGM.SQLRPGLE` (`ord-maintain-ord200`, documented), `ORD201.PGM.SQLRPGLE` (`ord-maintain-ord201`, documented) — call sites cited only; their cards own the caller-side rules.
- Absence evidence: grep of `ATU_SRC/**` for `ORD500` → the four prototypes and three calls above plus the seed members; no `CALL PGM(ORD500)` in `QCLSRC`, no menu option, no `QCMDSRC` entry.

## Assumptions / unknowns

- needs-SME (Phase A question 3, still open): is the print **mandatory** on every confirm in the target, or an optional / asynchronous side effect? As-is: mandatory and synchronous.
- needs-SME / room: with the not-found answer for `ORD202` (room question from run 11), decide the same for option `6` — one answer covers both twins.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:30-31,190-212` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:128-141` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:27,240-243` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:24,246-249` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:27-28` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19,31-32`
