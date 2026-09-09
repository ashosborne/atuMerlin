# SME_BRIEF — fam-maintain (Phase A, awaiting human bind)

## What was found

`FFAMILLY` service program: `FAM300` (description getter, `ExistArtFam`, `IsArtFamDeleted`, cached chain) and `FAM301` (`SltArtFam` — a keyed-read selection **window** with by-code / by-description toggle and a position-to control line). 13 candidates, all `observed-in-code`.

**There is no family maintenance program.** `FAMILLY` rows have no create / edit / delete path in `ATU_SRC` (c11), and the family's default VAT code `FAVATCD` is never read (c12). The slice id `fam-maintain` is a charter misnomer, kept for stability.

The one rule with a business consequence: **`ExistArtFam` does not exclude soft-deleted families** (c02), unlike every other `Exist*` predicate in the estate — `ART200` will accept a deleted family code on an article.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Slice id | Accept the misnomer, or rename to `fam-modules` at bind. |
| Selector mechanics | `SltArtFam` uses native keyed reads, not dynamic SQL — a different template from `SltCustomer`/`SltProvider`/`SltArticle`. Cards for it cannot be cloned from `cus-modules`. |
| Consumers | Only the ART slices call this srvpgm. Recommend **defer** unless / until `art-interactive` / `art-modules` are bound. |
| `FAVATCD` | Dormant attribute; data-model note for the target, not a behaviour. |

## Recommended bind (recommendation only)

- **accept (if ART is bound):** c01, c02, c05, c06, c07, c08
- **thin / fold:** c03, c04, c09, c10, c13
- **needs-SME:** c02 (intended?), c11 (how are families maintained on the box?)
- **data-model note only:** c12

## Open questions

1. Is a deleted family a valid article family (c02)?
2. Where are families created / edited on the box (c11)? A QM query, DFU, or another library?
3. Rename the slice?

Did not: bind, deepen Phase B, generate tests, or convert.
