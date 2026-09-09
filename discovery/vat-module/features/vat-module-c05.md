# vat-module-c05 — Lazy open and last-key cache; closeVATDEF not exported

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`VATDEF` is declared input-only, keyed, `USROPN` in the `NOMAIN` module and is opened by the private procedure `chainVATDEF` on the first call in the activation group. `chainVATDEF` reads only when the requested code differs from the code currently in the record buffer (`P_VATCODE <> VATCODE`); a repeat request for the same code does no I/O at all. Hits are therefore cached until a different code is asked for; misses clear the buffer (`c02`) and are not cached — except a **blank** request code, which matches the initial/cleared buffer and is never read. `closeVATDEF` exists in the module but is neither exported nor called, so the file stays open until the caller's activation group ends. The same pattern is used by the other `F*` service programs (cus-modules `c01`/`c05` documented it for `FCUSTOMER`).

## Entrypoints

- File spec `FVATDEF if e k disk usropn` — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:6`
- `chainVATDEF` (module-private; prototype `:10-11`, body `:61-74`), called by all four exports (`:23,32,45,56`)
- `closeVATDEF` (module-private, unreferenced) — `VAT300.RPGLE:76-83`; a `CloseVATDEF` prototype is published in the copybook — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:26-28` — but the symbol is **not** in `FVAT.BND` — `ATU_SRC/QSRVSRC/FVAT.BND:4-9`

## Inputs / outputs / observables

- In: `P_VATCODE` `1A` by value; module state: `%open(VATDEF)`, buffer field `VATCODE`, key field `K_VATCODE` (`LIKE(VATCODE)`, key list `kf`). — `VAT300.RPGLE:13-16,63`
- Out: record buffer `FVAT` (`VATCODE`, `VATRATE`, `VATDESC`, `VATCREA`, `VATMOD`, `VATMODID`, `VATDEL`) either loaded from the row or cleared. — `ATU_SRC/QDDSSRC/VATDEF.PF:5-15`
- Observable: one `VATDEF` open data path per activation group that has called `FVAT`, held until the group ends; one physical read per *change* of code, none for repeats.

## Behaviour as implemented

1. `if not %open(VATDEF); open VATDEF; endif;` — lazy open, unmonitored (no `(e)`, no `%error`). — `VAT300.RPGLE:65-67`
2. `if P_VATCODE <> VATCODE;` — compare the request with the code in the buffer (initially `*blank`; after a miss `*blank`; after a hit the found row's code). — `VAT300.RPGLE:68`
3. `K_VATCODE = P_VATCODE; clear *all FVAT; chain kf VATDEF;` — set key, clear buffer, read (fixed-form `klist`/`chain`). Unmonitored. — `VAT300.RPGLE:15-16,69-71`
4. `closeVATDEF`: `if %open(VATDEF); close VATDEF; endif;` — never reached. — `VAT300.RPGLE:76-83`

## Validation rules found in code

None. No error handling on `open` or `chain`: a missing `VATDEF` in the library list or an authority failure surfaces as an unhandled exception at the first `FVAT` call inside the caller (`ORD100` line prepare, `ART250` detail).

## Edge cases found in code

- **Blank request code is never read.** Buffer `VATCODE` starts blank and is blank after every miss, so `ClcVAT(' ' : net)` / `GetVATRate(' ')` return the cleared values without touching the file — even if `VATDEF` held a row keyed `' '`. Reached whenever `ARVATCD` is blank or `GetArtVatCode` gets an unknown article (`c02`, `c08`). — `VAT300.RPGLE:68`
- **Hit after miss, miss after hit.** Hit `'A'` → miss `'Z'` clears the buffer → a following `'A'` re-reads (correct). Hit `'A'` → `'A'` again → no read (`c06` staleness).
- **Non-blank misses are not cached**: the same unknown code re-chains every call because the buffer code is blank, never equal to it. — `VAT300.RPGLE:68,70`
- **Close is unreachable.** Not exported (4 symbols only), not called by any procedure in the module; the copybook prototype `CloseVATDEF` would fail at bind time for any caller that used it. None does (structural grep). Closing would not reset the cache anyway — the buffer is untouched by `close`. — `FVAT.BND:5-8`, `VAT.RPGLEINC:28`, `VAT300.RPGLE:76-83`
- **Activation group scope.** `FVAT` is created `ACTGRP(*CALLER)` (`c09`), so the open file and the buffer belong to whichever activation group the caller runs in. `ORD100`, `ORD101`, `ART250` and `ART200` are all `DFTACTGRP(*NO)` with no `ACTGRP` keyword; the effective group is the compile-time default, not visible in source. — `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:8`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:7`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:5`, `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:4`

## Dependencies

- `VATDEF.PF` (keyed on `VATCODE`, single key field). — `VATDEF.PF:16`
- `c09` (binding / activation group), `c02`, `c06`.

## Assumptions / unknowns

- Which named activation group the callers use (default `QILE` for `DFTACTGRP(*NO)` without `ACTGRP`, unless the build overrides it) — compile-time; if shared, one `FVAT` instance serves `ORD100`, `ORD101` and `ART250` for the life of the job.
- `%found` after a cached call reflects the previous I/O (`c04`).

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:4,6,10-16,23,32,45,56,61-83` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:26-28` · `ATU_SRC/QSRVSRC/FVAT.BND:4-9` · `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:8-9` · `ATU_SRC/QDDSSRC/VATDEF.PF:5-16` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:7` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:5` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:4` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:5`
