## PACK BIND checklist — architecture/atu-merlin-ord/

pack_id: atu-merlin-ts-ord-v1
version: 1
overlay: none

Blocking nits: none after Field hole closed at 49ee938 (edit_surface + CUS rewrite forbid)
Non-blocking nits: soft note locked — modern/db/** additive ORD tables only (recorded in forbidden + known_risks)

Evidence:
- Waiver: architecture/atu-merlin-ord/ADR/0001-ord-vertical-ts-postgres.md (WAIVED_PATHFINDER)
- Discovery: discovery/ord-*/features/ (seven ORD slices in_scope)
- REPLAY_GREEN: not required (pathfinder waiver)
- Field red-pen: 9.5/10 after CUS rewrite hole patch
- CTO skim: clear

Decision: BIND
bound_by: atuMerlin migration room (Field Engineer 9.5/10 + CTO skim; Agent Smith recorded)
bound_at: 2026-09-09T00:46:59Z

Git actions:
1. Set status: BOUND on PACK.yaml
2. Set bound_by / bound_at (human room identity; Smith recorded)
3. Commit on cursor/atu-merlin-estate-discovery
4. Convert still locked — separate ROOM_OK required

SUPERSEDE reminder: future edits → versions/vN/ + SUPERSEDE + re-bind

FORBIDDEN: convert without separate ROOM_OK; ATU_SRC edits; widen atu-merlin-ts-cus-v1; rewrite CUS modern; reshape CUS schema in modern/db/**

Talk-track: ORD conversion law BOUND — not ORD migrated.
