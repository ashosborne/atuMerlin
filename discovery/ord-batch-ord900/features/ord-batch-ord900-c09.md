# ord-batch-ord900-c09 — Variable reuse trap in `ORD901`: `lastdate` holds `MAX(ORDATE)` for two statements, then is silently reassigned to `today − 10` and used under that meaning in the close rule; `today` is a separate field used only by the two future guards

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is readability card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Three standalone fields carry the program's arithmetic: `lastdate 8 0`, `today 8 0`, `days 5 0`. `lastdate` is first the newest order date (`:11`, guard `:12`, offset `:17`) and then — with no comment — `today − 10 days` (`:18`), the only value it holds when the loop runs; its one later use (`:34`, `ordatdel < lastdate`) is the "delivered more than 10 days ago" threshold of `c04`. `today` (`:16`) is used only at `:24` and `:30` (the future guards). Nothing is wrong with the arithmetic — `c03` / `c04` document what it computes — but a reader who takes the name at face value reads `:34` as "delivered before the newest order", which is a different rule. The sequence matters: `:18` must stay after `:17` (which still needs the maximum) and before the loop. The card exists so that a conversion or a code review does not "fix" the name and change the rule, and so the 10-day constant — written twice, as `%days(10)` at `:18` and `:35` — is recognised as one parameter, not two.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:6-8` — declarations
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:11-18` — the two lives of `lastdate`
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:24,30,34-35` — uses

## Inputs / outputs / observables

- Not an observable behaviour; a source characteristic. Effect on data is entirely described by `c03` / `c04`.

## Behaviour as implemented

| line | statement | `lastdate` means | `today` | `days` |
| ---: | --- | --- | --- | --- |
| 11 | `select max(ordate) into :LastDate` | newest order date (or unchanged 0, `c02`) | — | — |
| 12 | `if lastdate = 0` | newest order date | — | — |
| 16 | `today = %dec(%date():*iso)` | newest order date | job date | — |
| 17 | `days = %diff(%date():%date(lastdate:*iso):*d)` | newest order date | — | today − newest |
| 18 | `lastdate = %dec(%date() - %days(10):*iso)` | **today − 10** | — | — |
| 24, 30 | `if ordatdel > today` / `if ordatclo > today` | — | job date | — |
| 34 | `if ordatdel > 0 and ordatdel < lastdate` | **today − 10** | — | — |
| 35 | `ordatclo = %dec(%date(ordatdel:*iso) + %days(10):*iso)` | — | — | — |

1. **First life.** `lastdate` = `MAX(ORDATE)`; consumed by the guard and the offset. — `ORD901.PGM.SQLRPGLE:11-17`
2. **Reassignment.** `lastdate = today − 10` — a new quantity in the old name; no comment. — `:18`
3. **Second life.** The close-rule threshold. Read literally, `ordatdel < lastdate` says "delivered before the newest order"; actually "delivered more than 10 days before today". — `:34`
4. **`today` is not the trap.** It is declared, set once and used twice under one meaning. Phase A's note that it is "only used for the future-date guard" is correct and unremarkable. — `:7,16,24,30`
5. **Two literals, one rule.** `%days(10)` at `:18` (threshold) and `:35` (close offset) encode the same "10 days"; changing one without the other makes the rule inconsistent (an order could be closed at a date after today, or the threshold could differ from the offset). — `:18,35`

## Validation rules found in code

- None (readability card).

## Edge cases found in code

- **Reordering hazard.** Moving `:18` above `:17` would compute `days` from `today − 10` (a constant 10-day shift) — a wrong program that still compiles. Moving it into the loop would recompute a constant per row — harmless. The current order is the only correct one for the intended arithmetic. — `:17-18`
- **Reading hazard at `:34`.** With the first meaning of `lastdate`, `ordatdel < lastdate` would close every delivered order older than the newest order — the majority of the file. With the second, only those delivered more than 10 days ago. Same source text, different rule; the second is what runs.

## Dependencies

- `c03` (`days`, `today`), `c04` (the rule that consumes the second meaning), `c02` (the guard that consumes the first).

## Assumptions / unknowns

- None about the platform.
- **note for ME / future convert station (not a needs-SME):** if the utility is ever converted, name the two quantities separately (`newestOrderDate`, `autoCloseThreshold`) and hoist the `10` to one constant; nothing else in the estate refers to that value (grep `%days(10)`: `ORD901:18,35` only).

## Evidence

`ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:6-8,11-18,24,30,34-35` · structural grep of `ATU_SRC/**` for `%days(10)` (two hits, both in `ORD901`) and for `lastdate` / `today` (this member only)
