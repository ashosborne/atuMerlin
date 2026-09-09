# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 17

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; job header "night residual run 17 — Prefer: sql-objects, then ord-batch-ord900, then cou-maintain COU200 half")
Started: 2026-09-09T21:19Z (UTC; 22:19 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–16 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3`, `17f0bbc`, `042232b`, `c6b4704`, `7a0e126`, `d47e987`, `60d3d61`, `a664dfc`, `ee67225`, `0de4efa`, `b8feaf9`, `22eab31`, `369065b` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `30dd3d2ade4281d25ddb1af6b4abb270a4b85c17` ("AGENT_JOB pack-b document-slices: RUN prefer sql-objects (run 17)" — the RUN tip itself fired this run) |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` (checked in the checkout and on `origin` after `git fetch`) |
| Sibling runs | checked before the first write (list-cloud-agents, source `automations`): this run was the only RUNNING agent of the automation. One NOT_YET_STARTED entry created at 20:14Z (fired by the verify-LOG DONE push `236f4ce`, never started, no branch) was the only other; `origin` head was `30dd3d2` with no `document-slices: sql-objects` commit, so this run took the slice. |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required for this station and not claimed. No pack is drafted or touched. Job header: "ART/providers held" — no `art-*` / `fam-*` / `pro-*` slice is deepened; `ART200`, `ART302` are cited only for the `ARTIINF` read/write statements the accepted `c05` / `c06` name, per `BIND.md` "Never invent ART302" (no `GetArtInfo` behaviour is documented beyond "reads `artinf` by `arid` into a 1520-byte field").
- Human bind present: `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md` (Ash authorized the night wave; Field recorded; ten slices accepted for documentation) + `discovery/sql-objects/BIND.md` (`accepted` for Pack B documentation, `bind_status: accepted` in `MANIFEST.yaml`, all 10 features `accepted`). Pack B may proceed on the accepted ten; the bind did not hold any candidate back as needs-SME, so the one `inferred` row (`c04`, who reads `ARTLSTDAT`) gets a card that keeps its `inferred` confidence and says what is source and what is outside the tree (run-13/14/15/16 practice).
- `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, the five residual packs, `modern/` and `verification/` are **not** touched. `modern/db/schema.sql:68-70,142-148` and `modern/src/features/order/order.repository.ts:29-40` are cited read-only as the existing target counterpart of `ORDERCUS` / `CUSSEQ` (as-is view, `cusseq` sequence) — pointer only; job header "Never widen CUS/ORD".
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape §"Phase B — Deepen", exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md` ("Do NOT deepen rejected or deferred IDs")
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md` (Phase B rule: every `documented` feature has `id`, `evidence`, `behaviour_doc`); `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (run 16), `overnight/document-conveyor/JOURNAL.md` (runs 1–16), `overnight/CONTEXT_GATE.md` (run 16)
- `discovery/sql-objects/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/srvpgm-supporting/{MANIFEST.yaml,CHARACTERIZATION.md,SME_BRIEF.md,features/srvpgm-supporting-c01.md}` (card shape; the `inferred`-carded precedent); `discovery/cus-interactive/features/cus-interactive-c02.md` (the `CUSSEQ` behaviour `c07` points at — not re-derived); `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c10.md` (the `ART801` behaviour `c08` points at — not re-derived); `discovery/ord-maintain-ord200/features/ord-maintain-ord200-c01.md`, `discovery/ord-maintain-ord201/features/ord-maintain-ord201-c01.md`, `-c10.md` (the two `ORDERCUS` consumers — cross-referenced); `discovery/ord-entry-ord100/features/ord-entry-ord100-c01.md`, `-c14.md` (how an orphan order can arise); `discovery/menu-cmd-shell/features/menu-cmd-shell-c01.md` + `CANDIDATES.md` (`ARTQRY` absent — `c04`); `inventory/atu-merlin/APP_MANIFEST.yaml` (surfaces `view:ORDERCUS`, `view:ARTLSTDAT`, `table:ARTIINF`, `seq:CUSSEQ`, `sqlprc:ART801`; behaviours `sql-objects-c01..c10`); `docs/estate/INDEX.md` rows 1, 3, 11, 27
- `overnight/tools/{mark_documented.py,gen_coverage.py}`
- DB2 for i SQL semantics relied on for hedged statements (not source): `SUM` over `DECIMAL(9,2)` yields a decimal of the maximum precision set by `DECRESULT` with scale 2; an unqualified object in a `*SYS`-naming program resolves through `*LIBL`; `LABEL ON COLUMN … IS` sets a column heading in 20-character segments and `… TEXT IS` the column text; `CREATE SEQUENCE` defaults to `AS INTEGER`, `CACHE 20`, `NO ORDER`; `NEXT VALUE FOR` is not rolled back; an SQL procedure without a handler ends at the first failing statement with that SQLSTATE; `SET OPTION COMMIT = *NONE` = no commitment control; `SPECIFIC` supplies the external program name of an SQL procedure; `CCSID 297` = EBCDIC France; a host variable narrower than the fetched value raises a fetch error rather than truncating. Each such statement is flagged "inference / runtime-confirmable" on the cards.

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields six slices from the night residual bind; the job header and the bind record both prefer `sql-objects` first.

**Chosen SLICE_ID: `sql-objects`** — 10 candidates, all accepted: 9 `observed-in-code`, 1 `inferred` (`c04`, who reads `ARTLSTDAT`). Two rows (`c07` `CUSSEQ`, `c08` `ART801`) are surfaces for behaviours already carded under `cus-interactive-c02` / `ord-trigger-ord700-c10`; their cards document the *object* (DDL contract, resolution, callers) and point at the existing behaviour cards rather than re-deriving them. Auto-accept policy not needed.

Not deepened this run: `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive` / `pro-modules` / `pro-cobol-pro201` (accepted, queue); every `art-*` and `fam-maintain` (held — `ART200.PGM.SQLRPGLE:203-216,331-378` and `ART302.SQLRPGLE:8-24` cited for the `ARTIINF` statements and the option-4 soft delete only; no ART screen or getter behaviour documented); the documented `cus-*` / `ord-*` slices (cited as consumers only).

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members in full: `QSQLSRC/ORDERCUS.VIEW` (35 lines), `QSQLSRC/ARTLSTDAT.VIEW` (23), `QSQLSRC/ARTIINF.TABLE` (25), `QSQLSRC/CUSSEQ.SQLSEQ` (9), `QSQLSRC/ART801.SQLPRC` (42); `QSQLSRC/` listing (8 members — the other three, `ISOTODATE.SQLUDF`, `ISOTODATE4.SQLUDF`, `ORD701.SQLTRG`, belong to `dat-utils` / `ord-trigger-ord700` and were not re-read).
Dependencies read as citations: `QDDSSRC/SAMREF.PF` (field reference — `ARID 6A`, `ARDESC 50A`, `CUID 5P 0`, `CUSTNM 30A`, `ORID 6P 0`, `QUANTITY 5 0` (no type letter — packed by the DDS physical-file default, inference), `TOTPRICE 9P 2`, `YEAR 4P 0`, `DLCODE 1A`), `ORDER.PF`, `DETORD.PF`, `CUSTOMER.PF`, `ARTICLE.PF`, `ORDER1.LF`, `DETORD1.LF`, `CUSTOME1.LF`, `ARTICLE1.LF`, `ARTICLE2.LF` (keys, `UNIQUE`).
Consumers read as citations: `QRPGLESRC/ORD200.PGM.SQLRPGLE:5-31,104-132` and `QDDSSRC/ORD200D.DSPF:23,28`; `ORD201.PGM.SQLRPGLE:93-120` and `ORD201D.DSPF:25,28`; `ART200.PGM.SQLRPGLE:5-12,66-75,168-176,196-222,331-378` and `ART200D.DSPF:116-134`; `ART302.SQLRPGLE:1-24`; `CUS200.PGM.SQLRPGLE:38,73,150-190,231,258`; `ORD901.PGM.SQLRPGLE:44-52` (the duplicated `CULASTORD` statement); `ORD100.PGM.RPGLE:194` (how `ORDATE` is set); `QPNLSRC/SAMMNU.MENU:125-160`.
Absence evidence: structural grep of `ATU_SRC/**` (i) for `ORDERCUS` / `ARTLSTDAT` / `ARTIINF` / `CUSSEQ` / `ART801` / `UPDATE_ON_CUS_ORD_QTY` / `ARTQRY` / `STRQMQRY` (the lines above and nothing else — `ARTLSTDAT` appears only in its own DDL; `ARTQRY` only on the menu); (ii) for `DELETE` against `ARTIINF` / `CUSTOMER` / `FCUST` / `CUSTOME1` (none); (iii) for writers of `CUDEL` (none — read in `CUS300.RPGLE:158,169` only); (iv) for `CCSID` (`ARTIINF.TABLE` is the only data column with an explicit CCSID; the other occurrences are `SAMMSGF.MSGF` and an `ORD700` API parameter); (v) for `SET OPTION` in `QRPGLESRC` (`ART200:332` only); (vi) for a `QMQRYSRC` source directory or any QM member (none — 16 source directories, none for QM).

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`. House style: never use pin / pinned / landed.
