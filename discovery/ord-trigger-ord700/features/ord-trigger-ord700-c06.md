# ord-trigger-ord700-c06 — Trigger buffer mechanics

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD700` is a classic external trigger program: two `*ENTRY` parameters (the 80-byte trigger buffer header `PARM1` and its length `PARM2`), before/after record images reached by pointer arithmetic from `OLDOFF` / `NEWOFF` onto two `EXTNAME(detord)` data structures, a `select` on `TEVEN` (`'1'` insert, `'2'` delete, `'3'` update), and a bare `return` that leaves the program active between calls. Called with **no** parameters it sets `*inlr` and ends cleanly. Trigger time, commit lock level, null-byte maps and the buffer length are read into fields but never used. This is integration plumbing, not business behaviour; it is documented so a later station knows exactly what to replace.

## Entrypoints

- `*ENTRY PLIST` with `PARM1` (buffer DS) and `PARM2` (buffer length) — `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:65-67`
- Registered by the three `ADDPFTRG` definitions (`c01`, needs-SME for attachment) — `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7`, `ORD700D.SYSTRG:4-7`, `ORD700U.SYSTRG:4-8`

## Inputs / outputs / observables

- In: `PARM1` DS — `FNAME` 10, `LNAME` 10, `MNAME` 10, `TEVEN` 1, `TTIME` 1, `CMTLCK` 1, reserved 3, `CCSID` 10i 0, reserved 8, `OLDOFF`, `OLDLEN`, `ONOFF`, `ONLEN`, `NEWOFF`, `NEWLEN`, `NNOFF`, `NNLEN` (all 10i 0) = 80 bytes; `PARM2` 10i 0. — `ORD700.PGM.RPGLE:14-51`
- Record images: `NEW` (`EXTNAME(detord) qualified based(pn)`), `OLD` (`… based(po)`); `pn` / `po` set per event to `%addr(parm1) + newoff` / `+ oldoff`. — `ORD700.PGM.RPGLE:53-61,74,77,84-85`
- Out: none of its own; all effects are through `UpdArt` (`c05`) and `AddLogEntry` (`c03`).

## Behaviour as implemented

1. `if %parms = 0 → seton lr; return` — a direct `CALL ORD700` (or a call from a trigger framework passing nothing) ends the program without touching files. `%parms = 1` is **not** handled: `PARM2` would be unset but is never read, so execution proceeds on `PARM1` alone. — `ORD700.PGM.RPGLE:68-71`
2. `select` on `TEVEN`: `'1'` → `c02`; `'2'` → `c03`; `'3'` → `c04`. There is no `other` — any other event code (e.g. `'4'` read) falls through and does nothing. — `ORD700.PGM.RPGLE:72-94`
3. `return` with `*inlr` **off** — the program stays activated in its activation group: `ARTICLE1` remains open, `pn` / `po` keep their last values, and `LOG300`'s `inz` flag / user-space pointer persist for the job. — `ORD700.PGM.RPGLE:95`
4. Activation group: `H dftactgrp(*no)` with **no** `actgrp` keyword — the group the trigger runs in is decided by the compile command (not in source). `LOG.ILESRVPGM` is `ACTGRP(*CALLER)`, so the log module lives in whatever group `ORD700` gets. — `ORD700.PGM.RPGLE:4`, `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8`

## Validation rules found in code

None. `TTIME` (after/before) is not checked, so an accidental `*BEFORE` registration would apply the same arithmetic before the row exists. `CMTLCK` is not checked — the trigger's `update farti` runs without regard to the writer's commitment control (no writer in tree uses commitment control). `FNAME` / `LNAME` are not checked — the program would run against any file whose layout happens to match `DETORD`. `OLDLEN` / `NEWLEN` / `PARM2` are not compared against the `DETORD` record length.

## Edge cases found in code

- **Null-byte maps ignored** (`ONOFF` / `NNOFF` unused): `DETORD` has no null-capable fields in DDS, so this is moot for the current layout. — `ORD700.PGM.RPGLE:37-40,45-48`, `ATU_SRC/QDDSSRC/DETORD.PF:5-20`
- **Layout coupling.** `NEW` / `OLD` are compiled from `DETORD`'s DDS at compile time (`EXTNAME`, no `LIKEREC`); a field added to `DETORD` without recompiling `ORD700` shifts nothing (offsets come from the buffer) but any reordering/resizing of existing fields would silently misread `ODQTY` / `ODQTYLIV` / `ODARID`. `RPLTRG(*YES)` on the definitions suggests re-registration is part of the deploy routine. — `ORD700.PGM.RPGLE:54,59`, `ORD700A.SYSTRG:6`
- **Program never ends by itself** once called with parameters (`*inlr` only on the no-parm path); it ends with the activation group / job.
- **Update event with `TRGUPDCND(*CHANGE)`** — the platform, not this program, filters unchanged updates (`c04`). — `ORD700U.SYSTRG:8`

## Dependencies

- `DETORD.PF` DDS (for `EXTNAME`) — `ATU_SRC/QDDSSRC/DETORD.PF:5-20`
- IBM i trigger buffer contract (fixed-format header, offsets relative to the buffer start).

## Assumptions / unknowns

- Compile-time `ACTGRP` and bind directory for `ORD700` (no `ORD700.ILEPGM` in `QILESRC`) — build owner.
- Attachment on the box (`c01`).
- Bind note carried forward (not a behaviour): "Conversion must replace this mechanism, not port it." Recorded here for a later station; this conveyor takes no conversion decision.

## Evidence

`ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4,14-61,65-72,74,77,84-85,94-95` · `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7` · `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` · `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8`
