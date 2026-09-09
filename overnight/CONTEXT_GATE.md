# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 16

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual run 16 — Prefer: srvpgm-supporting")
Started: 2026-09-09T11:17Z (UTC; 12:17 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–15 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225`, `0de4efa`, `b8feaf9`, `22eab31` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `f2f7e6cccb49e51cc9fa5b16bd173802c13346ac` ("operator: PASTE convert residual vat/dat/cou/par/log" — an operator paste-document commit, not a job flip; it fired this run while line 1 was `RUN`) |
| RUN tip | `ed1687c` ("AGENT_JOB pack-b document-slices: RUN prefer srvpgm-supporting (run 16)") — fired two earlier runs (11:12Z) that ended IDLE with nothing on `origin` |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` (checked in the checkout and on `origin` after `git fetch`) |
| Sibling runs | checked before the first write (list-cloud-agents, source `automations`): this run was the only RUNNING agent of the automation. Two runs created at 11:12Z on the RUN tip / BOUND push were IDLE with no diff on `origin` (one lived 8 s, the other ~5 min); the `origin` head was still `f2f7e6c` with no `document-slices: srvpgm-supporting` commit, so this run took the slice. |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station and not claimed. No pack is drafted or touched. The trigger commit's five `operator/PASTE-convert-*-vertical-atu-merlin.md` files and the BOUND residual packs (`ad697f3`) were not read and are not touched — Convert is a different station with its own gate.
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md` (Ash authorized the night wave; Field recorded; ten slices accepted for documentation) + `discovery/srvpgm-supporting/BIND.md` (`accepted` for Pack B documentation, `bind_status: accepted` in `MANIFEST.yaml`, all 9 features `accepted`). Pack B may proceed on the accepted nine; the bind did not hold any candidate back as needs-SME, so the one `inferred` row (`c05`, bindings that live in build metadata) gets a card that keeps its `inferred` confidence and says what is source and what is outside the tree (run-13/14/15 practice).
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, the five residual packs, `modern/` and `verification/` are **not** touched and not cited this run. Job header: "Never widen CUS/ORD. PRO: document as-is, do not fix XSS." — no PRO card is written; `PRO200` / `PRO202` / `PRO203` are cited for their binding facts (H-specs, `/copy`, procedure imports) only. `BIND.md`: "Never invent ART302" — `ART302.SQLRPGLE` is cited only for the source fact that it is in no `MODULE()` list and that `ART250` imports `GetArtInfo` from it (already recorded in `docs/estate/INDEX.md` row 4 / `art-modules`); no ART behaviour is documented.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md` (Phase B rule: every `documented` feature has `id`, `evidence`, `behaviour_doc`); `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 15), `overnight/document-conveyor/JOURNAL.md` (runs 1–15), `overnight/CONTEXT_GATE.md` (run 15)
- `discovery/srvpgm-supporting/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/menu-cmd-shell/{MANIFEST.yaml,CHARACTERIZATION.md,features/menu-cmd-shell-c01.md}` (card shape; the `inferred`-carded precedent); `discovery/vat-module/features/vat-module-c06.md`, `vat-module-c09.md` (how the `*-modules` slices phrased cache scope and the caller activation-group unknown — cross-referenced, not re-derived); `discovery/par-maintain/features/par-maintain-c10.md` + `discovery/par-maintain/MANIFEST.yaml` `c10` (the `EXPORT(*ALL)` claim this run corrects — see MORNING_BRIEF §7); `inventory/atu-merlin/APP_MANIFEST.yaml` (surfaces `bnddir:SAMPLE`, `srvpgm:*`, behaviours `srvpgm-supporting-c01..c09`); `docs/estate/INDEX.md` rows 4, 25
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- ILE platform semantics relied on for hedged statements (not source): a service program can export only symbols its modules export (the `EXPORT` keyword on the P-spec), so `EXPORT(*ALL)` = "all module exports", not "all procedures"; `CRTBNDRPG` / `CRTBNDCBL` `ACTGRP` default `*STGMDL` → `QILE` for single-level storage when `DFTACTGRP(*NO)`; `ACTGRP(*CALLER)` places a service program's static storage in the caller's group; a named activation group persists until `RCLACTGRP` or job end; unresolved imports fail `CRTPGM` / `CRTBNDRPG` (`CPD5D02` / binder listing) unless a `BNDDIR` / `BNDSRVPGM` supplies them; `CRTSQLRPGI` takes binder options through `COMPILEOPT`; a hand-fixed `SIGNATURE` makes export *order* the binary contract while `SIGNATURE(*GEN)` + `*PRV` blocks keep old signatures valid; binding-directory entries are searched in list order and only for unresolved imports; `*LIBL` entries resolve at bind time against the compiling job's library list. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields seven slices from the night residual bind; the job header and the bind record both prefer `srvpgm-supporting` first.

**Chosen SLICE_ID: `srvpgm-supporting`** — 9 candidates, all accepted: 8 `observed-in-code`, 1 `inferred` (`c05`, how `PRO203` / `ORD500` / `ORD700` resolve imports without `bnddir` or an `.ILEPGM`). 4 `unknown` surfaces (`srvpgm:XML`, `srvpgm:XSS`, `srvpgm:ORDER`, `srvpgm:TXT`) stay `unknown` — cards record the absence, they do not invent the objects. Auto-accept policy not needed.

Not deepened this run: `sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted; `PRO200.RPGLE`, `PRO202.SQLRPGLE`, `PRO203.PGM.SQLRPGLE`, `PRO250.PGM.RPGLE`, `PRO300`/`PRO301` cited for binding facts only — no PRO behaviour documented, planted defects not touched); every documented slice whose members appear in the binding tables (`cus-*`, `ord-*`, `vat-module`, `par-maintain`, `log-programs`, `cou-maintain` FCOUNTRY half, `dat-utils`, `menu-cmd-shell`) — cited as importers / exporters only; every `art-*` and `fam-maintain` (held — `ART200`/`ART201`/`ART202`/`ART250` H-specs and imports, `ART300`/`ART301`/`ART302` export keywords, `FAM300`/`FAM301` export keywords cited as binding facts only).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QBNDSRC/SAMPLE.BNDDIR` (14 lines), `QILESRC/PRO200.ILEPGM` (9), `QILESRC/PAR201.ILEPGM` (9); all eight `QILESRVSRC/*.ILESRVPGM` (8–9 lines each); all six `QSRVSRC/*.BND` (`FARTICLE` 15, `FCOUNTRY` 9, `FCUSTOMER` 20, `FFAMILLY` 9, `FPROVIDER` 45, `FVAT` 9).
Cross-checks read as citations only: H-spec / `ctl-opt` line of every `QRPGLESRC/*.PGM.*` member (16 with `dftactgrp(*no)`: 12 `bnddir('SAMPLE')`, 4 without); the first 14 lines of `PRO200.RPGLE`, `PRO202.SQLRPGLE`, `PAR201.CLLE` (no H-spec / no `PGM` binding keywords — modules); every `P … B` line of the 14 `nomain` modules (`ART300`, `ART301`, `ART302`, `COU300`, `COU301`, `CUS300`, `CUS301`, `FAM300`, `FAM301`, `LOG300`, `PAR300`, `PRO300`, `PRO301`, `VAT300`) for the `export` keyword — the module export lists compared symbol-by-symbol against the six `.BND` files; `PAR300.RPGLE:22-107` and `LOG300.RPGLE:18-46` in full (the two `EXPORT(*ALL)` modules); every `PR` line of the nine `QPROTOSRC/*.RPGLEINC` copybooks (which unexported names are advertised); every `/copy` / `/COPY` line in `QRPGLESRC` (incl. `PRO202.SQLRPGLE:11` `/copy qprotosrc,xml` and `PRO203.PGM.SQLRPGLE:7` `/copy qprotosrc,Xss` — members absent from `QPROTOSRC`); procedure-call sites that decide each program's imports (`ART250.PGM.SQLRPGLE:156` `GetArtInfo`; `ART301.SQLRPGLE:164-165`; `PRO200.RPGLE:219,238,239,247`; `PRO202.SQLRPGLE:151-174`; `PRO203.PGM.SQLRPGLE:32-94`; `ORD500.PGM.RPGLE:58`; `ORD700.PGM.RPGLE:78`; `PAR201.CLLE:7-8` `CALLPRC GETPARM2`; `LOG100.PGM.RPGLE:9` + `APICALL.RPGLEINC:4,14,19` `extpgm` only); `CUS300.RPGLE:173-190` (the last-key cache shape shared by the getter modules); `QMSGFSRC/SAMMSGF.MSGF:1-8` (ARCAD header, `CCSID(65535)`); `iproj.json` (whole); `.elias/hashList.json` (branch `FT_zel001`, hashes only — no compile options).
Absence evidence: structural grep of `ATU_SRC/**` (i) for `bnddir` / `dftactgrp` / `actgrp` / `bndsrvpgm` / `callprc` (the lines listed above and nothing else — no `ACTGRP(*NEW)`, no second binding directory, no `CRTBNDRPG` / `CRTSQLRPGI` command source); (ii) for `ORDER` / `TXT` as `*SRVPGM` or in any `BNDSRVPGM` / `/copy` (the `SAMPLE.BNDDIR` line only); (iii) for callers of the seven `Close*` procedures the copybooks advertise (none) and of `GetArtInfo` (`ART250:156` only); (iv) for `XML.RPGLEINC` / `XSS.RPGLEINC` or any `xml*` / `xss*` prototype in the tree (none — `QPROTOSRC` = nine members); (v) for a `.BND` for `FPARAMETER` / `LOG` (none — six `.BND`); (vi) `QILESRC/` and `QILESRVSRC/` listings (two and eight members); (vii) `.PGM.` infix on every `QRPGLESRC` / `QCLSRC` member versus membership of a `MODULE()` list (disjoint: every `MODULE()` member lacks the infix; every member with the infix is in no `MODULE()` list).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
