# vat-module-c10 — Copybook / module parameter-type drift on CLCVat

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B — source-hygiene fact) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ClcVAT` is declared differently from the other three exports: its code parameter is `1` with **no data-type letter** and its return / net parameter `9 2` with no `P`, in **both** the copybook prototype and the module's procedure interface, whereas `GetVATRate`, `GetVATDesc` and `ExistVATRate` write `1A` and `4P 2`. RPG resolves an untyped length-only definition to character and an untyped length-with-decimals to packed, so every declaration is `1A` / `9P 2` in effect, the prototype and interface match, and the module compiles. The drift is cosmetic and has no runtime effect. **Correction to the Phase A summary** ("prototype declares `1` (no A), module `1A`"): the module's `ClcVAT` interface also omits the `A` (`VAT300.RPGLE:40`); the inconsistency is between `ClcVAT` and the other procedures, not between copybook and module.

## Entrypoints

- Copybook prototype `D CLCVat PR 9 2 / D VATCODE 1 value / D NetValue 9 2 value` — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:22-24`
- Module interface `D ClcVAT PI 9 2 / D P_VATCODE 1 value / d Net 9 2 value` — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:39-41`
- The copybook is `/COPY`'d by the module itself (so the compiler checks PR against PI) and by the three callers. — `VAT300.RPGLE:8`, `ORD100.PGM.RPGLE:20`, `ORD101.PGM.RPGLE:17`, `ART250.PGM.SQLRPGLE:15`

## Inputs / outputs / observables

- Compile-time only. Effective types: code `1A` by value; net `9P 2` by value; return `9P 2`. — derived from `VAT.RPGLEINC:22-24`, `VAT300.RPGLE:39-41`
- Observable: none at run time.

## Behaviour as implemented

1. `GetVATRate PR 4P 2 / VATCODE 1A value` — typed. — `VAT.RPGLEINC:7-8`; PI `VAT300.RPGLE:20-21`
2. `GetVATDesc PR 20A / VATCODE 1A value` — typed. — `VAT.RPGLEINC:12-13`; PI `:29-30`
3. `ExistVATRate PR n / VATCODE 1A value` — typed. — `VAT.RPGLEINC:17-18`; PI `:53-54`
4. `CLCVat PR 9 2 / VATCODE 1 value / NetValue 9 2 value` — untyped; PI `ClcVAT 9 2 / P_VATCODE 1 value / Net 9 2 value` — untyped, but identical in length/decimals. — `VAT.RPGLEINC:22-24`, `VAT300.RPGLE:39-41`
5. Local `d tot s 11 4` — also untyped (packed). — `VAT300.RPGLE:43`

## Validation rules found in code

The compiler's PR/PI match is the only check; it passes because lengths, decimals and passing convention agree.

## Edge cases found in code

- **Name / case differences are irrelevant**: `CLCVat` (copybook) vs `ClcVAT` (module) vs `CLCVAT` (binder) — RPG procedure names are case-insensitive and the export symbol is uppercase. Parameter names (`VATCODE`/`NetValue` vs `P_VATCODE`/`Net`) are local to each declaration. — `VAT.RPGLEINC:22`, `VAT300.RPGLE:38-39`, `ATU_SRC/QSRVSRC/FVAT.BND:5`
- **Copybook parameter named `VATCODE`** collides in name with the `VATDEF` record field `VATCODE` inside `VAT300`; prototype parameter names do not define storage, so there is no conflict. — `VAT.RPGLEINC:8,13,18,23`, `VAT300.RPGLE:68`
- **Callers pass narrower/wider operands** (`ARSALEPR 7P 2` in `ART250`, `ODTOT 9P 2` in `ORD100`/`ORD101`) — by-value conversion to `9P 2`, no drift issue. — `ART250.PGM.SQLRPGLE:154`, `ORD100.PGM.RPGLE:267`
- **Fifth prototype `CloseVATDEF`** has no exported implementation (`c05`, `c09`) — a different kind of copybook drift, recorded there. — `VAT.RPGLEINC:28`

## Dependencies

- `c01` (the procedure whose declaration drifts), `c09` (binder).

## Assumptions / unknowns

- None. Purely a readability fact for whoever writes the target signature: the contract is `ClcVAT(code: char(1), net: decimal(9,2)) → decimal(9,2)`.

## Evidence

`ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-28` · `ATU_SRC/QRPGLESRC/VAT300.RPGLE:8,19-21,28-30,38-43,52-54,68` · `ATU_SRC/QSRVSRC/FVAT.BND:5` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:20,267` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:17` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:15,154`
