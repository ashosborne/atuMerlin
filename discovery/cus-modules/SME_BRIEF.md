# SME_BRIEF — cus-modules (Phase A, awaiting human bind)

## What was found

`FCUSTOMER` is two `nomain` modules: `CUS300` (11 getters + `ExistCus` + `IsCusDeleted`, all over one cached `CUSTOME1` chain) and `CUS301` (`SltCustomer` selection window with dynamic SQL). 11 candidates: 10 `observed-in-code`, 1 `inferred` (dormant scaffold).

Callers observed in `ATU_SRC`: `CUS250` (SltCustomer, GetCountryName), `ORD100` (SltCustomer, GetCusName), `ORD101` (GetCusName), `ORD500` binds via `bnddir('SAMPLE')` but chains `CUSTOME1` directly. `CUS200` does not use FCUSTOMER at all.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| `cus-modules` vs `srvpgm-fcustomer` (queue #22) | Same two modules. Recommend **merging** at bind: keep `cus-modules` as the slice, treat `FCUSTOMER.ILESRVPGM` + `.BND` as its deps. Otherwise two slices produce duplicate cards. |
| `CUS301D.DSPF` ownership | Belongs here (only used by CUS301). |
| `CloseCUSTOME1` not exported (c05) | Boundary fact; card or note — SME call. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c04, c06, c07, c08, c11
- **accept as note on c06 (or thin card):** c09 (injection surface), c05 (missing export)
- **reject:** c10 (dormant scaffold, not behaviour)

## Open questions

1. Getter semantics on unknown CUID return blanks/zeros silently (c04). Is that relied upon by callers (e.g. `ORD100` shows blank customer name) or a latent bug?
2. Should the modern seam keep `SltCustomer`'s "list all when criteria blank" default (c11)?
3. Is `SltCustomer` ever invoked with a non-zero default that callers expect back on cancel? (`ORD100` passes 0 and treats 0 as abort — `ORD100.PGM.RPGLE:320-324`.)

Did not: bind, deepen Phase B, generate tests, or convert.
