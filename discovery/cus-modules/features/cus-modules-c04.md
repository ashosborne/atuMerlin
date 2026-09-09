# cus-modules-c04 — Lazy open and last-key cache in chainCUSTOME1

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`chainCUSTOME1(id)` is the single data-access path behind every `CUS300` export. It opens `CUSTOME1` on first use (nothing exported ever closes it), skips the `CHAIN` when the requested id equals the id already in the record buffer, and otherwise clears the buffer and chains. Consequences: hits are cached for the life of the activation group, misses return blanks/zeros, misses are not cached, and updates made by other programs are invisible while the same id keeps being requested.

## Entrypoints

- Private procedure (no `export`, no prototype in the shared include) — `ATU_SRC/QRPGLESRC/CUS300.RPGLE:10-11` (PR), `:173-186` (body)
- Called by all 11 getters, `ExistCus`, `IsCusDeleted` — `CUS300.RPGLE:23,33,…,156,167`
- File: `FCUSTOME1 if e k disk usropn` — `CUS300.RPGLE:6`; key list `kf` / `K_CUID like(CUID)` — `CUS300.RPGLE:13-16`

## Inputs / outputs / observables

- In: `P_CUID 5 0 value`.
- Out: none directly; the observable is the state of the module-global `FCUST` buffer (`CUID`, `CUSTNM`, … `CUDEL`) and `%found(custome1)`.
- Side effects: `CUSTOME1` open (once), one keyed read per cache miss.

## Behaviour as implemented

1. `if not %open(CUSTOME1); open CUSTOME1; endif;` — `USROPN` file opened on first call, unmonitored. — `CUS300.RPGLE:177-179`
2. `if P_CUID <> CUID;` — the requested id is compared with the **record-buffer field** `CUID`, i.e. the id of the last row successfully read (or `0` after a miss / at start). — `CUS300.RPGLE:180`
3. On mismatch: `K_CUID = P_CUID; clear *all FCUST; chain kf CUSTOME1;` — buffer reset to blanks/zeros, then keyed read. — `CUS300.RPGLE:181-183`
4. Hit: buffer holds the row; the next call with the same id performs no I/O (step 2 is false).
5. Miss: RPG leaves input fields unchanged on a not-found `CHAIN`, so the buffer stays cleared — every getter returns `*blanks` / `0`, `CUDEL = ' '`, `%found(custome1) = '0'`. Buffer `CUID` is now `0`, so requesting the same missing id again re-chains (misses are **not** cached).
6. The file is input-only (`if`), so reads take no record lock and never contend with `CUS200`'s update `CHAIN` on the same LF (`cus-interactive-c03`).

## Validation rules found in code

None. No `%found` / `%error` handling, no `(E)` extender on `open` or `chain`.

## Edge cases found in code

- **Stale data.** Sequence in one activation group: `GetCusName(7)` → another program updates customer 7 → `GetCusName(7)` returns the **old** name. Only a request for a different id refreshes the buffer. No exported invalidation or close (`cus-modules-c05`). — `CUS300.RPGLE:180`
- **Zero id, first call.** `CUID` is `0` before any read; `P_CUID = 0` skips the `CHAIN`, the file may not even be opened yet (the `open` runs before the compare, so it is opened), and the caller gets blanks/zeros — same shape as a miss. `%found` state undefined (see `c02`). — `CUS300.RPGLE:177-184`
- **Open failure** (object or authority missing on `*LIBL`) is unmonitored → RPG runtime exception surfaces in the caller; no message, no fallback. — `CUS300.RPGLE:178`
- **Scope of the cache.** `FCUSTOMER` is `ACTGRP(*CALLER)`; the buffer and the open data path are module static storage, so every program in the same activation group shares one cache and one open `CUSTOME1`. Observed callers (`CUS250`, `ORD100`, `ORD101`) are `dftactgrp(*no)` with no `ACTGRP` keyword — which named group they land in is a compile default (runtime, not confirmed). — `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8`, `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:4`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:7`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:5`
- `clear *all FCUST` clears the whole record format including `CUID`; if a stored row had `CUID = 0` (not produced by `CUSSEQ`, which starts at 1551) it could never be re-read after being cached once. Data edge, theoretical. — `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-6`

## Dependencies

- `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` (`UNIQUE` key `CUID`, `PFILE(CUSTOMER)`)
- `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-29` (record format `FCUST`)

## Assumptions / unknowns

- **needs-SME (carried from bind):** getters on a missing id return blanks/zeros silently — preserve as the target contract, or surface "not found"? Documented as-is; not decided here.
- Whether any caller relies on the cache for performance (e.g. `ORD100` calling `GetCusName` repeatedly in a loop) — not observable from the three call sites found.

## Evidence

`ATU_SRC/QRPGLESRC/CUS300.RPGLE:6,10-16,173-186` · `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-29` · `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-6`
