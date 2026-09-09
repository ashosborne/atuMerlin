## PACK BIND checklist — architecture/atu-merlin-log/

pack_id: atu-merlin-ts-log-v1
version: 1
overlay: none

Blocking nits: none (Field 9/10 Architecture ROOM_OK; CTO skim clear; soft notes on tip 4f42dcf)
Non-blocking nits: modern/db/** and modern/test/** additive / pack-scoped; sibling architecture/atu-merlin-* deny; COU Convert = FCOUNTRY cards only until COU200 SUPERSEDE

Evidence:
- Waiver: architecture/atu-merlin-log/ADR/0001-log-programs-ts-postgres.md (WAIVED_PATHFINDER)
- Discovery: discovery/log-programs/features/
- REPLAY_GREEN: not required (pathfinder waiver)
- Field red-pen: 9/10 — Prefer existing ORD samlog alignment; do not widen ORD pack
- CTO skim: clear (CUS/ORD rewrite hole closed)

Decision: BIND
bound_by: atuMerlin migration room (Field Engineer 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded)
bound_at: 2026-09-09T11:12:14Z

Git actions:
1. Set status: BOUND on PACK.yaml
2. Set bound_by / bound_at (human room identity; Smith recorded)
3. Commit on cursor/atu-merlin-estate-discovery
4. Convert still locked — separate ROOM_OK required

SUPERSEDE reminder: future edits → versions/vN/ + SUPERSEDE + re-bind

FORBIDDEN: convert without separate ROOM_OK; ATU_SRC edits; widen atu-merlin-ts-cus-v1 / atu-merlin-ts-ord-v1; rewrite customer/order modern; invent COU200 UI (cou pack)

Talk-track: residual LOG programs / samlog align conversion law BOUND — not Merlin migrated.
