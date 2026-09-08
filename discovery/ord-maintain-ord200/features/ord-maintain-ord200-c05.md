# ord-maintain-ord200-c05 — Option 5 display / option 6 print

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — seam edges) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `5` calls `ORD202(orid)` (read-only order display) and option `6` calls `ORD500(orid)` (order print), each synchronously with the row's order number by reference; the option is cleared and the row rewritten. No guard applies beyond "valid option" — closed, delivered and even just-deleted (`c04` ghost) orders can be displayed or printed. The list is not reloaded on return. What `ORD202` / `ORD500` do is owned by `ord-maintain-ord202` / `ord-print-ord500` (bound, queued).

## Entrypoints

- Legends `5=Display`, `6=Print  ` on `CTL01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:61,65`
- `s01act` `when opt01 = 5; dspord(orid)` / `when opt01 = 6; Prtord(orid)` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:236-243`
- Prototypes `dspord extpgm('ORD202')`, `Prtord extpgm('ORD500')`, one parameter `like(orid)` each — `ORD200.PGM.SQLRPGLE:24-28`

## Inputs / outputs / observables

- In: `orid` (`6P 0`) from the subfile row, by reference. Callees declare `id like(orid)`. — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:16-19`, `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19`
- Out: none in `ORD200`; screen (`ORD202`) or spool (`ORD500`) belong to the callees. Row rewritten with `opt01 = 0`. — `ORD200.PGM.SQLRPGLE:238-239,242-243`

## Behaviour as implemented

1. `s01chk` accepts `5` and `6` unconditionally (only `1`, `3`, `> 8` are invalid; `7`/`8`/`2`/`4` have state guards). — `ORD200.PGM.SQLRPGLE:168-195`
2. `s01act` calls the external program, clears the option, `update sfl01`, then reads the next changed row. — `ORD200.PGM.SQLRPGLE:220-243`
3. Because the files `ORDER1` / `DETORD1` are open in `ORD200` while the callee runs, the callee's own opens are separate ODPs; no lock is held by `ORD200` on the displayed order at this point (the load was an SQL cursor, closed). — `ORD200.PGM.SQLRPGLE:7-8,129`

## Validation rules found in code

None beyond `c08`'s option-value check.

## Edge cases found in code

- **Ghost / stale row.** A row deleted in the same session (`c04`) or by another job can be selected with `5`/`6`; the callee receives an `orid` with no `ORDER` row — its not-found handling is that slice's behaviour. Pointer to `ord-maintain-ord202` / `ord-print-ord500`.
- **No reload after return.** `SUMORD` and dates shown are as loaded; `ORD202` is read-only and `ORD500` prints, so no drift arises from these two options themselves.
- **Legend spacing.** `'6=Print  '` (two trailing blanks) vs `ORD201D`'s `'6=Print'` — cosmetic divergence only. — `ORD200D.DSPF:65`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:67`
- **`PRINT` keyword** at file level allows the operator's Print key to print the screen itself — unrelated to option 6. — `ORD200D.DSPF:10`

## Dependencies

- `ORD202.PGM.RPGLE` (`ord-maintain-ord202`, bound/queued) — cited only
- `ORD500.PGM.RPGLE` (`ord-print-ord500`, bound/queued) — cited only

## Assumptions / unknowns

- None specific to these edges; the callees' not-found behaviour is recorded in their own slices.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7-8,24-28,129,168-195,220-243` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:10,61,65` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:16-19` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:67`
