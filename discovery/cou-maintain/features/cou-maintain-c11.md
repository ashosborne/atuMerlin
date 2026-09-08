# cou-maintain-c11 — Position-to option 8, control-line guards 41/42, row rules 35/36

| | |
| --- | --- |
| Slice | `cou-maintain` (FCOUNTRY half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`; FCOUNTRY half only) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Every Enter (and F8) in the `SltCountry` window runs `S01chk`: each changed subfile row must carry `0` or `1` (`35 INVALID OPTION`, reverse image), and at most one row may carry `1` (`36 ONLY ONE SELECTION`); the control line accepts only `0` or `8` (`41 Invalid option`) and refuses `8` while a row selection is pending (`42 Position to not available with selection pending`). Option `8` repositions the list at `POSCOD` (by code) or `POSDES` (by name) and reloads from there. The whole subroutine and the DDS behind it are **line-for-line identical to `sltArtFam`** (`FAM301` / `FAM301D`), confirmed by diff — the only differences in the two members are names, files, window geometry and the F8 lines (`c10`).

## Entrypoints

- `S01chk` — `ATU_SRC/QRPGLESRC/COU301.RPGLE:166-220`; position-to branch of `S01act` — `:233-239`
- DDS: `OPT01` + `DSPATR(RI)`/`(PC)` on 34 — `ATU_SRC/QDDSSRC/COU301D.DSPF:21-24`; `SFLMSG` 35/36 — `:39-40`; `OPTC1` + `ERRMSG` 41/42 — `:50-53`; `POSCOD` / `POSDES` — `:60-62,65-68`; legend `'1=Select'`, `'8=Position to'` — `:46-47,54-55`
- Twin: `ATU_SRC/QRPGLESRC/FAM301.RPGLE:166-220,233-239` (cited only; `fam-maintain` unbound)

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| `OPT01` | `1Y 0B` per row; `EDTCDE(Z)`; RI + cursor on indicator 34 | `COU301D.DSPF:21-24` |
| `OPTC1` | `1Y 0B` control line row 5 col 3 | `COU301D.DSPF:50` |
| `POSCOD` | 2A, `REFFLD(COID COUNTRY)`, hidden + protected when by-name (40) | `COU301D.DSPF:60-62` |
| `POSDES` | 30A, `REFFLD(COUNTR COUNTRY)`, `CHECK(LC)`, hidden + protected when by-code (`N40`) | `COU301D.DSPF:65-68` |
| Flags | `SLT01` (a row with `1` seen), `STS01` (any non-zero row option seen), `ERR01` (first error row already positioned) — procedure locals | `COU301.RPGLE:59,62-63,167-172` |
| Indicators | 33 `SFLNXTCHG`, 34 `dspatrRi`, 35 `InvalidOpt`, 36 `OneSelect`, 41 `InvalidOptC`, 42 `NotAvail` | `COU301.RPGLE:31-37` |
| `RRB01` | set to the first error row's RRN so the page containing it is shown | `COU301.RPGLE:185-188,194-197` |

## Behaviour as implemented

1. **Reset.** `SLT01 = STS01 = ERR01 = *off; Step01 = act;` then `readc(E) SFL01` and `SflNxtChg = *on` for the loop. — `COU301.RPGLE:167-175`
2. **Row loop** (`dow not %error and not %eof`), per changed row:
   - `OPT01 = 0` → nothing.
   - `OPT01 <> 1` → `STS01` on, `Step01 = dsp`, `dspatrRi` on, `InvalidOpt` (35) on; if this is the first error row, `RRB01 = RRN01`, `ERR01` on.
   - `OPT01 = 1` while `SLT01` already on → `Step01 = dsp`, RI, `OneSelect` (36) on; first-error positioning as above.
   - otherwise (`OPT01 = 1`, first) → `SLT01` on, `STS01` on.
   - `update SFL01` (writes 33/34 state back to the row), `dspatrRi` off, `readc` next. — `:176-206`
3. **Control line**, evaluated after the loop in this order:
   - `OPTC1 <> 8 and <> 0` → `InvalidOptC` (41), `Step01 = dsp`.
   - `SLT01 and OPTC1 <> 0` → `NotAvail` (42), `Step01 = dsp`.
   - `STS01 and IN08` → `Step01 = dsp` (F8 ignored while options are typed, `c10`). — `:207-219`
4. **`S01act`, position-to.** If no guard fired: `when OPTC1 = 8 → Step01 = prp; KEYCOD = POSCOD` (by code) or `KEYDES = POSDES` (by name). `s01prp` then `clear CTL01` (blanks `OPTC1`, `POSCOD`, `POSDES`) and `SETLL` on the new key. — `:233-239,95-115`
5. **Selection.** Only reached with `OPTC1 = 0`, no invalid rows, and not F8: `readc` for the row with `OPT01 = 1` → `return coid` (`c09`). — `:240-247`

## Validation rules found in code

- Row option ∈ {0, 1}; exactly zero or one row with `1` per Enter.
- Control option ∈ {0, 8}; `8` only when no row carries `1` on the same Enter.
- No validation of the position-to text itself: any value is a valid `SETLL` argument (beyond-last-key → empty window, `c09`).

## Edge cases found in code

- **Errors are cumulative within one Enter.** All changed rows are examined; 35 and 36 can both be on, and the page shown is the one holding the **first** offending row (`ERR01` latch). The control-line message (41/42) is shown together with them via `ERRSFL`. — `COU301.RPGLE:185-188,194-197`, `COU301D.DSPF:9`
- **Invalid row option + option 8:** 35 fires in the loop; `OPTC1 = 8` passes the control checks (`SLT01` off) but `Step01` is already `dsp`, so the position-to is **not** applied and the typed `8` stays on screen until the row is fixed. — `:180-188,207-219`
- **Valid `1` + option 8:** 42; the selection is not returned and the position is not applied. Clearing either one on the next Enter proceeds.
- **Invalid row option + F8:** 35 and no toggle (`STS01 and IN08`). — `:216-218`
- **Reverse image is per-row and sticky until the next `update`:** 34 is set before `update SFL01` and reset right after, so it is written into the offending row's attributes only; a later Enter that re-reads the row (33 kept it "changed") rewrites it with 34 off. — `:183,192,203-204`
- **Position field for the inactive order is protected and non-display**, so a value typed into it earlier cannot be submitted after a toggle; `clear CTL01` on every `prp` also blanks both. — `COU301D.DSPF:61-62,66-67`, `COU301.RPGLE:97`
- **`POSDES` is the only lower-case-capable input** in the window (`CHECK(LC)`); `POSCOD` is uppercased by the session, matching the uppercase 2-character codes. — `COU301D.DSPF:68`
- **Identity with `sltArtFam`:** `diff FAM301.RPGLE COU301.RPGLE` shows differences only at lines 2, 6–9, 16, 53–56, 64–68, 70–71, 104–113, 123–124, 131–133, 137–138, 229–231, 244, 250–252 (names, files, F8 lines, trailing blank); lines 166–220 and 233–239 are byte-identical. `diff FAM301D.DSPF COU301D.DSPF` (timestamps stripped) differs only in `%TEXT`, field `REFFLD`s, titles and `WINDOW` geometry.

## Dependencies

- `c09` (window, load, selection return), `c10` (F8 interaction)
- `ATU_SRC/QDDSSRC/COU301D.DSPF` (`ERRSFL`, `INDARA`, message texts are literals in the DDS, not `SAMMSGF`) — `:7,9,39-40,51-53`
- `ATU_SRC/QRPGLESRC/FAM301.RPGLE`, `ATU_SRC/QDDSSRC/FAM301D.DSPF` — comparison only

## Assumptions / unknowns

- Whether `ERRSFL` shows 41/42 and 35/36 simultaneously or queues them is display-manager behaviour (no runtime); the code sets them together.
- `needs-SME / room`: the selector rules are a shared template across `SltCountry`, `SltArtFam` (identical) and, with a different list mechanism, `SltCustomer` / `SltProvider` (`cus-modules-c07`, `pro-modules`). One target rule or several is an Architecture-pack decision, not made here.

## Evidence

`ATU_SRC/QRPGLESRC/COU301.RPGLE:31-37,59,62-63,95-115,166-220,233-247` · `ATU_SRC/QDDSSRC/COU301D.DSPF:7,9,21-24,39-40,46-47,50-55,60-62,65-68` · `ATU_SRC/QRPGLESRC/FAM301.RPGLE:166-220,233-239` · `ATU_SRC/QDDSSRC/FAM301D.DSPF` (diff, timestamps stripped)
