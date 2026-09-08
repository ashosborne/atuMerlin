# ord-entry-ord101-c06 — Delete line

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `4` (after the `c05` guard) deletes the `DETORD` row by key `(ORID, ODLINE)`, subtracts the row's `ODTOT` and `ODTOTVAT` from the footer totals, and rewrites the subfile row blanked with the description `**** Delete ***` (line number kept; row stays on screen until `F5`). Unlike `ORD100`, `ODTOTVAT` **is** a hidden subfile field here, so the footer stays correct after a delete. No confirmation; several `4`s are processed in one pass. The delete fires the `ORD700` delete trigger if attached (`c11`).

## Entrypoints

- Option `4` on `SFL01` → `s01chk` (valid, `ODQTYLIV = 0`) → `s01act` `when opt01 = 4` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:155,164,188-198`
- `SFL01` hidden fields `ODQTYLIV`, `ODTOTVAT` — `ATU_SRC/QDDSSRC/ORD101D.DSPF:26-27`

## Inputs / outputs / observables

- In: the changed row from `readc(e) sfl01` — `OPT01 = 4`, `ODLINE`, `ODTOT`, hidden `ODTOTVAT`. — `ORD101.PGM.RPGLE:181`
- Out (file): `delete (id:odline) detord1`. — `ORD101.PGM.RPGLE:191`
- Out (screen): `tot -= odtot; totvat -= odtotvat`; row rewritten with `OPT01 = 0`, `ODARID = ' '`, `ODQTY = 0`, `ODPRICE = 0`, `ODTOT = 0`, `ARTDESC = '**** Delete ***'` (`ODLINE` unchanged; hidden `ODQTYLIV`, `ODTOTVAT` **not** cleared). — `ORD101.PGM.RPGLE:189-198`
- Footer `TOT` / `TOTVAT` on `KEY01` reflect the new totals at the next display. — `ORD101D.DSPF:87-89`, `ORD101.PGM.RPGLE:126`

## Behaviour as implemented

1. `s01act`: `readc(e) sfl01` returns the next changed row; `when opt01 = 4`. — `ORD101.PGM.RPGLE:180-183,188`
2. `tot -= odtot; totvat -= odtotvat` — both from the subfile row (`ODTOTVAT` hidden). — `ORD101.PGM.RPGLE:189-190`
3. `delete (id:odline) detord1` — full key of the `UNIQUE` logical, no prior read, `%found` not tested (not-found is not an exception for `DELETE` by key). — `ORD101.PGM.RPGLE:191`, `ATU_SRC/QDDSSRC/DETORD1.LF:4-7`
4. Row blanked and `update sfl01` with `SFLNXTCHG` off → no longer "changed". — `ORD101.PGM.RPGLE:192-198,177`
5. `step01` stays `act`; the next cycle pass `readc`s the next changed row, so consecutive `4`s (and `2`s — `c03`) are processed without redisplay; at `%eof` → `step01 = dsp` and the list is **redisplayed, not reloaded**. — `ORD101.PGM.RPGLE:78-93,183-184`

## Validation rules found in code

- Only the `c05` guard (`ODQTYLIV > 0`) and option validity (`c07`). No confirmation step; deleting the last line leaves an order header with zero lines.

## Edge cases found in code

- **No `TOTVAT` drift on a straight delete** — correction to the `ord-entry-ord100-c05` pattern: `ORD101D` declares `ODTOTVAT` as a hidden subfile field, so the subtraction uses the row's own value. — `ORD101D.DSPF:27`
- **Second `4` on a blanked row.** The row is still selectable. `tot -= 0` (correct) but `totvat -= odtotvat` subtracts the **uncleared hidden value again**, so `TOTVAT` drifts low by one line's VAT-inclusive total; the `delete` finds nothing (silent); `c05` still applies if the line had deliveries. `F5` recomputes from the file. — `ORD101.PGM.RPGLE:189-198`
- **Delete after edit in the same session.** `c03` rewrites the row with the new `ODTOT` / `ODTOTVAT` but does not adjust the footer, so a subsequent delete subtracts new values from an old footer: `TOT` / `TOTVAT` end up off by the edit delta. — `ORD101.PGM.RPGLE:264-275`
- **Option `2` on a blanked row** → `c03` chain-miss / `update` exception path.
- **Stale screen.** The guard and the delete both act on the screen copy / key; a line delivered by another job after the load can be deleted (`c05`).
- **Trigger side effect.** `DETORD` `*DELETE` trigger `ORD700` (`ORD700D.SYSTRG`) runs `UpdArt(−old.odqty + old.odqtyliv : old.odarid)` and writes a log entry — owned by `ord-trigger-ord700-c03`; attachment on the box is `c11` (needs-SME). — `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7`, `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:81-82`
- **Line numbers are not renumbered** after a delete (gaps stay; new lines can only come from `ORD100` at creation — `c10`).
- **No commitment control**; each delete is its own I/O. — `ORD101.PGM.RPGLE:9`

## Dependencies

- `DETORD1.LF` (`UNIQUE`, `ODORID, ODLINE`) — `DETORD1.LF:4-7`
- Subfile hidden fields and `readc` / `SFLNXTCHG` mechanics — `ORD101D.DSPF:14,26-27`, `ORD101.PGM.RPGLE:47,177`
- `ord-trigger-ord700` (delete trigger) — pointer.

## Assumptions / unknowns

- needs-SME: no confirmation and zero-line orders after deleting the last line — accepted as-is?
- Display-only defect (double subtraction on a re-selected blank row): preserve vs fix is a later-station decision; recorded here so the target does not inherit it silently.

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:9,47,78-93,155,164,177,180-198,264-275` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:14,26-27,87-89` · `ATU_SRC/QDDSSRC/DETORD1.LF:4-7` · `ATU_SRC/QTRGSRC/ORD700D.SYSTRG:4-7` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:81-82`
