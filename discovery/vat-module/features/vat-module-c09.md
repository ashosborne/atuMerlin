# vat-module-c09 — Export surface and binding

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`FVAT` is a single-module service program (`MODULE(VAT300)`, `NOMAIN`) created `ACTGRP(*CALLER)` with its exports taken from binder source `FVAT.BND`: four symbols — `CLCVAT`, `EXISTVATRATE`, `GETVATDESC`, `GETVATRATE` — under one hand-written signature `'V1'` with no previous-level block. It is listed in the `SAMPLE` binding directory, which every caller names on its H-spec / `ctl-opt`, so callers bind by symbol at compile time and check `'V1'` at activation. `closeVATDEF` is compiled into the module but not exported; the copybook nevertheless advertises `CloseVATDEF`.

## Entrypoints

- Binder source — `ATU_SRC/QSRVSRC/FVAT.BND:4-9`
- Create command (ARCAD-generated) — `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:8-9`
- Binding directory entry `(*LIBL/FVAT *SRVPGM)` — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`
- Copybook of prototypes — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-28`
- Callers naming `BNDDIR('SAMPLE')`: `ORD100.PGM.RPGLE:7`, `ORD101.PGM.RPGLE:5`, `ART250.PGM.SQLRPGLE:4` (and `ART200.PGM.SQLRPGLE:5`, which does not call `FVAT`)

## Inputs / outputs / observables

- Build inputs: module `VAT300` (`h nomain`), binder source member `*SRVPGM` in `*LIBL/QSRVSRC` (= `FVAT.BND`). — `VAT300.RPGLE:4`, `FVAT.ILESRVPGM:8-9`
- Exported symbols (uppercase, alphabetical): `CLCVAT`, `EXISTVATRATE`, `GETVATDESC`, `GETVATRATE`. — `FVAT.BND:5-8`
- Observable: procedures `ClcVAT`, `ExistVATRate`, `GetVATDesc`, `GetVATRate` resolve for any program compiled with `BNDDIR('SAMPLE')`; `CloseVATDEF` does not.

## Behaviour as implemented

1. `STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('V1')` … `ENDPGMEXP` — one export block, explicit signature, no `PGMLVL(*PRV)` block. — `FVAT.BND:4,9`
2. `CRTSRVPGM SRVPGM(&O/&N) MODULE(VAT300) ACTGRP(*CALLER) EXPORT(*SRCFILE) SRCFILE(*LIBL/QSRVSRC) SRCMBR(*SRVPGM)` — the service program runs in the **caller's** activation group; static storage (file open, buffer cache, `c05`) is therefore per caller activation group. — `FVAT.ILESRVPGM:8-9`
3. `ADDBNDDIRE BNDDIR(&O/&N) OBJ(… (*LIBL/FVAT *SRVPGM) (*LIBL/FCOUNTRY *SRVPGM))` — `FVAT` is the tenth of eleven entries; `LOG` is not listed (ord-trigger-ord700 finding, pointer). — `SAMPLE.BNDDIR:9-14`
4. Module procedures marked `export`: `GetVATRate`, `GetVATDesc`, `ClcVAT`, `ExistVATRate`; `chainVATDEF` and `closeVATDEF` are not. — `VAT300.RPGLE:19,28,38,52,61,76`

## Validation rules found in code

Signature check only (`'V1'`). Because the signature is a literal rather than `*GEN`, adding, removing or re-ordering exports without also changing `'V1'` would leave existing callers binding successfully against a changed export list — the binder does not protect against that here. Contrast `FPROVIDER.BND`, the only versioned binder in the tree (`SIGNATURE(*GEN)`, `LVLCHK(*YES)`, `*PRV` block; pro-modules pointer). — `FVAT.BND:4`, `ATU_SRC/QSRVSRC/FPROVIDER.BND:6`

## Edge cases found in code

- **Copybook / binder drift.** `VAT.RPGLEINC` declares five prototypes; the binder exports four. A caller that referenced `CloseVATDEF` would fail at `CRTPGM` with an unresolved import. No caller does. — `VAT.RPGLEINC:28`, `FVAT.BND:5-8`, `VAT300.RPGLE:76`
- **`EXPORT(*SRCFILE)` with `SRCMBR(*SRVPGM)`** — the binder member must be named `FVAT`; the tree keeps it as `QSRVSRC/FVAT.BND`. — `FVAT.ILESRVPGM:9`
- **No `BNDDIR`/`ACTGRP` on the module** — `VAT300` has only `h nomain`; binding is entirely the caller's choice via `SAMPLE`. — `VAT300.RPGLE:4`
- **Generated wrapper.** `FVAT.ILESRVPGM` is ARCAD-generated (2022-05-17); `iproj.json` declares the build (Pack A finding, pointer). — `FVAT.ILESRVPGM:4-6`
- **Callers' activation group is not in source** (`DFTACTGRP(*NO)` without `ACTGRP`, `c05`).

## Dependencies

- `VAT300` module (`c01`–`c06`, `c10`).
- `SAMPLE.BNDDIR` (surface `bnddir:SAMPLE`, `srvpgm-supporting` seed — cited only). — `SAMPLE.BNDDIR:8-14`

## Assumptions / unknowns

- Build: whether `*LIBL` resolves `FVAT` and `VATDEF` from the same library at run time is a deployment fact, not in source.
- For the SME/build owner: is `'V1'` ever bumped, and are all callers recompiled when `FVAT` changes?

## Evidence

`ATU_SRC/QSRVSRC/FVAT.BND:4-9` · `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:4-9` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-28` · `ATU_SRC/QRPGLESRC/VAT300.RPGLE:4,19,28,38,52,61,76` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:7` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:5` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:4` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:5` · `ATU_SRC/QSRVSRC/FPROVIDER.BND:6`
