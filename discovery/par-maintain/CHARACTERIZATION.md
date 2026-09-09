# CHARACTERIZATION — par-maintain

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-09 (run 13). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/par-maintain/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. Residual-wave slices are document-only per the bind record; any Architecture pack for them is a **new** pack (never widen `atu-merlin-ts-cus-v1` or `atu-merlin-ts-ord-v1`).

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): the `PAR200` list for a file of 0, 14, 15 and 28+ rows (`Bottom` exact after 14; `More…`/append after Page Down; leading zeros in columns `4`/`5`) (`c01`); an invalid option (reverse image, `Invalid Option`, valid rows kept) and two `2`s / two `4`s in one Enter, processed in RRN order (`c01`, `c04`, `c05`); F6 create of a new key while `Bottom` is displayed — the list pages forward and shows the former last row twice (`c03`); F6 with an existing key — the error, the typed values still on screen, and (from a second session) the lock on the existing row (`c02`); option `2` — the lock held while the panel is open, the unconditional update, the list still showing the old values until F5 (`c04`); option `4` — no confirmation, the ghost row with blank Code / Sub-Code / `1` and the old `2`–`5` values (no `*** Deleted ****` on screen), then `2` on the ghost (expected: unmonitored `RNQ1221`) and `4` on the ghost with and without a blank/blank row present (`c05`, `c04`); F3 versus F12 on each of the three panels (`c06`); `PAR201` with a `PATH` ending in `/`, without the slash, and blank (`c07`, `c08`); `GetParm2('PATH':' ')` from `ORD500` after `PAR200` changed `PATH` in another session — stale in the running job, fresh in a new job (`c09`); `DSPSRVPGM FPARAMETER DETAIL(*PROCEXP)` — seven procedures (`c10`); `DSPFD PARAMETER` for `WAITRCD` / journaling (`c12`); `DSPOBJD SAMLOG` library versus `PARAMETER`'s (`c13`). Two facts must be settled before any RECORD: the `PATH` value on the box (present? trailing slash? file system?) and the activation group / binding of `ORD500` and `PRO203` (decides whether one job's consumers share the cache).
