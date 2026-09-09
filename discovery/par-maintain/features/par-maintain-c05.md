# par-maintain-c05 — Option 4 immediate delete, no confirmation (the `*** Deleted ****` marker never reaches the screen)

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `4` deletes the row **by key, immediately**, with no confirmation panel and no message: `delete (pacode:pasubcode) parameter`. The subfile row is then rewritten with blank `Code`, `Sub-Code` and `1`; the program also sets `parm2 = '*** Deleted ****'` — but `PARM2` is **not a field of `SFL01`** (the list shows the 32-char copy `PARM2S`), so the marker is never displayed. Phase A corrected: on screen the deleted row shows blank key and `1`, and the **old** `2`, `3`, `4`, `5` values. Several `4`s are processed one per cycle pass in RRN order. A key that no longer exists deletes nothing and raises nothing (`DELETE` by key sets `%found` off) — so a `4` on a ghost row is silent, unless a blank/blank row exists, in which case **that** row is deleted.

## Entrypoints

- `s01act` `when opt01 = 4` — `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:185-192`
- Option accepted by `s01chk` (`opt01 = 4`) — `PAR200.PGM.RPGLE:159`
- `SFL01` field list (no `PARM2`) — `ATU_SRC/QDDSSRC/PAR200D.DSPF:13-28`

## Inputs / outputs / observables

- In: `PACODE` / `PASUBCODE` of the changed row (`readc sfl01`). — `PAR200.PGM.RPGLE:176`
- Out: the `PARAMETER` row removed; the subfile row rewritten: `OPT01 = 0`, `PACODE` / `PASUBCODE` / `PARM1` blank, `PARM2S` / `PARM3` / `PARM4` / `PARM5` **unchanged** (still the deleted row's values). — `:187-192`
- Observable: no confirmation, no message, no `More…` change; the row stays on screen as a blank-key ghost until F5.

## Behaviour as implemented

1. `readc(e) sfl01` → row fields. — `:176`
2. `delete (pacode:pasubcode) parameter` — keyed delete on the `uf a` file; no prior `chain`, no `(e)`, no `%found` test. — `:186`
3. `clear pacode; clear pasubcode; clear parm1; parm2 = '*** Deleted ****'; opt01 = 0; update sfl01` — `sflnxtchg` is off in `s01act`, so the row's modified-data tag is cleared; `PARM2S` is not reassigned; `PARM2` is not in the record. — `:187-192`, `PAR200D.DSPF:16-28`
4. Next cycle pass: `readc` again → next `4` (or `2`), until `%eof` → `dsp` on the cursor's page. — `:175-179`

## Validation rules found in code

None. No confirmation, no "in use" check (the `PATH` row can be deleted while `ORD500` / `PRO202` / `PRO203` / `PAR201` depend on it — `c11`), no authority check beyond object authority on the file.

## Edge cases found in code

- **Ghost row.** The blanked row remains selectable: `2` → chain miss → `update` exception (`c04`); `4` → `delete (' ':' ')` → silent no-op, **or deletes the blank/blank row if one exists** (`c02` allows creating it). The rewrite sequence runs again either way.
- **Not found is silent.** Deleted by another job first → `%found` off, no message, row blanked as if deleted. — `:186`
- **Locked by another job.** `delete` by key waits `WAITRCD` for a row held by another `PAR200` session in `FMT02`/`FMT03`-duplicate (`c04`, `c02`); timeout → RPG status 01218 unmonitored (inference).
- **Deleting `PATH`.** Immediate for `PAR200`; running jobs that already read `PATH` keep the cached value until their activation group ends, jobs that read it afterwards get blanks (`c08`, `c09`).
- **The marker is dead text.** `'*** Deleted ****'` lives only in the program buffer; it can surface as the `PARM2` value on `FMT02` if the very next changed row is a `2` whose `chain` misses (`c04`), never on the list.
- **Duplicate subfile row** from `c03`: `4` on the first copy deletes; `4` on the second is the silent not-found case.

## Dependencies

- `PARAMETER.PF` `UNIQUE (PACODE, PASUBCODE)`, no delete flag — physical delete only (`c12`) — `ATU_SRC/QDDSSRC/PARAMETER.PF:4,13-14`
- `PAR200D.DSPF` `SFL01` — `PAR200D.DSPF:13-28`

## Assumptions / unknowns

- `DELETE` with a search argument setting `%found` off on no match (no exception) and the 01218 timeout surface are RPG rules, runtime-confirmable. The screen outcome (blank key, old values, no marker) follows from the DDS field list — static, high confidence.
- needs-SME: unconfirmed physical delete of the one live setting — acceptable as-is if the screen is kept? Phase A open question 2 stands.
- Phase A statement corrected: `CANDIDATES.md` row `c05` "row rewritten blank with `PARM2 = '*** Deleted ****'`" — the assignment exists, the display does not. Recorded here, in `MANIFEST.yaml` and in `SME_BRIEF.md`; `CANDIDATES.md` left as the Phase A record.

## Evidence

`ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:5,153-196` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:13-28` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`
