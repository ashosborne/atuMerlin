# ord-batch-ord900-c01 — `ORD900`: set data area `LASTORDNO` to the highest existing `ORID` (`SETGT *HIVAL` / `READP` on `ORDER1`, `IN *LOCK`, `Z-ADD`, `OUT`); on an empty file the data area is set to 0, not left alone

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD900` is an eleven-line fixed-form RPG IV program with one input file and one data area. It positions past the last key of `ORDER1` (`UNIQUE K ORID`), reads the previous record — the order with the highest `ORID` — locks data area `LASTORDNO` (`d next … DTAARA('LASTORDNO')`, `6S 0`), copies `ORID` into it and writes it back (`OUT`, which also releases the lock), then sets `LR`. That makes `LASTORDNO` equal to the **last number used**, which is the contract `ORD100` relies on (`IN *LOCK` → `+1` → `OUT` → `ORID = ordno`, `ord-entry-ord100-c07`). The program takes no parameters, prints nothing, tests nothing: `READP` at beginning-of-file (empty `ORDER`) is not checked, so `ORID` keeps its program-initial value and the data area is written as **0** — the next `ORD100` confirm would then allocate order number 1. Between the `READP` and the `IN *LOCK` there is no file lock, so an `ORD100` confirm that slips in between is overwritten (theoretical — the two programs are both interactive menu options). The target pack replaces the data area with a sequence and lists `ORD900` as *not converted* (`modern/README.md:405` — cited read-only, not widened).

## Entrypoints

- Menu: `:menui option=80 action='cmd call ord900'` / `Reset LASTORDNO … ORD900` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:143-146` (Utilities group, `menu-cmd-shell-c01`; no confirmation at menu level)
- Program: `ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE:4-11` (no `*ENTRY PLIST`, no `PI` — structural grep)
- No other caller in `ATU_SRC` (grep `ORD900`: the member and the two menu lines).

## Inputs / outputs / observables

- In: `ORDER1` (`forder1 if e k disk` — input, keyed, externally described; `UNIQUE K ORID` over `ORDER.PF`). — `ORD900.PGM.RPGLE:4`; `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`
- Out: data area `LASTORDNO` (`*DEC LEN(6 0)`, source seed value `60719`) := `ORID` of the last record. — `ORD900.PGM.RPGLE:5,8-10`; `ATU_SRC/QDTASRC/LASTORDNO.DTAARA:8`
- Observable: nothing on screen; `DSPDTAARA LASTORDNO` shows the new value; the next order created by `ORD100` carries `LASTORDNO + 1`. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:56,189-192`

## Behaviour as implemented

1. **Position and read.** `*hival setgt order1` positions after the highest `ORID`; `readp order1` reads the last record by key. Because `ORDER1` is `UNIQUE` on `ORID`, that record's `ORID` is `MAX(ORID)`. — `ORD900.PGM.RPGLE:6-7`; `ORDER1.LF:4-6`
2. **Lock, assign, write.** `*lock in next` reads the data area with a lock; `z-add orid next` copies the 6-digit packed `ORID` (`SAMREF` `ORID 6P 0`) into the 6-digit zoned data-area field (same magnitude, no truncation); `out next` writes it back — `OUT` without `*LOCK` releases the lock (platform — inference). — `ORD900.PGM.RPGLE:5,8-10`; `ATU_SRC/QDDSSRC/SAMREF.PF:34`
3. **End.** `seton lr` — files closed, data area unlocked (it already was). No message, no return code. — `ORD900.PGM.RPGLE:11`
4. **Contract with `ORD100`.** `ORD100` declares the same data area (`Ordno 6s 0 DTAARA('LASTORDNO')`) and does `in *lock ordno; ordno += 1; out ordno; ORID = ordno` — i.e. it treats `LASTORDNO` as *last used*, exactly what `ORD900` stores. `ORD100` is the only other program in the tree that touches the data area (grep). — `ORD100.PGM.RPGLE:56,189-192`

## Validation rules found in code

- None. No `%eof` / `%found` test after `READP`, no comparison of the current data-area value against `ORID`, no lower bound.

## Edge cases found in code

- **Empty `ORDER`.** `READP` sets `%eof`, which is not tested; the input fields of an externally described file keep their values — at program start that is the initial zero for a numeric field (RPG initialisation — inference, runtime-confirmable). `LASTORDNO` is therefore written as **0**, and the next `ORD100` confirm allocates order **1**. Phase A's "readp fails/undefined" is sharpened: it does not fail, it writes 0. — `ORD900.PGM.RPGLE:7-10`
- **Data area larger than the file.** If `LASTORDNO` is *ahead* of `MAX(ORID)` (orders deleted via `ORD200` / `ORD201` option 4 — `ORD200.PGM.SQLRPGLE:230-232`, via the existing cards), `ORD900` moves it **back** to `MAX(ORID)`; the freed numbers are reused by later confirms. That is the one reason to run it at all in a live estate (the other is after a data restore). — `ORD900.PGM.RPGLE:9-10`
- **Race with `ORD100`.** No lock is held on `ORDER1` between the `READP` and the `IN *LOCK`. An `ORD100` confirm in that window writes `ORID = LASTORDNO + 1` and is then overwritten by `ORD900` with the older maximum; the following confirm reuses a number and `write forde` fails on `ORDER1`'s `UNIQUE` access path (duplicate key — platform, inference; `ORD100` does not monitor the write). Theoretical: both are interactive menu options in a demo estate. — `ORD900.PGM.RPGLE:7-8`; `ORD100.PGM.RPGLE:189-197`; `ORDER1.LF:4`
- **Field size.** `ORID 6P 0` into `next 6S 0` and into a `*DEC LEN(6 0)` data area — no overflow possible. `ORD100`'s `+= 1` on `999999` would be the overflow, not `ORD900`. — `SAMREF.PF:34`; `LASTORDNO.DTAARA:8`

## Dependencies

- `ORDER1.LF` over `ORDER.PF` (shared PF/LF — **dep**, not the slice).
- `LASTORDNO.DTAARA` (`QDTASRC` — ARCAD-generated source, `VALUE(60719)`).
- Consumer of the contract: `ord-entry-ord100-c07`.
- Menu surface: `menu-cmd-shell-c01` (option 80).

## Assumptions / unknowns

- Platform: `OUT` without `*LOCK` unlocks the data area; `READP` at BOF leaves the input fields unchanged and numeric fields start at zero; `UNIQUE` LF rejects a duplicate key on `WRITE` to the PF. Inference, runtime-confirmable (`DSPDTAARA` after a run on an empty file).
- **needs-SME (room, ORD pack):** in the target the data area is a Postgres sequence (`lastordno`, `modern/db/schema.sql:59-61`, cited read-only). Is a "reset the sequence to `MAX(id)`" operator action wanted at all, or is `ORD900` demo tooling (`c07`) with no target counterpart? Not decided here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD900.PGM.RPGLE:4-11` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:34` · `ATU_SRC/QDTASRC/LASTORDNO.DTAARA:8` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:56,189-197` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:143-146` · structural grep of `ATU_SRC/**` for `ORD900` (3 hits), `LASTORDNO` (4 hits), `*ENTRY` / `PLIST` / `PI` in the member (none)
