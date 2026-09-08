# ord-entry-ord100-c13 — Abandon before confirm writes nothing

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Leaving the list with `F3` (`exit`) or `F12` (`cancel`) ends the program without writing `ORDER` or `DETORD` and without touching `LASTORDNO`; there is no "lines will be lost" prompt. The staged rows remain in `QTEMP/DETORD` until the next wrapper run deletes the file or the job ends. Two further, less obvious abandon paths exist: cancelling the customer prompt (`c01`) and pressing `F3`/`F12` on the add-line screen reached via `F6` (`c03`). `F3`/`F12` on the add screen reached automatically after customer selection, or on the edit screen, return to the list instead.

## Entrypoints

- `s01key`: `when exit → panel = 0; step01 = prp` / `when cancel → step01 = prp; panel = panel - 1` (1 → 0) — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:138-145`
- `pnl00`: `*inlr = *on` — `ORD100.PGM.RPGLE:333-335`
- File-level `CA03(03)` / `CA12(12)` (attention keys: no input data returned) — `ATU_SRC/QDDSSRC/ORD100D.DSPF:8-9`; `KEY01` legends `F3=Exit`, `F12=Cancel` — `ORD100D.DSPF:77-80`
- Wrapper `DLTF QTEMP/DETORD` on the next run — `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:6-7`, `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-6`

## Inputs / outputs / observables

- In: `F3` or `F12` on `CTL01`.
- Out: nothing to `ORDER`, `DETORD`, `LASTORDNO`; program returns to the CL, which ends; the caller (`ORD200`/`ORD201`, `c10`) reloads its list, which shows no new order.
- Residue: staged rows in `QTEMP/DETORD` (job-scoped; invisible outside the job).

## Behaviour as implemented

1. `CA03`/`CA12` return without field data, so typed options are discarded and `s01chk` is never reached. — `ORD100D.DSPF:8-9`
2. `s01key` sets `panel = 0` (directly for `exit`, via `panel - 1` for `cancel`). — `ORD100.PGM.RPGLE:140-145`
3. Next cycle pass: `panel` is neither 1 nor 2 → `pnl00` → `*inlr = *on` → return. — `ORD100.PGM.RPGLE:72-79,333-335`
4. `ORDER` / `DETORD` are opened output-only and only written in `c07`; the data area is only touched in `c07`. Nothing else has side effects on shared data. — `ORD100.PGM.RPGLE:10-11,56,189-207`

## Validation rules found in code

None — no confirmation of the abandon, whatever the number of staged lines.

## Edge cases found in code

- **Add screen via `F6`:** `F3`/`F12` on `FMT02` propagate to `s01key` (because `step01` is still `key`) and end the program — an accidental abandon path with the same silent outcome (`c03`). — `ORD100.PGM.RPGLE:135,148-150,280-285`
- **Add screen on first pass** (`step01 = prp`) and **edit screen** (`step01 = act`): the same keys return to the list; the order is not abandoned. — `ORD100.PGM.RPGLE:59,157,214-217`
- **Customer prompt cancelled**: program ends before any screen (`c01`). — `ORD100.PGM.RPGLE:320-324`
- **Staged rows survive** in `QTEMP` until `DLTF` at the next wrapper run in the same job; a direct `CALL ORD100` in that job (while the override is still in effect) would show them again (`c02`). — `ORD100C.PGM.CLLE:6-7`
- `F3`/`F12` on `FMT03` are **not** an abandon: by then the order is written (`c08`).
- Triggers do not fire on abandon (no writes to `ORDER`/`DETORD`; the `QTEMP` copy has `TRG(*NO)`, `c02`).

## Dependencies

- Wrapper CL (`c02`); subfile control `CTL01` / `KEY01` — `ORD100D.DSPF:26-88`

## Assumptions / unknowns

- Whether users expect a warning before losing staged lines (as-is: none). For the SME.

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-11,56,59,72-79,135,138-150,157,189-207,214-217,280-285,320-324,333-335` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:8-9,26-88` · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:6-7` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-6`
