# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 7

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "run 7 after residual bind — Prefer: cou-maintain FCOUNTRY half only (c07–c12). COU200 (c01–c06, c13) stays deferred.")
Started: 2026-09-08T20:59Z (UTC; 21:59 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–6 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `c0528fc6eeb581a0be619fcf694814789fdc6107` ("AGENT_JOB Pack B: RUN prefer cou-maintain FCOUNTRY (run 7)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed.
- Human bind present: `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` (`d24702f`) + `discovery/cou-maintain/BIND.md` (room bind 2026-09-08, recorded by Agent Smith; `c07`–`c12` `accept`, `c01`–`c06`, `c13` `defer`). Pack B may proceed on the accepted six only.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` (CUS convert, including its read-only `fcountry` dependency surface) and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md` (feature `status` enum includes `deferred`); `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 6), `overnight/document-conveyor/JOURNAL.md` (runs 1–6), `overnight/CONTEXT_GATE.md` (run 6), `overnight/seeds/cou-maintain.md`
- `discovery/cou-maintain/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/dat-utils/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/dat-utils-c02.md,features/dat-utils-c04.md}` (card / note style from run 6); `discovery/cus-modules/features/cus-modules-c06.md` (selector-window card shape); `discovery/cus-interactive/MANIFEST.yaml` (`c04`, `c05`, `c10` — the documented consumers of this service program); `discovery/ord-batch-ord900/MANIFEST.yaml` (how a deferred bind was mirrored before)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`; `modern/src/shared/fcountry/index.ts` (read for the pointer only)

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields exactly one slice: `cou-maintain` (6 accepted, `c07`–`c12`; `c01`–`c06`, `c13` deferred). Matches the job preference.

**Chosen SLICE_ID: `cou-maintain` (FCOUNTRY half)** — 6 accepted candidates, all `observed-in-code`, none `needs-SME` at bind. Auto-accept policy not needed (nothing `inferred` in the accepted set).

Not deepened this run: `cou-maintain` `c01`–`c06`, `c13` (deferred — `COU200` cited only as the direct `COUNTRY` writer and the only `COISO` reader); `fam-maintain` (`FAM300`/`FAM301`/`FAM301D` cited for the template comparison in `c10`/`c11`); `cus-interactive` (`c04`/`c05`/`c10` already documented — call sites cited); `pro-interactive` (`PRO200`/`PRO250` call sites cited); `cus-modules` (`SltCustomer` cited as the SQL-list contrast); `srvpgm-supporting` (`SAMPLE.BNDDIR`, signature policy cited); `menu-cmd-shell` (`SAMMSGF` `ERR0002` text cited); every other deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/COU300.RPGLE` (72 lines), `QRPGLESRC/COU301.RPGLE` (252 lines), `QPROTOSRC/COUNTRY.RPGLEINC` (27 lines), `QSRVSRC/FCOUNTRY.BND` (9 lines), `QILESRVSRC/FCOUNTRY.ILESRVPGM` (9 lines), `QDDSSRC/COU301D.DSPF` (80 lines).
Deps read as citations only: `QDDSSRC/COUNTRY.PF:4-10`, `QDDSSRC/COUNTR1.LF:4-5`, `QDDSSRC/SAMREF.PF:18-21`, `QBNDSRC/SAMPLE.BNDDIR:8-14`, `QILESRC/PRO200.ILEPGM:8-9`, `QDDSSRC/CUSTOMER.PF:16`, `QDDSSRC/PROVIDER.PF:17`, `QMSGFSRC/SAMMSGF.MSGF:11-12`.
Caller call sites only (what is passed in, what is done with the result): `QRPGLESRC/CUS200.PGM.SQLRPGLE:26,35,259,281-284,292-295`, `QDDSSRC/CUS200D.DSPF:86,131-132,141`, `QRPGLESRC/PRO200.RPGLE:1-11,219,236-239,247-250`, `QDDSSRC/PRO200D.DSPF:68,101-103`, `QRPGLESRC/CUS250.PGM.RPGLE:4,10,130`, `QDDSSRC/CUS250D.DSPF:70`, `QRPGLESRC/PRO250.PGM.RPGLE:4,10,136`, `QDDSSRC/PRO250D.DSPF:65`, `QRPGLESRC/CUS301.SQLRPGLE:41,103`.
Template comparison for `c10`/`c11`: `QRPGLESRC/FAM301.RPGLE` (full diff against `COU301.RPGLE`), `QDDSSRC/FAM301D.DSPF` (diff against `COU301D.DSPF`, timestamps stripped), `QRPGLESRC/FAM300.RPGLE` (diff against `COU300.RPGLE`; `IsArtFamDeleted` / `closeFAMILLY` shape).
Signature policy comparison for `c12`: `QSRVSRC/FPROVIDER.BND:6,28`, `QSRVSRC/FVAT.BND:4`, `QSRVSRC/FCUSTOMER.BND:4`, `QSRVSRC/FARTICLE.BND:4`, `QSRVSRC/FFAMILLY.BND:4`; `QILESRVSRC/*.ILESRVPGM` `ACTGRP` lines.
Deferred half, pointer only: `QRPGSRC/COU200.RPG:4-8` (F-specs: reads `COUNTRY` `UF` directly).
Absence evidence: structural grep of `ATU_SRC/**` for `GetCountryName`, `GetCountryIso3`, `ExistCountry`, `SltCountry`, `CloseCOUNTRY`, `FCOUNTRY`, `COUNTRY.RPGLEINC`, `COISO`, `bnddir`, `H`-spec lines of the four callers.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
