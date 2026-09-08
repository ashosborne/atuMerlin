# CHARACTERIZATION — cou-maintain (FCOUNTRY half)

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 7). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/cou-maintain/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. Scope of the note is the accepted FCOUNTRY half (`c07`–`c12`) only; the deferred `COU200` half (`c01`–`c06`, `c13`) has no cards and no characterization stance.

The converted CUS vertical (`atu-merlin-ts-cus-v1`, `modern/src/shared/fcountry/index.ts`) already carries a read-only dependency surface for `ExistCountry` / `GetCountryName` / the country list under `WAIVED_PATHFINDER`. That waiver belongs to the CUS pack and its verification (`verification/cus-vertical/`); nothing here extends it, and this run does not propose widening the pack.

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): `GetCountryName` / `GetCountryIso3` / `ExistCountry` for a known code, an unknown code, a blank code, and a lowercase variant of a known code, in the sequences *known → same known* (no second read), *known → unknown → same unknown* (miss re-read), *start → blank* (no read, `*off`) and *known → blank* (read, blanks) — to confirm the cache and `%found` reading in `c07`; a name changed by `COU200` in another job while a caller holds a cached hit (`c07` staleness); `SltCountry` opened with a blank code, an existing code, a non-existent code between two keys, and a code beyond the last key (empty frame, `c09`); 19 / 20 / 21 / 41 remaining rows from the position to fix the "Bottom" boundary and the two-pages-per-load paging (`c09`); the F8 / option 8 sequence table in `c10` run side by side on `SltCountry` and `SltArtFam` to confirm the "identical on screen" reading; and the option-combination matrix in `c11` (invalid row + 8, valid 1 + 8, 1 + F8, invalid control + F8). Facts the RECORD must settle first because they are not in source: the activation group `CUS200` / `CUS250` / `PRO250` compile into (`c07`, `c12`) and whether anything outside the tree reads `COISO` (`c08`).

Phase A's `SME_BRIEF` did not name a golden set for this slice; the getters are a natural pair with the `FVAT` / `FCUSTOMER` getter cards when Test generation is unlocked for the service-program layer. That remains a recommendation for a later station; nothing here unlocks it.
