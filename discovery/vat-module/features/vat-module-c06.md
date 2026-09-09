# vat-module-c06 — Rate cache stale for the activation group after a VATDEF change

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Because `chainVATDEF` skips the read whenever the requested code equals the code already in the buffer (`c05`), a `VATDEF` row that changes while an activation group is alive is **not seen** by that group until it asks for a *different* code and then comes back to the changed one. In an `ORD100` session where every article carries the same VAT code, the rate read at the first line is used for every line of every order until the program ends. There is no refresh call, no time-out and no exported close.

## Entrypoints

- `chainVATDEF` cache test — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:68-72`
- Reached through every export (`ClcVAT`, `GetVATRate`, `GetVATDesc`, `ExistVATRate`) — `VAT300.RPGLE:23,32,45,56`

## Inputs / outputs / observables

- In: a sequence of `FVAT` calls within one activation group; the current `VATDEF` row content at the time of each *physical* read. — `VAT300.RPGLE:68-71`
- Out: `VATRATE`/`VATDESC`/`VATDEL` from the last physical read for the buffered code, regardless of the row's current content. — `VAT300.RPGLE:24,33,46,57`
- Observable: after an out-of-band change to `VATDEF` (no in-tree writer exists, `c07`), `ORD100`/`ORD101` keep showing the old `VATRATE` and computing the old VAT for lines with that code; a line with another code in between "refreshes" it. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267-269`

## Behaviour as implemented

1. Call 1, code `'A'` → `P_VATCODE <> VATCODE` (buffer blank) → read; buffer = row `A` (rate r1). — `VAT300.RPGLE:68-71`
2. `VATDEF` row `A` changed externally to r2.
3. Call 2, code `'A'` → `'A' = 'A'` → **no read**; rate returned r1. — `VAT300.RPGLE:68`
4. Call 3, code `'B'` → read; buffer = row `B`. Call 4, code `'A'` → read; rate now r2.

## Validation rules found in code

None.

## Edge cases found in code

- **Cache is per activation group instance of `FVAT`**, not per program: `ACTGRP(*CALLER)` (`c09`). Whether `ORD100`, `ORD101` and `ART250` share one instance depends on the callers' compile-time activation group (`c05`). — `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:8`
- **Misses do not stick** (`c05`): a code added to `VATDEF` after a miss is picked up on the next request for it, because the buffer code is blank after the miss. Only *changes to an existing, currently-buffered row* are invisible.
- **No writer in tree.** With no maintenance program (`c07`) the staleness is reachable only via DFU / SQL / restore outside the application, which makes it a deployment-practice question rather than a code path exercised by the application itself.
- **`ART250` is a display program**; a stale rate there affects the "with VAT" figure shown, nothing stored. `ORD100` stores `ODTOTVAT` computed with the cached rate (`c01`). — `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:154`

## Dependencies

- `c05` (mechanism), `c07` (absence of an in-tree writer), `c09` (activation group).

## Assumptions / unknowns

- **Open question carried in `MANIFEST.yaml`:** do rates change while jobs run in the real deployment? If `VATDEF` is edited only between sessions (or never), this behaviour has no observable effect; if it is edited intra-day, the as-is system applies the old rate for the rest of the session in every job that has already touched that code.

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:19-59,61-74` · `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:8` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267-269` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:154`
