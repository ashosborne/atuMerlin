# CHARACTERIZATION — ord-maintain-ord202

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 11). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/ord-maintain-ord202/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. ORD slices are document-only per the bind record; the ORD Architecture pack is a **new** pack to be drafted after the five ORD slices are carded (never widen `atu-merlin-ts-cus-v1`).

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): the header and line screen for a populated order as first shown (truncated form — line 1 of each record only, 12 per page) and after `F11` (folded, 6 per page), with `More...`/`Bottom` and the roll behaviour for an order of more than 12 lines (`c02`, `c05`); the footer `TOT`/`TOTVAT` against the stored `DETORD` sums and against `ORDERCUS.TOTVAL` for the same order (`c02`); the `Deliver` column for an undelivered line (blank under `EDTCDE(2)`) and the delivery/close lines for an open order (blank via `MAPVAL`) versus a closed one (`dd/mm/yy`) (`c01`, `c02`); the empty-order screen (`c02`); the description shown for a line whose article row is missing (inferred from source: the previous line's — `c02`, `c06`); the outcome of `F5`, `F6` and Enter (all exit — `c03`, `c05`); and, first of all, the screen after option `5` on a ghost row in `ORD200` and in `ORD201` and on an order deleted by another job between load and option (source says: unmonitored date exception, `RNQ0112` inquiry in the list program's session — `c01`, `c04`). Two facts must be settled before any RECORD: the compile-time activation group / build definition (`c01`, `c06`) and whether any sample order carries a zero or invalid `ORDATE` (`c01`).
