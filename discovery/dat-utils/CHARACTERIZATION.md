# CHARACTERIZATION — dat-utils

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 6). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/dat-utils/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. The UDFs are not part of `atu-merlin-ts-cus-v1` and this run does not propose widening that pack; the bind record places the date rule here so the later ORD Architecture pack can cite it.

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): `ISOTODATE40(x)` and `ISO_Num_To_Date(x)` for `x` in `{0, 99999999, 99999998, 19400101, 20391231, 10101, 99991231, 20240229, 20230229, 20161301, 20161232, -1, NULL}` — the two sentinels, the boundaries either side of them, a leap-day pair, month/day overflow, a negative value and a NULL argument (`c01`, `c02`, `c04`); the `SQLSTATE` / message text of a `DECIMAL(8,0)` argument holding invalid packed data, if such a value can be produced on the box (`c05`); the result buffer content after an invalid input, read via a host program that ignores the indicator, to confirm the "undefined, not previous value" reading (`c08`); and, at the caller level, `ORD200` / `ORD201` with an order whose `ORDATDEL` is an invalid number, to confirm the un-indicated fetch ends the list at that row (`c03`, pointer to the caller slices). Facts the RECORD must settle first because they are not in source: the activation group and `FENCED` status the functions run under (`c04`, `c06`) and whether the QM queries `CUSQRY` / `ARTQRY` call either function (`c03`).

Phase A's `SME_BRIEF` called this seam "the natural first golden set when Test generation is unlocked". That remains a recommendation for a later station; nothing here unlocks it.
