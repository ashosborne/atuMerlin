# ord-entry-ord100-c02 — Lines staged in QTEMP copy of DETORD (triggers/constraints off)

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Both CL wrappers prepare a job-scoped staging file before calling the program: `DLTF QTEMP/DETORD` (any failure ignored), `CRTDUPOBJ DETORD *LIBL → QTEMP` with `CST(*NO) TRG(*NO)`, then `OVRDBF TMPDETORD → QTEMP/DETORD`. `ORD100` reads/writes its lines through the file name `TMPDETORD` (update + add, keyed, record format renamed `TMPREC`) and never touches the real `DETORD` until confirm (`c07`). Constraints and the `ORD700` insert trigger are therefore **not** exercised while lines are staged. The two wrappers differ only in whether a customer id is passed (`c01`).

## Entrypoints

- `ORD100C` (with `&CUID`) — `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:6-12`
- `ORD100C2` (no parameter) — `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-11`
- `ORD100` F-spec `fTmpdetord uf a e k disk rename(fdeto:tmprec)` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:12`; compile-time note "before compile ovrdbf tmpdetord detord" — `ORD100.PGM.RPGLE:4-5`

## Inputs / outputs / observables

- In: `*LIBL/DETORD` as the template object.
- Out: `QTEMP/DETORD` — an empty physical file with `DETORD`'s record format and keys but **no** constraints and **no** triggers; a file override `TMPDETORD → QTEMP/DETORD` in the CL's call level.
- Observable: rows written by `ORD100` before confirm exist only in `QTEMP/DETORD`; `ARTICLE.ARCUSQTY` (maintained by `ORD700`) is not touched while staging.

## Behaviour as implemented

1. `DLTF FILE(QTEMP/DETORD)` + `MONMSG MSGID(CPF0000)` — a previous staging file in the same job is discarded; "not found" (and any other CPF) is swallowed. — `ORD100C.PGM.CLLE:6-7`, `ORD100C2.PGM.CLLE:5-6`
2. `CRTDUPOBJ OBJ(DETORD) FROMLIB(*LIBL) OBJTYPE(*FILE) TOLIB(QTEMP) NEWOBJ(DETORD) CST(*NO) TRG(*NO)` — copies the object (not the data; `DATA(*NO)` is the command default) without constraints or triggers. Unmonitored: if the duplicate fails the CL ends in error and `ORD100` is not called. — `ORD100C.PGM.CLLE:8-10`, `ORD100C2.PGM.CLLE:7-9`
3. `OVRDBF FILE(TMPDETORD) TOFILE(QTEMP/DETORD)` — the RPG file `TMPDETORD` is redirected to the copy. — `ORD100C.PGM.CLLE:11`, `ORD100C2.PGM.CLLE:10`
4. `ORD100C`: `CRTORD CUID(&CUID)`; `ORD100C2`: `CALL PGM(ORD100)`. — `ORD100C.PGM.CLLE:12`, `ORD100C2.PGM.CLLE:11`
5. In `ORD100`, `TMPDETORD` is opened as update/add, keyed; `DETORD` itself is opened **output-only** and only written in `c07`. Both files share the `FDETO` field names (`ODORID … ODTOTVAT`), so a `read tmpdetord` followed by `write fdeto` copies a row field-for-field. — `ORD100.PGM.RPGLE:11-12`
6. No `DLTOVR` / `DLTF` after the call: the override ends with the CL program's call level; the `QTEMP` copy stays until the next wrapper run in the job (step 1) or job end.

## Validation rules found in code

None. `MONMSG CPF0000` on the `DLTF` is the only monitored step.

## Edge cases found in code

- **Calling `ORD100` without a wrapper.** `TMPDETORD` is not an object in source (only an override target). Without the override, the RPG open fails at program start (unmonitored) — the Phase A open question stands. — `ORD100.PGM.RPGLE:4-5,12`
- **Same job, second order.** The `DLTF` at step 1 wipes whatever the previous run left (including an abandoned order, `c13`). If `ORD100` were started **without** going through the CL again in the same job (e.g. a direct `CALL` while the override from an earlier wrapper is still in effect), the abandoned lines would reappear in the subfile. — `ORD100C.PGM.CLLE:6`
- **Key of the copy.** `QTEMP/DETORD` inherits `DETORD`'s key `(ODLINE, ODORID, ODYEAR)`; `ORD100` only ever chains/deletes by `ODLINE` (`c04`, `c05`) and the copy holds one order, so the partial key is unique in practice. — `ATU_SRC/QDDSSRC/DETORD.PF:21-23`
- The `DETORD1` logical (`UNIQUE` on `ODORID, ODLINE`) is **not** duplicated with the PF, so staged rows are never checked against it. — `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
- `CST(*NO)`: `DETORD.PF` declares no constraints in DDS anyway; whether referential constraints exist on the object on the box is a runtime fact (not confirmed).

## Dependencies

- `ATU_SRC/QDDSSRC/DETORD.PF:5-23` (format `FDETO`, key)
- `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7` (the insert trigger that `TRG(*NO)` leaves off the copy — owned by `ord-trigger-ord700`, pointer only)
- `CRTORD` command (`c09`, needs-SME) for the `ORD100C` path.

## Assumptions / unknowns

- Whether anything calls `ORD100` directly (needs-SME; no such caller found under `ATU_SRC`, see `c10`).
- Whether constraints exist on the real `DETORD` object (runtime).

## Evidence

`ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-12` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-11` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:4-5,11-12` · `ATU_SRC/QDDSSRC/DETORD.PF:5-23` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7`
