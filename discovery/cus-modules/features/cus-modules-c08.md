# cus-modules-c08 — Criteria change re-prepares; F3/F12 return default

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

After a clean option check, `S01act` compares the on-screen criteria with those saved at the last prepare; any difference closes cursor `C1` and restarts at `prp` (new statement, cleared subfile), discarding any option `1` typed on the old list. F3 and F12 leave the state machine immediately and return the `pcod` passed in, unchanged.

## Entrypoints

- `S01act` — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:211-227`; criteria saved in `s01prp` — `:116-117`
- `S01key` exit/cancel — `:157-160`; loop exit → `close c1; return dft` — `:92-93`; `dft = pcod` — `:75`
- `CA03(03)` / `CA12(12)` — `ATU_SRC/QDDSSRC/CUS301D.DSPF:11-12`

## Inputs / outputs / observables

- `SRCHNAME`/`SRCHCITY` (10A each) vs `savName`/`savCity`; `exit` (03) / `cancel` (12) indicators.
- Out: either a rebuilt result set (`Step01 = prp`), a returned `CUID` (selection), a redisplay, or `return dft`.

## Behaviour as implemented

1. `Step01 = dsp` (default: redisplay). — `CUS301.SQLRPGLE:212`
2. `when savName <> srchName or savCity <> srchCity` → `Step01 = prp; exec sql close c1;` — the whole `prp` path runs again: subfile cleared, statement rebuilt from the new text, first row fetched. **This branch is tested before the selection branch**, so a changed criterion wins over an option `1` on the old list. — `:214-216`
3. `other` → `readc(E) SFL01` loop; first row with `OPT01 = 1` → `exec sql close c1; return cuid;` (`c06`). No `1` found → stays `dsp`. — `:217-226`
4. F3 / F12 in `S01key` → `step01 = ' '` → `dow` ends → `exec sql close c1; return dft;` where `dft` was set from `pcod` at entry and never modified. Both keys behave identically. — `:75-76,92-93,157-160`

## Validation rules found in code

None on the criteria text (length is bounded by the 10A fields; content is passed through — `c09`).

## Edge cases found in code

- **Exact compare.** Fixed-length 10A comparison: trailing blanks are irrelevant, a leading blank or any changed character counts as a change (the terminal has already uppercased the input — `c06`).
- **Criteria + invalid option together.** `S01chk` fails first → redisplay of the **old** list with the new criteria still typed (they are display-file fields); they apply on the next clean Enter. — `:168-209`, `:214`
- **Criteria + Page Down.** `S01key` sends Page Down straight to `lod` (no `act`), so the next page of the *old* result set is shown while the new criteria remain on screen; the change is applied only on Enter/F8. — `:161-162`
- **F3/F12 discard input.** Both are `CA` keys, so no field data is returned; the criteria fields keep their previous program values and, because the display file stays open, reappear on the next call (`c06`).
- **Return value on cancel.** `ORD100` passes `0` and treats `0` as abort; `CUS250` passes its current id, so cancel keeps the id. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:321-324`, `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:86`
- `exec sql close c1` is issued without a status check on every exit path; if the cursor is not open (e.g. after a failed `PREPARE`) the SQL error is ignored. — `:92,216,221`
- The `select` in `S01act` has no branch for "criteria unchanged and nothing selected" beyond falling back to `dsp`; a plain Enter is a no-op redisplay on the same page (`RRB01 = LRRN`, `c06`). — `:151`

## Dependencies

- `ATU_SRC/QDDSSRC/CUS301D.DSPF:11-12,56-57`; SQL cursor `C1` (`CUS301.SQLRPGLE:119-121`)

## Assumptions / unknowns

- None. Phase A summary confirmed from source; precedence of criteria-change over selection added.

## Evidence

`ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:75-76,92-93,116-117,151,157-162,211-227` · `ATU_SRC/QDDSSRC/CUS301D.DSPF:11-12,56-57` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:321-324` · `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:86`
