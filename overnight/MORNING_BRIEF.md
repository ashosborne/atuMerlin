# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 16 · 2026-09-09 11:17 – 12:2x UTC (12:17–13:2x Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `f2f7e6c` (operator PASTE-convert commit; RUN tip `ed1687c`)
Previous briefs preserved in git: Pack B run 15 at `22eab31:overnight/MORNING_BRIEF.md`; run 14 at `b8feaf9`; run 13 at `0de4efa`; run 12 at `ee67225`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`srvpgm-supporting`** (job preference; fourth of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, Ash authorized, Field recorded). The binding layer: `SAMPLE.BNDDIR` (eleven `*LIBL` service-program entries), the two `CRTPGM` members `PRO200.ILEPGM` / `PAR201.ILEPGM`, the eight `CRTSRVPGM` members, the six binder sources in `QSRVSRC`, and — read as citations only — every H-spec / `ctl-opt`, `/COPY`, `export` keyword and bound call site that decides who imports what from whom. 5 surfaces (`bnddir:SAMPLE` + the four `unknown` `srvpgm:XML` / `XSS` / `ORDER` / `TXT`), 9 candidates, **all accepted** by the bind (8 `observed-in-code`, 1 `inferred`). Nothing in this slice is business behaviour; the cards are build contracts and the dependency graph.

## 2. Cards written / needs-SME left

- **9 / 9** accepted behaviours now have as-is cards: `discovery/srvpgm-supporting/features/srvpgm-supporting-c01.md` … `c09.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 9 `documented`; `c05` keeps `confidence: inferred` on its card (what each program imports is exact source; how three of them bind is build metadata outside the tree — run-13/14/15 practice).
- **0** candidates left without a card (the bind held nothing back); **0** `blocked`. Auto-accept policy not exercised. The four `unknown` surfaces stay `unknown` — `c02` records the absence and the 23 procedure names the tree expects of `XML` / `XSS`; nothing is invented about them.
- **9 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - **`c07` — Phase A corrected, one command to confirm:** the fourteen ILE programs without an `actgrp` keyword take the compiler default, which is **`QILE`**, not a new group per program. If the build does not override it, every service program's static state (seven `usropn` files, seven last-key caches, `LOG300`'s pointer and `User`) is **one instance per job shared by every screen**, alive until `RCLACTGRP QILE` / sign-off — so the cache staleness the `*-modules` cards describe is job-wide, not per program. `DSPPGM ORD100 DETAIL(*BASIC)` (any of the fourteen) settles it. Room: the target should reproduce none of it (every `*-modules` card already says "read fresh").
  - **`c05` (`inferred`) — build owner:** `PRO203`, `ORD500`, `ORD700` import `XSS` / `FPARAMETER` / `LOG` with **no `bnddir`, no `.ILEPGM`, no create command in the tree**; `iproj.json` has no per-object options and `.elias/hashList.json` is 138 source hashes. A build-level `BNDDIR(SAMPLE)` would bind two of them but **not `ORD700`** (`LOG` is not in `SAMPLE`), so the answer is ARCAD cross-reference binding or a former `.ILEPGM`. `LOG100` needs no binding (three `extpgm` prototypes).
  - **`c02` — source owner:** `PRO202` and `PRO203` **do not compile from this tree** — their prototypes come from `/copy qprotosrc,xml` / `/copy qprotosrc,Xss` (the only member-style copies in the tree) and `QPROTOSRC` has no such members. The 7 + 16 procedure names in the call sites are the entire interface specification of the purchase-order XML and the article spreadsheet. `ORDER` / `TXT`: named in the directory and nowhere else.
  - **`c06` — ME / build owner / `par-maintain` owner:** every one of the six `.BND` lists matches its modules' `export` keywords symbol-for-symbol; **`EXPORT(*ALL)` exports module exports only — `FPARAMETER` exports 5, `LOG` exports 1**; the estate exports 57 distinct names; the copybooks over-advertise seven `Close*` procedures nobody exports and `GetArtInfo` which only the unbound `ART302` exports. Derive the target module API from the imports (`c03`–`c05`), not the copybooks. `FFAMILLY.BND` is in source order while the other `'V1'` lists are alphabetical — with a fixed signature the order is the binary contract.
  - **`c03` — `art-*` owner (held):** `ART250` imports `GetArtInfo` and no service program in the tree exports it — the existing `ART302` question (INDEX row 4), restated as a binding fact, not answered. `ORD200` / `ORD201` / `ORD202` carry `bnddir('SAMPLE')` and import nothing bound (inert — the ORD conversion already treats them so).
- **Phase A corrected — `c07`:** "compile default = new AG per program" → default is `QILE`; the per-program reading would need `ACTGRP(*NEW)`, which appears nowhere (`actgrp` grep: eight `*CALLER` + two `QILE`, nothing else). Flagged runtime-confirm on the card and in `needs_sme`, not asserted.
- **Phase A sharpened:** `c02` (copybooks missing too; 7 + 16 names; two outputs unspecifiable), `c03` (nine importers / three inert / one unresolvable; six of eleven entries consumed), `c04` (`BNDSRVPGM` lists match imports one-to-one; `PRO202` is a module reached by `extproc('PRO202')`, not a `*PGM`; `.PGM.` infix = program / module switch across 21 + 16 members), `c05` (`LOG100` excluded; `BNDDIR(SAMPLE)` cannot explain `ORD700`), `c06` (`.BND` ↔ module cross-check 10/4/15/4/14/4; `FPROVIDER` `*PRV` dated 25/10/16, object renamed `PROVIDER` → `FPROVIDER`; `FFAMILLY.ILESRVPGM` `%TEXT` "Functions Country"), `c08` (the cause is `ART301:164-165`; graph acyclic, two levels; `FFAMILLY` before `FARTICLE`), `c09` (thirteen ARCAD "Direct Object" snapshots incl. `LASTORDNO.DTAARA`, two libraries `FGRMON_OBJ` / `FGRMON_DTA`, one four-second export run 2022-05-17 14:54:17–21; `iproj.json` `repository` → `AdrianAtArcad/atuMerlin`).
- Pointer-only observations left for other slices (not deepened): PRO members cited for H-specs, `/copy` lines, imports and the `PRO200` → `PRO202` bound call only — no PRO behaviour, planted defects untouched; `ART300` / `ART301` / `ART302` / `FAM300` / `FAM301` cited for `export` keywords and two call lines only (held); `LASTORDNO.DTAARA` for its ARCAD header only. **One card outside the slice was edited** — see §7.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/srvpgm-supporting/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. Nothing in this slice is characterisable behaviour; the note lists the `DSP*` build-time checks a build owner would run instead (`DSPBNDDIR SAMPLE`; `DSPPGM … DETAIL(*SRVPGM)` for the twelve + three; `DSPPGM … DETAIL(*BASIC)` for the activation group — the one check that changes a conclusion; `DSPSRVPGM … DETAIL(*PROCEXP)` expecting 10/4/15/4/14/4/**5**/**1**; `DSPOBJD` vs the 2022 snapshot; `WRKJOB OPTION(*ACTGRP)` after two screens).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice srvpgm-supporting --slice par-maintain`; no new surfaces/behaviours; one run note appended; `par-maintain-c10` name/notes refreshed from its corrected MANIFEST summary):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 145 | **154** (+9 `srvpgm-supporting`) |
| behaviours `candidate` | 116 | 107 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 36 / 25 / 3 / 7 | **37** / 24 / 3 / 7 (`bnddir:SAMPLE` → accepted; `srvpgm:XML` / `XSS` / `ORDER` / `TXT` stay `unknown`) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `srvpgm-supporting`: 5 surfaces, 9 behaviours, **9 documented**.
- **Bind mirror (cap 1):** only `srvpgm-supporting` was mirrored this run (plus the `par-maintain-c10` text refresh). The other six night-wave slices (`sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive`, `pro-modules`, `pro-cobol-pro201`) read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` (or `deferred`) in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–15.
- `docs/estate/INDEX.md`: row 25 `srvpgm-supporting` → **done** with the headline findings; header line notes run 16 and the `par-maintain-c10` correction.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 15).

## 5. Remaining accepted undocumenteds (queue for next run)

Six, in the bind record's preferred order (cap 1 per run; Ash sets `overnight/AGENT_JOB.md` line 1 back to `RUN` each time):

1. `sql-objects` (10; `CUSSEQ` / `ART801` pointer surfaces)
2. `ord-batch-ord900` (9)
3. `cou-maintain` COU200 half (`c01`–`c06`, `c13`; FCOUNTRY half already documented in run 7)
4. `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes; `c07` / `c12` outputs cannot get past "file written to `PATH`" until `XML` / `XSS` are seen — `srvpgm-supporting-c02`)
5. `pro-modules` (14)
6. `pro-cobol-pro201` (10)

Still held per the bind record: `art-interactive`, `art-modules` (wait `ART302` / SME — `srvpgm-supporting-c03` / `c06` / `c08` restate the binding side of that question), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `par-maintain` (now with the `c10` correction to accept), `log-programs`, `menu-cmd-shell`, and now `srvpgm-supporting`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted, read or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1` untouched; the five BOUND residual packs in `architecture/atu-merlin-{vat,dat,cou,par,log}/` and the five `operator/PASTE-convert-*` documents — the trigger commit — not read, not touched; Convert is a different station with its own `ROOM_OK` gate, which this run neither needs nor consumes). `modern/` and `verification/` not touched.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). The four `unknown` surfaces were not promoted. PRO / ART / FAM members, `LASTORDNO.DTAARA`, the ORD / CUS programs were cited as importers / exporters / snapshots only — their slices were not deepened.
- Did **not** fix any found defect (missing `XML` / `XSS` copybooks, inert `bnddir`s, `FFAMILLY` `%TEXT`, unexported `Close*` prototypes, `GetArtInfo` gap) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `srvpgm-supporting-cNN` (same decision as runs 1–15; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- One `inferred` row (`c05`) was bound `accepted` (not held as needs-SME); carded with the confidence kept and the source/build split stated, as runs 13–15 did. If the room prefers `inferred` rows to stay card-less, the card can be withdrawn — flagged, not decided here.
- **One card outside the slice was edited: `discovery/par-maintain/features/par-maintain-c10.md`** (plus its `MANIFEST.yaml` `c10` name/summary and one line of `discovery/par-maintain/SME_BRIEF.md`). Run 13 had read `EXPORT(*ALL)` as "all seven procedures exported, incl. `chainPARAMETER` / `closePARAMETER`"; `EXPORT(*ALL)` exports *module* exports, and only `GetPARM1`–`5` carry the `export` keyword (`PAR300.RPGLE:22,34,46,58,70`; `:82`, `:100` do not) — so `FPARAMETER` exports five. This run owns the export-contract fact (`c06`), was the only active runner (checked before writing), and the correction was an open item carried since run 13's sibling-run review; applied as a **correction block + struck statements** on the card (title corrected, id / bind / rest unchanged), a `CORRECTED` prefix on the MANIFEST summary, and a struck line in the SME_BRIEF — no card content was deleted. Recorded here and in the JOURNAL as a deliberate one-off outside the cap-1 slice; `par-maintain`'s SME checklist gains one item ("accept the `c10` correction note").
- `c07` bound under the Phase A name "All srvpgms ACTGRP(*CALLER); getter caches scoped per calling program's AG"; the card keeps the id and corrects the scope reading. `c01`–`c06`, `c08`, `c09` names sharpened likewise. `CANDIDATES.md` left as the Phase A record.
- **Three automation runs fired on this job.** The BOUND push (`ad697f3`) and the RUN tip (`ed1687c`) each fired a run at 11:12Z; both were IDLE with nothing on `origin` when this run (fired 11:17Z by the operator PASTE-convert push `f2f7e6c`, line 1 still `RUN`) started — one had lived 8 s, the other ~5 min. This run listed the automation's RUNNING agents before its first write (only itself), re-fetched `origin` before the first commit and before the push. Pattern unchanged from runs 13–15: **any push while line 1 is `RUN` fires another run on the same slice.**
- The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-process-e5d8`) checked out at the trigger commit; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before any write.
- Several statements are platform semantics rather than source, each flagged inference / runtime-confirmable on the card and in `needs_sme`: `EXPORT(*ALL)` = module exports (`c06`); `CRTBNDRPG` / `CRTSQLRPGI` `ACTGRP` default `*STGMDL` → `QILE` and named-group persistence (`c07`); fixed-signature slot semantics, `LVLCHK` default, `*PRV` blocks (`c06`); binding-directory search order and unresolved-imports-only lookup, bind-time `*LIBL` resolution (`c01`); `CRTSQLRPGI` binder options via `COMPILEOPT`, `extpgm` = dynamic call, unresolved import = create failure (`c05`); `CRTRPGMOD` has no `DFTACTGRP`, `CALLPRC` typing (`c04`); the `.PGM.`-infix convention inferred from the tree's consistency (`c04`, `c09`).
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Six accepted slices are still undocumented (queue above); the estate scan is partial (`overnight/METHOD_COVERAGE.md` — the four sourceless service programs remain its largest functional blind spot, now with the sharper fact that two consumers do not compile from the tree); ART slices unbound pending ART302; `fam-maintain` held; sixteen `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 back to `RUN` (job header should prefer `sql-objects` next) — one slice per run, six to go. A Pack B run takes ~40–60 minutes; **any push to the branch while line 1 is `RUN` fires another run on the same slice** — this run was fired by the PASTE-convert push, not by a job flip, and two sibling runs had already come and gone. Cheapest protection: push operator / ME / room artefacts only while line 1 reads `DONE`, or wait for the DONE flip before pushing. **Build owner (one command each, three facts):** `DSPPGM ORD100 DETAIL(*BASIC)` (activation group of the fourteen — decides cache scope), `DSPPGM ORD700 DETAIL(*SRVPGM)` (how `LOG` is bound), `DSPBNDDIR SAMPLE` + `DSPOBJD XML/XSS/ORDER/TXT *SRVPGM` (which library, which product). **Room:** the recommendation to `reject` `srvpgm-supporting` as a conversion slice and carry `c01` / `c03` / `c06` / `c07` / `c08` as architecture notes stands; the five residual Convert pastes are a separate station and were not looked at.
