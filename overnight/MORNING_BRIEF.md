# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 11 · 2026-09-08 23:20–23:55 UTC (00:20–00:55 Europe/London, 2026-09-09)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `f193828`
Previous briefs preserved in git: Pack B run 10 at `60d3d61:overnight/MORNING_BRIEF.md`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`ord-maintain-ord202`** (job preference: first of the two remaining ORD-wave slices). `ORD202(orid)` — the read-only order display called by option `5` in both list twins: one RPGLE program (156 lines) + one DSPF (`CTL01`/`SFL01`/`KEY01`), 1 surface, 6 candidates. Bound in the ORD-wave room bind (`overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`; `discovery/ord-maintain-ord202/BIND.md`): `c01`–`c06` accepted, nothing needs-SME or blocked. `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; no ORD Architecture pack was drafted (job header: that comes after the five are carded, with `ROOM_OK`).

## 2. Cards written / needs-SME left

- **6 / 6** accepted behaviours now have as-is behaviour cards: `discovery/ord-maintain-ord202/features/ord-maintain-ord202-c01.md` … `c06.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 6 `documented`.
- **0** `inferred` candidates in this slice; **0** `blocked`. Auto-accept policy not exercised.
- **8 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c01` / `c04` — **a not-found order id crashes the display before anything is shown.** `chain id order1` is never `%found`-tested and the creation date is converted unconditionally, so a miss leaves `ORDATE = 0` and `%date(0:*iso)` raises an unmonitored date exception (inquiry message in the list program's session). Both list twins can trigger it: option `5` on the ghost row after a delete (`ORD201` blanks to `orid 0`, `ORD200` leaves the deleted id), or on an order deleted by another job since the load. Neither guards option `5`. This is the "ghost-`orid` not-found handling" pointer runs 9 and 10 left for this slice — answer: there is none. `ORD500` (next in the queue) has the identical unguarded conversion, so one room answer covers both.
  - `c02` / `c05` — **the article description is hidden until `F11`.** `SFLDROP(CF11)` shows the subfile truncated first (line 1 of each two-line record, 12 per page); `F11=Detail` folds it (6 per page). Phase A described the folded form as the display.
  - `c05` — **two Phase A statements corrected.** There is **no option column** (every field is output-only; "option field unused" → none exists). **Paging is not missing**: `SFLSIZ(7) ≠ SFLPAG(6)` auto-extends the subfile and the display rolls it (no `PAGEDOWN` keyword), and that inequality is also what permits `SFLDROP`. Phase A's open question "orders with more than 7 lines — what does the user see?" is answered from the DDS contract: all of them, paged by the display, `More...`/`Bottom`. Concern withdrawn; exact page counts runtime-confirmable.
  - `c02` / `c06` — **a missing article repeats the previous line's description** (bare `chain`, buffer not cleared). `FARTICLE.GetArtDesc`, used by `ORD100`/`ORD101` for the same lookup, clears first and returns blank. Two estate rules for one fact; the room picks one for the target.
  - `c03` / `c05` — **`F5` and `F6` exit.** Both enabled (`'Refresh'`, `'Create'`), neither indicator tested, neither in the legend; Enter exits too; `F3` = `F12`.
- Other facts recorded in the cards (as-is, cited): footer `TOT`/`TOTVAT` are sums of the **stored** line totals, never recomputed; `EDTCDE(2)` shows zero as blank so an undelivered line has an empty `Deliver` column (`c02`); dates are `dd/mm/yy` (`*DMY`) with `MAPVAL('01/01/40')` blanking delivery/close — the list twins use `*JOB`/`'1940-01-01'`; the implicit sentinel is the `*inzsr` preset simply not being overwritten, which works because every call ends with `*inlr`; the `> 0` guards are zero tests, not validity tests (`c01`); `bnddir('SAMPLE')` is inert — no `/COPY`, no prototype, no bound call — so `ORD202` has no service-program dependency, and the customer lookup bypasses `FCUSTOMER.GetCusName` the same way (`c06`); exactly two call sites in the tree, no menu/CMD/CL (`c04`); panel id `'ORD202-1'` is its own (`c04`); template residue — `SFLNXTCHG`, `SFLMSG('Invalid Option')`, `ERRSFL`, dead `SFLRCDNBR` copy, eleven dead scalars/indicators (`c01`, `c05`).
- Pointer-only observations left for other binds (not deepened): `ORD500`'s unguarded `%date(ORDATE)` and its `ORD500C` wrapper (`ord-print-ord500`, next); `FARTICLE` last-key cache and miss semantics (`art-modules`, unbound); `GetCusName` (`cus-modules`, documented); `ORDERCUS` inner join making orphaned orders unreachable via the lists (`sql-objects`, unbound).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-maintain-ord202/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The CUS pack's `WAIVED_PATHFINDER` is **not** extended. The note lists what a future RECORD would capture (truncated and folded screens, `More...`/`Bottom` for >12 lines, footer against stored sums and `ORDERCUS.TOTVAL`, blank `Deliver`/date cells, the empty order, the missing-article description, `F5`/`F6`/Enter exits, and — first — option `5` on a ghost row in each list) and the two facts to settle first (build definition / activation group; whether any sample order has a zero or invalid `ORDATE`).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-maintain-ord202`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 100 | **106** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8 + `cou-maintain` 6 + `ord-entry-ord101` 11 + `ord-maintain-ord200` 12 + `ord-maintain-ord201` 11 + `ord-maintain-ord202` 6) |
| behaviours `candidate` | 161 | 155 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` | 22 / 39 / 3 | **23** / 38 / 3 (`pgm:ORD202` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-maintain-ord202`: 1 surface, 6 behaviours, **6 documented**, weakest status `documented`.
- **Bind mirror gap (one slice left):** `pgm:ORD500`/`cl:ORD500C` still read `candidate` in `APP_MANIFEST.yaml`; the `ord-print-ord500` run mirrors them (cap 1). INDEX row 10 reads `accepted` from the bind record with that caveat in the header.
- `docs/estate/INDEX.md`: row 9 `ord-maintain-ord202` → **done** with the headline findings (deps column notes "no service program" and the two callers); header line notes run 11.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 10).

## 5. Remaining accepted undocumenteds (queue for next run)

One: **`ord-print-ord500`** (7 accepted; `c04` needs-SME, `inferred` — stays without a card). Re-run this paste (set `AGENT_JOB.md` line 1 back to `RUN`). Concrete pointers for the `ORD500` run: `ORD500.PGM.RPGLE:30-33` presets `datord = %date()` then `chain id order1` (untested) then `datord = %date(ORDATE:*iso)` — the same not-found exception as `ORD202`, now on the print path with `ORD500C` (PDF wrapper) downstream; `ORD500` has no `H`-spec `bnddir` and `/COPY`s `PARAMETER.RPGLEINC` (`FPARAMETER` for `PATH`); 14-line page break at `count > 14`.

After `ORD500` is carded the five ORD slices of the 2026-09-08 bind are done and the job header's next step applies: **ME drafts the new ORD Architecture pack (`ROOM_OK` then)**.

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, and now `ord-maintain-ord202`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; this run does not draft or widen any Architecture pack (`atu-merlin-ts-cus-v1` untouched; the ORD pack is a later, new pack behind `ROOM_OK`). `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08). `ORD200`/`ORD201` (callers), `ORD500` (twin conversion), `ORD100`/`ORD101` (`GetArtDesc`/`GetCusName` call sites), `ART300` (`FARTICLE` body), `SAMPLE.BNDDIR`, `ORDER`/`ORDER1`/`DETORD`/`DETORD1`/`CUSTOMER`/`CUSTOME1`/`ARTICLE`/`ARTICLE1`/`SAMREF` DDS and `ORD200D`/`ORD201D`/`ORD101D` were cited as call sites, contrasts or field definitions only — their slices were not deepened and no card outside `discovery/ord-maintain-ord202/` was edited.
- Did **not** fix any planted or found defect (unguarded `%date` on a not-found id, stale description on a missing article, dead `F5`/`F6`, template residue) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-maintain-ord202-cNN` (same decision as runs 1–10; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- The Cloud Agent VM checked out a scratch branch (`cursor/atumerlin-job-runner-process-5f26`) at `f193828`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Several `c02`/`c05` statements (auto-extend, display-side paging, truncated-first form, 12/6 records per page, `More...`/`Bottom`) are the documented IBM i DDS contract for `SFLSIZ ≠ SFLPAG`, `SFLEND(*MORE)` and `SFLDROP`, not visible in the RPG; the IBM i 7.3 DDS reference was consulted and is cited in `CONTEXT_GATE.md`. Flagged runtime-confirmable on the cards and in `needs_sme`.
- The exception surface for a not-found id (status 00112 → `RNQ0112` inquiry in the caller's session, cancel unwinding through the list program) is an ILE RPG runtime inference from the unguarded `%date` and the absence of any handler; flagged as such (`c01`, `c04`).
- Three Phase A statements corrected (no option column; paging present; description hidden until `F11`) — recorded in `SME_BRIEF.md`; `CANDIDATES.md` left as the Phase A record.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. One accepted slice still undocumented (ORD wave). Estate scan still partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; deferred slices per the bind records.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 to `RUN` to re-fire the conveyor on `ord-print-ord500` (last of the five). **Room:** the not-found-order question (`c01`/`c04` here; the same line in `ORD500`) is the one ORD-pack input this run adds — worth deciding alongside the "which twin is the parity reference" question from run 10 before the ORD pack is drafted. After `ORD500`, ME drafts the new ORD Architecture pack (`ROOM_OK`). **SME:** work the `ord-maintain-ord202` checklist — the not-found behaviour and the description-hidden-until-`F11` presentation are the two that need a business answer; the missing-article carry-over is a defect to confirm as-is.
