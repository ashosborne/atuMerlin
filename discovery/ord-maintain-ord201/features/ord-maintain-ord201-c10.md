# ord-maintain-ord201-c10 — Unused file declarations CUSTOME1, ARTICLE1

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — absence / quirk) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUSTOME1` and `ARTICLE1` are declared as input-only keyed files (`if e k disk`) and **never read, chained or positioned**: the only file I/O in the program is on `ORDER1`, `DETORD1` and the display file. Both files are still opened at program start (implicit open) and closed at `*inlr`, so the objects must exist on `*LIBL` for the list to run at all. The customer name comes from the `ORDERCUS` view, not from `CUSTOME1`; nothing article-related is shown. Recorded so that the target does not inherit phantom dependencies on `CUSTOMER`/`ARTICLE` for this screen.

## Entrypoints

- F-specs `fcustome1 if e k disk`, `farticle1 if e k disk` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:8-9`

## Inputs / outputs / observables

- In: none from either file.
- Out: none.
- Observable: the program's open list includes `CUSTOMER` (via `CUSTOME1`) and `ARTICLE` (via `ARTICLE1`) with input-only, shared-read opens — visible in `WRKJOB` open files / `DSPPGMREF`, not on screen. — `ORD201.PGM.SQLRPGLE:8-9`, `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`, `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`

## Behaviour as implemented

1. Implicit open of all five files at initialisation (no `USROPN`). — `ORD201.PGM.SQLRPGLE:7-14`
2. Every `chain`, `setll`, `reade`, `delete`, `update`, `unlock` in the program names `order1`, `detord1`, `forde`, `fdeto` or `sfl01`. Grep for `custome1` / `article1` beyond the F-specs: none. — `ORD201.PGM.SQLRPGLE:200-202,214,234-237,251,257,262-275`
3. `*inlr = *on` in `pnl00` closes them. — `ORD201.PGM.SQLRPGLE:293`

## Validation rules found in code

None.

## Edge cases found in code

- **Field definitions do leak in.** `CUSTOME1` brings the `FCUST` record format into the program, so `CUID` and `CUSTNM` exist as fields **both** from the file and from `SFL01` (`REFFLD(FCUST/…)`); the SQL `fetch … into :cuid, :custnm` writes them. `ARTICLE1` brings `FARTI` (`ARID`, `ARDESC`, …) — none referenced. Removing the F-specs would not change behaviour because the display file defines `CUID`/`CUSTNM` too; stated from the source, not compiled. — `ORD201.PGM.SQLRPGLE:8-9,118-120`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:26-27`
- **Object dependency without data dependency.** A missing or unauthorised `ARTICLE` file stops `ORD201` from starting (open failure, unmonitored) although no article data is ever used. — `ORD201.PGM.SQLRPGLE:9`
- **Twin comparison.** `ORD200` declares `CUSTOME1` and **does** chain it once (header name, `ord-maintain-ord200-c11`); it does **not** declare `ARTICLE1` at all. So both dead declarations are specific to `ORD201`. — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7-10,283`
- **Copy-and-edit residue.** Together with the `'ORD200-1'` panel id (`c09`) and the dead `mode`/`crt`/`upd`/`User` declarations (`c01`), this reads as `ORD201` having been derived from `ORD200` (or vice versa) without pruning. Not a behaviour; recorded for the ORD-pack author.

## Dependencies

- `CUSTOME1.LF` / `CUSTOMER.PF`, `ARTICLE1.LF` / `ARTICLE.PF` — open-time only

## Assumptions / unknowns

- None on behaviour. Whether the target keeps an `ARTICLE` dependency for the order list is trivially "no"; recorded so the ORD pack's dependency list can say so with a citation.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:7-14,118-120,200-202,214,234-237,251,257,262-275,293` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:26-27` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:7-10,283`
