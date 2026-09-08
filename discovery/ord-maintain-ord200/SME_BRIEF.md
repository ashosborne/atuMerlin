# SME_BRIEF — ord-maintain-ord200 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room ORD bind, `BIND.md`; `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`); 12/12 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 9). `c12` (stale `CULASTORD` after delete) stays `needs-SME` (inferred) with no card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record — the ORD Architecture pack is a **new** pack, drafted after the five ORD slices are carded, and never widens `atu-merlin-ts-cus-v1`.

## What was documented

The "one customer's orders" seam: `ORD200(cuid)` lists a customer's orders from the `ORDERCUS` view and offers the order lifecycle — create (`F6` → `ORD100C`), edit lines (`2` → `ORD101`, unreachable), delete (`4`), display (`5` → `ORD202`), print (`6` → `ORD500`), close (`7`), deliver (`8`) — with the option guards that gate them. Cards live in `features/ord-maintain-ord200-c01.md` … `c11.md`, `c13.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

Headline unchanged from Phase A: **option 2 (edit lines) is unreachable in `ORD200` as coded** — a missing pair of parentheses makes the closed-order guard fire for every `2` (`ORD200.PGM.SQLRPGLE:187`); `ORD201` has the corrected form. Documented as-is (planted defect per the bind record), not fixed; preserve-or-correct is a room decision.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c06` / `c07` / `c08` — **"already closed" and "already delivered" are refused with the generic `Invalid Option` text** (`SFLMSG` 35), the same message as for typing `9`. Only `2`/`4`-on-closed (36) and `4`-with-deliveries (37) have specific wording. Phase A listed the guards without noting the shared text.
- `c04` / `c13` — **the deleted row stays on screen with its data** in `ORD200` (`ORD201` zeroes `ORID`/`ORYEAR`). Re-selecting the ghost: `4` is a silent no-op, `5`/`6` call the callee with a missing order, `7`/`8` chain-miss and then `update forde` without a locked record → unmonitored exception. `ORD201`'s blanking is cosmetic — `7`/`8` on its blank row chain-miss on key `0` the same way.
- `c13` — failure residue differs by twin: `ORD200` (header first) leaves **orphan lines with no header** — invisible to `ORDERCUS`/`ART801`, still counted in the `ORD700`-maintained `ARCUSQTY`, unreachable from any screen; `ORD201` (lines first) leaves a header with missing lines. `ORD200` contends for the header lock first (held by any open `ORD101` session, `ord-entry-ord101-c02`), so it fails before touching a line.
- `c06` — close stamps `ORDATDEL` when blank but **leaves every `ODQTYLIV` at 0**: the trigger-maintained article outstanding quantity is not reduced by a close, while `ART801` (filter `ORDATCLO = 0`) drops the order — the two views of "outstanding" diverge until the batch runs. Phase A question 2, now with the aggregate consequence.
- `c07` — deliver sets every line still at `ODQTYLIV = 0` to `ODQTY` (with lock, `ORD700U` delta `-ODQTY`), **skips partial lines**, rewrites zero-quantity lines with a zero delta, and does not close; since `7` always sets `ORDATDEL`, deliver-after-close is impossible. Header "delivered" with outstanding partial lines is a reachable state.
- `c01` — `ORDER BY datord DESC` has **no `orid` tie-breaker** (`ORD201` adds one); the whole result is loaded in one pass (`ORD201` pages 14 at a time); **`F5` is enabled (`CA05`) but unlabelled on `KEY01` and unhandled** — it redisplays without reloading (`ORD201` labels and handles it); any non-zero `SQLCOD` (including `-305` when `ISOTODATE40` returns NULL for an invalid date) ends the load silently at that row. `CUSTNM` is not selected from the view; the header name comes from a native chain (`c11`).
- `c08` — **option `3` is invalid here but passes validation in `ORD201`** (falls to `other`, silently stays typed). One refused row cancels every action on the pass; valid options stay typed for the next Enter. The `4` deliveries test is a live file read; the `7`/`8`/`2`/`4` state tests use the subfile copies of `datclo`/`datliv`.
- `c10` / `c11` — `ORD201D` reuses the panel id literal **`ORD200-1`**, so the two lists share a screen id. `F3` and `F12` both end `ORD200` identically. Activation group inferred `QILE` (no `ACTGRP`) — build owner to confirm.
- `c02` — `F6` reloads unconditionally (also after a cancelled create) and discards any options typed on that pass; `ORD100C` stages `QTEMP/DETORD` without constraints or triggers (`ord-trigger-ord700-c09`), `OVRDBF` scope is a build property.
- `c05` — no state guard on `5`/`6`; closed, delivered and ghost orders can be displayed or printed. Legend `'6=Print  '` has two trailing blanks (`ORD201D`: `'6=Print'`).

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c11`, `c13`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c09` **option 2 unreachable** — known to users (they use `ORD201`)? Preserve as-is in the target or adopt the `ORD201` rule? (Room decision; recorded, not decided here.)
- [ ] `c06` / `c07` close vs deliver: close stamps the delivery date but not delivered quantities; deliver skips partial lines and leaves the order open — intended distinction? Header-delivered-with-outstanding-lines an accepted state?
- [ ] `c06` / `c07` / `c08` `Invalid Option` as the text for already-closed / already-delivered — accepted wording, or surface the reason in the target?
- [ ] `c04` no confirmation before delete; `c04` / `c13` ghost row and `7`/`8`-on-ghost exception; header-first vs lines-first residue — which twin is the parity reference for delete?
- [ ] `c01` no tie-breaker, whole-result load, unhandled `F5`, silent truncation on any SQL condition — follow `ORD201` in the target or keep?
- [ ] `c08` option `3` divergence with `ORD201`; one refused row cancels the whole pass — one rule for the target?
- [ ] `c06` / `c07` guards read screen copies; state changed by another job after the load is overwritten on chain — accepted?
- [ ] `c12` stale `CULASTORD` after deleting the latest order — confirm on the box; accepted drift? (Mechanism: `ord-trigger-ord700-c08`.)
- [ ] `c10` activation group / `CRTSQLRPGI` options (build owner); `c02` `OVRDBF` scope in `ORD100C` (build owner, `ord-entry-ord100`).
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-maintain-ord200`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c12` stale `CULASTORD` (inferred; confirm on the box).
2. `c09` preserve or correct the option-2 precedence defect.
3. `c06` / `c07` close vs deliver semantics; partial lines; header delivered with outstanding lines.
4. `c06` / `c07` / `c08` `Invalid Option` wording for state refusals.
5. `c04` / `c13` no confirmation; ghost row; header-first residue; parity twin.
6. `c01` sort tie-breaker, paging, `F5`, silent truncation.
7. `c08` option `3`; whole-pass cancellation.
8. `c06` / `c07` stale screen-copy guards.
9. `c10` activation group; `c02` override scope.
10. `c10` / `c11` shared panel id; header name source (cosmetic).

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| `ORD200` vs `ORD201` | Separate slices (charter). Phase A's "one shared lifecycle card set" recommendation was **not** adopted by the bind; this slice carries full cards and cites `ORD201` as contrast only. `ORD201` cards are next in the queue and may cross-reference these. |
| Close (7) / deliver (8) semantics | Carded here (`c06`, `c07`); identical code in `ORD201`. |
| Stale `CULASTORD` (`c12`) | Stays inferred / needs-SME; mechanism owned by `ord-trigger-ord700-c08`. |
| Create path (`c02`) | Edge only; `ORD100C` / `CRTORD` / `ORD100` belong to `ord-entry-ord100` (documented). |
| Line maintenance (`c03`) | Edge only (dead); `ORD101` belongs to `ord-entry-ord101` (documented). |
| Display / print (`c05`) | Edges only; `ORD202` / `ORD500` bound and queued. |
| Trigger effects (`c04`, `c07`) | `ORD700` deltas cited from `ord-trigger-ord700` (documented). |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any planted defect, or edit `ATU_SRC/**`.
