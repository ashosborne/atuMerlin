# cou-maintain-c06 — Several option-2 rows on one Enter are edited one after another (`STEP01` stays `'ACT'` across panel 2); the subfile row is never rewritten with the new values, so the list shows the pre-edit name / ISO until the program is re-entered

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`S01CHK` sets `STEP01 = 'ACT'` and, with `SFLNXTCHG` (`*IN33`) on, rewrites every changed subfile row so that `READC` will return them again. `S01ACT` then reads **one** changed row per pass: an `OPT01 = 2` row sends the program to panel 2 (with the option cleared and the row's changed flag reset by an `UPDAT SFL01` under 33 off); after the edit — whether it ended in `UPDAT FCOUN` (`c02`) or F12 (`c05`) — `PANEL = 1` and `STEP01` is **still** `'ACT'`, so the next `PNL01` call runs `S01ACT` again and `READC` yields the next remaining `2`. Only when `READC` sets 99 does `STEP01` become `'DSP'` and the list redisplay. The edited row's `COUNTR` / `COISO` in the subfile are never updated: the `UPDAT SFL01` in `S01ACT` happens **before** the edit with the old values, and after the edit `READC` immediately overwrites the shared program fields with the next row (or nothing is written at all). The list therefore shows stale data for every edited row until F3 / F12 and a fresh `call cou200`. A row on which the user typed `0` keeps its `SFLNXTCHG` flag for ever (it is rewritten under 33 on in `CHK` and never under 33 off), so it is re-read on every Enter — harmless, one extra `READC` per Enter.

## Entrypoints

- `S01CHK` — `ATU_SRC/QRPGSRC/COU200.RPG:68-88`
- `S01ACT` — `COU200.RPG:89-100`
- Panel-2 returns to `PANEL = 1`: `S02KEY` F12 — `:121-122`; `S02ACT` — `:132`

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| Changed-row marking | `SFLNXTCHG` on `SFL01` under indicator 33; `*IN33` on for the whole `CHK` loop, off after it | `ATU_SRC/QDDSSRC/COU200D.DSPF:14`; `COU200.RPG:71,87` |
| Row fields shared with the file | `COID`, `COUNTR`, `COISO` are the same program fields in `SFL01`, `FMT02` and `FCOUN` (`REFFLD` to the file, same names) | `COU200D.DSPF:19-21,70-73`; `COUNTRY.PF:7-9` |
| Step carried across panels | `STEP01` is set to `'ACT'` in `CHK` and only changed again by `S01ACT` (`'DSP'` at 99) or by an invalid option in `CHK` (`'DSP'`) | `COU200.RPG:69,76,93` |
| Observable | with rows A and B both marked `2`: Enter → edit A → Enter (or F12) → edit B → Enter (or F12) → list; A and B still show their old name / ISO; the `Opt` column is cleared on both | `COU200.RPG:89-100,130-133` |

## Behaviour as implemented

1. **Mark.** `CHK`: `*IN33 = *ON`; for each `READC` row (valid or not) `UPDAT SFL01` → the row is flagged changed for the next `READC` pass; `SETOF 33` after the loop. — `COU200.RPG:71,83,87`
2. **Take one.** `ACT`: `READC SFL01` → EQ 99 → `STEP01 = 'DSP'` (no more rows); `OPT01 = 2` → `PANEL = 2`, `STEP02 = 'PRP'`, `OPT01 = 0`, `UPDAT SFL01` (33 off → this row is un-flagged and its option blanked, **with the pre-edit `COUNTR` / `COISO` still in the fields**). Any other `OPT01` (only `0` can reach here) → no branch, nothing written, the flag stays. — `COU200.RPG:90-99`
3. **Edit** (`c02`) — `S02PRP` re-reads the file into the same fields; `FMT02` edits them; `UPDAT FCOUN` writes the file. No `UPDAT SFL01` follows. — `COU200.RPG:109-133`
4. **Return.** `PANEL = 1`; `STEP01` is `'ACT'`; `PNL01` → `S01ACT` → `READC` → next flagged row. The `READC` loads that row's values into `COID` / `COUNTR` / `COISO`, replacing the just-edited values. — `COU200.RPG:132,21-29,89-90`
5. **Redisplay.** At 99, `S01DSP` shows the subfile from the display's buffer — rows as written by `CHK` / `ACT`, i.e. old data, options cleared on edited rows. — `COU200.RPG:48-57`

## Validation rules found in code

- None beyond `c01`'s option check. There is no test that the row still matches the file before the edit (that is `S02PRP`'s `CHAIN`, `c03`).

## Edge cases found in code

- **Order of edits.** `READC` returns changed rows in RRN order (platform — inference), i.e. key order of `COID` (`c01`), regardless of typing order.
- **F12 in the middle.** Cancelling row A still proceeds to row B (`c05`); A's option is already cleared (step 2), so A is not offered again on the next Enter.
- **Invalid option plus valid `2`s on one Enter.** `CHK` sets `STEP01 = 'DSP'` — the `2`s are flagged (33) but not actioned; the list redisplays with `Invalid Option`; on the next Enter (after the fix) `CHK` flags them again and `ACT` processes them. Nothing is lost, nothing is done early. — `COU200.RPG:74-83`
- **Typed `0`.** Counts as changed; passes `CHK` (`0` is allowed); `ACT` skips it without an `UPDAT`, so the 33-flag set in `CHK` persists and the row is `READC`'d on every subsequent Enter — harmless (the same "blanked rows keep coming back" shape `c11` records for `COU301`). — `COU200.RPG:74-75,91-99`
- **Stale row vs fresh edit.** Choosing `2` again on an already-edited row shows the **new** values on `FMT02` (the `CHAIN` re-reads the file) while the list behind it still shows the old — the only in-program way to see what was written. — `COU200.RPG:111`
- **Two users.** Each `COU200` job has its own subfile; a rename by user X is invisible to user Y's list until Y re-enters (and to Y's edit panel only through the `CHAIN`). — `COU200.RPG:37-47,111`
- **`STEP02` after a cancel.** Left at `'KEY'`; harmless because `S01ACT` sets `'PRP'` before every entry to panel 2. — `COU200.RPG:96,115`

## Dependencies

- `c01` (subfile load and page memory), `c02` (the edit), `c05` (F12 path), `c03` (unguarded `CHAIN`)
- `ATU_SRC/QDDSSRC/COU200D.DSPF:14` (`SFLNXTCHG`)

## Assumptions / unknowns

- Platform (inference / runtime-confirmable): `READC` order and its EQ indicator; `SFLNXTCHG` set / cleared by `UPDAT` according to the indicator at write time; subfile contents persist while `FMT02` (no `OVERLAY`) occupies the screen and are redrawn by the next `EXFMT CTL01` with `SFLDSP`.
- **needs-SME (room, target):** a target list would normally reflect the edit at once and return to the list after each save rather than chaining through selected rows. Both are presentation decisions; as-is is recorded so the difference is a choice, not an accident.

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:21-29,37-47,48-57,68-88,89-100,109-133` · `ATU_SRC/QDDSSRC/COU200D.DSPF:14,19-21,70-73` · `ATU_SRC/QDDSSRC/COUNTRY.PF:7-9`
