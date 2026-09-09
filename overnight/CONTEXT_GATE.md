# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 15

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual run 15 — Prefer: menu-cmd-shell")
Started: 2026-09-09T10:54Z (UTC; 11:54 Europe/London) — second run on this job; the first (started 10:30Z on `fdde069`) ended at 10:54Z without committing
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–14 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225`, `0de4efa`, `b8feaf9` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `7e5a8dde8069dccd66cfc519ebec47a950c0ac81` ("architecture(residual): DRAFT packs vat/dat/cou/par/log (await ROOM_OK)" — an ME-authored draft-pack commit, not a job flip; it re-fired the automation while line 1 was still `RUN`) |
| RUN tip | `fdde069` ("AGENT_JOB pack-b document-slices: RUN prefer menu-cmd-shell (run 15)") — fired the first run 15 attempt at 10:30Z |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` (checked in the checkout and on `origin` after `git fetch`) |
| Sibling runs | checked before the first write: this run was the only RUNNING agent of the automation (list-cloud-agents, source `automations`). The earlier run 15 attempt (fired by `fdde069`, 10:30Z) was IDLE with no PR, no diff on `origin` and no commit — its transcript showed all nine cards, MANIFEST, SME_BRIEF, CHARACTERIZATION, INDEX/JOURNAL/CONTEXT_GATE edits and the `mark_documented.py` / `gen_coverage.py` run completed in its workspace, then it stopped mid-INDEX-edit at 10:53Z (two seconds before this run was created). This run reconstructed those edits from the transcript diffs, re-read every cited source line in `ATU_SRC` to verify each card, corrected one miscount that had propagated into five files (16 `cmd call` actions, not 17; five options with undefined help names, not six) and re-ran the inventory tools here — the counts (136→145 documented, 32→36 surfaces accepted) reproduced exactly. |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station and not claimed. No pack is drafted or touched.
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md` (Ash authorized the night wave; Field recorded; ten slices accepted for documentation) + `discovery/menu-cmd-shell/BIND.md` (`accepted` for Pack B documentation, `bind_status: accepted` in `MANIFEST.yaml`, all 9 features `accepted`). Pack B may proceed on the accepted nine; the bind did not hold any candidate back as needs-SME, so the one `inferred` row (`c02`, the out-of-tree targets) gets a card that keeps its `inferred` confidence and says what is source and what is outside the tree (run-13 / run-14 practice).
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, `modern/` and `verification/` are **not** touched and not cited this run (the shell has no target counterpart yet; the SME_BRIEF recommendation "navigation spec + message resource file" is prose only). Job header: "Never widen CUS/ORD. PRO: document as-is, do not fix XSS." — no PRO card is written; PRO programs are cited as menu targets only.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md` (Phase B rule: every `documented` feature has `id`, `evidence`, `behaviour_doc`); `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 14), `overnight/document-conveyor/JOURNAL.md` (runs 1–14), `overnight/CONTEXT_GATE.md` (run 14)
- `discovery/menu-cmd-shell/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/log-programs/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/log-programs-c01.md,features/log-programs-c09.md}` (card shape; the `inferred`-carded precedent; the `ADSPUSRSPC` / option-84 card — cross-referenced, not re-derived); `discovery/ord-print-ord500/features/ord-print-ord500-c03.md` (the one `CVTSPLPDF` invocation, documented — pointer only); `discovery/ord-entry-ord100/MANIFEST.yaml` (`ORD100C2` wrapper and the `CRTORD` → `ORD100` binding blind spot `c09` — cited); `inventory/atu-merlin/APP_MANIFEST.yaml` (slice ownership of every menu target)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- UIM / CL platform semantics relied on for hedged statements (not source): `:import name='*'` defers help-name resolution to run time, so undefined `help=` names compile; `panelid=` names a dialog variable the menu manager fills with the menu name; `cmd` actions run through the command analyzer with the user's `LMTCPB` in force; `CMD` source never carries the processing program (that is `CRTCMD PGM()`); `PMTCTL` governs prompting only and `DEP` would be needed for cross-parameter validation; `TYPE(*NAME)` restricts a value to IBM i simple-name rules; `STRQMQRY QMFORM` default `*SYSDFT`; unqualified object names on `cmd` actions resolve on `*LIBL`; `CPD9817` is the QCPFMSG "option not valid" message. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields eight slices from the night residual bind; the job header and the bind record both prefer `menu-cmd-shell` first.

**Chosen SLICE_ID: `menu-cmd-shell`** — 9 candidates, all accepted: 8 `observed-in-code`, 1 `inferred` (`c02`, the three menu options whose targets are absent from the tree). Auto-accept policy not needed.

Not deepened this run: `srvpgm-supporting`, `sql-objects` (accepted; `ART801.SQLPRC:1-9` cited for the option-82 target name only), `ord-batch-ord900` (accepted; `ORD900`/`ORD901` cited as targets only), `cou-maintain` COU200 half (accepted; `COU200.RPG:1-12` cited for the absence of `*ENTRY` only), `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted; `PRO200`/`PRO201`/`PRO203`/`PRO250` cited as targets and for `%TEXT` / screen headings only — no PRO behaviour documented, planted defects not touched), `log-programs` (documented; `c09` cross-referenced for option 84), `ord-print-ord500` (documented; `c03` cross-referenced for the `CVTSPLPDF` call), `ord-entry-ord100` (documented; `ORD100C2` and `CRTORD` cited), `cus-interactive` / `par-maintain` (documented; cited as targets only); every `art-*` and `fam-maintain` (held — `ART200`, `ART250`, `ART801` cited as menu targets and for the `ERR0001` reference only).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QPNLSRC/SAMMNU.MENU` (172 lines), `QPNLSRC/SAMHELP.PNLGRP` (21 lines), `QMSGFSRC/SAMMSGF.MSGF` (32 lines), `QCMDSRC/CVTSPLPDF.CMD` (96 lines).
Deps read as citations only: `QCLSRC/ORD500C.PGM.CLLE:1-14` (the one `CVTSPLPDF` call), `QCLSRC/ORD100C2.PGM.CLLE:1-11` (option 6 wrapper), `QCLSRC/PAR201.CLLE:1-10`, `QCMDSRC/CRTORD.CMD:1-6` (twin with no program binding), `QSQLSRC/ART801.SQLPRC:1-9` (procedure name vs menu label), `QILESRC/PRO200.ILEPGM`, `QILESRC/PAR201.ILEPGM`; every menu target's `%TEXT` line and entry declarations (`ART200`, `CUS200`, `ORD201`, `PRO200`, `PRO201.CBL:107`, `ART250`, `CUS250`, `PRO250`, `PRO203`, `PAR200`, `COU200.RPG`, `ORD900`, `ORD901`); `QRPGLESRC/ORD100.PGM.RPGLE:26-28` (`cuid options(*nopass)` — why the wrapper exists); `QRPGLESRC/ART200.PGM.SQLRPGLE:280-290` (`errFamilly` → `*IN40`); DSPF `ERRMSGID` lines: `ART200D.DSPF:98`, `CUS200D.DSPF:105-118,130-133`, `PRO200D.DSPF:102`, `PRO201D.DSPF:106`, `ORD101D.DSPF:118-121,136-139`, `ART250D.DSPF:28`, `CUS250D.DSPF:28`, `PRO250D.DSPF:26-34`; screen headings row 1 of `PRO250D`, `ART250D`, `CUS250D`, `PRO201D`, `PRO200D`, `ART200D`, `CUS200D`, `ORD201D`, `PAR200D`, `COU200D`.
Absence evidence: structural grep of `ATU_SRC/**` (i) for `ERR0001`…`ERR2002` (12 ids → 12 `ERRMSGID` sites in `QDDSSRC`, none in RPG/CL/COBOL; `ERR0003`/`ERR0004`/`ERR0005` = the `MSGF` source only), `sammsgf` (12 DSPF sites + `SAMMNU.MENU:5`), `cusqry` / `artqry` / `cusqryfmt` / `strqmqry` / `qmqry` (the menu only; no `QQMQRYSRC` / `QQMFORMSRC` directory), `adspusrspc` (the menu only), `cvtsplpdf` (`ORD500C:11` + the `.CMD`), `CRTCMD` / `CRTMNU` / `CRTPNLGRP` (none — only `CRTMSGF` in the `MSGF` source), `sammnu` / `samhelp` outside `QPNLSRC` (none — nothing in the tree invokes the menu), `PI` / `dcl-pi` / `*ENTRY` / `PROCEDURE DIVISION USING` / `PGM PARM` in the 16 in-tree targets (none — all parameterless); `QCMDSRC/` listing (`CRTORD.CMD`, `CVTSPLPDF.CMD` only); `QPNLSRC/` listing (the two seed members only).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
