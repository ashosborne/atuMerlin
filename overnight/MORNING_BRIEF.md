# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 5 · 2026-09-08 20:01–20:40 UTC (21:01–21:40 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `02c9468`
Previous briefs preserved in git: Pack A residual at `73e5a0e:overnight/MORNING_BRIEF.md`; Pack B run 4 at `6656114:overnight/MORNING_BRIEF.md`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`vat-module`** (first in the job's preference order for the residual wave: vat-module → dat-utils → cou-maintain FCOUNTRY). `FVAT` service program = module `VAT300` (85 lines) over `VATDEF`: the one VAT rule in the estate (`ClcVAT`), two getters, an unused existence predicate, the cached `chain`, and the binder. Bound in the residual room bind (`overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` @ `d24702f`, all 10 candidates accepted). `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; nothing proposes widening the CUS pack.

## 2. Cards written / needs-SME left

- **10 / 10** accepted behaviours now have as-is behaviour cards: `discovery/vat-module/features/vat-module-c01.md` … `c10.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 10 `documented`.
- **0** `inferred` / `needs-SME` candidates existed in this slice at bind, so nothing was left without a card and the auto-accept policy was not exercised. **0** `blocked`.
- **6 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions` (questions about *what the target should do*, not gaps in the as-is reading). The ones worth Ash's attention first:
  - `c02` — **unknown VAT code → zero VAT, silently**, and the only place a VAT code is entered (`ART200` FMT02 `ARVATCD`) does not validate it — no `ExistVATRate` call, no F4 prompt, family default `FAVATCD` never applied. A **blank** code never even reads `VATDEF` (buffer starts and clears blank, `c05`).
  - `c04` — `ExistVATRate` is the only reader of `VATDEL` and has **no caller**, so a soft-deleted rate is still applied by `ClcVAT`/`GetVATRate`.
  - `c07` — **`VAT300` is the only member in the tree that opens `VATDEF`**; no maintenance program, CL, SQL, DSPF or menu option exists; audit/delete columns have no writer. How rates get onto the box is not in source — seed configuration vs maintenance screen is a room decision.
  - `c03` — `ART200D` FMT02 has `VATRATE` / `VATDESC` / `WITHVAT` output fields laid out beside the VAT-code input that `ART200` **never fills** (it does not even copy `VAT.RPGLEINC`); `GetVATDesc` has no caller and `VATDESC` is never displayed anywhere.
  - `c06` — only changes to the *currently buffered* row are invisible to a running activation group; new codes are seen (misses do not stick). Matters only if rates change intra-day.
  - `c05`/`c09` — callers are `DFTACTGRP(*NO)` with no `ACTGRP` keyword (compile-time), `'V1'` is a literal signature with no `*PRV` block; build owner questions.
- Corrections to Phase A recorded in the cards: `c08` — **two** of the three callers go through `GetArtVatCode` (twice per line prepare); `ART250` passes `ARVATCD` directly from its own `ARTICLE1` chain (Phase A said "every caller"). `c10` — the module's `ClcVAT` PI **also** omits the `A` (`VAT300.RPGLE:40`); the drift is `ClcVAT` vs the other three procedures, not copybook vs module. `c01` — the `eval` into `11P 4` truncates (no `(h)`) before `%dech` half-adjusts; the card shows this equals half-adjusting the exact quotient to 2 dp.
- Pointer-only observations left for other binds (not deepened): `ART250` shows the `ClcVAT` result (the VAT amount) under a `with VAT` label where the order screens show net + VAT (`art-interactive`); `FAVATCD` (fam-maintain `c12`).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/vat-module/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The note lists what a future RECORD must capture (half-adjust grid, unknown and blank codes, `'X'`-flagged code, hit→hit with an intervening `VATDEF` change) and two facts it must settle first (callers' activation group; how `VATDEF` is populated).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice vat-module`; no new surfaces/behaviours):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 42 | **52** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10) |
| behaviours `candidate` | 226 | 216 |
| behaviours `accepted` | 0 | 0 — see note below |
| surfaces `accepted` / `candidate` | 12 / 50 | **14** / 48 (`srvpgm:FVAT`, `mod:VAT300` candidate → accepted, mirroring the bind) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `vat-module`: 2 surfaces, 10 behaviours, **10 documented**, weakest status `documented`.
- **Note on the bind mirror:** the residual bind commit `d24702f` set `accepted` in the three slice MANIFESTs but did not mirror those accepts into `APP_MANIFEST.yaml` / `INDEX.md`, so `dat-utils` (8 accepted) and `cou-maintain` (6 accepted) still read `candidate` there. This run mirrored only its own slice (cap 1); their conveyor runs will mirror the rest. Flagged in the INDEX header so the "0 accepted" histogram line is not misread as an empty queue.
- `docs/estate/INDEX.md`: row 19 `vat-module` → **done** (cards written; SME sign-off pending) with the headline findings; header line notes run 5 and the mirror gap above.

## 5. Remaining accepted undocumenteds (queue for next run)

Two slices from the residual bind, in the job's preference order:

1. **`dat-utils`** — 8 accepted (`c01`–`c08`), all `observed-in-code`.
2. **`cou-maintain`** — FCOUNTRY half only: `c07`–`c12` accepted; `c01`–`c06` (COU200 screen) and `c13` **deferred** — must not be deepened.

**Re-run this paste** (one slice per run). After those two, the conveyor is idle until the next ORD bind wave (`ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500` per the bind record).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, and now `vat-module`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; `FVAT` is not in that vertical and this run does not propose widening `atu-merlin-ts-cus-v1`. `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08). `dat-utils` / `cou-maintain` were not touched. `ORD100` / `ORD101` / `ART250` / `ART200` / `ART300` / `FAMILLY.PF` / `SAMMNU.MENU` were cited as call sites, entry surfaces, code provider or absence evidence only — their slices were not deepened.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `vat-module-cNN` (same decision as runs 1–4; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- The Cloud Agent VM checked out a scratch branch at `02c9468`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Phase A's `SME_BRIEF` recommended thin/fold for `c03`, `c04`, `c05`, `c09`, `c10` and needs-SME for `c06`, `c07`; the room accepted all ten as separate candidates, so they are ten separate cards cross-referencing each other. Not merged, not demoted.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Two accepted slices still undocumented (above). Estate scan still partial (`overnight/METHOD_COVERAGE.md`); 7 Phase A ORD/ART slices unbound; deferred slices per the bind record.

## 9. Next action

**Re-run this paste** → it will pick `dat-utils` (then `cou-maintain` FCOUNTRY features on the run after). In parallel, a human SME should work the sign-off checklist in `discovery/vat-module/SME_BRIEF.md` — the `c02` (unknown code → error or zero) and `c07` (how rates are maintained) answers are the two that shape the later ORD Architecture pack.
