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
