# CHARACTERIZATION — ord-entry-ord100

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 3). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/ord-entry-ord100/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. ORD slices are document-only per the bind record (first convert vertical is CUS).

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): the `ORDER` row and `DETORD` rows written at confirm for a given customer / staged-line set (including `ODYEAR = 0`, `ODQTYLIV = 0`, renumbered `ODLINE`, `ORDATE` format); the `LASTORDNO` increment; `TOT` / `TOTVAT` footer values after add, edit and delete sequences (the `TOTVAT` drift and stale-after-edit cases); `SFLMSG` 35/36 raising and whether they persist across displays; the exact key paths that end the program versus return to the list (`F3`/`F12` on `FMT02` via `F6`, via first pass, via option 2); the re-prompt loop after a cancelled `F6` article prompt; the line counter values shown during staging; and the `FMT03` text. Trigger side effects on confirm are recorded under `ord-trigger-ord700`, not here.
