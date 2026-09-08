# ord-entry-ord100-c06 — Confirm blocked while options pending

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Every Enter / `F8` on the list runs `s01chk` over all changed subfile rows. A row whose option is not `0`, `2` or `4` is highlighted (reverse image, cursor) and `SFLMSG 35 'Invalid Option'` is raised; if `F8` (`confirm`) was pressed and any row carries `2` or `4`, the row is highlighted and `SFLMSG 36 'Confirmation is not allowed when options are pending.'` is raised. In either case `step01` falls back to `dsp`: the list is redisplayed positioned on the first offending row and nothing is confirmed or actioned. Only when no row fails does `s01act` run (`c07` on `F8`, `c04`/`c05` otherwise).

## Entrypoints

- `s01key` `other` branch (Enter, `F8`) → `step01 = chk` → `s01chk` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:151-153,156-185`
- `CTL01` `CF08(08 'Confirm')`, `SFLMSG(… 35)`, `SFLMSG(… 36)`, `RRB01 SFLRCDNBR`; `SFL01` `DSPATR(RI)`/`DSPATR(PC)` on 34 — `ATU_SRC/QDDSSRC/ORD100D.DSPF:16-17,32,38-41`

## Inputs / outputs / observables

- In: `OPT01` of each changed row; indicator 08 (`confirm`).
- Out: rows rewritten with indicator 34 on (`DSPATR(RI) DSPATR(PC)`) and re-marked `SFLNXTCHG`; indicators 35 / 36 on; `RRB01` = RRN of the first offending row. — `ORD100.PGM.RPGLE:159-181`
- Observable: message on the error line (`ERRSFL`), offending row(s) in reverse image with the cursor on the first, list redisplayed on that page.

## Behaviour as implemented

1. `step01 = act; err01 = *off; sflnxtchg = *on; readc(e) sfl01`. — `ORD100.PGM.RPGLE:157-160`
2. For each changed row: `if opt01 <> 0 and opt01 <> 2 and opt01 <> 4` → `step01 = dsp; dspatr_ri = *on; sflmsg = *on`; first offender sets `rrb01 = rrn01` (the RRN of the row just read via `SFILE(sfl01:rrn01)`) and `err01`. — `ORD100.PGM.RPGLE:162-170`, `ORD100.PGM.RPGLE:15`
3. `if confirm and (opt01 = 2 or opt01 = 4)` → same, with `sflmsg2`. Both tests run for every row, so both messages can be on together. — `ORD100.PGM.RPGLE:171-179`
4. `update sfl01` (with `SFLNXTCHG` on → the row stays "changed" for `s01act`), `dspatr_ri = *off`, next `readc`. — `ORD100.PGM.RPGLE:180-182`
5. `sflnxtchg = *off`. If any row failed, `step01 = dsp` → `s01dsp` redisplays (`SFLRCDNBR = RRB01`); otherwise `step01 = act`. — `ORD100.PGM.RPGLE:184,126-136`

## Validation rules found in code

- Valid options: `0` (blank), `2`, `4`. Option `1` (shown nowhere on screen) is invalid.
- `F8` is rejected while any changed row has `2` or `4`. Unchanged rows (options typed on a **previous** Enter that were already processed) do not count — `readc` only sees rows changed since the last read.

## Edge cases found in code

- **`F8` with no lines / no options** passes straight to `s01act` (`c07`): confirm is not blocked by an empty list.
- **`F8` with an invalid option (e.g. `1`)** raises 35 but not 36 (36 needs `2`/`4`); confirm is still blocked because `step01 = dsp`. — `ORD100.PGM.RPGLE:162-170`
- **Messages are never reset in code.** Indicators 35 and 36 are set on and never set off by the program (only `dspatr_ri` is). Whether they stay on for later displays depends on how the `INDARA` indicator area is refilled on the next `CTL01` input (runtime, not confirmed). — `ORD100.PGM.RPGLE:52-53,165,174`
- **Highlight persistence.** The reverse-image attribute is written into the row; it is cleared only when that row is rewritten (`s01act` delete/edit return, or a reload). A corrected option on the next Enter rewrites the row with 34 off. — `ORD100.PGM.RPGLE:164,180-181`
- `readc(e)` — the `(E)` extender swallows I/O errors on the subfile read; the loop treats `%error` like end-of-file. — `ORD100.PGM.RPGLE:160-161`
- `F3`/`F12` are `CA` keys: options typed on the screen are not returned, so `s01chk` never sees them (`c13`). — `ORD100D.DSPF:8-9`

## Dependencies

- Subfile control keywords `SFLNXTCHG`, `SFLRCDNBR`, `ERRSFL`, `SFLMSG` — `ORD100D.DSPF:11,14,38-41`
- Indicator data structure — `ORD100.PGM.RPGLE:36-54`

## Assumptions / unknowns

- Persistence of the 35/36 messages across subsequent displays (runtime).

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:15,36-54,126-136,151-185` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:8-9,11,14,16-17,32,38-41`
