# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 13

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual wave after Ash authorize — Prefer: par-maintain")
Started: 2026-09-09T08:18Z (UTC; 09:18 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–12 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `a653c211ea0630347d31489f060fa24e1a63b050` ("discovery(cou-maintain): BIND.md update COU200 half accepted") — the automation fired on `e311156` (sql-objects BIND.md); the branch had moved on by ten bind commits before this run started, all read |
| RUN tip | `a1ecae1` ("AGENT_JOB pack-b document-slices: RUN (night residual; prefer par-maintain)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station; the job body carries `ROOM_OK: residual night bind from Ash + Field 2026-09-09` anyway, recorded and not consumed. No pack is drafted or touched.
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md` (Ash authorized the night wave; Field recorded; ten slices accepted for documentation) + `discovery/par-maintain/BIND.md` (`accepted` for Pack B documentation, `bind_status: accepted` in `MANIFEST.yaml`, all 13 features `accepted`). Pack B may proceed on the accepted thirteen; the bind did not hold any candidate back as needs-SME, so the one `inferred` row (`c08`) gets a card that keeps its `inferred` confidence and says what is source and what is runtime.
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, `modern/` and `verification/` are **not** touched or consumed. Job header: "Do not convert. Never widen CUS/ORD packs. Do not invent ART302 / GetArtInfo. PRO planted-bug / XML-XSS: document as-is."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 12), `overnight/document-conveyor/JOURNAL.md` (runs 1–12), `overnight/CONTEXT_GATE.md` (run 12)
- `discovery/par-maintain/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-print-ord500/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/ord-print-ord500-c01.md,features/ord-print-ord500-c08.md}` (card shape; the `PATH` consumer already documented — `c02`); `discovery/cou-maintain/MANIFEST.yaml` (`c07` — the same record-buffer cache idiom, documented); `discovery/cus-interactive/features/cus-interactive-c01.md`, `cus-interactive-c03.md` (the shared list/edit skeleton, `LRRN`, lock-across-screen wording); `discovery/cus-modules/features/cus-modules-c06.md` (`N80 PAGEDOWN` wording); `discovery/log-programs/MANIFEST.yaml` (`c01` — `LOG100`, unbound at that time, now accepted and queued); `discovery/srvpgm-supporting/MANIFEST.yaml` (`c04`/`c05` — `PAR201.ILEPGM`, missing `bnddir` on `ORD500`); `discovery/pro-interactive/MANIFEST.yaml` (`c05`/`c13` — the XML / spreadsheet `PATH` consumers)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- ILE RPG / CL / DDS platform semantics relied on for hedged statements (not source): RPG cycle re-entering the main line while `*INLR` is off; `READ` at end of file leaves the record buffer unchanged; `DELETE` by key with no match sets `%found` off and raises no exception; `UPDATE` after a failed `CHAIN` → status 01221; record-lock lifetime on an update-capable file; `CRTBNDRPG` defaults (`DFTACTGRP(*YES)` with no `H` spec; `ACTGRP(*STGMDL)` → `QILE` for `dftactgrp(*no)`); `N80`-conditioned `PAGEDOWN`; `SFLSIZ ≠ SFLPAG` auto-extend; numeric output fields without `EDTCDE` show leading zeros; CL `*TCAT` trims trailing blanks; `WRKLNK` pattern semantics of a trailing `*`. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields ten slices from the night residual bind; the job header and the bind record both prefer `par-maintain` first.

**Chosen SLICE_ID: `par-maintain`** — 13 candidates, all accepted: 12 `observed-in-code`, 1 `inferred` (`c08`, blank-`PATH` runtime effect). Auto-accept policy not needed.

Not deepened this run: `log-programs` (accepted, next in queue; `LOG100` cited for `c13` only), `menu-cmd-shell` (accepted; `SAMMNU` options 20 / 83 cited as entry points only), `srvpgm-supporting` (accepted; `SAMPLE.BNDDIR` / `PAR201.ILEPGM` / `PRO200.ILEPGM` cited for the binding facts in `c07` / `c10` / `c11` only), `sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted; `PRO202` / `PRO203` `PATH` consumers cited for `c08` / `c11` only), `ord-print-ord500` (documented; `ORD500` / `ORD500C` `PATH` consumer cited only); every `art-*` and `fam-maintain` (held).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/PAR200.PGM.RPGLE` (314 lines), `QDDSSRC/PAR200D.DSPF` (151 lines), `QCLSRC/PAR201.CLLE` (10 lines), `QILESRC/PAR201.ILEPGM` (9 lines), `QILESRVSRC/FPARAMETER.ILESRVPGM` (8 lines), `QRPGLESRC/PAR300.RPGLE` (108 lines), `QPROTOSRC/PARAMETER.RPGLEINC` (37 lines), `QDDSSRC/PARAMETER.PF` (14 lines).
Deps read as citations only: `QRPGLESRC/LOG100.PGM.RPGLE:5-27` (`c13`), `QPNLSRC/SAMMNU.MENU:135-138,155-158` (menu options 20 / 83), `QBNDSRC/SAMPLE.BNDDIR:8-14`, `QILESRC/PRO200.ILEPGM:8-9`, `QRPGLESRC/ORD500.PGM.RPGLE:4,13,21-26,57-59`, `QCLSRC/ORD500C.PGM.CLLE:4-14`, `QRPGLESRC/PRO202.SQLRPGLE:5-12,148-152`, `QRPGLESRC/PRO203.PGM.SQLRPGLE:4-8,30-33` (the four `GetParm2('PATH')` consumers and how each joins `PATH` to a file name).
Absence evidence: structural grep of `ATU_SRC/**` for `GetPARM1` / `GetPARM3` / `GetPARM4` / `GetPARM5` (prototype and body only — no caller), `ClosePARAMETER` / `closePARAMETER` (prototype and body only — no caller), `chainPARAMETER` (body only — not in the copybook, no caller), `PARAMETER` as a file (`PAR200` update/add, `PAR300` input `usropn`, `LOG100` input — nothing else opens it; no SQL touches it), `QSRVSRC/FPARAMETER.BND` (absent — `EXPORT(*ALL)` is the only export control), `PAR200` `H` spec (none), `%found` / `monitor` / `(e)` in `PAR200` (only `readc(e)` and the `%found()` in `S03chk`), `PARM2` in `SFL01` (absent — only `PARM2S`), `PAGEDOWN` conditioning (`N80`), `RRB01` / `LRRN`, `savid` / `rrs01` idiom.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
