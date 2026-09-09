# CHARACTERIZATION — cus-interactive

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 1). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/cus-interactive/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`.

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): `CUSTOMER` rows written/updated by `CUS200`, `SAMMSGF` messages `ERR0002/ERR2000/ERR2001/ERR2002/ERR0103`, `CUSSEQ` consumption, and the `CUS200D`/`CUS250D` screen states.
