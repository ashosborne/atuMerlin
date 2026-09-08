# ord-maintain-ord201-c05 — Option 5 display / option 6 print

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — seam edges) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`5` calls `ORD202(orid)` (read-only order display), `6` calls `ORD500(orid)` (print to `ORD500O`, then PDF via `ORD500C`), both synchronous, `orid` by reference; the option is cleared and the row rewritten, nothing reloaded. There is **no state guard**: open, closed, delivered and ghost (blanked after `4`) orders can all be displayed or printed; the callee's own `chain` handling applies. Identical to `ORD200` except the legend literal (`'6=Print'` here, `'6=Print  '` there).

## Entrypoints

- Legends `5=Display`, `6=Print` on `CTL01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:63,67`
- Action: `s01act` `when opt01 = 5` → `dspord(orid)`; `when opt01 = 6` → `Prtord(orid)` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:242-249`
- Prototypes `dspord pr extpgm('ORD202')`, `Prtord pr extpgm('ORD500')`, one parameter `like(orid)` each — `ORD201.PGM.SQLRPGLE:21-25`

## Inputs / outputs / observables

- In: row `orid` (`6P 0`), passed by reference; both callees declare `id like(orid)` and read it only. — `ORD201.PGM.SQLRPGLE:243,247`, `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:16-19`, `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19`
- Out (data): none from `ORD201`. `ORD500` produces a spooled file and calls `ORD500C` (`ord-print-ord500`, queued). — `ORD500.PGM.RPGLE:6,21-23`
- Out (screen): `opt01 = 0; update sfl01` after return; no message, no re-read. — `ORD201.PGM.SQLRPGLE:244-245,248-249`

## Behaviour as implemented

1. `s01chk` has no rule for `5` or `6` (only `1`, `>8`, `7`, `8`, `2`, `4` are tested) — they always pass (`c07`). — `ORD201.PGM.SQLRPGLE:172-216`
2. `s01act`: call, clear, `update sfl01` (changed flag cleared), next changed row on the next cycle. — `ORD201.PGM.SQLRPGLE:242-249`
3. Several `5`/`6` on one pass run one after another; a display or print of each in order.

## Validation rules found in code

None. No existence check, no state check.

## Edge cases found in code

- **Ghost order.** After `4` the row's `orid` is `0`; `5`/`6` call `ORD202(0)` / `ORD500(0)`. Both callees `chain id order1` first (`ORD202.PGM.RPGLE:83`, `ORD500.PGM.RPGLE:31`); their not-found behaviour belongs to `ord-maintain-ord202` / `ord-print-ord500` (queued) and is cited, not documented, here. — `ORD201.PGM.SQLRPGLE:238,243,247`
- **Print with no confirmation.** `6` prints immediately — a spooled file and (via `ORD500C`) an IFS PDF per press; nothing on the screen changes. — `ORD500.PGM.RPGLE:21-23`
- **File sharing.** `ORD202` and `ORD500` open `ORDER1`, `DETORD1`, `CUSTOME1`, `ARTICLE1` as `IF` in their own scope; no lock conflict with `ORD201` (which holds none at the time). — `ORD202.PGM.RPGLE:7-10`, `ORD500.PGM.RPGLE:8-11`
- **Legend text.** `'6=Print'` (no trailing blanks) vs `ORD200D` `'6=Print  '`; cosmetic. — `ORD201D.DSPF:67` vs `ATU_SRC/QDDSSRC/ORD200D.DSPF:65`

## Dependencies

- `ORD202.PGM.RPGLE` (`ord-maintain-ord202`, bound, queued) — `ORD202.PGM.RPGLE:16-19`
- `ORD500.PGM.RPGLE` → `ORD500C.PGM.CLLE` (`ord-print-ord500`, bound, queued) — `ORD500.PGM.RPGLE:15-23`

## Assumptions / unknowns

- Not-found handling for a ghost `orid` lives in the callees; carried as a pointer for their runs.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:21-25,172-216,238,242-249` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:63,67` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:7-19,83` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:6-23,31` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:65`
