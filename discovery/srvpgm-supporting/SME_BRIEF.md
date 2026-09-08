# SME_BRIEF — srvpgm-supporting (Phase A, awaiting human bind)

## What was found

The binding layer: `SAMPLE.BNDDIR` (11 service programs), two explicit `CRTPGM` sources, and the binder / activation-group / signature facts across all eight service programs. 9 candidates (8 `observed-in-code`, 1 `inferred`) and **4 `unknown` surfaces** — the service programs `XML`, `XSS`, `ORDER`, `TXT` that the directory lists but the tree does not contain.

Nothing here is business behaviour. Three things matter for the migration:

- **`XML` and `XSS` are missing** (c02) — the two IFS outputs of the PRO slices cannot be characterized until they are seen. `ORDER` and `TXT` are referenced by nothing and may be dead entries.
- **Four programs' bindings are not in source** (c05): `PRO203`, `ORD500`, `ORD700`, `LOG100` compile with `dftactgrp(*no)` and no `bnddir`; how they find `FPARAMETER` / `LOG` / `XSS` is ARCAD/elias build metadata.
- **Cache scope** (c07): every service program is `ACTGRP(*CALLER)` and most callers get their own activation group, so the getter caches documented in the `*-modules` slices are per-calling-program. `PRO200` and `PAR201` share `QILE`.

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Is this a slice at all? | Recommend `reject` as a conversion slice; move c04–c09 into the target architecture notes. Keep the four `unknown` surfaces in `APP_MANIFEST` until sources are obtained. |
| Supporting srvpgm procedures | Scanned in their own seeds (`fam-maintain`, `cou-maintain`, `par-maintain`, `vat-module`, `log-programs`); not repeated here. |
| `srvpgm-fcustomer` / `srvpgm-farticle` / `srvpgm-fprovider` | Folded into `cus-modules` (bind), `art-modules` (recommendation) and `pro-modules` (this run). No separate Phase A. |

## Recommended bind (recommendation only)

- **accept as architecture notes (not behaviour cards):** c02, c05, c07
- **thin / fold:** c01, c03, c04, c06, c08, c09
- **needs-SME (obtain sources):** the four `unknown` surfaces

## Open questions

1. Who owns `XML` / `XSS`? Can their source or at least their copybooks be added to the allowlist?
2. Are `ORDER` / `TXT` dead binding-directory entries?
3. Build owner: how do `PRO203`, `ORD500`, `ORD700` resolve their imports?

Did not: bind, deepen Phase B, generate tests, or convert.
