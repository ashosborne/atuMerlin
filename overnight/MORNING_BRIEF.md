# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 15 · 2026-09-09 10:30 – 11:25 UTC (11:30–12:25 Europe/London) across two automation runs (see §7)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `7e5a8dd` (ME DRAFT-packs commit; RUN tip `fdde069`)
Previous briefs preserved in git: Pack B run 14 at `b8feaf9:overnight/MORNING_BRIEF.md`; run 13 at `0de4efa`; run 12 at `ee67225`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`menu-cmd-shell`** (job preference; third of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, Ash authorized, Field recorded). The application shell: `SAMMNU.MENU` (UIM menu panel `SAMPLE` — 20 options in three groups, long command line, 14 wired keys), `SAMHELP.PNLGRP` (five placeholder help modules), `SAMMSGF.MSGF` (ARCAD-generated build script, 12 messages) and `CVTSPLPDF.CMD` (14-parameter command definition); 4 surfaces (`menu:SAMMNU`, `pnlgrp:SAMHELP`, `msgf:SAMMSGF`, `cmd:CVTSPLPDF`), 9 candidates, **all accepted** by the bind (8 `observed-in-code`, 1 `inferred`: `c02`, the three options whose targets are absent from the tree). The shell is an adapter; the Phase A recommendation to `reject` it as a conversion slice and use the cards as navigation / resource spec is unchanged and left to the room. `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, `modern/` and `verification/` were **not** touched or cited; no Architecture pack drafted; the five DRAFT packs in the trigger commit (`architecture/atu-merlin-{vat,dat,cou,par,log}/`) were not read or touched.

## 2. Cards written / needs-SME left

- **9 / 9** accepted behaviours now have as-is behaviour cards: `discovery/menu-cmd-shell/features/menu-cmd-shell-c01.md` … `c09.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 9 `documented`; `c02` keeps `confidence: inferred` on its card (the menu actions and the absence are source facts; what the missing objects do is outside the tree — run-13/14 practice).
- **0** candidates left without a card (the bind held nothing back); **0** `blocked`. Auto-accept policy not exercised.
- **8 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - **Room — is the menu a slice at all, and which options does the target carry?** `c01`'s 20-row table (option → action → title → label → target → owning slice) is the navigation spec. Options 80/81/82 are unguarded destructive resets (`ORD900`, `ORD901`, `ART801`), 84 is a log dump, 90 is signoff — offered to every user; the menu adds no authority check. Recommendation unchanged: `reject` as a conversion slice; use `c01` as the spec.
  - `c02` — **source owner:** `CUSQRY`, `ARTQRY` (`*QMQRY`), `CUSQRYFMT` (`*QMFORM`) and `ADSPUSRSPC` have no source anywhere in `ATU_SRC` (no `QQMQRYSRC` / `QQMFORMSRC` directory; `QCMDSRC` = `CRTORD` + `CVTSPLPDF` only). Their menu titles ("Customer with Open Order", "Article by Last Order Date") are the only specification of the two reports; the Reports group's one in-tree member (`PRO203`) is a selection screen, so the group holds **zero** documentable reports. Two reports and the only reader of the application log are unspecifiable until the objects arrive.
  - `c07` — **ops / build owner:** "no `PGM()` in source" is the normal shape of command source — the processing program is `CRTCMD PGM()`, a build parameter, and **no `CRTCMD` exists anywhere in `ATU_SRC`** (same for `CRTORD` → `ord-entry-ord100-c09`). `DSPCMD CVTSPLPDF` on the box settles product, library and program in one step. `PMTCTL` only governs prompting; with no `DEP`, the analyzer enforces no cross-parameter rule. Default `STMFCODPAG(1250)` is not overridden by `ORD500C`.
  - `c05` / `c06` — **room — message resource:** carry the **nine live** `SAMMSGF` texts as a target resource keyed by id; drop or reserve the three dead (`ERR0003`/`ERR0004`/`ERR0005`); decide "Familly" once. Mandatory-field texts are DSPF *literals* (`ART200D:90`, `CUS200D:106`), not catalogue entries — an "all messages from the file" assumption is false.
- **Phase A corrected — `c06`: `ERR0001` is live.** `ART200D.DSPF:98` carries `ERRMSGID(ERR0001 *LIBL/SAMMSGF 40)` on the family field `ARTIFA`, raised by `ART200.PGM.SQLRPGLE:286-288` (`errFamilly` when `existArtFam(artifa)` fails). Phase A had read the adjacent literal `ERRMSG(… 41)` on `ARDESC` and stopped. Dead set is three, not four; 9 of 12 live; 12 `ERRMSGID` sites in 9 DSPFs; no programmatic sender anywhere (`SNDPGMMSG` / `QMHSNDPM` with an `ERR` id: none).
- **Phase A sharpened:** `c09` — the `PRO250` "Display Article" mismatch is `%TEXT`-only (`PRO250D.DSPF:24` says `Provider by Id`); the genuinely visible label differences are option 6 (`ORD100` label, `ORD100C2` called), option 7 ("Article by id" vs screen "Article by Code"), option 82 (`SQLPRC:ART801` for `UPDATE_ON_CUS_ORD_QTY`). `c04` — three undefined help names (panel `help=h`, `srt200`, `ord100`), an orphan `SAMHELP` module (`ART200`, never referenced because option 1 says `srt200`), option 3 mis-targeted at `cus200`; 36 `help=` references, five modules, three words of body in total — nothing to preserve. `c01` — every one of the **16** in-tree targets confirmed parameterless (no `PI` / `dcl-pi` / `*ENTRY` / `PROCEDURE DIVISION USING` / `PGM PARM`), so the 16 `cmd call` actions are well-formed; `ORD100`'s `cuid options(*nopass)` is why option 6 goes through the wrapper; option 82 calls the `SPECIFIC`-named `*PGM` of an SQL procedure; nothing in the tree invokes the menu (no `GO`, no initial program). `c08` — `submsgf=sammsgf` is declared but no `msg` reference uses it; the only `msg` is `cpd9817` qualified to `qcpfmsg`. `c03` — 14 keys, eight with legend text; no `LMTCPB`-style restriction in the panel — the profile governs the command line.
- Pointer-only observations left for other slices (not deepened): every called program (cited for existence, entry declarations, `%TEXT` and row-1 headings only — no PRO / ART / ORD / CUS behaviour documented, planted PRO defects untouched); `ORD500C`'s `CVTSPLPDF` call (`ord-print-ord500-c03`, documented); option 84 (`log-programs-c09`, documented); `CRTORD` binding blind spot (`ord-entry-ord100-c09`). No card outside `discovery/menu-cmd-shell/` edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/menu-cmd-shell/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The note lists what a future RECORD would capture (screen capture of `SAMMNU` — corner id, `sysnam` separator, headings, legend; Enter on empty / `11` / `19` / `50` / `99` → `CPD9817` text; F1 on options 1 / 6 / background → UIM error, on 2 / 3 / 4 / 10 → the placeholder windows; each of the 16 `cmd call` options starts without a parameter error; options 12 / 13 / 84 with and without the objects; F4 / F9 / F6 / F10 / F14; `DSPMSGD RANGE(ERR0001 ERR2002)`; `ART200` unknown family → `ERR0001` displayed; `DSPCMD CVTSPLPDF` + F4 prompt layout; `DSPOBJD PRO250 *PGM`) and the two facts to settle first (whether the four absent objects exist on the box; how users reach `SAMMNU`).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice menu-cmd-shell`; no new surfaces/behaviours; one run note appended; `msgf:SAMMSGF` surface note corrected from "8 referenced … ERR0001 unused" to the nine-live / three-dead count):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 136 | **145** (+9 `menu-cmd-shell`) |
| behaviours `candidate` | 125 | 116 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 32 / 29 / 3 / 7 | **36** / 25 / 3 / 7 (`menu:SAMMNU`, `pnlgrp:SAMHELP`, `msgf:SAMMSGF`, `cmd:CVTSPLPDF` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `menu-cmd-shell`: 4 surfaces, 9 behaviours, **9 documented**, weakest status `documented`.
- **Bind mirror (cap 1):** only `menu-cmd-shell` was mirrored this run. The other seven night-wave slices (`srvpgm-supporting`, `sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive`, `pro-modules`, `pro-cobol-pro201`) read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` (or `deferred`) in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–14.
- `docs/estate/INDEX.md`: row 26 `menu-cmd-shell` → **done** with the headline findings; header line notes run 15.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 14).

## 5. Remaining accepted undocumenteds (queue for next run)

Seven, in the bind record's preferred order (cap 1 per run; Ash sets `overnight/AGENT_JOB.md` line 1 back to `RUN` each time):

1. `srvpgm-supporting` (9 + 4 `unknown` surfaces)
2. `sql-objects` (10; `CUSSEQ` / `ART801` pointer surfaces)
3. `ord-batch-ord900` (9)
4. `cou-maintain` COU200 half (`c01`–`c06`, `c13`; FCOUNTRY half already documented in run 7)
5. `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes)
6. `pro-modules` (14)
7. `pro-cobol-pro201` (10)

Still held per the bind record: `art-interactive`, `art-modules` (wait `ART302` / SME), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `par-maintain`, `log-programs`, and now `menu-cmd-shell`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1` untouched; the five residual DRAFT packs in `architecture/atu-merlin-{vat,dat,cou,par,log}/` — the trigger commit — not read, not touched; they await `ROOM_OK`, which this station neither needs nor consumes). `modern/` and `verification/` not touched.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). Called programs, `ORD500C`, `ORD100C2`, `CRTORD.CMD`, `ART801.SQLPRC`, the DSPF `ERRMSGID` lines and row-1 headings were cited as targets / consumers only — their slices were not deepened and no card outside `discovery/menu-cmd-shell/` was edited.
- Did **not** fix any found defect (`srt200` / `ord100` / `h` help names, orphan `ART200` module, option-3 help mis-target, `PRO250` `%TEXT`, `Familly`, inert `submsgf`, dead messages) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `menu-cmd-shell-cNN` (same decision as runs 1–14; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- One `inferred` row (`c02`) was bound `accepted` (not held as needs-SME); carded with the confidence kept and the source/outside-the-tree split stated, as runs 13–14 did. If the room prefers `inferred` rows to stay card-less, the card can be withdrawn — flagged, not decided here.
- `c06` bound under the Phase A name "Four messages never referenced (ERR0001/0003/0004/0005)"; the card keeps the id and corrects the name and count. `c01`, `c04`, `c07`, `c08`, `c09` names sharpened likewise. `CANDIDATES.md` left as the Phase A record.
- **Two automation runs on one job.** The RUN tip `fdde069` fired a run at 10:30Z that wrote all nine cards, MANIFEST, SME_BRIEF, CHARACTERIZATION, INDEX / JOURNAL / CONTEXT_GATE edits and ran `mark_documented.py` / `gen_coverage.py` in its own VM, then ended at 10:54Z without committing or pushing — nothing reached `origin`. The ME DRAFT-packs push `7e5a8dd` (10:54:30Z) fired this run while line 1 was still `RUN`. This run found the earlier one IDLE with no diff on `origin`, reconstructed its edits from the transcript diffs, **re-read every cited source line in `ATU_SRC` and verified each card**, corrected one miscount that had propagated into five files (16 `cmd call` actions, not 17 — options 1–10, 20, 21, 80–83; five options with undefined help names, not six — 1, 6–9), re-ran the inventory tools here (counts reproduced exactly) and committed. Whether the 10:54Z push ended the first run or it stopped on its own is not knowable from here; the two events are four seconds apart.
- The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-logic-57a1`) checked out at the trigger commit; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before any write. Origin re-checked immediately before the first commit and before the push.
- Several statements are platform semantics rather than source: UIM `:import name='*'` deferring help-name resolution (`c04`), `panelid` variable filled by the menu manager and `Enter=` action timing (`c08`), `cmd` actions under the profile's `LMTCPB` (`c03`), `CMD` source never naming its processing program and `PMTCTL` ≠ `DEP` (`c07`), `TYPE(*NAME)` character rules (`c07`), `STRQMQRY` defaults and object-not-found escapes (`c02`), `*LIBL` resolution of unqualified names (`c01`, `c02`, `c05`). Each is flagged inference / runtime-confirmable on the card and in `needs_sme`.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Seven accepted slices are still undocumented (queue above); the estate scan is partial (`overnight/METHOD_COVERAGE.md` — the four absent shell objects are its largest functional blind spot); ART slices unbound pending ART302; `fam-maintain` held; fifteen `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 back to `RUN` (job header should prefer `srvpgm-supporting` next) — one slice per run, seven to go. A Pack B run takes ~40–60 minutes; **any push to the branch while line 1 is `RUN` fires another run on the same slice** — this run was fired by the DRAFT-packs push, not by a job flip. Cheapest protection: push ME/room artefacts only while line 1 reads `DONE`, or wait for the DONE flip before pushing. **Room:** decide whether the menu is a slice (recommendation: no — `c01` is the navigation spec) and the fate of the nine live / three dead messages. **Source owner:** `CUSQRY`, `ARTQRY`, `CUSQRYFMT`, `ADSPUSRSPC` — the four objects no card can specify from the tree. **Ops:** `DSPCMD CVTSPLPDF` on the box.
