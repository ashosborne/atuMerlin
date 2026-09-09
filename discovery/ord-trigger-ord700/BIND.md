## Bind record — discovery/ord-trigger-ord700/

| Candidate ID | Decision | Reason |
| --- | --- | --- |
| ord-trigger-ord700-c01 | needs-SME | Keep inferred labelled inferred; do not promote for Pack B |
| ord-trigger-ord700-c02 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c03 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c04 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c05 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c06 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c07 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c08 | needs-SME | Keep inferred labelled inferred; do not promote for Pack B |
| ord-trigger-ord700-c09 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c10 | accept | Room bind; observed-in-code |
| ord-trigger-ord700-c11 | needs-SME | Keep inferred labelled inferred; do not promote for Pack B |

needs-SME / blocked:
- ord-trigger-ord700-c01 (inferred): Trigger registration on DETORD
- ord-trigger-ord700-c08 (inferred): Trigger asymmetry leaves CULASTORD stale on delete
- ord-trigger-ord700-c11 (inferred): Possible arithmetic divergence between trigger and reconciliation

Bound by: atuMerlin migration room (FE/CTO/Migration Engineer confirm; Agent Smith recorded)
Bound at: 2026-09-08 Europe/London
Next: deepen Phase B for accepted only (skill: deepen-phase-b)

Notes:
- Fold `srvpgm-fcustomer` into `cus-modules` (no separate bind).
- ORD slices are for document cards; first TypeScript convert vertical is CUS-only later.
- Architecture / convert still need ROOM_OK.
