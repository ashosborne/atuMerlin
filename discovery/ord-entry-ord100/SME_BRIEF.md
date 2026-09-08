# SME_BRIEF — ord-entry-ord100 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`); 12/12 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 3). `c09` (CRTORD command facade) and `c11` (trigger side effects pointer) stay `needs-SME` (inferred) with no card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record (first convert vertical is CUS).

## What was documented

The "create a new order" seam: customer chosen (parameter or `SltCustomer` prompt), lines staged in a `QTEMP` copy of `DETORD` (constraints and triggers off), confirm (`F8`) allocates the number from `LASTORDNO` and writes `ORDER` + renumbered `DETORD` rows, then prints via `ORD500` and shows an acknowledgement window. Cards live in `features/ord-entry-ord100-c01.md` … `c08.md`, `c10.md`, `c12.md`, `c13.md`, `c14.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). `ORD100C` and `ORD100C2` are covered by one card (`c02`) as recommended at Phase A.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c01` — after the customer is known the program starts **directly in the add-line panel** (`panel = 2`, `create` forced on), so `SltArticle` is prompted before the list is ever shown. Any non-zero customer id is accepted as given (no `ExistCus` / `IsCusDeleted`). The mainline is driven by the RPG cycle (no loop) until `*inlr`.
- `c03` — **after `F6`, cancelling the article prompt re-prompts until an article is chosen** (`s01key` left `step01 = key` and indicator 06 is still on). **`F3`/`F12` on the add-line screen reached via `F6` end the whole program** (the indicators propagate to `s01key`), silently abandoning the staged order; the same keys on the first-pass add screen or the edit screen return to the list. A cancelled prompt still increments the line counter and calls the getters with a blank id.
- `c04` — **correction:** there is no "F27". Indicator 27 is `CHANGE(27)` on `FMT02`; Enter with a modified qty/price recomputes and redisplays, Enter unmodified saves. Footer `TOT`/`TOTVAT` are **not** refreshed after an edit until `F5` or the next add reloads the list. Option `2` on an already-deleted row would update without a prior read (runtime exception expected).
- `c05` — `ODTOTVAT` is **not a subfile field**, so `totvat -= odtotvat` subtracts a stale program value (usually the last loaded row's); `TOTVAT` drifts after deletes; `TOT` is correct. Deleted rows stay in the subfile (blank, `**** Delete ***`) and can be selected again. Consecutive `4`s are processed in one pass.
- `c06` — both checks run per changed row, so 35 and 36 can be on together; `F8` on an empty list passes; indicators 35/36 are never reset in code (persistence depends on INDARA refill semantics — runtime).
- `c07` — **`DETORD.ODYEAR` is never assigned by `ORD100` and is written as `0`** (also `ODQTYLIV = 0`); the only writer under `ATU_SRC` is batch `ORD901` (`odyear = oryear`, deferred slice `ord-batch-ord900`). Header is written before lines; no commitment control; a zero-line order can be confirmed; `ORDER.PF` has exactly the six fields set.
- `c08` — the acknowledgement "The order is printed." is unconditional (`ORD500` has no return value, unmonitored); `F3`/`F12` on the window behave as Enter.
- `c10` — `ORD200` passes its in-scope `cuid` to `ORD100C`; `ORD201` and the menu call `ORD100C2`; no other caller of `ORD100`/`CRTORD` in `ATU_SRC`.
- `c12` — the line counter also increments on a cancelled article prompt (first-pass cancel → first real line is `2`); renumbering at confirm reuses the same variable.
- `c14` — complete list of procedures called (7) and files opened (4); `ExistArt`, `IsArtDeleted`, `GetArtStock`, `ExistCus`, `IsCusDeleted` exist but are not called.
- Evidence corrections to Phase A: `c09` `ORD100C` `CRTORD` call is at `ORD100C.PGM.CLLE:12` (Phase A cited `:11`, the `OVRDBF`); `c14` `CULIMCRE`/`CUCREDIT` are at `CUSTOMER.PF:17-20` (Phase A `:20-22`); `c11` `ORD701` body is `ORD701.SQLTRG:5-16`.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c08`, `c10`, `c12`–`c14`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c03`/`c13` `F3`/`F12` on the `F6` add screen end the program without warning; cancelled `F6` article prompt re-prompts — known behaviour, or latent defects to preserve as-is?
- [ ] `c04` footer totals not refreshed after edit; `c05` `TOTVAT` drift after delete — display-only defects: preserve vs fix is a later-station decision; confirm they are understood.
- [ ] `c07` `ODYEAR = 0` between confirm and the next `ORD901` run — accepted as-is? Does anything read `DETORD` by `ODYEAR`?
- [ ] `c07` no commitment control (partial order on failure) and zero-line orders — accepted failure modes today?
- [ ] `c07` `LASTORDNO` data area as the single source of order numbers (Phase A question 2; `ORD900` resets it).
- [ ] `c01`/`c14` orders for non-existent or soft-deleted customers, and soft-deleted articles via `SltArticle` (Phase A question 3) — accepted as-is?
- [ ] `c14` no credit / stock control at entry — confirm nothing enforces it elsewhere (batch, outside `ATU_SRC`).
- [ ] `c02` `ORD100` is never called without a wrapper (Phase A question 4).
- [ ] `c09` `CRTORD` → `ORD100` binding: confirm from compiled object / ARCAD (build owner).
- [ ] `c11` triggers attached on the box: route to `ord-trigger-ord700` sign-off; pointer only here.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-entry-ord100`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c09` CMD→PGM binding (inferred; build owner).
2. `c11` trigger attachment on the box (inferred; `ord-trigger-ord700`).
3. `c03`/`c13` `F6` re-prompt loop and `F3`/`F12`-ends-program path.
4. `c04`/`c05` stale / drifting footer totals.
5. `c07` `ODYEAR = 0`; no commitment control; zero-line orders; `LASTORDNO` authority.
6. `c01`/`c14` no customer / article / credit / stock guards.
7. `c02` direct calls to `ORD100` without the CL wrapper.
8. `c06` persistence of `SFLMSG` 35/36 (runtime).

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Trigger side effects (`c11`) | Owned by `ord-trigger-ord700`; needs-SME pointer here, no card. |
| Print after confirm (`c08`) | Thin seam-edge card here; `ORD500` internals belong to `ord-print-ord500` (unbound). |
| `CRTORD` command (`c09`) | needs-SME; binding is metadata-only. |
| `ORD100C` vs `ORD100C2` | One card (`c02`). |
| `ODYEAR` backfill by `ORD901` | Cited as a pointer in `c07` only; `ord-batch-ord900` stays deferred. |
| Callers `ORD200` / `ORD201` (`c10`) | Call sites cited only; their slices stay unbound. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, or edit `ATU_SRC/**`.
