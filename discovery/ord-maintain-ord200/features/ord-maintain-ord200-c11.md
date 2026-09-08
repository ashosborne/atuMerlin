# ord-maintain-ord200-c11 — Header context and sentinel dates

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — screen contract) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`*inzsr` initialises the three date host variables to the `1940-01-01` sentinel and chains `CUSTOME1` by the parameter to fetch the customer name for the header; `%found` is not tested. `CTL01` shows `CUID` and `CUSTNM` at row 2, the panel id `ORD200-1`, system date and time, the option legend and column headings. Blank delivery and close dates are rendered by `MAPVAL` from the sentinel, not by the program.

## Entrypoints

- `*inzsr` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:279-284`
- `CTL01` header fields and literals — `ATU_SRC/QDDSSRC/ORD200D.DSPF:46-84`

## Inputs / outputs / observables

- In: `cuid` (parameter, same name as the `FCUST` record field `CUID` — one RPG field). `CUSTOME1` (`IF`, unique key `CUID`) over `CUSTOMER`. — `ORD200.PGM.SQLRPGLE:9,18-19`, `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:6-7`
- Out (screen, `CTL01`): `CUID` (`REFFLD(FCUST/CUID)`, `5P 0`) at 2/4, `CUSTNM` (`30`) at 2/10, `'ORD200-1'` at 1/2, title `'Work with Customer Orders'` at 1/27, `DATE` (`EDTCDE(Y)`) at 1/68, `TIME` at 2/68; legend row 4; column headings row 6 (`Order`, `Year`, `Creation`, `Value`, `Delivery`, `Close`). — `ORD200D.DSPF:46-84`, `ATU_SRC/QDDSSRC/SAMREF.PF:15,24`
- Subfile dates: `DATORD`, `DATLIV`, `DATCLO` are `L` fields, `DATFMT(*JOB)`; `DATLIV`/`DATCLO` carry `MAPVAL(('1940-01-01' *BLANK))`. — `ORD200D.DSPF:23-27`

## Behaviour as implemented

1. `datord = datBlank; datclo = datBlank; datliv = datBlank;` — `datBlank = d'1940-01-01'`. Gives the `L` fields a value inside the `MAPVAL` domain before any fetch (the RPG default `*LOVAL` `0001-01-01` would otherwise be the initial value). — `ORD200.PGM.SQLRPGLE:74,280-282`
2. `chain cuid custome1;` — fills the `FCUST` buffer (`CUID`, `CUSTNM`, …); on a miss the input fields keep their initial values (blank name). No message, no exit. — `ORD200.PGM.SQLRPGLE:283`
3. `CUSTOME1` is read exactly once; a name change by another job during the session is not reflected. `ORD200` never writes `CUSTOMER`.
4. Row dates come from `ISOTODATE40` (`0 → 1940-01-01`, `dat-utils-c01`) on load and from `%date()` after `7`/`8` in-session (`c06`, `c07`); both land in the same `L` fields, so the display treatment is uniform. — `ORD200.PGM.SQLRPGLE:107-109,248,252,258`

## Validation rules found in code

None. Unknown customer → blank `CUSTNM`, `CUID` shown as passed, empty list (`ORDERCUS` inner join, `c01`), `F6` still offered (`c02`).

## Edge cases found in code

- **Shared field name.** Because the parameter `cuid` and the file field `CUID` are the same RPG field, a successful `chain` rewrites the caller's variable with the value just read (identical value). Harmless as coded; a trap if the key were ever changed to a different field.
- **`CUSTNM` is not fetched from the view.** `ORDERCUS` exposes `CUSTNM` but `ORD200`'s cursor does not select it (the twin `ORD201` does, per row); the header name comes from the native chain instead. — `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:8`, `ORD200.PGM.SQLRPGLE:106-110` vs `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:99-104`
- **`DATORD` has no `MAPVAL`.** An order date of `0` would show as `01/01/40` (job format) rather than blank. Not expected in data written by `ORD100`, which sets `ORDATE`. — `ORD200D.DSPF:23`
- **Sentinel is triple-defined.** `d'1940-01-01'` in the RPG constant, in the DDS `MAPVAL`, and in `DAT002` (`dat-utils-c07`); the three must agree. — `ORD200.PGM.SQLRPGLE:74`, `ORD200D.DSPF:25,27`
- **Static text.** `ORD200-1` / title / legends are DDS literals; no message file, no `MSGCON`. — `ORD200D.DSPF:46-84`

## Dependencies

- `CUSTOME1.LF` / `CUSTOMER.PF` — `CUSTOME1.LF:4-6`, `CUSTOMER.PF:6-7`
- `SAMREF.PF` field definitions `CUID` (`5P 0`), `CUSTNM` (`30`) — `SAMREF.PF:15,24`
- `ISOTODATE40` / `DAT002` sentinel (`dat-utils`, documented) — cited only

## Assumptions / unknowns

- Target date rule from the bind record (NULL for never; sentinel only at the boundary) noted for the later ORD pack; not applied here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:9,18-19,74,106-110,248,252,258,279-284` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:23-27,46-84` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:6-7` · `ATU_SRC/QDDSSRC/SAMREF.PF:15,24` · `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:8` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:99-104`
