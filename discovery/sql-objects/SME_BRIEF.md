# SME_BRIEF — sql-objects (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-09 (night residual wave — Ash authorized, Field recorded; `BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`); 10/10 accepted candidates documented by the Pack B conveyor on 2026-09-09 (run 17). The one `inferred` row (`c04`, who reads `ARTLSTDAT`) is carded with its confidence kept — the source half (the view, the menu line) is exact, the reader (`ARTQRY`) is outside the tree. Two rows (`c07` `CUSSEQ`, `c08` `ART801`) are **object-surface cards** for behaviours already documented under `cus-interactive-c02` and `ord-trigger-ord700-c10`; they document the DDL contract, the resolution and the callers and point at the existing cards rather than re-deriving them.

## What was documented

Five SQL-defined objects — the only SQL DDL in an otherwise DDS estate besides the two `ISOTODATE` functions and the `ORD701` trigger: `ORDERCUS` (the read contract behind both order lists — `c01`, `c02`), `ARTLSTDAT` (a report view with no in-tree reader — `c03`, `c04`), `ARTIINF` (the article free-text table — `c05`, `c06`), `CUSSEQ` (customer ids — `c07`) and `ART801` (the batch resync procedure — `c08`, `c09`), plus the naming contract they share (`c10`).

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c01` — **the inner join cannot duplicate and the hidden-orphan case has exactly one in-tree cause.** `CUSTOME1` is `UNIQUE` on `CUID`, so `ORDERCUS` has one row per order with a customer. No program or SQL statement deletes a `CUSTOMER` row and nothing writes `CUDEL`, so an order can only lose its customer through `ORD100` accepting an unchecked `ORCUID` (`ord-entry-ord100-c01` / `-c14`) or through work outside the tree. There is no `CUDEL` or `ORDATCLO` filter either — closed orders and (hypothetically) soft-deleted customers' orders are listed. Both readers fetch `TOTVAL` into an `11Y 2` field; an order total ≥ 10^9 would end the load loop silently.
- `c02` — **gross is the estate's one definition of "order value".** `TOTVAL` sums `ODTOTVAT`, the same field `ART801` sums into `CUCREDIT`; the screens carry no heading that says VAT-inclusive.
- `c03` — **`ARTLSTDAT` and `ARCUSQTY` are different numbers by design.** `QUANTITY` is total *ordered* quantity over open and closed orders, delivered or not; `ARCUSQTY` is outstanding quantity over open orders. The view joins on `ORID = ODORID` only (no `ODYEAR`, like `ART801` and `ORDERCUS`), has no `ARDEL` filter (soft-deleted articles keep appearing) and excludes orphan lines that `ORDERCUS.TOTVAL` still counts. `GROUP BY ARDESC` is harmless (one description per `ARID`) and shows the current description. Its column headings / texts are `SAMREF` `COLHDG` / `TEXT` copies, typo included.
- `c04` — **option 13 has no `QMFORM` where option 12 has one**; no QM source directory exists; `ARTLSTDAT` and `LASTORDER` each occur once in the tree. The link to `ARTQRY` is the menu text and nothing else; stated as inferred.
- `c05` — **`ART200` uses the long column names, `ART302` the short ones; `TRIM(:text)` from a `1520A CHECK(LC)` field (19 × 80); any `sqlcod <> 0` on the read means "create", so a non-`+100` error followed by Enter is a duplicate-key `INSERT` whose failure is not checked — the edit is lost.** `CCSID 297` on both columns is the only explicit data-column CCSID in the estate (`SAMMSGF` is 297 too — the estate's implied language). `set option commit = *none` in `ART200` is the only `SET OPTION` in `QRPGLESRC`. Nothing about `GetArtInfo` beyond its one `SELECT` is asserted (ART held; "Never invent ART302").
- `c06` — **`ART200` option 4 is `ardel = 'X'` + `update farti` and nothing else**; the list (`ARTICLE2`, no select/omit) keeps showing the row and accepts option 3 on it, so a deleted article's text is still editable. The estate's record deletes are on `DETORD1` / `ORDER1` / `TMPDETORD` / `PARAMETER` only; no `DELETE FROM` exists anywhere.
- `c07` — **`CUID` is `5P 0`, the sequence is unbounded**: value 100 000 (the 98 450th) overflows the host variable and `CUS200` does not test `sqlcod` after the `SET`. Draw-before-save / gaps are `cus-interactive-c02`'s (pointer). The CUS conversion draws at save — its own documented decision, cited, not touched.
- `c08` — **`SPECIFIC ART801` is why `cmd call art801` works** (specific name = program object name); the SQL name `UPDATE_ON_CUS_ORD_QTY` is never used in the tree. Only the menu calls it; `ORD901` re-implements statement 3 inline instead of calling it. `QSQLSRC` holds exactly one data-modifying routine.
- `c09` — **thirteen header clauses tabulated**; the consequential ones are `COMMIT = *NONE` + no handler (partial reset on failure, SQLSTATE to the caller), `DECRESULT (31,31,00)` (wide `SUM`, overflow on assignment is an error), and the observation that statement 3 has no `DETORD` join while 1–2 do.
- `c10` — **`"ORDER"` delimited ten times (eight in `QSQLSRC`, `ORD901:47,49`) and undelimited three times (`ORD901:11,43,45`)** — the one inconsistent spelling, flagged as a compile-time check for `ord-batch-ord900`; `ARTIINF` is the only object with long names and the only named constraint; headings are 20-character positional segments mirroring `SAMREF`; every reference is unqualified (`*LIBL`, `*SYS` naming, mixed case); the ARCAD `%METADATA` headers are the only home of the object texts (`ART801`'s is blank).

Phase A statements corrected: none. Sharpened: all ten as above. Nothing Phase A said about a valid operation was wrong.

**Existing target counterparts (not widened here):** `modern/db/schema.sql` already defines `ordercus` as-is (inner join, `SUM(odtotvat)`, hidden orphans recorded as a preserved planted defect) and `cusseq` with the same four clauses; the header table is named `orders`. `ARTIINF`, `ARTLSTDAT` and `ART801` have no target counterpart (no ART pack; `ART801`'s batch role is an ORD-pack question — `c08`). None of the packs was read beyond those citations or touched.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c10`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggested: `c01` `ORDERCUS.VIEW:20-21` + `CUSTOME1.LF:4`; `c05` `ART200.PGM.SQLRPGLE:336-341,374-377`; `c10` `ORD901.PGM.SQLRPGLE:11,43,45,47,49`).
- [ ] **Room — is this a slice?** Recommendation unchanged from Phase A: **no** as a conversion slice. `c01` / `c02` are dependency notes of the ORD pack (already honoured as-is); `c05` / `c06` belong to the ART pack when it exists; `c07` / `c08` / `c09` are surfaces of CUS / ORD behaviours; `c03` / `c04` stay `defer` until `ARTQRY` is seen; `c10` is an ME note. Carry the cards as data-contract notes on those packs.
- [ ] `c01` — **room (ORD pack):** confirm "orders whose customer row is missing are listed nowhere" stays the definition of the order lists (the ORD conversion kept it and documented it). Optional: run the orphan count from `CHARACTERIZATION.md` on the box to know whether the case is empty today.
- [ ] `c02` — **room (ORD pack):** list total stays gross (VAT-inclusive)? Yes / no.
- [ ] `c04` (`inferred`) — **source owner:** `RTVQMQRY ARTQRY` (+ `RTVQMFORM` if any), `RTVQMQRY CUSQRY`, `RTVQMFORM CUSQRYFMT` → add to the allowlist. One retrieval settles `c03`'s purpose and closes the report-side blind spot.
- [ ] `c03` — **room (after `ARTQRY`):** is "total ordered quantity, all orders, deleted articles included, never-ordered excluded" the report the business wants?
- [ ] `c05` — **`art-*` owner (when ART is bound):** the "any read error → create → unchecked duplicate-key insert" path — record as as-is defect for the ART pack? **Room (data migration):** character-set mapping for the `CCSID 297` free text.
- [ ] `c06` — **room / `art-*` owner:** keep "text outlives the article and stays editable" or hide / delete with the soft delete in the target?
- [ ] `c07` — **room (CUS pack):** `MAXVALUE 99999` on the target sequence, or widen `CUID`? (No change to the CUS pack proposed here — a note for its next version.)
- [ ] `c08` — **ops / room:** who runs menu option 82 and when? Decides whether the target needs an operator-facing reset at all. **`ord-batch-ord900` owner (queue):** `ORD901` duplicates `ART801`'s `CULASTORD` statement — fold or keep?
- [ ] `c09` — **room (ORD pack):** target reset atomic (recommended) or as-is partial-on-failure?
- [ ] `c10` — **ME:** keep `LABEL ON` texts as `COMMENT ON`; drop positional headings; canonicalise `ARTIINF` on long names when the ART pack is drafted; flag `ORD901`'s undelimited `order` as a compile-time check for `ord-batch-ord900`.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock; the two views and the table are data contracts, not characterisable behaviour on their own).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks nothing downstream unless the room reverses the "not a conversion slice" recommendation.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. Room (ORD): keep the inner-join semantics of `ORDERCUS` (orphan orders hidden)? (`c01`)
2. Room (ORD): list total stays gross? (`c02`)
3. Source owner: `ARTQRY` / `CUSQRY` / `CUSQRYFMT` sources. (`c04`, `c03`)
4. `art-*` owner: `ART200` lost-edit path; room: CCSID 297 mapping. (`c05`)
5. Room / `art-*`: fate of a soft-deleted article's text. (`c06`)
6. Room (CUS): `MAXVALUE` vs wider `CUID`. (`c07`)
7. Ops / room: who runs option 82; `ORD901` duplicate. (`c08`)
8. Room (ORD): atomic reset. (`c09`)
9. ME: naming carry-over; `ORD901` spelling check. (`c10`)

Did not: bind, generate tests, convert, read or touch any Architecture pack beyond the read-only `schema.sql` / repository citations, edit `ATU_SRC/**`, or document ART / ORD901 / CUS200 behaviour (their members are cited for the `ARTIINF`, `"ORDER"` and `CUSSEQ` statements only).
