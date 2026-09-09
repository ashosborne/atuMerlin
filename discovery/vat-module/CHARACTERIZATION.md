# CHARACTERIZATION — vat-module

```text
CHARACTERIZATION: deferred-waived
Reason: IBM i runtime not available in this environment; documentation from source only.
No RECORD/REPLAY. No goldens. No Conversion unlock claimed by this conveyor.
```

Recorded by the Pack B document-slices conveyor on 2026-09-08 (run 5). This is a **stance note**, not a `WAIVED_*` artefact:
no Test gen pack exists for this slice, so the `waive-characterization` skill was not executed and `testexec/vat-module/` was not created.
`legacy_green` and `parity_green` stay `false` in `inventory/atu-merlin/APP_MANIFEST.yaml`. `FVAT` is not part of `atu-merlin-ts-cus-v1` and this run does not propose widening that pack; the bind record says the VAT rule is documented here so the later ORD Architecture pack can cite it.

Observable outcomes a future RECORD would need to capture (from the cards, for later stations only): `ClcVAT(code, net)` for every `VATDEF` code plus one unknown code and a blank code, across a grid of nets that exercise the half-adjust at the third decimal (`c01`, `c02`) — including a negative net if the order screens can produce one; `GetVATRate` for the same codes (`c03`); `ExistVATRate` for a live, an `'X'`-flagged and a missing code (`c04`); the call sequence hit → miss → hit and hit → hit with an intervening `VATDEF` change to confirm which read is skipped (`c05`, `c06`); the first call in a fresh activation group with a blank code, with and without a blank-keyed `VATDEF` row (`c05`); and, at the caller level, `DETORD.ODTOT` / `ODTOTVAT` written by `ORD100` confirm for an article with an unknown VAT code (`c02`, `c08`). Two facts the RECORD must settle first because they are not in source: which activation group the callers actually run in (`c05`, `c09`) and how `VATDEF` is populated on the reference box (`c07`).
