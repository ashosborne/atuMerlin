# cus-interactive-c08 — Audit stamping on save (CUMOD / CUMODID / CUCREA)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUS200` stamps `CUMOD = %timestamp()` on every save. `CUMODID` and `CUCREA` are set **once at program initialisation** and only reach the row on create; on update the chain reloads the stored values, so `CUMODID` keeps the previous modifier and `CUCREA` is preserved.

> Correction to the Phase A summary ("CUMODID user on every save"): source shows `CUMODID` is refreshed on **create only**.

## Entrypoints

- `*INZSR`: `cumodid = user` (`User S 10 INZ(*USER)`), `cucrea = %date()` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:75,333-337`
- `S02act`: `cumod = %timestamp()` then `UPDATE`/`WRITE FCUST` — `:321-329`
- Update prepare `CHAIN CUID CUSTOME1` (overwrites the buffer) — `:258`
- Create `RESET FCUST` (restores `*INZSR` values) — `:184`

## Inputs / outputs / observables

Fields — `ATU_SRC/QDDSSRC/CUSTOMER.PF:23-28`

| Field | Type | Create (`WRITE`) | Update (`UPDATE`) |
| --- | --- | --- | --- |
| `CUCREA` | `L` (date) | program start date (`*INZSR`) | stored value (reloaded by chain) |
| `CUMOD` | `Z` (timestamp) | now | now |
| `CUMODID` | `10A` | `*USER` at program start | **stored value** (previous modifier) |

## Behaviour as implemented

1. `*INZSR` runs once per program activation, setting `CUMODID` and `CUCREA` in the `FCUST` buffer. — `:333-337`
2. Create: `RESET FCUST` brings those two values back into the buffer; `WRITE` persists them with `CUMOD`. — `:184,323,327`
3. Update: `CHAIN` replaces every `FCUST` field, including `CUMODID`/`CUCREA`, with stored values; `S02act` only touches `CUMOD`. — `:258,323,325`

## Validation rules found in code

- None; audit fields are not shown on `FMT02` and cannot be typed. — `ATU_SRC/QDDSSRC/CUS200D.DSPF:84-145`

## Edge cases found in code

- `CUCREA` on create is the date the program was **started**, not the save date (long-lived sessions across midnight). — `:335`
- `CUMODID` reflects the true last modifier only if that modifier created the row or the stored value happens to match. Any conversion or characterization that expects "last modified by" semantics must treat this as the as-is contract.
- `CUMOD` timestamp uses job time (`%timestamp()`), no time-zone handling.
- `CUS250` displays none of the audit fields. — `ATU_SRC/QDDSSRC/CUS250D.DSPF:56-70`

## Dependencies

- `CUSTOMER.PF`, `CUSTOME1.LF`.

## Assumptions / unknowns

- Whether the `CUMODID` behaviour on update is intentional — **needs-SME**. Documented as-is; not changed.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:75,184,258,321-329,333-337` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:23-28`
