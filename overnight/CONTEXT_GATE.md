# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 18

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual run 18 — Prefer: ord-batch-ord900, then cou-maintain COU200 half; Hold: art-* / fam-* (ART302), pro-interactive / pro-modules / pro-cobol-pro201 (room-held)")
Started: 2026-09-09T22:05Z (UTC; 23:05 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–17 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225`, `0de4efa`, `b8feaf9`, `22eab31`, `369065b`, `72340fd` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `e81562fc14ed9046a93575e2d22dd3dbfc76c244` ("AGENT_JOB pack-b document-slices: RUN prefer ord-batch-ord900 (run 18)" — the RUN tip itself fired this run) |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` (checked in the checkout and on `origin` after `git fetch`) |
| Sibling runs | checked before the first write (list-cloud-agents, source `automations`): this run was the only RUNNING agent of the automation. One NOT_YET_STARTED entry created at 20:15Z (fired by the verify-LOG DONE push `236f4ce`, never started, no branch) was the only other; `origin` head was `e81562f` with no `document-slices: ord-batch-ord900` commit, so this run took the slice. |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station and not claimed. No pack is drafted or touched. Job header: "Never widen CUS/ORD" — `ORD900` / `ORD901` are documented as-is under their own slice; the ORD pack (`atu-merlin-ts-ord-v1`) lists both batches as *not converted / deferred* and is cited read-only for that fact only (`modern/README.md:210,287,379,405`, `modern/db/schema.sql:59-61`).
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md` (Ash authorized the night wave; Field recorded; ten slices accepted for documentation) + `discovery/ord-batch-ord900/BIND.md` (`accepted` for Pack B documentation, `bind_status: accepted` in `MANIFEST.yaml`, all 9 features `accepted`). Pack B may proceed on the accepted nine; the bind did not hold any candidate back as needs-SME, so the one `inferred` row (`c07`, purpose = demo-data refresh) gets a card that keeps its `inferred` confidence and says what is source and what is reading (run-13..17 practice).
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, the five residual packs, `modern/` and `verification/` are **not** touched.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md` (Phase B rule: every `documented` feature has `id`, `evidence`, `behaviour_doc`); `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 17), `overnight/document-conveyor/JOURNAL.md` (runs 1–17), `overnight/CONTEXT_GATE.md` (run 17)
- `discovery/ord-batch-ord900/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/sql-objects/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/sql-objects-c01.md,-c04.md}` (card shape; the `inferred`-carded precedent; `c08` / `c10` — `ORD901`'s duplicated `CULASTORD` statement and undelimited `order`); `discovery/ord-entry-ord100/features/ord-entry-ord100-c07.md` (`LASTORDNO` consumer; `ODYEAR` written as 0); `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c04.md`, `-c10.md` (`ORD700U` fires on the `ODYEAR` backfill as a zero-delta no-op; `ART801` = open-order summary reset); `discovery/menu-cmd-shell/features/menu-cmd-shell-c01.md` (Utilities group, options 80/81 without confirmation); `inventory/atu-merlin/APP_MANIFEST.yaml` (surfaces `pgm:ORD900`, `pgm:ORD901`; behaviours `ord-batch-ord900-c01..c09`); `docs/estate/INDEX.md` rows 5, 11, 12, 27
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- ILE RPG / DB2 for i semantics relied on for hedged statements (not source): `SELECT … INTO` of a `NULL` aggregate without an indicator variable sets SQLCODE `-305` and leaves the host variable unchanged; a standalone numeric field is initialised to zero; `READP` at beginning-of-file sets `%eof` and leaves the input fields unchanged; `IN *LOCK` / `OUT` on a data area lock and unlock it; `%date(n:*iso)` on a numeric that is not a valid `yyyymmdd` raises `RNQ0112` and, unhandled, halts the program with an inquiry message; an SQLRPGLE member with no `SET OPTION COMMIT` takes the precompiler's `COMMIT` default at build (compile options are not in the tree — `iproj.json` delegates to `elias compile`); a native `UF` file without the `COMMIT` keyword is not under commitment control; a `UNIQUE` logical file's access path rejects a duplicate key written through the physical; `TRGUPDCND(*CHANGE)` fires the update trigger only when a field changed. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields five slices from the night residual bind; the job header prefers `ord-batch-ord900` first (`pro-*` room-held).

**Chosen SLICE_ID: `ord-batch-ord900`** — 9 candidates, all accepted: 8 `observed-in-code`, 1 `inferred` (`c07`, purpose = demo-data refresh). Two programs, 11 and 52 lines; the whole seed is read in full. Auto-accept policy not needed.

Not deepened this run: `cou-maintain` COU200 half (accepted, next in queue), `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted, room-held by the job header); every `art-*` and `fam-maintain` (held); the documented `cus-*` / `ord-*` / `sql-objects` / `menu-cmd-shell` slices (cited as neighbours only — `ART801.SQLPRC:35-37` for the duplicated statement, `ORD700.PGM.RPGLE:83-110` for the trigger path, `ORD100.PGM.RPGLE:56,189-197` for the `LASTORDNO` consumer, `ORD200.PGM.SQLRPGLE:244-259` / `ORD201.PGM.SQLRPGLE:250-265` for the interactive deliver / close writes).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members in full: `QRPGLESRC/ORD900.PGM.RPGLE` (11 lines), `QRPGLESRC/ORD901.PGM.SQLRPGLE` (52 lines).
Dependencies read as citations: `QDDSSRC/ORDER.PF` (no key — arrival sequence), `ORDER1.LF` (`UNIQUE K ORID`), `ORDER2.LF`, `ORDER3.LF` (`K ORDATE, ORID` — no in-tree reader), `DETORD.PF` (`ODYEAR`; PF key `ODLINE, ODORID, ODYEAR`), `DETORD1.LF`, `CUSTOMER.PF:5-6,21` (`CULASTORD 8 0`), `SAMREF.PF:15,34,68` (`CUID 5P 0`, `ORID 6P 0`, `YEAR 4P 0`), `QDTASRC/LASTORDNO.DTAARA` (`*DEC LEN(6 0) VALUE(60719)`, ARCAD-generated header), `QTRGSRC/ORD700U.SYSTRG` (`TRGEVENT(*UPDATE) TRGUPDCND(*CHANGE)` on `DETORD`), `QSQLSRC/ORD701.SQLTRG` (`AFTER INSERT` only on `ORDER`), `QSQLSRC/ART801.SQLPRC:29-37`.
Consumers / neighbours read as citations: `QRPGLESRC/ORD100.PGM.RPGLE:56,187-197` (`LASTORDNO` `IN *LOCK` / `+1` / `OUT`; `ORDATE = today`, `ORDATDEL = ORDATCLO = 0`, `ODYEAR` never assigned); `ORD200.PGM.SQLRPGLE:244-259`, `ORD201.PGM.SQLRPGLE:250-265` (options 7 close / 8 deliver — the interactive writers of `ORDATDEL` / `ORDATCLO`); `ORD202.PGM.RPGLE:86-90`, `ORD500.PGM.RPGLE:32`, `ORD500O.PRTF:48-49` (readers of the date / year fields); `ORD700.PGM.RPGLE:21,72-110` (event `'3'` branch; `UpdArt` returns on `qty = 0`); `QPNLSRC/SAMMNU.MENU:49,134-168` (Utilities group; `wrksbmjob` is the only job-related action).
Absence evidence: structural grep of `ATU_SRC/**` (i) for `ORD900` / `ORD901` (the two members and the two menu lines — no CL wrapper, no command, no other caller); (ii) for `LASTORDNO` (`ORD900:5`, `ORD100:56`, the DTAARA source, the menu text — two programs touch the data area); (iii) for `ODYEAR` (`DETORD.PF:7`, `SAMREF` via `REFFLD`, `ORD901:42-45` — **no other writer or reader**; `ORD100` never assigns it); (iv) for `ORDATDEL` / `ORDATCLO` assignments (`ORD100:195-196`, `ORD200:246-257`, `ORD201:252-263`, `ORD901:22-36` — the complete writer set); (v) for `JOBSCDE` / `SBMJOB` / `ADDJOBSCDE` (none — `SAMMNU:49` `wrksbmjob` is a viewer); (vi) for `ORDER3` (no reader); (vii) for `SET OPTION` in `ORD901` (none — `ART200:332` and `ART801`'s header remain the only ones in the tree); (viii) for `*ENTRY` / `PLIST` / `PI` in the two members (none — neither program takes parameters).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
