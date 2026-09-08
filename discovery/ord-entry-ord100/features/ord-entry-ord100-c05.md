# ord-entry-ord100-c05 — Delete staged line

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `4` deletes the staged row from `QTEMP/DETORD` by `ODLINE`, subtracts the row's net total from `TOT`, and rewrites the subfile row blanked with the description `**** Delete ***` (the row stays on screen until the list is reloaded). The VAT-inclusive footer total is adjusted with **whatever `ODTOTVAT` happens to be in program memory** — `ODTOTVAT` is not a subfile field — so `TOTVAT` is generally wrong after a delete until `F5` reloads. Several `4`s typed together are processed in one pass with no confirmation.

## Entrypoints

- Option `4` on `SFL01` → `s01chk` (valid) → `s01act` `when opt01 = 4` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:162,214-232`
- Subfile record `SFL01` (fields `OPT01`, `LINE`, `ODARID`, `ARTDESC`, `ODQTY`, `ODTOT`, `ODPRICE` — **no** `ODTOTVAT`) — `ATU_SRC/QDDSSRC/ORD100D.DSPF:12-25`

## Inputs / outputs / observables

- In: `OPT01 = 4` and the row's `LINE`, `ODTOT` as returned by `readc sfl01`.
- Out: `delete (line) tmpdetord`; `update sfl01` with `OPT01 = 0`, `ODARID = ' '`, `ODQTY = 0`, `ODPRICE = 0`, `ODTOT = 0`, `ARTDESC = '**** Delete ***'` (`LINE` unchanged). — `ORD100.PGM.RPGLE:224-231`
- Observable: `TOT` decreases by the row's net; `TOTVAT` decreases by a value that may belong to another row. — `ORD100D.DSPF:85-87`

## Behaviour as implemented

1. `readc(e) sfl01` returns the row (populates `OPT01`, `LINE`, `ODARID`, `ARTDESC`, `ODQTY`, `ODTOT`, `ODPRICE`). — `ORD100.PGM.RPGLE:214`
2. `tot -= odtot` — correct, `ODTOT` came from the subfile row. — `ORD100.PGM.RPGLE:222`
3. `totvat -= odtotvat` — `ODTOTVAT` is **not** in `SFL01`, so this is the last value the program stored in that field: the last row read by `s01lod` (i.e. the **last line in the file** after a reload) or the last value computed in `S02chk`/`S02prp` (`c03`, `c04`). — `ORD100.PGM.RPGLE:223`, `ORD100D.DSPF:12-25`
4. `delete (line) tmpdetord` — delete by partial key `ODLINE` without a prior read; not-found is not tested. — `ORD100.PGM.RPGLE:224`, `ATU_SRC/QDDSSRC/DETORD.PF:21`
5. Row blanked and rewritten (`update sfl01`, `SFLNXTCHG` off at this point so the row is no longer "changed"). — `ORD100.PGM.RPGLE:225-231,184`
6. `step01` stays `act`, so the next cycle pass runs `s01act` again and `readc` fetches the next changed row: consecutive `4`s are processed without redisplay; at `%eof` → `step01 = dsp` and the list is redisplayed (not reloaded). — `ORD100.PGM.RPGLE:157,214-217`

## Validation rules found in code

None beyond option validity (`c06`). No "are you sure" step. Deleting the only line leaves an order with zero lines that can still be confirmed (`c07`).

## Edge cases found in code

- **`TOTVAT` drift.** Example from the code paths: three lines loaded (VAT-inclusive 12.00, 24.00, 36.00); deleting line 1 subtracts line 1's own net from `TOT` but 36.00 (the last loaded row's `ODTOTVAT`) from `TOTVAT`. `F5` (`refresh → prp → lod`) recomputes both from the file. — `ORD100.PGM.RPGLE:104-105,113-115,146-147,222-223`
- **Option `4` on an already-deleted row.** The blanked row can be selected again: `tot -= 0`, `totvat -= odtotvat` (stale, again), `delete` finds nothing (silent). Totals drift further. — `ORD100.PGM.RPGLE:221-231`
- **Deleted row remains in the subfile** (RRN kept, `LINE` still visible) until the next reload; option `2` on it is the `c04` exception case.
- **Line numbers are not reused**: `count` is not decremented (`c12`).
- The `QTEMP` file is `uf a` — the `delete` acts on the staging copy only; the real `DETORD` is never read or deleted by this program. — `ORD100.PGM.RPGLE:11-12`

## Dependencies

- Staging file `TMPDETORD` (`c02`), `DETORD.PF` key `(ODLINE, ODORID, ODYEAR)` — `DETORD.PF:21-23`
- Subfile mechanics: `SFLNXTCHG(33)`, `readc` — `ORD100D.DSPF:14`, `ORD100.PGM.RPGLE:50,159,184`

## Assumptions / unknowns

- Whether the `TOTVAT` drift is known (it is a display-only defect: the confirmed order is built from the file, not from `TOT`/`TOTVAT`, `c07`). For the SME to decide preserve vs fix at a later station.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:11-12,50,104-105,113-115,146-147,157,159,184,214-232` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:12-25,85-87` · `ATU_SRC/QDDSSRC/DETORD.PF:21-23`
