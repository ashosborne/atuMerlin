# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 4

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; re-fired by Ash after the CUS convert station finished; job header "run 4 prefer ord-trigger-ord700")
Started: 2026-09-08T17:45Z (UTC; 18:45 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B run 1 at `0e32c19:overnight/CONTEXT_GATE.md`; run 2 at `5ac7f0d:overnight/CONTEXT_GATE.md`; run 3 at `efb5e2a:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `fa5b77f11d70ab2ced6a90fd75a77bbb3bcd200f` ("AGENT_JOB pack-b document-slices: RUN (run 4 prefer ord-trigger-ord700)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed.
- The Architecture PACK `atu-merlin-ts-cus-v1` (CUS-only) and the CUS convert under `modern/` (`efb5e2a`) are **not** touched or consumed by this run: ORD slices are document-only per the bind record; job header says "Convert CUS is DONE under modern/ — do not re-convert here."
- Human bind present: `overnight/BIND_RECORD.md` + `discovery/ord-trigger-ord700/BIND.md` (room bind 2026-09-08, recorded by Agent Smith). Pack B may proceed.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md`
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 3), `overnight/document-conveyor/JOURNAL.md`, `overnight/CONTEXT_GATE.md` (run 3)
- `discovery/ord-trigger-ord700/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `overnight/seeds/ord-trigger-ord700.md`; `discovery/ord-entry-ord100/features/ord-entry-ord100-c05.md`, `MANIFEST.yaml`, `CHARACTERIZATION.md`, `SME_BRIEF.md` (card / note style from run 3)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields exactly one slice: `ord-trigger-ord700` (job preference matches). Last slice in the 2026-09-08 bind.

**Chosen SLICE_ID: `ord-trigger-ord700`** — 8 accepted candidates (`c02`–`c07`, `c09`, `c10`), all `observed-in-code`; `c01` (trigger attachment on the box), `c08` (CULASTORD stale on delete) and `c11` (trigger vs reconciliation arithmetic) are `needs-SME` / `inferred` at bind and get **no card**.

Not deepened this run: `ord-batch-ord900` (deferred by bind; `ORD901` cited only where it fires the update trigger or recomputes `CULASTORD`), `art-*` (skipped by bind), `sql-objects` (unscanned; `ART801` documented here only as the related surface the bind accepted as `c10`), all unbound Phase A slices.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD700.PGM.RPGLE` (110 lines), `QTRGSRC/ORD700A.SYSTRG`, `QTRGSRC/ORD700D.SYSTRG`, `QTRGSRC/ORD700U.SYSTRG`, `QSQLSRC/ORD701.SQLTRG`.
Related surface (accepted `c10`): `QSQLSRC/ART801.SQLPRC`; `QPNLSRC/SAMMNU.MENU:147-162` (options 81, 82, 84).
Deps read as citations only: `QDDSSRC/DETORD.PF`, `QDDSSRC/DETORD1.LF`, `QDDSSRC/ARTICLE.PF`, `QDDSSRC/ARTICLE1.LF`, `QDDSSRC/ORDER.PF`, `QDDSSRC/ORDER1.LF`, `QDDSSRC/CUSTOMER.PF`, `QDDSSRC/SAMREF.PF` (field sizes), `QPROTOSRC/LOG.RPGLEINC`, `QRPGLESRC/LOG300.RPGLE` (what `AddLogEntry` writes), `QILESRVSRC/LOG.ILESRVPGM`, `QBNDSRC/SAMPLE.BNDDIR` (LOG absent).
Writer call sites only (which I/O fires which event): `QCLSRC/ORD100C.PGM.CLLE`, `QCLSRC/ORD100C2.PGM.CLLE`, `QRPGLESRC/ORD100.PGM.RPGLE:10-12,197-206`, `QRPGLESRC/ORD101.PGM.RPGLE:8-9,164,191,250-270`, `QRPGLESRC/ORD200.PGM.SQLRPGLE:249-270`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:250-275`, `QRPGLESRC/ORD901.PGM.SQLRPGLE:39-50`.
Consumers cited as pointers: `QRPGLESRC/PRO202.SQLRPGLE:87-104`, `QRPGLESRC/PRO203.PGM.SQLRPGLE:60-84` (`ARCUSQTY` in reorder proposals), `QRPGLESRC/CUS200.PGM.SQLRPGLE:260-263`, `QDDSSRC/CUS250D.DSPF:69` (`CULASTORD` display), `QRPGLESRC/CUS300.RPGLE:130-135` (`GetCusCredit`).
Structural grep of `ATU_SRC/**` for every `write`/`update`/`delete`/SQL `INSERT`/`UPDATE`/`DELETE` on `DETORD`/`ORDER`, and every reference to `ARCUSQTY`, `CULASTORD`, `CUCREDIT`, `AddLogEntry`.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`,
`CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised — every card was human-accepted; `c01`, `c08`, `c11` stay needs-SME),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`.
