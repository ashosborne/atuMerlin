# cou-maintain-c05 — Key semantics: F3 and F12 on the list both end the program; F3 on the edit panel ends the program from inside the subroutine (`GOTO ENDPGM`); F12 on the edit panel returns to the list without writing, without reload, and with the record lock still held

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Both panels define the same two command-attention keys at file level, `CA03(03)` `F3=Exit` and `CA12(12)` `F12=Cancel`. On the **list** they are indistinguishable: either sets `PANEL = 0`, the mainline's `CABEQ 0 ENDPGM` branches to `SETON LR`, and the program ends (files closed, any lock released). On the **edit panel** they differ: F3 jumps straight out of the `S02KEY` subroutine to the mainline `ENDPGM` tag and ends the program; F12 sets `PANEL = 1` and hands control back to panel 1 **without** `UPDAT`, without reloading the list, and — because the only release of a record lock in this program is the next I/O on `COUNTRY` — with the row still locked while the user is back on the list. Because `STEP01` is still `'ACT'` at that point (`c06`), "back to the list" first means "next selected row, if any": a cancelled edit is followed immediately by the edit panel for the next row that carried a `2`, and only when none remain does the list redisplay. `CA` (not `CF`) keys send no field data, so nothing typed on the cancelled panel is seen by the program. There is no F5, F6, F9 or Page key handling anywhere (`c01`, `c04`).

## Entrypoints

- List keys: `S01KEY` — `ATU_SRC/QRPGSRC/COU200.RPG:58-67`; mainline exit — `:16-19`
- Edit keys: `S02KEY` — `COU200.RPG:117-126`
- DDS: `CA03(03)` / `CA12(12)` at file level — `ATU_SRC/QDDSSRC/COU200D.DSPF:8-9`; legends `KEY01` `:47-51`, `FMT02` `:58-61`

## Inputs / outputs / observables

| Key | Panel | Code path | Effect | Source |
| --- | --- | --- | --- | --- |
| F3 | list | `*IN03 → PANEL = 0` → `CABEQ 0 ENDPGM` → `SETON LR` | program ends; return to menu | `COU200.RPG:60-61,16-19` |
| F12 | list | `*IN12 → PANEL = 0` → same | identical to F3 | `COU200.RPG:62-63,16-19` |
| Enter | list | `OTHER → STEP01 = 'CHK'` | option check (`c01`) | `COU200.RPG:64-65` |
| F3 | edit | `*IN03 → GOTO ENDPGM` | program ends **from inside `S02KEY`**; the pending `UPDAT` never happens; lock released by the close | `COU200.RPG:119-120,18-19` |
| F12 | edit | `*IN12 → PANEL = 1` | back to `PNL01` with `STEP01 = 'ACT'` → next option-2 row or redisplay; **no write; lock kept** | `COU200.RPG:121-122,89-100` |
| Enter | edit | `OTHER → STEP02 = 'CHK'` | unconditional `UPDAT` (`c02`) | `COU200.RPG:123-124,127-133` |
| Print | both | `PRINT` keyword | screen print by the system; program not involved | `COU200D.DSPF:10` |
| Roll keys | list | `PAGEDOWN(25)` inactive (`N80`); no `ROLLUP` keyword | paged by the controller (`c01`) | `COU200D.DSPF:26` |

## Behaviour as implemented

1. **List exit.** `S01KEY` `SELEC`: `*IN03` → `Z-ADD0 PANEL`; `*IN12` → `Z-ADD0 PANEL`; `OTHER` → `'CHK'`. The two branches are textually identical. Back in the mainline, `PANEL CASEQ 1` / `CASEQ 2` both miss, `PANEL CABEQ0 ENDPGM` branches, `SETON LR`, the cycle ends the program. — `COU200.RPG:58-67,12-19`
2. **Edit F3.** `S02KEY` `*IN03` → `GOTO ENDPGM`. The branch leaves the subroutine (and the `SELEC` group) for a mainline `TAG` — permitted in RPG/400 for a `GOTO` *out of* a subroutine (platform — inference; the member is part of the shipped estate). `LR` on, program ends. — `COU200.RPG:119-120,18-19`
3. **Edit F12.** `*IN12` → `Z-ADD1 PANEL`. `STEP02` stays `'KEY'`; it is reset to `'PRP'` by `S01ACT` when the next option-2 row is found. `PNL01` runs with `STEP01 = 'ACT'` (set in `S01CHK`, never reset by panel 2), so `S01ACT`'s `READC` fetches the next changed row: another `2` → straight into its edit panel; none → `STEP01 = 'DSP'` → the list redisplays on the page recorded in `RRB01`. — `COU200.RPG:121-122,89-100,53-55`
4. **Lock after F12.** The record read by `S02PRP`'s `CHAIN` (`UF` file) stays locked until the next I/O on `COUNTRY` — which is the next `CHAIN` (another option-2 row, now or on a later Enter) or the file close at `LR`. While the user sits on the list after a cancel, the cancelled row is locked against other updaters (platform — inference). — `COU200.RPG:111,131,18-19`

## Validation rules found in code

- None on keys. No "are you sure" on exit, no "changes pending" on cancel (there is no changed-flag to test — `c02`).

## Edge cases found in code

- **F12 semantics differ by panel.** On the list F12 is *exit* (same as F3, despite the `Cancel` legend); on the edit panel it is *cancel this row*. — `COU200.RPG:62-63,121-122`
- **F12 on the edit panel does not refresh the list.** No reload path exists after `S01PRP` (`c01`); the row shows the pre-edit values (correct, since nothing was written) — but if another job changed the row in the meantime the list is stale and the edit panel was not. — `COU200.RPG:37-47,110-111`
- **Cancel with several rows selected.** Three rows with `2`, Enter, F12 on the first → the second's edit panel opens at once (no return to the list in between); F12 again → the third; F12 → list. Each F12 leaves that row's lock in place until the next `CHAIN` replaces it; only the **last** cancelled row stays locked through the list redisplay. — `COU200.RPG:89-100,111`
- **F3 on the edit panel with rows still selected.** Ends the program; the remaining `2`s are discarded with the subfile. — `COU200.RPG:119-120`
- **Fields typed then F12 / F3.** `CA` keys transmit no input; the typed values never reach the program, so nothing to discard. — `COU200D.DSPF:8-9`
- **Enter on the list with nothing typed.** `CHK` finds no changed rows (unless a row carries a stale `SFLNXTCHG` flag from a typed `0` — `c06`), `ACT` finds none, `DSP` redisplays. — `COU200.RPG:68-100`
- **Inquiry message path.** The F3 / F12 routes are the only ways to leave panel 2 without the `UPDAT` — relevant when `c03`'s not-found case has occurred (Enter would raise; F12 / F3 do not). — `COU200.RPG:117-126`

## Dependencies

- `c01` (state machine, page memory), `c02` (the write these keys avoid), `c03` (why avoiding it can matter), `c06` (`STEP01 = 'ACT'` carries across the cancel)
- Contrast, pointer only: the ILE maintain panels (`cus-interactive`, `pro-interactive` — held) use the same `CA03` / `CA12` keys with a `PANEL`-style state machine written in free-form; behaviour of their F12 is documented in their own cards.

## Assumptions / unknowns

- Platform (inference / runtime-confirmable): `GOTO` out of a subroutine to a mainline `TAG` is legal in RPG/400; `SETON LR` ends the program at the end of the cycle; record lock lifetime on a `UF` file; `CA` keys return no data; `PRINT` handled by the system.
- **needs-SME (room, target):** should a target cancel-on-edit (a) release the row immediately, (b) return to the list rather than the next selected row, and (c) should list F12 remain a synonym of exit? All three are as-is behaviours a web target would not reproduce literally; recorded, not decided.

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:12-19,37-47,53-55,58-67,68-100,110-111,117-126,127-133` · `ATU_SRC/QDDSSRC/COU200D.DSPF:8-10,26,47-51,58-61` · structural grep of `COU200D.DSPF` for `CF` / `CA0[4-9]` / `CA1[0-1]` / `CA2` / `ROLLUP` / `ROLLDOWN` (none — only `CA03`, `CA12`, `PAGEDOWN`)
