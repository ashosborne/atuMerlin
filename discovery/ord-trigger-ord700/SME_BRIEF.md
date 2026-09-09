# SME_BRIEF — ord-trigger-ord700 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`); 8/8 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 4). `c01` (trigger attachment on the box), `c08` (CULASTORD stale on delete) and `c11` (trigger vs reconciliation arithmetic) stay `needs-SME` (inferred) with no card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record (first convert vertical is CUS).

## What was documented

The database-side effects of every order write: `ORD700` (external `*AFTER` trigger program on `DETORD`, three registrations) keeps `ARTICLE.ARCUSQTY` in step with the ordered / outstanding quantity on insert, delete and update and logs deletions to the `SAMLOG` user space; `ORD701` (SQL `AFTER INSERT` trigger on `ORDER`) stamps `CUSTOMER.CULASTORD`. Plus the two boundary facts the bind accepted: `ORD100`'s `QTEMP` staging copy is created without triggers (`c09`), and `ART801` is the batch procedure that recomputes the same fields from scratch (`c10`, owned by the `sql-objects` seed). Cards live in `features/ord-trigger-ord700-c02.md` … `c07.md`, `c09.md`, `c10.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c02` — the **insert path adds the full `ODQTY`** and ignores `new.ODQTYLIV`; delete (`c03`), update (`c04`) and `ART801` (`c10`) all work in `ODQTY - ODQTYLIV`. In tree the only inserter is `ORD100` confirm with `ODQTYLIV = 0`, so the readings coincide today; the asymmetry is latent.
- `c03` — the deletion log line is `ORD700:Order Line deleted <ODORID> <ODLINE> article : <ODARID> quantity : <ODQTY>` wrapped by `LOG300` as `User: … * Date: … * Msg: … ***` and appended to `SAMLOG` with no size check or wrap. The message carries `ODQTY`, not the outstanding quantity actually subtracted. The log call is `callp(e)` with `%error` never read; the quantity update runs regardless. **Delete is the only event that logs.** The only in-tree deleter (`ORD101` option `4`) refuses lines with `ODQTYLIV > 0`. **How `AddLogEntry` is bound is not in source** (no `bnddir` on the H-spec, `LOG` absent from `SAMPLE.BNDDIR`, no `ORD700.ILEPGM`).
- `c04` — the in-tree writers that reach the update trigger are `ORD101` line edit, `ORD200`/`ORD201` option `8` "deliver" (sets `ODQTYLIV = ODQTY` → `ARCUSQTY -= ODQTY` per undelivered line; partially delivered lines are skipped by the writer) and `ORD901`'s `ODYEAR` backfill (fires, nets to zero). **No in-tree writer changes `ODARID` on an existing row**, so the article-changed branch has no in-tree caller. **Order close (option `7`) updates `ORDER` only and never reaches `ORD700`** — this is the observed fact behind `c11`.
- `c05` — `UpdArt` does no sign or bound checks, ignores `ARDEL`, does not stamp `ARMOD`/`ARMODID`, and has no `(e)` extender on `chain`/`update`: a record lock or overflow inside the trigger is an unhandled exception that lands on the writer's I/O (none of the writers monitor it). `ARCUSQTY` can go negative.
- `c06` — `%parms = 0` is the only path that sets `*inlr`; after a real trigger call the program (and `ARTICLE1`) stays active. `TTIME`, `CMTLCK`, null maps, lengths and `PARM2` are never read; no `other` branch. `dftactgrp(*no)` without `actgrp` — the activation group is a compile-time choice not in source.
- `c07` — `ORD701` **assigns** `n.ordate` (no `MAX`), so a back-dated insert moves `CULASTORD` backwards; unknown customer → 0 rows silently; soft-deleted customer updated; `CUMOD`/`CUMODID` untouched. Fires once at `ORD100` confirm **before** the lines are written (no commitment control). `CUS300`'s `GetCusLastOrdDate` getter exists only as commented-out source.
- `c09` — the real `DETORD` is opened output-only in `ORD100`, so update/delete triggers are reachable only from `ORD101`, `ORD200`, `ORD201`, `ORD901`. Abandoned orders leave no trigger footprint.
- `c10` — every `ART801` `UPDATE` is guarded by `WHERE EXISTS`, so **articles with no open lines and customers with no open orders keep their previous values** despite the menu label "Reset Summary Fields". `CUCREDIT` has no incremental maintainer anywhere in `ATU_SRC` — `ART801` is its only writer. `ART801` uses plain SQL `UPDATE`s on `ARTICLE`/`CUSTOMER`, so no trigger fires during reconciliation. Option 81 (`ORD901`) rewrites `CULASTORD` with the identical statement.
- Evidence corrections to Phase A: `ORD701` body is `ORD701.SQLTRG:5-16` (Phase A `:4-14`); menu option 82 is `SAMMNU.MENU:151-154` (Phase A `:152-155`); `ART801` `CULASTORD` statement is `:34-37` (Phase A `:33-36`).

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c02`–`c07`, `c09`, `c10`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c01` Are `ORD700_DETORD_ARTICLE_{INSERT,DELETE,UPDATE}` and `ORD701_Insert_order` attached on the reference box (`DSPFD DETORD` / `ORDER`)? Every other line in this brief assumes yes.
- [ ] `c02` vs `c03`/`c04`/`c10`: is `ARCUSQTY` "ordered" or "outstanding"? The insert path says ordered; everything else says outstanding.
- [ ] `c11` `ARCUSQTY` is not reduced when an order is closed (option `7`) without delivery, while `ART801` excludes closed orders — verify with data whether the two paths diverge in practice; accepted drift or defect?
- [ ] `c03` Is the `SAMLOG` deletion log an observable a target must preserve (menu option 84 `ADSPUSRSPC SAMLOG`, command not in tree)? Is anyone reading it?
- [ ] `c03`/`c06` Build owner: how is `AddLogEntry` (`LOG` service program) bound into `ORD700`, and what `ACTGRP` does `ORD700` run in?
- [ ] `c05` Silent no-op on unknown article / zero delta, possible negative `ARCUSQTY`, unhandled lock/overflow inside the trigger — accepted failure modes today?
- [ ] `c07` `CULASTORD` assigned unconditionally (not `MAX`) — acceptable given only `ORD100` inserts today? `c08` no update/delete trigger on `ORDER` — accepted drift until `ART801`/`ORD901` run?
- [ ] `c10` "Reset Summary Fields" leaves rows without qualifying open orders untouched — intended? How often is option 82 run, and is `CUCREDIT` relied upon between runs (`CUS200D`/`CUS250D` display it; `ORD100` does not check it)?
- [ ] `c09` Confirm that no path other than the four in-tree writers (plus SQL/DFU) writes production `DETORD` or `ORDER` with triggers active.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-trigger-ord700`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c01` trigger attachment on the box (inferred; runtime).
2. `c08` `CULASTORD` stale after out-of-tree deletes / date shifts (inferred).
3. `c11` trigger vs reconciliation arithmetic (inferred; data check).
4. `c03` `SAMLOG` as an observable; `AddLogEntry` binding (build).
5. `c05` silent skips, negative values, unhandled exceptions.
6. `c06` compile-time `ACTGRP` / bind directory.
7. `c07` unconditional `CULASTORD` assignment.
8. `c10` `WHERE EXISTS` semantics of "Reset"; run cadence; `CUCREDIT` reliance.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Incremental (`c02`–`c04`) vs batch (`c10`) maintenance of the same fields | Both documented as separate cards here; `c10` is a related-surface card, the `ART801` object stays with the `sql-objects` seed. Phase A's "one rule card with two implementation notes" was not adopted by the bind; the facts are cross-referenced instead. |
| `ORD701` placement | Kept here (order-write side effect) although it touches `CUSTOMER`. |
| `AddLogEntry` / `SAMLOG` | Dependency on `log-programs` seed (unscanned); `LOG300` read only to state what the log line contains. |
| Writer programs (`ORD100/101/200/201/901`) | Cited as firing call sites only; their slices are not deepened here (`ord-entry-ord100` documented run 3; others unbound / deferred). |
| Merging into ORD writer slices | Refused per bind ("keep separate from ORD writers"). |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, or edit `ATU_SRC/**`.
