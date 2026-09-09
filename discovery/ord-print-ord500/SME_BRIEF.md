# SME_BRIEF — ord-print-ord500 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room ORD bind, `BIND.md`; `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`); 7/7 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 12). `c04` (`inferred`) stays **needs-SME** with no card — the `CVTSPLPDF` processing program is not in the tree. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record — this was the last of the five ORD slices, so the ORD Architecture pack (a **new** pack; never widens `atu-merlin-ts-cus-v1`) can now be drafted by the ME, behind `ROOM_OK`.

## What was documented

The order print: `ORD500(orid)` — a positional `*SCS` document on `ORD500O` (company block, customer block, order number/date, two-line details, `Net`/`VAT`/`Total`, footer), the `PATH` lookup through `FPARAMETER`, and the `ORD500C` wrapper that converts the just-closed spooled file to `Custord<orid>.pdf` with `CVTSPLPDF`. Cards live in `features/ord-print-ord500-c01.md` … `c03.md`, `c05.md` … `c08.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). Sixty lines of RPG, fourteen of CL and a 112-line printer file — but the deepen corrected two Phase A statements and found three things the source guarantees that nobody had written down.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c08` / `c05` — **an unknown order id does not print a blank document; it crashes.** `chain id order1` is untested and the very next statement converts `ORDATE` unconditionally (`%date(ORDATE:*iso)`), so a miss (`ORDATE = 0`) raises an unmonitored date exception before the first `write`. Nothing is printed, no PDF, `PATH` not read. Option `6` on a ghost row in either list (`ORD201` blanks to `orid 0`, `ORD200` leaves the deleted id) or on a concurrently deleted order triggers it in the list program's session. This is the twin of `ord-maintain-ord202-c01` — same two statements — and answers the pointer runs 9–11 left for this slice. Phase A's `c08` conclusion is corrected.
- `c01` — **15 detail lines per page, not 14.** `count > 14` is tested before the increment, so the break fires before the 16th line. Continuation pages re-write the company block and the order/headings line but **not the customer block** (`HEADER2` is written once). The eject itself is `HEADER`'s `SKIPB(005)` landing behind the current line after the footer's `SKIPB(058)`.
- `c02` / `c03` — **the PDF name truncates a six-digit order id.** `%char(orid)` (up to 6 digits) is passed to a 5-byte `const` parameter and `&ORD` is `LEN(5)`, so orders 123450–123459 all become `Custord12345.pdf` and — with `STMFOPT(*REPLACE)` — overwrite each other. Latent (ids from `LASTORDNO` are far below), real in the field widths.
- `c01` — **VAT on the document is `TOTTOT − TOTNET` of the stored line totals.** Never recomputed from quantity × price or the current rate; `DETORD` has no VAT column. The `vat-module-c02` silent-zero case (unknown VAT code → `ODTOTVAT = ODTOT`) prints a **blank** `VAT` line (`EDTCDE(2)`). Same stored-sums rule as `ord-maintain-ord202-c02`.
- `c02` — **`PATH` is read once and cached for the activation group.** `FPARAMETER.chainPARAMETER` re-reads only on a key change and `ClosePARAMETER` is called by nobody in the tree; a change through `PAR200` is not seen by a running job. A missing `PATH` row yields a blank directory passed unchecked to `CVTSPLPDF` — Phase A's open question answered as far as source allows; what the converter then does is the `c04` blind spot.
- `c03` — **everything in the PDF step is unmonitored.** `ORD500C` has no `MONMSG`; `ORD500` has no `monitor` on the call. Directory missing, blank path, command or processing program not on `*LIBL`, conversion error — all propagate to the interactive caller. In `ORD100` this happens after the order is written and before the `'The order is printed.'` window. `SPLNBR(*LAST)` is correct only because `ORD500` closes its printer file immediately before the call (`c07` marks that `close` as load-bearing).
- `c03` — **a re-print replaces the PDF.** Option `6` in `ORD200`/`ORD201` runs the same path; the PDF for an order is always the latest print (current lines, stored totals), not the confirmation-time document; each print adds another spooled file to the output queue.
- `c05` — **printing is an unconditional, synchronous side effect of confirm.** `ORD100` prints every order it writes with no prompt; the user waits for spool + PDF. `ORD101` declares the prototype and never calls it. Exactly three call sites, no menu/CMD/CL entry.
- `c06` — **a missing article repeats the previous line's description** (bare `chain`, buffer not cleared), where `FARTICLE.GetArtDesc` returns blank; a missing customer prints a blank address block; `ARDEL`/`CUDEL` never tested. `ORD500` has `dftactgrp(*no)` and **no `bnddir`**, yet needs `FPARAMETER` — the binding is a build fact outside the tree (`srvpgm-supporting-c05`).
- `c01` — layout facts: country printed as the 2-char code (no `COUNTRY` lookup), delivered quantity not printed, delivered/closed orders print like open ones, `Order Number 2016/   123` (zero-suppressed in 6 columns), order date in the **job's** date format (`ORD202` uses `*DMY`, the lists `*JOB`), no page number, `'This is the footer .'` with the dot at column 90, `'Company Sample'` address hard-coded.
- `c07` — dead `datord = %date()` preset (not a guard), `oflind(overflow)` declared without a D-spec and never tested (the program owns overflow and never looks), `*inlr` on before the totals (harmless; it is why every call is fresh), accumulators that exist only as printer-file fields.

Phase A statements corrected: `c08` "prints with blank header fields (no error path)" → unmonitored exception, nothing printed (the *absence* of an error path is what makes it crash); `c01` "page break every 14 details" → 15. Phase A's `c02` open question (blank `PATH`) is answered from source up to the converter boundary. No Phase A rule statement about what a *found* order prints was wrong; the truncated PDF name, the customer block only on page 1, the derived VAT, the `PATH` cache and the unmonitored escape path were missing.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c03`, `c05`–`c08`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c04` **stays needs-SME (no card):** which product supplies `CVTSPLPDF`, and is the PDF (rendering, code page 1250, A4 portrait Courier 11, file-name case) in parity scope — or is "a PDF named `Custord<orid>.pdf` exists under `PATH`" the contract to preserve? This is the one item that blocks any RECORD of the PDF step.
- [ ] `c08` / `c05` not-found order id → unmonitored exception on option `6` (ghost row after a delete in either list; concurrent delete). **What should the target's print do?** Same room decision as `ord-maintain-ord202-c01`/`c04` — one answer for option `5` and option `6`.
- [ ] `c02` / `c03` five-character order id in the PDF name (six-digit ids truncate and collide) — carry into the target as-is, or widen there? Recorded, not fixed.
- [ ] `c02` `PATH` cached per activation group; blank `PATH` passed through — is `PATH` target configuration rather than data (`par-maintain-c11`)?
- [ ] `c05` print as a **mandatory synchronous** side effect of every confirm (Phase A question 3) — keep, or make optional / asynchronous in the target?
- [ ] `c03` re-print replaces the PDF; spooled files accumulate — intended?
- [ ] `c01` `VAT` = difference of stored sums; blank `VAT` line for the silent-zero case — carry forward as stored sums (with `ord-maintain-ord202-c02`)?
- [ ] `c01` / `c07` layout as-is: 15 lines per page, customer block on page 1 only, country code, no delivered quantity, delivered/closed print like open, `*JOB` date format, placeholder footer and company literals — confirm as the document to preserve, or flag for redesign in the ORD pack (not here).
- [ ] `c06` missing article → previous line's description repeated (`FARTICLE` → blank); `ARDEL`/`CUDEL` ignored — one lookup rule for the target (with `ord-maintain-ord202-c06`); recorded as-is.
- [ ] `c02` / `c06` / `c07` build owner: how `FPARAMETER` is bound into `ORD500` (no `bnddir`, no `.ILEPGM`), activation group (inferred `QILE`), compile listing for the implicit `overflow` indicator; exception surfaces (`RNQ0112` inquiry; CL escape → status 00202) are ILE inferences.
- [ ] `c01` page geometry (line positions from `SKIPB`/`SPACEB`; only "15 per page" is a source fact) — runtime-confirm on the box when available.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-print-ord500`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c04` provider of `CVTSPLPDF`; PDF in scope or "file exists".
2. `c08` / `c05` not-found order id on print; target behaviour (with `ORD202`).
3. `c02` / `c03` 5-character PDF name; truncation of six-digit ids.
4. `c02` `PATH` as configuration; cache; blank pass-through.
5. `c03` / `c05` unmonitored escape path; print mandatory and synchronous on confirm.
6. `c01` derived VAT from stored sums; silent-zero → blank.
7. `c01` / `c07` layout facts (15/page, customer block page 1 only, country code, no delivered qty, `*JOB` date, placeholder literals).
8. `c06` lookup rule on a missing article / customer; delete flags ignored.
9. `c02` / `c06` / `c07` build definition, binding, activation group, implicit indicator; exception surfaces (inference).
10. `c01` page geometry — DDS contract, runtime-confirmable.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| PDF step (`c03` / `c04`) | Spool content bound as the behaviour (`c01`); `c03` documents the *invocation* contract (parameters, replace, `*LAST`, no `MONMSG`); `c04` stays needs-SME — the converter is an integration edge with unknown internals. |
| PRTF layout (`c01`) | Verified field-by-field this pass (Phase A had record formats only); line positions flagged DDS-contract / runtime-confirmable. |
| `PATH` parameter (`c02`) | `PAR300.RPGLE` cited for the cache / miss mechanism only; `par-maintain` and `srvpgm-supporting` remain unbound and were not deepened. |
| Callers (`c05`) | `ORD100` / `ORD200` / `ORD201` call sites cited; their cards (`ord-entry-ord100-c08`, `ord-maintain-ord200-c05`, `ord-maintain-ord201-c05`) own the caller-side rules; `ord-entry-ord101-c08` owns the dead prototype. |
| `ORD202` twin (`c08`) | Cited for the identical unguarded `%date`; that slice's card carries the display-side answer; this one the print-side. One room question. |
| `FARTICLE` / `FCUSTOMER` contrast (`c06`) | `ART300.RPGLE` / `GetCusName` call sites cited only; `art-modules` unbound, `cus-modules` documented. |
| VAT (`c01`) | `vat-module-c02` owns the silent-zero rule; this slice records how it shows on paper. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, deepen `c04`, fix any planted or found defect (unguarded `%date`, truncated PDF name, stale description, blank `PATH` pass-through), edit any card outside `discovery/ord-print-ord500/`, or edit `ATU_SRC/**`.
