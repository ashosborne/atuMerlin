# ord-batch-ord900-c04 — `ORD901` derived delivery / close dates: both shifted by the same offset, any result after today reset to 0; an open order delivered more than 10 days before today is closed at `ORDATDEL + 10` — a hidden "auto-close" rule, and the only in-tree path to a closed order without a delivery date

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Inside the `c03` loop, after `ORDATE` is shifted, `ORD901` handles the two optional dates. `ORDATDEL` (delivery): if non-zero, shift by `days`; if the result is after `today`, set **0** (not yet delivered). `ORDATCLO` (close): if non-zero, shift by `days`; if after `today`, set **0** (reopened). **Else** — the order is open — if `ORDATDEL > 0` and `ORDATDEL < lastdate` (which at this point holds `today − 10`, `c09`), set `ORDATCLO = ORDATDEL + 10 days`. So a sample order delivered more than ten days ago and never closed is closed by the utility, ten days after delivery. The rule lives only here: the interactive close (`ORD200` / `ORD201` option 7) closes on demand at today's date and stamps `ORDATDEL = today` if missing, so in-tree a closed order always has a delivery date — `ORD901` is the one writer that can leave `ORDATCLO > 0` with `ORDATDEL = 0` (delivery shifted into the future and zeroed, close date still in the past). Closing an order here changes the "open" set that `ART801` / `ORD700` summarise (`ARCUSQTY`, `CUCREDIT`), and `ORD901` does **not** recompute those two (`c05`) — so option 81 followed by a stale `ART801` is the as-is sequence.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:22-27` — `ORDATDEL` shift and future guard
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:28-37` — `ORDATCLO` shift and future guard; `else` branch with the 10-day rule
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:16,18` — `today`, and `lastdate := today − 10` (the threshold)

## Inputs / outputs / observables

- In: `ORDATDEL 8 0`, `ORDATCLO 8 0` (`ORDER.PF`; `0` = not delivered / not closed — the convention every reader uses: `ORD202.PGM.RPGLE:86-90`, `ORDERCUS` via `ISOTODATE40`, `ART801` `ORDATCLO = 0` = open), `days` and `today` from `c03`, `lastdate` = `today − 10`. — `ATU_SRC/QDDSSRC/ORDER.PF:11-14`; `ORD901.PGM.SQLRPGLE:16-18`
- Out: for each row, `ORDATDEL ∈ {0, shifted}`, `ORDATCLO ∈ {0, shifted, ORDATDEL + 10}`. — `ORD901.PGM.SQLRPGLE:22-37`
- Observable: `ORD200` / `ORD201` columns `DATLIV` / `DATCLO`, `ORD202` detail, `ORD500` print; the open / closed status seen by `ORD200` / `ORD201` option 7/8 handling and by `ART801`'s `WHERE ORDATCLO = 0`. — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:108-109`; `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`

## Behaviour as implemented

1. **Delivery date.** `if ordatdel > 0; ordatdel = shifted; if ordatdel > today; ordatdel = 0; endif; endif;` — a zero stays zero (never invented); a shifted delivery that would be in the future becomes "not delivered". — `ORD901.PGM.SQLRPGLE:22-27`
2. **Close date, present.** `if ordatclo > 0; ordatclo = shifted; if ordatclo > today; ordatclo = 0; endif;` — a future close reopens the order. — `ORD901.PGM.SQLRPGLE:28-32`
3. **Close date, absent — the 10-day rule.** `else; if ordatdel > 0 and ordatdel < lastdate; ordatclo = %dec(%date(ordatdel:*iso) + %days(10):*iso); endif; endif;` — uses the **already shifted (and possibly zeroed)** `ORDATDEL`; `lastdate` is `today − 10`, so the condition is "delivered strictly more than 10 days ago". The close date is derived from the delivery date, not from today, so it always lies in the past (`ORDATDEL + 10 < today`). — `ORD901.PGM.SQLRPGLE:18,33-37`
4. **Order of evaluation.** Delivery first, then close. The `else` branch sees the new `ORDATDEL`; the `if ordatclo > 0` branch does **not** re-check delivery (a shifted close that stays ≤ today is kept even if delivery was zeroed — see edge cases). — `ORD901.PGM.SQLRPGLE:22-37`
5. **Written with the row** by the single `update forde` at `:39` (`c03`).

## Validation rules found in code

- "A date may not be after today" — enforced by reset-to-zero for `ORDATDEL` and `ORDATCLO` (not for `ORDATE`, which by construction is ≤ today after the shift unless `days < 0`, `c03`).
- "Delivered > 10 days ago ⇒ closed" — applied only to orders with no close date; threshold strict (`<`), so exactly 10 days stays open.
- Nothing checks `ORDATDEL ≤ ORDATCLO` or `ORDATE ≤ ORDATDEL`; the interactive writers do not either (`ORD200:244-259`).

## Edge cases found in code

- **Closed without delivery.** Source row: `ORDATDEL` and `ORDATCLO` both set, delivery shifts past today (→ 0), close shifts to ≤ today (kept). Result: `ORDATCLO > 0, ORDATDEL = 0`. Requires `ORDATDEL > ORDATCLO` in the source data — impossible from the interactive path (option 7 sets `ORDATDEL = today` if 0, then `ORDATCLO = today`, so `ORDATDEL ≤ ORDATCLO`), possible from hand-edited sample data. Readers tolerate it (`ORD202:86-90` tests each date independently). — `ORD901.PGM.SQLRPGLE:22-32`; `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:244-251`
- **Boundary.** `ORDATDEL = today − 10` exactly → `ordatdel < lastdate` false → stays open. `today − 11` → closed at `today − 1`. — `ORD901.PGM.SQLRPGLE:18,34`
- **Open, delivered recently.** `today − 10 ≤ ORDATDEL ≤ today` → untouched, stays open. Open, undelivered (`ORDATDEL = 0`) → untouched.
- **Reopened by the future guard, then not auto-closed.** `ORDATCLO > 0` shifted past today → 0; the `else` branch is not evaluated for that row in this run. A **second** run on a later day would then see `ORDATCLO = 0` and may apply the 10-day rule. Behaviour depends on how many times and when the utility is run. — `ORD901.PGM.SQLRPGLE:28-37`
- **Malformed non-zero dates.** `%date(ordatdel:*iso)` / `%date(ordatclo:*iso)` on an invalid `yyyymmdd` → `RNQ0112`, unhandled (`c03`). Zero is guarded (`> 0`), other invalid values are not.
- **Summary fields left stale.** Closing an order removes its lines from `ART801`'s and `ORD700`'s definition of "open" (`ORDATCLO = 0`), but no trigger exists on `ORDER` and `ORD901` recomputes only `ODYEAR` and `CULASTORD` (`c05`). `ARCUSQTY` / `CUCREDIT` are consistent again only after menu option 82 (`ART801`, `ord-trigger-ord700-c10`) — which nothing in the tree sequences after option 81. Same gap as the interactive close (`ord-trigger-ord700` "order close never reaches ORD700"). — `ORD901.PGM.SQLRPGLE:33-36,42-50`; `ART801.SQLPRC:23-33`

## Dependencies

- `ORDER.PF` (shared PF — **dep**, not the slice).
- `c03` (`days`, `today`, the loop and the write), `c05` (what is and is not resynced afterwards), `c09` (`lastdate` = `today − 10` by reuse).
- Interactive writers of the same two fields (for contrast, not deepened): `ord-maintain-ord200` / `ord-maintain-ord201` options 7 (close) and 8 (deliver) — `ORD200.PGM.SQLRPGLE:244-259`, `ORD201.PGM.SQLRPGLE:250-265`.
- Consumers of the open / closed status: `ord-trigger-ord700-c10` (`ART801`), `sql-objects-c01` (`ORDERCUS` shows both dates, no filter).

## Assumptions / unknowns

- Language semantics as `c03` (`%days`, `%date` validity).
- **needs-SME (room, ORD pack / Phase A Q2):** is "an order delivered more than 10 days ago is closed, ten days after delivery" a business rule or a sample-data convenience? It exists nowhere else in the estate (`ORD200` / `ORD201` close on demand at today's date). If business, the target has no implementation of it; if sample-only, it falls with `c07`. Not decided here.
- **needs-SME (room, ORD pack):** the target ORD pack preserves "close does not touch the summary fields" as-is (per the `ord-trigger-ord700` cards); confirm that `ORD901`'s closes are covered by the same decision, or that the utility is out of scope entirely.

## Evidence

`ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:16-18,22-39,42-50` · `ATU_SRC/QDDSSRC/ORDER.PF:11-14` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:108-109,244-259` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:250-265` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:86-90` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:23-37` · structural grep of `ATU_SRC/**` for assignments to `ORDATDEL` / `ORDATCLO` (`ORD100:195-196`, `ORD200:246-257`, `ORD201:252-263`, `ORD901:22-36` — the complete set)
