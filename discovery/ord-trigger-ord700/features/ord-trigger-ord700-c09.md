# ord-trigger-ord700-c09 — Staging copy excludes triggers

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Both order-entry wrappers (`ORD100C`, `ORD100C2`) build the staging file as `CRTDUPOBJ OBJ(DETORD) ... TOLIB(QTEMP) CST(*NO) TRG(*NO)` and override `TMPDETORD` to it. Every add / edit / delete that `ORD100` performs while the user is composing the order hits this untriggered `QTEMP` copy and is invisible to `ORD700`. `ORD700` fires only for the final `write fdeto` to the real `DETORD` at confirm — once per line, in staging-file key order, each with `ODQTYLIV = 0` — after the `ORDER` header has been written (which fires `ORD701`, `c07`). Net effect at confirm: `ARCUSQTY += ODQTY` per line, `CULASTORD = today` once.

## Entrypoints

- `ORD100C`: `DLTF QTEMP/DETORD` (`MONMSG CPF0000`) → `CRTDUPOBJ ... CST(*NO) TRG(*NO)` → `OVRDBF FILE(TMPDETORD) TOFILE(QTEMP/DETORD)` → `CRTORD CUID(&CUID)` — `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:6-12`
- `ORD100C2`: same, then `CALL PGM(ORD100)` — `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-11`
- `ORD100` F-specs: `fdetord o e k disk` (real, output only) and `fTmpdetord uf a e k disk rename(fdeto:tmprec)` (staging). — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-12`

## Inputs / outputs / observables

- Staging I/O (never triggers): `write tmprec` (add line), `update tmprec` (edit), `delete (line) tmpdetord` (delete). — `ORD100.PGM.RPGLE:224` (delete) and the `TMPREC` write/update sites documented in `ord-entry-ord100-c03` / `c04`
- Confirm I/O (triggers): `write forde` (→ `ORD701`), then per staged row `write fdeto` (→ `ORD700` insert). — `ORD100.PGM.RPGLE:197-206`
- Observable: `ARCUSQTY` and `CULASTORD` change only at confirm, never while the order is being composed; abandoning an order (`F3`/`F12`, see `ord-entry-ord100-c13`) leaves no trigger footprint.

## Behaviour as implemented

1. Wrapper deletes any previous `QTEMP/DETORD`, duplicates the production `DETORD` **object** (data not copied; `CRTDUPOBJ` default `DATA(*NO)`) into `QTEMP` with constraints and triggers omitted. — `ORD100C.PGM.CLLE:6-10`
2. `OVRDBF TMPDETORD → QTEMP/DETORD` makes `ORD100`'s `TMPDETORD` F-spec open the copy. No `DLTOVR` / `DLTF` afterwards (the copy and override persist for the job; `ord-entry-ord100-c02`). — `ORD100C.PGM.CLLE:11`
3. At confirm `ORD100` reads the staging file from `*loval` in key order (`ODLINE, ODORID, ODYEAR`), renumbers `odline = count`, sets `odorid = orid`, and `write fdeto` to the real `DETORD` — `ORD700` event `'1'` runs after each write. `ODYEAR` stays `0`, `ODQTYLIV` stays `0` (as staged). — `ORD100.PGM.RPGLE:198-208`, `ATU_SRC/QDDSSRC/DETORD.PF:21-23`
4. Because the real file is opened `O` (output only) in `ORD100`, no update or delete on production `DETORD` can originate from `ORD100`; the update/delete triggers (`c03`, `c04`) are reachable only from `ORD101`, `ORD200`, `ORD201`, `ORD901`. — `ORD100.PGM.RPGLE:11`

## Validation rules found in code

None specific. `TRG(*NO)` is explicit on both wrappers (not a default relied upon).

## Edge cases found in code

- **Calling `ORD100` without a wrapper** would open `TMPDETORD` unresolved (open failure; `ord-entry-ord100-c02`). It would not accidentally fire triggers on staging — it would not stage at all.
- **A staged copy from a different library**: `CRTDUPOBJ FROMLIB(*LIBL)` duplicates whichever `DETORD` is first in the library list; if that library's `DETORD` differs in layout from the one `ORD700` was compiled against, the trigger still fires on the real file's writes (`c06` layout coupling).
- **`RPLTRG(*YES)`** on the definitions has no bearing on the `QTEMP` copy — `TRG(*NO)` omits the triggers regardless of how they were registered. — `ORD700A.SYSTRG:6`, `ORD100C.PGM.CLLE:10`
- **Header before lines**: `ORD701` (customer stamp) has already run when the first `ORD700` insert fires; there is no transaction around the sequence (`c07`).

## Dependencies

- `DETORD.PF` (source object for `CRTDUPOBJ`) — `ATU_SRC/QDDSSRC/DETORD.PF`
- Slice `ord-entry-ord100` cards `c02` (staging), `c03`/`c04`/`c05` (staged I/O), `c07` (confirm) — boundary only; not re-documented here.

## Assumptions / unknowns

- None beyond `c01` (whether triggers are attached to the production `DETORD` at all — if they are not, the distinction this card draws is moot on that box).

## Evidence

`ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:6-12` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-11` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:10-12,197-208,224` · `ATU_SRC/QDDSSRC/DETORD.PF:21-23` · `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:6`
