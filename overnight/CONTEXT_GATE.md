# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 2

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; re-fired by Ash after run 1 documented `cus-interactive`)
Started: 2026-09-08T15:11Z (UTC; 16:11 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B run 1 at `0e32c19:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `0e32c1919cf722161728e802700c6f9be957632c` ("AGENT_JOB pack-b document-slices: RUN (run 2 prefer cus-modules)") |
| Base / PR target | `master` (`db72c72`) |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed (job body says `ROOM_OK false` for arch/convert).
- Human bind present: `overnight/BIND_RECORD.md` + `discovery/cus-modules/BIND.md` (room bind 2026-09-08, recorded by Agent Smith). Pack B may proceed.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Portfolio inventory anti-greenwash, "Who writes"
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md`
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 1), `overnight/document-conveyor/JOURNAL.md`
- `discovery/cus-modules/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/cus-interactive/features/*.md` (card style from run 1)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields three slices: `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`. Job says prefer `cus-modules` (CUS-first prove path; `cus-interactive` already documented in run 1).

**Chosen SLICE_ID: `cus-modules`** — 10 accepted candidates (`c01`–`c09`, `c11`), all `observed-in-code`; `c10` is `needs-SME` / `inferred` at bind and gets **no card**. `srvpgm-fcustomer` folded in per bind (export/binding facts documented inside `c01` and `c05`, no new feature invented).

Not deepened this run: `ord-entry-ord100`, `ord-trigger-ord700` (remain in queue), `ord-batch-ord900` (deferred by bind), `art-*` (skipped by bind), all unbound Phase A slices.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/CUS300.RPGLE`, `QRPGLESRC/CUS301.SQLRPGLE`, `QDDSSRC/CUS301D.DSPF`.
Deps read as citations only: `QPROTOSRC/CUSTOMER.RPGLEINC`, `QSRVSRC/FCUSTOMER.BND`, `QILESRVSRC/FCUSTOMER.ILESRVPGM`, `QDDSSRC/CUSTOMER.PF`, `QDDSSRC/CUSTOME1.LF`, `QDDSSRC/SAMREF.PF`, `QBNDSRC/SAMPLE.BNDDIR`, `QSQLSRC/CUSSEQ.SQLSEQ`; caller sites only: `QRPGLESRC/CUS250.PGM.RPGLE:4,86,98`, `QRPGLESRC/ORD100.PGM.RPGLE:7,318-328`, `QRPGLESRC/ORD101.PGM.RPGLE:5,283`. Structural grep of `ATU_SRC/**` for `ExistCus`, `IsCusDeleted`, `CloseCUSTOME1`, `SltCustomer`, `GetCus*` callers.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`,
`CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised — every card was human-accepted; `c10` stays needs-SME),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`.
