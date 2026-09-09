# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 19

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual run 19 — Prefer: cou-maintain COU200 half ONLY (c01–c06 + c13); Do NOT re-card documented FCOUNTRY c07–c12; Hold: art-* / fam-* (ART302), pro-interactive / pro-modules / pro-cobol-pro201 (room-held)")
Started: 2026-09-09T22:36Z (UTC; 23:36 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–18 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225`, `0de4efa`, `b8feaf9`, `22eab31`, `369065b`, `72340fd`, `c98cebf` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `a792163dc2426475dd96b1de8dcc4c532d60fcb2` ("architecture(ord-batch): lock edit_surface db/test as additive pack-scoped only" — an ME pack-refinement push while line 1 already read `RUN`; the RUN tip itself is earlier in the same push burst) |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` (checked in the checkout and on `origin` after `git fetch`) |
| Sibling runs | checked before the first write (list-cloud-agents, source `automations`, RUNNING / NOT_YET_STARTED / WAITING): this run (`bc-2f42c4f5`) was the only agent of the automation alive; `origin` head was `a792163` with no `document-slices: cou-maintain` commit after run 7, so this run took the slice. |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station and not claimed. No pack is drafted or touched. Job header: "Never widen CUS/ORD. Do not invent ART302." — `COU200` is documented as-is under its own slice; the COU pack (`atu-merlin-ts-cou-v1`, BOUND and converted for the FCOUNTRY half) lists the panel half as *deferred / stay_legacy, not mapped* and is cited read-only for that fact only (`architecture/atu-merlin-cou/PACK.yaml:30,36,67,96-97,140-141`, `modern/README.md:655,681,721,749`, `modern/db/schema.sql:324,330`). Carding the panel half does **not** supersede the pack; that is the ME's / room's call.
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14,40` (Ash authorized the night wave; Field recorded; "`cou-maintain` (COU200 half previously deferred — c01–c06 + c13)") + `discovery/cou-maintain/BIND.md` ("COU200 half (c01-c06,c13) accepted night wave; FCOUNTRY already Pack B done") + `MANIFEST.yaml` (`bind_status: accepted`; the seven features already `status: accepted`, `confidence: observed-in-code`). Pack B may proceed on the accepted seven; nothing held back as needs-SME; no `inferred` row in this half. Auto-accept policy not needed.
- **Not re-carded:** `c07`–`c12` (FCOUNTRY half, documented run 7). Their cards and MANIFEST rows are not edited; where a COU200 fact bears on them (getter cache staleness, `COISO`'s only reader/writer) the new cards cite them as pointers.
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, the five residual packs (incl. `atu-merlin-ts-cou-v1`), the ORD-batch DRAFT pack, `modern/` and `verification/` are **not** touched.
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs" — the seven are `accepted`, not deferred, since the night bind)
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md` (Phase B rule: every `documented` feature has `id`, `evidence`, `behaviour_doc`); `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 18), `overnight/document-conveyor/JOURNAL.md` (runs 1–18), `overnight/CONTEXT_GATE.md` (run 18)
- `discovery/cou-maintain/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md,CHARACTERIZATION.md,features/cou-maintain-c07.md}` (the run-7 half: card shape, the cache reading that `COU200` writes invalidate, the `COISO` facts in `c08`); `discovery/ord-batch-ord900/features/ord-batch-ord900-c01.md` (run-18 card shape); `inventory/atu-merlin/APP_MANIFEST.yaml` (surface `pgm:COU200` `deferred`; behaviours `cou-maintain-c01..c06,c13` `deferred` — to be lifted by the tool's run-18 change); `docs/estate/INDEX.md` row 17
- `overnight/tools/{mark_documented.py,gen_coverage.py}` (run 18's deferred → accepted lift applies to this slice: MANIFEST says `accepted`, APP_MANIFEST still says `deferred`)
- RPG/400 (OPM RPG III) and DDS semantics relied on for hedged statements (not source): `SFLSIZ` > `SFLPAG` makes the subfile extendable to 9999 records and lets the workstation controller page through loaded records without program involvement; `SFLEND(*MORE)` under an on indicator shows `Bottom` on the last page and `More...` before it; a `PAGEDOWN` keyword conditioned by an off indicator is inactive, so a roll past the loaded records is rejected by the controller with its own message; `CAnn` (command attention) keys return no input data; a `B` field without `CHECK(LC)` is uppercased by the 5250 keyboard shift; a `Y` numeric input field rejects non-digits at the keyboard; WORKSTN INFDS positions 378–379 (binary) hold the lowest subfile RRN on the page currently displayed; `SFLRCDNBR` without `CURSOR` displays the page containing that RRN; `SFLNXTCHG` on `UPDAT` marks a record as changed for the next `READC`; `READC` returns changed records in RRN order and sets the EQ indicator when none remain; a `CHAIN` on a `UF` file locks the record until the next I/O on the file, `UPDAT`, `UNLCK` or close; `UPDAT` without a prior successful read on that file raises an RPG exception (RPG/400 message `RPG1221`-class) and, with no `INFSR`, the default handler issues an inquiry message; an OPM program always runs in the default activation group and its ODPs are its own; `GOTO` out of a subroutine to a mainline `TAG` is permitted in RPG/400 (into a subroutine is not); `SETON LR` in the mainline ends the program at the end of the cycle, closing files and releasing record locks; a failed `CHAIN` leaves the input fields unchanged. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields four slices from the night residual bind; the job header names `cou-maintain` COU200 half only (`pro-*` room-held).

**Chosen SLICE_ID: `cou-maintain`** (COU200 half: `c01`–`c06`, `c13`) — 7 candidates, all accepted, all `observed-in-code`. One OPM RPG III program (138 lines), one display file (73 lines), one physical file (10 lines), four menu lines; the whole seed half is read in full. Auto-accept policy not needed.

Not deepened this run: `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted, room-held by the job header); every `art-*` and `fam-maintain` (held); the documented FCOUNTRY half (`c07`–`c12`, cited as pointers only — `COU300.RPGLE:57-60` for the cache test the panel's writes invalidate); the documented `cus-*` / `pro-*` callers of FCOUNTRY (not re-read; `c07` / `c12` already carry the call sites).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members in full: `QRPGSRC/COU200.RPG` (138 lines; the only member in `QRPGSRC`), `QDDSSRC/COU200D.DSPF` (73 lines), `QDDSSRC/COUNTRY.PF` (10 lines).
Dependencies read as citations: `QDDSSRC/SAMREF.PF:18-21` (`COID 2`, `COUNTR 30`); `QPNLSRC/SAMMNU.MENU:139-142` (`:menui option=21 action='cmd call cou200'` in the Utilities group); `QRPGLESRC/COU300.RPGLE:6,54-60` (input-only `USROPN` declaration and the cache test — pointer to `c07`); `QRPGLESRC/COU301.RPGLE:6` (input-only declaration); `iproj.json` (`buildCommand: elias compile` — no per-member compile options in the tree).
Comparison reads for the "load strategy" and "language outlier" statements: `QRPGLESRC/CUS200.PGM.SQLRPGLE:48,135,186` and `PRO200.RPGLE:26,104,145` (14 rows per pass + `pagedown` handler); `QDDSSRC/*.DSPF` `SFLSIZ`/`SFLPAG` census (15/14 is the house geometry — 17 of 22 subfiles); `%TEXT` lines of the five COU members.
Absence evidence: structural grep of `ATU_SRC/**` (i) for `COU200` (the two members and the menu line — no CL wrapper, no command, no `.ILEPGM` / compile spec, no other caller); (ii) for F-spec / `dcl-f` declarations of `COUNTRY` (`COU200.RPG:7` `UF`, `COU300.RPGLE:6` `IF USROPN`, `COU301.RPGLE:6` `IF` — **`COU200` is the only member that can write the file**); (iii) for `WRITE` / `DELET` / `DELETE` / `INSERT` against `FCOUN` / `COUNTRY` (none — no in-tree create or delete path, no CL `CPYF`, no SQL); (iv) for `COISO` outside the seed (none — `COU200D` FMT02 is the only screen that shows or edits it; `GetCountryIso3` the only reader, itself uncalled — `c08`); (v) for `*IN25` in `COU200.RPG` (none — the `PAGEDOWN(25)` keyword has no handler); (vi) for `INFSR` / `*PSSR` in `COU200.RPG` (none); (vii) for `AADDSRCARC` (only `COU200D.DSPF:2`).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
