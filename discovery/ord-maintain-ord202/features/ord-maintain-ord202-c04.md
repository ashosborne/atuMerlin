# ord-maintain-ord202-c04 — Callers ORD200 / ORD201 option 5

| | |
| --- | --- |
| Slice | `ord-maintain-ord202` |
| Status | `documented` (as-is behaviour card, Phase B — seam edge) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD202` has exactly two callers under `ATU_SRC`: option `5` in `ORD200` (per-customer list) and option `5` in `ORD201` (all-orders list), both through a prototype `dspord extpgm('ORD202')` with one `like(orid)` parameter passed **by reference**, called synchronously from `s01act`. There is no menu item, command, CL or other program that calls it. Neither caller guards the option on order state or existence, so a closed, delivered or **deleted (ghost)** order can be sent to `ORD202`; after the return each caller clears the option and rewrites the row without reloading.

## Entrypoints

- `ORD200` `s01act` `when opt01 = 5 → dspord(orid); opt01 = 0; update sfl01` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:236-239`
- `ORD201` `s01act` `when opt01 = 5 → dspord(orid); opt01 = 0; update sfl01` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:242-245`
- Prototypes `d dspord pr extpgm('ORD202') / d x like(orid)` — `ORD200.PGM.SQLRPGLE:24-25`, `ORD201.PGM.SQLRPGLE:21-22`
- Callee interface `d ord202 pi / d id like(orid)` — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:16-19`

## Inputs / outputs / observables

- In: the caller's `orid` — the `FORDE` buffer field of the **subfile row just read** by `READC` (`ORD200`) / `readc` after `SFLNXTCHG` (`ORD201`), `6P 0`, by reference (`like(orid)` on both sides, no `const`/`value`). — `ORD200.PGM.SQLRPGLE:24-25,236`, `ORD201.PGM.SQLRPGLE:21-22,242`
- Out: none — `ORD202` never writes `id` (`c03`), returns nothing, changes no data. The caller's observable effect is the display itself, then the row rewritten with option `0`. — `ORD200.PGM.SQLRPGLE:237-239`, `ORD201.PGM.SQLRPGLE:243-245`

## Behaviour as implemented

1. Caller validates the option only as a range (`ORD200`: `1`, `3`, `>8` refused; `ORD201`: `1`, `>8`) — `5` has **no state guard** in either twin (`ord-maintain-ord200-c05`, `ord-maintain-ord201-c05`). — `ORD200.PGM.SQLRPGLE:168`, `ORD201.PGM.SQLRPGLE:166-222`
2. Caller calls `dspord(orid)`; `ORD202` runs to `*inlr` (`c01`–`c03`) and returns.
3. Caller sets `opt01 = 0`, `update sfl01`; no reload of the row or the list; the caller's own screen is redisplayed on its next `exfmt`. — `ORD200.PGM.SQLRPGLE:238-239`, `ORD201.PGM.SQLRPGLE:244-245`

## Validation rules found in code

None on the callee side; range-only on the caller side.

## Edge cases found in code

- **Ghost row → exception inside `ORD202`, in the caller's job.** `ORD201` option `4` blanks the row to `orid = 0`; `ORD200` option `4` leaves the deleted order's id on the row. Option `5` on either row calls `ORD202` with an id that `ORDER1` no longer holds → unmonitored date exception at `ORD202.PGM.RPGLE:85` (`c01`). The exception is raised in `ORD202`, but the inquiry message and any `C`ancel/`D`ump answer land on the user in the list program's session; a cancel unwinds through `ORD200`/`ORD201` as well (ILE semantics — inference, runtime-confirmable). — `ORD201.PGM.SQLRPGLE:233-241`, `ORD200.PGM.SQLRPGLE:229-235`, `ORD202.PGM.RPGLE:83,85`
- **No existence check in either direction.** The lists rely on the row having come from `ORDERCUS`; `ORD202` relies on the id existing. Between a load and the option pass another job may delete the order — same exception. `F5` in `ORD201` (`ord-maintain-ord201-c08`) is the only refresh; `ORD200` has none. — `ORD202.PGM.RPGLE:83`
- **Closed and delivered orders display normally.** No guard in the caller and none in `ORD202`; the header shows the delivery/close dates when set (`c01`). — `ORD202.PGM.RPGLE:86-91`
- **By-reference parameter, unchanged.** `ORD202` reads `id` only in the two `chain`/`setll`/`reade` keys; the caller's `orid` is the same storage but is not altered. — `ORD202.PGM.RPGLE:83,103-104,111`
- **Only two call sites in the tree.** Structural grep of `ATU_SRC/**` for `ORD202`: the two `extpgm('ORD202')` prototypes and the two members of this slice. No `SAMMNU` option, no `CMD`, no CL wrapper (contrast: `ORD500` has `ORD500C`). Reaching an orphaned order (no customer row) requires a direct `CALL ORD202 PARM(...)`. — absence evidence, `CONTEXT_GATE.md` run 11
- **Legend text on the callers.** `ORD200D`/`ORD201D` advertise `5=Display`; `ORD202D`'s own title reads `'Display a Customer Orders'` and its panel id is its own `'ORD202-1'` (the two list screens share `'ORD200-1'`, `ord-maintain-ord201-c09`). — `ATU_SRC/QDDSSRC/ORD200D.DSPF:61`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:63`, `ATU_SRC/QDDSSRC/ORD202D.DSPF:43-46`

## Dependencies

- `ORD200.PGM.SQLRPGLE` (`ord-maintain-ord200`, documented) and `ORD201.PGM.SQLRPGLE` (`ord-maintain-ord201`, documented) — call sites cited only; their option-5 cards own the caller-side rules
- `bnddir('SAMPLE')` is declared but no bound procedure is used (`c06`); `ORD202` is a `*PGM` called dynamically by name — `ORD202.PGM.RPGLE:5`

## Assumptions / unknowns

- The propagation of the `c01` exception into the caller's session is stated from ILE call-stack semantics, not source. Runtime-confirmable.
- Build definition (`CRTBNDRPG` options, activation group, library) is not in the tree (`overnight/METHOD_COVERAGE.md`).
- needs-SME (room, ORD pack): the target's "display order" entry needs an explicit not-found answer for both the ghost-row and the concurrent-delete case; the legacy answer is an exception.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:24-25,168,229-239` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:21-22,166-222,233-245` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:5,16-19,83,85-91,103-104,111` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:43-46`
