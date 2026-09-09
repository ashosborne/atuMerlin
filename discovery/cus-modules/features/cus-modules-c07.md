# cus-modules-c07 — Selection rules (option 1 only, single selection)

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

On Enter (or F8), `S01chk` reads every changed subfile row: option `0` is ignored, any option other than `1` raises `INVALID OPTION`, a second `1` raises `ONLY ONE SELECTION`. Offending rows are reverse-imaged with the cursor on them and the page is repositioned to the first error; every changed row (valid or not) is re-marked `SFLNXTCHG`; the action step runs only when no error occurred.

## Entrypoints

- `S01key` `other` → `chk` → `S01chk` — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:163-164,168-209`
- DDS: `SFLNXTCHG` on 33; `OPT01 1Y 0B` with `DSPATR(RI)` + `DSPATR(PC)` on 34; `SFLMSG('INVALID OPTION' 35)`, `SFLMSG('ONLY ONE SELECTION' 36)`; `SFLRCDNBR` field `RRB01` — `ATU_SRC/QDDSSRC/CUS301D.DSPF:15-19,35-37`

## Inputs / outputs / observables

- In: `OPT01` per changed row (numeric 1 digit; the display file rejects non-digits before the program sees them — system field edit on a `Y` field).
- Out: indicators 34 (per error row, during `update`), 35, 36; `RRB01`; `Step01` = `act` (clean) or `dsp` (errors). Messages are DDS literals, not `SAMMSGF` ids.

## Behaviour as implemented

1. Reset `SLT01`, `STS01`, `ERR01`; assume success (`Step01 = act`); `readc(E) SFL01`; `SflNxtChg = *ON` **for the whole loop**. — `CUS301.SQLRPGLE:170-177`
2. Per changed row (`select`, first match wins):
   - `OPT01 = 0` → nothing. — `:180-181`
   - `OPT01 <> 1` → `STS01` on, `Step01 = dsp`, `dspatrRi` on, `InvalidOpt` (35) on; if this is the first error, `RRB01 = RRN01` and `ERR01` on. — `:182-190`
   - `SLT01 = *ON` (a `1` was already seen) → `Step01 = dsp`, `dspatrRi` on, `OneSelect` (36) on; first-error handling as above. — `:192-199`
   - otherwise (the first `1`) → `SLT01` on, `STS01` on. — `:200-203`
3. `update SFL01` with 33 on, then `dspatrRi = *off`, `readc SFL01`. — `:205-207`
4. Because step 3 runs for **every** changed row, valid `1` rows are re-marked as changed too; that is what lets `S01act`'s second `readc` find the selection (`c08`). Invalid rows also remain "changed" and are re-validated on each Enter until the user clears or corrects them.
5. Only error rows carry `DSPATR(RI)`/`DSPATR(PC)`: 34 is on solely during their `update`. A row corrected on the next pass is updated with 34 off, clearing the attributes.

## Validation rules found in code

| Rule | Condition | Indicator | Text |
| --- | --- | --- | --- |
| Option must be 1 | `OPT01 <> 1` (and `<> 0`) | 35 | `INVALID OPTION` |
| Exactly one selection | second row with `OPT01 = 1` | 36 | `ONLY ONE SELECTION` |

## Edge cases found in code

- **Precedence.** `when OPT01 <> 1` is tested before `when SLT01 = *ON`, so a `2` typed after a `1` is `INVALID OPTION`, not `ONLY ONE SELECTION`. Both indicators can be on in one pass (e.g. rows `1`, `1`, `3`); with `ERRSFL` both messages go to the error subfile — display order is system behaviour.
- **Which `1` wins.** `SLT01` marks the first `1` in RRN order; later `1`s are errors. When the user corrects them the surviving `1` is returned by `S01act`.
- **Page positioning.** `RRB01` is set to the RRN of the *first* error row only (`ERR01` guard), so the page containing that row is shown; `DSPATR(PC)` is on every error row, cursor placement among several is system behaviour.
- **Errors block a new search.** `S01chk` runs before the criteria-change check in `S01act`; with an invalid option on the old list, newly typed criteria stay on screen but are not applied until the option is fixed (`c08`).
- **Cleared options.** A row changed to `0` is a changed row with no error; it still gets `SFLNXTCHG` and is re-read harmlessly.
- `STS01` is set but never read; `err01`/`slt01` are procedure locals reset each call. — `:171-172,183,203`
- `readc(E)` with `%error` ends the loop silently on an I/O error. — `:176-178`

## Dependencies

- `ATU_SRC/QDDSSRC/CUS301D.DSPF` (`SFL01`/`CTL01`), `INDARA` indicator DS — `CUS301.SQLRPGLE:15-35`

## Assumptions / unknowns

- None beyond system-level message/cursor ordering noted above.

## Evidence

`ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:15-35,163-164,168-209` · `ATU_SRC/QDDSSRC/CUS301D.DSPF:15-19,35-37`
