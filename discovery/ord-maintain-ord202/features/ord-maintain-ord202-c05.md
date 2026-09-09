# ord-maintain-ord202-c05 — Dead keys and display-side paging

| | |
| --- | --- |
| Slice | `ord-maintain-ord202` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD202D` is the list-screen template with the input taken out: it still enables `CF06 'Create'` and `CA05 'Refresh'`, still carries `SFLNXTCHG`, `SFLMSG('Invalid Option')`, `ERRSFL` and an `SFLRCDNBR` field, and the program still declares the matching indicators — none of which does anything. There is **no option column**: every `SFL01` and `CTL01` field is output-only (Phase A's "option field unused by program" is corrected — there is none). Paging is **not** missing: `SFLSIZ(7)` ≠ `SFLPAG(6)` makes the subfile auto-extend and the display rolls it; the program has no paging logic because it needs none. The one live key beyond `F3`/`F12`/Enter is `F11`, handled by the display (`SFLDROP`). Phase A's "orders with more than 7 lines may not display fully" is withdrawn.

## Entrypoints

- `CTL01` keywords — `ATU_SRC/QDDSSRC/ORD202D.DSPF:29-42`
- File-level keywords — `ORD202D.DSPF:6-11`
- Indicator data structure `indds` — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:20-35`
- `s01key` — `ORD202.PGM.RPGLE:129-140`

## Inputs / outputs / observables

- Keys that return control to the program: `F3` (`CA03`), `F12` (`CA12`), `F5` (`CA05`), `F6` (`CF06`), Enter. All end the program (`c03`). — `ORD202D.DSPF:8-9,31-32`, `ORD202.PGM.RPGLE:130-139`
- Keys handled by the display without returning: `F11` (`SFLDROP(CF11)`), Page Up / Page Down within the loaded subfile, Print (`PRINT`). — `ORD202D.DSPF:10,37-40`
- Key legend shown (`KEY01`, row 23): `F3=Exit` (col 3), `F11=Detail` (col 17), `F12=Cancel` (col 32). `F5`/`F6` are not shown. — `ORD202D.DSPF:80-85`
- Input-capable fields: **none**. `RRB01` is hidden (`H`, `SFLRCDNBR`); every other field is `O`. — `ORD202D.DSPF:15-28,42,51-60`

## Behaviour as implemented

1. `CF06(06 'Create')` / `CA05(05 'Refresh')` on `CTL01`: enabled, returned as indicators 06 / 05, mapped to `create` / `refresh` in `indds`, **never tested** → `other` → exit (`c03`). The `'Create'`/`'Refresh'` texts are DDS key descriptions (visible to a `DSPFFD`/prompt, not on screen). — `ORD202D.DSPF:31-32`, `ORD202.PGM.RPGLE:24-25,137-138`
2. `SFLNXTCHG` (33) on `SFL01`, `SFLMSG('Invalid Option' 35)` and `DSPATR`-style indicator 34 declared: never set by the program; with no input field there is nothing to validate or mark. `ERRSFL` at file level: no message is ever sent. — `ORD202D.DSPF:11,14,41`, `ORD202.PGM.RPGLE:32-34`
3. `SFLRCDNBR` (`RRB01`): set to `1` before the load and, after the `exfmt`, to the `INFDS` top-of-page RRN — the second assignment is never used because the program exits (`c02`, `c03`). — `ORD202D.DSPF:42`, `ORD202.PGM.RPGLE:100,123-125`
4. `SFLSIZ(0007)` / `SFLPAG(0006)`: because the values differ, (a) the subfile auto-extends beyond 7 records up to 9 999 as `write sfl01` continues, (b) the display handles Page Up/Page Down itself and does not return control (no `PAGEDOWN`/`ROLLUP` keyword exists — `pagedown` (25) is declared and never tested), (c) `SFLDROP` is permitted (it is not allowed when `SFLSIZ = SFLPAG`). `SFLEND(*MORE)` with 80 on shows `More...`/`Bottom`. — `ORD202D.DSPF:37-40`, `ORD202.PGM.RPGLE:28,113`
5. `SFLDROP(CF11)`: first display truncated (line 1 of each record; 12 per page), `F11` folds to the two-line form (6 per page — `SFLPAG` counts folded records). No program involvement; `CF11` has no indicator. — `ORD202D.DSPF:38`, `c02`
6. `PRINT`: Print key prints the screen (system function). `DSPSIZ(24 80 *DS3)`, `INDARA`. — `ORD202D.DSPF:6-7,10`

## Validation rules found in code

None (no input).

## Edge cases found in code

- **`F5` looks like refresh, acts like exit.** A user who knows `F5=Refresh` from `ORD201` and presses it here leaves the display; nothing is lost because nothing is editable. `ORD200D` likewise enables `CA05` without handling it (`ord-maintain-ord201-c08`). — `ORD202D.DSPF:32`, `ORD202.PGM.RPGLE:24,137`
- **`F6` "Create" from a read-only display exits.** No create path exists in this program (`ORD100C`/`ORD100C2` are called only by the lists); Phase A's caution against a phantom "create from display" card stands. — `ORD202D.DSPF:31`, `ORD202.PGM.RPGLE:25`
- **Orders with more than 7 lines display fully.** Every `DETORD1` row is written (`c02`), the subfile extends, and the user rolls with Page Down; `Bottom` marks the last page. The Phase A open question ("what does the user see?") is answered from the DDS contract: all lines, paged by the display, description hidden until `F11`. Rolling past `Bottom` gets a system message (no `PAGEDOWN` keyword to hand it to the program); rolling within pages needs no program logic. — `ORD202D.DSPF:37-40`, `ORD202.PGM.RPGLE:103-112`
- **The odd `7`/`6` pair.** `SFLSIZ(7)` one more than `SFLPAG(6)` is the minimum difference that turns on auto-extend and permits `SFLDROP`; it does not mean "7 lines maximum". `ORD101D` (`15`/`14`) and `ORD200D` (`15`/`14`) use the same idiom; `ORD201D` (`15`/`7`) pages in the program because its cursor fetches in batches. — `ORD202D.DSPF:39-40`, `ATU_SRC/QDDSSRC/ORD200D.DSPF:31-32`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:33-34`
- **Indicator 80 never goes off.** `sflend = *on` unconditionally, so `SFLEND(*MORE)` is always in effect; on a one-page list it shows `Bottom`. — `ORD202.PGM.RPGLE:113`, `ORD202D.DSPF:37`
- **Template residue in the program.** `User`, `count`, `mode`, `crt`, `upd`, `chk`, `rrs01`, `err01`, `help`, `prompt`, `morekeys`, `dspatr_ri` and `sflmsg` are the `ORD200`/`ORD201` template's working set with nothing to work on (`c01`). — `ORD202.PGM.RPGLE:21,23,27,33-34,41-42,46-48,50-51,56`

## Dependencies

- `ORD202D.DSPF` only. The paging / fold / print behaviour is the IBM i display-file contract for `SFLSIZ ≠ SFLPAG`, `SFLEND(*MORE)`, `SFLDROP`, `PRINT` — platform documentation, cited in `overnight/CONTEXT_GATE.md` (run 11).

## Assumptions / unknowns

- Page counts (12 truncated / 6 folded), `More...`/`Bottom` text and the roll-past-`Bottom` message are DDS contract statements, not read from source; runtime confirmation on the box would settle them. Nothing in the RPG contradicts them.
- needs-SME: should the target keep `F5`/`F6` as "close the display" (as-is) or drop them? Should the description be visible by default? (Both are room decisions for the ORD pack; recorded, not decided.)

## Evidence

`ATU_SRC/QDDSSRC/ORD202D.DSPF:6-11,14,15-28,29-42,51-60,80-85` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:20-35,41-42,46-48,50-51,56,100,103-113,123-125,129-140` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:31-32` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:33-34`
