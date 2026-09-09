## PACK BIND checklist — architecture/atu-merlin-ord-batch/

pack_id: atu-merlin-ts-ord-batch-v1
version: 1
overlay: none

Blocking nits: none (Field+CTO Architecture ROOM_OK 9/10; soft nit on tip a792163)
Non-blocking nits: modern/db/** and modern/test/** additive / pack-scoped only; sibling architecture deny; c07 needs-SME still open

Evidence:
- Waiver: architecture/atu-merlin-ord-batch/ADR/0001-ord-batch-ts-postgres.md (WAIVED_PATHFINDER)
- Discovery: discovery/ord-batch-ord900/features/ (9/9 cards; c07 inferred)
- Soft nit: edit_surface db/test additive pack-scoped (tip a792163)
- Field + CTO: Architecture ROOM_OK stands

Decision: BIND
bound_by: atuMerlin migration room (Field Engineer + CTO; soft nit tip a792163; Agent Smith recorded)
bound_at: 2026-09-09T23:28:16Z

Git actions:
1. Set status: BOUND on PACK.yaml
2. Set bound_by / bound_at
3. Commit on cursor/atu-merlin-estate-discovery
4. Convert still locked — separate Convert ROOM_OK required; c07 (sample vs real) still open

SUPERSEDE reminder: future edits → versions/vN/ + SUPERSEDE + re-bind

FORBIDDEN: convert without separate Convert ROOM_OK; invent c07 load rule; ATU_SRC edits; widen atu-merlin-ts-cus-v1 / atu-merlin-ts-ord-v1

Talk-track: order-batch architecture BOUND — not Merlin migrated. Convert deferred until c07 is settled and a separate Convert ROOM_OK exists.
