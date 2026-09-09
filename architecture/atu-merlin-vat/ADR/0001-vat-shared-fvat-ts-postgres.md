# ADR 0001 — VAT module: TypeScript shared FVAT + Postgres (BOUND)

## Status

Accepted — pack `atu-merlin-ts-vat-v1` @ version 1 is **BOUND**. Does **not** authorise Convert (separate ROOM_OK required).

## Context

Pathfinder modernisation for ATU Merlin VAT. Discovery covers slice `vat-module` (VATDEF / FVAT: GetVATRate, GetVATDesc, ClcVAT, ExistVATRate). IBM i goldens / REPLAY_GREEN are unavailable for this pathfinder. Characterisation is waived. Packs `atu-merlin-ts-cus-v1` and `atu-merlin-ts-ord-v1` already hold CUS and ORD modern verticals; this pack must not widen or edit those packs. Shared module `modern/src/shared/fvat` may already exist for caller reuse.

## Decisions

1. **VAT in scope** — In-scope is slice `vat-module` only: VATDEF and FVAT exports GetVATRate, GetVATDesc, ClcVAT, and ExistVATRate. ART, ATU_SRC, CUS, ORD, and unbound residuals stay outside this pack’s convert surface.
2. **Same TypeScript stack** — TypeScript on Node 20, Fastify HTTP API where needed, Postgres (SQL) with additive schema, simple web UI. Style: modular monolith under `modern/`. Prefer `modern/src/shared/fvat` naming; add `features/vat/` only if a feature surface is required.
3. **Never widen CUS or ORD packs** — Do not edit, widen, or overwrite `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, pack `atu-merlin-ts-cus-v1`, or pack `atu-merlin-ts-ord-v1`. Do not rewrite `modern/src/features/customer/**` or `modern/src/features/order/**`.
4. **WAIVED_PATHFINDER** — Characterisation gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
5. **COMPARE at TypeScript only** — Verification/COMPARE runs against the new TS API surface, not 5250/DSPF goldens.
6. **Planted defects residual** — VAT silent zero for unknown rates stays as-is/residual. Soft-deleted VATDEL still applied, session-buffered rates, unknown VATDEF maintenance path, and dead ART200 VATRATE/VATDESC fields stay known_risks. Do not “fix” them in Architecture.
7. **known_risks not invented** — Do not invent SME answers for maintenance path or ART field disposal. SME must name parity references where marked needs-SME.
8. **Convert NOT authorised** — This ADR and the BOUND pack do not authorise Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse until separate Convert ROOM_OK after BOUND.
- Sibling residual packs (`architecture/atu-merlin-{dat,cou,par,log}/**`) are deny-listed; `modern/db/**` and `modern/test/**` are additive and pack-scoped only.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Accidental re-scope of CUS or ORD modern under this VAT pack is a fail.
- VAT Convert must not rewrite CUS/ORD feature paths or OpenAPI contracts.
- Expanding scope to ART maintenance, editing `ATU_SRC`, or changing bound architecture requires a new pack version, SUPERSEDE, and re-bind — do not overwrite in place.