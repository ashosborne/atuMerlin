# CANDIDATES — log-programs (Phase A, unbound)

Seed: `LOG100` + `LOG` service program (`LOG300`). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| log-programs-c01 | `LOG100` creates user space `SAMLOG` with `QUSCRTUS`: attribute `LOG`, **5000 bytes**, initial `X'00'`, `*ALL` public authority, text "Sample Application Log", replace `*YES`; the library is taken from the INFDS of the `PARAMETER` file it opens (pos 93–102) — i.e. "wherever `PARAMETER` resolves in `*LIBL`" | `QRPGLESRC/LOG100.PGM.RPGLE:6-7`, `:11-12`, `:20-22`; `QPROTOSRC/APICALL.RPGLEINC:4-12` | observed-in-code | Setup contract for the log store |
| log-programs-c02 | Header layout: `LOG100` writes offset 0 = `pos` (10i 0) initialised to **7**, offset 4 = `'***'`; `LOG300` reads `pos` from offset 0 and appends at `p1 + pos` | `LOG100.PGM.RPGLE:14-16`, `:23-25`; `LOG300.RPGLE:12-13`, `:27`, `:32` | observed-in-code | Binary format of `SAMLOG` |
| log-programs-c03 | `AddLogEntry(entry 500A by value)`: on first call per activation group resolves `SAMLOG *LIBL` (`QUSPTRUS`), then writes `'User: <*USER> * Date: <%timestamp> * Msg: <trimmed entry> ***'` at `pos` and advances `pos` by the written length; `User` is captured once at module load (`inz(*USER)`) | `LOG300.RPGLE:16`, `:18-35`, `:38-45` | observed-in-code | Log line contract |
| log-programs-c04 | **No capacity check**: the user space is 5000 bytes with no auto-extend (`QUSCRTUS` does not set it; `QUSCUSAT` is never called), `data` is a **600-byte fixed** based field so every write touches 600 bytes from `pos`; once `pos + 600 > 5000` the write raises a space-offset exception. `ORD700` calls `AddLogEntry` with `callp(e)` and never reads `%error`, so logging **stops silently** after roughly 4400 bytes of entries (~40–60 lines) | `LOG300.RPGLE:13`, `:27-32`; `LOG100.PGM.RPGLE:21`; `ORD700.PGM.RPGLE:78` | inferred | Runtime consequence derived from sizes; needs the box to confirm the exact failure mode |
| log-programs-c05 | `LOG100` errors are swallowed: `errcod` DS passed to `QUSCRTUS` (bytes provided = length) so API failures return in the DS and are never inspected | `LOG100.PGM.RPGLE:21-22`; `APICALL.RPGLEINC:25-33` | observed-in-code | Error handling (absence) |
| log-programs-c06 | `LOG100` has **no caller and no menu entry** — it is a one-off environment setup step run manually (inferred); if it is never run, every `AddLogEntry` fails on `QUSPTRUS` (swallowed by the `(e)` caller) | grep `LOG100` = none outside itself; `QPNLSRC/SAMMNU.MENU:82-167` | observed-in-code (absence) / inferred (operational use) | Deployment dependency |
| log-programs-c07 | Only in-tree log event: `ORD700` on `DETORD` delete (`'ORD700:Order Line deleted …'`) — already documented as `ord-trigger-ord700-c03`; no other program logs anything | `ORD700.PGM.RPGLE:78-81`; grep `AddLogEntry` = one caller | observed-in-code | Call graph (pointer, not re-scanned) |
| log-programs-c08 | `LOG` srvpgm binding is not in source: `EXPORT(*ALL)` (no binder), **absent from `SAMPLE.BNDDIR`**, `ORD700` has no `bnddir` and no `.ILEPGM` — how `AddLogEntry` reaches `ORD700` is ARCAD build metadata | `QILESRVSRC/LOG.ILESRVPGM:8`; `QBNDSRC/SAMPLE.BNDDIR:8-14`; `ORD700.PGM.RPGLE:4` | observed-in-code | Blind spot (also flagged by Pack B run 4) |
| log-programs-c09 | Reading the log: menu opt 84 `ADSPUSRSPC SAMLOG` — an ARCAD-style command **not in the tree**; no in-tree reader of `SAMLOG` | `QPNLSRC/SAMMNU.MENU:159-162` | inferred | Blind spot |
| log-programs-c10 | `SAMLOG` is a process-shared, unsynchronised append buffer: two jobs deleting lines concurrently read the same `pos` and overwrite each other (no lock, no atomic update) | `LOG300.RPGLE:27-32` | inferred | Concurrency (runtime) |

## Deferred recommendations (prose only)

- c04 / c10: recommend the room treat the user-space log as a **non-functional side effect** to be replaced by structured logging in the target, not as a behaviour to reproduce byte-for-byte. The line format (c03) is the only thing worth preserving if operators grep it.
- c06: `LOG100` is an install step, not application behaviour — recommend `reject` as a slice member and move it to the ops runbook.
- c08: same build-owner question raised in the `ord-trigger-ord700` documentation; not new.
