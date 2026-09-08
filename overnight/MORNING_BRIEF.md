# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 9 · 2026-09-08 21:53–22:25 UTC (22:53–23:25 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `f7277a1`
Previous briefs preserved in git: Pack B run 8 at `7a0e126:overnight/MORNING_BRIEF.md`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`ord-maintain-ord200`** (job preference: first of the four remaining ORD-wave slices). `ORD200(cuid)` — one customer's orders with the order lifecycle: one SQLRPGLE program (289 lines) + one DSPF (`CTL01`/`SFL01`/`KEY01`), 1 surface, 13 candidates. Bound in the ORD-wave room bind (`overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`; `discovery/ord-maintain-ord200/BIND.md`): `c01`–`c11`, `c13` accepted; `c12` needs-SME (inferred). `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; no ORD Architecture pack was drafted (job header: that comes after the five are carded, with `ROOM_OK`).

## 2. Cards written / needs-SME left

- **12 / 12** accepted behaviours now have as-is behaviour cards: `discovery/ord-maintain-ord200/features/ord-maintain-ord200-c01.md` … `c11.md`, `c13.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 12 `documented`, 1 `needs-SME`.
- **1** `inferred` candidate (`c12`, stale `CULASTORD` after delete) stays `needs-SME` with no card — mechanism already documented as `ord-trigger-ord700-c08`. **0** `blocked`. Auto-accept policy not exercised.
- **12 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c09` — **option 2 unreachable** (`ORD200.PGM.SQLRPGLE:187`, `opt01 = 2 or opt01 = 4 and datclo > datBlank`): confirmed from source; the `ORD101` call in `s01act` is dead code under a live `2=Edit` legend, and a `2` typed anywhere cancels every other option on the pass. Planted defect — documented as-is, not fixed. Preserve-or-correct is the room's call for the ORD pack.
  - `c06` / `c07` / `c08` — **"already closed" (7) and "already delivered" (8) are refused with the generic `Invalid Option` text**, indistinguishable from typing `9`; only `2`/`4`-on-closed and `4`-with-deliveries have specific wording. Not in Phase A.
  - `c04` / `c13` — **the deleted row stays on screen with its data** (`ORD201` blanks it); `7`/`8` on that ghost row chain-miss and then `update forde` without a lock → unmonitored exception. Header-first delete leaves **orphan lines with no header** on a mid-way failure (invisible to `ORDERCUS`/`ART801`, still counted in the trigger-maintained `ARCUSQTY`, unreachable from any screen); `ORD200` contends for the header lock first, so an open `ORD101` session blocks it before any line is touched.
  - `c06` / `c07` — close stamps `ORDATDEL` when blank but **leaves every `ODQTYLIV` at 0**; deliver sets undelivered lines to `ODQTY`, **skips partial lines**, does not close; deliver-after-close is impossible. Trigger-maintained and `ART801`-computed "outstanding" diverge after a close until the batch runs.
  - `c01` — no `orid` tie-breaker in the sort, whole result loaded in one pass, **`F5` enabled (`CA05`) but unlabelled and unhandled** (redisplay, no reload), any non-zero `SQLCOD` (incl. a NULL from `ISOTODATE40`) ends the load silently. `ORD201` does all four differently.
  - `c08` — **option `3` is invalid in `ORD200` but passes validation in `ORD201`** (silently stays typed); one refused row cancels the whole pass.
- Other facts recorded in the cards (as-is, cited): `F6` reloads unconditionally and discards typed options, `ORD100C` stages `QTEMP/DETORD` without triggers (`c02`); `5`/`6` have no state guard, ghost orders can be displayed/printed, `'6=Print  '` trailing blanks (`c05`); `F3` = `F12`, only caller `CUS200` option 5, no menu/command/CL, `ORD201D` reuses the panel id `ORD200-1`, activation group inferred `QILE` (`c10`); `*inzsr` chain untested, header name from a native chain not the view, parameter and file field share one RPG field, sentinel defined three times, `DATORD` has no `MAPVAL` (`c11`); dead declarations `rrs01`/`count`/`mode`/`User`/`savId`/`refresh`/`pagedown` (`c01`).
- Pointer-only observations left for other binds (not deepened): `ORD201`'s paging, tie-breaker, `F5`/`F11`, option-3 pass-through, lines-first delete and row blanking (`ord-maintain-ord201`, next in queue); `ORD202`/`ORD500` not-found handling for a ghost `orid` (`ord-maintain-ord202`, `ord-print-ord500`); `OVRDBF` scope in `ORD100C` (`ord-entry-ord100`); `ORD700` delete/update deltas and `CULASTORD` asymmetry (`ord-trigger-ord700`, documented).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-maintain-ord200/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The CUS pack's `WAIVED_PATHFINDER` is **not** extended. The note lists what a future RECORD would capture (same-day sort order, `F5`, the three refusal texts, header/line state after `7` and `8`, the ghost-row exception, lock residue, `CULASTORD` after delete) and the two facts to settle first (trigger attachment; activation group).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-maintain-ord200`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 77 | **89** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8 + `cou-maintain` 6 + `ord-entry-ord101` 11 + `ord-maintain-ord200` 12) |
| behaviours `candidate` | 184 | 172 (`c12` stays `candidate` in APP_MANIFEST — needs-SME is not a mirrored status, same as `ord-entry-ord101-c11`) |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` | 20 / 41 / 3 | **21** / 40 / 3 (`pgm:ORD200` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-maintain-ord200`: 1 surface, 13 behaviours, **12 documented**, weakest status `candidate` (the `c12` pointer — by design, weakest wins).
- **Bind mirror gap (still open for three slices):** `pgm:ORD201`, `pgm:ORD202`, `pgm:ORD500`/`ORD500C` still read `candidate` in `APP_MANIFEST.yaml`; each queued slice's run mirrors its own (cap 1). INDEX rows 8–10 read `accepted` from the bind record with that caveat in the header.
- `docs/estate/INDEX.md`: row 7 `ord-maintain-ord200` → **done** with the headline findings (deps column now also lists the four callees); header line notes run 9.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 8).

## 5. Remaining accepted undocumenteds (queue for next run)

Three, in the job's preferred order: **`ord-maintain-ord201`** (11 accepted) → `ord-maintain-ord202` (6 accepted) → `ord-print-ord500` (7 accepted; `c04` needs-SME). Re-run this paste (set `AGENT_JOB.md` line 1 back to `RUN`). Concrete pointers for the `ORD201` run: its cards can cross-reference `ord-maintain-ord200-c06`/`c07`/`c08` (identical `7`/`8` code) and should card the four divergences from its side — paging + `F5`/`F11` + tie-breaker, corrected option-2 guard, option-3 pass-through, lines-first delete with row blanking — plus the `'ORD200-1'` panel id reuse and the `ORD100C2` create path.

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, and now `ord-maintain-ord200`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; this run does not draft or widen any Architecture pack (`atu-merlin-ts-cus-v1` untouched; the ORD pack is a later, new pack behind `ROOM_OK`). `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08). Did **not** deepen `c12`. `ORD201`, `CUS200`, `ORD202`, `ORD500`, `ORD100C`/`CRTORD`/`ORD100C2`, `ORD700`/`ORD701`/`ART801`, `ORDERCUS`, `ISOTODATE40`, `ORDER`/`DETORD`/`CUSTOMER` DDS were cited as twin contrasts, call sites, callee signatures, trigger bodies, view/UDF definitions or field definitions only — their slices were not deepened.
- Did **not** fix any planted defect (`ORD200` option 2, `ORDERCUS` inner join, shared `Invalid Option` text, ghost row, header-first delete) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-maintain-ord200-cNN` (same decision as runs 1–8; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- Phase A's `SME_BRIEF` recommended "one shared lifecycle card set" for the `ORD200`/`ORD201` twins; the bind kept them as separate slices, so this run wrote full cards for `ORD200` and cited `ORD201` as contrast only. The `ORD201` run may cross-reference rather than duplicate `c06`/`c07`/`c08`.
- The Cloud Agent VM checked out a scratch branch (`cursor/atumerlin-job-runner-process-f9b2`) at `f7277a1`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- `F5` behaviour (`c01`) is stated from the DDS/RPG contract (`CA` key returns no field data; no `refresh` branch); flagged as runtime-confirmable rather than asserted.
- `c10` activation-group statement is an inference from the `H` spec (no `ACTGRP`), flagged for the build owner rather than asserted.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Three accepted slices still undocumented (ORD wave). Estate scan still partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; deferred slices per the bind records.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 to `RUN` to re-fire the conveyor on `ord-maintain-ord201` (job order). **Room:** nothing needed until the five are carded (three to go); then ME drafts the new ORD Architecture pack (`ROOM_OK`). The `c09` preserve-or-correct question and the `c04`/`c13` "which twin is the delete parity reference" question are the two that shape that pack. **SME:** work the `ord-maintain-ord200` checklist — close-vs-deliver semantics (`c06`/`c07`) and the `Invalid Option` wording are the ones that need a business answer; `c12` needs a look on the box.
