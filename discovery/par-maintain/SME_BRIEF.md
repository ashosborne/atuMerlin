# SME_BRIEF — par-maintain (Phase A, awaiting human bind)

## What was found

A generic two-key key/value store (`PARAMETER`) with a maintenance screen (`PAR200`: list / create / edit / delete, no validation beyond duplicate key, no confirm on delete), a CL utility (`PAR201`: `WRKLNK` on the `PATH` directory) and a getter service program (`FPARAMETER` / `PAR300`, `GetPARM1..5`). 13 candidates: 12 `observed-in-code`, 1 `inferred` (blank-`PATH` behaviour).

The whole subsystem carries **one live setting**: `PATH` — the IFS directory where `ORD500` (PDF), `PRO202` (XML) and `PRO203` (spreadsheet) write their files. `GetPARM1/3/4/5` have no caller (c11).

## Ambiguous boundaries

| Question | Recommendation |
| --- | --- |
| Convert the screen or make `PATH` configuration? | Recommend **configuration** in the target (env / settings) and `defer` the `PAR200` screen; the generic store has no second consumer. |
| `PAR201` | Operator convenience (opens a file browser). Recommend `reject` or fold into an ops runbook rather than convert. |
| `EXPORT(*ALL)` (c10) | Build note; do not card. |
| `LOG100` dependency (c13) | Belongs to `log-programs`; cited here because it is the only non-getter use of `PARAMETER`. |

## Recommended bind (recommendation only)

- **accept (if the screen is kept):** c01, c02, c04, c05, c09
- **thin / fold:** c03, c06, c07, c10, c12, c13
- **needs-SME:** c08 (is `PATH` guaranteed present?), c11 (configuration vs screen)

## Open questions

1. Convert `PAR200` or replace `PATH` with target configuration?
2. Is a delete without confirmation (c05) acceptable if the screen survives?
3. Are there parameters on the box other than `PATH` (data, not source)?

Did not: bind, deepen Phase B, generate tests, or convert.
