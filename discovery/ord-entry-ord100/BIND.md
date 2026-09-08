## Bind record — discovery/ord-entry-ord100/

| Candidate ID | Decision | Reason |
| --- | --- | --- |
| ord-entry-ord100-c01 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c02 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c03 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c04 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c05 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c06 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c07 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c08 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c09 | needs-SME | Keep inferred labelled inferred; do not promote for Pack B |
| ord-entry-ord100-c10 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c11 | needs-SME | Keep inferred labelled inferred; do not promote for Pack B |
| ord-entry-ord100-c12 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c13 | accept | Room bind; observed-in-code |
| ord-entry-ord100-c14 | accept | Room bind; observed-in-code |

needs-SME / blocked:
- ord-entry-ord100-c09 (inferred): CRTORD command facade
- ord-entry-ord100-c11 (inferred): Trigger side effects on confirm (pointer)

Bound by: atuMerlin migration room (FE/CTO/Migration Engineer confirm; Agent Smith recorded)
Bound at: 2026-09-08 Europe/London
Next: deepen Phase B for accepted only (skill: deepen-phase-b)

Notes:
- Fold `srvpgm-fcustomer` into `cus-modules` (no separate bind).
- ORD slices are for document cards; first TypeScript convert vertical is CUS-only later.
- Architecture / convert still need ROOM_OK.
