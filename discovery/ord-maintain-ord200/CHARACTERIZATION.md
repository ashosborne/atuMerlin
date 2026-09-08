# CHARACTERIZATION — ord-maintain-ord200

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 9). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/ord-maintain-ord200/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. ORD slices are document-only per the bind record; the ORD Architecture pack is a **new** pack to be drafted after the five ORD slices are carded (never widen `atu-merlin-ts-cus-v1`).

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): the list order for two orders created the same day (`c01`, no tie-breaker) and the row count against a customer with more orders than one page; the effect of `F5` (redisplay without reload) and of an `ISOTODATE40` NULL mid-result (`c01`); the exact `SFLMSG` text shown for `2` on an open order (`c09`, planted defect — record as-is), for `7` on a closed order and `8` on a delivered order (`Invalid Option`, `c06`/`c07`/`c08`), and for `4` on a closed order that also has deliveries (36 and 37 both raised); the `ORDER` row and every `DETORD.ODQTYLIV` after `7` on an undelivered order (header dated, lines at 0) and after `8` on an order with one partial line (partial line unchanged, others at `ODQTY`), plus the `ARTICLE.ARCUSQTY` deltas from `ORD700` (`ord-trigger-ord700`) in each case; the screen after `4` (row still shows the order in `ORD200`, blank in `ORD201`) and the outcome of `7`/`8` typed on that ghost row (unmonitored exception expected); the residue when a header lock (open `ORD101` session) blocks `4`, `7` or `8`; `CUSTOMER.CULASTORD` after deleting the customer's latest order (`c12`, needs-SME); the header for a `CALL ORD200` with an unknown customer (`c11`). Two facts must be settled before any RECORD: trigger attachment (`ord-trigger-ord700`) and the compile-time activation group (`c10`).
