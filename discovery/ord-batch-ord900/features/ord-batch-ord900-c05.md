# ord-batch-ord900-c05 — `ORD901` tail: two SQL `UPDATE`s resync `DETORD.ODYEAR` to the header's `ORYEAR` (the estate's **only** writer of `ODYEAR`) and recompute `CUSTOMER.CULASTORD = MAX(ORDATE)` per customer (a verbatim copy of `ART801` statement 3); `ARCUSQTY` / `CUCREDIT` are not resynced

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

After the row loop, `ORD901` runs two set-based statements. (1) `UPDATE detord d SET odyear = (SELECT oryear FROM order WHERE d.odorid = orid) WHERE odyear <> (SELECT oryear FROM order WHERE d.odorid = orid)` — every order line takes its header's (freshly recomputed, `c03`) year, but only rows that differ are touched. Since `ORD100` writes `ODYEAR = 0` on every line it creates and nothing else in `ATU_SRC` assigns the field (grep), this statement is the one place in the estate where `ODYEAR` acquires a value: before the first run of option 81 every line of every order is year 0. Each changed line fires `ORD700U` (`TRGEVENT(*UPDATE) TRGUPDCND(*CHANGE)`), whose event-`'3'` branch computes a zero quantity delta and returns without touching `ARTICLE` (`ord-trigger-ord700-c04`). Lines whose header is missing (orphans) are skipped — the subquery is `NULL`, `<>` is unknown. (2) `UPDATE CUSTOMER C SET CULASTORD = (SELECT MAX(ORDATE) FROM "ORDER" WHERE C.CUID = ORCUID) WHERE EXISTS (…)` — character-for-character `ART801.SQLPRC:35-37`: one rule, two implementations, neither calls the other. Customers without orders keep their old `CULASTORD`. What is **not** recomputed: `ARCUSQTY` and `CUCREDIT` (`ART801` statements 1–2), although `c04` may have just closed orders and so changed the set they are defined over.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:42-45` — the `DETORD.ODYEAR` update
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:46-50` — the `CUSTOMER.CULASTORD` update
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:51` — `*inlr = *on` (program end; no explicit `COMMIT`)

## Inputs / outputs / observables

- In: `ORDER.ORYEAR` / `ORDATE` as left by the loop (`c03`); `DETORD.ODORID`, `ODYEAR` (`4P 0` via `SAMREF` `YEAR`); `CUSTOMER.CUID`. — `ATU_SRC/QDDSSRC/DETORD.PF:6-7`; `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-6,21`; `ATU_SRC/QDDSSRC/SAMREF.PF:68`
- Out: `DETORD.ODYEAR` = header year for every line with a header; `CUSTOMER.CULASTORD 8 0` = newest order date per customer that has orders (for the customer owning the newest order: today). — `ORD901.PGM.SQLRPGLE:42-50`
- Observable: `CULASTORD` on the customer screens (`cus-interactive` cards — pointer); `ODYEAR` is displayed nowhere in the tree (no reader — grep) and is part of `DETORD.PF`'s key (`K ODLINE, ODORID, ODYEAR`) but not of `DETORD1.LF`'s (`K ODORID, ODLINE`), which is the path every program uses. — `DETORD.PF:21-23`; `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
- Side effect: one `ORD700` trigger invocation per changed `DETORD` row, each a no-op (`UpdArt` returns on `qty = 0`). — `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8`; `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:83-88,101-103`

## Behaviour as implemented

1. **`ODYEAR` backfill, differential.** Correlated on `ORID` only (no year in the join — same as `ORDERCUS`, `ARTLSTDAT`, `ART801`); `WHERE odyear <> (subquery)` limits the write to rows that differ, so a same-day rerun (`c03`, `days = 0`) writes nothing here. `from order` undelimited twice (`sql-objects-c10`). — `ORD901.PGM.SQLRPGLE:42-45`
2. **Trigger interplay.** `ORD700U` is `TRGUPDCND(*CHANGE)` — fires only for rows actually changed, which the `WHERE` already restricts to. Event `'3'`, same article: `UpdArt((New.odqty − Old.odqty) − (New.odqtyLiv − Old.odqtyLiv))` = `UpdArt(0)` → `if qty = 0; return`. No `ARTICLE` write, no log entry (only the delete branch logs — `ord-trigger-ord700-c05`). — `ORD700U.SYSTRG:5-8`; `ORD700.PGM.RPGLE:83-88,97-103`
3. **`CULASTORD` recompute, all customers with orders.** `SET CULASTORD = MAX(ORDATE)` over the customer's orders — open or closed, no `ORDATCLO` filter — `WHERE EXISTS` a matching order. Identical text to `ART801:35-37` (`"ORDER"` delimited in both). Differs from the incremental maintainer `ORD701` (`AFTER INSERT`: assigns the inserted order's date, not `MAX` — `ord-trigger-ord700-c07`): after `ORD901` the field is the true maximum for everyone. — `ORD901.PGM.SQLRPGLE:46-50`; `ART801.SQLPRC:35-37`; `ATU_SRC/QSQLSRC/ORD701.SQLTRG:14-15`
4. **End.** `*inlr = *on` — no `COMMIT` / `ROLLBACK` statement in the member; whether the two `UPDATE`s ran under commitment control at all is a precompile-option question (`c06`). — `ORD901.PGM.SQLRPGLE:51`

## Validation rules found in code

- None. The two statements are unconditional repairs; the `WHERE odyear <>` clause is an optimisation, not a rule.

## Edge cases found in code

- **Orphan lines** (`DETORD` row with no `ORDER` header — reachable only outside the tree: `ORD200` / `ORD201` option 4 delete lines before the header; `ORD100` writes header before lines — `ord-entry-ord100-c07`). Scalar subquery → `NULL`; `odyear <> NULL` is unknown → row **not updated**; `ODYEAR` stays whatever it was (0 from `ORD100`). No error. — `ORD901.PGM.SQLRPGLE:42-45`
- **Customers without orders** — untouched by `WHERE EXISTS`; a customer whose last order was deleted keeps a `CULASTORD` pointing at a vanished order. Same behaviour as `ART801` (`ord-trigger-ord700-c10` "leaves rows without open orders untouched"). — `ORD901.PGM.SQLRPGLE:49-50`
- **`ARCUSQTY` / `CUCREDIT` stale after closes.** `c04` can set `ORDATCLO` on open orders; those orders' lines leave the `ORDATCLO = 0` set that `ART801` statements 1–2 sum over, and the incremental path (`ORD700`) fires only on `DETORD` changes, of which the `ODYEAR` backfill is a zero-delta no-op. The next `ART801` (menu 82) repairs it; nothing sequences 81 → 82. — `ORD901.PGM.SQLRPGLE:33-36,42-50`; `ATU_SRC/QSQLSRC/ART801.SQLPRC:23-33`
- **Failure between the statements.** If statement (2) fails (`CUSTOMER` locked, not journaled under `COMMIT(*CHG)` — `c06`), statement (1) and the whole row loop are already applied; there is no handler and no `sqlcod` test — the program ends with an unhandled SQL error message and the file half-repaired. Same shape as `ART801`'s partial reset (`sql-objects-c09`).
- **`from order` vs `FROM "ORDER"`** in adjacent statements of one member (`:43,45` vs `:47,49`) — compile-time check for the source owner (`sql-objects-c10`).

## Dependencies

- `DETORD.PF` (`ODYEAR`), `CUSTOMER.PF` (`CULASTORD`), `ORDER.PF` (shared PFs — **deps**, not the slice).
- `ORD700U.SYSTRG` + `ORD700.PGM.RPGLE` (fires on the backfill; `ord-trigger-ord700-c04` — pointer, not re-derived).
- `ART801.SQLPRC:35-37` (the duplicated statement — `sql-objects-c08`, `ord-trigger-ord700-c10`); `ORD701.SQLTRG` (the incremental `CULASTORD` writer — `ord-trigger-ord700-c07`).
- `ord-entry-ord100-c07` (`ODYEAR` written as 0 — this card is that card's "only the deferred ORD901 backfills it").
- `c03` (`ORYEAR` source), `c04` (why the summary fields can be stale), `c06` (commitment stance).

## Assumptions / unknowns

- Platform: `NULL` comparison is unknown → row excluded; `TRGUPDCND(*CHANGE)` semantics; SQL error without handler ends the statement and surfaces as a message. Inference, runtime-confirmable (`SELECT COUNT(*) FROM DETORD WHERE ODYEAR = 0` before and after one run answers "has option 81 ever been run on this box").
- **needs-SME (room, ORD pack — carried from `sql-objects-c08`):** `ORD901` and `ART801` implement `CULASTORD = MAX(ORDATE)` twice. Fold into one rule in the target (the ORD pack has `ART801` as *not converted*), or keep the duplicate as-is? And: should the ODYEAR backfill exist at all in a target where `odyear` is written at insert — or is `odyear` itself redundant (`ORDER.ORYEAR` is derivable from `ORDATE`, `DETORD.ODYEAR` from the header)? Room / ME decide; not decided here.
- **needs-SME (ops):** does anyone run option 81 and then option 82? Only that order makes `ARCUSQTY` / `CUCREDIT` consistent with the closes `c04` produces.

## Evidence

`ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:33-36,42-51` · `ATU_SRC/QDDSSRC/DETORD.PF:6-7,21-23` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-6,21` · `ATU_SRC/QDDSSRC/SAMREF.PF:68` · `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:21,83-88,97-110` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:23-37` · `ATU_SRC/QSQLSRC/ORD701.SQLTRG:5-15` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:197-213` (via `ord-entry-ord100-c07`) · structural grep of `ATU_SRC/**` for `ODYEAR` (`DETORD.PF:7`, `ORD901:42-45` — no other writer, no reader)
