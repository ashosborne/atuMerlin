# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 19 · 2026-09-09 22:36 – 23:1x UTC (23:36 – 00:1x Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `a792163` (an ME ord-batch pack refinement pushed while line 1 already read `RUN`; the RUN tip is earlier in the same burst)
Previous briefs preserved in git: Pack B run 18 at `c98cebf:overnight/MORNING_BRIEF.md`; run 17 at `72340fd`; run 16 at `369065b`; run 15 at `22eab31`; run 14 at `b8feaf9`; run 13 at `0de4efa`; run 12 at `ee67225`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`cou-maintain` — COU200 half (`c01`–`c06`, `c13`)** (job header: "Prefer: cou-maintain COU200 half ONLY"; seventh of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`, Ash authorized, Field recorded; supersedes the 2026-09-08 residual bind's `deferred` on these seven). One OPM RPG III program — `COU200` "Work with Countries", menu option 21, 138 lines, the only member in `QRPGSRC` — plus its display file `COU200D` and the `COUNTRY.PF` it writes directly. 1 surface (`pgm:COU200`), 7 candidates, **all accepted** by the bind, all `observed-in-code`. All three members read in full. **The FCOUNTRY half (`c07`–`c12`, run 7) was not re-carded and its cards were not edited** (job header). The slice is now 13/13 carded.

## 2. Cards written / needs-SME left

- **7 / 7** accepted behaviours now have as-is cards: `discovery/cou-maintain/features/cou-maintain-c01.md` … `c06.md`, `c13.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → 13 `documented` (header `documented_by` / `bind_status` / `updated_at` refreshed; the six run-7 rows untouched).
- **0** candidates left without a card; **0** `blocked`; no `inferred` row in this half. Auto-accept policy not exercised.
- **5 new needs-SME lines** in `MANIFEST.yaml` `needs_sme` (the five run-7 lines kept). The ones worth Ash's attention first:
  - **`c13` — room (the slice's main question, Phase A restated):** **retire-and-replace vs convert** `COU200`. Inputs from the cards, all as-is: one operation (edit name / ISO-3), **no validation of anything**, unguarded concurrency, no create / delete anywhere in the estate, list F12 = exit while edit F12 = "next selected row, row still locked", and a list that never reflects the edit. The COU Architecture pack (`atu-merlin-ts-cou-v1`, BOUND, converted, verified) keeps the panel half **out of scope** "until Pack B cards it **and** pack SUPERSEDEd" (`architecture/atu-merlin-cou/PACK.yaml:30,96-97`). Carding is now done; whether the ME proposes a superseding pack version with a maintain surface, or `country` stays read-only in the target, is the ME's / room's call — not this station's.
  - **`c02` — room / product owner:** does the target need **ISO-3 validation** (format, uniqueness, consistency with the 2-character code)? As-is: `S02CHK` is `MOVE 'ACT'` and nothing else — blank, short, lowercase-uppercased and duplicate ISO codes are all written; every Enter writes, changed or not; no audit columns, no commitment control. And: is an unaudited, unconfirmed edit of reference data acceptable given the converted CUS / ORD / PRO surfaces read the name through `GetCountryName`?
  - **`c04` — room / product owner + data owner:** the estate has **no create / delete path for countries anywhere** (`COU200.RPG:7` is the only update-capable declaration of `COUNTRY`; no `WRITE` / `DELET` / SQL / `CPYF` / trigger touches it; no delete flag — contrast `CUDEL` / `PRDEL` / `ARDEL`). A target that adds create / delete **adds behaviour**. How do countries reach the box today (out-of-tree loader)?
  - **`c03` / `c05` / `c06` — room (target presentation, five yes/no lines on the SME_BRIEF):** re-validate existence before write [as-is no]; release the row on cancel [no]; return to the list after each save / cancel [no — next selected row]; list F12 = exit [yes]; live list refresh [no].
  - **`c02` / `c03` — build owner:** `WAITRCD` of `COUNTRY` (the wait before the unhandled record-lock exception); `CRTRPGPGM` options for the one OPM member (no compile spec in the tree).
- **Phase A corrected:** none — all seven Phase A statements hold. **Sharpened:** `c01` (the `PAGEDOWN(25 'dynamic subfile')` keyword is **dead** — conditioned `N80`, 80 is on at every `EXFMT`, `*IN25` never tested; the controller pages the extendable subfile; invalid option anywhere defers valid `2`s to the next Enter; page memory via INFDS 378–379; empty file → heading, no message; contrast `CUS200` / `PRO200` 14-per-pass with a `pagedown` handler), `c02` (`S02CHK` is empty; every Enter writes; `COISO` keyboard-uppercased, `COUNTR` not; the panel is the only screen that shows or edits `COISO`; `COU200.RPG:7` the only `UF` declaration in the tree), `c03` (two failure modes — deleted row → stale panel → exception on Enter; locked row → exception before the panel; the `G` reply re-raises; **no in-tree trigger** for the deleted case; the ILE panels test their chains), `c04` (estate-wide census of writers, CL, SQL, triggers; RI consequences for `CUCOUN` / `PRCOUN`), `c05` (list F3 and F12 branches textually identical; edit F3 is a `GOTO` out of the subroutine; edit F12 → **next selected row**, no write, no reload, **lock kept** until the next `CHAIN` or `LR`), `c06` (edits in `COID` order regardless of typing order; the only `UPDAT SFL01` in `ACT` precedes the edit; typed `0` leaves a permanent `SFLNXTCHG` flag — harmless), `c13` (RPG/400 not S/38 — uses `SELEC`; `%TEXT` blank; `COU200D` has the tree's only ARCAD `AADDSRCARC` text; no `/COPY`, `CALLB`, `CALLP` or `FCOUNTRY` reference; own ODP in the default activation group — *why* the getter cache misses its renames).
- Pointer-only observations left for other slices (not deepened, not edited): `c07` / `c08` / `c12` (FCOUNTRY half — cache test `COU300.RPGLE:57`, `COISO` reader census, activation groups); `menu-cmd-shell-c01` (option 21); `pro-cobol-pro201` (the other language outlier, room-held); `cus-interactive` / `pro-interactive` edit paths as the "ILE panels test their chains" contrast. No card outside the seven new ones edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note extended at `discovery/cou-maintain/CHARACTERIZATION.md` (both halves) and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The note lists the checks an SME would run instead for the COU200 half (Page Down on the last page; option matrix; write-on-unchanged-Enter via file change timestamp; the two `c03` exception captures with `WAITRCD`; `DSPRCDLCK` after an edit F12; edit order and stale list; `DSPPGM` / `DSPPGMREF` for `c13`; the cross-job cache-staleness scenario). The COU pack's own `WAIVED_PATHFINDER` (FCOUNTRY half) is **not** extended by this run.

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice cou-maintain`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 173 | **180** (+7 `cou-maintain` COU200 half) |
| behaviours `candidate` | 88 | 88 |
| behaviours `deferred` | 7 | **0** (the seven were exactly this half) |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 44 / 19 / 1 / 7 | **45** / 19 / **0** / 7 (`pgm:COU200` deferred → accepted — run 18's tool lift, as predicted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `cou-maintain`: 4 surfaces, 13 behaviours, **13 documented**, weakest status `documented`. **No `deferred` behaviour or surface remains in the inventory.**
- **No tool change** this run (run 18's `mark_documented.py` lift did exactly what it was written for: `surfaces status-bumped 1`).
- **Bind mirror (cap 1):** only `cou-maintain` was mirrored. The three `pro-*` slices read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–18.
- `docs/estate/INDEX.md`: row 17 `cou-maintain` → **done** for all 13 (was "done FCOUNTRY half · COU200 half deferred"); header line notes run 19 and the superseded deferral.

## 5. Remaining accepted undocumenteds (queue for next run)

Three accepted and undocumented; **zero runnable** under the run-19 job header — the runnable queue is **empty**.

**Room-held by the job header ("Hold: pro-interactive, pro-modules, pro-cobol-pro201")** — accepted in the bind record, not to be run until the header releases them: `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes; `c07` / `c12` outputs cannot get past "file written to `PATH`" until `XML` / `XSS` are seen — `srvpgm-supporting-c02`), `pro-modules` (14), `pro-cobol-pro201` (10 — the COBOL language outlier; `c13` of this run is its RPG III counterpart).

Still held per the bind record and the job header: `art-interactive`, `art-modules` (wait `ART302` / SME), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (**both halves now**), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `par-maintain`, `log-programs`, `menu-cmd-shell`, `srvpgm-supporting`, `sql-objects`, `ord-batch-ord900`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted, read into code, or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, the five residual packs incl. `atu-merlin-ts-cou-v1`, and the ORD-batch DRAFT pack untouched; `architecture/atu-merlin-cou/PACK.yaml:30,36,67,96-97,140-141`, `modern/README.md:655,681,721,749`, `modern/db/schema.sql:324,330` cited read-only for the "panel half out of scope / `COU200` only writer of `country` / no maintenance path" statements — no line of `architecture/`, `modern/` or `verification/` changed). Carding the panel half meets the pack's first supersede condition; it does **not** supersede the pack. Convert / Verify are different stations with their own `ROOM_OK` gates, which this run neither needs nor consumes.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). Did **not** re-card or edit `c07`–`c12` (job header) — their "the deferred `COU200` panel" wording is left as written on 2026-09-08 and glossed in the SME_BRIEF.
- Did **not** fix any found defect (dead `PAGEDOWN` keyword, empty `S02CHK`, untested indicator 98, lock kept after F12, stale subfile row) — all recorded as-is.
- Did **not** decide `c13` (retire vs convert) or `c04` (create / delete in the target). Phase A's recommendations are restated as recommendations.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `cou-maintain-cNN` (same decision as runs 1–18).
- The slice's `MANIFEST.yaml` header (`documented_by`, `bind_status`, `updated_at`, `feature_id_note`, one `out_of_scope_hints` line that said "COU200 … deferred at bind … not deepened") was refreshed to describe both halves; the six FCOUNTRY feature rows and cards were **not** touched. Their MANIFEST summaries still say "deferred COU200 panel" — a wording gloss is in the SME_BRIEF rather than an edit, to honour "do not re-card c07–c12" literally. If Ash prefers the six rows' wording updated, it is a five-word change per row for a future sole runner.
- Several statements are RPG/400 / DDS semantics rather than source, each flagged inference / runtime-confirmable on the card and in the CONTEXT_GATE: extendable-subfile paging by the controller; inactive `PAGEDOWN` under an off indicator; INFDS 378–379 meaning; `SFLRCDNBR` positioning; `CA` keys carry no data; keyboard uppercasing without `CHECK(LC)`; `CHAIN` lock lifetime on a `UF` file; `UPDAT` without prior read → `RPG1221`-class exception → inquiry message; OPM default activation group; `GOTO` out of a subroutine; RPG/400 `INDARA` mapping; `READC` order / EQ indicator.
- **Single run this time.** Before the first write the run listed the automation's agents (RUNNING / NOT_YET_STARTED / WAITING): it was the only one alive. `origin` re-fetched before the first commit and before the push.
- The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-process-17c9`) checked out at the trigger commit; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before any write.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Three accepted slices are still undocumented (all `pro-*`, room-held — no runnable slice remains); the estate scan is partial (`overnight/METHOD_COVERAGE.md` — the QM queries `ARTQRY` / `CUSQRY` remain the report-side blind spot; this run adds the data-load blind spot that how `COUNTRY` is populated is invisible from source); ART slices unbound pending ART302; `fam-maintain` held; eighteen `SME_BRIEF` checklists unsigned (`cou-maintain`'s now covers both halves).

## 9. Next action

**Ash:** the runnable Pack B queue is **empty**. Options, in the order the bind record lists them: (a) release the three `pro-*` holds in the job header and set line 1 to `RUN` (one slice per run; `pro-interactive` first per the bind record — 15 cards, the planted `PRO200` bug and XML/XSS stay as-is); (b) leave the conveyor idle. Either way, push operator / ME / room artefacts only while line 1 reads `DONE` (a push while `RUN` fires another run on the same slice). **Room (one decision that reshapes the slice):** `c13` — retire-and-replace or convert `COU200`; with it `c04` (create / delete in the target or not) and `c02` (ISO-3 validation or not). **ME (COU pack):** the pack's "until Pack B cards it and pack SUPERSEDEd" clause is half met — propose a superseding version with a maintain surface, or record that `country` stays read-only; either needs `ROOM_OK` in the AGENT_JOB body before an Architecture-bind / Convert runner may act. **Data owner (one question):** how are countries loaded on the box. **Build owner (two lookups):** `DSPFD COUNTRY` for `WAITRCD`; the `CRTRPGPGM` options for `COU200`.
