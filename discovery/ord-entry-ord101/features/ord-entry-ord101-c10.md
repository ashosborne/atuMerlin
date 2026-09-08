# ord-entry-ord101-c10 — No add-line path for existing orders (absence)

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B — observed absence) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Once an order exists, **no line can be added to it** anywhere under `ATU_SRC`: `ORD101`'s list accepts only `F3` (exit), `F12` (cancel — same effect), `F5` (reload) and Enter, and options `2`, `4` (and dead `6`); there is no `F6`, no `1=Add`, no `write fdeto`. Lines are created only by `ORD100` at order creation (staged in `QTEMP`, written at confirm). Both `F3` and `F12` on the list end the program and return to the caller.

## Entrypoints

- `s01key` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:134-147`
- Function keys and legends — `ATU_SRC/QDDSSRC/ORD101D.DSPF:10-11,31,45-53,79-91`

## Inputs / outputs / observables

- In: `F3`, `F12`, `F5`, Enter (+ Page Down handled by the display, `c01`).
- Out: `F3` → `panel = 0` → `pnl00` → `*inlr` (program ends). `F12` → `panel = panel − 1` = 0 → same. `F5` → `step01 = prp` → `s01prp` / `s01lod` rebuild the list and totals from the file. Enter → `s01chk`. — `ORD101.PGM.RPGLE:136-146,287-289`
- No `write` to `DETORD1` anywhere in the member; the only file writes are `update fdeto` (`c03`) and `delete` (`c06`). — `ORD101.PGM.RPGLE:191,270`

## Behaviour as implemented

1. `exfmt ctl01` returns; `s01key` `select`: `exit` / `cancel` / `refresh` / other. — `ORD101.PGM.RPGLE:126,134-147`
2. `cancel` on panel 1 computes `panel = 1 − 1 = 0`, identical to `exit`; on panel 2 it returns to the list (`c03`). — `ORD101.PGM.RPGLE:139-141,240-242`
3. `pnl00` sets `*inlr`; the RPG cycle ends the program; control returns to `ORD200` / `ORD201` (`c09`).
4. The legend advertises `2=Edit`, `4=Delete`, `6=Deliver` and `F3=Exit`, `F5=Refresh`, `F12=Cancel` — nothing else. — `ORD101D.DSPF:47,53,79,83-91`

## Validation rules found in code

None (no add path to validate).

## Edge cases found in code

- **Consequence for a wrong line.** The only remedies are edit (`c03`) or delete + re-create the whole order in `ORD100` (`ord-entry-ord100`); deleting all lines leaves a header with no lines (`c06`).
- **Consequence for line numbering.** `ODLINE` gaps after deletes are permanent; `ORD100` renumbers only at creation (`ord-entry-ord100-c12`).
- **`F5` semantics.** Reload discards nothing (every edit / delete was already written) but repairs the footer after `c03` / `c06` drift and refreshes rows changed by other jobs. — `ORD101.PGM.RPGLE:95-120,142-143`
- **`F12` = `F3` on the list.** Nothing to cancel — all changes are committed as they happen — so the two keys are indistinguishable here (contrast `FMT02`, where both mean "back without saving").
- Absence evidence: `ORD101.PGM.RPGLE` has no `write` op-code other than `write ctl01` / `write key01` / `write sfl01` (display); `ORD101D.DSPF` has no `CF06` / `CA06`; the `create` indicator is dead (`c08`). Whole-tree check: the only `write fdeto` under `ATU_SRC` is `ORD100.PGM.RPGLE:206` (confirm, copying the `QTEMP` staging rows); batch `ORD901` only `UPDATE`s `ODYEAR` (`ORD901.PGM.SQLRPGLE:42`, `ord-batch-ord900`, deferred). No SQL `INSERT` into `DETORD` exists.

## Dependencies

- `ord-entry-ord100` (creation-time add — `c03`, `c07`, `c12` there) — pointer.

## Assumptions / unknowns

- needs-SME: is "no add after creation" a business rule (order content fixed once numbered) or a gap? Decides whether the target's line-maintenance surface gets an add action. As-is: absent.

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:95-120,126,134-147,191,240-242,270,287-289` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:10-11,31,45-53,79-91`
