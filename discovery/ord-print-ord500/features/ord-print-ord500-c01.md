# ord-print-ord500-c01 — Print order document to spool

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD500(orid)` writes one order document to the externally described printer file `ORD500O` (`*SCS`, page width 90): a hard-coded company block, the customer block (`CUSTOMER` row of the order), an order-number/date line with column headings, one two-line `DETAIL` per `DETORD` line with the article description, and a `TOTAL` block (`Net`, `VAT`, `Total`) followed by a `FOOTER`. A page break is forced by a manual line count after **15** details (`count > 14`, Phase A said 14): footer, company block and order/headings are re-written; the **customer block is not** repeated. Totals are sums of the **stored** `ODTOT` / `ODTOTVAT`; VAT is their difference. The printer file is closed explicitly before the PDF hand-off (`c02`, `c03`).

## Entrypoints

- Program entry `ORD500`, one parameter `id` (`like(orid)`, `6P 0`, by reference) — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:15-19`
- Linear main line (no cycle files, no subroutines): header chains → `write header/header2/header3` → `setll`/`reade` loop over `DETORD1` → `*inlr` → `write total/footer` → `close` → PATH / PDF — `ORD500.PGM.RPGLE:30-59`
- Printer file `ford500o o e printer oflind(overflow)` — `ORD500.PGM.RPGLE:6`; record formats `HEADER`, `HEADER2`, `HEADER3`, `DETAIL`, `TOTAL`, `FOOTER` — `ATU_SRC/QDDSSRC/ORD500O.PRTF:6,18,43,65,83,106`
- Callers: `ORD100` after confirm, `ORD200` / `ORD201` option 6 (`c05`)

## Inputs / outputs / observables

- In: `id`; `ORDER1` record (`FORDE`: `ORID`, `ORYEAR`, `ORCUID`, `ORDATE` `8 0` ISO); `CUSTOME1` record (`FCUST`: `CUSTNM`, `CULINE1`–`CULINE3`, `CUCOUN`, `CUZIP`, `CUCITY`); `DETORD1` records by `ODORID` (`FDETO`: `ODLINE`, `ODARID`, `ODQTY`, `ODPRICE`, `ODTOT`, `ODTOTVAT`); `ARTICLE1` record per line (`FARTI`: `ARDESC`). — `ORD500.PGM.RPGLE:8-11`, `ATU_SRC/QDDSSRC/ORDER.PF:5-14`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-16`, `ATU_SRC/QDDSSRC/DETORD.PF:5-20`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7`
- Out: one spooled file `ORD500O` in the job (output queue / hold / save are not set in the DDS — job and printer-file object defaults, not in the tree), laid out positionally with `SKIPB` / `SPACEB`:
  - `HEADER` — `SKIPB(005)`: `'Company Sample'` … `'Customer Order'` (col 3 / +28), `'55, rue Adrastee'`, `'F-74650 Chavanod'` on the next two lines. Hard-coded literals; no company data read. — `ORD500O.PRTF:6-17`
  - `HEADER2` — `'Customer'` `ORCUID` (`EDTCDE(Z)`) at col 41; then one line each `CUSTNM` (30), `CULINE1`, `CULINE2`, `CULINE3` (50 each), and `CUCOUN` (2-char `COID`) `CUZIP` `CUCITY` on the last line. Country is printed as the **code**, not the name (no `COUNTRY` lookup); `CUVAT`, `CUPHONE`, `CUMAIL` are not printed. — `ORD500O.PRTF:18-42`, `CUSTOMER.PF:8-16`, `ATU_SRC/QDDSSRC/SAMREF.PF:18-19`
  - `HEADER3` — `SKIPB(018)`: `'Order Number'` `ORYEAR` `'/'` `ORID` with `+0` spacing (`ORYEAR` 4 digits unedited, `ORID` `EDTCDE(Z)` in a 6-wide field, so `2016/   123`), `'Order Date'` `DATORD` (`L`, `DATFMT(*JOB)` — the **job's** date format, contrast `ORD202D`'s `*DMY`); two lines down the headings `'Line'`, `'Article'`, `'Quantity'`, `'U.Price'`. There is no heading over the amount column. — `ORD500O.PRTF:43-64`, `SAMREF.PF:34-36,68`
  - `DETAIL` — line 1: `ODLINE` (`EDTCDE(Z)`), `ODQTY` (`EDTCDE(Z)`), `ODPRICE` (`EDTCDE(2)`), `ODTOT` (`EDTCDE(2)`); line 2 (`SPACEB(001)` on `ODARID`): `ODARID`, `ARDESC` (50, col 10 — under the `'Article'` heading), `ODTOTVAT` (`EDTCDE(2)`, `HIGHLIGHT`). `ODQTYLIV` (delivered quantity) is **not** printed — the document does not distinguish delivered lines. — `ORD500O.PRTF:65-82`, `SAMREF.PF:37-39,47-55`
  - `TOTAL` — `SKIPB(052)` `SPACEB(002)`: `'============'` at col 72, then `'Net'` `TOTNET`, `'VAT'` `TOTVAT`, `'Total'` `TOTTOT` (all `REFFLD(ODTOTVAT)` → `9P 2`, `EDTCDE(2)`, `HIGHLIGHT`). — `ORD500O.PRTF:83-105`
  - `FOOTER` — `SKIPB(058)` `SPACEB(002)`: `'This is the footer'` at col 37 and a `'.'` at +35 (column 90, the page edge). Placeholder text, printed as-is on every page. — `ORD500O.PRTF:106-112`
- No page number, no currency, no print date/time, no user id, no `USRDTA`. Nothing is written to any database file (four `if` files). — `ORD500.PGM.RPGLE:8-11`

## Behaviour as implemented

1. `chain id order1`, `datord = %date(ORDATE:*iso)`, `chain orcuid custome1` — neither chain is `%found`-tested (`c08`, `c06`). — `ORD500.PGM.RPGLE:31-33`
2. `write header; write header2; write header3` — page 1 top: company, customer, order/headings. — `ORD500.PGM.RPGLE:34-36`
3. `setll (orid) detord1; reade (orid) detord1` — partial key `ODORID` on `DETORD1` (`UNIQUE`, `K ODORID`, `K ODLINE`) → the order's lines in `ODLINE` order, every line in one pass. The key is `orid` from the `ORDER1` record buffer, not the `id` parameter (equal when found). — `ORD500.PGM.RPGLE:37-38,51`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
4. Per line: `if count > 14` → `write footer; write header; write header3; count = 0` (page break — see 6); `chain odarid article1` (untested, buffer not cleared — `c06`); `count += 1`; `totnet += odtot`; `tottot += odtotvat`; `write detail`. — `ORD500.PGM.RPGLE:40-50`
5. After the loop: `*inlr = *on` (`c07`); `totvat = tottot - totnet`; `write total; write footer; close ord500o`. — `ORD500.PGM.RPGLE:53-57`
6. **Page geometry** (DDS contract, runtime-confirmable): `HEADER` at line 5–7, `HEADER2` 8–13, `HEADER3` order line at 19 and headings at 21, first `DETAIL` at 22–23, detail *n* at 20+2n / 21+2n. The break test fires when `count` is already 15, i.e. **before the 16th detail**: 15 details occupy lines 22–51, `TOTAL` skips to 52 (`SPACEB(002)` → 54–57), `FOOTER` skips to 58 (→ 60). In the loop the same `FOOTER` (skip to 58 on the current page) followed by `HEADER`'s `SKIPB(005)` (line 5 is behind the current line → **new page**) is what ejects. Continuation pages therefore carry the company block and the order/headings line but **no customer block** — lines 8–17 are blank. `count` is reset to 0 and immediately incremented for the line that triggered the break, so every page holds 15 details. Phase A's "page break every 14 details" is corrected. — `ORD500.PGM.RPGLE:40-47`, `ORD500O.PRTF:7,19,44-45,58,66,77,84-85,107-108`
7. Totals: `TOTNET` = Σ stored `ODTOT`; `TOTTOT` = Σ stored `ODTOTVAT`; `TOTVAT` = `TOTTOT − TOTNET` — derived, not summed from a VAT column (`DETORD` has none) and **never recomputed** from quantity × price or the current VAT rate. `ODTOT` / `ODTOTVAT` are what `ORD100` / `ORD101` stored (`odtot = odqty * odprice; odtotvat = odtot + CLCVat(GetArtVatCode(odarid):odtot)`), including the `vat-module-c02` case where an unknown VAT code stores `ODTOTVAT = ODTOT` — the `VAT` line then shows **blank** (`EDTCDE(2)` prints zero as blank). Same "stored sums" rule as `ord-maintain-ord202-c02`. — `ORD500.PGM.RPGLE:48-49,54`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:260-268`, `ORD500O.PRTF:91-105`
8. `close ord500o` completes the spooled file **before** `getParm2` / `ORD500C` run, so `SPLNBR(*LAST)` in `ORD500C` addresses this document (`c03`). — `ORD500.PGM.RPGLE:57-59`

## Validation rules found in code

None. No existence check on the order (`c08`), the customer or any article (`c06`); no check that the order has lines; no check on `ORDATE` validity; no message is issued by this program.

## Edge cases found in code

- **Empty order (no `DETORD` rows)** → headers, headings, blank `Net`/`VAT`/`Total` (zero → blank under `EDTCDE(2)`), footer; one page. Reachable: `ORD101` can delete every line (`ord-entry-ord101`), and the header survives a lock failure in `ORD201` (`ord-maintain-ord201-c04`). — `ORD500.PGM.RPGLE:37-39,54-56`
- **Exactly 15 lines** → no in-loop break; `TOTAL` follows detail 15 on the same page (line 52 after 51). **16 lines** → page 1 holds 15, page 2 holds 1 + totals. — `ORD500.PGM.RPGLE:40`
- **Zero quantity / price / total on a line** → blank cells (`EDTCDE(2)` and `EDTCDE(Z)`), the line is still printed. A zero-quantity line is possible via `ORD101` (`ord-maintain-ord201-c06` / `ord-trigger-ord700`). — `ORD500O.PRTF:69-74,80-81`
- **Unknown article on a line** → previous line's `ARDESC` repeated; blank if it is the first line (`c06`). **Unknown customer** → `ORCUID` printed, the six customer lines blank (`c06`). **Unknown order id** → unmonitored date exception before the first `write` (`c08`).
- **Delivered / closed orders** print identically to open ones — `ORDATDEL`, `ORDATCLO` and `ODQTYLIV` are not read for output. Option 6 in either list re-prints any order at any state (`c05`).
- **Accumulator width**: `TOTNET` / `TOTTOT` / `TOTVAT` are the printer-file fields (`9P 2`, ref `TOTPRICE`); there is no D-spec for them. An order total beyond 9,999,999.99 overflows the `+=` — the runtime response depends on compile options not in the tree (inference; no in-tree data approaches it). — `ORD500.PGM.RPGLE:48-49`, `ORD500O.PRTF:91-92`, `SAMREF.PF:50-52`
- **Overflow indicator never consulted**: `oflind(overflow)` is declared, so the program owns overflow handling, and it never tests the indicator; page ejects come solely from the `count` break + `SKIPB` (`c07`). With the layout above the printer never reaches the default overflow line inside the detail block. — `ORD500.PGM.RPGLE:6,40`
- **Order id / year presentation**: `ORYEAR` unedited (`2016`), `/`, `ORID` zero-suppressed in 6 columns → `2016/   123`. — `ORD500O.PRTF:48-53`, `SAMREF.PF:34-36,68`
- **Every call is a fresh document**: `*inlr` is set on every normal path, so `count`, the accumulators and the record buffers start at zero; the printer file is opened at program start (not `usropn`), so a spooled file exists from the first statement. — `ORD500.PGM.RPGLE:6,53`

## Dependencies

- `ORDER1.LF` (`UNIQUE`, `K ORID`), `DETORD1.LF` (`UNIQUE`, `K ODORID`, `K ODLINE`), `CUSTOME1.LF` (`UNIQUE`, `K CUID`), `ARTICLE1.LF` (`UNIQUE`, `K ARID`) — `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`, `DETORD1.LF:4-7`, `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`, `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`
- `ORD500O.PRTF` — `REFFLD` to `ORDER`, `CUSTOMER`, `DETORD`, `ARTICLE` via `*LIBL` (`SAMREF`); object attributes recorded in the source header: `DEVTYPE(*SCS)`, `PAGESIZE(*N 90 *N)` (width 90, default length). — `ORD500O.PRTF:4-5`
- `FPARAMETER` (`PATH`, `c02`) and `ORD500C` / `CVTSPLPDF` (`c03`) downstream of the close.
- Compile: `dftactgrp(*no)`, **no `bnddir`**, no `.ILEPGM` in the tree — how `GetParm2` is bound is a build fact (`srvpgm-supporting-c05`, unbound; `c06`). Activation group inferred `QILE` — build owner to confirm. — `ORD500.PGM.RPGLE:4`

## Assumptions / unknowns

- Line positions (5/8/19/21/22…/52/58/60) are read from `SKIPB` / `SPACEB` with the documented DDS order (skip, then space, then print); the page length is the printer-file default. Runtime-confirmable; only the *count* of 15 details per page is a source fact.
- needs-SME: is the printed document (spool) the behaviour to preserve, or only "a PDF exists at PATH" (`c03` / `c04`)? Phase A's recommendation was to bind the spool content as the behaviour; this card documents it on that basis.
- needs-SME: continuation pages without the customer block, country as a 2-char code, no delivered quantity, `'This is the footer'` — as-is layout facts to confirm or redesign later (not here).

## Evidence

`ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:4,6,8-11,15-19,30-59` · `ATU_SRC/QDDSSRC/ORD500O.PRTF:4-112` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-16` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:18-19,34-39,47-55,68` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:260-268`
