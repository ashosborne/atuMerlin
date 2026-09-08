# Target architecture (locked) — atuMerlin

**Status:** Operator-locked for **later Conversion stations** only.

| Concern | Choice |
| --- | --- |
| Application shape | TypeScript **modular monolith** |
| Data store | **PostgreSQL** |
| UI | **Simple web UI** |

## How packs in this folder use this file

| Pack | May read TARGET.md? | May implement target? |
| --- | --- | --- |
| Pack A — Estate radar (`PASTE-estate-discovery-atu-merlin.md`) | Optional context | **No** — Phase A candidates only |
| Pack B — Document conveyor (`PASTE-document-slices-conveyor-atu-merlin.md`) | Yes, context only | **No** — Phase B behaviour cards (as-is) only |
| Later Conversion / Architecture stations | Yes | Yes — under BOUND Architecture PACK, not these pastes |

## Non-claims

- This file does **not** authorize Conversion inside radar or document loops.
- As-is Discovery cards describe legacy IBM i behaviour under `ATU_SRC`; they are not to-be TypeScript designs.
- Characterization / RECORD against IBM i remains deferred until a runtime path exists; target-stack tests are a Conversion/Verification concern later.

## Pointers (when those stations run)

- Architecture skill + `PACK.yaml` BIND before Conversion
- Conversion agent consumes **documented** cards + BOUND pack
- Verification owns any parity claim against frozen evidence

Do not fold convert steps into Pack A or Pack B pastes.
