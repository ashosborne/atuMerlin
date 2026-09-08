# ord-entry-ord100-c12 — Staged line numbering gaps until confirm

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

While an order is being built, `ODLINE` is taken from a running counter `count` (3 0) that is incremented on **every add attempt** — including one where the article prompt was cancelled — and never decremented on delete. The numbers shown in the `Line` column and on `FMT02` therefore have gaps. At confirm the same variable is reset and the staged rows are renumbered `1..n` in staged-line order, so the persisted `DETORD` rows are contiguous and the numbers the user saw are not the numbers stored.

## Entrypoints

- `count` definition and reset — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:62,330`
- Increment on add — `ORD100.PGM.RPGLE:261-262` (inside the create branch of `S02prp`, after the cancel test at `:254-257`)
- Delete does not touch `count` — `ORD100.PGM.RPGLE:221-231`
- Renumbering at confirm — `ORD100.PGM.RPGLE:201-205`
- Display of the staged number: `LINE` in `SFL01` (from `odline`), `ODLINE` on `FMT02` — `ATU_SRC/QDDSSRC/ORD100D.DSPF:19,124`, `ORD100.PGM.RPGLE:118`

## Inputs / outputs / observables

- Staged `ODLINE` values: `1, 2, 3, …` in order of add attempts, with holes where lines were deleted or the article prompt was cancelled.
- Persisted `ODLINE` values: `1..n` for the `n` rows present at confirm.
- The staging file's key is `(ODLINE, ODORID, ODYEAR)`, so staged rows sort by attempt number and the renumbering preserves entry order. — `ATU_SRC/QDDSSRC/DETORD.PF:21-23`

## Behaviour as implemented

1. `*inzsr`: `count = 0`. — `ORD100.PGM.RPGLE:330`
2. Add (`S02prp`, `create` on): `count += 1; odline = count;` — executed even if `sltArticle` returned blank, because the cancel branch does not leave the subroutine (`c03`). — `ORD100.PGM.RPGLE:253-262`
3. Delete (`s01act`, option 4): the row is removed from the file; `count` unchanged (`c05`). — `ORD100.PGM.RPGLE:221-231`
4. Confirm (`s01act`, `F8`): `count = 0;` then per staged row `count += 1; odline = count; write fdeto;`. — `ORD100.PGM.RPGLE:201-206`

## Validation rules found in code

None. `count` is `3 0` — the 1,000th increment is an unmonitored size exception (theoretical). — `ORD100.PGM.RPGLE:62`

## Edge cases found in code

- **First-pass cancel.** The automatic article prompt after customer selection (`c01`) cancelled → `count = 1` with no row; the first real line is staged as `2`.
- **Chain/delete by `ODLINE` rely on uniqueness of the attempt number** within the `QTEMP` copy — guaranteed because `count` only grows within one run and the copy is emptied per wrapper run (`c02`). — `ORD100.PGM.RPGLE:224,264`
- `count` is reused as the renumbering counter, so after confirm it equals the number of persisted lines (irrelevant — the program ends).
- The user-visible staged number and the printed/persisted number differ whenever any gap exists; `ORD500` prints the persisted `ODLINE`.

## Dependencies

- Staging file `TMPDETORD` (`c02`); `DETORD.PF:8,21-23` (`ODLINE` 5P 0 via `SAMREF.PF:37-39`)

## Assumptions / unknowns

- None; fully observable in code. Recorded so later stations do not treat the staged numbering as a contract.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:62,118,201-206,221-231,253-262,330` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:19,124` · `ATU_SRC/QDDSSRC/DETORD.PF:8,21-23` · `ATU_SRC/QDDSSRC/SAMREF.PF:37-39`
