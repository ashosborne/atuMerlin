# ADR 0001 — PAR maintain: TypeScript shared parm / PATH (BOUND)

## Status

Accepted — pack `atu-merlin-ts-par-v1` @ version 1 is **BOUND**. Does **not** authorise Convert (separate ROOM_OK required).

## Context

Pathfinder modernisation for ATU Merlin parameter / PATH maintain. Discovery covers slice `par-maintain`. IBM i goldens / REPLAY_GREEN are unavailable for this pathfinder. Characterisation is waived. ORD already converted PATH consumers such as ORD500 under pack `atu-merlin-ts-ord-v1`. This pack must document interop as reuse of config and must not rewrite the order feature or widen the ORD pack.

## Decisions

1. **PAR in scope** — In-scope is slice `par-maintain` only. ATU_SRC, CUS, ORD feature trees, and unbound residuals stay outside this pack’s convert surface.
2. **Same TypeScript stack** — TypeScript on Node 20, Fastify where needed, Postgres (SQL) with additive schema, simple web UI. Style: modular monolith under `modern/` with `shared/parm` or `features/par` naming.
3. **PATH interop as config reuse** — ORD500 already converted. Document PATH interop as reuse of configuration. Do not rewrite `modern/src/features/order/**` to re-home PATH.
4. **Never widen CUS or ORD packs** — Do not edit, widen, or overwrite `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, pack `atu-merlin-ts-cus-v1`, or pack `atu-merlin-ts-ord-v1`.
5. **WAIVED_PATHFINDER** — Characterisation gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
6. **COMPARE at TypeScript only** — Verification/COMPARE runs against the new TS API surface, not 5250/DSPF goldens.
7. **known_risks not invented** — PATH as config vs maintained table (c11), PATH trailing slash / filesystem (c07), and unused GetPARM getters stay known_risks. Do not invent SME answers.
8. **Convert NOT authorised** — This ADR and the BOUND pack do not authorise Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse until separate Convert ROOM_OK after BOUND.
- Sibling residual packs (`architecture/atu-merlin-{vat,dat,cou,log}/**`) are deny-listed; `modern/db/**` and `modern/test/**` are additive and pack-scoped only.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Accidental rewrite of the order feature or widen of ORD/CUS packs is a fail.
- Expanding scope, editing `ATU_SRC`, or changing bound architecture requires a new pack version, SUPERSEDE, and re-bind — do not overwrite in place.