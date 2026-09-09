# ord-maintain-ord201-c08 — F5 refresh

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`F5` (`CA05`, labelled `F5=Refresh` on `KEY01`) closes the open cursor and sets `step01 = prp`: the subfile is cleared, the cursor re-declared and re-opened, and the first batch of 14 rows is loaded — the list restarts at row 1 with current data. Options typed on the `F5` pass are discarded (`CA` key: no field data; `SFLCLR` follows). This is the **only** way to re-read rows already displayed short of leaving the program; `ORD200` enables `CA05` too but neither labels nor handles it (`ord-maintain-ord200-c01`).

## Entrypoints

- `CA05(05 'Refresh')` on `CTL01`; label `F5=Refresh` at 23/14 on `KEY01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:37,93-94`
- `s01key` `when refresh` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:152-154`
- `indds.refresh` = indicator 05 — `ORD201.PGM.SQLRPGLE:31`

## Inputs / outputs / observables

- In: none.
- Out (data): none.
- Out (screen): after the next two cycles (`s01prp`, `s01lod`) the page shows rows 1–7 of the fresh result (`RRB01 = 1`), `sflend` recomputed; `DATE`/`TIME` header fields refresh on the next output. — `ORD201.PGM.SQLRPGLE:93-130`, `ORD201D.DSPF:58-60`

## Behaviour as implemented

1. `exfmt ctl01` returns with indicator 05 on → `step01 = key`. — `ORD201.PGM.SQLRPGLE:137-141`
2. `s01key`: `exit`/`cancel` tested first (off), then `when refresh; step01 = prp; exec sql close c1;`. — `ORD201.PGM.SQLRPGLE:145-154`
3. `s01prp`: `RRN01 = 0; sflclr = *on; write ctl01; sflclr = *off;` `declare`/`open c1`; `rrs01 = 0`. — `ORD201.PGM.SQLRPGLE:93-110`
4. `s01lod`: first 14 rows, `RRB01 = 1`. — `ORD201.PGM.SQLRPGLE:112-130`
5. The user's position (page, row) is lost; any option typed on the pass is gone.

## Validation rules found in code

None.

## Edge cases found in code

- **`close c1` then re-`open`.** `close` on a cursor already at end-of-data is fine; the `open` result is not checked — a failed re-open (e.g. view locked) shows an empty list with no message (`c01`). — `ORD201.PGM.SQLRPGLE:107,154`
- **`CA` not `CF`.** No modified data is returned to the program; `s01chk` is not reached anyway (keys precede options). — `ORD201D.DSPF:37`, `ORD201.PGM.SQLRPGLE:144-164`
- **Refresh is the stale-copy antidote.** The `7`/`8`/`2`/`4` guards use screen copies of the dates (`c06`, `c07`); `F5` is the only in-program way to refresh them without acting. `4`/`7`/`8` update the row in place, `2`/`5`/`6` do not re-read, so after an `ORD101` edit only `F5` (or `F6`) corrects the `Value` column (`c03`).
- **Same reload as `F6`.** `create` does the same two statements after the call (`c02`); the `refresh` branch is the same reload without the call. — `ORD201.PGM.SQLRPGLE:152-158`
- **Twin divergence.** `ORD200D` has `CA05(05 'Refresh')` but no `F5` label on `KEY01` and no `when refresh` — there `F5` falls to `other` → `s01chk` → redisplay without reload. — `ATU_SRC/QDDSSRC/ORD200D.DSPF:34,85-92`, `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:146-160`

## Dependencies

- `ORD201D.DSPF` `CTL01`/`KEY01` — `ORD201D.DSPF:37,93-94`
- `ORDERCUS.VIEW` (re-read) — cited via `c01`

## Assumptions / unknowns

- None specific. Behaviour is fully determined by the source.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:31,93-130,137-164` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:37,58-60,93-94` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:34,85-92` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:146-160`
