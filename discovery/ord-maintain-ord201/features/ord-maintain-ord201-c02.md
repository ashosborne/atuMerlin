# ord-maintain-ord201-c02 — F6 create -> ORD100C2

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — seam edge) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`F6` (`CF06`) calls `ORD100C2` with **no parameters** — the CL stages `QTEMP/DETORD` (constraints and triggers off), overrides `TMPDETORD` to it and `CALL ORD100`, where the customer is chosen inside the entry program. On return `ORD201` closes its cursor and rebuilds the whole list from row 1, unconditionally (also after a cancelled create). Options typed on the `F6` pass are discarded. `ORD200` calls `ORD100C(cuid)` instead, with the customer preselected.

## Entrypoints

- Legend `F6=Create` on `KEY01`; `CF06(06 'Create')` on `CTL01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:36,95-96`
- `s01key` `when create` → `NewOrd()` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:155-158`
- Prototype `Neword pr extpgm('ORD100C2')` (no parameters) — `ORD201.PGM.SQLRPGLE:16`

## Inputs / outputs / observables

- In: none passed. — `ORD201.PGM.SQLRPGLE:16,156`
- Out (data): whatever `ORD100` confirms — an `ORDER` header and `DETORD` lines written by the callee (`ord-entry-ord100-c07`); nothing written by `ORD201`. — `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:11`
- Out (screen): after return, `step01 = prp` → `SFLCLR`, new cursor, first batch of 14, `RRB01 = 1`. The new order (today's date, highest `ORID`) appears at the top by the `datord desc, orid desc` sort (`c01`). — `ORD201.PGM.SQLRPGLE:93-110,157`

## Behaviour as implemented

1. `s01key` tests function keys **before** options: `exit`, `cancel`, `refresh`, `create`, `pagedown`, then `other` → `s01chk`. An `F6` pass never reaches `s01chk`, so options typed on that pass are neither validated nor executed; the subsequent `SFLCLR` discards them. — `ORD201.PGM.SQLRPGLE:144-164`
2. `NewOrd()` — synchronous call of `ORD100C2`: `DLTF QTEMP/DETORD` (`MONMSG CPF0000`), `CRTDUPOBJ DETORD … TOLIB(QTEMP) CST(*NO) TRG(*NO)`, `OVRDBF FILE(TMPDETORD) TOFILE(QTEMP/DETORD)`, `CALL PGM(ORD100)`. — `ORD100C2.PGM.CLLE:5-11`
3. `ORD100` without a parameter prompts for the customer (`ord-entry-ord100-c01`); confirm writes header + lines and prints (`ord-entry-ord100-c07`, `c08`); `F3`/`F12` before confirm writes nothing (`ord-entry-ord100-c13`). No result is passed back. — `ORD100C2.PGM.CLLE:11`
4. `step01 = prp; exec sql close c1;` — cursor closed **after** the call (order of the two statements is irrelevant: the callee does not touch `c1`). Next cycle: `s01prp` declares/opens again, `s01lod` fetches the first 14. — `ORD201.PGM.SQLRPGLE:157-158`
5. The user's position in the list is lost (back to page 1) even if the create was cancelled.

## Validation rules found in code

None in `ORD201`. No check that the create succeeded; no message on return.

## Edge cases found in code

- **Customer chosen in the callee.** Because the list spans all customers there is no `cuid` to pass; `ORD100C2` exists for exactly this and for `SAMMNU` option 6 (`ord-entry-ord100-c10`). `ORD200` passes its `cuid` through `ORD100C` → `CRTORD CUID(&CUID)` (`ord-maintain-ord200-c02`). — `ORD100C2.PGM.CLLE:2,11`, `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-12`
- **Override scope.** `OVRDBF` without `OVRSCOPE` defaults to the activation-group scope of `ORD100C2`; whether that reaches `ORD100` depends on how the CL is compiled (`CRTBNDCL` `DFTACTGRP`/`ACTGRP`) — a build property owned by `ord-entry-ord100`, flagged there for the build owner. — `ORD100C2.PGM.CLLE:10`
- **`QTEMP/DETORD` is per job.** A second `F6` in the same job deletes and recreates the staging file (`DLTF` + `CRTDUPOBJ`); an `ORD100` session left open in another job is unaffected. — `ORD100C2.PGM.CLLE:5-9`
- **Triggers off on the staging copy only.** `TRG(*NO)` keeps `ORD700` off `QTEMP/DETORD`; the real `DETORD` insert on confirm fires it (`ord-trigger-ord700-c02`, `c09`). — `ORD100C2.PGM.CLLE:9`
- **`CF06`, not `CA06`.** Field data is returned on `F6`, but nothing reads it before the `SFLCLR`. — `ORD201D.DSPF:36`
- **Identical reload after cancel.** There is no "created" flag from the callee; a full reload is the only feedback. Same in `ORD200`.

## Dependencies

- `ORD100C2.PGM.CLLE` → `ORD100.PGM.RPGLE` (`ord-entry-ord100`, documented) — `ORD100C2.PGM.CLLE:5-11`
- `DETORD.PF` (staging copy source) — `ATU_SRC/QDDSSRC/DETORD.PF:5-23`

## Assumptions / unknowns

- Activation-group scope of the override and of `ORD100C2` itself: build metadata, not in source (`ord-entry-ord100` owns the question).

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:16,93-110,144-164` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:36,95-96` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:2,5-11` · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-12` · `ATU_SRC/QDDSSRC/DETORD.PF:5-23`
