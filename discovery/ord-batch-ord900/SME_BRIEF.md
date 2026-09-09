# SME_BRIEF — ord-batch-ord900 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-09 (night residual wave — Ash authorized, Field recorded; `BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`); 9/9 accepted candidates documented by the Pack B conveyor on 2026-09-09 (run 18). The one `inferred` row (`c07`, purpose = sample-data refresh) is carded with its confidence kept — the menu wording, blank `%TEXT`, ARCAD-generated data-area source and absence of parameters / scheduling / logging are exact; the conclusion is a reading the room must confirm. Two programs, 11 and 52 lines, read in full.

## What was documented

Two menu-invoked utilities. `ORD900` sets data area `LASTORDNO` to `MAX(ORID)` (`c01`). `ORD901` exits if there are no orders (`c02`), shifts every order's dates by one offset so the newest order is dated today (`c03`), derives delivery / close dates with a hidden 10-day auto-close rule (`c04`), then resyncs `DETORD.ODYEAR` and `CUSTOMER.CULASTORD` with two SQL `UPDATE`s (`c05`) — all as a whole-file rewrite without commitment control or error handling (`c06`). Plus three cards about the programs rather than the data: purpose (`c07`, inferred), the absence of scheduling / parameters (`c08`), and the `lastdate` variable-reuse trap (`c09`).

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c01` — **empty file writes 0, it does not fail.** `READP` at BOF leaves the input field at its initial zero; `LASTORDNO` becomes 0 and the next `ORD100` confirm allocates order 1. `ORD900` stores *last used*, the same contract `ORD100` reads (`IN *LOCK`, `+1`, `OUT`). Only two programs touch the data area. No lock between the `READP` and the `IN *LOCK` (theoretical race → duplicate key on `ORDER1`).
- `c02` — **the guard works through an error path.** No indicator variable, no `sqlcod` test anywhere in `ORD901`: on an empty file `MAX` is `NULL`, the `INTO` fails with `-305`, the host variable keeps its initial 0, and `if lastdate = 0` exits. Any other `SELECT` failure exits the same silent way.
- `c03` — **one offset for the whole file, sign from the data.** `days = today − MAX(ORDATE)`; negative if the newest order is in the future (moves everything backwards, no guard). Same-day rerun is a no-op rewrite. `ORDATE = 0` / malformed → `RNQ0112`, unhandled, stops mid-file. **Rerun after a partial run re-shifts the done rows** when the newest order was not among them. `ORYEAR` recomputed from the shifted date. `ORDER3.LF` (`K ORDATE`) has no reader.
- `c04` — **the 10-day rule and a state no screen can produce.** Open order with `ORDATDEL < today − 10` → `ORDATCLO = ORDATDEL + 10` (strict boundary; exactly 10 days stays open). Future guards zero both dates independently and the closed branch does not re-check delivery, so `ORDATCLO > 0, ORDATDEL = 0` is reachable here and nowhere else (the interactive close always sets both). Closing changes `ART801`'s / `ORD700`'s open set but `ARCUSQTY` / `CUCREDIT` are **not** recomputed; nothing sequences option 81 → 82.
- `c05` — **`ORD901` is the estate's only writer of `DETORD.ODYEAR`** (`ORD100` writes 0; no other assignment, no reader — grep). Differential update, correlated on `ORID` only; orphan lines skipped; each changed line fires `ORD700U` → `UpdArt(0)` → return. The `CULASTORD` statement is **character-for-character `ART801:35-37`**; `ORD701` assigns the inserted date instead of `MAX`. No `COMMIT`, no handler.
- `c06` — **commitment stance is half explicit.** Native `UF E DISK` without `COMMIT` = none; SQL side has no `SET OPTION COMMIT` (only `ART200:332` and `ART801`'s header set it in the whole tree), so the precompiler default at build applies — build options are not in the tree (`iproj.json` → `elias compile`). Under `*CHG` with unjournaled files the tail fails (`SQL7008`) after the loop already ran. No `MONITOR` / `(E)` / `WHENEVER` / `*PSSR`. Interactive job, record lock per row, no `ALCOBJ`.
- `c07` — **exact facts behind the inference:** Utilities group with "Reset …" texts; `%TEXT` blank on exactly `ORD900`, `ORD901`, `ART801` (+ `ORD700`, `PRO203`) while the other 33 `QRPGLESRC` members carry one; `LASTORDNO.DTAARA` is ARCAD-generated with a snapshot `VALUE(60719)`; `iproj.json` says `AdrianAtArcad`. The ORD pack already lists all three as not converted (consistent, not proof).
- `c08` — **nothing but the menu.** No CL wrapper, no command, no `SBMJOB` / `ADDJOBSCDE` (the only job string is `F14 = wrksbmjob`), no `*ENTRY` / `PI` in either program, no `AddLogEntry`. "Today" is the job date — `CHGJOB DATE` is the operator's only knob.
- `c09` — **`lastdate` has two meanings; `%days(10)` appears twice.** Newest order date at `:11-17`, `today − 10` from `:18`, consumed at `:34`. Read literally, `:34` is a different rule. `:18` must stay between `:17` and the loop. The two `10`s are one parameter (the only two occurrences in the tree).

Phase A statements corrected: `c01` "readp fails/undefined" → sharpened to "writes 0" (the `READP` does not fail). Sharpened: all nine as above. Nothing Phase A said about a valid operation was wrong.

**Existing target counterparts (not widened here):** `modern/db/schema.sql:59-61` defines the `lastordno` sequence that replaces the data area; `modern/README.md:210,287,379,405` records `ODYEAR = 0` as preserved ("only the deferred ORD901 backfills it") and lists `ORD900` / `ORD901` / `ART801` under not-converted residual. None of the packs was read beyond those citations or touched.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c09`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggested: `c01` `ORD900.PGM.RPGLE:6-10` + `ORDER1.LF:4-6`; `c04` `ORD901.PGM.SQLRPGLE:18,33-36`; `c05` `ORD901:46-50` vs `ART801.SQLPRC:35-37`).
- [ ] **Room / product owner — `c07` (Phase A Q1, the slice's main question):** are `ORD900` / `ORD901` / `ART801` run against real data, or only to refresh the Arcad sample between demonstrations? `DSPOBJD` last-used dates and `WRKJOBSCDE` (`c08`) would settle it. If sample-only → **defer the slice from conversion scope** (recommendation unchanged from Phase A; cards stay as the record of what the tooling does).
- [ ] **Room (ORD pack) — `c04` (Phase A Q2):** the 10-day auto-close rule — business rule or sample convenience? Exists only in `ORD901`. If business, the target does not implement it.
- [ ] **Room (ORD pack) / ops — `c04` / `c05`:** `ORD901` can close orders but leaves `ARCUSQTY` / `CUCREDIT` stale until option 82. Confirm the target's as-is stance for the interactive close (`ord-trigger-ord700`) covers `ORD901`'s closes, or that the utility is out of scope. Does anyone run 81 then 82?
- [ ] **Room (ORD pack) — `c05`:** `CULASTORD = MAX(ORDATE)` twice (`ORD901`, `ART801`), once differently (`ORD701` assigns). Fold into one rule or keep? Is `DETORD.ODYEAR` needed in the target at all (only writer is this utility; no reader)?
- [ ] **Source owner — `c06` / `c02`:** `PRTSQLINF ORD901` — `COMMIT` option at build; whether `from order` undelimited (`:11,43,45`) compiled as-is. Two facts from one command.
- [ ] **Room (ORD pack) — `c06`:** if a target counterpart exists, atomic-or-not explicitly; as-is is three independent parts, rerun unsafe after a mid-loop failure (double shift + zeroed dates).
- [ ] **Room (ORD pack) — `c01`:** operator "reset sequence to `MAX(id)`" wanted in the target, or does `ORD900` fall with `c07`?
- [ ] **Ops / source owner — `c08`:** `WRKJOBSCDE` / external scheduler — anything scheduling `ORD901` or `ART801`?
- [ ] `c09` — note for ME only (no decision): if converted, separate `newestOrderDate` from `autoCloseThreshold`, hoist the `10`.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks nothing downstream unless the room reverses the "defer from conversion scope" recommendation.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. Room / product owner: real batch or sample refresh? (`c07`, informs all)
2. Room (ORD): 10-day auto-close — business rule? (`c04`)
3. Room / ops (ORD): stale `ARCUSQTY` / `CUCREDIT` after `ORD901` closes; 81 → 82 sequence. (`c04`, `c05`)
4. Room (ORD): fold `CULASTORD` rule; is `ODYEAR` needed? (`c05`)
5. Source owner: `PRTSQLINF ORD901` — `COMMIT` option, undelimited `order`. (`c06`, `c02`)
6. Room (ORD): atomic target or as-is? (`c06`)
7. Room (ORD): sequence-reset operator action? (`c01`)
8. Ops: `WRKJOBSCDE`. (`c08`)

Did not: bind, generate tests, convert, read or touch any Architecture pack beyond the read-only `schema.sql` / `README.md` citations, edit `ATU_SRC/**`, or document `ART801` / `ORD700` / `ORD100` / `ORD200` / `ORD201` behaviour (their members are cited as neighbours — the duplicated statement, the trigger path, the other writers of the same fields — via their existing cards).
