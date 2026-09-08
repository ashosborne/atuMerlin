## Bind record — discovery/ord-maintain-ord200/

| Candidate ID | Decision | Reason |
| --- | --- | --- |
| ord-maintain-ord200-c01 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c02 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c03 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c04 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c05 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c06 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c07 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c08 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c09 | accept | Room ORD bind; observed-in-code (planted defect — preserve as-is/residual; do not fix in discovery) |
| ord-maintain-ord200-c10 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c11 | accept | Room ORD bind; observed-in-code |
| ord-maintain-ord200-c12 | needs-SME | Keep inferred labelled needs-SME |
| ord-maintain-ord200-c13 | accept | Room ORD bind; observed-in-code |

needs-SME / blocked:
- ord-maintain-ord200-c12 (inferred): Delete leaves CULASTORD stale (consequence)

Bound by: atuMerlin migration room (FE/CTO/Migration Engineer confirm; Agent Smith recorded)
Bound at: 2026-09-08 Europe/London
Next: deepen Phase B for accepted only (skill: deepen-phase-b)

Notes:
- ORD Architecture will be a **new** pack — never widen atu-merlin-ts-cus-v1.
- Planted defects (ORD200 option-2 unreachable, ORDERCUS join, VAT silent zero) stay as-is/residual.
- Date lock for later ORD pack: NULL in Postgres for blank/never; map 1940-01-01 / zero-date only at boundary.
