# SME_BRIEF — ord-maintain-ord201 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room ORD bind, `BIND.md`; `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`); 11/11 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 10). No `inferred` candidates in this slice; nothing left needs-SME for lack of a card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record — the ORD Architecture pack is a **new** pack, drafted after the five ORD slices are carded, and never widens `atu-merlin-ts-cus-v1`.

## What was documented

The "all orders" seam: `ORD201` (menu option 3) lists every order that has a customer row, paged from the `ORDERCUS` view, and offers the order lifecycle — create (`F6` → `ORD100C2`), edit lines (`2` → `ORD101`, **working here**), delete (`4`, lines first), display (`5` → `ORD202`), print (`6` → `ORD500`), close (`7`), deliver (`8`) — with the option guards that gate them, plus `F5` refresh and `PAGEDOWN`. Cards live in `features/ord-maintain-ord201-c01.md` … `c11.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

The twin relationship was handled as the bind decided (separate slices): `7`/`8` are **byte-identical** to `ORD200` (diff-verified on both the guard and the action ranges), so `c06` cross-references `ord-maintain-ord200-c06`/`c07` for the rule detail instead of duplicating them. Every divergence is carded from the `ORD201` side.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c01` — **the page is 7 two-line rows, not 14.** `SFLPAG(7)`; each `SFL01` record spans rows 7–8 (order data on line 1, customer id/name on line 2). 14 is the fetch batch per `PAGEDOWN`. `F11` (`SFLDROP(CF11)`, labelled `F11=Detail`) drops the customer line and is handled entirely by the display — the program has no indicator for it.
- `c01` — **"all orders" means all orders with a `CUSTOMER` row.** `ORDERCUS` is an inner join (the "ORDERCUS join" planted defect — as-is). Sort has the `orid desc` tie-breaker `ORD200` lacks. Inferred from DB2 for i NULL ordering: a single order with an invalid `ORDATE` anywhere in the estate would sort first, fail the first fetch with `-305`, and leave the whole list **empty with no message** (`ORD200` would show that only for the one customer).
- `c07` — **option `3` is dead and sticky.** It passes every guard, falls into `s01act`'s empty `other` branch, and because that branch does not `update sfl01` the row keeps its changed flag: the `3` stays typed and is re-read on every subsequent Enter until the user blanks it. `ORD200` rejects `3`. A diff of `s01chk` against `ORD200` shows exactly two differing lines — this one and the parentheses on the `2`/`4` guard (`c03`).
- `c07` — **options typed before a `PAGEDOWN` survive** (the load only appends rows; no `SFLCLR`) and execute on the next Enter, possibly pages later. `F5`/`F6` discard them. One refused row still cancels every action on the pass; valid options stay typed.
- `c03` — **`ORD201` is the only working path to `ORD101` in the estate** (correct parentheses at line 191; `ORD200:187` refuses every `2`). No reload after return, so the `Value` column is stale until `F5`/`F6`. A delivered-but-open order is editable (`ORD101` has no state test).
- `c04` — **delete blanks only the order number and year**; date, value, delivery/close and customer stay on the row. The blanking is cosmetic, not a guard: `4` again is a silent no-op, `5`/`6` call the callee with order `0`, `7`/`8` chain-miss and `update forde` without a lock → unmonitored exception (same as `ORD200`'s ghost row). Lines-first means a header lock held by an open `ORD101` session fails the delete **after** the lines are gone — header with no lines (`ORD200`: orphan lines).
- `c06` — sharpening that applies to **both twins**: `ORD700U` is `TRGUPDCND(*CHANGE)`, so a zero-quantity line rewritten unchanged by `8` does not invoke the trigger at all (the `ORD200-c07` card says "zero delta"; same observable, no trigger call). The `ORD200` card was not edited by this run.
- `c02` — `F6` → `ORD100C2` (no parameter; customer chosen inside `ORD100`); the list is rebuilt from row 1 even after a cancelled create and the user's page is lost.
- `c08` — `F5` is the only in-program way to re-read displayed rows and the antidote to the stale screen-copy guards; `ORD200` enables `CA05` but never handles it.
- `c09` — only caller is `SAMMNU` option 3; its `help=` points at `cus200`; `F3` = `F12`; panel id literal `'ORD200-1'` is the twin's. Activation group inferred `QILE`.
- `c10` — `CUSTOME1` and `ARTICLE1` are dead declarations here (`ORD200` chains `CUSTOME1` once and does not declare `ARTICLE1`); the objects must still exist for the program to open.
- `c11` — `pnl00` closes the cursor because the program pages; inferred: an abnormal end leaves `c1` open in the activation group and the next call in the same job would show an empty list (`-502` on `open`).

Phase A statements corrected: "14 rows per page" (`c01`, CANDIDATES/SME_BRIEF) → 7 two-line rows per page, 14 per fetch. No Phase A statement was wrong about a rule; the sticky `3`, the `PAGEDOWN`-surviving options, the inner-join scope, the two-line row, `F11` and the partial blanking were missing.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c11`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c03` / `c04` (with `ord-maintain-ord200-c09` / `c13`): `ORD201` is the working twin for edit and the lines-first twin for delete — **which twin is the parity reference for the target list?** (Room decision; recorded, not decided here.)
- [ ] `c07` dead sticky option `3` — meant to be something (copy? release?)? One rule for the target (`ORD200` rejects it)?
- [ ] `c07` options surviving a `PAGEDOWN` and executing later; one refused row cancels the whole pass — known to users? Keep?
- [ ] `c04` no confirmation before delete; header-left-without-lines residue on a header lock — carry forward?
- [ ] `c01` inner-join definition of "all orders" — intended for the target, or should orphaned orders be visible somewhere?
- [ ] `c01` (inferred) invalid `ORDATE` anywhere → empty list — confirm on the box; known?
- [ ] `c06` (owned by `ord-maintain-ord200-c06`/`c07`/`c08`) close-vs-deliver semantics, partial lines, `Invalid Option` wording, stale screen-copy guards — one answer covers both twins; `TRGUPDCND(*CHANGE)` sharpening noted.
- [ ] `c09` / `c11` activation group and `CLOSQLCSR` (build owner); `c11` cursor-left-open inference.
- [ ] `c09` help mis-mapping and shared panel id `ORD200-1` — cosmetic; accept as recorded.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-maintain-ord201`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c03` / `c04` parity twin for edit and delete (with `ord-maintain-ord200-c09` / `c13`).
2. `c07` dead sticky option `3`.
3. `c07` options surviving `PAGEDOWN`; whole-pass cancellation.
4. `c04` no confirmation; header-without-lines residue.
5. `c01` inner-join scope of "all orders".
6. `c01` (inferred) NULL `ORDATE` sorts first → empty list.
7. `c06` pointers to the `ORD200` close/deliver questions; `*CHANGE` trigger sharpening.
8. `c09` / `c11` activation group, `CLOSQLCSR`, cursor-left-open inference.
9. `c09` help map and panel id (cosmetic).
10. `c01` page geometry corrected; truncated-form page size runtime-confirmable.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| `ORD200` vs `ORD201` | Separate slices (charter). `7`/`8` detail owned by `ord-maintain-ord200-c06`/`c07`; this slice's `c06` cross-references them (diff-verified identical). Divergences (`c01`, `c03`, `c04`, `c07`, `c08`, `c10`, `c11`) carded here. |
| Which twin is the "reference" behaviour | Not decided by the bind; carried as needs-SME / room question (`c03`, `c04`). Phase A recommended `ORD201` (menu-reachable, guard correct). |
| Create path (`c02`) | Edge only; `ORD100C2` / `ORD100` belong to `ord-entry-ord100` (documented). |
| Line maintenance (`c03`) | Edge only; `ORD101` belongs to `ord-entry-ord101` (documented). |
| Display / print (`c05`) | Edges only; `ORD202` / `ORD500` bound and queued — their ghost-`orid` handling is a pointer for those runs. |
| Trigger effects (`c04`, `c06`) | `ORD700` deltas cited from `ord-trigger-ord700` (documented). |
| View / UDF / menu (`c01`, `c09`) | `ORDERCUS`, `ISOTODATE40`, `SAMMNU` cited only (`sql-objects`, `dat-utils`, `menu-cmd-shell`). |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any planted defect, edit any `ORD200` card, or edit `ATU_SRC/**`.
