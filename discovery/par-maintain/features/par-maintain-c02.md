# par-maintain-c02 — F6 create with duplicate-key check only

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

F6 on the list opens `FMT03` ("Create Parameter", `PAR200-3`) with all seven fields blank and input-capable. Enter runs exactly one check: `chain (pacode:pasubcode) parameter` — found → indicator 40, `ERRMSG 'This code/sub-code already exist.'` on the code field and the panel is redisplayed; not found → `write fparam` and back to the list. Nothing else is validated: a blank code and/or sub-code is accepted, `PARM1`/`PARM3` may be blank, `PARM4`/`PARM5` may be zero, `PARM2` is stored exactly as typed (lower case allowed). The check `chain` is done on the update-capable file, so on a duplicate the **existing row is locked** and loaded into the program buffer while the user sees the error.

## Entrypoints

- `s01key` F6 (`create`, `CF06`) → `panel = 3; step01 = lod` — `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:145-147`, `ATU_SRC/QDDSSRC/PAR200D.DSPF:33`
- `pnl03` state machine `S03prp` → `S03dsp` → `S03key` → `S03chk` → `S03act` — `PAR200.PGM.RPGLE:252-305`
- Record `FMT03` — `PAR200D.DSPF:116-151`

## Inputs / outputs / observables

- In (all `B`): `PACODE` 10, `PASUBCODE` 10, `PARM1` 10, `PARM2` 100 `CHECK(LC)`, `PARM3` 2, `PARM4` 1 0, `PARM5` 3 0 (all `REFFLD` to `PARAMETER`). Only `PARM2` keeps lower case; the other character fields are folded to upper case by the display (no `CHECK(LC)`), so keys are stored upper-case when typed here. Numeric fields accept digits only (device-level). — `PAR200D.DSPF:140-151`
- Out: one new `PARAMETER` row via `write fparam`; screen `PAR200-3`, labels `Parameter Code / parameter Sub_code / Parameter 1..5`, footer `F3=Exit F12=Cancel`. Error path: `ERRMSG('This code/sub-code already exist.' 40)` attached to `PACODE`. — `PAR200D.DSPF:118-143`, `PAR200.PGM.RPGLE:303`
- No message, no confirmation on success; the list is re-entered in `lod` (`c03`).

## Behaviour as implemented

1. `S03prp`: `clear fmt03` — all seven display fields (which are the file's fields) blanked / zeroed. — `PAR200.PGM.RPGLE:268-271`
2. `S03dsp`: `exfmt fmt03`. — `:273-276`
3. `S03key`: F3 → `panel 1`; F12 → `panel 1` (both discard the input — `c06`); Enter → `chk`. — `:278-289`
4. `S03chk`: `step03 = act; chain (pacode:pasubcode) parameter; if %found → ErrDuplicate on, step03 = dsp`. The `chain` is on `fparameter uf a` — a hit **locks** that row and loads its `PARM1`–`PARM5` into the program buffer. — `:291-299`, `:5`
5. `S03act`: `write fparam; panel = 1` — the buffer as returned by the last `exfmt` is written; `step03 = prp`. — `:301-305`
6. Redisplay after a duplicate: `ERRMSG` shows the message and highlights `PACODE` without rewriting the record's fields (DDS contract), so the user still sees what they typed; the next Enter returns the screen values, so a corrected key is written with the typed values. If the user changes nothing and presses Enter, the same error repeats. — `PAR200D.DSPF:142-143`

## Validation rules found in code

- Duplicate composite key → 40. — `PAR200.PGM.RPGLE:293-297`
- Nothing else. No mandatory field, no format check, no range on `PARM4` (0–9) / `PARM5` (0–999) beyond field width, no trim, no authority.

## Edge cases found in code

- **Blank key row.** `PACODE = PASUBCODE = ' '` is a valid, unique key; the row is created, listed first (`c01`), editable and deletable — and never returned by `FPARAMETER` (`c09`, blank key never reads).
- **Duplicate leaves a lock.** After indicator 40 the existing row stays locked while the user looks at the error and after F3/F12 back to the list; released by the next read-for-update / `update` / `delete` on `PARAMETER` or program end (whether the list's `read(n)` releases it is a runtime rule — not decided from source). A `PAR200` in another job trying `2`/`4` on that row waits `WAITRCD`. — `PAR200.PGM.RPGLE:293`
- **Race on write.** The `chain`/`write` pair is not atomic; a row inserted by another job in between makes `write fparam` fail on `UNIQUE` (RPG status 01021) — unmonitored, inquiry message in the session (inference).
- **Case.** `PATH` typed as `path` is stored `PATH` (display upper-casing) — the only reason `GetParm2('PATH':' ')` matches rows typed in mixed case. A key written by another tool in lower case would not be found by the getters (`c09`, case-sensitive compare).
- **`PARM2` is 100 wide but the list shows 32** (`PARM2S`, `c01`); the full value is visible only in `FMT02`/`FMT03`.
- After the write the program does **not** show the new row; `step01 = lod` appends the next page instead (`c03`).

## Dependencies

- `PARAMETER.PF` `UNIQUE (PACODE, PASUBCODE)` — `ATU_SRC/QDDSSRC/PARAMETER.PF:4,13-14`
- `PAR200D.DSPF` `FMT03` — `PAR200D.DSPF:116-151`

## Assumptions / unknowns

- Upper-casing of non-`CHECK(LC)` fields, `ERRMSG` not rewriting fields, record-lock lifetime and the 01021 surface are platform rules, runtime-confirmable.
- needs-SME: is an unvalidated create (blank key, free-text values, no audit) acceptable if the screen survives, or does `PATH` become configuration (`c11`)?

## Evidence

`ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:5,26,145-147,252-305` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:33,116-151` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`
