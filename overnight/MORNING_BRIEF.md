# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 7 · 2026-09-08 20:59–21:40 UTC (21:59–22:40 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `c0528fc`
Previous briefs preserved in git: Pack B run 6 at `042232b:overnight/MORNING_BRIEF.md`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`cou-maintain` — FCOUNTRY half only** (job preference: "Prefer: cou-maintain FCOUNTRY half only (c07–c12). COU200 (c01–c06, c13) stays deferred."). The `FCOUNTRY` service program: `COU300` (`GetCountryName`, `GetCountryIso3`, `ExistCountry` over one cached keyed chain) and `COU301` (`SltCountry` keyed-read selection window with by-code / by-name toggle), 2 `nomain` modules, ~325 lines, 1 window DSPF, 4 exports. Bound in the residual room bind (`overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` @ `d24702f`; `discovery/cou-maintain/BIND.md`): `c07`–`c12` accepted, `c01`–`c06`, `c13` deferred. The deferred `COU200` half was **not** deepened; its seven rows are now marked `deferred` in the slice MANIFEST and APP_MANIFEST to mirror the bind. `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; the CUS vertical's read-only `fcountry` dependency surface is cited as a pointer only.

## 2. Cards written / needs-SME left

- **6 / 6** accepted behaviours now have as-is behaviour cards: `discovery/cou-maintain/features/cou-maintain-c07.md` … `c12.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 6 `documented`, 7 `deferred`.
- **0** `inferred` / `needs-SME` candidates existed in the accepted set, so nothing was left without a card and the auto-accept policy was not exercised. **0** `blocked`.
- **5 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions` (target or build questions, not gaps in the as-is reading). The ones worth Ash's attention first:
  - `c10` — **Phase A correction.** The "F8 clears the opposite key to `FAM301`" divergence is **source-level only**: traced through both modules, every toggle shows the new order from the top in both windows and both lose the caller's code position after the first toggle away and back. Phase A recommended carding the two windows separately because of this; the reason is withdrawn, and the question for the room (and the `fam-maintain` bind) is now whether to card the keyed selector **once**.
  - `c08` — `GetCountryIso3` is exported with **no caller**; `COISO` is read/written only by the deferred `COU200` panel. Carry unused or `reject`? `closeCOUNTRY` is prototyped but **not exported** (five prototypes for four exports, same drift as `FVAT`), so the module's ODPs live for the activation group.
  - `c07` — the getter cache is keyed on the **record buffer's own `COID`**: a hit is cached (stale until a different code is asked for — `COU200` in another job can rename a country underneath it), a miss is never cached, a blank code never reads, and `ExistCountry(blank)` as a first call is correct only because the initial `%found` is `*off`. Target: read-through (as the converted CUS surface does) or cache?
  - `c09` — `SltCountry` is a **native keyed read positioned at the caller's code** (not a filtered SQL list like `SltCustomer`); a position beyond the last key shows the **window frame with no rows and no message**. Target message? Keep the caller's code as the position across the toggle?
  - `c07`/`c12` — build owner: activation group `CUS200` / `CUS250` / `PRO250` compile into (decides whether one job's `CUS200` and `PRO200` share the `COUNTRY` cache / ODPs under `ACTGRP(*CALLER)`; `PRO200` is `QILE` explicitly); has the literal `SIGNATURE('V1')` ever been bumped; `PRO200`'s explicit `BNDSRVPGM(FCOUNTRY)` (no `H` spec) intentional?
- Other facts recorded in the cards (as-is, cited): `S01chk` and the position-to branch are **byte-identical** to `sltArtFam` (diff), `FAM301D` differs from `COU301D` only in text, `REFFLD`s and window geometry (`c11`); invalid row option + option 8 leaves the position unapplied with the `8` still typed, valid `1` + option 8 gives 42 and returns nothing (`c11`); `pcod` is the only by-reference parameter in the copybook and is never written (`c09`); 20 rows per load into a 10-row page (`c09`); four display files and two physical files compile against the `COUNTRY` layout (`c12`); `COUNTRY` has no delete flag so `ExistCountry` = row present (`c07`).
- Pointer-only observations left for other binds (not deepened): `COU200` as the direct `COUNTRY` writer and the only `COISO` reader (`cou-maintain` deferred half); `FAM301` / `FAM300` template comparison (`fam-maintain`); `PRO200` / `PRO250` call sites (`pro-interactive`); `SAMPLE.BNDDIR` / signature policy (`srvpgm-supporting`).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/cou-maintain/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The CUS pack's `WAIVED_PATHFINDER` (which covers its read-only `fcountry` dependency surface) is **not** extended by this slice. The note lists the cache / `%found` sequences, the selector position and paging boundaries, the side-by-side F8 table and the option matrix a future RECORD would capture, and the two facts it must settle first (activation group; out-of-tree `COISO` readers).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice cou-maintain`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 60 | **66** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8 + `cou-maintain` 6) |
| behaviours `deferred` | 0 | **7** (`cou-maintain-c01`–`c06`, `c13` — bind mirror) |
| behaviours `candidate` | 208 | 195 |
| behaviours `accepted` | 0 | 0 |
| surfaces `accepted` / `candidate` / `deferred` | 16 / 46 / 2 | **19** / 42 / **3** (`srvpgm:FCOUNTRY`, `mod:COU300`, `mod:COU301` → accepted; `pgm:COU200` → deferred) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `cou-maintain`: 4 surfaces, 13 behaviours, **6 documented**, weakest status `deferred` (the `COU200` half — by design, weakest wins).
- **Bind mirror gap closed:** `cou-maintain` no longer reads `candidate` anywhere; the residual bind of 2026-09-08 is now fully mirrored into `APP_MANIFEST.yaml` and `INDEX.md`.
- `docs/estate/INDEX.md`: row 17 `cou-maintain` → **done** for the FCOUNTRY half / **deferred** for the `COU200` half, with the headline findings; header line notes run 7.
- Tooling: `mark_documented.py` gained split-bind handling — an accepted slice whose features on a surface are *all* deferred/rejected marks that surface `deferred` instead of `accepted` (needed so `pgm:COU200` was not falsely bumped). Status bumps + pointers only; no inventory content invented.

## 5. Remaining accepted undocumenteds (queue for next run)

**None.** The residual-wave bind (`vat-module`, `dat-utils`, `cou-maintain` FCOUNTRY) is fully documented. The conveyor is idle until the next bind wave — per the bind record: `ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500`, then a new ORD Architecture pack (never widen `atu-merlin-ts-cus-v1`). `dat-utils` run 6 left three concrete pointers for that ORD bind in `ORD200`/`ORD201`/`ORD202`; this run adds one for the `fam-maintain` bind (`c10`: card the keyed selector once).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, and now `cou-maintain` (FCOUNTRY half).

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; this run does not propose widening `atu-merlin-ts-cus-v1`. `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08; the `deferred` marks mirror the bind record verbatim). Did **not** deepen `c01`–`c06`, `c13`. `COU200`, `FAM300`/`FAM301`, `CUS200`/`CUS250`/`PRO200`/`PRO250`, `CUS301`, `SAMPLE.BNDDIR`, `FPROVIDER.BND`/`FVAT.BND`, `SAMMSGF` were cited as writers, template twins, call sites, binding facts or absence evidence only — their slices were not deepened.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `cou-maintain-cNN` (same decision as runs 1–6; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- The Cloud Agent VM checked out a scratch branch at `c0528fc`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Deferred features marked `deferred` in the slice MANIFEST (schema-valid status) rather than left `candidate` as `ord-batch-ord900` was at its bind — for a split slice the per-feature mark is the only way to mirror the bind honestly. Recorded, not silently changed.
- One tool change (`mark_documented.py` split-bind surface rule) — runs 1–6 needed none; without it the deferred `pgm:COU200` surface would have been bumped to `accepted`.
- Phase A's `c10` claim ("opposite of FAM301") corrected in the card rather than silently rewritten; `CANDIDATES.md` is left as the historical record. Phase A's `SME_BRIEF` recommendation to card the two windows separately is withdrawn in `SME_BRIEF.md` with the trace.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Zero accepted slices undocumented. Estate scan still partial (`overnight/METHOD_COVERAGE.md`); 7 Phase A ORD/ART slices unbound; deferred slices per the bind records (including the `COU200` half of this one).

## 9. Next action

**Room:** bind the next ORD wave (`ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500`) so the conveyor has work; the `dat-utils` and `cou-maintain` cards give that bind and the `fam-maintain` bind concrete pointers. **SME:** work the sign-off checklists — for this slice the `c10` "one selector rule or two" and `c08` "carry or reject `GetCountryIso3`" answers are the ones that shape the target. Re-running this paste now will find no accepted undocumented slice and should no-op.
