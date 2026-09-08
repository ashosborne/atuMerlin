# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin)

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (fired by Agent Smith after room bind 2026-09-08)
Started: 2026-09-08T13:22Z (UTC; 14:22 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gate for Pack A (`discovery-phase-a`) is preserved in git at `ab342e9:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `ab342e9672db444afb47b264e5c7dad416485584` ("AGENT_JOB pack-b document-slices: RUN (accepted only)") |
| Base / PR target | `master` (`db72c72`) |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed (job body says `ROOM_OK false` for arch/convert).
- Human bind present: `overnight/BIND_RECORD.md` + `discovery/*/BIND.md` (room bind 2026-09-08, recorded by Agent Smith). Pack B may proceed.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery (v0.2) Phase B, Portfolio inventory, anti-greenwash rules
- `migration-factory/docs/OPERATOR-RUNBOOK.md`
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md`
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — read for the deferred note only; **not** executed (no Test gen pack exists, so no waiver artefact may be produced)
- `migration-factory/schemas/discovery-manifest.schema.md`, `migration-factory/schemas/app-manifest.schema.md` + `.json`
- `operator/atu-merlin-factory-loop/TARGET.md` — context only (TypeScript modular monolith + PostgreSQL + simple web UI; not implemented here)
- `operator/atu-merlin-factory-loop/TRIGGER-CONTRACT.md`, `CHARTER.yaml`
- `overnight/BIND_RECORD.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter)

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present (Pack A).

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields four slices: `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`. Job says prefer `cus-interactive` (CUS-first prove path).

**Chosen SLICE_ID: `cus-interactive`** — 12 accepted candidates (`c01`–`c12`), all `observed-in-code`; no `needs-SME`/`deferred` rows in the bind.

Not deepened this run: `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700` (remain in queue), `ord-batch-ord900` (deferred by bind), `art-*` (skipped by bind), all unbound Phase A slices.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/CUS200.PGM.SQLRPGLE`, `QRPGLESRC/CUS250.PGM.RPGLE`, `QDDSSRC/CUS200D.DSPF`, `QDDSSRC/CUS250D.DSPF`.
Deps read as citations only: `QDDSSRC/CUSTOMER.PF`, `CUSTOME1.LF`, `CUSTOME2.LF`, `SAMREF.PF`, `QSQLSRC/CUSSEQ.SQLSEQ`, `QMSGFSRC/SAMMSGF.MSGF`, `QPROTOSRC/COUNTRY.RPGLEINC`, `QPROTOSRC/CUSTOMER.RPGLEINC`, `QRPGLESRC/COU300.RPGLE` / `COU301.RPGLE` (FCOUNTRY return semantics), `QRPGLESRC/CUS300.RPGLE` / `CUS301.SQLRPGLE` (FCUSTOMER return semantics), `QILESRVSRC/FCOUNTRY.ILESRVPGM`, `QSRVSRC/FCOUNTRY.BND`, `QBNDSRC/SAMPLE.BNDDIR`, `QPNLSRC/SAMMNU.MENU`, `QPNLSRC/SAMHELP.PNLGRP`, `QRPGLESRC/ORD200.PGM.SQLRPGLE:16-19` (parameter interface only).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`,
`CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not needed — every card was human-accepted),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`.
