# JOURNAL — Pack A estate radar, atu-merlin

Run: `discovery-phase-a` (AGENT_JOB.md, requested 2026-09-08T12:12:52Z). Branch `cursor/atu-merlin-estate-discovery` @ `4be9815`.
`overnight/stop.txt` checked before every iteration: never present.

| iter | seed | added | skipped / why | new surfaces | new hints |
| ---: | --- | --- | --- | ---: | ---: |
| 0 | bootstrap | Structural index of `ATU_SRC/**` (136 members): call graph via `extpgm`/`CALL`/`CALLPRC`, SRVPGM module lists + exports, BNDDIR, menu entry map, triggers, SQL objects. `CONTEXT_GATE.md`, `METHOD_COVERAGE.md`, `tools/gen_coverage.py`. | Deep reads of PRO/FAM/COU/PAR/VAT/LOG/DAT deferred to their seeds (VAT300/PAR300/LOG300 skimmed as deps only). | 0 | 6 structural blind-spot hints |
| 1 | `cus-interactive` | 12 candidates (CUS200 list/create/update/validation, CUS250 inquiry). | `CUSTADRE.PF`/`ADDRESS.PF` recorded as `unknown` surfaces — no program references them. | 2 (+2 unknown) | — |
| 2 | `cus-modules` | 11 candidates (getters, ExistCus, SltCustomer, injection surface, dormant scaffold). | Overlap with `srvpgm-fcustomer` flagged; not merged (charter order). | 3 | — |
| 3 | `art-interactive` | 16 candidates incl. ARTIINF free text, soft delete, LIKE fallback search. `ARTIPRO1/2.LF` added as deps (missing from charter list). | `ART202` ownership question (PRO callers) left to bind. | 4 (+1 unknown) | ARTIPROV link creation unknown |
| 4 | `art-modules` | 11 candidates. **Finding:** `ART302`/`GetArtInfo` not in FARTICLE module/export lists in source. | — | 4 | — |
| 5 | `ord-entry-ord100` | 14 candidates (staging in QTEMP, LASTORDNO allocation, confirm transaction, absence of stock/credit checks). | CMD→PGM binding marked `inferred`. | 4 | — |
| 6 | `ord-entry-ord101` | 12 candidates (qty rules ERR1001/1002, delete guard, dead option 6). | Charter name "entry" vs code "line maintenance" noted; id kept. | 1 | — |
| 7 | `ord-maintain-ord200` | 13 candidates. **Finding:** option 2 unreachable due to `or`/`and` precedence (`ORD200.PGM.SQLRPGLE:187`). | Stale `CULASTORD` on delete marked `inferred`. | 1 | — |
| 8 | `ord-maintain-ord201` | 11 candidates; 5 divergences from ORD200 tabulated. | Not merged with ORD200 (charter thin seams); shared-card recommendation made. | 1 | — |
| 9 | `ord-maintain-ord202` | 6 candidates (read-only display; SFLSIZ 7 no paging). | — | 1 | — |
| 10 | `ord-print-ord500` | 8 candidates (spool layout, PDF hand-off, blank print on unknown id). | `CVTSPLPDF` implementation absent → `inferred`. | 2 | — |
| 11 | `ord-trigger-ord700` | 11 candidates (ARCUSQTY rules, ORD701, asymmetry, staging TRG(*NO), ART801 relation, possible arithmetic drift). | 4 rows `inferred` — need box/data confirmation. | 3 | — |
| 12 | `ord-batch-ord900` | 9 candidates (LASTORDNO reset, date shift rules, auto-close +10 days). | Purpose (demo refresh) `inferred`; recommend defer at bind. | 2 | — |
| — | upsert | `tools/upsert_app_manifest.py` merged 12 slice manifests → APP_MANIFEST: 31 surfaces (28 candidate, 3 unknown), 134 behaviours (all candidate; 124 observed / 10 inferred), 12 scanned_seeds, 21 unscanned_hints. Re-run is a no-op (+0). JSON-schema validation: 0 errors. `COVERAGE.md` regenerated. `docs/estate/INDEX.md` refreshed. | — | — | — |

## Stop checks

- MAX_ITERATIONS 12 → reached (stop reason). STOP_WHEN_NO_NEW_SURFACES never triggered (every iteration added surfaces).
- MAX_SLICES_PHASE_A 12 → reached.
- MAX_NEW_CANDIDATES 40 → interpreted as **candidate surfaces** (28 ≤ 40). Behaviour stubs total 134; if the cap was meant for behaviours, Ash should prune at bind. Flagged in MORNING_BRIEF.
- MAX_FILES_TOUCHED 5000 → ~60 written. MAX_RUNTIME_HINT_HOURS 8 → well under.
- No BLOCKED.md needed. No secrets encountered (no `.env`/keys under `ATU_SRC`).

## Deviations recorded honestly

- Job file branch: work done on `cursor/atu-merlin-estate-discovery` per the automation template and TRIGGER-CONTRACT (the Cloud Agent scaffold proposed a different branch name; the template and contract were explicit, so the contract branch was used).
- Commits were made per iteration but **pushed once at the end** with `AGENT_JOB.md` already set to `DONE`: every push to this branch re-fires the automation, and an intermediate push with line 1 still `RUN` would have started a duplicate concurrent run.
- Timestamps inside slice `MANIFEST.yaml` files are normalised to the run time `2026-09-08T12:49:00Z`.
- `kind: other` for all surfaces — schema enum is integration-flavoured; no schema change invented.

---

# JOURNAL — Pack A estate radar, **residual run** (seeds 13+), atu-merlin

Run: `pack-a estate residual` (AGENT_JOB.md, requested 2026-09-08T19:04Z after CUS Verification DONE). Branch `cursor/atu-merlin-estate-discovery` @ `7f1172b`.
`overnight/stop.txt` checked before every iteration: never present. `ATU_SRC/**` untouched. Nothing bound, deepened, tested or converted. `atu-merlin-ts-cus-v1` not widened; `modern/`, `architecture/`, `verification/` untouched.

| iter | seed | added | skipped / why | new surfaces | new hints |
| ---: | --- | --- | --- | ---: | ---: |
| 13 | `pro-interactive` | 15 candidates (PRO200 list/edit, **edit never saves** — planted bug; PRO202 purchase proposal → XML with **no ARPURQTY update**; PRO250 by-id; PRO203 spreadsheet report). | XML / XSS internals (no source) → 2 `inferred`. PRO203 kept in the seed per hint; split recommended. | 4 | ARPURQTY no writer; PROVIDE2.LF stale; no create/delete for PROVIDER |
| 14 | `pro-modules` | 14 candidates (getter family, exist/deleted, cache, SltProvider rules, dead F8, **versioned binder**). Folds `srvpgm-fprovider` (c11/c12). | Getter internals identical to cus-modules — summarised, not re-derived. | 3 | — |
| 15 | `pro-cobol-pro201` | 10 candidates (read-only list, one option per Enter, **F3 on detail re-reads from current position**, direct file access). | Runtime effect of c05 marked `inferred`. | 1 | — |
| 16 | `fam-maintain` | 13 candidates (**ExistArtFam ignores FADEL**, keyed-read window with toggle and position-to, **no maintenance program**, FAVATCD dormant). | Slice id misnomer recorded, not renamed (charter stability). | 3 | no create/delete for FAMILLY |
| 17 | `cou-maintain` | 13 candidates (OPM COU200 loads all rows / edits without validation; FCOUNTRY getters + SltCountry window; toggle divergence from FAM301). | Split srvpgm from screen recommended at bind, not done here. | 4 | no create/delete for COUNTRY |
| 18 | `par-maintain` | 13 candidates (PAR200 CRUD with dup-check only, unconfirmed delete, stale list after create; PAR201 WRKLNK; FPARAMETER `EXPORT(*ALL)`; **only PATH is live**). | Blank-PATH behaviour `inferred`. | 4 | — |
| 19 | `vat-module` | 10 candidates (**ClcVAT half-adjust; unknown code → 0 silently**; no rate maintenance). | — | 2 | no create/delete for VATDEF |
| 20 | `log-programs` | 10 candidates (SAMLOG 5000 bytes, **no capacity check**, LOG100 install step, LOG not in BNDDIR, ADSPUSRSPC missing). | 4 rows `inferred` (runtime / build). | 3 | SAMLOG capacity runtime-only |
| 21 | `dat-utils` | 8 candidates (ISOTODATE40 sentinels; ISO_Num_To_Date unused; **sentinel implemented 3× in the estate**). | — | 2 | ARTLSTDAT / ISO_Num_To_Date no consumer |
| 22 | `sql-objects` | 10 candidates (**ORDERCUS inner join hides orders for missing customers**, TOTVAL gross; ARTLSTDAT no consumer; ARTIINF orphans; CUSSEQ / ART801 as **pointer surfaces** to documented cards). | ART801 / CUSSEQ behaviour **not re-scanned** (job header: no re-scan of documented bound slices). | 5 | — |
| 23 | `menu-cmd-shell` | 9 candidates (entry map; **opts 12/13/84 reach objects not in tree**; help broken; 8/12 messages live; CVTSPLPDF parameter contract). | Adapter layer — reject-as-slice recommended. | 4 | — |
| 24 | `srvpgm-supporting` | 9 candidates (BNDDIR contents; **4 sourceless srvpgms as `unknown` surfaces**; 12 bnddir programs, 2 CRTPGM, **4 bind by metadata only**; signature policy; `*CALLER` cache scope). | Supporting srvpgm procedures scanned in their own seeds (16–20), not repeated. | 1 (+4 unknown) | PRO203/ORD500/ORD700/LOG100 binding; XML/XSS copybooks; ORDER/TXT dead entries |
| — | upsert | `tools/upsert_app_manifest.py` extended (12 new `SURFACES` groups, `FOLDED_SEEDS`, 8 new structural hints, `unknown_surfaces[].surface_id`, owner-surface picker prefers earliest match in locator). Merged 12 slice manifests → APP_MANIFEST: **+40 surfaces (71), +134 behaviours (268), 24 scanned seeds, 17 hints**. Re-run is a no-op (+0). `gen_coverage.py` lint: 0 problems. `COVERAGE.md` regenerated. `docs/estate/INDEX.md` rows 13–27 refreshed. `METHOD_COVERAGE.md` rewritten (every member read once; residual = objects not in tree + box-only facts). | 4 pre-existing `needs-SME` candidate rows (`cus-modules-c10`, `ord-trigger-ord700-c01/c08/c11`) had their **notes** refreshed from the slice MANIFESTs Pack B had already updated — status and confidence unchanged, no downgrade. | — | — |

## Stop checks

- MAX_ITERATIONS 12 → reached (stop reason). STOP_WHEN_NO_NEW_SURFACES never triggered (every iteration added surfaces).
- MAX_SLICES_PHASE_A 12 → reached. MAX_NEW_SEEDS_PER_ITER 1 → respected.
- MAX_NEW_CANDIDATES 40 → read as candidate **surfaces** (run 1 convention): +36 candidate + 4 unknown = 40. Behaviour stubs +134; if the cap was meant for behaviours, Ash should prune at bind (same flag as run 1).
- MAX_FILES_TOUCHED 5000 → ~45 written. MAX_RUNTIME_HINT_HOURS 8 → well under.
- No BLOCKED.md needed. No secrets encountered.
- Seed queue after this run: **empty** (12 scanned + 3 folded = all 15 residual hints). Remaining `unscanned_hints` are 17 blind-spot / unknown-surface / folded lines, not seeds.

## Deviations recorded honestly

- `srvpgm-fcustomer`, `srvpgm-farticle`, `srvpgm-fprovider` were **folded**, not scanned: the first by the 2026-09-08 bind, the other two by this run's recommendation, following the same pattern. Their `seed …` hints were replaced by explicit `folded: …` hints (not silently deleted).
- `fam-maintain` keeps its charter id although no maintenance program exists; rename is a room decision.
- `sql-objects` gives `CUSSEQ` and `ART801` a surface of their own but points at the existing documented cards rather than re-deriving behaviour (job header constraint).
- Slice `MANIFEST.yaml` timestamps normalised to `2026-09-08T19:10:00Z`.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).
