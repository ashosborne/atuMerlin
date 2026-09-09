# par-maintain-c09 — GetPARM1..5 getter family with two-part cached chain

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`FPARAMETER` (`PAR300`, `nomain`) exports five typed getters — `GetPARM1` 10A, `GetPARM2` 100A, `GetPARM3` 2A, `GetPARM4` 1P 0, `GetPARM5` 3P 0 — each taking `(PACODE 10A value, PASUBCODE 10A value)` and returning one column of the same `PARAMETER` row through one private `chainPARAMETER`. The chain opens the `usropn` input file on first use (never closed — `closePARAMETER` has no caller) and tests the requested key against the **record buffer's own** `PACODE`/`PASUBCODE`: a hit costs no I/O and is served from the buffer **until a different key is asked for** — a value changed or deleted in `PAR200` by another job is stale for the life of the activation group; a miss clears the buffer first (blanks / zeros returned, `%found` not exposed) and is never cached; a **blank key never reads** (buffer key blank at start and after every miss), so the blank/blank row `PAR200` can create is unreachable. Same idiom as `FCOUNTRY` (`cou-maintain-c07`) and `FCUSTOMER`. No error handling: an `open` or `chain` failure propagates to the caller. `ACTGRP(*CALLER)` puts the one open data path and the one-row cache in the caller's activation group — for all four in-tree consumers that is `QILE`, so one interactive job shares one cache.

## Entrypoints

- Exports `GetPARM1`–`GetPARM5` — `ATU_SRC/QRPGLESRC/PAR300.RPGLE:22-80`; prototypes — `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:7-33`
- Private `chainPARAMETER(P_PACODE, P_PASUBCODE)` — `PAR300.RPGLE:10-12,82-98`; `closePARAMETER` — `PAR300.RPGLE:100-107` (prototype `ClosePARAMETER` — `PARAMETER.RPGLEINC:37`)
- Callers: `ORD500.PGM.RPGLE:58`, `PRO202.SQLRPGLE:151`, `PRO203.PGM.SQLRPGLE:32`, `PAR201.CLLE:7` — all `GetParm2('PATH':' ')` (`c11`)

## Inputs / outputs / observables

- In: `P_PACODE`, `P_PASUBCODE` — fixed 10A by value (trailing blanks insignificant, **case-sensitive**). — `PAR300.RPGLE:23-25`
- Out: the requested column of the row `(PACODE, PASUBCODE)`; on a miss `PARM1`/`PARM2`/`PARM3` blank, `PARM4`/`PARM5` zero. No return code, no `%found`, no message. — `PAR300.RPGLE:30,42,54,66,78,94`
- Side effects: `PARAMETER` opened on the first call in the activation group (`if not %open → open`), kept open; one record buffer held. — `PAR300.RPGLE:6,87-89`

## Behaviour as implemented

1. Every getter calls `chainPARAMETER(P_PACODE:P_PASUBCODE)` then returns its field from the `FPARAM` buffer. — `PAR300.RPGLE:27-30` (and 39–42, 51–54, 63–66, 75–78)
2. `chainPARAMETER`: `if not %open(PARAMETER) → open PARAMETER` (file is `if e k disk usropn`). — `:87-89,6`
3. `if P_PACODE <> PACODE or P_PASUBCODE <> PASUBCODE` — compares the **request** to the **buffer's key fields** (not to a saved "last key"): equal → skip I/O (cache hit); different → `K_PACODE`/`K_PASUBCODE` set, `clear *all FPARAM`, `chain kf PARAMETER`. — `:90-96,14-19`
4. Hit after a hit: the row read once stays until the request changes. Miss: the cleared buffer stays (blank key), so the next request for any non-blank key differs and re-reads; a following request for a **blank** key equals the cleared key → no read → blanks returned even if a blank/blank row exists. — `:90-96`
5. `closePARAMETER`: `if %open → close`; exported (`c10`), prototyped, **called by nobody** (grep). The data path lives until the activation group ends. — `:100-107`

## Validation rules found in code

None. No key validation, no existence signal, no `(e)` on `open`/`chain`, no `monitor`.

## Edge cases found in code

- **Stale hit.** `ORD500` reads `PATH` once per job (`QILE`); `PAR200` changes it; the same job's next print still uses the old value (documented on `ord-print-ord500-c02`). Only a different key request, `RCLACTGRP`, or sign-off refreshes — and nothing in the tree ever asks for a different key (`c11`), so in practice the first `PATH` read is the value for the job.
- **Deleted row.** Same as stale hit: the buffer keeps the deleted row's values.
- **Blank key.** `GetPARMn(' ':' ')` never performs I/O → always blanks/zero; `PAR200` can create such a row (`c02`) but no getter can read it.
- **Case.** `GetParm2('path':' ')` misses (`<>` on 10A). `PAR200` upper-cases keys on entry (`c02`), so in-tree data is upper-case unless written by another tool.
- **Open failure** (`PARAMETER` not on `*LIBL`, no authority) → RPG exception inside the service program → propagates to the caller as an unmonitored function check (inference); `ORD500` has no `monitor`, `PAR201` no `MONMSG`.
- **Cache scope.** `ACTGRP(*CALLER)`: `PAR201` and `PRO200` (`PRO202` bound in) are explicitly `QILE`; `ORD500` and `PRO203` are `dftactgrp(*no)` with no `ACTGRP` → `*STGMDL` → `QILE` by default (inference; build owner). Hence one buffer and one ODP per interactive job across all four consumers; a batch job has its own. — `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9`, `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9`, `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:4`, `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:4`
- **Typed returns.** `GetPARM4`/`GetPARM5` return packed `1P 0`/`3P 0` from zoned `1 0`/`3 0` file fields — conversion on return; no caller (`c11`).
- **Read-through of locks.** The `if` open reads rows locked by a `PAR200` session (`c04`) — no wait.

## Dependencies

- `PARAMETER.PF` `UNIQUE (PACODE, PASUBCODE)` — `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`
- `FPARAMETER.ILESRVPGM` `ACTGRP(*CALLER) EXPORT(*ALL)` — `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` (`c10`)
- Binding into callers: `PAR201.ILEPGM` / `PRO200.ILEPGM` `BNDSRVPGM(FPARAMETER)`; `SAMPLE.BNDDIR` entry `*LIBL/FPARAMETER`; `ORD500` / `PRO203` bind by build metadata only (`srvpgm-supporting-c05`). — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:13`

## Assumptions / unknowns

- Default activation group for `dftactgrp(*no)` without `ACTGRP`, exception propagation out of a `nomain` module, and ODP lifetime are platform rules — runtime-confirmable; build owner to confirm the compile parameters.
- needs-SME (target): hit-cache with no invalidation — acceptable for a single setting read once per job, or read-through / configuration (`c11`)? Same question as `cou-maintain-c07`; the converted CUS/ORD dependency surfaces query per call.

## Evidence

`ATU_SRC/QRPGLESRC/PAR300.RPGLE:4-19,22-107` · `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:7-37` · `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14` · `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9` · `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:4,58` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:4,32` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:151` · `ATU_SRC/QCLSRC/PAR201.CLLE:7` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:13`
