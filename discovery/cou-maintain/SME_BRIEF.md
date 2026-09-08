# SME_BRIEF — cou-maintain (Phase A, awaiting human bind)

## What was found

Two things under one seed: `COU200`, a 138-line **OPM RPG III** "Work with Countries" (list everything, edit name / ISO-3 with no validation, no create / delete), and the `FCOUNTRY` service program (`COU300` getters + `ExistCountry`; `COU301` `SltCountry` keyed-read selection window). 13 candidates, all `observed-in-code`.

`FCOUNTRY` is the more important half: it is called by the **already-documented CUS slices** (`cus-interactive-c04`/`c05` depend on `ExistCountry`, `SltCountry`, `GetCountryName`) and by the PRO screens. `COU200` is a language outlier with no consumer.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Split? | Consider binding `FCOUNTRY` (c07–c12) separately from `COU200` (c01–c06, c13) — the srvpgm is a dependency of the CUS vertical already converted; the OPM screen is not. |
| `COU200` target | Retire-and-replace with a thin CRUD screen vs faithful convert. The program has no rules worth preserving beyond "name and ISO editable, code not". |
| Window template | `SltCountry` and `SltArtFam` are the same template with one divergence (c10). Card separately. |
| No delete flag | `COUNTRY.PF` has no `DLCODE`; `ExistCountry` therefore means "row exists". Data-model note. |

## Recommended bind (recommendation only)

- **accept (FCOUNTRY half — feeds the converted CUS vertical):** c07, c09, c10, c11
- **accept (COU200 half, if kept):** c01, c02, c05, c06
- **thin / fold:** c03, c08, c12
- **needs-SME:** c04 (how are countries added?), c13 (retire vs convert)

## Open questions

1. Split `FCOUNTRY` from `COU200` at bind?
2. Should the target validate ISO-3 codes (c02)?
3. How are countries created on the box (c04)?

Did not: bind, deepen Phase B, generate tests, or convert.
