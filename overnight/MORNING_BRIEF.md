# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 17 · 2026-09-09 21:19 – 22:1x UTC (22:19–23:1x Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `30dd3d2` (the RUN tip itself)
Previous briefs preserved in git: Pack B run 16 at `369065b:overnight/MORNING_BRIEF.md`; run 15 at `22eab31`; run 14 at `b8feaf9`; run 13 at `0de4efa`; run 12 at `ee67225`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`sql-objects`** (job preference; fifth of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, Ash authorized, Field recorded). The five SQL-defined objects: `ORDERCUS` (view — the read contract of both order lists), `ARTLSTDAT` (view — no in-tree reader), `ARTIINF` (table — article free text, the only SQL table in the estate), `CUSSEQ` (sequence — customer ids), `ART801` (procedure — batch resync of the three summary fields). 5 surfaces, 10 candidates, **all accepted** by the bind (9 `observed-in-code`, 1 `inferred`). Two rows are object-surface cards for behaviours already documented (`c07` → `cus-interactive-c02`, `c08` → `ord-trigger-ord700-c10`): they document the DDL contract, resolution and callers and point at the existing cards — CUS / ORD not widened.

## 2. Cards written / needs-SME left

- **10 / 10** accepted behaviours now have as-is cards: `discovery/sql-objects/features/sql-objects-c01.md` … `c10.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 10 `documented`; `c04` keeps `confidence: inferred` on its card (the view and the menu line are source; the QM query `ARTQRY` is not in the tree — run-13/14/15/16 practice).
- **0** candidates left without a card (the bind held nothing back); **0** `blocked`. Auto-accept policy not exercised.
- **11 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - **`c01` / `c02` — room (ORD pack), confirm two definitions the ORD conversion already preserved:** `ORDERCUS` is an inner join — an order whose customer row is missing is listed **nowhere** in the estate; the only in-tree way to reach that state is `ORD100` accepting an unchecked `ORCUID` (no program deletes a `CUSTOMER` row, nothing writes `CUDEL`). `TOTVAL` sums `ODTOTVAT` — the list total is **gross**, and it is the same field `ART801` sums into `CUCREDIT`. Nothing on the screens says either.
  - **`c04` (`inferred`) — source owner, one retrieval:** `RTVQMQRY ARTQRY` (+ form, + `CUSQRY` / `CUSQRYFMT`). `ARTLSTDAT` appears once in the tree (its DDL); menu option 13 runs `STRQMQRY QMQRY(ARTQRY)` with **no `QMFORM`** where option 12 has one. Until the query is seen, the view's purpose is the menu text and nothing else.
  - **`c05` — `art-*` owner (when ART is bound) / room (data):** `ART200` treats *any* `sqlcod <> 0` on the `ARTIINF` read as "no row" and then `INSERT`s; if the row exists the insert fails on the primary key and **the failure is unchecked — the edit is silently lost**. `ARTIINF` is `CCSID 297` on both columns — the only explicit data-column CCSID in the estate (`SAMMSGF` is 297 too). `ART200` uses the long column names, `ART302` the short ones.
  - **`c07` — room (CUS pack):** `CUID` is `5P 0`, `CUSSEQ` has `NO MAXVALUE` — value 100 000 (the 98 450th) overflows the host variable and `CUS200` does not test `sqlcod` after the `SET`. Theoretical today; a note for the CUS pack's next version (`MAXVALUE 99999` or a wider column).
  - **`c08` / `c09` — ops / room (ORD pack):** who runs menu option 82 and when? `ART801` runs with `COMMIT = *NONE` and no handler, so a failure in statement 2 or 3 leaves statement 1 applied; recommendation: make the target reset atomic. `ORD901` re-implements `ART801`'s `CULASTORD` statement inline instead of calling it (`ord-batch-ord900`, next in queue).
  - **`c10` — ME:** `"ORDER"` is delimited ten times (eight in `QSQLSRC`, two in `ORD901`) and written **undelimited three times in `ORD901`** (`:11,43,45`) — flag as a compile-time check for `ord-batch-ord900`; keep the `LABEL ON` texts as `COMMENT ON`, drop the positional 20-character headings, canonicalise `ARTIINF` on its long names when the ART pack is drafted.
- **Phase A corrected:** nothing. **Sharpened:** `c01` (`CUSTOME1` `UNIQUE` → no duplication; no `CUDEL` / `ORDATCLO` filter; orphan cause; `11Y 2` host-variable cliff), `c02` (same field as `CUCREDIT`; no VAT label on screen), `c03` (join on `ORID` only like `ART801`; `QUANTITY` ≠ `ARCUSQTY` by design; soft-deleted included / never-ordered excluded; orphan lines counted by `ORDERCUS` but not here; labels copy `SAMREF` incl. `DESCRPTION`), `c04` (option 12 vs 13 `QMFORM`; no QM source dir), `c05` (long vs short names; `TRIM` both ends; `1520A CHECK(LC)` = 19 × 80; lost-edit path; only `SET OPTION` in `QRPGLESRC`), `c06` (option 4 is `ardel = 'X'` + `update farti`; text still editable via `ARTICLE2` with no S/O; estate record deletes enumerated), `c07` (5-digit cliff; `*LIBL` resolution; cache gaps), `c08` (`SPECIFIC` = program name → CL `CALL`; SQL name unused; `QSQLSRC` census), `c09` (13 clauses tabulated; statement 3 has no `DETORD` join), `c10` (counts; `ORD901` mixed spelling; `PRIM_ARTIINF` only named constraint; `%METADATA` headers hold the object texts, `ART801`'s blank).
- Pointer-only observations left for other slices (not deepened): `ART200` / `ART302` / `ART250` cited for the `ARTIINF` statements and the option-4 soft delete only (held; "Never invent ART302" respected); `ORD901` cited for its duplicated statement and its `order` spelling only (`ord-batch-ord900`, queue); `ORD100` / `ORD101` cited for `odtotvat = odtot + vat` and the absence of an `ExistCus` check via their existing cards. No card outside `discovery/sql-objects/` edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/sql-objects/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. The note lists the catalog / SQL checks an SME would run instead (`QSYS2.SYSVIEWS` / `SYSCOLUMNS` types and labels; the orphan-order count behind `ORDERCUS`; `TOTVAL ≥ 10^9`; `ARTLSTDAT.QUANTITY` vs `ARCUSQTY`; `RTVQMQRY ARTQRY`; `ARTIINF` CCSID and orphan / soft-deleted texts; `SYSSEQUENCES` for `CUSSEQ`; `SYSROUTINES` / `DSPOBJD ART801`; one deliberate failure of `ART801` statement 2; whether `ORD901`'s undelimited `order` compiles).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice sql-objects`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 154 | **164** (+10 `sql-objects`) |
| behaviours `candidate` | 107 | 97 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 37 / 24 / 3 / 7 | **42** / 19 / 3 / 7 (`view:ORDERCUS`, `view:ARTLSTDAT`, `table:ARTIINF`, `seq:CUSSEQ`, `sqlprc:ART801` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `sql-objects`: 5 surfaces, 10 behaviours, **10 documented**.
- **Bind mirror (cap 1):** only `sql-objects` was mirrored this run. The other five night-wave slices (`ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive`, `pro-modules`, `pro-cobol-pro201`) read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` (or `deferred`) in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–16.
- `docs/estate/INDEX.md`: row 27 `sql-objects` → **done** with the headline findings; header line notes run 17.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 16).

## 5. Remaining accepted undocumenteds (queue for next run)

Five accepted and undocumented; **two runnable** under the run-17 job header (cap 1 per run; Ash sets `overnight/AGENT_JOB.md` line 1 back to `RUN` each time):

1. `ord-batch-ord900` (9; `ORD900` / `ORD901` — note `sql-objects-c08` / `-c10`: `ORD901` duplicates `ART801` statement 3 and writes `from order` undelimited at `:11,43,45`)
2. `cou-maintain` COU200 half (`c01`–`c06`, `c13`; FCOUNTRY half already documented in run 7)

**Room-held by the job header ("Hold: pro-interactive, pro-modules, pro-cobol-pro201")** — accepted in the bind record, not to be run until the header releases them: `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes; `c07` / `c12` outputs cannot get past "file written to `PATH`" until `XML` / `XSS` are seen — `srvpgm-supporting-c02`), `pro-modules` (14), `pro-cobol-pro201` (10).

Still held per the bind record and the job header: `art-interactive`, `art-modules` (wait `ART302` / SME — `sql-objects-c05` / `c06` now give the ART pack its table contract and two as-is defects to decide on), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `par-maintain`, `log-programs`, `menu-cmd-shell`, `srvpgm-supporting`, and now `sql-objects`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted, read or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1` and the five residual packs untouched; `modern/db/schema.sql` and `modern/src/features/{order,customer}/*` cited read-only as the existing as-is counterparts of `ORDERCUS` / `CUSSEQ` — no line of `modern/` or `verification/` changed). Convert / Verify are different stations with their own `ROOM_OK` gates, which this run neither needs nor consumes.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). ART / PRO / ORD901 members were cited for the `ARTIINF`, `"ORDER"` and `CUSSEQ` statements only — their slices were not deepened.
- Did **not** fix any found defect (lost-edit path in `ART200`, unbounded `CUSSEQ` into `5P 0`, `ORD901`'s undelimited `order`, `ARTIINF` orphans, `SAMREF` typo) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `sql-objects-cNN` (same decision as runs 1–16; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- One `inferred` row (`c04`) was bound `accepted` (not held as needs-SME); carded with the confidence kept and the source/out-of-tree split stated, as runs 13–16 did. If the room prefers `inferred` rows to stay card-less, the card can be withdrawn — flagged, not decided here.
- `c07` and `c08` were bound as "pointer" rows (Phase A: "surfaces for behaviours already carded"). They received full-shape cards about the **object** (DDL contract, resolution, callers, port traps) and explicitly defer the **behaviour** to `cus-interactive-c02` / `ord-trigger-ord700-c10`; the new facts on them (`5P 0` cliff; `SPECIFIC` = program name; `ORD901` duplicate) are about the object, not the behaviour. If the room wanted literal one-line pointers instead, the cards can be trimmed — flagged.
- Several statements are DB2 for i semantics rather than source, each flagged inference / catalog-confirmable on the card and in `needs_sme`: `SUM` result precision and `DECRESULT`; `*LIBL` / `*SYS` naming resolution; `LABEL ON` heading segments; `CREATE SEQUENCE` defaults and non-rollback of `NEXT VALUE`; `SPECIFIC` name = program object; error propagation without a handler; `FOR COLUMN` dual naming; host-variable overflow behaviour.
- **Single run this time.** The RUN tip (`30dd3d2`) fired exactly one run; the only other automation entry was a NOT_YET_STARTED stub from the 20:14Z DONE push that never started. Checked before the first write, and `origin` re-fetched before the first commit and before the push.
- The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-process-455f`) checked out at the trigger commit; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before any write.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Five accepted slices are still undocumented (two runnable, three `pro-*` room-held — queue above); the estate scan is partial (`overnight/METHOD_COVERAGE.md` — the QM queries `ARTQRY` / `CUSQRY` remain the report-side blind spot, now with the sharper fact that `ARTLSTDAT` has no other possible reader); ART slices unbound pending ART302; `fam-maintain` held; seventeen `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 back to `RUN` (job header should prefer `ord-batch-ord900` next, then `cou-maintain` COU200 half) — one slice per run, two runnable, three `pro-*` room-held. A Pack B run takes ~40–60 minutes; **any push to the branch while line 1 is `RUN` fires another run on the same slice** — this run was clean, but the pattern from runs 13–16 stands. Cheapest protection: push operator / ME / room artefacts only while line 1 reads `DONE`. **Source owner (one retrieval):** `RTVQMQRY ARTQRY` + `RTVQMQRY CUSQRY` + `RTVQMFORM CUSQRYFMT` into the allowlist — turns `sql-objects-c04` from inferred to observed and closes the report blind spot. **Room (ORD pack, two yes/no):** orphan orders stay hidden (`c01`)? list total stays gross (`c02`)? Both already implemented as-is in `modern/`; this only records the decision. **ME:** when the ART pack is drafted, `sql-objects-c05` / `c06` / `c10` are its `ARTIINF` contract — long names canonical, `CCSID 297` mapping, lost-edit path and orphan text as recorded as-is defects.
