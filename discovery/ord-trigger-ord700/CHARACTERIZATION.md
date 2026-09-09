# CHARACTERIZATION — ord-trigger-ord700

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 4). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/ord-trigger-ord700/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. ORD slices are document-only per the bind record (first convert vertical is CUS, already converted under `modern/`; this slice is not part of that PACK).

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): `ARTICLE.ARCUSQTY` before/after each `DETORD` insert (`c02`), delete (`c03`), and update (`c04`) for the in-tree writer paths — `ORD100` confirm (once per line, after the header), `ORD101` line delete and line edit (qty, delivered, price-only), `ORD200`/`ORD201` option `8` deliver, `ORD901` `ODYEAR` backfill — including the zero-delta and unknown-article no-ops (`c05`) and whether a negative `ARCUSQTY` is ever produced; the exact `SAMLOG` text appended on delete and its absence on insert/update (`c03`); `CUSTOMER.CULASTORD` after `ORD100` confirm, including a customer id with no `CUSTOMER` row (`c07`); that no `ARCUSQTY` / `CULASTORD` change is visible while an order is being composed in `ORD100` (`c09`); the three field sets after menu option 82 `ART801`, including articles/customers with no open orders left untouched (`c10`). Two runtime facts the RECORD must settle first: whether the four triggers are attached on the box at all (`c01`), and what an unhandled exception inside `ORD700` (record lock, overflow) does to the originating writer (`c05`).
