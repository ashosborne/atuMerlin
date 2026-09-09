# ord-print-ord500-c07 — Code quirks (datord overwrite, unused oflind, early *inlr)

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B — oddities recorded so that a later station does not replicate them blindly, nor "fix" them without a decision) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Nine as-is oddities in 60 lines, none of which changes the printed document for a found order with valid data: a dead preset of the order date; an overflow indicator that is declared (making the program responsible for overflow) and never tested; `*inlr` switched on before the totals, footer, close and PDF call; the `id` parameter used once and the record field thereafter; a redundant `%trim`; `HEADER3` re-written per page but `HEADER2` not; accumulators that exist only as printer-file fields; placeholder footer text; and one **load-bearing** statement that looks like a quirk but is not — the explicit `close ord500o` before `ORD500C`. The one quirk that *does* matter is the missing guard behind the preset, carded separately as `c08`.

## Entrypoints

- Whole main line — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:30-59`; F-spec — `:6`; D-specs — `:15-26`

## Behaviour as implemented

| # | Quirk | Effect as-is | Evidence |
| --- | --- | --- | --- |
| 1 | `datord = %date()` then, unconditionally, `datord = %date(ORDATE:*iso)` | The first assignment is dead — it is not a guard (contrast `ORD202`'s `> 0` guards for delivery/close, which leave a preset in place). A not-found order still reaches the second statement with `ORDATE = 0` → exception (`c08`). Today's date is never printed. | `ORD500.PGM.RPGLE:30-32`, `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:85-91` |
| 2 | `oflind(overflow)`; `overflow` has no D-spec and is never referenced | Naming an overflow indicator hands overflow handling to the program; the program never looks. Page ejects come from the `count > 14` break plus `HEADER`'s `SKIPB(005)` (`c01`). The name compiles only if the compiler defines it implicitly (ILE RPG `OFLIND(name)` rule — inference; the object exists, so it compiled). | `ORD500.PGM.RPGLE:6,40-43` |
| 3 | `*inlr = *on` **before** `write total; write footer; close ord500o; getParm2; pdfOrd` | Harmless: `LR` is acted on at the end of the cycle, so the tail runs normally. Consequence worth knowing: every normal path ends with `LR`, so each call re-initialises (`count`, accumulators, buffers) — the "fresh call" that `c01`/`c08` rely on. An exception in the tail (`c03`) ends the program abnormally regardless. | `ORD500.PGM.RPGLE:53-59` |
| 4 | `id` (parameter) is used only in `chain id order1`; `setll`/`reade` and `%char(orid)` use the record field `orid` | Identical when the order is found; the parameter is never written back. On a miss `orid` would be `0` — moot, `c08` fires first. | `ORD500.PGM.RPGLE:18-19,31,37-38,51,59` |
| 5 | `%trim(%char(orid))` | `%char` of a packed numeric has no blanks to trim. The **real** conversion issue is the 5-byte `const` target (`c02`). | `ORD500.PGM.RPGLE:22,59` |
| 6 | Page break writes `footer`, `header`, `header3` — not `header2` | Continuation pages have no customer block; lines 8–17 blank (`c01`). Layout fact, possibly intended (address once). | `ORD500.PGM.RPGLE:41-43`, `ATU_SRC/QDDSSRC/ORD500O.PRTF:18-45` |
| 7 | `totnet`, `tottot`, `totvat`, `datord` have no D-spec | They are the externally described `TOTAL` / `HEADER3` output fields (`9P 2` via `REFFLD(ODTOTVAT)`; `L`) — the accumulators live in the printer-file output buffer. Width and edit code come from `SAMREF.TOTPRICE` (`EDTCDE(2)` → zero prints blank). | `ORD500.PGM.RPGLE:48-49,54`, `ORD500O.PRTF:55,91-105`, `ATU_SRC/QDDSSRC/SAMREF.PF:50-52` |
| 8 | `'This is the footer'` + `'.'` at column 90; `'Company Sample'`, `'55, rue Adrastee'`, `'F-74650 Chavanod'` | Placeholder / sample literals hard-coded in the DDS; printed on every page. No company table is read. | `ORD500O.PRTF:8-16,109-112` |
| 9 | `count` is `3u 0` (1-byte unsigned, 0–255) | Never exceeds 15 (reset in the break); fine as-is. | `ORD500.PGM.RPGLE:25,40-47` |
| — | **Not a quirk:** `close ord500o` before `getParm2` / `pdfOrd` | Load-bearing. Closing completes the spooled file so that `ORD500C`'s `SPLNBR(*LAST)` finds a finished document (`c02`, `c03`). Removing it would convert an open (incomplete) spooled file or fail. | `ORD500.PGM.RPGLE:57-59` |

Also noted, not oddities: `HEADER3` doubles as column-heading record (order line + headings — `ORD500O.PRTF:43-64`); the `'Article'` heading sits over the *second* detail line and the amount column has no heading (`c01`); `ORID` zero-suppressed in a 6-wide field after `ORYEAR/` (`c01`).

## Validation rules found in code

None (see `c01`, `c02`, `c08`).

## Edge cases found in code

- Quirk 1 + missing `%found` = `c08`. Quirk 3 is what makes the miss deterministic (`ORDATE = 0` on every call, not "whatever the last call left").
- Quirk 2: if a future change lengthened the detail block past the printer's overflow line without adjusting the `count` break, nothing would eject — the indicator is never tested. Not reachable with the current 15-line geometry (`c01`).
- Quirk 7: an `eval`-style `+=` into a `9P 2` output field — overflow behaviour on an order total ≥ 10,000,000.00 depends on compile options not in the tree (`c01`).

## Dependencies

None beyond the seed members.

## Assumptions / unknowns

- The implicit definition of `overflow` (quirk 2) is stated from the ILE RPG `OFLIND(name)` rule; the source shows no declaration. Build owner can confirm from the compile listing.
- These are recorded **as-is**. Whether a later station carries them (e.g. the customer block only on page 1) or normalises them is a room decision for the ORD Architecture pack — not made here, not fixed here (job header: planted defects and found oddities stay as-is).

## Evidence

`ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:6,15-26,30-59` · `ATU_SRC/QDDSSRC/ORD500O.PRTF:8-16,18-45,55,91-105,109-112` · `ATU_SRC/QDDSSRC/SAMREF.PF:50-52` · `ATU_SRC/QRPGLESRC/ORD202.PGM.RPGLE:85-91`
