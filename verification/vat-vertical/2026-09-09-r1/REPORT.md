# Verification REPORT — VAT vertical (atuMerlin), run `2026-09-09-r1`

pack_id@version: **`atu-merlin-ts-vat-v1@1`** (`architecture/atu-merlin-vat/PACK.yaml`, `status: BOUND`, bound 2026-09-09T11:12:14Z by the atuMerlin migration room — Field 9/10 + CTO skim; soft notes tip 4f42dcf; Agent Smith recorded)
Station: Verification · Mode: **COMPARE at the TypeScript boundary only** (plus the additive `vatdef` mapping) · Characterization: **`WAIVED_PATHFINDER`** (ADR 0001)
Authorisation: Verification `ROOM_OK` in `overnight/AGENT_JOB.md` ("ROOM_OK: verification VAT only", Field + CTO Verify ROOM_OK batch of five 2026-09-09), separate from BIND and from the convert `ROOM_OK`. Paste: `PASTE-verify-vat-vertical-atu-merlin.md` @ `744ac29`.
Branch `cursor/atu-merlin-estate-discovery` @ `111be2b` · PR [#1](https://github.com/ashosborne/atuMerlin/pull/1) → `master` · 2026-09-09 16:23–16:40 UTC · Cloud Agent (atuMerlin factory job runner)

## 1. Verdict

**`parity: TS_BOUNDARY_GREEN`** — see `PARITY.yaml`.

What that means, exactly:

- `npm run typecheck` is clean and `npm test` is 201/201 against live PostgreSQL 16.15 (27 VAT; the 55 CUS, 56 ORD and 63 DAT tests unchanged and green).
- Every export of `modern/src/shared/fvat/index.ts` behaves the way the `vat-module` cards and the README VAT section say it should, checked by a probe whose oracle was written from the cards (not from the module or its vitest suite). The c01 oracle evaluates the RPG statements literally — `tot = (net * vatrate) / 100` assigned to an `11P 4` field (truncation, no `(h)`), then `%dech(tot : 9 : 2)` — in BigInt on exact decimal scales, while the module does a one-step rounding in integer hundredths. The card claims the two agree; the probe confirms it on 1 800 009 cent-sweep pairs, 200 000 random `(9P 2, 4P 2)` pairs across the full field ranges (negatives included) and 4 500 calls through `vatdef` — 23/23 cases (`evidence/results.json`).
- The buffer rules the cards describe are observed, not inferred: a query-counting wrapper around the pool shows **0** SQL statements for a blank code from all four exports (c05 kept) and **7** reads for 7 non-blank calls (c06 / CR-V1 — the deliberate no-cache delta, seen as such).
- The planted defects and known-risk behaviours are present and asserted as-is, not fixed (§4, "Preserved").
- Every card is either matched at the boundary or carries a reason that traces to the pack; there are **no unexplained card gaps**. One **contract** observation was recorded (G-V1, §4): the `decimal(9,2)` side of the c10 effective contract is not enforced on `net` the way CR-V3 enforces the `char(1)` side. No modern caller can reach it.

What it does **not** mean:

- **Not `PARITY=GREEN` against IBM i.** No IBM i / RPG goldens exist for this pathfinder and none were invented. `REPLAY_GREEN` is not claimed; `legacy_green` and `parity_green` stay `false`; `replay_green_run_ids` stays `[]`. The oracle here is the Discovery cards (read from source, never executed on the box) and the README's stated contract.
- Not "Merlin migrated", and not "VAT fully migrated": `VATDEF` maintenance (which the legacy never had), ART200's dead VAT display fields, ART250's one-hop caller and every needs-SME item stay on IBM i or open. The VAT rule is a shared TypeScript module with no HTTP surface, consumed by the ORD vertical.
- CUS, ORD and DAT are not re-verified as this job's claim. `order.service.ts` is *read* by one probe case (P18) to confirm the c08 call sequence and `shared/farticle` is *called* for the two-hop path; neither is edited and neither pack is widened.

**Talk-track:** VAT residual verified at TS API under waiver — not Merlin migrated.

## 2. Gate checks

| Gate | Result |
| --- | --- |
| `PACK.yaml` status | `BOUND` — proceed |
| Verification `ROOM_OK` in job body | present ("ROOM_OK: verification VAT only (atu-merlin-ts-vat-v1@1 BOUND; Convert DONE tip b6d3af0 / 02a9916)") |
| Convert complete | yes — `architecture/atu-merlin-vat/CONVERT_RECORD.md`, `modern/src/shared/fvat/index.ts` at `02a9916`, handoff `PARITY=UNVERIFIED` |
| Another job `RUN` (Smith gate) | no — `list-cloud-agents` showed this run as the only active automation run at start; branch head = trigger head `111be2b`; `AGENT_JOB.md` line 1 `RUN` on origin, re-checked before the first commit |
| `overnight/stop.txt` | absent |
| Scope | VAT only (`vat-module`, one slice, shared `fvat`). CUS / ORD / DAT not re-verified; ART untouched |
| Edit surface | written: `verification/vat-vertical/2026-09-09-r1/**`, `modern/README.md` (two status sentences), `overnight/AGENT_JOB.md` line 1. Untouched: `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**` (this pack's `PACK.yaml` stays `verification: DEFERRED` — BOUND is immutable), `modern/src|test|db|openapi` |
| CUS / ORD packs not widened | `git diff fda5292..HEAD -- modern/src/features modern/openapi modern/src/db modern/src/app.ts modern/src/server.ts architecture/atu-merlin architecture/atu-merlin-ord architecture/atu-merlin-cou architecture/atu-merlin-par architecture/atu-merlin-log` is empty (the only sibling change since the pre-convert tip is `architecture/atu-merlin-dat/CONVERT_RECORD.md`, the DAT pack's own convert); the first 242 lines of `modern/db/schema.sql` (CUS + ORD objects, including the `vatdef` `CREATE TABLE`) are byte-identical to the pre-convert tip `fda5292`; CUS / ORD suites 55 / 56 unchanged |
| `ATU_SRC/**` | `git diff origin/master..HEAD -- ATU_SRC` is empty |
| FVat shape ORD consumes | `getVatRate` / `clcVat` signatures unchanged from `fda5292` (`getVatDesc`, `existVatRate`, `normaliseVatCode` added); `order.api.test.ts` 47 + `order.web.test.ts` 9 green without edit |
| Goldens | none exist; nothing RECORDed, nothing rewritten |

## 3. Commands run

Environment: Node v22.14.0 (pack minimum 20), PostgreSQL 16.15 (`modern/scripts/local-pg.sh`, port 54329), fresh `npm ci`.

| Command | Result | Evidence |
| --- | --- | --- |
| `cd modern && npm run typecheck` | `tsc --noEmit` exit 0, no diagnostics | `evidence/typecheck-and-vitest.log` |
| `cd modern && npm test` | vitest 3.2.7: **7 files, 201 tests, 201 passed** (`dat.test.ts` 63, `order.api.test.ts` 47, `customer.api.test.ts` 29, `fvat.test.ts` 27, `fcustomer.test.ts` 16, `customer.web.test.ts` 10, `order.web.test.ts` 9), 5.64 s | `evidence/typecheck-and-vitest.log` |
| independent COMPARE probe (`DATABASE_URL=... npx tsx evidence/probe.mjs`) | **23 PASS / 0 FAIL** | `evidence/results.json` |

The vitest suite is modern's own; on its own it never sets a green flag (Field Guide anti-greenwash). The probe is the independent check: its c01 oracle re-derives the RPG evaluation from the card's "Behaviour as implemented" steps 2–3 in BigInt (truncating division to `1e-4`, then half-away-from-zero division to `1e-2`, with the `11P 4` and `9P 2` field limits asserted), and compares `clcVatWithRate` against it on the sweeps; it then builds a throw-away schema through `modern/test/helpers/db.ts`, wraps the pool in a query-counting proxy, and exercises the four exports for the c02 / c04 / c05 / c06 buffer rules, the c08 two-hop path via `shared/farticle`, the c09 export surface, the c10 code normalisation and the `vatdef` column shape / bounds.

One probe case failed on the first run. P20 (case-sensitivity) read code `A` expecting a miss, but P12 had already inserted a row keyed `A` for the `VATDEL` flag sweep — a probe-script collision, not a module fault (the vitest c10 block asserts the same thing on a clean fixture). The case was moved to `q` / `Q`; no module or server behaviour was changed. The committed `results.json` is the second, clean run.

## 4. Card COMPARE — cards vs module exports vs tests vs probe

Legend: export = function or method in `modern/src/shared/fvat/index.ts`; test = vitest block in `test/fvat.test.ts`; probe = case id in `evidence/results.json`.

### vat-module

| Card | README status | Export | Test | Probe | COMPARE outcome |
| --- | --- | --- | --- | --- | --- |
| c01 ClcVAT = `(net × rate) / 100` truncated to `11P 4`, half-adjusted to `9P 2`; VAT amount, not gross | converted | `clcVat`, `clcVatWithRate` | c01 (17) | P01–P05, P07 | match on 2 004 509 pairs against the literal two-step oracle: third-decimal ties (0.00275 → 0.00, 0.0055 → 0.01, 0.0075 → 0.01), six-decimal quotient 0.500175 → 0.50, negatives symmetric, no `-0`, `9,999,999.99 × 99.99 %` → `9,998,999.99`, largest `tot` seen 9 962 152.1332 (fits `11P 4`); 100.00 at 20 % → 20.00 not 120.00 |
| c02 Unknown code → cleared buffer → 0 / blanks / 0, no message | converted (as-is) | `CLEARED` path in `chain` | c02 (2) | P08, P09 | match: 94 codes (every printable ASCII not in the table + é, €, one emoji) give rate 0 / description "" / VAT 0 / exists false and throw nothing; a zero-rated row and an unknown code are indistinguishable by amount — **planted defect kept** |
| c03 GetVATRate (display only) / GetVATDesc (no caller) | converted | `getVatRate`, `getVatDesc` | c03 (2) | P10, P11 | match: raw row fields, rate as a number, 20A description intact (21 chars rejected by `varchar(20)`, 22001); rate shown after ClcVAT is the rate the amount used on 600 line prepares. ART200 FMT02 dead fields: ART scope, untouched |
| c04 ExistVATRate = `%found and VATDEL <> 'X'`; others ignore VATDEL | converted (as-is) | `existVatRate` | c04 (3) | P12, P13 | match: 7-flag truth table (only the literal upper-case `X` is deleted; `x`, `D`, `Y`, `1`, `*`, blank are live; missing → false); an `X` row is still applied by ClcVAT (7 %), GetVATRate (7), GetVATDesc — **inconsistency preserved** |
| c05 Lazy open, last-key cache, blank code never reads, `closeVATDEF` not exported | converted / residual | `chain` (blank short-circuit); no open / close | c05 (1) | P14, P15, P19 | **blank code never reads** matched by observation: 0 SQL statements from all four exports for `" "` and `""` with a row keyed `' '` (rate 99) present. Open / close have no equivalent and nothing named `close*` is exported (CR-V1, explained); the cache half is c06 |
| c06 Rate cache stale for the activation group after a VATDEF change | **residual** (CR-V1) | — (deliberately absent) | c06 (2) | P15, P16 | **delta observed as documented**: 7 non-blank calls issue exactly 7 parameterised reads (`WHERE vatcode = $1`, no string concatenation); `3` changed 10 → 12 is seen on the very next call where the legacy would hold 10 for the session; a code added after a miss is seen next call (matches legacy — misses never stuck). Needs-SME (intra-day rate changes) stays open |
| c07 No maintenance path for VATDEF (absence) | as-is, needs-SME | — (nothing built) | — | P17, P23 | **absence preserved**: no `/vat` or `/api/vat` route in `src`, no VAT OpenAPI file, the only `vatdef` writer in `src` is `features/order/order.seed.ts` (the ORD dev fixture, CR-V4); after `reset()` exactly the three seed rows (1 = 5.5, 2 = 20, 3 = 10, `vatmodid SEED`) exist. Seed configuration vs maintenance screen is the room's decision — nothing invented |
| c08 Code comes from the article via GetArtVatCode (two hops); ART250 one hop | converted (ORD) / residual (ART) | consumed by `order.service.ts` (not this pack's edit) | ORD suites (unchanged) | P18 | match: `farticle.getArtVatCode("ZZZZZZ")` → `""` → `clcVat` → 0 with **0** `vatdef` reads (blank code short-circuit, as the card describes); `A00001` (code 2) → 29.98 on 149.90; `order.service.ts` still reads `getArtVatCode(odarid)` → `fvat.clcVat(vatCode, odtot)` → `fvat.getVatRate(vatCode)`. ART250 is `stay_legacy` — explained |
| c09 Export surface: four symbols under `'V1'`, `ACTGRP(*CALLER)`, `SAMPLE.BNDDIR` | converted / n/a | `FVat` methods; module exports | — | P19 | match: `Object.keys(createFVat(db))` is exactly `clcVat, existVatRate, getVatDesc, getVatRate`; the module exports exactly `clcVatWithRate, createFVat, normaliseVatCode`; nothing named `close*`. Signature / binding directory / activation group have no TS equivalent (CR-V2, explained) |
| c10 Copybook / module type drift on ClcVAT; effective contract `ClcVAT(char(1), decimal(9,2)) → decimal(9,2)` | converted | `normaliseVatCode` | c10 (2) | P20, P06 | `char(1)` side matched: `'2X'` → `'2'`, `''` / `' '` / `'  '` → `' '`, `'x2'` → `'x'`; through the table `'2X'` → 20, `'q'` (3 %) ≠ `'Q'` (0), `' 2'` is the blank code (0, no read). `decimal(9,2)` side **not enforced** on `net` — **G-V1** below |

**Unexplained gaps: none.** Every card is either matched at the boundary or carries a reason that traces to the pack (`stay_legacy` ART, `contract_paths: []`, `deny` on `src/db/**`, stateless server) or to a bind-time needs-SME.

### Schema — `vatdef` mapping (pack mapping rule "PF VATDEF → postgres table (additive)")

| Check | Probe | Observed |
| --- | --- | --- |
| Column-for-column from `VATDEF.PF` | P21 | `vatcode char(1)` PK, `vatrate numeric(4,2)`, `vatdesc varchar(20)`, `vatcrea date`, `vatmod timestamp`, `vatmodid varchar(10)`, `vatdel char(1)`; the PK is the only index (no LF over `VATDEF` in `ATU_SRC`); table / rate / del comments cite c07 / c02 / c04 |
| Field bounds the c01 argument rests on | P10, P22 | `numeric(4,2)` rejects 100.00 (22003) and stores / reads back 99.99; `varchar(20)` rejects 21 characters (22001) |
| Additive | §2 | first 242 lines of `schema.sql` byte-identical to `fda5292`; the VAT section is `COMMENT ON` only |

### Preserved (planted / known_risk / as-is), asserted, not fixed

| Behaviour | Where asserted | Observed |
| --- | --- | --- |
| Silent zero for unknown VAT (c02) | P08, P09 | no exception, rate 0, VAT 0; indistinguishable from a zero rate |
| Soft-deleted `VATDEL = 'X'` still applied (c04) | P13 | ClcVAT 7.00 / GetVATRate 7 / GetVATDesc "Retired rate" while ExistVATRate is false |
| Blank code never reads `VATDEF` (c05) | P14 | 0 SQL statements; blank-keyed row (rate 99) invisible |
| No maintenance path; rows via the ORD seed (c07, CR-V4) | P17, P23 | no route, no OpenAPI, one writer (`order.seed.ts`); three seed rows after reset |
| Session-buffered rates (c06) — **not** reproduced | P15, P16 | recorded and observed as CR-V1; the SME question (intra-day changes) decides whether it is ever noticeable, not whether the code changes |
| Dead ART200 `VATRATE` / `VATDESC` / `WITHVAT` (c03) | §2 scope | ART scope, untouched |

### Contract observation found (not behaviour drift on any card)

| Id | Gap | Severity | Suggested owner |
| --- | --- | --- | --- |
| G-V1 | `modern/README.md` (c10 row, CR-V3) states the effective contract `ClcVAT(char(1), decimal(9,2)) → decimal(9,2)` and normalises the `char(1)` side explicitly; nothing normalises or guards the `decimal(9,2)` side. `clcVatWithRate` does `Math.round(net * 100)`, so a sub-cent `net` is rounded where an RPG by-value conversion to `9P 2` truncates — `0.075` at 20 % gives `0.02` here and `0.01` from a truncated `0.07` (P06; `1.035` and `0.045` happen to agree) — and `net = 10 000 000` computes `2 000 000` rather than failing. No modern caller can pass either: ORD passes `round2(qty × price)` and checks `TOTPRICE_MAX`. Compare the DAT pack, which raises `DatArgumentError` for a value its `8 0` field could not hold | low | Conversion follow-up at the next pack version: either document that `net` must already be `decimal(9,2)` (caller's contract, as today) or add a guard in the CR-V3 style. Not this station's edit |

## 5. CONTRACT_RISK CR-V1..CR-V4 and pack `known_risks` — accept-for-demo or defer

No line below claims an IBM i match. "Accept-for-demo" means the delta is acceptable for the pathfinder demo as documented in `modern/README.md`; "defer" means the room or an SME must decide before anything beyond a demo. No SME answer is invented here.

| Id | Delta (from `modern/README.md`) | Disposition | One sentence |
| --- | --- | --- | --- |
| CR-V1 | No per-activation-group state: no last-key cache, no held `VATDEF` open, nothing to close | **accept-for-demo** | The only observable difference is that a `VATDEF` row changed mid-session is applied at once instead of at the next code switch (P15, P16); the legacy has no in-tree writer of `VATDEF` (c07) so the case is reachable only by out-of-band edits, a per-request re-read is the direction any stateless target takes, and the open c06 SME question decides whether the change is ever noticed, not whether the code should hold stale rates. |
| CR-V2 | No binder signature / binding directory / activation group | **accept-for-demo** | A TypeScript import resolves the four symbols at build time (P19: exactly four methods, nothing named `close*`), which is a stricter check than the hand-written `'V1'` literal that never protected callers against an export change (c09); the `'V1'` bump / recompile practice stays a build-owner question with no TS counterpart. |
| CR-V3 | The `1A` by-value code is normalised in TypeScript: first character, empty → blank | **accept-for-demo** | It reproduces what the by-value call did for free on the box (P20: `'2X'` → 20, `''` → blank code with 0 reads, `'q'` ≠ `'Q'`), and the one asymmetry it leaves — the `decimal(9,2)` side is not normalised — is recorded as G-V1 with no modern path to it. |
| CR-V4 | `vatdef` fixture rows come from the ORD dev seed | **defer** | The demo runs on the three seed rows (P23) and that is enough for the pathfinder, but the pack has no way of its own to load real `VATDEF` content because the legacy had none either (c07, P17): whether that becomes seed configuration or a maintenance surface is the room's decision, taken at the next pack version with SUPERSEDE + re-bind, not invented by this run. |

Totals: 3 accept-for-demo, 1 defer (CR-V4).

Pack `known_risks` (from `PACK.yaml`):

| Known risk | Disposition | Evidence / one sentence |
| --- | --- | --- |
| Pathfinder waiver: no IBM i goldens; COMPARE only at TypeScript API | accept-for-demo (structural) | This whole run; `PARITY.yaml` `legacy_replay: SKIPPED`, `ibm_i_parity: NOT_CLAIMED`. |
| Silent zero for unknown VAT (c02) — planted; stays residual; do not "fix" | accept-for-demo — verified preserved | P08 / P09: 94 unknown codes give 0 silently; nothing raises. The SME question (should the target raise) stays in `discovery/vat-module/SME_BRIEF.md`. |
| Soft-deleted `VATDEL` still applied (c04) | accept-for-demo — verified preserved | P13: an `X` row is applied by three exports and denied by the fourth, exactly as on the box; the SME question stays open. |
| Session-buffered rates (c06) | accept-for-demo — verified as the CR-V1 delta | P15 / P16: not reproduced, observed and documented; see CR-V1. |
| `VATDEF` maintenance path unknown (c07) | defer | P17 / P23: nothing built, nothing invented; see CR-V4 — a room decision before anything beyond a demo. |
| Dead ART200 `VATRATE` / `VATDESC` fields (c03) — residual; do not invent ART scope | accept-for-demo — verified untouched | §2: ART not touched; `getVatDesc` exists as the getter those fields would use, nothing wired. |
| Architecture DRAFT/BOUND does not authorize Convert; separate ROOM_OK required | n/a (procedural) | Chain honoured: BIND `ad697f3` → convert `ROOM_OK` (`fda5292`) → convert `02a9916` / `b6d3af0` → verification `ROOM_OK` (`111be2b`) → this run. |
| CUS and ORD modern already exist; accidental re-scope of those packs is a fail | accept-for-demo — verified | §2: `features/customer/**`, `features/order/**`, both OpenAPI files, `src/db/**`, both packs untouched since `fda5292`; CUS / ORD suites unchanged and green; P18 confirms ORD consumes the shared module unchanged. |
| `modern/db/**` additive VAT tables only — do not reshape CUS or ORD schema | accept-for-demo — verified | §2 + P21: first 242 lines of `schema.sql` byte-identical to `fda5292`; VAT section is `COMMENT ON` only; `vatdef` column shape unchanged. |

## 6. Explicitly not claimed / refused

- IBM i parity, `PARITY=GREEN`, `REPLAY_GREEN`, `legacy_green`, `parity_green`, behaviour `status: verified` — none. `inventory/atu-merlin/APP_MANIFEST.yaml` was not touched (pack `edit_surface.deny` and Field Guide: under a waiver the maximum is `converted` + `parity: WAIVED`).
- `PACK.yaml` `quality_gates.verification: DEFERRED` was not edited — BOUND is immutable; this run is the evidence the room reads next to it.
- Whole-estate verification — CUS / ORD / DAT not re-verified as this job's claim; ART untouched.
- "Repo fully migrated" or "VAT fully migrated" — no; see §1.
- Golden creation or RECORD — no `tests/characterization/**` exists and none was created.
- Discovery card edits — none needed; no harness bug blocked COMPARE.
- Fixing G-V1 or deciding CR-V4 — not this station's edit; recorded for Conversion (G-V1) and the room (CR-V4 / c07).
- Any edit under `ATU_SRC/**`, `discovery/**`, `inventory/**`, `architecture/**`, `modern/src|test|db|openapi`.
- SME answers — none invented; `discovery/vat-module/SME_BRIEF.md` stays unsigned with its open questions (c02, c04, c06, c07, c03 / c08 ART, c05 / c09 build).

## 7. Reproduce

```bash
cd modern && npm ci && ./scripts/local-pg.sh start
export DATABASE_URL=$(./scripts/local-pg.sh url)
npm run typecheck && npm test
npx tsx ../verification/vat-vertical/2026-09-09-r1/evidence/probe.mjs
```

The probe needs only a live `DATABASE_URL`: it builds a throw-away schema through `modern/test/helpers/db.ts` (schema + CUS seed + ORD seed), runs every SQL-backed case there and drops it. The cent sweep is deterministic; the random pairs are drawn fresh each run (`crypto.randomBytes`), so `results.json` counts are stable but the sampled values are not.

## 8. Follow-ups (not done here)

- Conversion (next pack version): close G-V1 — either state in `modern/README.md` that `net` must already be `decimal(9,2)` (caller's contract) or add a guard in the CR-V3 style; documentation or a one-line guard, no behaviour change on any card.
- Room / SME: sign off `discovery/vat-module/SME_BRIEF.md` — unknown-code policy (c02), soft-delete semantics (c04), intra-day rate changes (c06), `VATDEF` maintenance (c07), ART200 dead fields and ART250 label (ART scope), `'V1'` bump practice (build).
- Room: decide CR-V4 / c07 — seed configuration vs a `VATDEF` maintenance surface; either is a pack version bump + SUPERSEDE + re-bind (new `contract_paths`, possibly `features/vat/`).
- Next per the job header: Convert cou → par → log (each needs its own `ROOM_OK` in the `AGENT_JOB.md` body).
- If the room ever wants parity against IBM i: legacy RECORD on the box first (Test execution station), then a real COMPARE — this run cannot be upgraded into that.
