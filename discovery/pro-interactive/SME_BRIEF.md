# SME_BRIEF — pro-interactive (Phase A, awaiting human bind)

## What was found

Provider screens: `PRO200` Work with Providers (list / edit / items / prepare order), its bound module `PRO202` (purchase proposal → XML file on the IFS), `PRO250` Provider by id, and the `PRO203` goods-to-purchase spreadsheet report. 15 candidates: 13 `observed-in-code`, 2 `inferred` (missing `XML` / `XSS` service programs and copybooks).

Headline facts a human should know before binding:

- **`PRO200` edit never saves** (c03). The `mode = upd` line is commented out with a note calling it "the bug". Every other field-level behaviour of the edit panel (c02) is reachable but has no effect on the database.
- **Purchase proposals write a file and nothing else** (c07, c08). `ARTICLE.ARPURQTY` — the "purchase order qty" that the reorder formula subtracts — has **no writer anywhere in `ATU_SRC`**.
- **Two different reorder filters** (c06 vs c12): `PRO202` proposes for every article below threshold; `PRO203` only for articles with `ARCUSQTY > 0`.
- No create / delete path for providers (c04); deleted providers still display in `PRO250` (c11).

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| `PRO202` is a module bound into `PRO200`, not a program | Keep it in this slice (it is unreachable except via option 7). |
| `PRO203` report | Shares only `PRO202D.FMT03` with the screens. Recommend **split** into `pro-report-pro203` at bind if the spreadsheet is in scope, or **defer** if `XSS` output is out of parity scope. |
| `XML` / `XSS` service programs | Outside the allowlist; treat as integration edges ("file appears at PATH"). Internals are `unknown`. |
| `SltProvider` (F4 in `PRO250`) | Belongs to `pro-modules`; cited as a seam edge only. |

## Recommended bind (recommendation only)

- **accept:** c01, c02, c05, c06, c07, c11, c12, c15
- **decide first (defect):** c03 — preserve-as-is or fix
- **thin / fold:** c09, c14
- **needs-SME:** c04, c08 (data ownership), c10, c13 (missing sources)

## Open questions

1. Is the planted edit bug (c03) part of the behaviour to preserve, or the first thing a target should fix?
2. Who maintains `ARPURQTY` (c08)? If nothing does, the reorder formula degrades to `ARMINQTY + ARCUSQTY − ARSTOCK`.
3. Who consumes `Pur_Ord_*.xml` and `Goods to purchase_*.xml`? Is their format part of the contract?
4. Should `PRO203` be its own slice?

Did not: bind, deepen Phase B, generate tests, or convert.
