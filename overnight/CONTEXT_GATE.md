# CONTEXT_GATE — Pack A estate radar, residual run (atu-merlin)

Run: `pack-a estate residual` via `overnight/AGENT_JOB.md` (line 1 `RUN`; header "seeds 13+ candidates only", fired after CUS Verification DONE)
Started: 2026-09-08T19:05Z (UTC; 20:05 Europe/London)
Agent: estate-discovery-loop (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–4 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3` (`:overnight/CONTEXT_GATE.md`).

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `7f1172b3b7b9aaddc5315191191e5fb73e257a47` ("AGENT_JOB pack-a estate residual: RUN (seeds 13+ candidates only)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start; re-checked before every iteration |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Discovery Phase A (estate radar, residual seeds 13+)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed.
- `AUTO_BIND: false`, `AUTO_ACCEPT: false`, `PHASE_B: false`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`.
- Job header constraints honoured: no re-scan of documented CUS/ORD bound slices as new work (`ART801`, `CUSSEQ`, `ORDERCUS`, `ISOTODATE40` are given a home as SQL/UDF surfaces only, pointing at the existing cards where they exist); no widening of `atu-merlin-ts-cus-v1`; no ORD/ART convert; `modern/`, `architecture/`, `verification/` untouched.
- Human bind record (`overnight/BIND_RECORD.md`, 2026-09-08) left untouched: accepted / deferred / documented rows in `APP_MANIFEST.yaml` are never downgraded by the upsert tool (`HUMAN_SET` guard).

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` (App Discovery, Portfolio inventory, Experimental estate discovery)
- `migration-factory/prompts/estate-discovery-loop-v0.1.md` (loop algorithm, end-of-run brief, anti-patterns, completeness claims)
- `migration-factory/prompts/discovery-agent-v0.2.md` (Phase A output shape)
- `migration-factory/skills/operator/slice-scoping/SKILL.md`
- `migration-factory/schemas/app-manifest.schema.md` + `.json`; `discovery-manifest.schema.md`
- `overnight/AGENT_JOB.md` (job body = Pack A charter), `overnight/JOURNAL.md` (run 1), `overnight/METHOD_COVERAGE.md`, `overnight/MORNING_BRIEF.md` (Pack B run 4), `overnight/BIND_RECORD.md`
- `inventory/atu-merlin/APP_MANIFEST.yaml` (31 surfaces / 134 behaviours / 12 scanned seeds / 21 hints at start), `COVERAGE.md`, `docs/estate/INDEX.md`
- `overnight/tools/{upsert_app_manifest.py,gen_coverage.py}`; prior `discovery/ord-print-ord500/*` and `overnight/seeds/*.md` as the output template

Factory pack present at `migration-factory/` — no BLOCKED. `APP_MANIFEST.yaml` present, `completeness: incomplete`.

## Seed queue for this run (charter order, filtered by `unscanned_hints`)

12 iterations (MAX_ITERATIONS), one seed each:

| iter | seed | INDEX row |
| ---: | --- | ---: |
| 13 | `pro-interactive` | 13 |
| 14 | `pro-modules` (folds `srvpgm-fprovider` — same pattern as `srvpgm-fcustomer` → `cus-modules` at bind) | 14 (+24) |
| 15 | `pro-cobol-pro201` | 15 |
| 16 | `fam-maintain` | 16 |
| 17 | `cou-maintain` | 17 |
| 18 | `par-maintain` | 18 |
| 19 | `vat-module` | 19 |
| 20 | `log-programs` | 20 |
| 21 | `dat-utils` | 21 |
| 22 | `sql-objects` | 27 |
| 23 | `menu-cmd-shell` | 26 |
| 24 | `srvpgm-supporting` (SAMPLE.BNDDIR + sourceless XML/ORDER/TXT/XSS as `unknown` surfaces) | 25 |

Not scanned as separate seeds (recorded as folded, not deleted): `srvpgm-fcustomer` (folded into `cus-modules` by the 2026-09-08 bind; export facts in cards c01/c05) and `srvpgm-farticle` (recommend fold into `art-modules`; surface `srvpgm:FARTICLE` + candidates `art-modules-c06`/`c10` already carry the export facts and the ART302 gap).

## Source read (read-only, `ATU_SRC/**` untouched)

Every remaining member under `ATU_SRC/**` not deep-read in run 1: `QRPGLESRC/PRO200 PRO202 PRO203 PRO250 PRO300 PRO301 FAM300 FAM301 COU300 COU301 PAR200 PAR300 VAT300 LOG100 LOG300 DAT001 DAT002`, `QRPGSRC/COU200.RPG`, `QCBLSRC/PRO201.CBL`, `QCLSRC/PAR201.CLLE`, `QILESRC/PRO200.ILEPGM PAR201.ILEPGM`, all 8 `QILESRVSRC/*.ILESRVPGM`, all 6 `QSRVSRC/*.BND`, `QBNDSRC/SAMPLE.BNDDIR`, `QDDSSRC/PRO200D PRO201D PRO202D PRO250D PRO301D FAM301D COU200D COU301D PAR200D` + `PROVIDER.PF PROVIDE1/2.LF FAMILLY.PF FAMILL1.LF COUNTRY.PF COUNTR1.LF PARAMETER.PF VATDEF.PF`, all 9 `QPROTOSRC/*.RPGLEINC`, all 8 `QSQLSRC/*`, `QPNLSRC/SAMMNU.MENU SAMHELP.PNLGRP`, `QMSGFSRC/SAMMSGF.MSGF`, `QCMDSRC/CVTSPLPDF.CMD`.
Structural grep of `ATU_SRC/**` for every caller of each exported procedure, every writer of `PROVIDER`/`COUNTRY`/`FAMILLY`/`PARAMETER`/`VATDEF`, every reference to `ARPURQTY`, `PROVIDE2`, `ARTLSTDAT`, `ISO_Num_To_Date`, `ERR00xx` message ids, `bnddir(`, and the four sourceless service programs.

## Charter in force (Pack A)

`MAX_ITERATIONS: 12`, `MAX_NEW_SEEDS_PER_ITER: 1`, `STOP_WHEN_NO_NEW_SURFACES: 2`, `MAX_NEW_CANDIDATES: 40` (read as candidate surfaces, as in run 1), `MAX_SLICES_PHASE_A: 12`,
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**` + optional `docs/estate/INDEX.md`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: estate-discovery-loop`.
