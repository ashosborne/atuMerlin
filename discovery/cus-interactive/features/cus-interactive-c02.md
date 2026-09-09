# cus-interactive-c02 — Create customer with id from CUSSEQ sequence

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

F6 on the `CUS200` list resets the `FCUST` record buffer, draws the next id from SQL sequence `CUSSEQ` and opens `FMT02` in mode `CRT`; Enter (after `c04` validation) writes the new row to `CUSTOMER` via `CUSTOME1`.

## Entrypoints

- `CUS200` `CTL01` command key `CF06 'Create'` — `ATU_SRC/QDDSSRC/CUS200D.DSPF:31`
- `s01key` `when create` → `panel = 2`, `step02 = dsp`, `mode = CRT` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:179-185`
- Save: `S02act` `write fcust` — `:321-329`

## Inputs / outputs / observables

Inputs (`FMT02`, all input-capable unless noted): `CUSTNM`, `CUPHONE`, `CUVAT`, `CUMAIL`, `CULINE1..3`, `CUZIP`, `CUCITY`, `CUCOUN`, `CULIMCRE`, `LASTORD` (input-capable but ignored, see edge cases). `CUID`, `CUCREDIT`, `CONAME`, `MODE` are output only. — `CUS200D.DSPF:104-145`

Outputs
- New `CUSTOMER` row keyed `CUID` = `NEXT VALUE FOR CUSSEQ`.
- `MODE` shows `CRT` at row 3 col 70 — `CUS200D.DSPF:142`

## Behaviour as implemented

1. F6: `reset fcust` restores every `FCUST` field to its value after `*INZSR` (so `CUMODID = *USER`, `CUCREA = %date()` at program start, all else blank/zero), then `EXEC SQL SET :CUID = NEXT VALUE FOR CUSSEQ`. — `:179-185,333-337`
2. Goes **directly** to `S02dsp` (skips `S02prp`): no chain, no country-name lookup. — `:180-182,268-271`
3. Enter → `S02chk` (`c04`). If any error, `step02 = dsp` and the format redisplays with error indicators. — `:290-319`
4. On clean check → `S02act`: `CUMOD = %timestamp()`, `WRITE FCUST` (mode ≠ `UPD`), return to the list (`panel = 1`). — `:321-329`
5. `CUSSEQ`: `START WITH 1551 INCREMENT BY 1 NO MAXVALUE NO CYCLE`. — `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-9`

## Validation rules found in code

See `c04`. No additional create-specific rules; duplicate rule in `CRT` mode is `dup > 0`.

## Edge cases found in code

- **Sequence value is consumed on F6, before any save.** F12/F3 from `FMT02` (`S02key` → `panel = 1`) abandons the create; the id is never reused (`NO CYCLE`). Gaps in `CUID` are therefore normal. — `:274-280`, `CUSSEQ.SQLSEQ:9`
- `CUCREA` is the **program start date** (`*INZSR`), not the save date; a session left open across midnight creates customers dated the previous day. — `:333-337`
- Screen-only fields are not part of `reset fcust`: `CONAME` and `LASTORD` keep whatever the previous `FMT02` (an earlier update) displayed, so the create screen can show a stale country name and stale last-order date. `LASTORD` is initialised to the 1940-01-01 sentinel only once at `*INZSR`. — `:141,144-145` (DSPF), `:257-266,336`
- `LASTORD` is input-capable (`B`) on `FMT02` but never copied back to `CULASTORD`; typed values are discarded. `CULASTORD` is written only by `ORD701`/`ORD901`/`ART801` outside this slice. — `CUS200D.DSPF:144-145`, `:321-329`
- `CUCREDIT` starts at 0 and cannot be entered (output only). `CULIMCRE` is accepted without validation (signed 9,2; `EDTCDE(2)` hides the sign). — `CUS200D.DSPF:135-140`
- `CUDEL` is not shown or settable on `FMT02`; reset leaves it blank. — `CUS200D.DSPF:84-145`
- A `WRITE` to `CUSTOME1` (`UNIQUE` on `CUID`) would fail with a duplicate key only if the sequence were behind the data; the program has no `(e)` extender or error handling on the write, so such a failure would surface as an RPG runtime exception. — `:327`, `CUSTOME1.LF:4-6`

## Dependencies

- `CUSSEQ.SQLSEQ`; `CUSTOME1.LF` (`UNIQUE`, key `CUID`) opened `UF A`; `CUSTOMER.PF`.
- `FCOUNTRY` (`ExistCountry`, `SltCountry`, `GetCountryName`) via `c04`/`c05`.
- `SAMMSGF` messages via `c04`.

## Assumptions / unknowns

- Whether gap-free ids are a hidden business requirement (SME question carried from Phase A).
- Whether any other program or SQL path inserts into `CUSTOMER` (none found under `ATU_SRC`; `CUSSEQ` is referenced only by `CUS200`). — `rg` over `ATU_SRC`

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:29,179-185,257-271,274-280,321-337` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:31,84-145` · `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-9` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`
