# ord-maintain-ord202-c03 — Read-only exit on any key

| | |
| --- | --- |
| Slice | `ord-maintain-ord202` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

One `exfmt ctl01` per call. Whatever returns control — `F3`, `F12`, Enter, `F5`, `F6` — sets `panel = 0`, the next cycle iteration runs `pnl00`, `*inlr` goes on and the program returns to its caller. There is no redisplay, no refresh, no option processing and no message; the only keys that do **not** end the program are the ones the display handles itself (`F11` fold/drop, Page Up/Down inside the loaded subfile, Print). `F3` (`exit`) and `F12` (`cancel`) are handled by name but do the same thing as the `other` branch. The parameter `id` is never modified.

## Entrypoints

- `s01key` (after `exfmt ctl01` in `s01dsp`) → `s01act` → `pnl00` — `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:129-144,153-155`
- Keys enabled on the display file: `CA03`, `CA12` (file level), `CF06`, `CA05` (on `CTL01`), `SFLDROP(CF11)`, `PRINT` — `ATU_SRC/QDDSSRC/ORD202D.DSPF:8-10,31-32,38`

## Inputs / outputs / observables

- In: the `INDARA` indicators returned by `exfmt` — only `exit` (03) and `cancel` (12) are tested. — `ORD202.PGM.RPGLE:12,22,26,130-139`, `ORD202D.DSPF:7`
- Out: return to the caller with `*inlr` on; files closed. No return value, no change to `id`, no database write, no message. — `ORD202.PGM.RPGLE:16-19,153-155`

## Behaviour as implemented

1. `s01key`: `select; when exit → panel = 0; step01 = prp; when cancel → step01 = prp; panel = 0; other → step01 = act; endsl`. — `ORD202.PGM.RPGLE:129-140`
2. `s01act`: `panel = 0`. Nothing else — the `act` step exists only to fall into `pnl00`. — `ORD202.PGM.RPGLE:142-144`
3. Main line, next cycle: `panel = 1` is false → `exsr pnl00` → `*inlr = *on`. The RPG cycle ends the program; files are closed; the caller (`ORD200`/`ORD201`, `c04`) continues after `dspord(orid)`. — `ORD202.PGM.RPGLE:60-65,153-155`
4. The `step01 = prp` reset on `F3`/`F12` is cosmetic: `step01` is re-initialised from `inz(prp)` on the next call anyway (`*inlr`), and the `other` path does not reset it. — `ORD202.PGM.RPGLE:45,133,135`

## Validation rules found in code

None.

## Edge cases found in code

- **`F5` and `F6` exit.** `CA05(05 'Refresh')` and `CF06(06 'Create')` are enabled on `CTL01`, so both return control; `refresh` (05) and `create` (06) are declared in `indds` but never tested, so both fall into `other` → exit. Neither key is in the `KEY01` legend (`F3=Exit`, `F11=Detail`, `F12=Cancel`), so a user does not see them; a user who presses `F5` expecting a refresh leaves the screen. `CA05` also discards nothing — there is nothing to discard (`c05`). — `ORD202D.DSPF:31-32,80-85`, `ORD202.PGM.RPGLE:24-25,137-138`
- **Enter exits.** A plain Enter (the natural "continue" key on a read-only display) ends the program — the only "normal" way out besides `F3`/`F12`. — `ORD202.PGM.RPGLE:137-138`
- **`F3` = `F12`.** Both set `panel = 0`; there is one panel, so Cancel and Exit are the same. The same identity holds in `ORD200`/`ORD201` and on `ORD101`'s list panel (`ord-maintain-ord201-c09`, `ord-entry-ord101-c10`). — `ORD202.PGM.RPGLE:131-136`
- **Keys that do not return.** `F11` (`SFLDROP`) toggles truncated/folded; Page Up/Down roll within the loaded subfile (`SFLSIZ ≠ SFLPAG`, no `PAGEDOWN`/`ROLLUP` keyword — rolling past `Bottom` is refused by the display with a system message); Print (`PRINT` keyword) prints the screen. None of these reach `s01key`. `pagedown` (25) is declared and never tested. — `ORD202D.DSPF:10,37-40`, `ORD202.PGM.RPGLE:28`, `c02`
- **No re-read.** Because the program ends on every key, the header and lines shown are always the state at call time — there is no refresh path and no stale-state window beyond one screen. Contrast: `ORD201` `F5` re-reads (`ord-maintain-ord201-c08`). — `ORD202.PGM.RPGLE:129-144`
- **Fresh state every call.** `*inlr` on every exit means `*inzsr` (the `1940-01-01` presets, `c01`), `inz(1)` on `panel`, `inz(prp)` on `step01` and the file opens run on every call. The implicit-sentinel logic in `c01` depends on this. An abnormal end (`c01` exception) also ends the program — no state survives to the next call. — `ORD202.PGM.RPGLE:44-45,147-155`
- **Return to caller.** `ORD200`/`ORD201` clear the option and `update sfl01` the row after `dspord(orid)` returns; neither reloads (`ord-maintain-ord200-c05`, `ord-maintain-ord201-c05`). — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:236-239`, `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:242-245`

## Dependencies

- `ORD202D.DSPF` key definitions — `ORD202D.DSPF:8-10,31-32,38`
- Callers `ORD200` / `ORD201` (`c04`)

## Assumptions / unknowns

- Activation group inferred `QILE` (`dftactgrp(*no)`, no `ACTGRP`) — build owner to confirm; with `*inlr` on every path it does not affect the observable behaviour of this program.
- needs-SME: should the target's order display keep "any key closes" (including Enter and `F5`/`F6`), or offer a refresh? Recorded, not decided.

## Evidence

`ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:12,16-19,22,24-26,28,44-45,60-65,129-144,147-155` · `ATU_SRC/QDDSSRC/ORD202D.DSPF:7-10,31-32,37-40,80-85` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:236-239` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:242-245`
