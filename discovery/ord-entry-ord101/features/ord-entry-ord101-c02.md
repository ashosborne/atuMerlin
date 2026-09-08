# ord-entry-ord101-c02 — Header context from ORDER1 and customer name

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

At initialisation `ORD101` chains `ORDER1` by the order id and resolves the customer name with `GetCusName(orcuid)`. The header of both screens shows `ORCUID` / `CUSTNAME` and `ORYEAR / ORID` straight from the `FORDE` record buffer. The chain is on a `UF` file, so the `ORDER` row stays **locked for the whole `ORD101` session** although the program never updates it. A not-found order is not detected.

## Entrypoints

- `*inzsr` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:281-285`
- Header fields on `CTL01` and `FMT02` — `ATU_SRC/QDDSSRC/ORD101D.DSPF:56-57,76-78,130-135`

## Inputs / outputs / observables

- In: `id` parameter; `ORDER1` row `ORID = id`. — `ORD101.PGM.RPGLE:23-25,282`, `ATU_SRC/QDDSSRC/ORDER1.LF:5-6`
- Out: `CUSTNAME` (30) from `FCUSTOMER`; `ORCUID`, `ORYEAR`, `ORID` displayed from the file buffer. `ORDATE`, `ORDATDEL`, `ORDATCLO` are read into the buffer and **never used** (see `c12`). — `ATU_SRC/QDDSSRC/ORDER.PF:6-14`
- Side effect: update lock on the `ORDER` row until `*inlr` (`pnl00`) closes the files. — `ORD101.PGM.RPGLE:8,282,287-289`

## Behaviour as implemented

1. `chain id order1` — keyed by `ORID` (unique). No `%found` test. — `ORD101.PGM.RPGLE:282`, `ORDER1.LF:4-6`
2. `CUSTNAME = GetCusName(orcuid)` — one service-program call per program start; the result is not refreshed later. — `ORD101.PGM.RPGLE:283`, `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:7-8`
3. `*inzsr` runs once (RPG cycle, first pass); the header is then static for the session. — `ORD101.PGM.RPGLE:69-76,281`
4. The program ends only through `panel = 0` → `pnl00` → `*inlr = *on`, which closes `ORDER1` and releases the lock. — `ORD101.PGM.RPGLE:136-138,287-289`

## Validation rules found in code

None — no existence check on the order, no check that the order has lines, no closed-order check (`c12`).

## Edge cases found in code

- **Order not found.** The chain fails silently; the `FORDE` buffer keeps its initial values, so the header shows customer `0` / blank name (`GetCusName(0)`) and order `0 / 0` even though a non-zero `id` was passed; the list is empty (`c01`) and every key still works. Only reachable by a direct `CALL ORD101` — both callers pass an id they just listed (`c09`).
- **Lock held for the session (derived from the `UF` open).** `ORDER1` is opened `uf` and the only I/O on it is this chain, so the row is locked for as long as the operator sits in `ORD101`. Another job that chains the same order for update — `ORD200` / `ORD201` option 7 (close) or 8 (deliver) do `chain (orid) order1 … update forde` — would wait on the record lock (default file wait) and then fail on an unmonitored I/O error. Within the calling job there is no conflict because `ORD200` / `ORD201` list via SQL and `ORD101` has returned before they chain. — `ORD101.PGM.RPGLE:8`, `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:250-265`
- **No `unlock`** anywhere in the program (contrast `ORD201` deliver, which unlocks lines it does not update). — `ORD201.PGM.SQLRPGLE:272-274`
- **Customer soft-deleted or missing.** `GetCusName` returns whatever the getter yields on a miss (owned by `cus-modules`); not tested here.

## Dependencies

- `ORDER1.LF` (`UNIQUE`, key `ORID`) over `ORDER.PF` — `ORDER1.LF:4-6`, `ORDER.PF:5-14`
- `FCUSTOMER` service program via `CUSTOMER.RPGLEINC` (`GetCusName`) — `ORD101.PGM.RPGLE:15`
- Callers `ORD200` / `ORD201` supply the id (`c09`).

## Assumptions / unknowns

- needs-SME: is a session-long lock on the `ORDER` header while lines are edited intended (it does protect against close/deliver during an edit) or incidental (`UF` open with no update)? Shapes the target's concurrency rule for header vs lines.

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:8,15,23-25,69-76,136-138,281-289` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:56-57,76-78,130-135` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:7-8` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:250-274`
