# SME_BRIEF — ord-maintain-ord202 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room ORD bind, `BIND.md`; `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`); 6/6 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 11). No `inferred` candidates in this slice; nothing left needs-SME for lack of a card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record — the ORD Architecture pack is a **new** pack, drafted after the five ORD slices are carded, and never widens `atu-merlin-ts-cus-v1`.

## What was documented

The read-only order display: `ORD202(orid)` — header (order, customer, creation / delivery / close dates), every order line with its article description, footer totals, and "any key closes". Cards live in `features/ord-maintain-ord202-c01.md` … `c06.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). It is the smallest ORD seam (156 + 91 lines) and the only one with no write path, but the deepen found that Phase A's picture of the screen was wrong in three places and missed the one failure mode the callers can trigger.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c01` / `c04` — **a not-found order id raises an unmonitored exception before anything is displayed.** `chain id order1` is never tested with `%found`; the creation date is converted unconditionally (`%date(ordate:*iso)`), so a miss leaves `ORDATE = 0` and the conversion fails (RPG status 00112 → inquiry message in the list program's session). Both list twins can pass such an id: `ORD201` blanks a deleted row to `orid = 0`, `ORD200` leaves the deleted id on the row, and neither guards option `5`. A concurrent delete has the same effect. `ORD500` (next in the queue) has the identical unguarded conversion. This is the "ghost `orid` not-found handling" pointer left by runs 9 and 10 — answered: there is none.
- `c02` / `c05` — **the article description is hidden until `F11`.** `SFLDROP(CF11)` shows the subfile truncated first (line 1 of each two-line record, 12 per page); `F11=Detail` folds it (6 per page). Phase A described the folded form as *the* display.
- `c05` — **there is no option column.** Every `SFL01` and `CTL01` field is output-only; Phase A's "option field unused by program" is corrected to "none exists". `SFLNXTCHG` / `SFLMSG('Invalid Option')` / `ERRSFL` are list-template residue that can never fire.
- `c05` — **paging is not missing.** `SFLSIZ(7)` ≠ `SFLPAG(6)` makes the subfile auto-extend and the display roll it (there is no `PAGEDOWN` keyword to hand control back), and it is also what permits `SFLDROP`. Every line of the order is written in one pass. Phase A's open question "orders with more than 7 lines — what does the user see?" is answered from the DDS contract: all of them, paged by the display, `More...`/`Bottom` from `SFLEND(*MORE)`. The concern is withdrawn; page counts remain runtime-confirmable.
- `c02` / `c06` — **a missing article repeats the previous line's description.** `chain odarid article1` is untested and does not clear the buffer; `FARTICLE.GetArtDesc` (used by `ORD100`/`ORD101`) clears before chaining and returns blank for the same miss. Two lookup rules in the estate for one fact.
- `c02` — totals are sums of the **stored** `ODTOT`/`ODTOTVAT`, never recomputed; zero shows blank (`EDTCDE(2)`), so an undelivered line has an empty `Deliver` column.
- `c03` / `c05` — **`F5` and `F6` exit.** Both are enabled (`CA05 'Refresh'`, `CF06 'Create'`), neither indicator is tested, both fall into the exit branch; neither is in the legend. Enter exits too. `F3` = `F12`.
- `c01` — dates are `dd/mm/yy` (`DATFMT(*DMY)`) with `MAPVAL('01/01/40')` blanking delivery/close; the list twins use `*JOB` and `'1940-01-01'`. The implicit sentinel (`*inzsr` preset, field simply not assigned when the numeric is `0`) works because every call ends with `*inlr`. The `> 0` guards are zero tests, not validity tests.
- `c06` — `bnddir('SAMPLE')` is inert: no `/COPY`, no prototype, no bound call. `ORD202` depends on four logical files and one display file on `*LIBL` and on no service program; the customer lookup bypasses `FCUSTOMER.GetCusName` the same way.

Phase A statements corrected: "option field unused by program" (`c05`, CANDIDATES/MANIFEST) → no option field exists; "no paging logic … orders with more than 7 lines may not display fully" (`c05`, SME_BRIEF open question) → display-side paging, all lines shown; "article description via `ARTICLE1` chain" (`c02`) is right but the line is hidden until `F11`. No Phase A rule statement was wrong about what the program *does*; the not-found exception, the truncated-first form, the stale description and the `F5`/`F6` exits were missing.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c06`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c01` / `c04` not-found order id → unmonitored exception (ghost row after delete in either list; concurrent delete). **What should the target's display-order do?** (Room decision for the ORD pack; recorded, not decided here. Same answer will cover `ORD500`.)
- [ ] `c02` / `c05` description hidden until `F11` — intended presentation, or show it by default in the target?
- [ ] `c02` / `c06` missing article → previous line's description repeated (`FARTICLE` → blank). One lookup rule for the target; recorded as-is, not fixed.
- [ ] `c02` footer = stored sums (not recomputed); agrees with the lists' `TOTVAL` only while the lines are unchanged — carry forward?
- [ ] `c03` / `c05` any key closes, including Enter, `F5` and `F6` — keep, or offer refresh / drop the dead keys?
- [ ] `c01` date presentation (`*DMY` two-digit years here, `*JOB` on the lists; bind date lock `NULL` in Postgres) — confirm one presentation for the ORD screens.
- [ ] `c01` / `c06` build owner: activation group (inferred `QILE`), `CRTPGM` binding (not in tree); exception surface (`RNQ0112` inquiry) is an ILE inference.
- [ ] `c05` DDS-contract statements (12 truncated / 6 folded per page, `More...`/`Bottom`, roll-past-`Bottom` message) — runtime-confirm on the box when available; nothing in the RPG contradicts them.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-maintain-ord202`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c01` / `c04` not-found order id → exception; target behaviour.
2. `c02` / `c05` description hidden until `F11`.
3. `c02` / `c06` stale description on a missing article; one lookup rule.
4. `c02` stored sums in the footer.
5. `c03` / `c05` any key closes; `F5`/`F6` dead.
6. `c01` date presentation across the ORD screens.
7. `c01` / `c03` / `c04` / `c06` activation group, build definition, exception surface (inference).
8. `c05` page geometry — DDS contract, runtime-confirmable; Phase A ">7 lines" concern withdrawn.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Merge into `ord-maintain-ord200/201`? | Kept separate (charter; bind). Callers' option-5 sites cited in `c04`; their cards (`ord-maintain-ord200-c05`, `ord-maintain-ord201-c05`) own the caller-side rules. |
| Charter name says "maintain" | Cosmetic; slice id kept (`BIND.md`, APP_MANIFEST and the bind record reference it). Program is display-only — recorded in every card. |
| `ORD500` twin (`c01`) | Edge only; the identical unguarded `%date` is cited, not carded — `ord-print-ord500` is next in the queue. |
| `FARTICLE` / `FCUSTOMER` contrast (`c06`) | `ART300.RPGLE` / `GetCusName` call sites cited only; `art-modules` unbound, `cus-modules` documented. |
| Date sentinel (`c01`) | `dat-utils-c01` owns the sentinel semantics; this slice carries the implicit-sentinel mechanism and the unguarded `ORDATE` path. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any planted or found defect, edit any card outside `discovery/ord-maintain-ord202/`, or edit `ATU_SRC/**`.
