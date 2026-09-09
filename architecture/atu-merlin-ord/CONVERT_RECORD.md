# CONVERT record — ORD vertical (atuMerlin)

pack_id@version: `atu-merlin-ts-ord-v1@1` (`PACK.yaml`, `status: BOUND`, bound 2026-09-09T00:46:59Z by the atuMerlin migration room — Field 9.5/10 + CTO skim; Agent Smith recorded)
Authorisation: convert `ROOM_OK` carried in `overnight/AGENT_JOB.md` (Field + CTO room, 2026-09-08/09), separate from BIND. Paste: `PASTE-convert-ord-vertical-atu-merlin.md` @ c7b5761.
Station: Convert · Branch: `cursor/atu-merlin-estate-discovery` · PR target: `master`
Characterization: `WAIVED_PATHFINDER` (ADR 0001) — COMPARE at the TypeScript API only. **PARITY=UNVERIFIED.** No IBM i goldens, no `REPLAY_GREEN` claim, `replay_green_run_ids: []` stays empty.
Run: 2026-09-09 (Cloud Agent, atuMerlin factory job runner)

Talk-track: **ORD lives in TypeScript under the waiver — the repo is not fully migrated.**

## Edit surface (STRICT, from the BOUND pack)

- Written (allow): `modern/src/features/order/**` (new), `modern/src/shared/farticle/`, `modern/src/shared/fvat/` (new, read-only dependency surfaces), `modern/openapi/order.yaml` (new), `modern/db/schema.sql` (ORD section **appended** — CUS objects above it unchanged), `modern/test/order.api.test.ts`, `modern/test/order.web.test.ts` (new), `modern/test/helpers/db.ts` (reset widened to the ORD tables), `modern/src/app.ts` (additive: register feature, chain error handler), `modern/package.json` (`db:seed:order`, description), `modern/README.md` (ORD section), `architecture/atu-merlin-ord/CONVERT_RECORD.md` (this note), `overnight/AGENT_JOB.md` line 1 -> `DONE`.
- Untouched (deny): `ATU_SRC/**`, `discovery/**`, `inventory/**`, `overnight/**` (other than the DONE stamp), `modern/src/features/customer/**`, `modern/openapi/customer.yaml`, `modern/src/db/**`, `architecture/atu-merlin/**` (CUS pack), `PACK.yaml`, `BIND.md`, ADR 0001.
- Not widened: pack `atu-merlin-ts-cus-v1` — the CUS list's `5=Orders` action stays unwired because wiring it would edit `features/customer/**`.

## Mapping rules applied

| Rule | Where |
| --- | --- |
| DSPF -> web | `modern/src/features/order/order.web.ts` (ORD100D, ORD101D, ORD200D, ORD201D, ORD202D) |
| RPGLE -> TS service | `order.service.ts` (ORD100 S02prp/S02chk/confirm, ORD101 S02chk, ORD200/201 s01chk + options 4/7/8), `order.routes.ts` |
| PRTF/spool -> printable artifact | `order.document.ts` — ORD500O as text pages (`GET /api/orders/:id/document`); **no PDF** (c04 needs-SME, not invented) |
| PF -> postgres table | `modern/db/schema.sql`: `orders`, `detord` (+ dependency tables `article`, `vatdef`; `samlog`; sequence `lastordno` START 60720) |
| LF -> index/query | `orders` PK = ORDER1, indexes `order2`, `order3`; `detord` PK `(odorid, odline)` = DETORD1, index on the PF key; view `ordercus` = ORDERCUS as-is (inner join) |
| Blank/never date -> NULL | `ordatdel`, `ordatclo` `date NULL`; sentinel never stored; ORD701 converts to `yyyymmdd` at the CUS `culastord` boundary |
| Triggers ORD700/ORD701 | **Postgres triggers** (PL/pgSQL in `schema.sql`) — choice documented in `modern/README.md`, ORD section |

## Batch summary

| feature_id | status | code | note |
| --- | --- | --- | --- |
| ord-entry-ord100-c01 | DONE (as-is) | — | no ExistCus / IsCusDeleted |
| ord-entry-ord100-c02 | residual | — | client-held draft replaces QTEMP staging; no trigger footprint before confirm |
| ord-entry-ord100-c03 | DONE (as-is) | — | VAT silent zero kept (planted defect) |
| ord-entry-ord100-c04 | DONE / residual | — | recompute yes; two-Enter CHANGE(27) mechanic and stale footer not reproduced |
| ord-entry-ord100-c05 | DONE / residual | — | delete yes; TOTVAT drift not reproduced |
| ord-entry-ord100-c06 | residual | — | no pending options over HTTP |
| ord-entry-ord100-c07 | DONE (as-is) | CONTRACT_RISK | CR-O3 single transaction; CR-O11 totals at confirm; `odyear = 0` kept |
| ord-entry-ord100-c08 | DONE / needs-SME | — | acknowledgement + document link; sync print is needs-SME |
| ord-entry-ord100-c10 | DONE | — | |
| ord-entry-ord100-c12 | DONE (as-is) | — | staged counter with gaps, renumber at confirm |
| ord-entry-ord100-c13 | DONE | — | |
| ord-entry-ord100-c14 | DONE (as-is) | — | recorded absence, nothing invented |
| ord-entry-ord101-c01 | DONE | — | |
| ord-entry-ord101-c02 | DONE / residual | CONTRACT_RISK | CR-O1 404; CR-O8 no header lock |
| ord-entry-ord101-c03 | DONE (as-is) | — | silent re-rate on plain save kept |
| ord-entry-ord101-c04 | DONE (as-is) | — | typed-vs-stored rules kept; needs-SME open |
| ord-entry-ord101-c05 | DONE (as-is) | CONTRACT_RISK | CR-O6 guard reads the table |
| ord-entry-ord101-c06 | DONE / residual | — | delete + ORD700; blanked-row drift not reproduced |
| ord-entry-ord101-c07 | as-is | — | dead `6=Deliver` legend shown, no action |
| ord-entry-ord101-c08 | n/a | — | dead declarations |
| ord-entry-ord101-c09 | DONE (as-is) | — | ORD200 twin refuses every `2` |
| ord-entry-ord101-c10 | DONE (as-is) | — | no add-line route |
| ord-entry-ord101-c12 | DONE (as-is) | — | no closed-order test in the line surface |
| ord-maintain-ord200-c01 | DONE (as-is) | CONTRACT_RISK | CR-O4 tie-breaker, CR-O5 paging; inner join kept |
| ord-maintain-ord200-c02 | DONE | — | |
| ord-maintain-ord200-c03 | as-is | — | dead branch stays dead (planted defect) |
| ord-maintain-ord200-c04 | DONE | CONTRACT_RISK | CR-O3 transactional; `CULASTORD` not maintained (c12 as-is) |
| ord-maintain-ord200-c05 | DONE | — | |
| ord-maintain-ord200-c06 | DONE (as-is) | — | `Invalid Option` text kept |
| ord-maintain-ord200-c07 | DONE (as-is) | — | partial lines skipped, not closed |
| ord-maintain-ord200-c08 | DONE / residual | — | rules + texts yes; whole-pass cancellation residual |
| ord-maintain-ord200-c09 | as-is | — | **planted defect preserved**: option 2 unreachable in the per-customer list |
| ord-maintain-ord200-c10 | DONE / residual | — | CUS200 link stays unwired (CUS pack) |
| ord-maintain-ord200-c11 | DONE | — | |
| ord-maintain-ord200-c13 | DONE (changed) | CONTRACT_RISK | CR-O3 one transactional delete, lines first |
| ord-maintain-ord201-c01 | DONE (as-is) | — | inner join kept; 14 per page |
| ord-maintain-ord201-c02 | DONE | — | |
| ord-maintain-ord201-c03 | DONE | — | the working path to line maintenance |
| ord-maintain-ord201-c04 | DONE | CONTRACT_RISK | CR-O3 |
| ord-maintain-ord201-c05 | DONE | — | |
| ord-maintain-ord201-c06 | DONE (as-is) | — | identical to the ORD200 cards |
| ord-maintain-ord201-c07 | DONE / residual | — | dead sticky `3` not reproducible |
| ord-maintain-ord201-c08 | DONE | — | F5 on `/orders` only |
| ord-maintain-ord201-c09 | DONE | — | |
| ord-maintain-ord201-c10 | n/a | — | dead files |
| ord-maintain-ord201-c11 | n/a | — | cursor close |
| ord-maintain-ord202-c01 | DONE / needs-SME | CONTRACT_RISK | CR-O1 404 on not-found (legacy exception) |
| ord-maintain-ord202-c02 | DONE (as-is) | CONTRACT_RISK | description hidden until F11 kept; CR-O2 lookup rule |
| ord-maintain-ord202-c03 | residual | — | stateless page |
| ord-maintain-ord202-c04 | DONE | — | |
| ord-maintain-ord202-c05 | residual | — | dead keys not rendered |
| ord-maintain-ord202-c06 | DONE (changed) | CONTRACT_RISK | CR-O2 |
| ord-print-ord500-c01 | DONE | CONTRACT_RISK | CR-O7 ISO date; page length assumed |
| ord-print-ord500-c02 | needs-SME | — | PATH / PDF name not implemented, not invented |
| ord-print-ord500-c03 | needs-SME | — | CVTSPLPDF not implemented |
| ord-print-ord500-c05 | DONE / needs-SME | — | callers yes; sync print open |
| ord-print-ord500-c06 | DONE (changed) | CONTRACT_RISK | CR-O2 |
| ord-print-ord500-c07 | n/a | — | quirks not carried |
| ord-print-ord500-c08 | needs-SME | CONTRACT_RISK | CR-O1 |
| ord-trigger-ord700-c02 | DONE (as-is) | — | Postgres trigger |
| ord-trigger-ord700-c03 | DONE (as-is) | — | `samlog` table |
| ord-trigger-ord700-c04 | DONE (as-is) | — | `*CHANGE` via WHEN clause |
| ord-trigger-ord700-c05 | DONE (as-is) | — | |
| ord-trigger-ord700-c06 | replaced | — | buffer plumbing not ported |
| ord-trigger-ord700-c07 | DONE (as-is) | — | ORD701 unconditional |
| ord-trigger-ord700-c09 | DONE | — | |
| ord-trigger-ord700-c10 | residual | — | ART801 stays legacy |

CONTRACT_RISK ids (CR-On) are defined in `modern/README.md`, ORD section, "Deliberate deltas". Left open for Verification.

## Planted defects — preserved, not fixed

- ORD200 option-2 unreachable (`/orders?cuid=` refuses every `2=Edit`).
- ORDERCUS inner join (orphan orders listed nowhere).
- VAT silent zero (unknown VAT code -> VAT 0, no message).

## Quality gates

Pack `quality_gates.commands` is empty; pack-level gate is `characterization: WAIVED_PATHFINDER`,
`verification: DEFERRED`. Commands run for what is claimed here:

- `npm run typecheck` — clean
- `npm test` — 111 tests, 5 files, green against PostgreSQL 16 (`modern/scripts/local-pg.sh`): 55 CUS (unchanged), 47 ORD API, 9 ORD web
- LEGACY_REPLAY=SKIPPED (no IBM i harness; waived)

## Follow-ups (not done here)

- Verification station for ORD: COMPARE at the TS API under the waiver; decide CR-O1 … CR-O11.
- SME sign-off on the seven `discovery/ord-*/SME_BRIEF.md` files; in particular the not-found
  answer (202-c01 / 500-c08), PDF scope (500-c04), sync print (500-c05), the SoT twin for the two
  lists, and the ORD200 option-2 decision.
- If the room wants the CUS list's `5=Orders` wired to `/orders?cuid=`: needs a CUS pack version
  bump + SUPERSEDE + re-bind (edit under `features/customer/**`).
