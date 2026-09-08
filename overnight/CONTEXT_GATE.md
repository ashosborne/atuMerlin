# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 10

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "ORD wave run 10 — Prefer: ord-maintain-ord201, then ord-maintain-ord202, ord-print-ord500")
Started: 2026-09-08T22:26Z (UTC; 23:26 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–9 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `1b3c36304c023343fe961bcccf7f61f98ee9caae` ("AGENT_JOB pack-b document-slices: RUN prefer ord-maintain-ord201 (run 10)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed. The job header says the ORD Architecture pack comes **after** the five ORD slices are carded ("ROOM_OK then"); this run does not draft or touch any pack.
- Human bind present: `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md` + `discovery/ord-maintain-ord201/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; `c01`–`c11` `accept`; no needs-SME / blocked rows). Pack B may proceed on the accepted eleven only.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1. Planted defects: document as-is, do not fix."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 9), `overnight/document-conveyor/JOURNAL.md` (runs 1–9), `overnight/CONTEXT_GATE.md` (run 9)
- `discovery/ord-maintain-ord201/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-maintain-ord200/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/ord-maintain-ord200-c01.md,features/ord-maintain-ord200-c06.md}` (twin slice, documented in run 9 — its `c06`/`c07`/`c08`/`c13` are cross-referenced by this slice's `c06`, `c07`, `c04` rather than duplicated); `discovery/ord-entry-ord100/MANIFEST.yaml` (feature ids for the `ORD100C2` create path — `c02`), `discovery/ord-entry-ord101/MANIFEST.yaml` (`c02`, `c09`, `c12` — callee of option 2), `discovery/ord-trigger-ord700/MANIFEST.yaml` (`c03`, `c04`, `c08` — trigger effects of `4`/`8`), `discovery/dat-utils/MANIFEST.yaml` (`c01`/`c03` sentinel and caller cards), `discovery/menu-cmd-shell/MANIFEST.yaml` (help mapping note, `c09`)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields three slices (`ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`); the job header prefers `ord-maintain-ord201` first.

**Chosen SLICE_ID: `ord-maintain-ord201`** — 11 accepted candidates, all `observed-in-code`; nothing `inferred`, nothing needs-SME at bind. Auto-accept policy not needed.

Not deepened this run: `ord-maintain-ord200` (documented twin; cited as contrast and as the owner of the shared `7`/`8` lifecycle cards); `ord-maintain-ord202`, `ord-print-ord500` (bound, queued; entry signatures and header `chain` sites cited only — `c05`); `ord-entry-ord101` (documented; callee of `c03`); `ord-entry-ord100` (documented; `ORD100C2` / `ORD100` create path cited only — `c02`); `ord-trigger-ord700` (documented; delete/update trigger effects cited only — `c04`, `c06`); `dat-utils` (documented; `ISOTODATE40` sentinel / NULL cited only — `c01`); `sql-objects` (unbound; `ORDERCUS` view definition cited only — `c01`); `menu-cmd-shell` (unbound; `SAMMNU` option 3 and its `help=` cited only — `c09`); every other deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD201.PGM.SQLRPGLE` (295 lines), `QDDSSRC/ORD201D.DSPF` (96 lines).
Deps read as citations only: `QSQLSRC/ORDERCUS.VIEW:5-21`, `QSQLSRC/ISOTODATE4.SQLUDF:4-14`, `QDDSSRC/ORDER.PF:5-14`, `QDDSSRC/ORDER1.LF:4-6`, `QDDSSRC/DETORD.PF:5-23`, `QDDSSRC/DETORD1.LF:4-7`, `QDDSSRC/CUSTOME1.LF:4-6`, `QDDSSRC/ARTICLE1.LF:4-6`, `QDDSSRC/SAMREF.PF:15,24,34`, `QCLSRC/ORD100C2.PGM.CLLE:5-11`, `QCLSRC/ORD100C.PGM.CLLE:4-12`, `QPNLSRC/SAMMNU.MENU:91-94`.
Twin / callee sites only: `QRPGLESRC/ORD200.PGM.SQLRPGLE:113,123-129,146-160,187,229-235,286-288`, `QDDSSRC/ORD200D.DSPF:7-11,31-34,85-92`, `QRPGLESRC/ORD101.PGM.RPGLE:8-9,19-25`, `QRPGLESRC/ORD202.PGM.RPGLE:7-19,83-84`, `QRPGLESRC/ORD500.PGM.RPGLE:8-19,31-33`.
Trigger / batch pointers only: `QTRGSRC/ORD700D.SYSTRG:4-7`, `QTRGSRC/ORD700U.SYSTRG:4-8`, `QRPGLESRC/ORD700.PGM.RPGLE:76-93`, `QSQLSRC/ORD701.SQLTRG:5-16`, `QSQLSRC/ART801.SQLPRC:29-37`.
Absence evidence: structural grep of `ATU_SRC/**` for `ORD201` (callers: only `SAMMNU.MENU:92`; no CL, command or program call site) and for the `'ORD200-1'` literal (`ORD200D.DSPF:46`, `ORD201D.DSPF:50`); grep of `ORD201.PGM.SQLRPGLE` for `custome1` / `article1` I/O (none — F-specs only), `when opt01 = 3` (none), `%found` after `chain` (none), `mode` / `User` / `crt` / `upd` / `help` / `prompt` / `morekeys` (declared, never referenced).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
