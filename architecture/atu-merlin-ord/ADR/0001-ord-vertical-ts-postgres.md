# ADR 0001 — ORD vertical: TypeScript + Fastify + Postgres + simple web

## Status

Accepted — pack `atu-merlin-ts-ord-v1` @ version 1 is **BOUND**. Does **not** authorize Convert (separate ROOM_OK required).

## Context

Pathfinder modernisation for ATU Merlin ORD. Discovery covers seven ORD slices: `ord-entry-ord100`, `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, and `ord-trigger-ord700`. IBM i goldens / REPLAY_GREEN are unavailable for this pathfinder. Characterisation is waived. Pack `atu-merlin-ts-cus-v1` already holds the CUS modern vertical; this pack must not widen or edit that CUS pack.

## Decisions

1. **ORD in scope** — In-scope slices are the seven ORD slices listed above (Pack-B wave five plus already-documented `ord-entry-ord100` and `ord-trigger-ord700`). ART, ATU_SRC, unbound residuals, and other non-ORD domains stay legacy.
2. **Same TypeScript stack** — TypeScript on Node 20, Fastify HTTP API, Postgres (SQL) greenfield from PF mappings, simple web UI. Style: modular monolith under `modern/` with `features/order/` naming. May reuse shared modern modules (for example `fcustomer` / `fcountry`) already under `modern/`.
3. **Never widen the CUS pack** — Do not edit, widen, or overwrite `architecture/atu-merlin/**` or pack `atu-merlin-ts-cus-v1`. CUS stays under that pack. Do not re-convert CUS here.
4. **Date NULL rule** — Store NULL in Postgres for IBM i blank/never dates. Map the IBM i 1940-01-01 / zero-date sentinel only at the boundary. Do not store 1940-01-01 as a real date.
5. **WAIVED_PATHFINDER** — Characterisation gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
6. **COMPARE at TypeScript only** — Verification/COMPARE runs against the new TS HTTP JSON API surface, not 5250/DSPF goldens.
7. **Planted defects residual** — ORD200 option-2 unreachable, ORDERCUS inner-join, and VAT silent zero stay as-is/residual. Do not “fix” them in Architecture.
8. **known_risks not invented** — Room-locked known_risks stay needs-SME where marked. Do not invent ORD200/ORD201 SoT twin, presentation for option-5 / F11, or print/PDF scope answers. SME must name parity references.
9. **Convert NOT authorized** — This ADR and the DRAFT pack do not authorize Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse while pack status is DRAFT.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Accidental re-scope of CUS modern under this ORD pack is a fail.
- ORD Convert must not rewrite CUS modern paths (`modern/src/features/customer/**`, `modern/openapi/customer.yaml`).
- Expanding scope to ART, editing `ATU_SRC`, or changing bound architecture requires a new pack version, SUPERSEDE, and re-bind — do not overwrite in place.
