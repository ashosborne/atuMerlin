# ADR 0001 — CUS vertical: TypeScript + Fastify + Postgres + simple web

## Status

Accepted for DRAFT pack `atu-merlin-ts-cus-v1` @ version 1. Does **not** authorize Convert.

## Context

Pathfinder modernization for ATU Merlin. Discovery covers `cus-interactive` and `cus-modules`. IBM i goldens / REPLAY_GREEN are unavailable for this pathfinder; characterization is waived.

## Decisions

1. **CUS only** — In-scope slices are `cus-interactive` and `cus-modules`. ORD, ART, and other domains stay legacy.
2. **Target stack** — TypeScript on Node 20, Fastify HTTP API, Postgres (SQL) greenfield from PF mappings, simple web UI. Style: modular monolith under `modern/` with `features/customer/` naming.
3. **ORD / ART legacy** — No ORD/ART conversion, façade, or interop in this pack. `ATU_SRC/**` is deny-listed.
4. **WAIVED_PATHFINDER** — Characterization gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
5. **COMPARE at TS only** — Verification/COMPARE runs against the new TS HTTP JSON API surface, not 5250/DSPF goldens.
6. **Convert NOT authorized** — This ADR and the DRAFT pack do not authorize Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse while pack status is DRAFT.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Expanding scope to ORD/ART or editing `ATU_SRC` requires a new pack version and re-bind.
