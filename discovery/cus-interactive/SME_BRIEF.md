# SME_BRIEF — cus-interactive (Phase A, awaiting human bind)

## What was found

Two 5250 entry programs on the customer master: `CUS200` (work-with list, create, update, jump to orders) and `CUS250` (inquiry by id with prompt). 12 candidate behaviours, all `observed-in-code`. No Phase B cards were written.

Notable as-is facts:

- Customer ids come from the SQL sequence `CUSSEQ` (`NEXT VALUE FOR`), not from a data area or max+1 (contrast: articles use max+1 in `ART200`, orders use `LASTORDNO` data area).
- Duplicate detection is on `UPPER(CUSTNM) + CUPHONE` via embedded SQL (`CUS200.PGM.SQLRPGLE:309-316`).
- `CUS200` does **not** use the `FCUSTOMER` service program; it hits `CUSTOME1/2` directly and only binds `FCOUNTRY`. `CUS250` uses `FCUSTOMER.SltCustomer` + `FCOUNTRY.GetCountryName`.
- No delete option for customers anywhere in this seam.

## Ambiguous boundaries

| Question | Options |
| --- | --- |
| Option 5 → `ORD200` | Keep as a seam edge (recommended); `ORD200` behaviour stays in `ord-maintain-ord200`. |
| `CUSTADRE.PF` / `ADDRESS.PF` | Unreferenced by code. Recommend **defer** (not a behaviour) until someone finds a consumer. |
| Sentinel date 1940-01-01 | Appears in CUS200, ORD200/201/202, ISOTODATE40 UDF. Recommend one shared convention card owned by whichever slice binds first. |
| Split CUS200 vs CUS250 | Both small; recommend binding together (one slice) to avoid TRACEABILITY theatre. |

## Recommended bind (recommendation only — nothing set)

- **accept:** c01, c02, c03, c04, c05, c07, c08, c09, c10, c12
- **accept as seam-edge card (thin):** c06
- **defer:** c11 (absence finding — record as known gap, not a behaviour)

## Open questions for SME

1. Is consuming a `CUSSEQ` value on F6 (even if the create is cancelled) acceptable to preserve, or is the gap-free id a hidden requirement?
2. `CUCREA` is set in `*inzsr` and the buffer is reused for updates — confirm whether an update overwrites the creation date (`CUS200.PGM.SQLRPGLE:334-335` vs `:324-325`).
3. Are there any callers of `CUS250` other than the menu (`SAMMNU.MENU:112-115`)?

## Characterization notes (for later, not now)

Screen-driven; observable outcomes are CUSTOMER rows + SAMMSGF messages. No IBM i runtime here — Pack B would document from source only (`CHARACTERIZATION: deferred-waived` per charter).

Did not: bind, deepen Phase B, generate tests, or convert.
