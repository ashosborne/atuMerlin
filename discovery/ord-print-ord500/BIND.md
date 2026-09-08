## Bind record — discovery/ord-print-ord500/

| Candidate ID | Decision | Reason |
| --- | --- | --- |
| ord-print-ord500-c01 | accept | Room ORD bind; observed-in-code |
| ord-print-ord500-c02 | accept | Room ORD bind; observed-in-code |
| ord-print-ord500-c03 | accept | Room ORD bind; observed-in-code |
| ord-print-ord500-c04 | needs-SME | Keep inferred labelled needs-SME |
| ord-print-ord500-c05 | accept | Room ORD bind; observed-in-code |
| ord-print-ord500-c06 | accept | Room ORD bind; observed-in-code |
| ord-print-ord500-c07 | accept | Room ORD bind; observed-in-code |
| ord-print-ord500-c08 | accept | Room ORD bind; observed-in-code |

needs-SME / blocked:
- ord-print-ord500-c04 (inferred): CVTSPLPDF implementation not in tree

Bound by: atuMerlin migration room (FE/CTO/Migration Engineer confirm; Agent Smith recorded)
Bound at: 2026-09-08 Europe/London
Next: deepen Phase B for accepted only (skill: deepen-phase-b)

Notes:
- ORD Architecture will be a **new** pack — never widen atu-merlin-ts-cus-v1.
- Planted defects (ORD200 option-2 unreachable, ORDERCUS join, VAT silent zero) stay as-is/residual.
- Date lock for later ORD pack: NULL in Postgres for blank/never; map 1940-01-01 / zero-date only at boundary.
