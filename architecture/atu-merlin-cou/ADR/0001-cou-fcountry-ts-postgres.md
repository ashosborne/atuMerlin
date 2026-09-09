# ADR 0001 — COU FCOUNTRY half: TypeScript shared fcountry (DRAFT)

## Status

Proposed — pack `atu-merlin-ts-cou-v1` @ version 1 is **DRAFT**. Does **not** authorise Convert (separate ROOM_OK required after BOUND).

## Context

Pathfinder modernisation for ATU Merlin country support. Discovery slice `cou-maintain` covers FCOUNTRY (COU300 getters / ExistCountry, COU301 SltCountry) and a COU200 panel half. The FCOUNTRY / COU300 / COU301 half is already carded and is the only in-scope convert surface for this pack. The COU200 panel half stays deferred / stay_legacy until Pack B cards it. Modern already has `modern/src/shared/fcountry` from the CUS vertical; this pack may extend that shared module without rewriting the customer feature.

## Decisions

1. **FCOUNTRY half in scope** — In-scope is the FCOUNTRY / COU300 / COU301 half of `cou-maintain` only. COU200 panel half (c01–c06, c13) is OUT OF SCOPE and listed under stay_legacy / deferred.
2. **Same TypeScript stack** — TypeScript on Node 20, Fastify where needed, Postgres (SQL) with additive schema, simple web UI. Style: modular monolith under `modern/`. Prefer extending `modern/src/shared/fcountry`.
3. **Never widen CUS or ORD packs** — Do not edit, widen, or overwrite `architecture/atu-merlin/**`, `architecture/atu-merlin-ord/**`, pack `atu-merlin-ts-cus-v1`, or pack `atu-merlin-ts-ord-v1`. Do not rewrite `modern/src/features/customer/**` or `modern/src/features/order/**`.
4. **Do not invent COU200 presentation** — Leave COU200 panel behaviour deferred. Do not invent UI or maintenance paths for the panel half in Architecture.
5. **WAIVED_PATHFINDER** — Characterisation gate is `WAIVED_PATHFINDER` (no IBM i goldens). Waiver text: compare behaviour at the TypeScript API only.
6. **COMPARE at TypeScript only** — Verification/COMPARE runs against the new TS API surface, not 5250/DSPF goldens.
7. **known_risks not invented** — GetCountryIso3 unused export (c08) and COU301 selector open questions stay known_risks / needs-SME. Do not invent consumers or presentation answers.
8. **Convert NOT authorised** — This ADR and the DRAFT pack do not authorise Convert. Convert needs a human-bound pack (`status: BOUND`) plus separate `ROOM_OK`.

## Consequences

- Conversion must refuse while pack status is DRAFT.
- Sibling residual packs (`architecture/atu-merlin-{vat,dat,par,log}/**`) are deny-listed; `modern/db/**`/`modern/test/**` additive and pack-scoped only; Convert consumes FCOUNTRY/COU300/COU301 cards only until COU200 is carded and pack SUPERSEDEd.
- Empty `replay_green_run_ids` is intentional under the waiver; do not invent run IDs.
- Accidental rewrite of the CUS customer feature or widen of CUS/ORD packs is a fail.
- Converting COU200 while it remains deferred is a fail.
- Expanding deferred panel scope, editing `ATU_SRC`, or changing bound architecture requires a new pack version, SUPERSEDE, and re-bind — do not overwrite in place.