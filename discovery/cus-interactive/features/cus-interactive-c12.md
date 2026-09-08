# cus-interactive-c12 — Subfile option validation (2, 5 only)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

On Enter from the `CUS200` list, `s01chk` walks changed subfile rows; any option other than blank/0, 2 or 5 is reverse-imaged with the cursor positioned on it, `SFLMSG 'Invalid Option'` is shown, and no action runs until every option is valid.

## Entrypoints

- `s01key` `other` → `step01 = chk` → `s01chk` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:188-189,193-213`
- DDS: `OPT01 2Y 0B` with `DSPATR(RI)`/`DSPATR(PC)` on indicator 34; `SFLMSG('Invalid Option' 35)`; `SFLNXTCHG` on 33 — `ATU_SRC/QDDSSRC/CUS200D.DSPF:14-18,40`

## Inputs / outputs / observables

- Input: `OPT01` per row (numeric 2,0; blank reads as 0).
- Output: rows in error shown reverse image, cursor on the first error row (`RRB01 = rrn01`), message line "Invalid Option"; valid rows untouched. — `:199-207`

## Behaviour as implemented

1. `step01 = act`, `err01 = *off`, `sflnxtchg = *on`. — `:194-196`
2. `READC(e) SFL01` loop over changed rows: if `opt01 ∉ {0, 2, 5}` → `step01 = dsp`, indicator 34 on, indicator 35 on, and on the first error remember the row (`rrb01 = rrn01`). Every changed row is `UPDATE`d with `SFLNXTCHG` on so it is returned again by the next `READC`; indicator 34 is reset per row. — `:197-211`
3. `sflnxtchg = *off`; if no error, `step01` remains `act` and `s01act` processes the options (`c03`, `c06`). — `:212,215-237`
4. Indicator 35 (`SFLMSG`) is its own response indicator so the display file turns it off on the next input. — `CUS200D.DSPF:40`

## Validation rules found in code

- Allowed: `0`/blank (no action), `2` (edit), `5` (orders). — `:199`

## Edge cases found in code

- Rows with valid options are re-marked changed too (`SFLNXTCHG` applies to every updated row), so after fixing an invalid option the previously typed valid options are still processed on the next Enter. — `:196,208`
- Option `1`, `3`, `4`, `6`+ are all "Invalid Option"; there is no delete (`4`) or display (`5` is orders, not display) — consistent with `c11`.
- `READC(e)` with `%error` ends the loop silently; no message. — `:197-198`
- `OPT01` is `Y` (zoned) with `EDTCDE(Z)`, so leading zeros are suppressed and non-numeric entry is rejected by the workstation controller before the program sees it. — `CUS200D.DSPF:15-18`

## Dependencies

- Display file `CUS200D` only.

## Assumptions / unknowns

- None.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:40-60,188-213,215-237` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:14-18,40`
