## PACK BIND checklist — architecture/atu-merlin-cou-v2/

pack_id: atu-merlin-ts-cou-v2
version: 2
overlay: none
supersedes: atu-merlin-ts-cou-v1

Blocking nits: none (Field 9/10 + CTO 9/10 Architecture ROOM_OK at tip 7ac3863)
Non-blocking nits: mark v1 SUPERSEDED in the same commit so two country packs are not both BOUND

Evidence:
- SUPERSEDE draft: architecture/atu-merlin-cou-v2/PACK.yaml + ADR/0001-cou-v2-supersede-cou200.md
- Discovery: discovery/cou-maintain/features/ (FCOUNTRY already carded; COU200 c01-c06 + c13)
- c13 unset: retire versus convert — room question, not guessed
- No invented create, delete, or ISO-3
- CUS and ORD not widened

Decision: BIND
bound_by: atuMerlin migration room (Field Engineer 9/10 + CTO 9/10; Agent Smith recorded)
bound_at: 2026-09-09T23:35:35Z

Git actions:
1. Set status: BOUND on architecture/atu-merlin-cou-v2/PACK.yaml
2. Set status: SUPERSEDED on architecture/atu-merlin-cou/PACK.yaml (status line only)
3. Commit on cursor/atu-merlin-estate-discovery
4. Convert still locked — separate Convert ROOM_OK required
5. Panel Convert waits on c13

SUPERSEDE reminder: v1 body not rewritten. Future edits bump version again.

FORBIDDEN: convert without separate Convert ROOM_OK; invent c13; invent create/delete/ISO-3; overwrite v1 body; widen CUS/ORD

Talk-track: country pack v2 BOUND — not Merlin migrated. Panel Convert waits on c13.
