# ord-maintain-ord200-c13 — Delete ordering differs from ORD201

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — divergence between twins) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Both order lists delete an order with the same two statements but in opposite order and with a different screen outcome. `ORD200`: header first (`delete orid order1`), then lines (`dou not %found; delete orid detord1`), row left as loaded. `ORD201`: lines first, then header, then `orid = 0; oryear = 0` so the row shows a blank order. Same guards, same triggers, same absence of confirmation and commitment control. The difference is the failure residue and what the operator sees afterwards.

## Entrypoints

- `ORD200` `s01act when opt01 = 4` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:229-235`
- `ORD201` `s01act when opt01 = 4` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:233-241`

## Inputs / outputs / observables

- Identical inputs: row `orid`; `ORDER1` and `DETORD1` both `UF`. — `ORD200.PGM.SQLRPGLE:7-8`, `ORD201.PGM.SQLRPGLE:7,10`
- Identical end state on success: header and all lines gone; `ORD700` delete fired per line (`ord-trigger-ord700-c03`); `CULASTORD` untouched (`c12`).
- Different screen: `ORD200` row keeps `ORID`, `ORYEAR`, dates, `SUMORD`; `ORD201` row shows `ORID = 0`, `ORYEAR = 0` (`EDTCDE(2)`/`EDTCDE(Z)` → blank), dates and value as loaded. — `ORD200.PGM.SQLRPGLE:234-235`, `ORD201.PGM.SQLRPGLE:238-241`, `ATU_SRC/QDDSSRC/ORD200D.DSPF:19-22`

## Behaviour as implemented

| Step | `ORD200` | `ORD201` |
| --- | --- | --- |
| 1 | `delete orid order1` | `dou not %found(); delete orid detord1; enddo` |
| 2 | `dou not %found(); delete orid detord1; enddo` | `delete orid order1` |
| 3 | `opt01 = 0` | `orid = 0; oryear = 0; opt01 = 0` |
| 4 | `update sfl01` | `update sfl01` |

- `dou` executes at least once; `delete` by partial key on `DETORD1` removes the first matching line each iteration; `%found` off ends the loop. Neither program monitors for errors. — `ORD200.PGM.SQLRPGLE:231-233`, `ORD201.PGM.SQLRPGLE:234-236`

## Validation rules found in code

Same guards in both (`c08`): not closed (screen `datclo`), no line with `ODQTYLIV > 0` (file read). `ORD200` additionally cannot reach the delete when a `2` is typed anywhere on the screen (`c09`).

## Edge cases found in code

- **Failure residue.** A lock or I/O failure between the two deletes is unmonitored and ends the program: `ORD200` leaves **orphan lines with no header** (the `ORDERCUS` view will not show them; `ART801` joins `"ORDER"` to `DETORD` so they drop out of aggregates; the `ORD700`-maintained `ARCUSQTY` keeps their quantity); `ORD201` leaves **a header with some lines missing** (visible, `SUMORD` reduced). — `ORD200.PGM.SQLRPGLE:230-233`, `ORD201.PGM.SQLRPGLE:234-237`, `ATU_SRC/QSQLSRC/ART801.SQLPRC:25-33`
- **Ghost row (`ORD200` only).** Re-selecting the deleted row: `4` is a silent no-op; `5`/`6` call the callee with a missing order; `7`/`8` chain-miss then `update forde` → unmonitored exception (`c04`, `c06`, `c07`). In `ORD201` the blanked row with `orid = 0` produces the same class of outcomes for `7`/`8` (chain on key 0 misses) — the blanking is cosmetic, not a guard. — `ORD201.PGM.SQLRPGLE:251,262`
- **Which lock is hit first.** `ORD200` contends for the header lock first (an open `ORD101` session on the order holds it, `ord-entry-ord101-c02`), so it fails before touching any line; `ORD201` deletes the lines first and then fails on the header — the worse residue for the case that is most likely in practice.
- **Orphan lines are not reachable from any screen.** `ORD101` is only called with an `orid` from a list; the lists come from `ORDERCUS` (header required). Cleanup would be manual / `ORD901`-class batch (`ord-batch-ord900`, deferred).

## Dependencies

- `ORDER1.LF`, `DETORD1.LF` — `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
- `ord-maintain-ord201` (twin; bound, queued) — contrast only
- `ord-trigger-ord700-c03` — per-line delete effect, cited only

## Assumptions / unknowns

- needs-SME / room: the target has one delete path; lines-then-header inside a transaction removes both residues. Whether the `ORD200` screen behaviour (row remains) or the `ORD201` one (row blanked) is the parity reference is a room decision, not Discovery's.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7-8,229-235` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:7,10,233-241,251,262` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:19-22` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:25-33`
