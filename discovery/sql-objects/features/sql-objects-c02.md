# sql-objects-c02 — `TOTVAL` sums `ODTOTVAT` (line total **with VAT**), not `ODTOT`: both order lists show gross order totals

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is data-contract card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`DETORD` carries two line totals: `ODTOT` (`REFFLD(TOTPRICE)`, net) and `ODTOTVAT` (`REFFLD(TOTPRICE)`, `TEXT('TOTAL LINE WITH VAT')`). `ORDERCUS.TOTVAL` sums **`ODTOTVAT`**, so the "total" column of `ORD200` and `ORD201` is the VAT-inclusive amount of the order. The same field is what `ART801` sums into `CUSTOMER.CUCREDIT` (`ord-trigger-ord700-c10` step 2), so list total and customer credit use one definition of "order value" — gross. The writers set `odtotvat = odtot + vat` per line (`ORD100`, `ORD101`); the view adds nothing and rounds nothing.

## Entrypoints

- `COALESCE((SELECT SUM(ODTOTVAT) FROM DETORD D WHERE H.ORID = ODORID), 0) AS TOTVAL` — `ATU_SRC/QSQLSRC/ORDERCUS.VIEW:17-19`
- Displayed as `SUMORD` on `ORD200D` / `ORD201D` (`11Y 2 O`, `EDTCDE(2)`) — `ATU_SRC/QDDSSRC/ORD200D.DSPF:28`, `ATU_SRC/QDDSSRC/ORD201D.DSPF:25`

## Inputs / outputs / observables

- In: `DETORD.ODTOTVAT` — `9P 2` via `REFFLD(TOTPRICE)`, `TEXT('TOTAL LINE WITH VAT')`, `COLHDG('TOTAL LINE' 'WITH VAT')`. Set by `odtotvat = odtot + vat` at line create / update. — `ATU_SRC/QDDSSRC/DETORD.PF:18-20`; `ATU_SRC/QDDSSRC/SAMREF.PF:50-52`; `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:268,295`; `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:225,260`
- Not used: `DETORD.ODTOT` (`9P 2`, net line total) — `DETORD.PF:17`
- Out: `TOTVAL`, one value per order; `0` when the order has no lines (`c01` step 3).
- Observable: `SUMORD` column of both order lists, edited `EDTCDE(2)` (thousands separators, two decimals, no sign — negative totals would display without a sign; `ODTOTVAT` can only be negative if a writer stores one, which the ORD cards do not show).

## Behaviour as implemented

1. The sum is a plain `SUM(ODTOTVAT)` over every `DETORD` row whose `ODORID` equals the header's `ORID` — delivered and undelivered lines alike (`ODQTYLIV` is not consulted), open and closed orders alike (`ORDATCLO` is not consulted). — `ORDERCUS.VIEW:17-19`
2. No rounding, scaling or VAT re-computation happens in the view; it exposes whatever the writers stored. The VAT arithmetic (`CLCVat` / `GetVatRate`, `vat` rounding) is documented on the `ord-entry-ord100` / `ord-entry-ord101` cards. — `ORD100.PGM.RPGLE:268,295`; `ORD101.PGM.RPGLE:225,260`
3. Result type: `SUM` of a `DECIMAL(9,2)` column widens the precision to the platform maximum (31 by default) and keeps scale 2 (inference). The readers narrow it to `11,2` on fetch (`c01` edge case "host-variable width"). — `ORDERCUS.VIEW:17`; `ORD200D.DSPF:28`

## Validation rules found in code

- None. The view neither checks that `ODTOTVAT = ODTOT + VAT` still holds nor that the two totals are consistent with `ODQTY × ODPRICE`.

## Edge cases found in code

- **Gross vs net is a definition, not a bug** — but it is a silent one: nothing on `ORD200D` / `ORD201D` labels the column as VAT-inclusive (the DDS carries no `COLHDG`/`TEXT` for `SUMORD`; the constant headings on the screens are the ORD cards' business). A target that shows a "net total" would change what users have always seen. — `ORD200D.DSPF:28`; `ORD201D.DSPF:25`
- **Consistency with `CUCREDIT`.** `ART801` step 2 sums the same `ODTOTVAT` (open orders only) into `CUSTOMER.CUCREDIT`; `TOTVAL` sums it for *one* order regardless of status. Adding a customer's open orders' `TOTVAL`s on `ORD200` reproduces `CUCREDIT` after a reset — the only in-tree writer of `CUCREDIT` (`ord-trigger-ord700-c10`). — `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`
- **Lines edited by `ORD101` after the order was closed** still change `TOTVAL` (no status guard in the view); whether `ORD101` allows that is an `ord-entry-ord101` fact.

## Dependencies

- `DETORD.PF` (`ODTOTVAT`, `ODTOT`), `SAMREF.PF` (`TOTPRICE 9P 2`); writers `ORD100` / `ORD101` (their slices own the arithmetic); `c01` (the view); `ord-trigger-ord700-c10` (`ART801` uses the same field).

## Assumptions / unknowns

- Platform: `SUM` result precision (inference, runtime-confirmable with `DSPFFD ORDERCUS` or `QSYS2.SYSCOLUMNS`).
- **needs-SME (room, ORD pack):** confirm that the target's order-list total stays gross (VAT-inclusive). The ORD conversion kept `SUM(odtotvat)` (`modern/db/schema.sql:146` — cited read-only); this card records the source reason.

## Evidence

`ATU_SRC/QSQLSRC/ORDERCUS.VIEW:17-19` · `ATU_SRC/QDDSSRC/DETORD.PF:16-20` · `ATU_SRC/QDDSSRC/SAMREF.PF:50-52` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:28` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:25` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:268,295` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:225,260` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`
