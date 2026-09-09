# ADR 0001 — Country pack v2: SUPERSEDE to include COU200 cards

## Status

DRAFT pack atu-merlin-ts-cou-v2 version 2. Does not authorise Convert. Does not overwrite atu-merlin-ts-cou-v1.

## Context

Pack B run 19 documented the COU200 half (cards c01-c06 and c13). The slice is 13 of 13. Pack atu-merlin-ts-cou-v1 kept the panel half out of scope until those cards existed. This record is the SUPERSEDE. It opens a new pack. It does not edit the bound pack in place. Version 1 stays BOUND until this pack is BOUND.

## Decisions

1. This is a new pack, not an in-place edit of atu-merlin-ts-cou-v1. Do not overwrite architecture/atu-merlin-cou/PACK.yaml.
2. The target stack is the same as version 1: TypeScript, Node 20, Fastify, Postgres SQL, simple web, and a modular monolith.
3. Card c13 is a room question. The room chooses retire-and-replace or convert for the 138-line OPM program COU200. This draft does not guess. The disposition is unset. Panel Convert waits on c13.
4. Do not invent create, delete, soft-delete, or country code change. As-is (c04) has none. Do not invent ISO-3 validation. As-is (c02) has none: blank, short, and duplicate values are all written. Do not invent a data loader for how countries reach the table. Do not invent ART302.
5. The FCOUNTRY half stays on the existing modern/src/shared/fcountry module. Do not re-convert that half unless a card gap is shown. None is recorded in this draft. The COUNTRY table, if touched, is additive only.
6. If the room chooses convert, the panel mapping is a thin web maintain of name and ISO-3 on an existing row, as-is (no validation, no create, no delete), and modern/openapi/country.yaml may be added. If the room chooses retire, there is no panel port, reference data stays a loaded table, and this pack does not add a new write API.
7. Characterisation is WAIVED_PATHFINDER. replay_green_run_ids is empty. This draft does not claim REPLAY_GREEN.
8. Convert is not authorised by this DRAFT. Convert requires separate ROOM_OK after this pack is BOUND. Panel Convert also waits on c13.
9. Do not widen or edit CUS pack atu-merlin-ts-cus-v1 or ORD pack atu-merlin-ts-ord-v1. Do not reshape CUS or ORD schema. Do not rewrite CUS or ORD tests. ART and providers stay legacy. ATU_SRC stays legacy.

## Consequences

- Version 1 remains the bound country pack until this pack is BOUND. Overwriting version 1 in place is a fail.
- No conversion work is authorised by this file. Starting COU200 Convert while c13 is unset is a fail. Converting while status is DRAFT is a fail.
- A guessed answer on c13, or an invented create, delete, soft-delete, country code change, ISO-3 rule, data loader, ART302, or GetCountryIso3 consumer, is a fail.
- modern/db/** and modern/test/** may be used only as additive and pack-scoped. Reshaping CUS or ORD schema, or rewriting CUS or ORD tests, is a fail.
- Empty replay_green_run_ids is intentional under the pathfinder waiver. Do not invent run identifiers. Do not claim REPLAY_GREEN.
- This draft does not mean the estate is fully migrated.
