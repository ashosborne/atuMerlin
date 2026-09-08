# cus-interactive-c07 — Sentinel last-order date (CULASTORD 0 → 1940-01-01 → blank)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUSTOMER.CULASTORD` is a numeric `8,0` (ISO `yyyymmdd`, 0 = never ordered). `CUS200` maps 0 to the date constant `1940-01-01`, which the display file's `MAPVAL` renders as blank; `CUS250` shows the raw number with no mapping.

## Entrypoints

- `datBlank C d'1940-01-01'` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:89`
- `S02prp` mapping — `:260-264`; `*INZSR` default — `:336`
- `FMT02.LASTORD L B DATFMT(*JOB) MAPVAL(('1940-01-01' *BLANK))` — `ATU_SRC/QDDSSRC/CUS200D.DSPF:144-145`
- `CUS250` `FMT02.CULASTORD` output as numeric — `ATU_SRC/QDDSSRC/CUS250D.DSPF:69`

## Inputs / outputs / observables

- Stored: `CULASTORD 8 0` — `ATU_SRC/QDDSSRC/CUSTOMER.PF:21-22`
- `CUS200` shows a `*JOB`-format date, or blank when the value is 0.
- `CUS250` shows the 8-digit number (no `EDTCDE`, no date conversion), including `0` for never-ordered.

## Behaviour as implemented

1. On update prepare: `if CULASTORD = 0 → LASTORD = 1940-01-01 else LASTORD = %date(CULASTORD : *iso)`. — `:260-264`
2. DDS `MAPVAL` swaps `1940-01-01` for blanks on output (and blanks back to `1940-01-01` on input). — `CUS200D.DSPF:145`
3. `LASTORD` is a program/screen field only; it is never written to `CULASTORD` (see `c02`). Writers of `CULASTORD` are outside this slice: `ORD701.SQLTRG:14` (after-insert trigger on `ORDER`), `ORD901.PGM.SQLRPGLE:46`, `ART801.SQLPRC:35`.

## Validation rules found in code

- None. An invalid stored `CULASTORD` (e.g. `20241301`) would make `%date(:*iso)` raise an RPG exception on `S02prp` (no `(e)` / `MONITOR`). — `:263`

## Edge cases found in code

- The sentinel is only applied in `S02prp`; on the F6 create path (`c02`) `LASTORD` keeps the previous value (stale) because `S02prp` is skipped.
- `CUS250` and `CUS200` disagree on presentation of the same field (raw `0`/`yyyymmdd` vs blank/date). — `CUS250D.DSPF:69` vs `CUS200D.DSPF:144-145`
- The same 1940-01-01 sentinel convention appears in `ORD200/ORD201/ORD202` and the `ISOTODATE40` UDF (Phase A note); those slices are not bound — this card owns the convention for CUS only, no cross-slice claim.

## Dependencies

- `CUSTOMER.PF` (`CULASTORD`), `CUS200D`/`CUS250D` DDS.

## Assumptions / unknowns

- `DATFMT(*JOB)` output depends on the job's `DATFMT`/`DATSEP` — runtime configuration.
- Whether a modern target should keep the blank-sentinel semantics or a nullable date is a Conversion decision, not made here.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:89,257-266,336` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:144-145` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:69` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:21-22` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:14` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:35`
