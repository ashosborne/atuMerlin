# cou-maintain-c10 — F8 toggle by-code / by-name clears the key of the mode entered (source differs from FAM301; observable behaviour does not)

| | |
| --- | --- |
| Slice | `cou-maintain` (FCOUNTRY half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`; FCOUNTRY half only) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

F8 in the `SltCountry` window flips `bydesc` and re-prepares the list in the other order (`COUNTRY` by code ↔ `COUNTR1` by name). `COU301` clears the position key of the order being **entered** (`bydesc → clear KEYDES`, back to code → `clear KEYCOD`); `FAM301` clears the key of the order being **left**. The Phase A summary called this "the opposite of FAM301". **Correction (as-is, traced through both modules):** the two orderings are textually opposite but produce the **same observable behaviour** — in both windows every F8 toggle shows the new order from the top, and the caller's `pcod` positioning is lost the first time the user toggles away and back. The retained key in `COU301` is always cleared again before it could be used. F8 is ignored when any row option has been typed.

## Entrypoints

- `CF08(08)` on `CTL01`; legend `'F8=By code'` (ind 40 on) / `'F8=By desc.'` (ind 40 off) at row 17 col 14 of `KEY01` — `ATU_SRC/QDDSSRC/COU301D.DSPF:32,75-78`
- `IN08 = CF08` captured after `exfmt` — `ATU_SRC/QRPGLESRC/COU301.RPGLE:148`; toggle branch in `S01act` — `:225-232`; guard in `S01chk` — `:216-218`
- Comparison: `ATU_SRC/QRPGLESRC/FAM301.RPGLE:225-232` (`sltArtFam`, `fam-maintain`, unbound — cited only)

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| `bydesc` | indicator 40 in `indds` (module-global, shared with the display file): `*off` at entry; drives which file `s01prp`/`S01lod` read, which position field is shown/protected (`POSCOD` hidden on 40, `POSDES` hidden on `N40`) and which F8 legend shows | `COU301.RPGLE:35,75,103-111,130-134`, `COU301D.DSPF:61-62,66-67,75-78` |
| `KEYCOD` | 2A local, `= pcod` at entry; `SETLL` key for the by-code order | `COU301.RPGLE:64,73,104` |
| `KEYDES` | 30A local, blank at entry; `SETLL` key for the by-name order | `COU301.RPGLE:67,108` |
| `IN08` | local copy of `CF08` for the current `exfmt` | `COU301.RPGLE:58,148` |

## Behaviour as implemented

1. F8 is not in `S01key`'s `select`, so it takes the `other` branch → `S01chk` runs first (row options validated, `c11`). — `COU301.RPGLE:153-164`
2. In `S01chk`, `when STS01 = *ON and IN08 = *ON → Step01 = dsp`: if **any** row had a non-zero option (valid `1` or invalid), F8 is ignored and the panel redisplays with the options still typed; nothing toggles and nothing is selected. — `:216-218`
3. Otherwise `S01act`: `when IN08 → Step01 = prp; bydesc = not bydesc; if bydesc; clear KEYDES; else; clear KEYCOD; endif;`. `IN08` is tested **before** `OPTC1 = 8`, so F8 with a position-to typed on the same Enter toggles and discards the position (the control line is blanked by `clear CTL01` in `s01prp`). — `:222-232,97`
4. `s01prp` repositions with the (now blank) key of the new order → first record of `COUNTRY` (by code) or of `COUNTR1` (by name); 20 rows loaded (`c09`). — `:95-115`

Trace of the two implementations (derived, both modules; `K` = `KEYCOD`, `D` = `KEYDES`, entry `K = pcod`, `D = blank`):

| Step | `COU301` (clear key of mode entered) | `FAM301` (clear key of mode left) | Shown |
| --- | --- | --- | --- |
| F8 → by name | `D` cleared (`K` kept = `pcod`) | `K` cleared (`D` kept = blank) | names from top — **same** |
| option 8 in by-name, position `Ne` | `D = Ne` | `D = Ne` | names from `Ne` — same |
| F8 → by code | `K` cleared (`D = Ne` kept) | `D` cleared (`K` already blank) | codes from top — **same** (`pcod` lost in both) |
| F8 → by name | `D` cleared | `K` cleared (`D` blank) | names from top — **same** |

The retained key in `COU301` (`K` after the first toggle, `D` after the second) is never read while the other order is active and is cleared on re-entry to its own order, so no sequence of F8 / option 8 / Page Down exposes a difference. The divergence is real in the source and **nil on the screen**.

## Validation rules found in code

None specific to F8 beyond the "options typed → ignore F8" guard in step 2.

## Edge cases found in code

- **F8 + row option 1 typed:** selection is not made, toggle does not happen, row stays marked (`STS01` on). — `COU301.RPGLE:198-201,216-218`
- **F8 + control option 8 + no row options:** toggle wins, position-to text discarded (step 3).
- **F8 + invalid control option (e.g. `5`):** `InvalidOptC` (41) is raised and `Step01 = dsp` before `S01act` is reached — no toggle. — `:208-211`
- **F8 with a selection pending and option 8** is impossible to reach the toggle: the `SLT01 and OPTC1 <> 0` guard (42) fires first. — `:212-215`
- **Duplicate names in by-name order** list adjacent (`COUNTR1` is not `UNIQUE`); option 1 still returns the row's own `COID`. — `ATU_SRC/QDDSSRC/COUNTR1.LF:4-5`
- **Legend and field visibility** are driven by indicator 40 directly; the program never sets 40 except through `bydesc`. — `COU301D.DSPF:61-62,66-67,75-78`

## Dependencies

- `c09` (window mechanics), `c11` (option guards that run before the toggle)
- `ATU_SRC/QDDSSRC/COUNTR1.LF` (by-name order), `ATU_SRC/QDDSSRC/COUNTRY.PF` (by-code order)
- `ATU_SRC/QRPGLESRC/FAM301.RPGLE:225-232` — cited for the comparison only; `fam-maintain` is unbound and not deepened

## Assumptions / unknowns

- `needs-SME / room`: given the two windows behave identically, card the target selector once (one "keyed selector with order toggle" rule shared by `SltCountry` / `SltArtFam`) rather than twice? Phase A recommended carding them separately on the strength of this divergence; this card withdraws that reason. The `fam-maintain` bind can cite this trace.
- Whether the target should preserve the caller's current code as the position across toggles (neither legacy window does) is a target decision.

## Evidence

`ATU_SRC/QRPGLESRC/COU301.RPGLE:35,58,64,67,73-75,95-115,148,153-164,198-201,208-218,222-232` · `ATU_SRC/QDDSSRC/COU301D.DSPF:32,61-62,66-67,75-78` · `ATU_SRC/QRPGLESRC/FAM301.RPGLE:73-75,225-232` · `ATU_SRC/QDDSSRC/COUNTR1.LF:4-5`
