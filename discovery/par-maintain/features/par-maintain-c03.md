# par-maintain-c03 — List not refreshed after create (appends the next page; duplicates the last row after Bottom)

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — display quirk) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

F6 sets `step01 = lod` before leaving for `FMT03`; when `panel` returns to 1 (after a write, F3 or F12) the list does **not** clear and reload — it runs `s01lod`, i.e. **exactly what Page Down does**: `setll` on the saved key and append the next 14 rows as a new page, which the display then shows. The created row is visible only if its key sorts inside that appended page; otherwise F5 or re-entry. Phase A sharpened: when the list was already at `Bottom` the saved key is the **last displayed row** (RPG leaves the buffer unchanged at end of file), so the appended "page" begins with a **second copy of that row** — one duplicate per F6 round-trip. The same happens when F6 is cancelled with F3/F12.

## Entrypoints

- `s01key` `when create; panel = 3; step01 = lod;` — `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:145-147`
- `S03act` / `S03key` return with `panel = 1` and `step01` untouched — `PAR200.PGM.RPGLE:278-288,301-305`
- `s01lod` / `s01rst` / `s01sav` — `PAR200.PGM.RPGLE:92-119`

## Inputs / outputs / observables

- In: `savid1` / `savid2` / `rrs01` as left by the last load (`c01` step 4) — `PAR200.PGM.RPGLE:40-41,33,115-119`
- Out: up to 14 more subfile rows appended after `rrs01`; `RRB01 = rrs01 + 1` so the display jumps to the appended page; `sflend` recomputed. — `:94,105`
- Observable: after creating a row and pressing Enter the user is taken to a page **after** the one they were on, possibly showing a row twice and possibly not showing the new row.

## Behaviour as implemented

1. List at page *n* (not at `Bottom`): the saved key is the look-ahead 15th record. F6 → create → return → `s01rst` positions there → 14 rows appended → the display shows them (as after a Page Down). The new row appears if its key lies within those 14. — `:92-107,110-113`
2. List at `Bottom` (`sflend` on): the last `read(n)` hit end of file, the buffer still holds the **last displayed** record, and `s01sav` stored that key. Return from F6 → `setll` on it → `read(n)` reads it again → appended as a new row → the loop continues to end of file (picking up the new row if it sorts after that key) → `Bottom` again. Each F6 round-trip at `Bottom` adds one duplicate of the former last row. — `:97-107,115-119`
3. Empty file: saved key blank → `setll` blank → the new row (if any) is read from the start and shown; no duplicate (there was no row to duplicate). — `:87-88,111`
4. F5 (`prp`) is the only way to see the file as it is: clears the subfile, resets the saved key, reloads from the top. — `:81-90,143-144`

## Validation rules found in code

None — no re-read of the created key, no attempt to position the list on it.

## Edge cases found in code

- **New key lower than the current page.** Never shown until F5 (rows before the saved key are never re-read).
- **Duplicate subfile row is a display artefact only.** Both copies carry the same key; option `2` on either edits the same record; option `4` on the second after the first deletes nothing (`c05`, silent) and blanks it.
- **Options typed before F6** survive in the subfile (`CF06` returns data, no `readc` on this path) and run on the next Enter (`c01`).
- **Cancel counts too.** F3/F12 on `FMT03` also return to `lod` — cancelling a create still pages the list forward (and duplicates at `Bottom`). — `:280-285`
- The edit path (`c04`) has no such effect (`step01` stays `act`); its stale-row problem is different (values not rewritten).

## Dependencies

- `c01` load/save idiom; `PAR200D.DSPF` `SFLRCDNBR RRB01`, `SFLEND(*MORE)` — `ATU_SRC/QDDSSRC/PAR200D.DSPF:38,42`

## Assumptions / unknowns

- "`READ` at end of file leaves the record buffer unchanged" is an RPG rule, not source; the duplicate-after-`Bottom` consequence is runtime-confirmable (create any row while `Bottom` is displayed).
- needs-SME: as-is quirk. Preserve (not worth carrying), or note for the target that a create should re-query. Recommendation unchanged from Phase A: preserve-as-is only if the screen is kept at all (`c11`).

## Evidence

`ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:33,40-41,81-119,143-147,278-288,301-305` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:33,38,42`
