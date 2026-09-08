# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 6 · 2026-09-08 20:26–21:05 UTC (21:26–22:05 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `de4fa27`
Previous briefs preserved in git: Pack B run 5 at `17f0bbc:overnight/MORNING_BRIEF.md`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`dat-utils`** (job preference: "Prefer: dat-utils (8 accepted). Then cou-maintain FCOUNTRY half"). Two external SQL scalar functions and their RPG programs — `ISOTODATE40` → `DAT002` (`0 → 1940-01-01`, `99999999 → 2039-12-31`, invalid → NULL) and `ISO_Num_To_Date` → `DAT001` (no sentinels, unused) — 4 members, ~170 lines, no files, no SQL, no state. Bound in the residual room bind (`overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` @ `d24702f`, all 8 candidates accepted). `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; nothing proposes widening the CUS pack.

## 2. Cards written / needs-SME left

- **8 / 8** accepted behaviours now have as-is behaviour cards: `discovery/dat-utils/features/dat-utils-c01.md` … `c08.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 8 `documented`.
- **0** `inferred` / `needs-SME` candidates existed in this slice at bind, so nothing was left without a card and the auto-accept policy was not exercised. **0** `blocked`.
- **5 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions` (questions about *what the target should do* or about objects not in the tree, not gaps in the as-is reading). The ones worth Ash's attention first:
  - `c01`/`c07` — **`1940-01-01` sentinel vs NULL in the target.** As-is the storage convention is `0`, three places turn it into `1940-01-01`, DDS `MAPVAL` blanks it, and `ORD200`/`ORD201` *compare* the UDF output against the same constant — the SQL rule and the RPG constant must agree. This is the decision that shapes how the CUS / ORD cards reference the date rule in the later ORD Architecture pack.
  - `c01`/`c03` — **both callers fetch the converted dates with no null indicators** and loop on `sqlcod = 0`; a NULL (an invalid stored numeric date) fails the fetch (`-305`) and **ends the order list silently at that row** (derived: an invalid `ORDATE` sorts first under `order by datord desc` and empties the list). Reachable only via out-of-tree writes; pointer to `ord-maintain-ord200`/`201`.
  - `c02`/`c03` — `ISO_Num_To_Date` has **no caller in the tree**; the only possible consumers are the QM queries behind menu options 12/13 (no source). Dead or not decides `reject` vs port.
  - `c01` — the `99999999 → 2039-12-31` branch has **no in-tree producer and no `MAPVAL`**: a `99999999` close date would display as 31/12/2039 and count as "already closed".
  - `c04`/`c06` — build owner: activation group, `FENCED` status, target library and how the functions are created on deploy (no `H` spec, unqualified `EXTERNAL NAME`, no build script in tree).
- Corrections to Phase A recorded in the cards: `c04` — the `PARAMETER STYLE SQL` interface is **8** parameters, not 9 (argument, result, two indicators, SQLSTATE, function name, specific name, message text). `c07` — `ORD202` does **not** map `0 → 1940` per row; it presets the fields to `d'1940-01-01'` in `*inzsr` and simply does not assign them when the numeric is `0` (pointer for the `ord-maintain-ord202` bind). `c07` — `ORD200`/`ORD201` are a fourth dependency on the sentinel (comparison, not production).
- Derived observation flagged as analysis in `c01` / `c07`: `1940-01-01` and `2039-12-31` are exactly RPG's `*LOVAL` / `*HIVAL` for 2-digit-year date formats; `ORD202D` shows the same sentinel as `01/01/40` under `DATFMT(*DMY)`.
- Pointer-only observations left for other binds (not deepened): the un-indicated fetch and list truncation (`ord-maintain-ord200`/`201`); `ORD202`'s implicit sentinel and its unmonitored `%date` (`ord-maintain-ord202`); `ORD500`'s unguarded `%date(ORDATE)` (`ord-print-ord500`); `ART801`'s `ORDATCLO = 0` as "open order" (`sql-objects`).

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/dat-utils/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The note lists the argument grid a future RECORD would capture (both sentinels, their neighbours, leap-day pair, month/day overflow, negative, NULL), the `*PSSR` and result-buffer probes, and the two facts it must settle first (activation group / `FENCED`; whether the QM queries call either function). Phase A's "first golden set" remark stays a recommendation for a later station.

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice dat-utils`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 52 | **60** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8) |
| behaviours `candidate` | 216 | 208 |
| behaviours `accepted` | 0 | 0 |
| surfaces `accepted` / `candidate` | 14 / 48 | **16** / 46 (`udf:ISOTODATE40`, `udf:ISO_Num_To_Date` candidate → accepted, mirroring the bind) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `dat-utils`: 2 surfaces, 8 behaviours, **8 documented**, weakest status `documented`.
- **Bind mirror gap, remaining:** `cou-maintain` (6 accepted, FCOUNTRY half) still reads `candidate` in `APP_MANIFEST.yaml` / `INDEX.md` because the residual bind commit `d24702f` did not mirror it; its conveyor run will. Flagged in the INDEX header.
- `docs/estate/INDEX.md`: row 21 `dat-utils` → **done** (cards written; SME sign-off pending) with the headline findings; header line notes run 6.

## 5. Remaining accepted undocumenteds (queue for next run)

One slice from the residual bind:

1. **`cou-maintain`** — FCOUNTRY half only: `c07`–`c12` accepted; `c01`–`c06` (COU200 screen) and `c13` **deferred** — must not be deepened.

**Re-run this paste** (one slice per run). After it, the conveyor is idle until the next ORD bind wave (`ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500` per the bind record) — and this run's pointers give that bind three concrete things to look at in `ORD200`/`ORD201`/`ORD202`.

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, and now `dat-utils`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; the UDFs are not in that vertical and this run does not propose widening `atu-merlin-ts-cus-v1`. `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08). `cou-maintain` was not touched. `ORD200` / `ORD201` / `ORD202` / `ORD500` / `ORD901` / `CUS200` / `ORD100` / `ART801` / `ORDERCUS.VIEW` / `SAMMNU.MENU` were cited as call sites, sibling implementations, writers of the input columns or absence evidence only — their slices were not deepened.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `dat-utils-cNN` (same decision as runs 1–5; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- The Cloud Agent VM checked out a scratch branch at `de4fa27`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Phase A's `SME_BRIEF` recommended accept for `c01`/`c07`, thin/fold for `c04`/`c05`/`c06`/`c08` and defer for `c02`/`c03`; the room accepted all eight as separate candidates, so they are eight separate cards cross-referencing each other. Not merged, not demoted.
- Two Phase A facts corrected in the cards rather than silently rewritten (`c04` parameter count; `c07` `ORD202` mechanism) — the Phase A `CANDIDATES.md` is left as the historical record.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. One accepted slice still undocumented (above). Estate scan still partial (`overnight/METHOD_COVERAGE.md`); 7 Phase A ORD/ART slices unbound; deferred slices per the bind record.

## 9. Next action

**Re-run this paste** → it will pick `cou-maintain` (FCOUNTRY `c07`–`c12` only; `c01`–`c06`, `c13` stay deferred). In parallel, a human SME should work the sign-off checklist in `discovery/dat-utils/SME_BRIEF.md` — the sentinel-vs-NULL answer (`c01`/`c07`) is the one that shapes how the later ORD Architecture pack treats every date column.
