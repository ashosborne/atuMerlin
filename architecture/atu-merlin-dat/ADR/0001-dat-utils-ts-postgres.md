# ADR 0001 — DAT utils: TypeScript shared date helpers (BOUND)

## Status

Accepted — pack `atu-merlin-ts-dat-v1` @ version 1 is **BOUND**. Does **not** authorise Convert (separate ROOM_OK required).

## Context

Pathfinder modernisation for ATU Merlin date utilities. Discovery covers slice `dat-utils`. IBM i goldens / REPLAY_GREEN are unavailable for this pathfinder. Characterisation is waived. Packs `atu-merlin-ts-cus-v1` and `atu-merlin-ts-ord-v1` already hold CUS and ORD modern verticals and already document a date NULL boundary rule; this pack must align with that rule without widening those packs.

## Decisions

1. **DAT in scope** — In-scope is slice `dat-utils` only: shared date conversion and formatting helpers. ATU_SRC, CUS, ORD, and unbound residuals stay outside this pack’s convert surface.
2. **Same TypeScript stack** — TypeScript on Node 20, Fastify where needed, Postgres (SQL) with additive schema, simple web UI. Style: modular monolith under `modern/` with `shared/dat` or `features/dat` naming.
3. **Date lock matches ORD** — Store NULL in Postgres for blank/never dates. Map the IBM i 1940-01-01 / zero-date sentinel only at the boundary. Do not store 1940-01-01 as a real date. Do not invent a different sentinel.
4. **Never widen CUS or ORD packs** — Do not edit, widen, or overwrite `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, pack `atu-merlin-ts-cus-v1`, or pack `atu-merlin-ts-ord-v1`. Do not rewrite `modern/src/features/customer/**` or `modern/src/features/order/**`.
5. **WAIVED_PATHFINDER** — Characterisation gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
6. **COMPARE at TypeScript only** — Verification/COMPARE runs against the new TS API surface, not 5250/DSPF goldens.
7. **known_risks not invented** — Dead ISO_Num_To_Date if QM queries are unused (c03) and the 99999999 branch (c01) stay known_risks. Do not invent SME answers.
8. **Convert NOT authorised** — This ADR and the BOUND pack do not authorise Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse until separate Convert ROOM_OK after BOUND.
- Sibling residual packs (`architecture/atu-merlin-{vat,cou,par,log}/**`) are deny-listed; `modern/db/**` and `modern/test/**` are additive and pack-scoped only.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Accidental re-scope of CUS or ORD modern under this DAT pack is a fail.
- A different blank/never sentinel than ORD is a fail.
- Expanding scope, editing `ATU_SRC`, or changing bound architecture requires a new pack version, SUPERSEDE, and re-bind — do not overwrite in place.