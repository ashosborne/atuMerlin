# SME_BRIEF — srvpgm-supporting (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-09 (night residual wave — Ash authorized, Field recorded; `BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`); 9/9 accepted candidates documented by the Pack B conveyor on 2026-09-09 (run 16). The one `inferred` row (`c05`) is carded with its confidence kept — the source half (what each program imports) is exact, the build half (how it binds) is outside the tree. The four `unknown` surfaces (`srvpgm:XML`, `srvpgm:XSS`, `srvpgm:ORDER`, `srvpgm:TXT`) stay `unknown`; `c02` records the absence and the 23 procedure names the tree expects of them.

## What was documented

The binding layer — nothing in it is business behaviour, all of it is the contract under which the getter modules are reached: `SAMPLE.BNDDIR` (eleven entries, `c01`), the four sourceless service programs (`c02`), the twelve `bnddir('SAMPLE')` programs and their real imports (`c03`), the two explicit `CRTPGM` builds (`c04`), the three programs whose binding is not in source (`c05`), the export / signature contract of all eight service programs (`c06`), the activation-group model and what it does to the getter caches (`c07`), the one service-program-to-service-program edge and the full graph (`c08`), and the ARCAD / elias provenance of every build member (`c09`).

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c07` — **Phase A corrected: the default activation group for the fourteen un-keyworded ILE programs is `QILE`, not a new group per program.** `dftactgrp(*no)` without `actgrp` takes the `CRTBNDRPG` / `CRTSQLRPGI` default `*STGMDL` → `QILE`. If the build does not override it, every service program's static state — seven `usropn` files, seven last-key caches, `LOG300`'s pointer and `User` — is **one instance per job, shared by every program**, alive until `RCLACTGRP QILE` / sign-off. Phase A's "per calling program" reading needs `ACTGRP(*NEW)`, which appears nowhere. One `DSPPGM … DETAIL(*BASIC)` settles it; flagged runtime-confirm, not asserted.
- `c06` — **`EXPORT(*ALL)` exports module exports only: `FPARAMETER` exports 5, `LOG` exports 1.** `chainPARAMETER` / `closePARAMETER` / `init` have no `export` keyword on their P-specs and are module-local. Every one of the six `.BND` lists matches its modules' `export` keywords symbol-for-symbol (10 / 4 / 15 / 4 / 14 / 4). The estate exports **57** distinct names in all. The copybooks over-advertise: seven `Close*` prototypes have no export behind them (nobody calls them), and `GetArtInfo` is exported only by `ART302`, which is in no `MODULE()` list. This corrects `par-maintain-c10` ("all seven procedures") — a correction note was added to that card and its MANIFEST summary this run; no code change is implied.
- `c02` — **`PRO202` and `PRO203` do not compile from this tree.** Their prototypes come from `/copy qprotosrc,xml` / `/copy qprotosrc,Xss` — the only member-style copies in the tree — and `QPROTOSRC` has no `XML` / `XSS` member. The 7 + 16 procedure names in the call sites are the whole interface specification the tree holds for the purchase-order XML and the article spreadsheet.
- `c03` — **three of the twelve `bnddir` programs import nothing bound** (`ORD200`, `ORD201`, `ORD202` — `extpgm` calls and own F-specs; inert `bnddir`), and **`ART250` imports `GetArtInfo`, which no service program in the tree exports** (the existing `ART302` question of the `art-*` bind, restated as a binding fact; nothing invented). Six of the eleven directory entries are consumed; `FPARAMETER` is listed but all four of its consumers bind it by `BNDSRVPGM` or by build metadata.
- `c04` — **the `BNDSRVPGM` lists of `PRO200.ILEPGM` and `PAR201.ILEPGM` match their modules' imports exactly** (`XML FCOUNTRY FPARAMETER`; `FPARAMETER`). `PRO202` is a module reached by `prpord … extproc('PRO202')` — it is not a `*PGM`. The `.PGM.` infix in file names is the module / program switch, consistent across 21 + 16 members.
- `c05` — **`LOG100` needs no binding** (three `extpgm` prototypes); the three that do (`PRO203`, `ORD500`, `ORD700`) have nothing in source to bind them, and a build-level `BNDDIR(SAMPLE)` would still not bind `ORD700` (`LOG` is not in the directory). `iproj.json` carries no per-object options; `.elias/hashList.json` carries 138 source hashes and nothing else.
- `c08` — **exactly one inter-service-program edge**, `FARTICLE → FFAMILLY`, caused by two calls in `ART301` (family selection window + description); graph acyclic, two levels; `FFAMILLY` must be built before `FARTICLE`.
- `c09` — **thirteen ARCAD "Direct Object" snapshots from one export run** (2022-05-17 14:54:17–21, `FGRMON_OBJ` for programs, `FGRMON_DTA` for `LASTORDNO`); five `.BND` are hand-written, `FPROVIDER.BND` is ARCAD-versioned; `iproj.json` `repository` points at `AdrianAtArcad/atuMerlin`. `FFAMILLY.ILESRVPGM` `%TEXT` reads "Functions Country" (object text wrong on the box in 2022).
- `c01` — as Phase A, with the consumer map: `LOG` absent, six entries consumed, no second directory, entry order irrelevant to resolution because the 57 exported names are all distinct.

Phase A statements corrected: `c07` (default group `QILE`, not new-per-program). Sharpened: `c02` (copybooks missing too; 7 + 16 names), `c03` (inert rows; `ART250` gap; six consumed entries), `c05` (`LOG100` excluded; `BNDDIR(SAMPLE)` cannot explain `ORD700`), `c06` (5 / 1 for `*ALL`; `.BND` ↔ module cross-check; over-advertising copybooks), `c08` (the cause in `ART301`), `c09` (thirteen members, two libraries, hash file content). Nothing Phase A said about a valid build was wrong except the activation-group default.

**Existing target counterparts (not widened here):** the CUS and ORD verticals (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`) already model the getter layer as in-process modules with no cache; the five residual packs (`vat`, `dat`, `cou`, `par`, `log`) are BOUND and awaiting Convert under their own gate — none was read or touched by this run. `ord-maintain-ord202` already records "bnddir inert".

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c09`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggested: `c06` `PAR300.RPGLE:82,100` (no `export`), `c03` `ART250.PGM.SQLRPGLE:156` + `FARTICLE.BND`, `c02` `PRO203.PGM.SQLRPGLE:7` + `QPROTOSRC/` listing).
- [ ] **Room — is this a slice?** Recommendation unchanged: `reject` as a conversion slice; carry `c01` / `c03` / `c06` / `c07` / `c08` tables as architecture notes for the target's module layering. The four `unknown` surfaces stay in `APP_MANIFEST` until sources arrive.
- [ ] `c07` — **build owner / runtime-confirm:** `DSPPGM ORD100 DETAIL(*BASIC)` (any of the fourteen) → `QILE` or `*NEW`? Decides whether legacy cache staleness is job-wide or per program. **Room:** which staleness scope, if any, should the target reproduce (recommendation: none — always read fresh).
- [ ] `c05` (`inferred`) — **build owner:** how do `PRO203`, `ORD500`, `ORD700` resolve `XSS` / `FPARAMETER` / `LOG`? elias compile log, ARCAD object attributes, or `DSPPGM … DETAIL(*SRVPGM)`. Needed before any from-source rebuild.
- [ ] `c02` — **source owner:** who owns `XML` / `XSS`? Supply source, or `QPROTOSRC/XML` + `QPROTOSRC/XSS` and one sample output each. Are `ORDER` / `TXT` dead entries? (`DSPBNDDIR SAMPLE`, `DSPOBJD`.)
- [ ] `c03` — **`art-*` owner / room:** how is `ART250`'s `GetArtInfo` satisfied on the box (`ART302` bound into `FARTICLE`? into `ART250` directly?). Same open question as INDEX row 4; not answered here.
- [ ] `c06` — **build owner:** were the five `'V1'` export lists ever changed after first build? **ME:** derive the target module API from the imports (`c03`–`c05`), not from the copybooks or from "every procedure"; do not copy the fixed-signature model. **`par-maintain` owner:** accept the `c10` correction note (5 exports, not 7).
- [ ] `c09` — **build owner:** `DSPOBJD` on the eight service programs and two `CRTPGM` programs — rebuilt since 2022-05-17 with different options?
- [ ] `c01` / `c08` — read as architecture notes; no decision required beyond "preserve or flatten the edges".
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock; nothing here is characterisable behaviour anyway).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks nothing downstream unless the room reverses the `reject`-as-slice recommendation.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. Who owns `XML` / `XSS`? Can their source or at least their copybooks + sample outputs be added to the allowlist? (`c02`)
2. Are `ORDER` / `TXT` dead binding-directory entries? (`c02`)
3. Build owner: how do `PRO203`, `ORD500`, `ORD700` resolve their imports? (`c05`)
4. Runtime: activation group of the fourteen un-keyworded ILE programs — `QILE` (default) or `*NEW`? (`c07`)
5. Room: which cache-staleness scope, if any, does the target reproduce? (`c07`)
6. `art-*`: how is `GetArtInfo` / `ART302` bound on the box? (`c03`)
7. Build owner: history of the five `'V1'` export lists; rebuilds since the 2022 snapshot. (`c06`, `c09`)

Did not: bind, generate tests, convert, read or touch any Architecture pack, edit `ATU_SRC/**`, or document PRO / ART / FAM behaviour (their members are cited for binding facts only).
