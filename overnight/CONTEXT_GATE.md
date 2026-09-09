# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 12

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "ORD wave run 12 — Prefer: ord-print-ord500")
Started: 2026-09-08T23:50Z (UTC; 00:50 Europe/London, 2026-09-09)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–11 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `c0fbaa2129d307fa6c1767a01cad6711d67f3583` ("AGENT_JOB pack-b document-slices: RUN prefer ord-print-ord500 (run 12)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed. The job header says the ORD Architecture pack comes **after** the five ORD slices are carded ("ROOM_OK then"); this run cards the fifth and does not draft or touch any pack.
- Human bind present: `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md` + `discovery/ord-print-ord500/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; `c01`–`c03`, `c05`–`c08` `accept`; `c04` `needs-SME` / `inferred`). Pack B may proceed on the accepted seven only; `c04` gets no card.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1. Planted defects: document as-is, do not fix."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 11), `overnight/document-conveyor/JOURNAL.md` (runs 1–11), `overnight/CONTEXT_GATE.md` (run 11)
- `discovery/ord-print-ord500/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-maintain-ord202/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/ord-maintain-ord202-c01.md,features/ord-maintain-ord202-c06.md}` (card shape; the twin unguarded `%date` and the `FARTICLE` contrast); `discovery/ord-entry-ord100/MANIFEST.yaml` (`c08` — the caller side of the print after confirm); `discovery/ord-maintain-ord200/MANIFEST.yaml` / `discovery/ord-maintain-ord201/MANIFEST.yaml` (`c05` — option 6 call sites); `discovery/par-maintain/MANIFEST.yaml` (`c11` — `GetParm2('PATH')` consumers; unbound); `discovery/srvpgm-supporting/MANIFEST.yaml` (`c05` — `ORD500` has no `bnddir` / `.ILEPGM`; unbound); `discovery/vat-module/MANIFEST.yaml` (`c02` — silent zero VAT, the stored value this print sums); `discovery/dat-utils/MANIFEST.yaml` (`c01`/`c03` — sentinel and unguarded-`%date` pointers)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- ILE RPG / CL platform semantics relied on for hedged statements (not source): `CONST` parameter of a shorter length receives a right-truncated temporary; `OFLIND(name)` with an undeclared name; unmonitored RPG status 00112 / CL escape in a called program → status 00202 in the caller; DDS `SKIPB`/`SPACEB` ordering; `EDTCDE(2)` zero → blank; command-analyser `TYPE(*NAME)` rules. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields exactly one slice: `ord-print-ord500` — also the job header's preference.

**Chosen SLICE_ID: `ord-print-ord500`** — 8 candidates: 7 accepted (`observed-in-code`), 1 needs-SME (`c04`, `inferred`: `CVTSPLPDF` processing program absent from the tree). Auto-accept policy not needed; `c04` is **not** deepened and stays needs-SME.

Not deepened this run: `ord-entry-ord100` / `ord-maintain-ord200` / `ord-maintain-ord201` / `ord-maintain-ord202` (documented; call sites and the twin `%date` cited only — `c05`, `c08`); `ord-entry-ord101` (documented; dead prototype cited only — `c05`); `par-maintain` (unbound; `GetParm2` body in `PAR300.RPGLE` cited only — `c02`); `srvpgm-supporting` (unbound; missing-`bnddir` blind spot cited only — `c06`); `art-modules` (unbound; `FARTICLE.GetArtDesc` body cited only — `c06`); `cus-modules` (documented; `GetCusName` contrast — `c06`); `vat-module` / `dat-utils` (documented; pointers only); every other deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD500.PGM.RPGLE` (60 lines), `QCLSRC/ORD500C.PGM.CLLE` (14 lines), `QDDSSRC/ORD500O.PRTF` (112 lines).
Deps read as citations only: `QCMDSRC/CVTSPLPDF.CMD:4-96` (parameter definition — `c03` invoked contract; `c04` blind spot not deepened), `QPROTOSRC/PARAMETER.RPGLEINC:13-15,37`, `QRPGLESRC/PAR300.RPGLE:4-6,34-44,82-107`, `QDDSSRC/PARAMETER.PF:4-14`, `QILESRVSRC/FPARAMETER.ILESRVPGM:8`, `QBNDSRC/SAMPLE.BNDDIR:8-14`, `QDDSSRC/ORDER.PF:5-14`, `QDDSSRC/ORDER1.LF:4-6`, `QDDSSRC/DETORD.PF:5-23`, `QDDSSRC/DETORD1.LF:4-7`, `QDDSSRC/CUSTOMER.PF:5-29`, `QDDSSRC/CUSTOME1.LF:4-6`, `QDDSSRC/ARTICLE.PF:5-39`, `QDDSSRC/ARTICLE1.LF:4-6`, `QDDSSRC/SAMREF.PF:11-17,24,34-39,47-55,68`.
Caller / twin sites only: `QRPGLESRC/ORD100.PGM.RPGLE:30-31,194-212`, `QDDSSRC/ORD100D.DSPF:128-141`, `QRPGLESRC/ORD200.PGM.SQLRPGLE:27,240-243`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:24,246-249`, `QRPGLESRC/ORD101.PGM.RPGLE:27-28`, `QRPGLESRC/ORD202.PGM.RPGLE:83-85,108`, `QRPGLESRC/ART300.RPGLE:19-27,114-127`, `QRPGLESRC/ORD100.PGM.RPGLE:260-268` (how `ODTOT` / `ODTOTVAT` are stored), `QCLSRC/PAR201.CLLE:4-10` (the other `GetParm2('PATH')` consumer).
Absence evidence: structural grep of `ATU_SRC/**` for `ORD500` (callers: the `extpgm('ORD500')` prototypes in `ORD100`, `ORD101`, `ORD200`, `ORD201` only; no CL, command, menu or other program call site; `ORD500C` referenced only from `ORD500`); grep of `ATU_SRC/**` for `CVTSPLPDF` (the `.CMD` definition and the `ORD500C` call only — no processing program, no `.ILEPGM`); grep of `ORD500.PGM.RPGLE` for `%found` (none), `monitor` / `(e)` / `*pssr` (none), `overflow` (F-spec `oflind` only — never tested, no D-spec), `header2` (written once, not in the page-break branch); grep of `ATU_SRC/**` for `ClosePARAMETER` callers (none outside `PAR300`); grep of `QILESRC/` for an `ORD500` build member (none — `PAR201.ILEPGM`, `PRO200.ILEPGM` only).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
