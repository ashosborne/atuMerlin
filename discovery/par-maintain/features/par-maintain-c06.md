# par-maintain-c06 — F3 on detail panels returns to list; F12 on list exits

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — navigation) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Key handling is per panel and does not follow the labels. On the **list**, F3 and F12 both end the program (`panel 0`); on **`FMT02`** (edit) and **`FMT03`** (create), F3 and F12 both return to the list without writing — `F3=Exit` on a detail panel is therefore "cancel", and leaving the program from a detail panel takes two presses. F5 is Refresh (list only), F6 Create (list only), Page Down is live only while `More…` is shown. There is no F4 prompt, no Help (`help=nohelp`, no `HELP` keyword), no `PAGEUP` keyword (display-side), and the Print key is allowed (`PRINT`). Every function key that moves a panel discards typed input; the only difference is F6 / Page Down (data keys) versus F3 / F5 / F12 (attention keys — typed options are not even returned).

## Entrypoints

- `s01key` (list) — `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:133-151`
- `S02key` (edit) — `PAR200.PGM.RPGLE:226-237`
- `S03key` (create) — `PAR200.PGM.RPGLE:278-289`
- DDS key definitions: file-level `CA03(03) CA12(12) PRINT`; `CTL01` `N80 PAGEDOWN(25)`, `CA05(05 'Refresh')`, `CF06(06 'Create')`; footers `KEY01` `F3=Exit F6=Create F12=Cancel`, `FMT02`/`FMT03` `F3=Exit F12=Cancel` — `ATU_SRC/QDDSSRC/PAR200D.DSPF:9-11,31-33,74-81,88-91,122-125`

## Inputs / outputs / observables

- In: indicators `exit` 03, `cancel` 12, `refresh` 05, `create` 06, `pagedown` 25 via `INDARA` — `PAR200.PGM.RPGLE:11-19`
- Out: `panel` / `stepNN` transitions; program end through `pnl00` → `*inlr`. — `:53-62,311-313`

## Behaviour as implemented

| Panel | F3 | F12 | F5 | F6 | Page Down | Enter |
| --- | --- | --- | --- | --- | --- | --- |
| List `CTL01` | `panel 0` → end | `panel − 1` = 0 → end | `prp` (clear, reload from top) | `panel 3`, `step01 = lod` (`c02`, `c03`) | `lod` (append 14) while `N80`; display-handled after `Bottom` | `chk` (options) |
| Edit `FMT02` | `panel 1` (no write) | `panel − 1` = 1 (no write) | not defined (display beeps / ignores — runtime) | not defined | not defined | `update fparam` (`c04`) |
| Create `FMT03` | `panel 1` (no write) | `panel 1` (no write) | not defined | not defined | not defined | dup check → `write fparam` (`c02`) |

— `PAR200.PGM.RPGLE:133-151,226-237,278-289`, `PAR200D.DSPF:9-10,31-33`

1. `panel = panel − 1` on F12 is generic arithmetic: on the list it reaches 0 (end); on the edit panel 1; the create panel sets `panel = 1` explicitly. Net effect identical to F3 on every panel. — `:138-140,231-233,283-285`
2. After F3/F12 from `FMT02`, `step01` is still `act` → the remaining changed rows are processed, then the list redisplays on the cursor's page (`RRB01 = LRRN`). After F3/F12 from `FMT03`, `step01 = lod` → the list pages forward (`c03`). — `:127-129,145-147,175-179`
3. The lock taken by the edit `chain` (or the duplicate-check `chain`) is not released by F3/F12 (`c04`, `c02`).
4. `CA05`, `CA03`, `CA12` are attention keys: the display returns no field data, so options typed on the list are lost; `CF06` and `PAGEDOWN` return data, so typed options survive in the subfile and run on the next Enter (`c01`). — `PAR200D.DSPF:9-10,31-33`
5. `PRINT` (file level) lets the user print the screen; no program involvement. `help` (01), `prompt` (04) and `morekeys` (24) indicators exist in the RPG `indds` with no DDS counterpart — dead. — `PAR200D.DSPF:11`, `PAR200.PGM.RPGLE:12,14,18`

## Validation rules found in code

None — no "unsaved changes" prompt anywhere.

## Edge cases found in code

- **Two presses to leave from a detail panel** (F3 → list → F3). Same shape as `cus-interactive` (`CUS200`) — this program is the same template.
- **F5 mid-selection.** Options typed and F5 pressed → subfile cleared → options gone, no processing. Position lost (reload from top).
- **Page Down after `Bottom`** stays with the display (`N80`); the program is not re-entered. — `PAR200D.DSPF:31`
- **`F12=Cancel` on the list ends the program**, not "back to menu with confirmation" — there is nothing to return to inside `PAR200`.

## Dependencies

- `PAR200D.DSPF` key keywords — `PAR200D.DSPF:9-11,31-33`

## Assumptions / unknowns

- Undefined-key behaviour on `FMT02`/`FMT03` (F5/F6/Page Down) is a display-file rule (key not allowed → device error message), runtime-confirmable.
- No SME question of its own; the template's key semantics are shared estate-wide.

## Evidence

`ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:11-19,53-62,127-151,226-237,278-289,311-313` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:9-11,31-33,74-81,88-91,122-125`
