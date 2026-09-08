# ord-maintain-ord201-c11 — Cursor closed at end

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — quirk / divergence) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`pnl00` — reached when `panel` drops to `0` after `F3` or `F12` — executes `exec sql close c1` and then `*inlr = *on`. The explicit close is needed here because `ORD201` pages: the cursor is normally still open (positioned somewhere in, or past the end of, the result) when the user leaves. `ORD200` loads its whole result in `s01lod` and closes there, so its `pnl00` has no `close` (`ord-maintain-ord200-c01`). `*inzsr` only presets the three date fields to the sentinel; there is no header chain (no parameter).

## Entrypoints

- Mainline `select … other; exsr pnl00;` when `panel ≠ 1` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:69-74`
- `pnl00` — `ORD201.PGM.SQLRPGLE:291-294`
- `*inzsr` — `ORD201.PGM.SQLRPGLE:285-288`

## Inputs / outputs / observables

- In: state of `c1` (open, at any position, or at end-of-data). — `ORD201.PGM.SQLRPGLE:107,118`
- Out: cursor closed; native files (`ORDER1`, `DETORD1`, `CUSTOME1`, `ARTICLE1`, `ORD201D`) closed by `*inlr`; program storage reinitialised on the next call. — `ORD201.PGM.SQLRPGLE:292-293`
- Observable: none on screen; the menu redisplays.

## Behaviour as implemented

1. `F3`: `panel = 0; step01 = prp;` — `F12`: `step01 = prp; panel = panel - 1;` (→ `0`). Next cycle: `panel ≠ 1` → `pnl00`. — `ORD201.PGM.SQLRPGLE:146-151`
2. `exec sql close c1;` — result not tested. — `ORD201.PGM.SQLRPGLE:292`
3. `*inlr = *on;` — the cycle ends, files close, control returns to `SAMMNU`. — `ORD201.PGM.SQLRPGLE:293`
4. `*inzsr` on the next call: `datord = datclo = datliv = d'1940-01-01'`; `panel` (`inz(1)`) and `step01` (`inz(prp)`) start fresh because `*inlr` was on. — `ORD201.PGM.SQLRPGLE:53-54,67,285-288`

## Validation rules found in code

None.

## Edge cases found in code

- **Every exit path closes.** `F5` and `F6` close before reloading (`c08`, `c02`); `F3`/`F12` close in `pnl00`; `PAGEDOWN` at end-of-data leaves the cursor open until one of those. There is no path that ends the program normally with `c1` open. — `ORD201.PGM.SQLRPGLE:152-158,292`
- **Close on a closed cursor.** If `open c1` failed (`c01`), `close c1` returns `-501`; unchecked, harmless.
- **Abnormal end leaves the cursor open (inferred).** An unmonitored exception in `s01act` (`7`/`8` on a ghost row, lock time-out — `c04`, `c06`) ends the program without reaching `pnl00`. SQL cursors in an ILE program are scoped to the activation group by default (`CLOSQLCSR(*ENDACTGRP)`); if the activation group survives (inferred `QILE`, `c09`), the next `call ORD201` in the same job runs `open c1` on an already-open cursor → `-502` → `sqlcod ≠ 0` before the first fetch → **empty list, no message**, until the activation group is reclaimed or the job ends. Stated from SQL/ILE contract, not observed; runtime-confirmable, and depends on the compile-time `CLOSQLCSR` and `ACTGRP` (build owner). — `ORD201.PGM.SQLRPGLE:107,117`
- **Static storage is reset.** Because `*inlr` is set, `rrs01`, `count`, `panel`, `step01` all reinitialise; nothing carries over between calls (unlike a `return` without `*inlr`).
- **Twin comparison.** `ORD200`: `close c1` at `s01lod:129` after `dow sqlcod = 0` runs to end; `pnl00` = `*inlr = *on` only. — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:123-129,286-288`
- **No header context to reset.** `ORD200`'s `*inzsr` also chains `CUSTOME1` by the parameter (`ord-maintain-ord200-c11`); `ORD201` has nothing to chain (`c10`). — `ORD200.PGM.SQLRPGLE:279-284` vs `ORD201.PGM.SQLRPGLE:285-288`

## Dependencies

- Embedded SQL cursor `c1` over `ORDERCUS` (`c01`)

## Assumptions / unknowns

- The `-502`-after-abnormal-end scenario is an inference chain (activation group survives → cursor still open → `open` fails → empty list). Flagged for the build owner / a future RECORD; not asserted as observed.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:53-54,67,69-74,107,117-118,146-158,285-294` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:123-129,279-288`
