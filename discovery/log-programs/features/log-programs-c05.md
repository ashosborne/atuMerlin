# log-programs-c05 — LOG100: QUSCRTUS errors are swallowed; the next API call surfaces them indirectly

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — error handling, absence) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`LOG100` passes the standard API error-code structure `errcod` (256 bytes, `bytes provided` preset to 256) to `QUSCRTUS`. With a non-zero `bytes provided` the API **returns** any failure in the structure instead of sending an escape message; `LOG100` never looks at `bytes available` or `error_msgid`, so a create failure (library not found, not authorized, object in use, …) is silent **at that point**. The very next statement, `QUSPTRUS`, is prototyped **without** an error-code parameter, so its failures do escape: if the create failed and no `SAMLOG` exists in that library, `QUSPTRUS` sends `CPF9801` (object not found, inference) → unmonitored in `LOG100` (no `monitor`, no `*pssr`, `dftactgrp(*no)`) → RPG status 00202 → function-check inquiry to the operator. Phase A's "errors swallowed" is therefore **sharpened**: the create error is swallowed, but its usual consequence is reported one line later by a different API with a misleading message. The one case that stays fully silent is a create failure **while an older `SAMLOG` already exists**: `QUSPTRUS` then succeeds on the old object and lines 24–25 rewrite its header (`pos = 7`, `'***'`) — the old log is logically emptied although "create" failed (inference).

## Entrypoints

- `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:21-22` — `crtusrspc(…:'*YES':errcod);`
- `LOG100.PGM.RPGLE:23` — `rtvusrspcptr(usrspc:p1);`
- `LOG100.PGM.RPGLE:24-25` — `pos = 7; data = '***';`
- `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4-12` — `crtusrspc` prototype, last parameter `errcod 256`
- `APICALL.RPGLEINC:14-16` — `rtvusrspcptr` prototype: `usrspc 20 const`, `ptr *` — **no error-code parameter**
- `APICALL.RPGLEINC:25-33` — `errcod ds`: `byte_provided 10i 0 inz(%len(errcod))`, `byte_availabl`, `error_msgid 7`, `message_data 240`

## Inputs / outputs / observables

- In: nothing tested. — `LOG100.PGM.RPGLE:19-27`
- Out on create failure: `errcod.byte_availabl > 0`, `error_msgid = CPFxxxx` — discarded. — `APICALL.RPGLEINC:27-29`
- Observable: (a) no old object → inquiry message on `QUSPTRUS` (`CPF9801` under `RNQ0202`, inference); (b) old object present → program ends normally, old log reset to empty header; (c) create OK → normal path (`c01`).

## Behaviour as implemented

1. `errcod` is a copybook DS shared by every program that includes `APICALL.RPGLEINC` (guarded by `/if not defined(errcod)`); `byte_provided` is initialised to 256 once. — `APICALL.RPGLEINC:25-33`
2. `QUSCRTUS` call with `errcod` → API error semantics "return in structure". — `LOG100.PGM.RPGLE:21-22`
3. No `if byte_availabl > 0`, no message — straight to `QUSPTRUS`. — `:23`
4. `QUSPTRUS` without error code → escape on failure; `LOG100` has no handler. — `:23`, `APICALL.RPGLEINC:14-16`
5. On success, header rewrite regardless of whether the object is new or old. — `:24-25`

## Validation rules found in code

None.

## Edge cases found in code

- **Create fails, old `SAMLOG` present** (e.g. `*ALL` public authority but owner-only object management; library locked): silent header reset of the existing log — content still physically present beyond byte 7 but overwritten from the next `AddLogEntry` on. — `LOG100.PGM.RPGLE:21-25` (inference)
- **Create fails, no `SAMLOG`**: function-check inquiry; the program has done nothing. Operator answer `C` ends the job step. — `:23` (inference)
- **`PARAMETER` not on `*LIBL`**: fails at the implicit open before either API (`c01`, `par-maintain-c13`). — `:6`
- **`LOG300` side has the mirror image**: `QUSPTRUS` without error code → escape → swallowed by the caller's `callp(e)` (`c03`, `c06`). Same prototype, opposite outcome, because the caller differs. — `LOG300.RPGLE:43`, `ORD700.PGM.RPGLE:78`

## Dependencies

- `APICALL.RPGLEINC` prototypes and shared `errcod` DS; `QUSCRTUS`, `QUSPTRUS`
- `c01` (the create call), `c06` (install step — the only time this code runs)

## Assumptions / unknowns

- Platform: API error-code convention (`bytes provided > 0` → return in structure; omitted → escape); `CPF9801` as the not-found escape from `QUSPTRUS`; RPG status 00202 / `RNQ0202` on an unmonitored escape from a called program. All flagged inference / runtime-confirmable.
- Target: not applicable — `LOG100` has no target counterpart (install step; recommendation `c01`).

## Evidence

`ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:5-6,19-27` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4-16,25-33` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:43` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:78`
