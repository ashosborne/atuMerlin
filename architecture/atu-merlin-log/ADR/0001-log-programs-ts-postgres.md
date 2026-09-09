# ADR 0001 — LOG programs: TypeScript shared logging / samlog align (DRAFT)

## Status

Proposed — pack `atu-merlin-ts-log-v1` @ version 1 is **DRAFT**. Does **not** authorise Convert (separate ROOM_OK required after BOUND).

## Context

Pathfinder modernisation for ATU Merlin log programs. Discovery covers slice `log-programs`. IBM i goldens / REPLAY_GREEN are unavailable for this pathfinder. Characterisation is waived. ORD already has a samlog table under pack `atu-merlin-ts-ord-v1`. This pack should prefer aligning with that existing samlog via shared logging, or document residual vs reuse, without widening the ORD pack or rewriting the order feature.

## Decisions

1. **LOG in scope** — In-scope is slice `log-programs` only. ATU_SRC, CUS, ORD feature trees, and unbound residuals stay outside this pack’s convert surface.
2. **Same TypeScript stack** — TypeScript on Node 20, Fastify where needed, Postgres (SQL) with additive schema, simple web UI. Style: modular monolith under `modern/` with `shared/samlog` or `shared/logging` naming.
3. **Prefer samlog alignment without widening ORD** — Prefer extend shared logging aligned with the existing ORD samlog table. Document residual vs reuse. Do not widen `atu-merlin-ts-ord-v1`. Do not rewrite `modern/src/features/order/**`.
4. **Never widen CUS or ORD packs** — Do not edit, widen, or overwrite `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, pack `atu-merlin-ts-cus-v1`, or pack `atu-merlin-ts-ord-v1`.
5. **WAIVED_PATHFINDER** — Characterisation gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
6. **COMPARE at TypeScript only** — Verification/COMPARE runs against the new TS API surface, not 5250/DSPF goldens.
7. **known_risks not invented** — Whole-slice may be a non-functional side effect; capacity silent fail (c04) stays known_risk. Do not invent SME answers or business-value claims.
8. **Convert NOT authorised** — This ADR and the DRAFT pack do not authorise Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse while pack status is DRAFT.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Accidental widen of ORD/CUS packs or rewrite of the order feature is a fail.
- Expanding scope, editing `ATU_SRC`, or changing bound architecture requires a new pack version, SUPERSEDE, and re-bind — do not overwrite in place.