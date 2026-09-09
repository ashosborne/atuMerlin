# par-maintain-c04 — Option 2 edit values without validation

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `2` chains the row by the subfile's key **with a lock**, shows `FMT02` ("Edit Parameter", `PAR200-2`) with the key output-only and `PARM1`–`PARM5` input, and on Enter executes `update fparam` **unconditionally** — no check, no audit column, no message. F3 and F12 both return to the list without writing. The subfile row was rewritten (option cleared) **before** the edit and is not rewritten after it, so the list keeps showing the **pre-edit values** until F5. A `2` on a row whose record no longer exists (blanked ghost row after `4` — `c05` — or deleted by another job) chains nothing and the following `update` raises an unmonitored exception.

## Entrypoints

- `s01act` `when opt01 = 2; panel = 2; step02 = prp; opt01 = 0; update sfl01;` — `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:180-184`
- `pnl02` state machine `S02prp` → `S02dsp` → `S02key` → `S02chk` → `S02act` — `PAR200.PGM.RPGLE:200-248`
- Record `FMT02` — `ATU_SRC/QDDSSRC/PAR200D.DSPF:82-115`

## Inputs / outputs / observables

- In: `PACODE` / `PASUBCODE` from the changed subfile row (`readc`); the `PARAMETER` record found by `chain`; typed `PARM1` 10, `PARM2` 100 `CHECK(LC)`, `PARM3` 2, `PARM4` 1 0, `PARM5` 3 0. — `PAR200D.DSPF:106-115`
- Out: the record rewritten in place (`update fparam`); screen `PAR200-2`, key fields `O`, labels `Parameter Code . . . :` etc., footer `F3=Exit F12=Cancel`. No confirmation. — `PAR200.PGM.RPGLE:246`, `PAR200D.DSPF:84-105`
- Observable: back on the list the edited row still shows the old `1`–`5` values; F5 shows the new ones.

## Behaviour as implemented

1. `s01act` (one changed row per cycle pass): `opt01 = 0; update sfl01` — the row is rewritten with the values `readc` returned (old values) and its modified-data tag cleared (`sflnxtchg` is off here). — `PAR200.PGM.RPGLE:180-184`
2. `S02prp`: `chain (pacode:pasubcode) parameter` — `uf a` file, no `(n)` → record locked; `%found` **not** tested. `step02 = dsp`. — `:216-219`
3. `S02dsp`: `exfmt fmt02` with the lock held for as long as the user stays on the panel. — `:221-224`
4. `S02key`: F3 → `panel 1`; F12 → `panel = panel − 1` = 1; Enter → `chk`. Both function keys leave without `update` (and without `unlock`). — `:226-237`
5. `S02chk`: empty — `step02 = act`. — `:239-242`
6. `S02act`: `update fparam; panel = 1; step02 = prp`. The key fields are output-only on `FMT02`, so the key cannot change; `PARM1`–`PARM5` are written as typed (display upper-cases all but `PARM2`). — `:244-248`, `PAR200D.DSPF:106-115`
7. Back in `pnl01` with `step01 = act`: the next changed row is processed (a second `2` opens its panel; a `4` deletes), then `dsp` redisplays the list on the cursor's page (`RRB01 = LRRN`, `c01`) — with the edited row's **old** values. — `:127-129,175-179`

## Validation rules found in code

None. No mandatory value, no range on the numeric fields beyond width, no "changed?" test — an unchanged panel still issues `update`.

## Edge cases found in code

- **Row gone before the chain.** Ghost row after `4` in this session (key blank — `c05`) or a row deleted by another job: `chain` misses (buffer unchanged, `%found` untested) → `FMT02` shows the stale buffer (blank key on the ghost row; `PARM2` = whatever the program last held, e.g. `*** Deleted ****` — `c05`) → Enter → `update fparam` without a prior successful read → RPG status **01221**, unmonitored → inquiry message in the session (inference). F3/F12 instead is harmless.
- **Blank key row.** A `2` on the blank/blank row (`c02`) edits that row normally — unless it was the ghost of a delete; the screen cannot tell the two apart.
- **Lock across the screen.** Held from `chain` to `update` (released by the `update`) or, after F3/F12, until the next read-for-update / `update` / `delete` on `PARAMETER` or program end (whether the list's `read(n)` releases it is a runtime rule). Other `PAR200` sessions wait `WAITRCD` on `2`/`4` for that row and hit an unmonitored 01218 on timeout; `FPARAMETER` getters (`if` open) read through the lock. — `PAR200.PGM.RPGLE:5,217`
- **Editing `PATH` is not seen by running jobs** — `FPARAMETER` caches the last hit per activation group (`c09`).
- **`PARM2S` never updated** — the list's `2` column is the 32-char copy taken at load; after an edit it is stale even in the row itself.
- **`F3=Exit` label** on `FMT02` returns to the list, not out of the program (`c06`).

## Dependencies

- `PARAMETER.PF` (no audit / modified-by / timestamp columns — `ATU_SRC/QDDSSRC/PARAMETER.PF:5-12`)
- `PAR200D.DSPF` `FMT02` — `PAR200D.DSPF:82-115`

## Assumptions / unknowns

- 01221 on `update` after a failed `chain`, lock lifetime and the `WAITRCD` timeout surface are platform rules, runtime-confirmable.
- needs-SME: unvalidated in-place edit with no audit — acceptable as-is if the screen is kept; irrelevant if `PATH` becomes configuration (`c11`).

## Evidence

`ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:5,127-129,175-184,200-248` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:82-115` · `ATU_SRC/QDDSSRC/PARAMETER.PF:5-12`
