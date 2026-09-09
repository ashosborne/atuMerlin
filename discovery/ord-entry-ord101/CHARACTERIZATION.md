# CHARACTERIZATION — ord-entry-ord101

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 8). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/ord-entry-ord101/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. ORD slices are document-only per the bind record; the ORD Architecture pack is a **new** pack to be drafted after the five ORD slices are carded (never widen `atu-merlin-ts-cus-v1`).

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): the `DETORD` row after each edit sequence — in particular the `c04` matrix (stored `10/5`, typed `20/15` → `ERR1001`; typed `6/8` → stored with delivered > ordered; negative delivered accepted) and the `c03` plain-Enter rewrite of `ODTOTVAT` under a changed or unknown VAT rate; the two-Enter save (recomputed screen, then write) and the exact `ODTOT` / `VAT` / `ODTOTVAT` shown on the error screen; footer `TOT` / `TOTVAT` after edit-then-delete and after a second `4` on a blanked row (`c06`); the `SFLMSG` 35/36 co-display and whether messages persist across displays (DDS response-indicator idiom, runtime); the `ORDER` record-lock wait when another job closes the order mid-edit (`c02`, `c12`); the header shown for a not-found id via direct `CALL`; that `6` produces no change at all (`c07`); that `F3` and `F12` on `FMT02` both return to the list and on `CTL01` both end the program (`c03`, `c10`); the `ORD200` option-2 rejection message on an open order (`c09`, planted defect — record as-is). Trigger side effects on `update fdeto` / `delete` are recorded under `ord-trigger-ord700`, not here. Two facts must be settled before any RECORD: trigger attachment (`c11`) and the compile-time activation group (`c09`).
