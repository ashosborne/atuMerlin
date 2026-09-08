# SME_BRIEF — ord-entry-ord101 (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room ORD bind, `BIND.md`; `overnight/BIND_RECORD_ORD_WAVE_2026-09-08.md`); 11/11 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 8). `c11` (trigger side effects pointer) stays `needs-SME` (inferred) with no card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; ORD slices are document-only per the bind record — the ORD Architecture pack is a **new** pack, drafted after the five ORD slices are carded, and never widens `atu-merlin-ts-cus-v1`.

## What was documented

The "maintain the lines of an existing order" seam: `ORD101(orid)` loads every line with footer totals, lets the operator edit ordered / **delivered** quantity and unit price on a one-line panel (two quantity rules), and delete a line unless it has deliveries. No add path, no print, no closed-order check of its own; reached from the order lists on option `2`. Cards live in `features/ord-entry-ord101-c01.md` … `c10.md`, `c12.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

Naming: the charter labels this seam "order entry follow-on"; the code is line maintenance. SLICE_ID kept as charter wrote it (ids are referenced by the bind record and APP_MANIFEST).

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c07` — **Phase A correction.** Option `6` is advertised on the list as **`6=Deliver`** (`ORD101D.DSPF:79`), not print. It passes validation and does nothing — a per-line deliver counterpart to the order-level `8=Deliver` in `ORD200` / `ORD201` that was never implemented or was removed. Phase A question 1 ("removed print action?") is answered: no.
- `c04` — the two quantity rules compare **typed vs stored**, never typed vs typed. Worked cases: stored `10/5`, typed `20/15` → `ERR1001` although consistent; typed `6/8` → accepted and stored with delivered > ordered. Negative ordered quantity is blocked only as a side effect of rule 2; negative delivered quantity is not blocked at all.
- `c03` — a **plain Enter with nothing modified still rewrites** `ODTOT` and `ODTOTVAT`, the latter recomputed at today's VAT rate (`vat-module-c02`: unknown code → rate 0, no message). Saving after a change takes two Enters. `F3` **and** `F12` on the edit panel both return to the list (neither ends the program — contrast `ord-entry-ord100-c03`). Footer totals are not refreshed after a save. `ORD101` is the only per-line writer of `ODQTYLIV` under `ATU_SRC`.
- `c06` — **correction to the `ORD100` pattern:** `ODTOTVAT` **is** a hidden subfile field in `ORD101D`, so a straight delete keeps the footer correct. Drift appears only when a blanked row is re-selected with `4` (hidden `ODTOTVAT` not cleared → subtracted twice) or after an edit (footer never adjusted for the edit). Not-found on `delete` by key is silent; no confirmation; the list is redisplayed, not reloaded.
- `c09` — **`ORD200` option 2 is unreachable**: `if opt01 = 2 or opt01 = 4 and datclo > datBlank` (`ORD200.PGM.SQLRPGLE:187`) — `and` binds first, so every `2` is refused as "Closed order". `ORD201` has the parentheses. Line maintenance is in practice reached only from `ORD201`. This is the planted "ORD200 option-2 unreachable" defect from the bind record — documented as-is, not fixed. Neither caller reloads its list after `ORD101` returns.
- `c02` — `ORDER1` is opened `UF` and chained once, never updated: the **order header row is locked for the whole `ORD101` session**. Another job's close / deliver (`ORD201` option 7/8 chain-for-update) would wait on it. Order-not-found is silent (header shows `0` / blank) — direct `CALL` only.
- `c12` — `ORDATCLO` / `ORDATDEL` are read into the buffer and never tested; a closed order is fully editable via direct `CALL` or a stale `ORD201` list; editing does not reopen the order. Delivered-but-open orders are editable at line level in both callers.
- `c01` — `GetArtDesc` returns 50 characters, both screens show 30; the whole list is loaded in one pass (`pagedown` indicator never tested); `TOT` / `TOTVAT` sum the **stored** `ODTOT` / `ODTOTVAT`.
- `c08` — beyond `Prtord` and `create`, `help`, `prompt`, `confirm`, `morekeys`, `pagedown`, `count` and the `lod` state for panel 2 are dead — `ORD100`-shaped leftovers. `ORD101` does not print, add or deliver.
- `c10` — `F12` on the list is identical to `F3`; the only `write fdeto` under `ATU_SRC` is `ORD100`'s confirm (`ORD901` only updates `ODYEAR`).
- `c05` — the guard reads the subfile's **hidden copy** of `ODQTYLIV`, not the file: a line delivered by another job after the load can be deleted; a blanked row of a delivered line is still refused.
- `c09` — activation group is inferred `QILE` (no `ACTGRP` keyword); build owner to confirm.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c10`, `c12`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c04` typed-vs-stored quantity rules (worked cases in the card): intended semantics, or should the target compare the two new values? Negative delivered quantity accepted — known?
- [ ] `c03` plain Enter rewrites `ODTOTVAT` at today's VAT rate; two-Enter save; footer stale after save — known behaviour to preserve, or latent defects?
- [ ] `c06` double subtraction on a re-selected blank row; no confirmation; zero-line orders — display-only / accepted failure modes today?
- [ ] `c07` `6=Deliver` legend with no action — removed deliberately (order-level `8=Deliver` instead) or unfinished? Target: carry per-line deliver or drop the legend?
- [ ] `c09` `ORD200` option-2 precedence defect confirmed as the known planted defect (decision belongs to `ord-maintain-ord200`; recorded here as the reason `ORD101` is effectively `ORD201`-only).
- [ ] `c12` closed-order rule enforced only in the lists (and wrongly in one) — enforce inside the line surface in the target? Delivered orders editable at line level — intended?
- [ ] `c02` session-long `ORDER` record lock while editing lines — intended concurrency rule or incidental `UF` open?
- [ ] `c10` no add-line after creation — business rule or gap?
- [ ] `c01` 30-of-50 description truncation; `c03` no article / stock / reference-price / lower-bound checks on edit — accepted as-is?
- [ ] `c09` activation group / `CRTBNDRPG` options (build owner).
- [ ] `c11` triggers attached on the box: route to `ord-trigger-ord700` sign-off; pointer only here.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `ord-entry-ord101`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c11` trigger attachment on the box (inferred; `ord-trigger-ord700`).
2. `c04` typed-vs-stored rule semantics; negative delivered quantity.
3. `c03` silent re-rate on plain Enter; footer stale after save; no lower bounds / article checks.
4. `c06` re-selected blank row drift; no confirmation; zero-line orders.
5. `c07` dead `6=Deliver`.
6. `c09` `ORD200` option-2 unreachable (owner `ord-maintain-ord200`); activation group.
7. `c12` closed / delivered order editable inside `ORD101`.
8. `c02` header record lock for the session.
9. `c10` no add after creation.
10. `c01` description truncation.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Merge with `ord-entry-ord100`? | No — separate slices; `ORD100` cards cited as contrast (`c03`, `c06`, `c10`). |
| Trigger side effects (`c11`) | Owned by `ord-trigger-ord700`; needs-SME pointer here, no card. |
| Closed-order guard (`c12`) | Absence recorded here; the guard and the `ORD200` defect belong to `ord-maintain-ord200` / `ord-maintain-ord201` (bound, queued). |
| Callers (`c09`) | Call sites and guards cited only; their slices are next in the Pack B queue. |
| Deliver semantics (`c07`) | Order-level deliver (`ORD200` / `ORD201` option 8) cited only. |
| VAT recompute (`c03`) | `FVAT` behaviour owned by `vat-module` (documented); cited. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any planted defect, or edit `ATU_SRC/**`.
