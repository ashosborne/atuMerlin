# SME_BRIEF — cou-maintain (both halves: Phase B cards ready — awaiting human SME sign-off)

Status: **split bind, now complete.** The `FCOUNTRY` service-program half (`c07`–`c12`) was accepted by the room on 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) and documented by the Pack B conveyor the same day (run 7). The `COU200` OPM screen half (`c01`–`c06`, `c13`) — deferred at that bind — was accepted in the night residual wave on 2026-09-09 (`overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`, Ash authorized, Field recorded) and documented on 2026-09-09 (run 19). **13/13** candidates now have as-is cards; every row was `observed-in-code`; no `needs-SME` / `inferred` candidates were held back. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested by this station. The FCOUNTRY half has since been converted under its own pack (`atu-merlin-ts-cou-v1`, `architecture/atu-merlin-cou/`) and verified under `WAIVED_PATHFINDER`; that pack keeps the `COU200` panel half **out of scope** "until Pack B cards it and pack SUPERSEDEd" — the first condition is now met by this run; the second is the ME's / room's act, not this station's. This brief does not propose widening `atu-merlin-ts-cus-v1` or `atu-merlin-ts-cou-v1`.

Note on wording in the run-7 cards (`c07`, `c08`, `c12`) and their MANIFEST rows: they say "the deferred `COU200` panel". That was true when written and the cards were **not** edited in run 19 (job header: do not re-card `c07`–`c12`); read "deferred" there as "deferred at the 2026-09-08 bind, carded 2026-09-09".

## What was documented

**FCOUNTRY half (run 7):** the service program (2 `nomain` modules, ~325 lines, 1 window display file, 4 exports): `COU300` — `GetCountryName`, `GetCountryIso3`, `ExistCountry` over one cached keyed chain; `COU301` — the `SltCountry` keyed-read selection window with by-code / by-name toggle, position-to and single-select rules; plus the export / binding / caller surface. Cards `features/cou-maintain-c07.md` … `c12.md`.

**COU200 half (run 19):** the "Work with Countries" panel (menu option 21): one OPM RPG III program (138 lines, the only member in `QRPGSRC`), one display file, over `COUNTRY.PF` directly. Cards `features/cou-maintain-c01.md` … `c06.md`, `c13.md`. The summary level is in `MANIFEST.yaml` (`phase: B`, 13 `documented`).

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c07` — the cache key is the record buffer's own `COID`, not a saved last-key: a hit is cached (stale until a different code is requested), a miss clears the buffer first so it is never cached, a blank code never reads, and `ExistCountry(blank)` as the first call in an activation group returns `*off` from the initial `%found`. `COUNTRY` has no delete flag, so there is no `IsCountryDeleted` and "exists" means "row present".
- `c08` — `GetCountryIso3` has no caller; `COISO` is a literal `3A` (not in `SAMREF`) read and written only by the `COU200` panel (`c02`). `closeCOUNTRY` is not exported and nothing calls it, so the ODPs live for the activation group.
- `c09` — `SltCountry` is a **native keyed read** positioned at the caller's current code, 20 rows per load into a 10-row page; position beyond the last key shows the window frame with **no rows and no message**.
- `c10` — **correction to Phase A:** the "F8 clears the opposite key to `FAM301`" divergence is source-level only; on screen both windows behave identically.
- `c11` — `S01chk` and the position-to branch are byte-identical to `sltArtFam`; message texts are DDS literals, not `SAMMSGF`.
- `c12` — four exports under a literal `SIGNATURE('V1')` with no `*PRV`; `PRO200.RPGLE` has no `H` spec, so its imports resolve only because `PRO200.ILEPGM` names `FCOUNTRY` in `BNDSRVPGM`.
- `c01` — the list loads **every** row to end of file in one pass with no lock and no reload path; the `PAGEDOWN(25 'dynamic subfile')` keyword is **dead** (conditioned `N80`, and 80 is on at every `EXFMT`; `*IN25` never tested) — the workstation controller pages the extendable subfile. `Invalid Option` is a DDS literal; an invalid option anywhere defers every valid `2` on the same Enter to the next Enter; the page follows the first offending row and otherwise the row the user was on (`LRRN`). Empty file: heading, no rows, no message. Contrast `CUS200` / `PRO200`: 14 rows per pass with a `pagedown` handler.
- `c02` — `S02CHK` is `MOVE 'ACT'` and **nothing else**; `UPDAT FCOUN` runs on every Enter, changed or not. Blank name, blank / short / duplicate ISO all written; `COISO` has no `CHECK(LC)` so it is keyboard-uppercased, `COUNTR` has it. Three columns, no audit fields (contrast `CUMOD` / `CUMODID`, `ARMOD`), no commitment control. `COU200.RPG:7` is the **only** update-capable declaration of `COUNTRY` in the tree; the panel's `FMT02` is the only screen that shows or edits `COISO`.
- `c03` — indicator 98 (not found) appears once, in the indicator column, and is never read; no `INFSR`, no `*PSSR`. A row deleted after the list load → stale values shown → Enter raises an unhandled "update without prior read" exception (inquiry message); a row **locked** by another job raises before the panel even shows (no LO indicator; `WAITRCD` is a build parameter). The trigger for the deleted case is **not in the tree** (`c04`). The ILE panels test their chains; this OPM member does not.
- `c04` — **estate-wide absence:** no `WRITE` / `DELET` / SQL `DELETE` / `INSERT` / `CPYF` / `CLRPFM` on `COUNTRY` anywhere; no `CF06`; `COID` output-only on both panels; no delete flag (contrast `CUDEL`, `PRDEL`, `ARDEL`). `CUSTOMER.CUCOUN` / `PROVIDER.PRCOUN` reference the code with no RI. Countries are loaded outside the tree — unknown how.
- `c05` — list F3 and F12 are **textually identical** branches (both end the program). Edit F3 is a `GOTO` out of the subroutine to the mainline end tag. Edit F12 goes to the **next selected row** (not the list) because `STEP01` is still `'ACT'`, writes nothing, reloads nothing, and leaves the `CHAIN`ed row **locked** until the next `CHAIN` or program end.
- `c06` — the subfile row is never rewritten after an edit (the only `UPDAT SFL01` in `S01ACT` happens before the edit with the old values); rows are edited in `COID` order regardless of typing order; a typed `0` leaves a permanent `SFLNXTCHG` flag (harmless).
- `c13` — `QRPGSRC` has exactly one member; RPG/400 (uses `SELEC`, so V2R2+); `%TEXT` blank; `COU200D` carries the tree's only ARCAD `AADDSRCARC` provenance text; no compile spec; no `/COPY`, no `CALLB` / `CALLP`, no `FCOUNTRY` reference — the program is its own ODP in the default activation group, which is *why* `COU300`'s cache does not see its renames (`c07`). Same PRP / LOD / DSP / KEY / CHK / ACT state machine as the ILE panels, in fixed form.

## Sign-off checklist (human SME)

FCOUNTRY half (unchanged from run 7):

- [ ] Every accepted feature (`c07`–`c12`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggest `c07`, `c09`, `c10`).
- [ ] `c08` `GetCountryIso3` / `COISO`: carry into the target unused, or `reject` until a consumer exists? Does anything outside the tree read `COISO`? (Run 19 confirms: in-tree, `COU200` `FMT02` is the only reader / writer besides the uncalled getter.)
- [ ] `c10` Given `SltCountry` and `SltArtFam` behave identically, should the target card the keyed selector **once** rather than twice as Phase A recommended?
- [ ] `c09` Target selector: show a message when the position is beyond the last key (as-is: empty frame)? Keep the caller's current code as the position across the F8 toggle (neither legacy window does)?
- [ ] `c07` Hit-cache with no invalidation: acceptable as-is for reference data (a `COU200` rename in another job is served stale until a different code is requested)? The converted surface queries per call — confirm intended.
- [ ] `c07`/`c12` Build owner: activation group `CUS200` / `CUS250` / `PRO250` compile into; has `'V1'` ever been bumped; target library of `FCOUNTRY` relative to the callers.
- [ ] `c12` Is `PRO200`'s explicit `BNDSRVPGM(FCOUNTRY)` (no `H` spec) intentional or a build artefact?

COU200 half (run 19):

- [ ] Every accepted feature (`c01`–`c06`, `c13`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggest `c01` for the dead `PAGEDOWN`, `c05` for the F12 lock, `c06` for the stale row).
- [ ] **`c13` (room) — the slice's main question:** retire-and-replace (a thin target maintain form: list + edit name / ISO, plus whatever create / delete is decided under `c04`) **versus convert** the 138-line OPM program. The cards give the inputs (one operation, no validation, unguarded concurrency, no create / delete, key quirks, stale list); the room decides. Related: the COU pack's "until Pack B cards it and pack SUPERSEDEd" condition — carded now; does the ME propose a superseding pack version, or does `country` stay read-only in the target?
- [ ] `c02` (room / product owner): does the target need **ISO-3 validation** (format, uniqueness, consistency with the 2-character code)? As-is: none. Is an unaudited, unconfirmed edit of reference data acceptable given the converted CUS / ORD / PRO surfaces read the name through `GetCountryName`?
- [ ] `c04` (room / product owner): create / delete (or a soft-delete flag) for countries in the target, or a fixed reference table maintained by data load? As-is the estate has no create / delete **anywhere** — a target adding them adds behaviour, not converts it.
- [ ] `c04` (data owner): how do countries reach `COUNTRY` on the box? Is there an out-of-tree loader (SQL script, DFU, `CPYF` from a master) that belongs to the estate?
- [ ] `c03` / `c05` / `c06` (room, target presentation — one line each, as-is in brackets): re-validate row existence / detect a concurrent change before writing [no]; release the row on cancel [no]; return to the list after each save / cancel rather than the next selected row [no]; list F12 = exit [yes]; reflect the edit in the list at once [no].
- [ ] `c02` / `c03` (build owner): `WAITRCD` of `COUNTRY`; `CRTRPGPGM` options for `COU200` (no compile spec in the tree).
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance for **both halves** (no waiver artefact, no Conversion unlock; the COU pack's own `WAIVED_PATHFINDER` covers the FCOUNTRY half and is not extended by this slice).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `cou-maintain` (both halves).

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c13` retire-and-replace vs convert `COU200`; ME: supersede the COU pack with a maintain surface, or leave `country` read-only.
2. `c02` ISO-3 validation; unaudited edit of reference data.
3. `c04` create / delete / soft-delete in the target; out-of-tree loader.
4. `c03` / `c05` / `c06` target presentation choices (existence re-check, lock on cancel, return-to-list, list F12, live list refresh).
5. `c02` / `c03` build: `WAITRCD`, `CRTRPGPGM` options.
6. `c08` `GetCountryIso3` / `COISO` — unused export: carry or reject.
7. `c10` one selector rule for `SltCountry` / `SltArtFam`.
8. `c09` empty-position message; position across toggle.
9. `c07` / `c12` activation group of three callers; signature policy; library.
10. `c07` cache staleness acceptable / read-through in the target.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Split `FCOUNTRY` from `COU200`? (Phase A recommendation) | **Yes, then rejoined:** room accepted `c07`–`c12` on 2026-09-08 and `c01`–`c06`, `c13` on 2026-09-09. Both halves now carded under one slice id; the FCOUNTRY half was converted in between under its own pack, which excludes the panel half. |
| `COU200` target (retire-and-replace vs convert) | Carded as `c13` with the inputs; **not decided** — room. |
| Window template (`SltCountry` vs `SltArtFam`) | Phase A: "card separately" because of `c10`. Phase B finds the behaviour identical; carried as needs-SME for the `fam-maintain` bind. |
| No delete flag | Documented in `c07` (`ExistCountry` = row present) and `c04` (no create / delete anywhere; contrast `CUDEL` / `PRDEL` / `ARDEL`). |
| Callers `CUS200` / `CUS250` / `PRO200` / `PRO250` | Cited as call sites and for what they do with the result (`c07`, `c09`, `c12`); not deepened here. |
| Converted COU / CUS dependency surface (`modern/src/shared/fcountry/`, `country` table) | Pointer only in `c02` / `c04` / `c07` / `c08` / `c09` / `c12` / `c13`; not changed; neither pack widened. |
| Out-of-tree loading of `COUNTRY` | Out of scope (not in source); recorded as the `c04` data-owner question. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md` (both halves). Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, re-card or edit `c07`–`c12`, widen `atu-merlin-ts-cus-v1` / `atu-merlin-ts-cou-v1` or any other pack, or edit `ATU_SRC/**`.
