# SME_BRIEF — vat-module (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`); 10/10 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 5). No `needs-SME` / `inferred` candidates in this slice — every row was `observed-in-code` and accepted. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; `FVAT` is **not** part of `atu-merlin-ts-cus-v1` and this brief does not propose widening it.

## What was documented

`FVAT` (`VAT300`, 85 lines, `NOMAIN`, `ACTGRP(*CALLER)`): the one VAT rule in the estate and its plumbing. `ClcVAT` = net × rate / 100 half-adjusted to 2 dp, returning the **VAT amount**; `GetVATRate` (display only); `GetVATDesc` and `ExistVATRate` (exported, never called); a lazy-open, last-key-cached `chain` on `VATDEF`; four exports under a literal `'V1'` signature. Cards live in `features/vat-module-c01.md` … `c10.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c01` — the `eval` into the `11P 4` work field **truncates** (no `(h)`), then `%dech(:9:2)` half-adjusts; because the exact quotient has at most 6 decimals, this equals half-adjusting the exact value to 2 dp. No overflow path. The rate is not stored on the line — `DETORD` carries `ODTOT`/`ODTOTVAT` only, so the VAT amount is recoverable as a difference and a later rate change does not alter stored lines.
- `c02` — misses **clear the buffer before the read**, so a non-blank unknown code is re-read on every call (not cached); a **blank** code is never read at all because the buffer starts and clears blank (`c05`). The only in-tree entry point for a VAT code is `ART200` FMT02 `ARVATCD`, which is written to `ARTICLE` as typed — the check subroutine validates description and family only, and `F4` prompts the family only. `FAMILLY.FAVATCD` ("DFT VAT CODE") is never applied.
- `c03` — `ART200D` FMT02 carries `VATRATE`, `VATDESC` and `WITHVAT` output fields laid out next to the VAT-code input, and `ART200` never fills them (it does not even `/COPY VAT.RPGLEINC`); they render blank. `VATDESC` is therefore never displayed anywhere. `GetVATRate` is called right after `ClcVAT` for the same code, so it never causes a second read.
- `c04` — because nothing calls `ExistVATRate`, **soft-deleting a VAT code has no effect on totals**: `ClcVAT`/`GetVATRate` never look at `VATDEL`. On the cached path `%found` reports the previous I/O.
- `c05` — `closeVATDEF` is unreachable (not exported, not called); the copybook still publishes `CloseVATDEF`, so a caller using it would fail to bind. All callers are `DFTACTGRP(*NO)` with no `ACTGRP` keyword — the activation group (and so whether one `FVAT` instance is shared by `ORD100`/`ORD101`/`ART250` in a job) is compile-time, not in source.
- `c06` — only *changes to the currently buffered row* are invisible; newly added codes are seen because misses do not stick. With no in-tree writer (`c07`) staleness is reachable only from DFU/SQL/restore.
- `c07` — `VAT300` is the **only** member that opens `VATDEF`; no CL, SQL, DSPF, menu option or `SltVAT*` exists; audit and delete columns have no writer. Sibling reference tables (`PAR200`, `COU200`, …) do have maintainers.
- `c08` — **correction to Phase A**: two of the three callers go through `GetArtVatCode` (and do so twice per line prepare); `ART250` has already chained the article and passes `ARVATCD` directly. `ART250` shows the `ClcVAT` result (the VAT amount) under a `with VAT` label where the order screens show net + VAT — left as a pointer for the `art-interactive` bind.
- `c09` — `'V1'` is a literal with no `*PRV` block (contrast `FPROVIDER.BND`, the only versioned binder); export changes without a signature bump would not be caught. Five prototypes in the copybook, four exports.
- `c10` — **correction to Phase A**: the module's `ClcVAT` PI also omits the `A` (`VAT300.RPGLE:40`); the drift is `ClcVAT` vs the other three procedures, not copybook vs module. Effective contract `ClcVAT(char(1), decimal(9,2)) → decimal(9,2)`.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c10`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggest `c01`, `c02`, `c05`).
- [ ] `c01` Confirm the rule to reproduce is "half-adjust the exact `net × rate / 100` to 2 dp" (the truncate-then-round derivation in the card) — or would you rather a RECORD settle it on the box before Test gen?
- [ ] `c02` Should an unknown / blank VAT code be an error in the target rather than silent zero VAT? Do unknown codes exist in the reference data today (`ARTICLE.ARVATCD` not in `VATDEF`)?
- [ ] `c04` Is a soft-deleted VAT code (`VATDEL = 'X'`) meant to stop being applied? As-is it is not, and nothing sets the flag.
- [ ] `c06` Do rates change while jobs run? If never intra-day, the cache staleness has no observable effect and the target may treat rates as session-stable.
- [ ] `c07` How are `VATDEF` rows maintained on the box (DFU / STRSQL / restore)? Seed configuration vs maintenance screen in the target is a **room** decision.
- [ ] `c03` `ART200` FMT02 dead VAT fields — retire or wire in the target? (`art-interactive` scope; noted here because `GetVATDesc` is the getter they would have used.)
- [ ] `c08` `ART250` "with VAT" shows the VAT amount, not the gross — defect or label? (`art-interactive` scope; the SME may want to record the answer before that bind.)
- [ ] `c05`/`c09` Build owner: which `ACTGRP` do `ORD100`/`ORD101`/`ART250` compile with; is `'V1'` bumped and are callers recompiled when `FVAT` changes?
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `vat-module`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c02` unknown code → error or zero (target decision; as-is zero).
2. `c04` soft-deleted code still applied.
3. `c06` intra-day rate changes.
4. `c07` how `VATDEF` is maintained on the box.
5. `c03` dead VAT display fields on `ART200` FMT02.
6. `c05`/`c09` callers' activation group; signature bump practice (build).

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Where the rule lives in the target | Not decided here. Phase A recommended one pure function (`c01` + `c02`) shared by order and article code; the room said "Full-repo migrate continues after ORD bind wave" — the cards give the rule, the ORD Architecture pack places it. |
| `FAVATCD` | Pointer only (fam-maintain `c12`); not imported into the VAT rule. |
| `GetArtVatCode` / `FARTICLE` | Cited as the provider of the code (`c08`); `art-modules` not deepened. |
| `ART200` / `ART250` screens | Cited as the VAT-code entry surface (`c02`, `c03`) and the one-hop caller (`c08`); `art-interactive` not deepened. |
| Order screens | `ORD100` (documented run 3) / `ORD101` (unbound) cited as call sites only. |
| Bind alongside `ord-entry-ord101` (Phase A question 3) | Room bound `vat-module` on its own in the residual wave; ORD101 bind is the next wave. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, widen `atu-merlin-ts-cus-v1`, or edit `ATU_SRC/**`.
