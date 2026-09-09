# SME_BRIEF — pro-modules (Phase A, awaiting human bind)

## What was found

`FPROVIDER` service program = `PRO300` (11 getters + `ExistProvider` / `IsProDeleted` over a cached `PROVIDE1` chain) + `PRO301` (`SltProvider` dynamic-SQL selection window). 14 candidates, all `observed-in-code`. Structurally a twin of `cus-modules`; every card there (getter family, exist/deleted, lazy cache, unexported close, selector rules, criteria re-prepare, SQL concatenation, blank-criteria list-all) has a direct counterpart here.

Differences from `cus-modules` worth noting:

- `FPROVIDER.BND` is **versioned** (`SIGNATURE(*GEN)` + `PGMLVL(*PRV)` block, `SLTPROVIDER` added later); every other binder hard-codes `'V1'` (c11).
- F8 in the selector is dead code inherited from the FAM/COU template (c10).
- Only 2 of 14 exports have callers in `ATU_SRC` (c13): `GetProName` (ART201/ART202) and `SltProvider` (PRO250).

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| `srvpgm-fprovider` seed | Folded here (c11/c12), as the room did for `srvpgm-fcustomer` → `cus-modules`. No separate Phase A. |
| `PRO301D` display file | Evidence on `mod:PRO301`, not a surface. |
| Signature versioning | Build metadata (ARCAD). Not behaviour; do not card. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c05, c06, c07, c08, c09
- **thin / fold:** c04, c10, c12, c13, c14
- **defer:** c11 (build metadata)

## Open questions

1. Same as `cus-modules`: is the activation-group-lifetime cache (c03) acceptable in the target, or should getters always read through?
2. Should the unused 12 exports be carried into a target API at all (c13)?
3. `IsProDeleted` returns false for an unknown id (c02) — missing and not-deleted are indistinguishable. Acceptable?

Did not: bind, deepen Phase B, generate tests, or convert.
