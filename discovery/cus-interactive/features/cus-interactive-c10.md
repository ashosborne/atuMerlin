# cus-interactive-c10 — Customer detail display with country name (CUS250 FMT02)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

After a successful chain, `CUS250` `FMT02` shows the `CUSTOMER` row read-only, with `COUNTR` resolved by `FCOUNTRY.GetCountryName(CUCOUN)`; Enter, F3 and F12 all return to `FMT01`.

## Entrypoints

- `S02prp` (`COUNTR = GetCountryName(CUCOUN)`) → `S02dsp` (`EXFMT FMT02`) — `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:129-137`
- `FMT02` record — `ATU_SRC/QDDSSRC/CUS250D.DSPF:33-70`

## Inputs / outputs / observables

Output fields (all `O`): `CUID`, `CUSTNM`, `CUPHONE`, `CUVAT`, `CUMAIL`, `CULINE1..3`, `CUZIP`, `CUCITY`, `CUCOUN`, `COUNTR` (30A, from `COUNTRY` ref), `CULIMCRE` and `CUCREDIT` with `EDTCDE(J)`, `CULASTORD` raw numeric. — `CUS250D.DSPF:56-70`
Not shown: `CUCREA`, `CUMOD`, `CUMODID`, `CUDEL`.

## Behaviour as implemented

1. `S02prp`: country name lookup (blank if code unknown — `COU300` clears `FCOUN` before the chain). — `:130`, `ATU_SRC/QRPGLESRC/COU300.RPGLE:19-27,57-61`
2. `S02dsp`: `EXFMT FMT02`. — `:134-137`
3. `S02key`: F3 → `panel = 1` (back to prompt, **not** program exit); F12 → `panel - 1` = 1; Enter → `S02chk` (empty) → `S02act` → `panel = 1`. All three paths lead to `FMT01`. — `:139-161`
4. `FMT01` is redisplayed with the same id (`step01 = dsp` was left by `S01act`), so the user can press Enter to re-view or type another id. — `:106-110`

## Validation rules found in code

- None (read-only screen; `S02chk` is empty). — `:152-156`

## Edge cases found in code

- The `CUSTOME1` record read in `S01chk` is used without re-read; concurrent updates between chain and display are not detected (input-only file, no lock). — `:7,98`
- `CULASTORD` presentation differs from `CUS200` (`c07`).
- `EDTCDE(J)` shows negative amounts with a trailing minus and comma separators (job-dependent); `CUS200` uses `EDTCDE(2)` — presentation differs between the two screens. — `CUS250D.DSPF:67-68` vs `CUS200D.DSPF:135-140`
- `COUNTR` sits at col 32, immediately after `CUCOUN` at col 29 (2 chars + 1 space). — `CUS250D.DSPF:66,70`

## Dependencies

- `FCOUNTRY.GetCountryName` — `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-8`; `COUNTRY.PF` (`COUNTR` ref) — `CUS250D.DSPF:70`.
- `CUSTOME1.LF`, `CUSTOMER.PF`.

## Assumptions / unknowns

- None beyond runtime edit-code rendering (job `DECFMT`).

## Evidence

`ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:7,98,106-110,129-161` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:33-70` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:19-27,50-63`
