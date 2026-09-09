# ADR 0001 — Order batch utilities: TypeScript + Fastify + Postgres

## Status

Accepted for DRAFT pack `atu-merlin-ts-ord-batch-v1` @ version 1. Does not authorize Convert.

## Context

Pack B documented `ord-batch-ord900` (ORD900 and ORD901). Characterisation is waived. Customer and Order packs are already BOUND. This pack must not widen them.

## Decisions

1. **New pack** — Scope is the batch utilities only. Do not edit Customer or Order packs.
2. **Same TypeScript stack** — Node 20, Fastify, Postgres, modular monolith. Additive database changes only.
3. **c07 stays needs-SME** — Do not invent whether these jobs run on real data or only refresh sample data. If sample-only, Convert stays deferred.
4. **WAIVED_PATHFINDER** — Compare at the TypeScript API only if Convert proceeds.
5. **Convert NOT authorized** — BOUND plus a separate ROOM_OK are required.

## Consequences

- Conversion must refuse while status is DRAFT.
- Empty `replay_green_run_ids` is intentional under the waiver.
- A later SUPERSEDE of the Order pack is a separate room decision. This DRAFT does not do that.
