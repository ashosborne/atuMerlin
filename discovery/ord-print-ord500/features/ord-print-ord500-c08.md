# ord-print-ord500-c08 — Unknown order id: unmonitored date exception, not a blank document (Phase A corrected)

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B — edge behaviour) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`; bound under the Phase A name "Unknown order id prints blank document") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Phase A recorded "no `%found` check after `chain ORDER1` → prints with blank header fields". The first half is right; the conclusion is not. The very next statement is `datord = %date(ORDATE:*iso)` with no guard: on a miss `ORDATE` is `0` (fresh call — `c07`), `%date(0:*iso)` is invalid, and the program raises an **unmonitored date exception (RPG status 00112) before the first `write`**. No document — blank or otherwise — is produced, no PDF is written, and the failure surfaces in the caller's interactive session. This is the print-path twin of `ord-maintain-ord202-c01`: the same two statements, the same absence of `%found`, `monitor`, `(e)` and `*PSSR`.

## Entrypoints

- `chain id order1; datord = %date(ORDATE:*iso);` — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:31-32`
- Producers of a not-found id: `ORD200` / `ORD201` option `6` on a ghost row or after a concurrent delete (`c05`); a direct `CALL ORD500` with an arbitrary id. `ORD100` cannot produce one (it prints the id it has just written — `ORD100.PGM.RPGLE:190-209`).
- Twin: `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:83,85` (`ord-maintain-ord202-c01`)

## Inputs / outputs / observables

- In: an `id` with no `ORDER1` row (`UNIQUE`, `K ORID`). — `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`
- Out: nothing printed; nothing converted; `PATH` not read. Observable: an exception in the calling job (inference: the default handler issues an `RNQ0112` inquiry message — "Date, Time or Timestamp value is not valid" — in the interactive session; options include cancel, which unwinds through the caller). — `ORD500.PGM.RPGLE:32`
- Side artefact: the printer file `ORD500O` was **opened at program start** (not `usropn`), so a spooled file was created before the failure. Whether an empty spooled file is left in the output queue after the abnormal end is runtime-confirmable (spool creation on open is the platform rule; disposition of a never-written spooled file on abnormal close is not visible from source). — `ORD500.PGM.RPGLE:6`

## Behaviour as implemented

1. `datord = %date()` — dead preset (`c07`). — `ORD500.PGM.RPGLE:30`
2. `chain id order1` — miss leaves the `FORDE` buffer at its initial values on a fresh call (every normal call ends with `*inlr`, `c07`); `%found` not tested. — `ORD500.PGM.RPGLE:31`
3. `datord = %date(ORDATE:*iso)` with `ORDATE = 0` → `00000000` is not a valid `*ISO` date → status 00112; no `monitor` block, no `(e)` extender, no `*PSSR`, no `INFSR` → the exception is unhandled in `ORD500`. — `ORD500.PGM.RPGLE:32`
4. Nothing after line 32 runs: no `write header`, no lines, no `close`, no `getParm2`, no `ORD500C`. — `ORD500.PGM.RPGLE:33-59`

Had the conversion not failed (it always does for `ORDATE = 0`), the document would have shown the "blank header fields" Phase A described, plus the lines of order `0` (`setll (orid)` with `orid = 0` — none in-tree) and blank totals; the PDF would have been `Custord0.pdf`. That path is **unreachable** as written — recorded so nobody preserves it.

## Validation rules found in code

None. There is no existence check and no error path of any kind in `ORD500` or `ORD500C`.

## Edge cases found in code

- **Ghost row, option `6`**: after a delete `ORD201` blanks the row to `orid = 0`, `ORD200` leaves the deleted id; neither guards option `6` (`ord-maintain-ord201-c04`/`c05`, `ord-maintain-ord200-c04`/`c05`). Option `6` on that row → this exception, in the list program's session, with the list program's subfile still on the screen behind the inquiry. Identical to option `5` (`ord-maintain-ord202-c04`). — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:240-243`, `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:246-249`
- **Concurrent delete** between list load and option `6` — same result.
- **Zero or invalid stored `ORDATE`** → same exception for an order that *does* exist. No in-tree writer stores `ORDATE = 0` (`ORD100:194` writes today; `ORD901:21` shifts an existing date), so in-tree data never hits it; the list twins would show such an order (via `ISOTODATE40`, `dat-utils-c01`) and both option `5` and option `6` would fail on it. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:194`, `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21`
- **Missing customer is a different case**: the customer chain (`c06`) also lacks `%found`, but nothing converts a customer field, so a missing customer prints a document with a blank address block — *that* is the "blank fields" outcome, for the customer, not the order.
- **After the exception**: the caller's step is abandoned at the point of the call — in `ORD200`/`ORD201` the option is **not** cleared (`opt01 = 0` follows the call), so if the user resumes the program the `6` is still on the row. In `ORD100` this case cannot arise. — `ORD200.PGM.SQLRPGLE:241-242`, `ORD201.PGM.SQLRPGLE:247-248`

## Dependencies

- `ORDER1.LF` (`UNIQUE`, `K ORID`) — `ORDER1.LF:4-6`
- Callers `ORD200` / `ORD201` (`c05`); twin `ORD202` (`ord-maintain-ord202-c01`, documented).

## Assumptions / unknowns

- The exception surface (status 00112 → `RNQ0112` inquiry; reply options; what happens to the open spooled file; whether the module is re-initialised on the next call after an abnormal end) is stated from ILE RPG runtime semantics — the source shows only the unguarded `%date` and the absence of any handler. Runtime-confirmable on the box.
- needs-SME / room (carried from run 11 for `ORD202`, now for both twins): what should "print order" do in the target for an id that no longer exists — error, empty document, or nothing? Legacy: an unhandled exception. One answer covers option `5` and option `6`.
- Phase A statement corrected: `CANDIDATES.md` row `c08` ("prints with blank header fields (no error path)") — the "no error path" part is what makes it *crash*, not print. `CANDIDATES.md` left as the Phase A record; the correction is recorded here, in `MANIFEST.yaml` and in `SME_BRIEF.md`.

## Evidence

`ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:6,30-33,53` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:83,85` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:240-243` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:246-249` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:190-209` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:21`
