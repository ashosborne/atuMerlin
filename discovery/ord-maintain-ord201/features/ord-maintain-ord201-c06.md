# ord-maintain-ord201-c06 — Option 7 close / option 8 deliver (shared with ORD200)

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — lifecycle rules; full detail in the `ORD200` twin cards) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Options `7` (close) and `8` (deliver) are **statement-for-statement identical** to `ORD200` — guards at `ORD201.PGM.SQLRPGLE:181-190` vs `ORD200:177-186`, actions at `ORD201:250-278` vs `ORD200:244-272`. The rules are carded in full as `ord-maintain-ord200-c06` (close) and `ord-maintain-ord200-c07` (deliver); this card records the identity, the citations on the `ORD201` side, and the one sharpening found while reading the trigger definition. The bind kept the twins as separate slices, so this cross-reference (not a merge) is how Phase A's "one shared lifecycle card set" recommendation is honoured.

## Entrypoints

- Legends `7=Close` (4/56), `8=Deliver` (4/68) on `CTL01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:69,83`
- Guard: `s01chk` `if opt01 = 7 and datclo > datBlank or opt01 = 8 and datliv > datBlank` → `sflmsg` (35) — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:181-190`
- Action `7`: `s01act` `when opt01 = 7` — `ORD201.PGM.SQLRPGLE:250-260`
- Action `8`: `s01act` `when opt01 = 8` — `ORD201.PGM.SQLRPGLE:261-278`

## Inputs / outputs / observables

- In: row `orid`; `ORDER1` (`UF`) fields `ORDATDEL`, `ORDATCLO` (`8 0`, `0` = never); for `8` also `DETORD1` (`UF`) `ODQTY`, `ODQTYLIV`. — `ORD201.PGM.SQLRPGLE:7,10`, `ATU_SRC/QDDSSRC/ORDER.PF:11-14`, `ATU_SRC/QDDSSRC/DETORD.PF:10-15`
- Out (data), `7`: `ORDATCLO = today`; `ORDATDEL = today` only if it was `0`; `update forde`; **no line change**. — `ORD201.PGM.SQLRPGLE:251-257`
- Out (data), `8`: `ORDATDEL = today`; `update forde`; then every line with `ODQTYLIV = 0` gets `ODQTYLIV = ODQTY` and `update fdeto`; lines with `ODQTYLIV ≠ 0` are `unlock`ed untouched; order **not** closed. — `ORD201.PGM.SQLRPGLE:262-276`
- Out (screen): `datclo` / `datliv` = `%date()` on the row, option cleared, row rewritten, no reload; `SUMORD` unchanged. — `ORD201.PGM.SQLRPGLE:254,258-260,264,277-278`

## Behaviour as implemented

Identical to the twin. In brief (full steps, edge cases and needs-SME questions in `ord-maintain-ord200-c06` / `c07`):

1. Guard reads the **subfile copies** `datclo` / `datliv`; already-closed `7` and already-delivered `8` are refused with the generic **`Invalid Option`** text (35), not the closed-order message. — `ORD201.PGM.SQLRPGLE:181-190`, `ORD201D.DSPF:44`
2. `chain (orid) order1` — `%found` **not tested** in either option. On a ghost row (`c04`) or an order deleted by another job the following `update forde` runs without a locked record → **unmonitored exception**. — `ORD201.PGM.SQLRPGLE:251,257,262,265`
3. `7`: close stamps the delivery date when blank but leaves every `ODQTYLIV` at `0` — the `ORD700`-maintained `ARCUSQTY` is not reduced by a close while `ART801` (`ORDATCLO = 0` filter) drops the order. After `7` the row refuses `7`, `8`, `4` and `2`. — `ORD201.PGM.SQLRPGLE:252-257`, `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`
4. `8`: all-or-nothing per undelivered line (`ODQTYLIV = ODQTY`, `ORD700U` delta `-ODQTY`), partial lines skipped, order stays open; deliver-after-close impossible because `7` always sets `ORDATDEL`. `reade orid detord1` **with lock** on every line; `unlock` on the skipped ones. — `ORD201.PGM.SQLRPGLE:266-276`, `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:83-93`

## Validation rules found in code

- `7` refused if `datclo > 1940-01-01`; `8` refused if `datliv > 1940-01-01`; both message 35. No check on lines, header existence, or (for `8`) that anything is undelivered.

## Edge cases found in code

- **Sharpening for both twins — unchanged lines do not fire the update trigger.** `ORD700U` is `ADDPFTRG … TRGEVENT(*UPDATE) TRGUPDCND(*CHANGE)`: a line with `ODQTY = 0` and `ODQTYLIV = 0` is rewritten by `8` with no changed column, so the trigger is **not called** for it (`ord-maintain-ord200-c07` describes it as "rewritten with a zero delta" — same observable result, `ARCUSQTY` unchanged, but no `ORD700` invocation and no `UpdArt(0)` call). Recorded here; the `ORD200` card is not edited by this run. — `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8`, `ORD201.PGM.SQLRPGLE:269-271`
- **Lock wait.** `chain` on `UF` and `reade` on `UF` wait for records held by another job (an open `ORD101` session holds the header — `ord-entry-ord101-c02`), then fail unmonitored after `WAITRCD`.
- **Stale guard.** An order closed/delivered by another job (or by `ORD200`) after the load passes the screen-copy guard; the `chain` re-reads the current row and overwrites the date(s) with today.
- **Paged list.** Because `ORD201` pages, a `7`/`8` on a row loaded several `PAGEDOWN`s ago uses a copy that is that much older. Same mechanism, longer window than in `ORD200`.
- **Two-line row.** Only line 1 (`DATLIV`, `DATCLO`) changes on screen; the customer line is untouched.

## Dependencies

- `ORDER1.LF` / `ORDER.PF`; `DETORD1.LF` / `DETORD.PF` — `ORDER1.LF:4-6`, `DETORD1.LF:4-7`
- `ORD700U.SYSTRG` → `ORD700` (`ord-trigger-ord700`, documented); `ART801.SQLPRC` (`ord-trigger-ord700-c10`) — cited only
- `ord-maintain-ord200-c06`, `-c07` — the owning cards for the rule detail and the needs-SME questions

## Assumptions / unknowns

- The needs-SME questions (close-vs-deliver semantics, partial lines, `Invalid Option` wording, stale screen-copy guards) are owned by `ord-maintain-ord200-c06`/`c07`; one answer covers both twins. Listed once in this slice's `MANIFEST.yaml` as pointers so they are not silently dropped.
- Target date rule (bind record): `NULL` in Postgres for never-closed / never-delivered; `0` / `1940-01-01` only at the boundary. Recorded, not applied.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:7,10,181-190,250-278` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:44,69,83` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:177-186,244-272` · `ATU_SRC/QDDSSRC/ORDER.PF:11-14` · `ATU_SRC/QDDSSRC/DETORD.PF:10-15` · `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:83-93` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:29-33`
