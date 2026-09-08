# cus-interactive-c05 — Country prompt (F4) via FCOUNTRY selector

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

F4 on `FMT02` calls `FCOUNTRY.SltCountry(cucoun)` (selection window in `COU301`), stores the returned code in `CUCOUN`, resolves `CONAME` via `GetCountryName`, and redisplays `FMT02` without running validation.

## Entrypoints

- `FMT02` `CF04(04)` — `ATU_SRC/QDDSSRC/CUS200D.DSPF:86`
- `S02key` `when prompt` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:281-284`
- Prototypes `/COPY ../QPROTOSRC/COUNTRY.RPGLEINC` — `:35`, `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-8,22-23`

## Inputs / outputs / observables

- Input: current `CUCOUN` (2A) passed by reference as the default; F4 is a `CF` key so all typed `FMT02` fields are read first.
- Output: `CUCOUN` replaced by the selection (or unchanged), `CONAME` (30A) shown at row 14 col 31; `step02 = dsp`. — `:282-284`, `CUS200D.DSPF:141`

## Behaviour as implemented

1. `cucoun = SltCountry(cucoun)`. `COU301.SltCountry` opens its own display file, shows a country subfile, and returns the selected `COID` when a row is marked option 1; on F3/F12 it returns the default it was given. — `ATU_SRC/QRPGLESRC/COU301.RPGLE:85-92,155-158,238-246`
2. `coname = GetCountryName(cucoun)`; `COU300.GetCountryName` clears `FCOUN` and chains `COUNTRY` by code, returning `COUNTR` — blank when the code does not exist. — `ATU_SRC/QRPGLESRC/COU300.RPGLE:19-27,50-63`
3. Redisplay `FMT02`; no `S02chk` runs on the prompt path, so the other fields keep their typed values but are not validated until Enter. — `:282`

## Validation rules found in code

- None on this path; `ExistCountry` runs only in `S02chk` (`c04`).

## Edge cases found in code

- Cancelling the selector leaves the typed (possibly invalid) code in place; `CONAME` becomes blank for an unknown code, giving a silent visual cue before `ERR0002` on Enter. — `COU301.RPGLE:92`, `COU300.RPGLE:59-60`
- `chainCOUNTRY` caches by comparing `P_COID <> COID` before re-chaining, so repeated lookups of the same code skip I/O; a country renamed mid-session would not refresh until the code changes. — `COU300.RPGLE:57-61`
- `CONAME` is not part of `FCUST`, so it is not persisted; only `CUCOUN` is stored.
- `CUS200` binds `FCOUNTRY` via `BNDDIR('SAMPLE')` (`ACTGRP(*CALLER)`); files opened inside `COU300/COU301` stay open in the caller's activation group until `CloseCOUNTRY` (never called by `CUS200`). — `CUS200.PGM.SQLRPGLE:26`, `ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:8`, `COUNTRY.RPGLEINC:27`

## Dependencies

- `FCOUNTRY.ILESRVPGM` (modules `COU300`, `COU301`; exports `EXISTCOUNTRY`, `GETCOUNTRYISO3`, `GETCOUNTRYNAME`, `SLTCOUNTRY`) — `ATU_SRC/QSRVSRC/FCOUNTRY.BND:13-18`
- `COUNTRY.PF` and `COU301D` display file (owned by unscanned seed `cou-maintain`; deps only here).

## Assumptions / unknowns

- Selector window layout and its own paging/positioning are `cou-maintain` behaviour, not documented here.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:26,35,281-284` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:86,141` · `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-8,22-23` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:19-27,50-63` · `ATU_SRC/QRPGLESRC/COU301.RPGLE:85-92,155-158,238-246` · `ATU_SRC/QSRVSRC/FCOUNTRY.BND:13-18`
