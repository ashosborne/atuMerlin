# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 8 · 2026-09-08 21:26–21:55 UTC (22:26–22:55 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `8386fb5`
Previous briefs preserved in git: Pack B run 7 at `c6b4704:overnight/MORNING_BRIEF.md`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`ord-entry-ord101`** (job preference: first of the five ORD-wave slices). `ORD101(orid)` — maintain the lines of an existing order: one RPGLE program (290 lines) + one DSPF (list `CTL01`/`SFL01`/`KEY01`, edit panel `FMT02`), 1 surface, 12 candidates. Bound in the ORD-wave room bind (`overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md` @ `8386fb5`; `discovery/ord-entry-ord101/BIND.md`): `c01`–`c10`, `c12` accepted; `c11` needs-SME (inferred). `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; no ORD Architecture pack was drafted (job header: that comes after the five are carded, with `ROOM_OK`).

## 2. Cards written / needs-SME left

- **11 / 11** accepted behaviours now have as-is behaviour cards: `discovery/ord-entry-ord101/features/ord-entry-ord101-c01.md` … `c10.md`, `c12.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 11 `documented`, 1 `needs-SME`.
- **1** `inferred` candidate (`c11`, trigger attachment) stays `needs-SME` with no card — pointer to `ord-trigger-ord700-c03`/`c04`. **0** `blocked`. Auto-accept policy not exercised.
- **11 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c07` — **Phase A correction.** Option `6` is advertised on the list as **`6=Deliver`** (`ORD101D.DSPF:79`), not print. Accepted by validation, no action branch, no message; the `6` stays typed. A per-line deliver that was never implemented (or removed) — counterpart to order-level `8=Deliver` in `ORD200`/`ORD201`. Phase A question 1 answered.
  - `c04` — the two quantity rules compare **typed vs stored**, never typed vs typed. Stored `10/5`: typed `20/15` → `ERR1001` although consistent; typed `6/8` → **accepted**, stored with delivered > ordered. Negative delivered quantity is not blocked. Phase A question 3, now with worked cases.
  - `c03` — a **plain Enter with nothing modified rewrites** `ODTOT`/`ODTOTVAT` recomputed at today's VAT rate (unknown code → zero VAT silently, `vat-module-c02`). Save after a change takes two Enters. `F3` and `F12` on the edit panel both return to the list (no program exit). Footer not refreshed after save. `ORD101` is the only per-line writer of `ODQTYLIV` in the tree.
  - `c09` — **`ORD200` option 2 is unreachable** (`opt01 = 2 or opt01 = 4 and datclo > datBlank`, `ORD200.PGM.SQLRPGLE:187`): the planted precedence defect from the bind record; line maintenance is effectively `ORD201`-only. Documented as-is, not fixed; decision owner `ord-maintain-ord200`.
  - `c02` / `c12` — `ORDER1` is opened `UF`, chained once, never updated → the **order header row is locked for the whole session**; `ORDATCLO`/`ORDATDEL` are loaded and never tested, so a closed order is editable via direct `CALL` or a stale list, and editing does not reopen it.
  - `c06` — **correction to the `ORD100` pattern:** `ODTOTVAT` **is** a hidden subfile field here, so a straight delete keeps the footer right; drift only on a re-selected blank row (hidden value subtracted twice) or after an edit (footer never adjusted).
- Other facts recorded in the cards (as-is, cited): one-shot load, `pagedown` indicator never tested, description truncated 50 → 30 (`c01`); order-not-found silent, header `0`/blank (`c02`); `c05` guard reads the subfile's hidden copy, not the file; delete by key not-found silent, no confirmation, zero-line orders possible (`c06`); `Prtord`, `create`, `help`, `prompt`, `confirm`, `morekeys`, `pagedown`, `count`, `lod` dead — `ORD101` does not print, add or deliver (`c08`); `F12` = `F3` on the list, only `write fdeto` in the tree is `ORD100`'s confirm (`c10`); activation group inferred `QILE` (`c09`).
- Pointer-only observations left for other binds (not deepened): `ORD200` precedence defect and stale `sumord` after return (`ord-maintain-ord200`/`201`); order-level deliver sets `ODQTYLIV = ODQTY` on lines still at 0 (`ord-maintain-ord201`); `ORD700` update/delete deltas (`ord-trigger-ord700`, documented); `GetArtDesc` 50-char return / miss behaviour (`art-modules`, unbound).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-entry-ord101/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The CUS pack's `WAIVED_PATHFINDER` is **not** extended. The note lists the `c04` matrix, the plain-Enter re-rate, footer sequences, lock wait, dead `6` and the `ORD200` rejection a future RECORD would capture, and the two facts to settle first (trigger attachment; activation group).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-entry-ord101`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 66 | **77** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8 + `cou-maintain` 6 + `ord-entry-ord101` 11) |
| behaviours `candidate` | 195 | 184 (`c11` stays `candidate` in APP_MANIFEST — needs-SME is not a mirrored status, same as `ord-entry-ord100-c09`/`c11`) |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` | 19 / 42 / 3 | **20** / 41 / 3 (`pgm:ORD101` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-entry-ord101`: 1 surface, 12 behaviours, **11 documented**, weakest status `candidate` (the `c11` pointer — by design, weakest wins).
- **Bind mirror gap (flagged, not closed):** the ORD-wave bind `8386fb5` set `bind_status: accepted` in the four other slice MANIFESTs but did not mirror into `APP_MANIFEST.yaml` (`pgm:ORD200`/`ORD201`/`ORD202`/`ORD500`, `ORD500C` still `candidate`). This run mirrored only its own slice (cap 1); each queued slice's run will mirror its own. INDEX rows 7–10 read `accepted` from the bind record with that caveat in the header.
- `docs/estate/INDEX.md`: row 6 `ord-entry-ord101` → **done** with the headline findings; rows 7–10 → `accepted (Pack B queued)`; header line notes run 8.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 7).

## 5. Remaining accepted undocumenteds (queue for next run)

Four, in the job's preferred order: **`ord-maintain-ord200`** (12 accepted; `c12` needs-SME) → `ord-maintain-ord201` (11 accepted) → `ord-maintain-ord202` (6 accepted) → `ord-print-ord500` (7 accepted; `c04` needs-SME). Re-run this paste (set `AGENT_JOB.md` line 1 back to `RUN`). This run leaves concrete pointers for the next one: the `ORD200` precedence defect (`c09` here), the stale amount column after `ORD101` returns, and the deliver path's `ODQTYLIV = ODQTY` rule.

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), and now `ord-entry-ord101`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; this run does not draft or widen any Architecture pack (`atu-merlin-ts-cus-v1` untouched; the ORD pack is a later, new pack behind `ROOM_OK`). `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08). Did **not** deepen `c11`. `ORD200`, `ORD201`, `ORD700`, `ORD100`, `ART300`, `VAT`/`ARTICLE`/`CUSTOMER` copybooks, `SAMMSGF`, `ORDER`/`DETORD` DDS were cited as call sites, guards, trigger bodies, getters, message texts or field definitions only — their slices were not deepened.
- Did **not** fix any planted defect (`ORD200` option 2, dead `6=Deliver`, typed-vs-stored rules, plain-Enter re-rate) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-entry-ord101-cNN` (same decision as runs 1–7; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- The Cloud Agent VM checked out a scratch branch (`cursor/atumerlin-job-runner-process-0d60`) at `8386fb5`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Phase A's `c07` "print?" guess corrected in the card and `SME_BRIEF.md` (DSPF says `6=Deliver`); `CANDIDATES.md` left as the historical record.
- `c09` activation-group statement is an inference from the `H` spec (no `ACTGRP`), flagged for the build owner rather than asserted.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Four accepted slices still undocumented (ORD wave). Estate scan still partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; deferred slices per the bind records.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 to `RUN` to re-fire the conveyor on `ord-maintain-ord200` (job order). **Room:** nothing needed until the five are carded; then ME drafts the new ORD Architecture pack (`ROOM_OK`). **SME:** work the `ord-entry-ord101` checklist — the `c04` rule semantics, the `c07` deliver intent and the `c12` where-does-the-closed-guard-live answer are the ones that shape the ORD target; `c09` confirms the `ORD200` planted defect for that slice's run.
