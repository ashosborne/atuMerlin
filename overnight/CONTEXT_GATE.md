# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 8

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "ORD wave after bind 2026-09-08 — Prefer order: ord-entry-ord101, ord-maintain-ord200, ord-maintain-ord201, ord-maintain-ord202, ord-print-ord500")
Started: 2026-09-08T21:26Z (UTC; 22:26 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–7 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `8386fb52d195c25e23fae7ced4c58fd90ade75be` ("record-bind ORD wave + AGENT_JOB pack-b RUN (prefer ord-entry-ord101)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed. The job header says the ORD Architecture pack comes **after** the five ORD slices are carded ("ROOM_OK then"); this run does not draft or touch any pack.
- Human bind present: `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md` (`8386fb5`) + `discovery/ord-entry-ord101/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; `c01`–`c10`, `c12` `accept`; `c11` `needs-SME`). Pack B may proceed on the accepted eleven only.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1. Planted defects: document as-is, do not fix."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 7), `overnight/document-conveyor/JOURNAL.md` (runs 1–7), `overnight/CONTEXT_GATE.md` (run 7)
- `discovery/ord-entry-ord101/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-entry-ord100/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/ord-entry-ord100-c05.md}` (card / note style; the sibling create-time slice whose `c03`–`c05` this slice's edit/delete cards contrast with); `discovery/ord-trigger-ord700/MANIFEST.yaml` (feature names for the `c11` pointer); `discovery/vat-module/MANIFEST.yaml` (`c02` unknown-code → zero VAT, cited as a pointer)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields five slices (`ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`); the job header prefers `ord-entry-ord101` first.

**Chosen SLICE_ID: `ord-entry-ord101`** — 11 accepted candidates, all `observed-in-code`; `c11` (`inferred`, trigger attachment) stays `needs-SME` with no card. Auto-accept policy not needed (nothing `inferred` in the accepted set).

Not deepened this run: `ord-maintain-ord200` / `ord-maintain-ord201` (call sites, the closed-order guard and the deliver path cited only — `c09`, `c12`, `c04`); `ord-maintain-ord202`, `ord-print-ord500` (bound, queued); `ord-trigger-ord700` (documented; `c11` pointer); `ord-entry-ord100` (documented; contrast pointers); `vat-module`, `art-modules`, `cus-modules` (service-program getters cited as dependencies only); every other deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD101.PGM.RPGLE` (290 lines), `QDDSSRC/ORD101D.DSPF` (138 lines).
Deps read as citations only: `QDDSSRC/DETORD.PF:4-23`, `QDDSSRC/DETORD1.LF:4-7`, `QDDSSRC/ORDER.PF:4-14`, `QDDSSRC/ORDER1.LF:4-6`, `QDDSSRC/SAMREF.PF:34-55`, `QMSGFSRC/SAMMSGF.MSGF:21-26`, `QPROTOSRC/VAT.RPGLEINC:7-8,22-24`, `QPROTOSRC/ARTICLE.RPGLEINC:7-8,39-40`, `QPROTOSRC/CUSTOMER.RPGLEINC:7-8`, `QRPGLESRC/ART300.RPGLE:19-27,83-91`.
Caller call sites only: `QRPGLESRC/ORD200.PGM.SQLRPGLE:5-28,74,187-195,225-228`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:18-19,67,191-199,229-232,261-278`, `QDDSSRC/ORD200D.DSPF:40-44`, `QDDSSRC/ORD201D.DSPF:44-47,61-83`.
Trigger pointer only: `QTRGSRC/ORD700U.SYSTRG:4-8`, `QTRGSRC/ORD700D.SYSTRG:4-7`, `QRPGLESRC/ORD700.PGM.RPGLE:82-92` (what the update/delete events do with `ODQTY` / `ODQTYLIV`).
Absence evidence: structural grep of `ATU_SRC/**` for `ORD101` (callers: only `ORD200`, `ORD201` — no menu / command / CL wrapper), and of `ORD101.PGM.RPGLE` for `ORDATCLO`, `ORDATDEL`, `pagedown`, `create`, `confirm`, `Prtord`, `count`.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
