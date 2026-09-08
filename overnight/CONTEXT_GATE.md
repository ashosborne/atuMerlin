# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 6

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "run 6 after residual bind — Prefer: dat-utils (8 accepted). Then cou-maintain FCOUNTRY half (c07–c12)")
Started: 2026-09-08T20:26Z (UTC; 21:26 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–5 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `de4fa2751fd9cfb3f79accaa4e75d37eed8dea9b` ("AGENT_JOB pack-b document-slices: RUN prefer dat-utils (run 6)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed.
- Human bind present: `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` (`d24702f`) + `discovery/dat-utils/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; all 8 candidates `accept`). Pack B may proceed.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` (CUS convert) and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md`
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 5), `overnight/document-conveyor/JOURNAL.md` (runs 1–5), `overnight/CONTEXT_GATE.md` (run 5), `overnight/seeds/dat-utils.md`, `overnight/METHOD_COVERAGE.md:18` (QM query blind spot)
- `discovery/dat-utils/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/vat-module/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/vat-module-c01.md,features/vat-module-c08.md}` (card / note style from run 5); `discovery/cus-interactive/features/cus-interactive-c07.md` and `discovery/ord-maintain-ord202/MANIFEST.yaml` (`c01`) as the sibling sentinel implementations cited by `c07`
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields two slices from the residual bind: `dat-utils` (8 accepted) and `cou-maintain` (6 accepted, `c07`–`c12`; `c01`–`c06`, `c13` deferred). Job preference puts `dat-utils` first.

**Chosen SLICE_ID: `dat-utils`** — 8 accepted candidates (`c01`–`c08`), all `observed-in-code`, none `needs-SME` at bind. Auto-accept policy not needed (nothing `inferred` in this slice).

Not deepened this run: `cou-maintain` (next in queue); `ord-maintain-ord200` / `ord-maintain-ord201` (the two callers — cited as call sites and as the consumers of the sentinel / NULL results only); `ord-maintain-ord202`, `cus-interactive` (`c07`, already documented), `ord-print-ord500` (sibling RPG-side date conversions cited for `c07` only); `sql-objects` (`ORDERCUS.VIEW` cited as the source of the raw columns only); `menu-cmd-shell` (QM query options cited as the only possible out-of-tree consumer of `ISO_Num_To_Date`); every deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QSQLSRC/ISOTODATE.SQLUDF` (30 lines), `QSQLSRC/ISOTODATE4.SQLUDF` (14 lines), `QRPGLESRC/DAT001.PGM.RPGLE` (61 lines), `QRPGLESRC/DAT002.PGM.RPGLE` (67 lines).
Deps read as citations only: `QDDSSRC/ORDER.PF:9-14` (`ORDATE`, `ORDATDEL`, `ORDATCLO` `8 0`), `QSQLSRC/ORDERCUS.VIEW:5-21` (raw numeric columns, no conversion in the view).
Caller call sites only (what is passed in, what is done with the result): `QRPGLESRC/ORD200.PGM.SQLRPGLE:74,105-132,177-187,247-252,279-283`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:67,97-125,181-191,286-288`, `QDDSSRC/ORD200D.DSPF:23-26`, `QDDSSRC/ORD201D.DSPF:23-29` (`L` fields, `DATFMT(*JOB)`, `MAPVAL(('1940-01-01' *BLANK))` on the delivery/close dates only).
Sibling sentinel implementations cited for `c07`: `QRPGLESRC/CUS200.PGM.SQLRPGLE:89,260-264,336`, `QDDSSRC/CUS200D.DSPF:144-145`, `QRPGLESRC/ORD202.PGM.RPGLE:58,83-91,147-151`, `QDDSSRC/ORD202D.DSPF:56-60`, `QRPGLESRC/ORD500.PGM.RPGLE:30-32` (no sentinel).
Writers of the three numeric dates (to establish which input values are reachable in-tree): `QRPGLESRC/ORD100.PGM.RPGLE:194-196`, `QRPGLESRC/ORD200.PGM.SQLRPGLE:247-252`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:254-264`, `QRPGLESRC/ORD901.PGM.SQLRPGLE:11-38`.
Absence evidence: structural grep of `ATU_SRC/**` for `ISOTODATE`, `ISO_Num_To_Date`, `DAT001`, `DAT002`, `99999999`, `2039`, `1940`, `*hival`; `QPNLSRC/SAMMNU.MENU:126-132` (QM query options 12/13, no source in tree).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
