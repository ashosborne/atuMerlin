# log-programs-c10 — Unsynchronised shared append: concurrent writers read the same cursor and overwrite each other

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — concurrency) |
| Confidence | `inferred` (the read-modify-write sequence and the absence of any lock are `observed-in-code`; that the race is hit, and how often, is runtime) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound as `inferred`, kept `inferred`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMLOG` is one object shared by every job on the system, and its write cursor `pos` lives inside it (`c02`). `AddLogEntry` performs a three-step read-modify-write with no serialisation: read `pos` (line 27), write 600 bytes at `pos` (line 31), add the length back into `pos` (line 32 — which re-reads the shared `pos`, since it is a based field). There is no `ALCOBJ`, no `LOCK`/`UNLOCK`, no `CMPSWP`, no data-queue or data-area indirection, and a user space offers no implicit locking. Two jobs that delete order lines at the same moment (`ORD700` runs in the deleting job — `ord-trigger-ord700`) can therefore interleave: both read `pos = P`, both write at `P` — the second write **overwrites the first line entirely** (600 bytes, blank-padded) — and `pos` ends at `P + la + lb` (one line of blanks where the lost line was) or at `P + lb` (next line overwrites again), depending on the interleaving. Lost lines leave no trace. The window is microseconds per call, the in-tree event rate is a few deletes a day: a real but rare defect, unobservable without a reader (`c09`). Recorded as-is (job header: do not fix).

## Entrypoints

- `ATU_SRC/QRPGLESRC/LOG300.RPGLE:12` — `d pos s 10i 0 based(p1)` — the shared cursor, re-read at each reference
- `LOG300.RPGLE:27` — `p2 = p1 + pos;` (read 1)
- `LOG300.RPGLE:31` — `data = data2;` (600-byte write at the position from read 1)
- `LOG300.RPGLE:32` — `pos += %len(data2);` (read 2 + write of the cursor)
- Absence: grep `LOG300.RPGLE` / `LOG100.PGM.RPGLE` for `alcobj`, `lock`, `unlock`, `cmpswp`, `dtaara`, `in `, `out ` (none); no `MONITOR`; the caller runs the trigger in its own job (`ORD700.PGM.RPGLE:76-82`)

## Inputs / outputs / observables

- Shared state: bytes 0–3 of `SAMLOG` (`pos`) and the bytes from `pos` onward. — `c02`
- Interleaving A (`A27 B27 A31 A32 B31 B32`): `B` overwrites `A`'s line at `P`; `pos = P + la + lb`; bytes `P+lb … P+la+lb−1` are blanks (from `B`'s 600-byte pad). Log shows `B`, then a blank run, then later lines. `A` lost.
- Interleaving B (`A27 B27 A31 B31 A32 B32`): same overwrite; `pos` advances twice — as A.
- Interleaving C (`A27 A31 B27 B31 …`): `B` read `pos = P` after `A`'s write but before `A`'s increment → `B` overwrites `A`; then both increments apply — as A.
- Interleaving D (`A27 B27 A31 A32 B31` then `B32` reads the incremented `pos`): identical to A — the increment is relative (`+=`), so it is never "lost", only the *line* is. Net: **lines are lost, the cursor over-advances by the lost line's length, leaving blank runs.**
- Observable: blank stretches between lines in a dump; a line count lower than the number of deletes. Runtime-confirmable only with two sessions deleting simultaneously (or a scripted mass delete from two jobs).

## Behaviour as implemented

1. No entry lock; `init` resolves the pointer once per activation group (`c03`) — every job has its own `p1` to the same object. — `LOG300.RPGLE:41-43`
2. `p2 = p1 + pos` — snapshot of the cursor. — `:27`
3. 600-byte assignment at the snapshot. — `:31`
4. `pos += %len(data2)` — read-add-store on the shared integer; not atomic (RPG `+=` on a based field is a load/add/store sequence — inference). — `:32`

## Validation rules found in code

None.

## Edge cases found in code

- **Cursor itself can be corrupted** if two `pos +=` load/add/store sequences interleave at instruction level: one increment lost → the next writer overwrites the last line. Narrower window than the line race; same absence of protection. — `:32` (inference)
- **Overflow interacts:** a writer that fails at the boundary (`c04`) leaves `pos` unchanged; a concurrent writer cannot succeed either — the race disappears once the space is full.
- **Trigger context amplifies nothing in-tree** — one delete per Enter in `ORD101`; but any external multi-job delete (data cleanup from two jobs) is the realistic scenario.
- **`User` stamp is per activation group** (`c03`), so the surviving line correctly names its own writer; the lost line's writer is simply absent.

## Dependencies

- `c02` (cursor in the object), `c03` (write sequence), `c07` (who writes, in which job), `c04` (boundary)

## Assumptions / unknowns

- needs-SME (room): acceptable data loss for a diagnostic log? Recommendation unchanged from Phase A — non-functional side effect; the target's `samlog` table insert is transactional and ordered by `bigserial` (`modern/db/schema.sql:134-140`), so the race has no counterpart to reproduce.
- Platform (inference): user-space writes are plain storage writes with no implicit lock; `+=` on a based `10i 0` is not atomic.

## Evidence

`ATU_SRC/QRPGLESRC/LOG300.RPGLE:12-13,24-32,41-43` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82` · structural grep of `LOG300.RPGLE` / `LOG100.PGM.RPGLE` for `alcobj`, `lock`, `cmpswp`, `dtaara` (none)
