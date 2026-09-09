# cou-maintain-c03 — `CHAIN` not-found indicator 98 in `S02PRP` is never tested: a row deleted between list and edit is shown with stale values and Enter attempts `UPDAT` without a locked record (unhandled RPG exception)

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`S02PRP` does `COID CHAIN COUNTRY` with HI indicator 98 (record not found) and nothing in the program reads `*IN98`. The panel-1 list was loaded without locks (`c01`), so between the load and the option-2 `CHAIN` the row could be removed by another process. If it is, the `CHAIN` fails, leaves the record buffer unchanged (the subfile's values for that row are still in the same program fields), `FMT02` displays those stale values as if the read had succeeded, and Enter runs `UPDAT FCOUN` with no record locked — an RPG runtime exception. `COUNTRY` has no `INFSR` and the program has no `*PSSR`, so the default exception handler issues an inquiry message to the interactive user. The window is real but the trigger is not in the tree: no in-tree program deletes a `COUNTRY` record (`c04`), so the failure needs an out-of-tree delete (SQL, DFU, `CLRPFM`) or a data restore while `COU200` is on the list. Recorded as an unguarded path, not as a defect anyone has hit.

## Entrypoints

- `S02PRP` — `ATU_SRC/QRPGSRC/COU200.RPG:109-112`
- `S02ACT` — `COU200.RPG:130-133`

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| The read | `COID      CHAINCOUNTRY              98` — `COID` in factor 1, HI indicator 98 in columns 54–55 (not found); no LO indicator (error) | `COU200.RPG:111` |
| Uses of 98 | none — the only occurrence of `98` in the member is the indicator column of that line | structural grep of `COU200.RPG` |
| Error handling | `FCOUNTRY UF E K DISK` with no `INFSR`; no `*PSSR` subroutine; `KINFDS` only on the display file | `COU200.RPG:4-7`; structural grep for `INFSR` / `*PSSR` (none) |
| Observable (not found) | `FMT02` shows the code / name / ISO from the subfile row; Enter → inquiry message from the RPG runtime (the message id is platform: RPG/400 "update without prior read" class — inference) | `COU200.RPG:111-114,131` |

## Behaviour as implemented

1. `S02PRP`: `STEP02 = 'DSP'` first, then the `CHAIN`. The step is advanced regardless of the result. — `COU200.RPG:110-111`
2. `S02DSP`: `EXFMT FMT02` — displayed regardless of the result. — `COU200.RPG:113-116`
3. `S02KEY` / `S02CHK`: no test of 98 (or anything). — `COU200.RPG:117-129`
4. `S02ACT`: `UPDAT FCOUN` — issued regardless of the result. — `COU200.RPG:130-133`

## Validation rules found in code

- None. There is no `*IN98` test, no `%found` equivalent, no re-read, no message for a missing row.

## Edge cases found in code

- **Not found (row deleted after load).** `CHAIN` fails: input fields unchanged (platform — inference), so the screen shows the subfile's snapshot; F12 / F3 leave cleanly (no I/O); **Enter** raises the exception. Because `PANEL` is still 2 and `STEP02` is `'ACT'` when the handler runs, a `G` (continue) reply to the inquiry would return to the mainline loop at `PNL02` → `S02ACT` again — the same `UPDAT`, the same exception (platform behaviour of the inquiry-message replies — inference; `C` cancels the program). — `COU200.RPG:12-17,101-108,130-133`
- **Record locked by another job.** A locking `CHAIN` on a row held by another `COU200` user (or any job holding it) waits `WAITRCD` and then raises a record-lock exception. That is the **LO** indicator's case; the `CHAIN` has none, so the outcome is the same inquiry message — before `FMT02` is even shown. `WAITRCD` is a `CRTPF` parameter not in the DDS (build unknown). — `COU200.RPG:111`; `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10`
- **Row changed (not deleted) after load.** Not an error: the `CHAIN` succeeds and `FMT02` shows the **current** file values, which may differ from the list row the user chose from. The user edits on top of the other job's change with no warning (last writer wins). — `COU200.RPG:111,131`
- **Why the trigger is not in the tree.** `COU200` is the only member that declares `COUNTRY` for update (`UF`); `COU300` / `COU301` declare it `IF`; no `WRITE` / `DELET` / SQL `DELETE` / `CPYF` / `CLRPFM` touches it anywhere in `ATU_SRC` (`c04`). — structural grep; `COU200.RPG:7`; `ATU_SRC/QRPGLESRC/COU300.RPGLE:6`; `ATU_SRC/QRPGLESRC/COU301.RPGLE:6`
- **Contrast with the ILE maintain panels.** The estate's ILE programs test their chains (`%found` — e.g. `COU300.RPGLE:46,60`, and the `cus-interactive` / `pro-interactive` edit paths cited in their cards); this OPM member is the one that does not.

## Dependencies

- `c01` (no-lock list load), `c02` (the edit path this guards — or fails to guard), `c04` (absence of any delete path), `c05` (F3 / F12 exits that avoid the `UPDAT`)
- `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10`

## Assumptions / unknowns

- Platform (inference / runtime-confirmable): a failed `CHAIN` leaves the input fields unchanged; `UPDAT` without a prior successful read on the file raises an exception (RPG/400 `RPG1221`-class message — the exact id is not in the tree); with no `INFSR` / `*PSSR` the default handler presents an inquiry message with `C` / `D` / `F` / `G` / `S` replies; record-lock wait and exception on a locking `CHAIN`.
- Build: `WAITRCD` of `COUNTRY`.
- **needs-SME (room, target):** should a target edit re-validate that the row still exists (and detect a concurrent change) before writing? As-is: no. Low stakes for reference data with no delete path; recorded for completeness.

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:4-7,12-17,101-108,109-112,113-116,117-129,130-133` · `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:6,46,60` · `ATU_SRC/QRPGLESRC/COU301.RPGLE:6` · structural grep of `COU200.RPG` for `98` (1 hit — the indicator column), `INFSR`, `*PSSR`, `IN98` (none) · structural grep of `ATU_SRC/**` for update-capable declarations of `COUNTRY` (1 — this member)
