# SME_BRIEF — art-interactive (Phase A, awaiting human bind)

## What was found

Four article-side 5250 programs. `ART200` is the richest maintain screen in the estate (create with max+1 id, update, soft delete, free-text info in an SQL table, jump to providers). `ART201`/`ART202` maintain the article↔provider link (`ARTIPROV`) from either side. `ART250` is an inquiry with derived values and a LIKE-search fallback. 16 candidates, all `observed-in-code`.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| `ART202` (articles of a provider) | Only called from `PRO200`/`PRO250`. Either keep here (link maintenance pairs with `ART201`) or move to `pro-interactive`. Recommend **keep here** so the ARTIPROV link has one owner. |
| `GetArtInfo` resolution | `ART250` calls it; module `ART302` is not in `FARTICLE`'s module list nor export list (`QILESRVSRC/FARTICLE.ILESRVPGM:8`, `QSRVSRC/FARTICLE.BND`). Cross-reference `art-modules-c06`. Needs SME / build owner. |
| Where are `ARTIPROV` links created? | No create path found in ART* or (skimmed) PRO* programs this pass. Open question, not a candidate. |
| Slice size | 4 programs ~1200 lines — acceptable mid-size. If the SME prefers thinner seams: split `ART250` (inquiry) from `ART200/201/202` (maintain). |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c03, c04, c05, c07, c08, c09, c10, c11, c12, c14
- **accept as thin seam-edge cards or fold:** c06, c13, c16 (call-graph edges — one card is enough)
- **needs-SME:** c15 (`%eof(article1)` quirk — preserve vs fix is not a Discovery decision)

## Open questions

1. Are soft-deleted articles (`ARDEL='X'`) expected to remain selectable in `SltArticle` and visible in the ART200 list? Code does not filter them (`ART301.SQLRPGLE:104-115`, `ART200.PGM.SQLRPGLE:111-117`).
2. Is the `ARTIINF` free text expected to survive a soft delete of the article? Nothing deletes it.
3. Who creates `ARTIPROV` rows (link article to provider)? Not found in this seed.

Did not: bind, deepen Phase B, generate tests, or convert.
