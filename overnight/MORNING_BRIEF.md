# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 10 · 2026-09-08 22:26–22:58 UTC (23:26–23:58 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `1b3c363`
Previous briefs preserved in git: Pack B run 9 at `d47e987:overnight/MORNING_BRIEF.md`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`ord-maintain-ord201`** (job preference: first of the three remaining ORD-wave slices). `ORD201` — every customer's orders with the order lifecycle, menu option 3: one SQLRPGLE program (295 lines) + one DSPF (`CTL01`/`SFL01`/`KEY01`), 1 surface, 11 candidates. Bound in the ORD-wave room bind (`overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`; `discovery/ord-maintain-ord201/BIND.md`): `c01`–`c11` accepted, nothing needs-SME or blocked. `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; no ORD Architecture pack was drafted (job header: that comes after the five are carded, with `ROOM_OK`).

## 2. Cards written / needs-SME left

- **11 / 11** accepted behaviours now have as-is behaviour cards: `discovery/ord-maintain-ord201/features/ord-maintain-ord201-c01.md` … `c11.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 11 `documented`.
- **0** `inferred` candidates in this slice; **0** `blocked`. Auto-accept policy not exercised.
- **10 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c03` / `c04` — **`ORD201` is the only working path to `ORD101`** (parentheses present at `ORD201.PGM.SQLRPGLE:191`; `ORD200:187` refuses every `2`) and it deletes **lines first** with the row blanked; `ORD200` deletes header first and leaves the row as loaded. With both twins now carded, the room has the full picture for the "which twin is the parity reference" decision that shapes the ORD pack.
  - `c07` — **option `3` is dead and sticky**: it passes every guard, hits an empty `other` branch that never `update sfl01`s, so the `3` stays typed and is re-read on every subsequent Enter until the user blanks it. `ORD200` rejects `3`. The whole of `s01chk` differs from `ORD200` on exactly two lines (diff-verified): this one and the parentheses.
  - `c07` — **options typed before a `PAGEDOWN` survive** (the load appends, no `SFLCLR`) and execute on the next Enter, possibly pages later. One refused row still cancels every action on the pass.
  - `c01` — **the page is 7 two-line rows, not 14** (`SFLPAG(7)`; customer id/name on line 2; 14 is the fetch batch). `F11` (`SFLDROP`) drops the customer line and is invisible to the program. Phase A's "14 rows per page" corrected.
  - `c01` — **"all orders" means all orders with a `CUSTOMER` row** (inner-join view, planted defect as-is). Inferred from DB2 for i NULL ordering: one order with an invalid `ORDATE` anywhere in the estate would sort first, fail the first fetch with `-305`, and leave the **whole list empty** with no message.
  - `c06` — `7`/`8` are **byte-identical** to `ORD200` (diff-verified) — cross-referenced to `ord-maintain-ord200-c06`/`c07`, not duplicated. Sharpening for both twins: `ORD700U` is `TRGUPDCND(*CHANGE)`, so an unchanged zero-quantity line rewritten by `8` does not invoke the trigger at all (the `ORD200` card says "zero delta"; same observable). The `ORD200` card was **not** edited.
- Other facts recorded in the cards (as-is, cited): `F6` → `ORD100C2` with no parameter, list rebuilt from row 1 even after a cancelled create (`c02`); `5`/`6` have no guard, ghost `orid 0` passed to the callees (`c05`); `F5` is the only in-program re-read and the antidote to the stale screen-copy guards; `ORD200` enables `CA05` but never handles it (`c08`); `SAMMNU` option 3 is the only caller, its `help=` points at `cus200`, `F3` = `F12`, panel id `'ORD200-1'` reused (`c09`); `CUSTOME1` and `ARTICLE1` are dead declarations specific to `ORD201` — `ORD200` chains `CUSTOME1` once and does not declare `ARTICLE1` (`c10`); `pnl00` closes the cursor because the program pages, and an abnormal end would leave it open → inferred `-502` → empty list on the next call in the same job (`c11`); dead scalars `mode`/`User`/`crt`/`upd`/`help`/`prompt`/`morekeys` (`c01`).
- Pointer-only observations left for other binds (not deepened): `ORD202`/`ORD500` not-found handling for a ghost `orid` (`ord-maintain-ord202`, `ord-print-ord500`, next in queue); `OVRDBF` scope in `ORD100C2` (`ord-entry-ord100`); `ORD700` per-line delete deltas and `CULASTORD` asymmetry (`ord-trigger-ord700`, documented); the `SAMMNU` help map (`menu-cmd-shell`, unbound); the `ORDERCUS` inner join as a view definition (`sql-objects`, unbound).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-maintain-ord201/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The CUS pack's `WAIVED_PATHFINDER` is **not** extended. The note lists what a future RECORD would capture (page geometry and `PAGEDOWN` boundaries, the `F11` truncated form, the empty-list-on-NULL-date inference, the sticky `3`, options surviving `PAGEDOWN`, header/line state after `7`/`8` and whether `ORD700` fires on an unchanged line, the blanked row and every option typed on it, the header-lock residue, the stale `Value` column, the `-502` inference) and the two facts to settle first (trigger attachment; activation group / `CLOSQLCSR`).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-maintain-ord201`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 89 | **100** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8 + `cou-maintain` 6 + `ord-entry-ord101` 11 + `ord-maintain-ord200` 12 + `ord-maintain-ord201` 11) |
| behaviours `candidate` | 172 | 161 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` | 21 / 40 / 3 | **22** / 39 / 3 (`pgm:ORD201` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-maintain-ord201`: 1 surface, 11 behaviours, **11 documented**, weakest status `documented`.
- **Bind mirror gap (still open for two slices):** `pgm:ORD202`, `pgm:ORD500`/`cl:ORD500C` still read `candidate` in `APP_MANIFEST.yaml`; each queued slice's run mirrors its own (cap 1). INDEX rows 9–10 read `accepted` from the bind record with that caveat in the header.
- `docs/estate/INDEX.md`: row 8 `ord-maintain-ord201` → **done** with the headline findings (deps column now lists the four callees and the two unused declarations); header line notes run 10.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 9).

## 5. Remaining accepted undocumenteds (queue for next run)

Two, in the job's preferred order: **`ord-maintain-ord202`** (6 accepted) → `ord-print-ord500` (7 accepted; `c04` needs-SME). Re-run this paste (set `AGENT_JOB.md` line 1 back to `RUN`). Concrete pointers for the `ORD202` run: both list twins call it with `orid` by reference and, after a delete, with `orid = 0` — its header `chain id order1` (`ORD202.PGM.RPGLE:83`) not-found handling is the first thing to card; it is read-only (`IF` files) and declares `ARTICLE1`/`CUSTOME1` which it **does** use (`:84,108`), unlike `ORD201`.

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, and now `ord-maintain-ord201`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; this run does not draft or widen any Architecture pack (`atu-merlin-ts-cus-v1` untouched; the ORD pack is a later, new pack behind `ROOM_OK`). `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08). `ORD200` (twin), `ORD101`, `ORD202`, `ORD500`, `ORD100C2`/`ORD100C`/`ORD100`, `ORD700`/`ORD701`/`ART801`, `ORDERCUS`, `ISOTODATE40`, `SAMMNU`, `ORDER`/`DETORD`/`CUSTOME1`/`ARTICLE1` DDS were cited as twin contrasts, callee signatures, trigger bodies, view/UDF/menu definitions or field definitions only — their slices were not deepened and no card outside `discovery/ord-maintain-ord201/` was edited.
- Did **not** fix any planted defect (`ORDERCUS` inner join, dead option 3, ghost row, shared `Invalid Option` text, shared panel id, dead declarations) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-maintain-ord201-cNN` (same decision as runs 1–9; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- `c06` is a cross-reference card: the `7`/`8` guard and action ranges were diff-verified byte-identical to `ORD200`, so the rule detail lives in `ord-maintain-ord200-c06`/`c07` and this card carries the `ORD201`-side citations, the identity proof and one sharpening. This is how Phase A's "one shared lifecycle card set" recommendation was honoured under the bind's separate-slices decision.
- The Cloud Agent VM checked out a scratch branch (`cursor/atumerlin-job-runner-process-5c56`) at `1b3c363`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Two statements are inferences from platform semantics rather than source and are flagged as such on the cards and in `needs_sme`: NULL-sorts-first → empty list (`c01`, DB2 for i `ORDER BY`), and cursor-left-open → `-502` → empty list after an abnormal end (`c11`, ILE `CLOSQLCSR`).
- `c09` activation-group statement is an inference from the `H` spec (no `ACTGRP`), flagged for the build owner rather than asserted.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Two accepted slices still undocumented (ORD wave). Estate scan still partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; deferred slices per the bind records.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 to `RUN` to re-fire the conveyor on `ord-maintain-ord202` (job order). **Room:** nothing needed until the five are carded (two to go); then ME drafts the new ORD Architecture pack (`ROOM_OK`). Both list twins are now carded, so the "which twin is the parity reference" question (`c03`/`c04` here; `ord-maintain-ord200-c09`/`c13`) can be put to the room now rather than after `ORD500`. **SME:** work the `ord-maintain-ord201` checklist — the sticky option `3` and the options-surviving-`PAGEDOWN` behaviour are the two that need a business answer; the NULL-date inference needs a look on the box.
