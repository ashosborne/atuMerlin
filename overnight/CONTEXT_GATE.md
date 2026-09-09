# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 14

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual wave run 14 — Prefer: log-programs")
Started: 2026-09-09T09:09Z (UTC; 10:09 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–13 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225`, `0de4efa` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `f916270753293769c5c114a4207f8502e95b751b` ("AGENT_JOB pack-b: nudge re-fire (still RUN prefer log-programs; no cards ~14m)") — the nudge commit itself was the trigger |
| RUN tip | `828230b` ("AGENT_JOB pack-b document-slices: RUN (night residual; prefer log-programs)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |
| Sibling runs | checked before the first write: this run was the only RUNNING agent of the automation; the earlier run 14 attempt (fired on `828230b`) had produced no cards and was no longer running, so this run took the slice |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station; the job body carries `ROOM_OK: residual night bind from Ash + Field 2026-09-09` anyway, recorded and not consumed. No pack is drafted or touched.
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md` (Ash authorized the night wave; Field recorded; ten slices accepted for documentation) + `discovery/log-programs/BIND.md` (`accepted` for Pack B documentation, `bind_status: accepted` in `MANIFEST.yaml`, all 10 features `accepted`). Pack B may proceed on the accepted ten; the bind did not hold any candidate back as needs-SME, so the four `inferred` rows (`c04`, `c06`, `c09`, `c10`) get cards that keep their `inferred` confidence and say what is source and what is runtime (run-13 practice).
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, `modern/` and `verification/` are **not** touched. The ORD vertical's `samlog` table (`modern/db/schema.sql`) and its PARITY `c03` line are **cited** as the existing target counterpart of the log line — read-only, not widened. Job header: "Do not convert. Never widen CUS/ORD packs. Do not invent ART302 / GetArtInfo. PRO planted-bug / XML-XSS: document as-is."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 13), `overnight/document-conveyor/JOURNAL.md` (runs 1–13), `overnight/CONTEXT_GATE.md` (run 13)
- `discovery/log-programs/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/par-maintain/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/par-maintain-c08.md,features/par-maintain-c13.md}` (card shape; the `inferred`-carded precedent; the `LOG100` library-anchor card — cross-referenced, not re-derived); `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c03.md` + `MANIFEST.yaml` (the one caller, documented — pointer only); `discovery/srvpgm-supporting/MANIFEST.yaml` (`SAMPLE.BNDDIR` contents, `EXPORT(*ALL)` twins — cited); `discovery/menu-cmd-shell/MANIFEST.yaml` (option 84 among the absent-object options — cited); `modern/db/schema.sql:132-199`, `modern/README.md:219-220,325`, `verification/ord-vertical/2026-09-09-r1/PARITY.yaml:96` (existing `samlog` counterpart — cited, not widened)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- ILE RPG / API platform semantics relied on for hedged statements (not source): API error-code convention (`bytes provided > 0` → error returned in the structure; parameter omitted → escape message); `QUSCRTUS` size is an initial size and user spaces are allocated in page units; addressing beyond a space's allocation → `MCH0601`; dereferencing a null basing pointer → `MCH3601`; `QUSPTRUS` not-found escape `CPF9801`; unmonitored escape from a called program → RPG status 00202 / `RNQ0202` inquiry; static initialisation (`inz(*USER)`) at service-program activation in an `ACTGRP(*CALLER)` service program; `dftactgrp(*no)` without `actgrp` → `QILE`; `EXPORT(*ALL)` exports only module-exported symbols (P-spec `export`); `%char(%timestamp())` 26-character ISO form; `10i 0` big-endian; `+=` on a based integer is load/add/store (not atomic); `QRPLOBJ` semantics of replace `*YES`. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields nine slices from the night residual bind; the job header and the bind record both prefer `log-programs` first.

**Chosen SLICE_ID: `log-programs`** — 10 candidates, all accepted: 6 `observed-in-code`, 4 `inferred` (`c04` capacity, `c06` install step, `c09` reader, `c10` concurrency — all runtime consequences of exact source facts). Auto-accept policy not needed.

Not deepened this run: `menu-cmd-shell` (accepted, next in queue; `SAMMNU` option 84 cited for `c09` only), `srvpgm-supporting` (accepted; `SAMPLE.BNDDIR` / `QSRVSRC` / `QILESRC` cited for the `LOG` binding facts in `c08` only), `sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted; not cited), `ord-trigger-ord700` (documented; `ORD700:76-82` cited as the one caller — `c07`), `par-maintain` (documented; `c13` cross-referenced for the `PARAMETER` library anchor — `c01`); every `art-*` and `fam-maintain` (held).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/LOG100.PGM.RPGLE` (27 lines), `QRPGLESRC/LOG300.RPGLE` (46 lines), `QILESRVSRC/LOG.ILESRVPGM` (8 lines), `QPROTOSRC/LOG.RPGLEINC` (5 lines), `QPROTOSRC/APICALL.RPGLEINC` (34 lines).
Deps read as citations only: `QRPGLESRC/ORD700.PGM.RPGLE:1-10,60-95` (H-spec, `/COPY`, event `'2'` call site), `QTRGSRC/ORD700D.SYSTRG:4-7`, `QBNDSRC/SAMPLE.BNDDIR:8-14`, `QPNLSRC/SAMMNU.MENU:75-100,150-170` (menu items; option 84), `QDDSSRC/DETORD.PF:6-12`, `QDDSSRC/SAMREF.PF:11,34,37,47` (field widths behind the ≈125-byte line estimate).
Absence evidence: structural grep of `ATU_SRC/**` for `LOG100` (self only — no caller, no menu entry, no CL, no `.ILEPGM`), `addlogentry` (i) (prototype, procedure, one call in `ORD700:78`), `SAMLOG` (`LOG100:20`, `LOG300:4,41`, `SAMMNU.MENU:160` only), `adspusrspc` / `dspusrspc` (the menu line only; no `QCMDSRC` member), `QUSCUSAT` / `QUSCHGUS` / `QUSRTVUS` (none — no auto-extend, no size query), `\bLOG\b` in `QBNDSRC` / `QILESRC` / `QSRVSRC` (none — no `LOG.BND`, not in the bind directory), `monitor` / `%error` / `*pssr` / `alcobj` / `lock` / `cmpswp` / `dtaara` in `LOG300` and `LOG100` (none); `QSRVSRC/` listing (six `.BND`, none for `LOG`), `QILESRC/` listing (`PAR201`, `PRO200` only); `LOG300` P-specs for `export` (`AddLogEntry` only — `init` has none).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
