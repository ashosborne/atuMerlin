# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 11

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "ORD wave run 11 — Prefer: ord-maintain-ord202, then ord-print-ord500")
Started: 2026-09-08T23:20Z (UTC; 00:20 Europe/London, 2026-09-09)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–10 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `f193828a8d9fe4fb38ecb50e9cba9be078812d8d` ("AGENT_JOB pack-b document-slices: RUN prefer ord-maintain-ord202 (run 11)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed. The job header says the ORD Architecture pack comes **after** the five ORD slices are carded ("ROOM_OK then"); this run does not draft or touch any pack.
- Human bind present: `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md` + `discovery/ord-maintain-ord202/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; `c01`–`c06` `accept`; no needs-SME / blocked rows). Pack B may proceed on the accepted six only.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1. Planted defects: document as-is, do not fix."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 10), `overnight/document-conveyor/JOURNAL.md` (runs 1–10), `overnight/CONTEXT_GATE.md` (run 10)
- `discovery/ord-maintain-ord202/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-maintain-ord201/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/ord-maintain-ord201-c01.md}` (card shape and the caller side of option 5 — `c05`); `discovery/ord-maintain-ord200/features/ord-maintain-ord200-c05.md` (caller side, documented run 9); `discovery/dat-utils/MANIFEST.yaml` (`c01`/`c03` sentinel cards — the "implicit sentinel" and "unguarded `%date`" pointers for this slice were recorded there in run 6); `discovery/ord-entry-ord101/MANIFEST.yaml` (`c01` `GetArtDesc` truncation — contrast for `c06`)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- IBM i 7.3 DDS reference (`SFLSIZ`, `SFLDROP`, `SFLFOLD`, `SFLPAG`) — platform semantics for the subfile-extension and truncated-form statements in `c02`/`c05`; cited as platform documentation, not source

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields two slices (`ord-maintain-ord202`, `ord-print-ord500`); the job header prefers `ord-maintain-ord202` first.

**Chosen SLICE_ID: `ord-maintain-ord202`** — 6 accepted candidates, all `observed-in-code`; nothing `inferred`, nothing needs-SME at bind. Auto-accept policy not needed.

Not deepened this run: `ord-print-ord500` (bound, queued — its header `chain` / unguarded `%date` cited as a twin contrast only, `c01`); `ord-maintain-ord200` / `ord-maintain-ord201` (documented callers; option-5 call sites cited only — `c04`); `ord-entry-ord100` / `ord-entry-ord101` (documented; `GetArtDesc` call sites cited only — `c06`); `art-modules` (unbound; `GetArtDesc` body in `ART300.RPGLE` cited only — `c06`); `dat-utils` (documented; sentinel cards cited only — `c01`); every other deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/ORD202.PGM.RPGLE` (156 lines), `QDDSSRC/ORD202D.DSPF` (91 lines).
Deps read as citations only: `QDDSSRC/ORDER.PF:5-14`, `QDDSSRC/ORDER1.LF:4-6`, `QDDSSRC/DETORD.PF:5-23`, `QDDSSRC/DETORD1.LF:4-7`, `QDDSSRC/CUSTOME1.LF:4-6`, `QDDSSRC/CUSTOMER.PF:5-7`, `QDDSSRC/ARTICLE1.LF:4-6`, `QDDSSRC/ARTICLE.PF:5-7`, `QDDSSRC/SAMREF.PF:11-17,24,34-39,47-53,68`.
Caller / twin sites only: `QRPGLESRC/ORD200.PGM.SQLRPGLE:24-25,236-239`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:21-22,242-245`, `QRPGLESRC/ORD500.PGM.RPGLE:4-11,30-33`, `QRPGLESRC/ORD100.PGM.RPGLE:117,194,266`, `QRPGLESRC/ORD101.PGM.RPGLE:114,223`, `QRPGLESRC/ORD901.PGM.SQLRPGLE:21`, `QRPGLESRC/ART300.RPGLE:19-27`, `QPROTOSRC/ARTICLE.RPGLEINC:7-8`, `QDDSSRC/ORD200D.DSPF:23-27,31-32`, `QDDSSRC/ORD201D.DSPF:23-34,43`, `QRPGLESRC/CUS200.PGM.SQLRPGLE:89`, `QRPGLESRC/DAT002.PGM.RPGLE:46`.
Absence evidence: structural grep of `ATU_SRC/**` for `ORD202` (callers: only the `extpgm('ORD202')` prototypes in `ORD200`/`ORD201`; no CL, command, menu or other program call site); grep of `ORD202.PGM.RPGLE` for `%found` (none), `oryear` / `custnm` (never referenced in calcs — file/DSPF fields only), `help` / `prompt` / `refresh` / `create` / `morekeys` / `pagedown` / `sflnxtchg` / `dspatr_ri` / `sflmsg` / `rrs01` / `err01` / `User` / `count` / `mode` / `crt` / `upd` / `chk` (declared, never referenced); grep of `ORD202D.DSPF` for input-capable fields (none — every `SFL01` and `CTL01` field is `O`; `RRB01` is `H`), `PAGEDOWN` / `ROLLUP` (none); grep of `ATU_SRC/**` for `ordate =` writers (`ORD100:194` today's date, `ORD901:21` shift — never `0` in-tree).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
