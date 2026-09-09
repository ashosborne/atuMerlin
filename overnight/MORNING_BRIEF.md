# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 12 · 2026-09-08 23:50 – 2026-09-09 00:25 UTC (00:50–01:25 Europe/London, 2026-09-09)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `c0fbaa2`
Previous briefs preserved in git: Pack B run 11 at `a664dfc:overnight/MORNING_BRIEF.md`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`ord-print-ord500`** (job preference; the only remaining accepted undocumented slice — last of the five ORD-wave slices). `ORD500(orid)` — the order print: one RPGLE program (60 lines), one CL wrapper `ORD500C` (14 lines), one printer file `ORD500O.PRTF` (112 lines); 2 surfaces (`pgm:ORD500`, `cl:ORD500C`), 8 candidates. Bound in the ORD-wave room bind (`overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`; `discovery/ord-print-ord500/BIND.md`): `c01`–`c03`, `c05`–`c08` accepted; `c04` needs-SME (`inferred` — the `CVTSPLPDF` processing program is not in the tree). `atu-merlin-ts-cus-v1`, `modern/` and `verification/` were **not** touched; no ORD Architecture pack was drafted (job header: that is the ME's next step, with `ROOM_OK`).

## 2. Cards written / needs-SME left

- **7 / 7** accepted behaviours now have as-is behaviour cards: `discovery/ord-print-ord500/features/ord-print-ord500-c01.md` … `c03.md`, `c05.md` … `c08.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 7 `documented`, `c04` explicit `needs-SME`.
- **1** `inferred` candidate stays needs-SME without a card (`c04`); **0** `blocked`. Auto-accept policy not exercised.
- **10 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - `c08` / `c05` — **an unknown order id does not print a blank document; it crashes before the first `write`.** `chain id order1` is untested and the next statement converts `ORDATE` unconditionally, so a miss (`ORDATE = 0`) raises an unmonitored date exception — no document, no PDF, `PATH` not read. Option `6` on a ghost row in `ORD200`/`ORD201`, or on a concurrently deleted order, triggers it in the list program's session. Twin of `ord-maintain-ord202-c01` (same two statements) — the pointer runs 9–11 left for this slice, answered. Phase A's `c08` conclusion ("prints blank header fields") is **corrected**. One room answer covers option `5` and option `6`.
  - `c02` / `c03` — **the PDF name truncates a six-digit order id.** `%char(orid)` goes into a 5-byte `const` parameter and `&ORD` is `LEN(5)`: orders 123450–123459 all become `Custord12345.pdf` and, with `STMFOPT(*REPLACE)`, overwrite each other. Latent today (ids from `LASTORDNO` are far below), real in the field widths.
  - `c01` — **15 detail lines per page, not 14** (`count > 14` tested before the increment). Continuation pages re-write the company block and order line but **not the customer block**. Phase A corrected.
  - `c03` — **the whole PDF step is unmonitored.** `ORD500C` has no `MONMSG`, `ORD500` no `monitor`: missing/blank directory, command or processing program not on `*LIBL`, conversion error — all propagate to the interactive caller; in `ORD100` after the order is written and before "The order is printed." `SPLNBR(*LAST)` works only because `ORD500` closes the printer file right before the call (`c07` marks that `close` as load-bearing).
  - `c04` — **still the one blind spot.** Which product supplies `CVTSPLPDF`, and is the PDF in parity scope, or is "a PDF named `Custord<orid>.pdf` exists under `PATH`" the contract? Blocks any RECORD of the PDF step.
- Other facts recorded in the cards (as-is, cited): VAT on the document is `TOTTOT − TOTNET` of the **stored** line totals — never recomputed; the `vat-module-c02` silent-zero case prints a blank `VAT` line (`c01`); `PATH` is read once per activation group and cached (`FPARAMETER` last-key cache, `ClosePARAMETER` called by nobody), a missing row yields a blank directory passed unchecked — Phase A's open question answered up to the converter boundary (`c02`); a re-print replaces the PDF, so it is always the latest print; spooled files accumulate (`c03`); printing is an unconditional synchronous side effect of every `ORD100` confirm; `ORD101` declares the prototype and never calls; exactly three call sites, no menu/CMD/CL (`c05`); a missing article repeats the previous line's description where `FARTICLE` returns blank; `ARDEL`/`CUDEL` never tested; `ORD500` needs `FPARAMETER` but names **no `bnddir`** — binding is a build fact (`srvpgm-supporting-c05`) (`c06`); layout facts — country as the 2-char code, delivered quantity not printed, delivered/closed print like open, order date in the **job's** date format (`ORD202` uses `*DMY`), `Order Number 2016/   123`, `'This is the footer .'` with the dot at column 90, hard-coded `'Company Sample'` address (`c01`); dead `datord = %date()` preset, `oflind(overflow)` declared without a D-spec and never tested, `*inlr` before the totals, accumulators that exist only as printer-file fields (`c07`).
- Pointer-only observations left for other binds (not deepened): `FPARAMETER` / `PAR300` body and `PAR200` maintenance (`par-maintain`, unbound); missing-`bnddir` binding (`srvpgm-supporting`, unbound); `FARTICLE` miss semantics (`art-modules`, unbound); `GetCusName` (`cus-modules`, documented). No card outside `discovery/ord-print-ord500/` edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/ord-print-ord500/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The CUS pack's `WAIVED_PATHFINDER` is **not** extended. The note lists what a future RECORD would capture (the spooled document for a populated, a 15-line, a 16-line and an empty order; the blank `VAT` line; the missing-article and missing-customer renderings; the PDF name including case, replace-on-reprint, the blank-`PATH` outcome, the name for an id ≥ 100000; the `ORD100` wait and window; and — first — option `6` on a ghost row in each list) and the three facts to settle first (build definition / binding / activation group; the `CVTSPLPDF` provider and scope; the actual `PATH` value and directory on the box).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice ord-print-ord500`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 106 | **113** (`cus-interactive` 12 + `cus-modules` 10 + `ord-entry-ord100` 12 + `ord-trigger-ord700` 8 + `vat-module` 10 + `dat-utils` 8 + `cou-maintain` 6 + `ord-entry-ord101` 11 + `ord-maintain-ord200` 12 + `ord-maintain-ord201` 11 + `ord-maintain-ord202` 6 + `ord-print-ord500` 7) |
| behaviours `candidate` | 155 | 148 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` | 23 / 38 / 3 | **25** / 36 / 3 (`pgm:ORD500`, `cl:ORD500C` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `ord-print-ord500`: 2 surfaces, 8 behaviours, **7 documented**, weakest status `candidate` (`c04` needs-SME is mirrored as `candidate` by design — `mark_documented.py` mirrors only accepted/documented/deferred/rejected).
- **Bind mirror gap closed:** every surface of the five ORD-wave slices now reads `accepted` (or `documented` behaviours) in `APP_MANIFEST.yaml`; the INDEX header caveat about row 10 is removed.
- `docs/estate/INDEX.md`: row 10 `ord-print-ord500` → **done** with the headline findings; header line notes run 12 and the empty ORD-wave queue.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 11).

## 5. Remaining accepted undocumenteds (queue for next run)

**None.** The ORD-wave queue is empty: all five slices of the 2026-09-08 ORD bind (`ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`) are carded, and the two ORD slices documented earlier (`ord-entry-ord100`, `ord-trigger-ord700`) complete the ORD in-scope set named in the bind record. The document conveyor is **idle** until more slices are bound from the Pack A radar (candidates still unbound: `art-*` pending ART302, `par-maintain`, `srvpgm-supporting`, `sql-objects`, `menu-cmd-shell`, `log-programs`, `pro-*`, `fam-maintain`; `ord-batch-ord900` and the `COU200` half deferred).

The job header's next step now applies: **ME drafts the new ORD Architecture pack (`ROOM_OK` then).** Inputs this run adds for that pack: the not-found-order answer must cover print (option `6`) as well as display (option `5`); the 5-character PDF name; `PATH` as configuration; whether print stays a synchronous side effect of confirm; whether the PDF is in scope at all (`c04`).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, and now `ord-print-ord500`.

## 6. Explicit non-claims

- Did **not** convert anything. Target stack stays in `TARGET.md` / the bound CUS PACK for later stations; this run does not draft or widen any Architecture pack (`atu-merlin-ts-cus-v1` untouched; the ORD pack is a later, new pack behind `ROOM_OK`). `modern/` and `verification/` were not touched. `ROOM_OK` was not needed for this station and is not claimed.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-08; `c04` left needs-SME). `ORD100`/`ORD200`/`ORD201`/`ORD101` (call sites), `ORD202` (twin conversion), `PAR300`/`PARAMETER`/`FPARAMETER.ILESRVPGM`/`SAMPLE.BNDDIR` (parameter mechanism and binding), `ART300` (`FARTICLE` body), `CVTSPLPDF.CMD` (parameter definition) and the `ORDER`/`ORDER1`/`DETORD`/`DETORD1`/`CUSTOMER`/`CUSTOME1`/`ARTICLE`/`ARTICLE1`/`SAMREF` DDS were cited as call sites, contrasts or field definitions only — their slices were not deepened and no card outside `discovery/ord-print-ord500/` was edited.
- Did **not** fix any planted or found defect (unguarded `%date` on a not-found id, truncated PDF name, stale description on a missing article, blank `PATH` pass-through, unmonitored escape path, silent-zero VAT on paper) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`.
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `ord-print-ord500-cNN` (same decision as runs 1–11; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- `c08` was bound under the Phase A name "Unknown order id prints blank document"; the card keeps the id and records the corrected behaviour under a corrected name (`MANIFEST.yaml`, `SME_BRIEF.md`). `CANDIDATES.md` left as the Phase A record.
- The Cloud Agent VM checked out a scratch branch (`cursor/atumerlin-job-runner-process-3337`) at `c0fbaa2`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before writing anything, as the job requires.
- Several statements are platform semantics rather than source: the `const`-parameter truncation rule (`c02`), the implicit definition of an undeclared `OFLIND` name (`c07`), the `SKIPB`/`SPACEB` line arithmetic and `EDTCDE(2)` blank-for-zero (`c01`), the CL escape → RPG status 00202 → caller's function check path (`c03`), the `RNQ0112` inquiry surface (`c08`), and the command-analyser `TYPE(*NAME)` case question (`c03`). Each is flagged inference / runtime-confirmable on the card and in `needs_sme`.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. No accepted slice is undocumented, but the estate scan is still partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; `par-maintain`, `srvpgm-supporting`, `sql-objects` and the rest of the radar unbound; deferred slices per the bind records; twelve `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash / room:** the ORD-wave document pass is complete — hand to the **ME to draft the new ORD Architecture pack** (`ROOM_OK` required for that station; never widen `atu-merlin-ts-cus-v1`). Before drafting, decide the two questions every ORD run since 9 has raised: the not-found-order behaviour (now for display *and* print) and which list twin is the parity reference (run 10). Then either bind the next wave from the Pack A radar and set `overnight/AGENT_JOB.md` line 1 back to `RUN`, or leave the conveyor idle. **SME:** work the `ord-print-ord500` checklist — `c04` (who owns `CVTSPLPDF`; is the PDF in scope) is the one item with no source answer; the not-found crash and the truncated PDF name are defects to confirm as-is.
