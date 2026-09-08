# SME_BRIEF — art-modules (Phase A, awaiting human bind)

## What was found

`FARTICLE` body: `ART300` (7 getters + exist/deleted over a cached `ARTICLE1` chain), `ART301` (`SltArticle` dynamic-SQL selection window with family prompt), `ART302` (`GetArtInfo` cached read of `ARTIINF`). 11 candidates, all `observed-in-code`.

The one finding that needs a human before anything else: **`ART302` is not in the `FARTICLE` module list or export list in source**, yet `ART250` calls `GetArtInfo` (`art-modules-c06`). Either the source tree lags the ARCAD build definition, or `ART250` does not link on the box. Discovery cannot resolve this from source alone.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| `art-modules` vs `srvpgm-farticle` (queue #23) | Same modules. Recommend merge at bind; treat `FARTICLE.ILESRVPGM` + `.BND` as deps of this slice. |
| `GetArtInfo` ownership | Keep here (module `ART302`), even though the binding is unresolved. |
| Soft-deleted articles selectable (c09) | SME decides whether that is behaviour to preserve. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c04, c05, c07
- **accept as note/thin card:** c08 (injection surface), c09, c10
- **needs-SME (build owner):** c06
- **fold into c04:** c11

## Open questions

1. Confirm the real `FARTICLE` build: does it include `ART302`? If not, how does `ART250` resolve `GetArtInfo`?
2. Is the `GetArtInfo` cache (never invalidated within the activation group) observable to users who edit info text in `ART200` and then view it in `ART250` in the same job?
3. Should `SltArticle` exclude `ARDEL='X'` rows?

Did not: bind, deepen Phase B, generate tests, or convert.
