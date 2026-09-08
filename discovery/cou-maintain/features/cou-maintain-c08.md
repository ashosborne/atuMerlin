# cou-maintain-c08 — GetCountryIso3 has no caller; closeCOUNTRY is not exported

| | |
| --- | --- |
| Slice | `cou-maintain` (FCOUNTRY half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`; FCOUNTRY half only) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Two dead ends in `COU300`. `GetCountryIso3` is compiled, exported and prototyped but **no member of `ATU_SRC` calls it**; the ISO-3 code is otherwise only touched by the deferred `COU200` edit screen. `closeCOUNTRY` is implemented and published in the copybook but **absent from `FCOUNTRY.BND`**, so no caller can bind to it; the module's `COUNTRY` ODP opened by the first getter (`c07`) can only be closed by the activation group ending.

## Entrypoints

- `GetCountryIso3` — export `ATU_SRC/QSRVSRC/FCOUNTRY.BND:6`; prototype `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:12-13`; body `ATU_SRC/QRPGLESRC/COU300.RPGLE:29-37`
- `closeCOUNTRY` — prototype `CloseCOUNTRY PR` `COUNTRY.RPGLEINC:27`; body `COU300.RPGLE:65-72`; **not** in `FCOUNTRY.BND:4-9`
- Absence evidence: structural grep of `ATU_SRC/**` for `GetCountryIso3` / `CloseCOUNTRY` / `COISO` — matches only in `COU300.RPGLE`, `COUNTRY.RPGLEINC`, `FCOUNTRY.BND`, `COUNTRY.PF:9`, and `COU200.RPG` / `COU200D.DSPF` (deferred half, not deepened)

## Inputs / outputs / observables

- `GetCountryIso3(P_COID 2A value)` → `COISO` 3A, blanks when unknown, via the shared `chainCOUNTRY` cache (`c07`). — `COU300.RPGLE:30-35`
- `closeCOUNTRY()` → `if %open(COUNTRY); close COUNTRY; endif;` — no parameters, no return value. — `:68-70`
- Observable in the estate today: nothing. Neither procedure changes any screen or file the callers use.

## Behaviour as implemented

1. `GetCountryIso3` is a copy of `GetCountryName` returning `COISO` instead of `COUNTR`; it shares the buffer and cache semantics of `c07` (a call for a code already buffered by `GetCountryName` performs no I/O). — `COU300.RPGLE:29-37`
2. `closeCOUNTRY` guards on `%open` and closes the module's `COUNTRY` ODP. It is not called by any procedure inside the module either, so the file, once opened, stays open for the life of the activation group. — `:65-72`
3. `FCOUNTRY.ILESRVPGM` builds with `EXPORT(*SRCFILE)`, so the export list is exactly `FCOUNTRY.BND`: four symbols; `CLOSECOUNTRY` is not among them. A caller that included the copybook and called `CloseCOUNTRY()` would compile and then fail at bind (unresolved import). — `ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:8-9`, `FCOUNTRY.BND:4-9`

## Validation rules found in code

None.

## Edge cases found in code

- **Copybook publishes five prototypes for four exports** — same drift as `vat-module-c10` (`FVAT`); `FFAMILLY` shows the identical shape with `closeFAMILLY`. — `COUNTRY.RPGLEINC:7-27`, `FCOUNTRY.BND:5-8`, compare `ATU_SRC/QRPGLESRC/FAM300.RPGLE:65-72`
- **ISO-3 data has one reader in the whole estate**, the deferred `COU200` edit panel (which also writes it). `COISO` is declared as a literal `3` in `COUNTRY.PF`, not through `SAMREF`, and no display or printer file outside `COU200D` references it. `CUSTOMER` / `PROVIDER` store the 2-character `COID` only (`CUSTOMER.PF:16`, `PROVIDER.PF:17`). — `COUNTRY.PF:9`, `ATU_SRC/QDDSSRC/SAMREF.PF:18-21`
- **Two ODPs on `COUNTRY`, neither closable from outside.** `COU300` opens `COUNTRY` (`USROPN`, getter path); `COU301` opens `COUNTRY` and `COUNTR1` at module level for the selector (`c09`). Nothing exported closes any of them; with `ACTGRP(*CALLER)` their lifetime is the caller's activation group (`c12`). — `COU300.RPGLE:6`, `ATU_SRC/QRPGLESRC/COU301.RPGLE:6-8`
- The converted CUS vertical's dependency surface (`modern/src/shared/fcountry/index.ts`) implements `existCountry`, `getCountryName` and a list; it has no ISO-3 getter and no close — consistent with what the callers use. Pointer only; not changed by this run.

## Dependencies

- `c07` (shared cache and file), `c12` (export list / binding), `COUNTRY.PF:9` (`COISO`)
- Deferred: `cou-maintain-c02` (COU200 ISO-3 edit) — not deepened; cited as the only other reader/writer of `COISO`.

## Assumptions / unknowns

- `needs-SME / room`: carry `GetCountryIso3` into the target as an unused export, or `reject` it (and possibly the `COISO` column) until a consumer exists? The Phase A recommendation was thin/fold; the room accepted it as a separate row.
- Whether any out-of-tree program (QM query, DFU, SQL) reads `COISO` is unknown; the in-tree answer is "COU200 only".

## Evidence

`ATU_SRC/QRPGLESRC/COU300.RPGLE:6,29-37,65-72` · `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-27` · `ATU_SRC/QSRVSRC/FCOUNTRY.BND:4-9` · `ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:8-9` · `ATU_SRC/QDDSSRC/COUNTRY.PF:9` · `ATU_SRC/QDDSSRC/SAMREF.PF:18-21` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:16` · `ATU_SRC/QDDSSRC/PROVIDER.PF:17` · `ATU_SRC/QRPGLESRC/FAM300.RPGLE:65-72` · `ATU_SRC/QRPGLESRC/COU301.RPGLE:6-8`
