# CHARACTERIZATION — cus-modules

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 2). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/cus-modules/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`.

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): return values of the 11 `GetCus*` procedures, `ExistCus` and `IsCusDeleted` for a stored / soft-deleted / unknown id and for a repeated id after an external update (cache); the `SltCustomer` return value on option 1, F3 and F12; the `CUS301D` screen states including the empty-list-on-SQL-error case; and the exact dynamic SQL text produced for each criteria combination.
