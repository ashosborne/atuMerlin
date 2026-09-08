# vat-module-c04 — ExistVATRate respects the delete flag but has no caller

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ExistVATRate(code)` returns `%found(VATDEF) and VATDEL <> 'X'` — a code "exists" only if a row is present **and** it is not soft-deleted. It is exported but **no program in `ATU_SRC` calls it**. As a consequence the delete flag is dead in practice: `ClcVAT`, `GetVATRate` and `GetVATDesc` ignore `VATDEL`, so a soft-deleted rate keeps being applied to order lines exactly like a live one. The predicate is the only piece of `FVAT` that would have caught the unknown-code case (`c02`), and the only reader of `VATDEL`.

## Entrypoints

- `FVAT` export `EXISTVATRATE` — `ATU_SRC/QSRVSRC/FVAT.BND:6`
- `ExistVATRate` — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:52-59`; prototype `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:17-18`
- Callers: none (structural grep of `ATU_SRC/**` for `ExistVATRate`)

## Inputs / outputs / observables

- In: `P_VATCODE` `1A` by value. — `VAT300.RPGLE:54`
- Out: indicator (`n`): `*on` when the last `VATDEF` read found a row whose `VATDEL` is not `'X'`. — `VAT300.RPGLE:53,57`
- Observable: nothing in the running estate — no caller.

## Behaviour as implemented

1. `chainVATDEF(P_VATCODE)` — cache-aware read (`c05`). — `VAT300.RPGLE:56`
2. `return %found(VATDEF) and VATDEL <> 'X';` — `VAT300.RPGLE:57`

## Validation rules found in code

This procedure *is* the validation rule; it is not applied anywhere. `ART200` (the only VAT-code entry point) validates description and family only. — `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:280-291`

## Edge cases found in code

- **Cached path and `%found`.** When the requested code equals the buffered code no `chain` runs, and `%found(VATDEF)` reports the result of the *previous* I/O on the file. After a hit that is `*on` (correct). Before any I/O in the activation group (first call with a blank code, `c05`) `%found` is `*off`, so `ExistVATRate(' ')` is `*off` even if a blank-key row existed. — `VAT300.RPGLE:57,68`
- **Delete flag semantics.** `VATDEL` is `REFFLD(DLCODE)` (`SAMREF DLCODE 1`); only the literal `'X'` counts as deleted. No writer of `VATDEL` exists in `ATU_SRC` (`c07`), so on this tree the flag can only be set outside the application. — `ATU_SRC/QDDSSRC/VATDEF.PF:15`, `ATU_SRC/QDDSSRC/SAMREF.PF:26`
- **Inconsistency with the arithmetic path.** `ClcVAT`/`GetVATRate` apply the rate of an `'X'` row; `ExistVATRate` would deny it. Because nothing calls the predicate, soft-deleting a VAT code has no effect on totals. — `VAT300.RPGLE:45-47` vs `:57`
- **Sibling predicates (pointers, not deepened):** `ExistCus`, `ExistProvider` also exclude `'X'` rows; `ExistArtFam` ignores `FADEL` (fam-maintain `c02`). `ExistCus` likewise has no caller (cus-modules). — `inventory/atu-merlin/APP_MANIFEST.yaml` (`fam-maintain` note)

## Dependencies

- `VATDEF.PF` `VATDEL`; `SAMREF.PF` `DLCODE`. — `VATDEF.PF:15`, `SAMREF.PF:26`
- `c05` (read / cache), `c02` (miss path this predicate would detect), `c07` (no writer of the flag).

## Assumptions / unknowns

- Whether any out-of-tree caller (query, other library) uses `ExistVATRate` is unknown; within `ATU_SRC` it is dead.
- For the SME: is a soft-deleted VAT code meant to stop being applied? As-is it is not.

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:45-47,52-59,61-74` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:17-18` · `ATU_SRC/QSRVSRC/FVAT.BND:6` · `ATU_SRC/QDDSSRC/VATDEF.PF:15` · `ATU_SRC/QDDSSRC/SAMREF.PF:26` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:280-291`
