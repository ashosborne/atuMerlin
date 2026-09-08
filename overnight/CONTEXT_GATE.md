# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 9

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "ORD wave run 9 — Prefer: ord-maintain-ord200, then ord-maintain-ord201, ord-maintain-ord202, ord-print-ord500")
Started: 2026-09-08T21:53Z (UTC; 22:53 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–8 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `f7277a1c69ffcab38c6e62986dfd08af48ff3036` ("AGENT_JOB pack-b document-slices: RUN prefer ord-maintain-ord200 (run 9)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed. The job header says the ORD Architecture pack comes **after** the five ORD slices are carded ("ROOM_OK then"); this run does not draft or touch any pack.
- Human bind present: `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md` + `discovery/ord-maintain-ord200/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; `c01`–`c11`, `c13` `accept`; `c12` `needs-SME`). Pack B may proceed on the accepted twelve only.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1. Planted defects: document as-is, do not fix."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 8), `overnight/document-conveyor/JOURNAL.md` (runs 1–8), `overnight/CONTEXT_GATE.md` (run 8)
- `discovery/ord-maintain-ord200/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-entry-ord101/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/ord-entry-ord101-c01.md,features/ord-entry-ord101-c12.md}` (card / note style; the callee slice whose `c02`, `c05`, `c09`, `c12` this slice's cards contrast with); `discovery/ord-trigger-ord700/MANIFEST.yaml` (feature names for the `c04`, `c07`, `c12` pointers); `discovery/dat-utils/MANIFEST.yaml` (`c01`/`c03` sentinel and caller cards, cited as pointers); `discovery/cus-interactive/MANIFEST.yaml` (caller card for `c10`)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields four slices (`ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`); the job header prefers `ord-maintain-ord200` first.

**Chosen SLICE_ID: `ord-maintain-ord200`** — 12 accepted candidates, all `observed-in-code`; `c12` (`inferred`, stale `CULASTORD` after delete) stays `needs-SME` with no card. Auto-accept policy not needed (nothing `inferred` in the accepted set).

Not deepened this run: `ord-maintain-ord201` (twin program; its cursor, paging, guard, delete order and key legend cited only as contrasts — `c01`, `c04`, `c08`, `c09`, `c13`); `ord-maintain-ord202`, `ord-print-ord500` (bound, queued; entry signatures cited only — `c05`); `ord-entry-ord101` (documented; callee of `c03`, lock pointer in `c04`/`c13`); `ord-entry-ord100` (documented; `ORD100C` / `CRTORD` create path cited only — `c02`); `ord-trigger-ord700` (documented; delete/update trigger effects and `CULASTORD` asymmetry cited only — `c04`, `c07`, `c12`); `dat-utils` (documented; `ISOTODATE40` sentinel cited only — `c01`, `c11`); `cus-interactive` (documented; `CUS200` call site — `c10`); every other deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD200.PGM.SQLRPGLE` (289 lines), `QDDSSRC/ORD200D.DSPF` (92 lines).
Deps read as citations only: `QSQLSRC/ORDERCUS.VIEW:5-21`, `QSQLSRC/ISOTODATE4.SQLUDF:4-14`, `QDDSSRC/ORDER.PF:5-14`, `QDDSSRC/ORDER1.LF:4-6`, `QDDSSRC/DETORD.PF:5-23`, `QDDSSRC/DETORD1.LF:4-7`, `QDDSSRC/CUSTOME1.LF:4-6`, `QDDSSRC/CUSTOMER.PF:6-7,21`, `QDDSSRC/SAMREF.PF:15,24,34,68`, `QCLSRC/ORD100C.PGM.CLLE:4-12`, `QCMDSRC/CRTORD.CMD:4-6`, `QCLSRC/ORD100C2.PGM.CLLE:5-11`.
Twin / caller / callee sites only: `QRPGLESRC/ORD201.PGM.SQLRPGLE:16,99-130,144-164,172,181-199,233-241,292`, `QDDSSRC/ORD201D.DSPF:43-50,61-95`, `QRPGLESRC/CUS200.PGM.SQLRPGLE:37-38,230-233`, `QRPGLESRC/ORD202.PGM.RPGLE:16-19`, `QRPGLESRC/ORD500.PGM.RPGLE:15-19`.
Trigger / batch pointers only: `QTRGSRC/ORD700D.SYSTRG:4-7`, `QRPGLESRC/ORD700.PGM.RPGLE:76-93`, `QSQLSRC/ORD701.SQLTRG:5-16`, `QSQLSRC/ART801.SQLPRC:29-37`.
Absence evidence: structural grep of `ATU_SRC/**` for `ORD200` (callers: only `CUS200`; the other hits are `ORD200D` itself and the `'ORD200-1'` panel literal reused in `ORD201D`) and of `ORD200.PGM.SQLRPGLE` for `refresh`, `pagedown`, `rrs01`, `count`, `mode`, `User`, `savId`, `%found` after `chain`.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
