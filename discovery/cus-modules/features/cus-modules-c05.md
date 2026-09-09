# cus-modules-c05 — CloseCUSTOME1 prototyped but not exported

| | |
| --- | --- |
| Slice | `cus-modules` (`srvpgm-fcustomer` folded in at bind) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`closeCUSTOME1` exists in `CUS300` and has a prototype in the shared include, but the procedure is declared without `export` and the binder source has no `CLOSECUSTOME1` symbol. No caller can close `CUSTOME1` or reset the getter cache; the file stays open until the activation group ends. A program that compiled a call through the include would fail at bind time with an unresolved import.

## Entrypoints

- Procedure `p closeCUSTOME1 b` (no `export`) — `ATU_SRC/QRPGLESRC/CUS300.RPGLE:188-195`
- Prototype `CloseCUSTOME1 PR` — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:82-84`
- Absent from export list — `ATU_SRC/QSRVSRC/FCUSTOMER.BND:4-20` (15 symbols; compare the `B export` P-specs at `CUS300.RPGLE:19,29,…,152,163`)

## Inputs / outputs / observables

- No parameters. Would close `CUSTOME1` if open. Never reachable from outside the module.

## Behaviour as implemented

1. Body: `if %open(CUSTOME1); close CUSTOME1; endif;` — `CUS300.RPGLE:191-193`
2. Nothing inside `CUS300` calls it either (grep: definition only), so it is dead code in the shipped service program.
3. `EXPORT(*SRCFILE)` on the service program makes the binder source authoritative; the missing `export` keyword on the P-spec means even `EXPORT(*ALL)` would not export it. — `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9`, `CUS300.RPGLE:188`
4. Effective lifetime of the open `CUSTOME1` and of the cached record (`c04`): the caller's activation group (`ACTGRP(*CALLER)`), i.e. until `RCLACTGRP`/job end for a named or default ILE group.

## Validation rules found in code

n/a

## Edge cases found in code

- Any future program that `/COPY`s `CUSTOMER.RPGLEINC` and calls `CloseCUSTOME1` compiles clean and fails at `CRTPGM` (unresolved import) — the include advertises an API the service program does not provide. No `ATU_SRC` program does this today.
- Closing the file would **not** reset the cache even if it were exported: `chainCUSTOME1` compares against buffer `CUID`, which `close` does not clear; the next call for the same id would return the buffered row without reopening. — `CUS300.RPGLE:180-184`
- `chainCUSTOME1` is correctly private (no include prototype); the asymmetry is only on `closeCUSTOME1`.

## Dependencies

- `ATU_SRC/QSRVSRC/FCUSTOMER.BND`, `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM`, `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC`

## Assumptions / unknowns

- **needs-SME (carried from bind):** intentional (file lifetime = activation group, close never wanted) or an oversight when the binder source was generated? Affects only whether the target seam needs an explicit "release" operation.

## Evidence

`ATU_SRC/QRPGLESRC/CUS300.RPGLE:19,152,163,180-195` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:82-84` · `ATU_SRC/QSRVSRC/FCUSTOMER.BND:4-20` · `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9`
