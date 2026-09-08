# MORNING_BRIEF — atu-merlin

# PHASE A ONLY - UNBOUND CANDIDATES

# ESTATE_SCAN_INCOMPLETE

Run: Pack A estate radar, **residual run** (seeds 13+) · 2026-09-08 19:05–19:45 UTC (20:05–20:45 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `7f1172b`
Previous briefs preserved in git: Pack B run 4 at `200a3e3:overnight/MORNING_BRIEF.md`; Pack A run 1 at `ab342e9:overnight/MORNING_BRIEF.md`.

> Of the allowlisted seeds scanned, these candidate slices were proposed; APP_MANIFEST updated; nothing bound.

## 1. Counts

| | |
| --- | ---: |
| seeds scanned this run | **12** (`pro-interactive`, `pro-modules`, `pro-cobol-pro201`, `fam-maintain`, `cou-maintain`, `par-maintain`, `vat-module`, `log-programs`, `dat-utils`, `sql-objects`, `menu-cmd-shell`, `srvpgm-supporting`) |
| seeds folded (no separate Phase A) | 3 (`srvpgm-fcustomer` → cus-modules [bind], `srvpgm-farticle` → art-modules, `srvpgm-fprovider` → pro-modules) |
| new candidate surfaces | **36** candidate + **4** `unknown` (`srvpgm:XML`, `srvpgm:XSS`, `srvpgm:ORDER`, `srvpgm:TXT` — listed in `SAMPLE.BNDDIR`, no source) |
| new candidate behaviours | **134** (123 `observed-in-code`, 11 `inferred`) |
| deferred / reject recommendations (prose only) | 9 slice-level (see §6); 0 MANIFEST statuses changed |
| errors / BLOCKED | 0 |
| `ATU_SRC` members read at least once across both Pack A runs | 136 of 136 — **inventory coverage, not completeness** |

## 2. Top candidates (things a human should know before binding)

| id | slice | entry hint | confidence | evidence |
| --- | --- | --- | --- | --- |
| pro-interactive-c03 | pro-interactive | PRO200 opt 2 — **edit never saves** (`mode = upd` commented out: "to remove the bug uncomment") | observed-in-code | `QRPGLESRC/PRO200.RPGLE:184-185`, `:258-266` |
| pro-interactive-c08 | pro-interactive | PRO202 F8 confirm writes `Pur_Ord_*.xml` and **does not update `ARPURQTY`** — no writer of the field anywhere in the tree | observed-in-code | `PRO202.SQLRPGLE:148-176`; grep |
| fam-maintain-c02 | fam-maintain | **`ExistArtFam` ignores `FADEL`** — a deleted family passes ART200 validation; every other `Exist*` excludes `'X'` | observed-in-code | `FAM300.RPGLE:29-37`; `ART200.PGM.SQLRPGLE:286` |
| vat-module-c02 | vat-module | **unknown VAT code → rate 0 → zero VAT silently**; no caller checks `ExistVATRate` | observed-in-code | `VAT300.RPGLE:61-74`; `ORD100.PGM.RPGLE:267-269` |
| sql-objects-c01 | sql-objects | **`ORDERCUS` inner-joins `CUSTOMER`** — orders for a missing customer vanish from ORD200/ORD201; `TOTVAL` is VAT-inclusive | observed-in-code | `ORDERCUS.VIEW:5-21` |
| log-programs-c04 | log-programs | `SAMLOG` 5000 bytes, no auto-extend, 600-byte writes — **logging stops silently after ~4400 bytes** (`ORD700` swallows the error) | inferred | `LOG300.RPGLE:13,27-32`; `LOG100.PGM.RPGLE:21` |
| pro-cobol-pro201-c05 | pro-cobol-pro201 | F3 on the detail panel re-reads `PROVIDE1` from the current position with `IN80` sticky → likely empty list | inferred (code path observed) | `PRO201.CBL:147-158`, `:292-305` |
| dat-utils-c07 | dat-utils | `0 → 1940-01-01` sentinel implemented **three times** (DAT002 SQL, CUS200 RPG, ORD202 RPG); only the SQL one also maps `99999999` | observed-in-code | `DAT002.PGM.RPGLE:45-48` |
| srvpgm-supporting-c02 / c05 | srvpgm-supporting | `XML` / `XSS` have no source; `PRO203`, `ORD500`, `ORD700`, `LOG100` **bind by build metadata only** | observed (absence) / inferred | `SAMPLE.BNDDIR:10-11`; H-specs |
| menu-cmd-shell-c02 | menu-cmd-shell | menu opts 12 / 13 / 84 reach **QM queries and `ADSPUSRSPC` that are not in the tree** — two reports and the log viewer are unscannable | inferred | `SAMMNU.MENU:125-132`, `:159-162` |
| par-maintain-c11 | par-maintain | the whole parameter subsystem carries **one live key** (`PATH`); `GetPARM1/3/4/5` unused | observed-in-code | grep `GetParm` |
| pro-interactive-c04 / fam-maintain-c11 / cou-maintain-c04 / vat-module-c07 | four slices | **no create or delete path** for PROVIDER, FAMILLY, COUNTRY, VATDEF rows in `ATU_SRC`; `PRDEL`/`FADEL`/`VATDEL` have no writer | observed-in-code (absence) | greps |

## 3. APP_MANIFEST / COVERAGE delta

| Metric | before (`200a3e3`) | after |
| --- | ---: | ---: |
| surfaces_total | 31 | **71** (accepted 12 · candidate 50 · deferred 2 · unknown 7) |
| behaviours_known | 134 | **268** (candidate 226 · documented 42) |
| behaviours confidence `inferred` | 10 | 21 |
| scanned_seeds | 12 | **24** |
| unscanned_hints | 21 | 17 (15 `seed …` lines removed; 3 `folded:` + 8 structural lines added) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- Human-set rows untouched: 12 `accepted` surfaces, 2 `deferred`, 42 `documented` behaviours — no status changed, no downgrade. Four pre-existing `needs-SME` candidate rows (`cus-modules-c10`, `ord-trigger-ord700-c01/c08/c11`) had their **notes** refreshed from the slice MANIFESTs Pack B had already updated (text only).
- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). `docs/estate/INDEX.md` rows 13–27 refreshed (`unscanned` → `candidate` / `folded`). `overnight/METHOD_COVERAGE.md` rewritten.
- `overnight/tools/upsert_app_manifest.py` extended: 12 new `SURFACES` groups, `FOLDED_SEEDS`, `unknown_surfaces[].surface_id`, owner-surface picker prefers the earliest object name in the locator. Re-run is a no-op.

## 4. Remaining `unscanned_hints` (17) — honesty metric, not completeness

**Seed queue: empty.** 24 of 27 charter seeds scanned, 3 folded → 27 of 27 seeds addressed. What remains is not seeds but **things the tree cannot show**:

- 4 sourceless service programs (`XML`, `XSS` used by PRO202/PRO203; `ORDER`, `TXT` referenced by nothing) and their copybooks
- QM queries `CUSQRY`, `ARTQRY`, form `CUSQRYFMT`; commands `CVTSPLPDF` (impl), `ADSPUSRSPC`
- binding of `PRO203`, `ORD500`, `ORD700`, `LOG100` (no `bnddir`, no `.ILEPGM`); CMD→PGM bindings; trigger attachment
- `SAMLOG` capacity (runtime); `ARPURQTY` writer; `PROVIDE2.LF` (stale, keys on a non-field); no create/delete for four reference tables; `CUSTADRE`/`ADDRESS` unused; `ARTIPROV` link creation; `ARTLSTDAT` / `ISO_Num_To_Date` consumers

## 5. Recommended human priority for bind (not auto-bound)

Prefer CUS / ART, then ORD seams — and this run's residual slices are mostly **dependencies of those**, not independent products:

1. **`vat-module`** (c01, c02, c08) — load-bearing for the ORD line cards already documented (`ord-entry-ord100-c03/c04` cite `CLCVat`); 85 lines, pure rule. Bind alongside `ord-entry-ord101`.
2. **`cou-maintain` — FCOUNTRY half only** (c07, c09–c12) — dependency of the documented CUS slices (`ExistCountry`, `SltCountry`, `GetCountryName`). Consider splitting the OPM `COU200` screen off.
3. **`dat-utils`** (c01, c07) — the sentinel rule three slices share; smallest seam in the estate.
4. **`sql-objects` c01/c02** as dependency notes on `ord-maintain-ord200/201` when those are bound.
5. **`pro-interactive` + `pro-modules`** — new domain (PRO); bind after deciding the planted-bug question (c03) and the `XML`/`XSS` blind spot. `pro-cobol-pro201` is superseded by PRO200 — retire vs convert is a room call.
6. **`fam-maintain`** — only when ART is bound (its only consumers); decide c02 first.
7. **Defer / reject candidates:** `par-maintain` (make `PATH` configuration), `log-programs` (replace with target logging), `menu-cmd-shell` (navigation spec, not a slice), `srvpgm-supporting` (architecture notes; keep the 4 `unknown` surfaces).

## 6. Deferred / reject recommendations made in prose (no MANIFEST status changed)

`pro-interactive` split PRO203 or defer XML/XSS edges · `pro-cobol-pro201` retire · `fam-maintain` defer until ART bound, rename optional · `cou-maintain` split srvpgm from OPM screen · `par-maintain` PATH → configuration, PAR201 reject · `log-programs` defer whole slice, LOG100 reject · `dat-utils` defer `ISO_Num_To_Date` · `sql-objects` views as dependency notes, `ARTLSTDAT` defer · `menu-cmd-shell` reject as slice · `srvpgm-supporting` reject as slice.

## 7. Suspected blind spots

- **Functional:** two reports (menu 12/13, QM) and the log viewer (84) are outside the tree; the two IFS outputs of PRO (`Pur_Ord_*.xml`, `Goods to purchase_*.xml`) depend on `XML`/`XSS` whose format is unknown.
- **Build:** ARCAD/elias metadata (`iproj.json`, `.elias/`) decides how four programs bind; source alone cannot say.
- **Data:** reference tables (`PROVIDER`, `COUNTRY`, `FAMILLY`, `VATDEF`, `PARAMETER` beyond `PATH`) have no in-tree maintenance — how rows get there is unknown; `ARPURQTY` is never written.
- **Runtime:** every `inferred` row (21 / 268) is a box or build question; no IBM i available.

## 8. Explicit non-claims

- Did **not** bind, deepen Phase B, PACK, RECORD, test-gen, test-exec, or Convert. `AUTO_BIND: false`, `AUTO_ACCEPT: false` honoured. `ROOM_OK` not needed for this station and not claimed.
- Did **not** widen `atu-merlin-ts-cus-v1`; did **not** touch `modern/`, `architecture/`, `verification/`, `ATU_SRC/**`, or `master`.
- Did **not** re-scan the documented CUS / ORD slices as new work: `CUSSEQ` and `ART801` got a surface in `sql-objects` that points at the existing cards (`cus-interactive-c02`, `ord-trigger-ord700-c10`); `FCOUNTRY`, `FVAT`, `LOG`, `FPARAMETER` callers in CUS/ORD are cited as call sites only.
- No percentages, no "all slices found". Counts only.

## 9. completeness: incomplete

Human residual gate required. `estate_scan: partial` stays in APP_MANIFEST notes; **ESTATE_SCAN_INCOMPLETE** because the residual is now objects the tree does not contain, not unread members. Reading every member once is inventory coverage, not migration progress.

## 10. Bind which slice IDs today?

Candidates ready for a room bind (Phase A done, `CANDIDATES.md` + `SME_BRIEF.md` in place): the 12 slices from this run plus the 7 unbound from run 1 (`art-interactive`, `art-modules`, `ord-entry-ord101`, `ord-maintain-ord200/201/202`, `ord-print-ord500`). Suggested first batch: `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half). Then Ash runs the Pack B document conveyor on accepted slice IDs only.
