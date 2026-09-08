# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 3

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; re-fired by Ash after run 2 documented `cus-modules`; job header "run 3 prefer ord-entry-ord100")
Started: 2026-09-08T16:07Z (UTC; 17:07 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B run 1 at `0e32c19:overnight/CONTEXT_GATE.md`; run 2 at `5ac7f0d:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `5ac7f0d92d62d3807b1177e6050d57ba49e4169a` ("architecture: BOUND atu-merlin-ts-cus-v1 v1 (CUS vertical)") |
| Base / PR target | `master` (`db72c72`) |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed (job body says `ROOM_OK false` for arch/convert).
- The Architecture PACK bound at `5ac7f0d` (`atu-merlin-ts-cus-v1`, CUS vertical) is **not** consumed by this run: ORD slices are document-only per the bind record ("first TypeScript convert vertical later: CUS only").
- Human bind present: `overnight/BIND_RECORD.md` + `discovery/ord-entry-ord100/BIND.md` (room bind 2026-09-08, recorded by Agent Smith). Pack B may proceed.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Portfolio inventory anti-greenwash, "Who writes"
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md`
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 2), `overnight/document-conveyor/JOURNAL.md`
- `discovery/ord-entry-ord100/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/cus-modules/features/*.md`, `CHARACTERIZATION.md`, `SME_BRIEF.md` (card / note style from run 2)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields two slices: `ord-entry-ord100`, `ord-trigger-ord700`. Job says prefer `ord-entry-ord100` (CUS prove path already documented in runs 1–2; 12 accepted behaviours).

**Chosen SLICE_ID: `ord-entry-ord100`** — 12 accepted candidates (`c01`–`c08`, `c10`, `c12`–`c14`), all `observed-in-code`; `c09` (CRTORD command facade) and `c11` (trigger side effects pointer) are `needs-SME` / `inferred` at bind and get **no card**.

Not deepened this run: `ord-trigger-ord700` (remains in queue), `ord-batch-ord900` (deferred by bind; `ORD901` cited as a pointer only where it repairs data this slice writes), `art-*` (skipped by bind), all unbound Phase A slices.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD100.PGM.RPGLE`, `QCLSRC/ORD100C.PGM.CLLE`, `QCLSRC/ORD100C2.PGM.CLLE`, `QDDSSRC/ORD100D.DSPF`, `QCMDSRC/CRTORD.CMD`.
Deps read as citations only: `QDDSSRC/ORDER.PF`, `QDDSSRC/DETORD.PF`, `QDDSSRC/DETORD1.LF`, `QDDSSRC/SAMREF.PF`, `QDDSSRC/CUSTOMER.PF`, `QDDSSRC/ARTICLE.PF`, `QDTASRC/LASTORDNO.DTAARA`, `QBNDSRC/SAMPLE.BNDDIR`, `QPROTOSRC/{CUSTOMER,ARTICLE,VAT}.RPGLEINC`, `QRPGLESRC/ART300.RPGLE` (chain/blank-id shape), `QRPGLESRC/ART301.SQLRPGLE` (SltArticle cancel return), `QRPGLESRC/VAT300.RPGLE` (ClcVAT rounding), `QRPGLESRC/ORD500.PGM.RPGLE:1-40` (callee signature); caller sites only: `QPNLSRC/SAMMNU.MENU:104-106`, `QRPGLESRC/ORD200.PGM.SQLRPGLE:30-31,154-156`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:16,155-158`; pointer-only: `QTRGSRC/ORD700A.SYSTRG`, `QSQLSRC/ORD701.SQLTRG`, `QRPGLESRC/ORD901.PGM.SQLRPGLE:42-45`. Structural grep of `ATU_SRC/**` for `ORD100`, `CRTORD`, `ODYEAR` writers.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`,
`CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised — every card was human-accepted; `c09`, `c11` stay needs-SME),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`.
