## PACK BIND checklist — architecture/atu-merlin/

pack_id: atu-merlin-ts-cus-v1
version: 1
overlay: none

Blocking nits: none (Field YAML pass cleared at 99cbe46; CTO skim clear)
Non-blocking nits: Field nits already in tip 99cbe46

Evidence:
- Waiver: architecture/atu-merlin/ADR/0001-cus-vertical-ts-postgres.md (WAIVED_PATHFINDER)
- Discovery: discovery/cus-interactive/features/, discovery/cus-modules/features/
- REPLAY_GREEN: not required (pathfinder waiver)

Decision: BIND
bound_by: atuMerlin migration room (Field Engineer YAML pass + CTO skim; Agent Smith recorded)
bound_at: 2026-09-08T16:06:38Z

Git actions:
1. Set status: BOUND on PACK.yaml
2. Set bound_by / bound_at (human room identity; Smith recorded)
3. Commit on cursor/atu-merlin-estate-discovery
4. Convert still locked — separate ROOM_OK required

SUPERSEDE reminder: future edits → versions/vN/ + SUPERSEDE + re-bind

FORBIDDEN: convert without separate ROOM_OK; ATU_SRC edits; ORD/ART in scope
