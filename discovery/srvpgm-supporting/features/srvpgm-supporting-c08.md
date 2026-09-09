# srvpgm-supporting-c08 — `FARTICLE` is the only service program that binds another (`BNDSRVPGM(FFAMILLY)`, because `ART301` calls two `FFAMILLY` procedures); the full binding graph is two levels deep and acyclic

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is build-contract card, Phase B — the dependency graph of the binding layer) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Of the eight `CRTSRVPGM` members, exactly one carries a `BNDSRVPGM`: `FARTICLE.ILESRVPGM` — `MODULE(ART300 ART301) BNDSRVPGM(FFAMILLY)`. The reason is in `ART301.SQLRPGLE` (the article selection window): it `/COPY`s `FAMILLY.RPGLEINC` and calls `sltArtFam` and `getArtFamDesc` (`:164-165`) to let the user pick a family and show its description; `ART300` imports nothing. No other module in any `MODULE()` list calls a procedure outside its own service program — the `*301` selection modules of `FCUSTOMER`, `FCOUNTRY`, `FFAMILLY`, `FPROVIDER` read their own file only. So the service-program graph is: seven leaves and one edge, `FARTICLE → FFAMILLY`. With the program-level edges from `c03` / `c04` / `c05` the whole graph is acyclic and at most two levels deep (program → `FARTICLE` → `FFAMILLY`). Build order follows: `FFAMILLY` must exist before `FARTICLE` is created; every other service program can be created in any order; programs last. `ART302` (`GetArtInfo`) is in no `MODULE()` list and has no edge (`c03`, `c06`).

## Entrypoints

- `ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:8-9` — `CRTSRVPGM SRVPGM(&O/&N) MODULE(ART300 ART301) BNDSRVPGM(FFAMILLY) ACTGRP(*CALLER) EXPORT(*SRCFILE) …`
- `ATU_SRC/QRPGLESRC/ART301.SQLRPGLE:13-14` — `/COPY ../QPROTOSRC/ARTICLE.RPGLEINC`, `/COPY ../QPROTOSRC/FAMILLY.RPGLEINC`; `:164` `srchfam = sltArtFam(SrchFam);` `:165` `famdesc = getArtFamDesc(SrchFam);`
- The other seven `.ILESRVPGM` members — no `BNDSRVPGM` (`FCOUNTRY:8-9`, `FCUSTOMER:8-9`, `FFAMILLY:8-9`, `FPARAMETER:8`, `FPROVIDER:8-9`, `FVAT:8-9`, `LOG:8`)

## Inputs / outputs / observables

- In: `FFAMILLY` on `*LIBL` when `FARTICLE` is created.
- Out: `FARTICLE`'s service-program list contains `FFAMILLY`; activating `FARTICLE` activates `FFAMILLY` in the same (caller's) group (`c07`).
- Observable: `DSPSRVPGM FARTICLE DETAIL(*SRVPGM)` → `FFAMILLY`; the same on the other seven → none (runtime-confirmable).

## Behaviour as implemented

### Binding graph (from `c03`, `c04`, `c05`, this card)

```text
FARTICLE   ◀── ART201, ART202, ART250, ORD100, ORD101        (bnddir)
FARTICLE   ──▶ FFAMILLY                                       (BNDSRVPGM — the one service-program edge)
FFAMILLY   ◀── ART200, ART250                                 (bnddir)
FCUSTOMER  ◀── CUS250, ORD100, ORD101                         (bnddir)
FCOUNTRY   ◀── CUS200, CUS250, PRO250 (bnddir); PRO200 (BNDSRVPGM)
FPROVIDER  ◀── ART201, ART202, PRO250                         (bnddir)
FVAT       ◀── ART250, ORD100, ORD101                         (bnddir)
FPARAMETER ◀── PRO200, PAR201 (BNDSRVPGM); ORD500, PRO203 (build metadata)
LOG        ◀── ORD700                                         (build metadata; not in SAMPLE)
XML        ◀── PRO200 (BNDSRVPGM)                             [no source]
XSS        ◀── PRO203 (build metadata)                        [no source]
ORDER, TXT ◀── nobody                                         [no source]
ORD200, ORD201, ORD202 ──▶ nothing                            (bnddir inert)
ART250     ──▶ GetArtInfo (module ART302)                     (no exporter in tree)
```

1. **One service-program edge.** `FARTICLE → FFAMILLY`, caused by two calls in `ART301` (`sltArtFam` — the family selection window `FAM301D`; `getArtFamDesc` — its description). `ART300`, the getter module, does not import from `FFAMILLY` even though the article's family code (`GetArtFam`) is an article attribute — it returns the stored code and leaves description lookup to callers (`ART200` / `ART250` call `FFAMILLY` themselves — `c03`). — `FARTICLE.ILESRVPGM:8`; `ART301.SQLRPGLE:14,164-165`; `ART300.RPGLE` (no `/COPY` of `FAMILLY`, no `*Fam*` call)
2. **No other inter-service-program import.** `CUS301`, `COU301`, `FAM301`, `PRO301` each `/COPY` only their own copybook (`CUS301:13`, `COU301:16`, `FAM301:16`, `PRO301:13`); the `*300` getters copy only their own; `PAR300` and `LOG300` likewise (`LOG300` copies `APICALL` — `extpgm`, not bound). — the `/COPY` lines
3. **Acyclic, two levels.** No service program is bound by one that it binds; the longest chain is program → `FARTICLE` → `FFAMILLY`. Activation therefore cannot deadlock or recurse; `FFAMILLY` is activated once per group whether reached directly (`ART200`) or through `FARTICLE` (`ART250` does both — one instance, `c07`). — graph
4. **Build order implied:** modules → `FFAMILLY` → `FARTICLE` → the other six service programs in any order → `PRO200` / `PAR201` (`CRTPGM`) and the twelve `bnddir` programs after `SAMPLE.BNDDIR` exists (`c01`) and its six referenced service programs exist → the three metadata-bound programs after `FPARAMETER`, `LOG`, `XSS`. The tree carries no build script that encodes this order; it is implied by the edges (ARCAD / elias derive it — `c09`). — graph
5. **`ART302` has no edge.** It is a `nomain` module exporting `GetArtInfo`, in no `MODULE()` list, referenced by one program (`ART250`). The tree gives it no place in the graph; where it is bound on the box (into `FARTICLE`, into `ART250` directly, or nowhere) is the open `ART302` question of the `art-*` bind — not answered or invented here. — `ART302.SQLRPGLE:4,11`; `FARTICLE.ILESRVPGM:8`; `ART250.PGM.SQLRPGLE:156`

## Validation rules found in code

- The binder enforces the one edge: `CRTSRVPGM FARTICLE` fails if `FFAMILLY` is not on `*LIBL` (or does not export `SLTARTFAM` / `GETARTFAMDESC` — it does, `c06`). Nothing else in source enforces order.

## Edge cases found in code

- **`FARTICLE` cannot be built without `FFAMILLY`** — the only hard build dependency among the eight; a from-source rebuild that creates service programs alphabetically (`FARTICLE` first) fails on the first one.
- **`FFAMILLY` reached two ways by `ART250`** (directly via `bnddir`, indirectly via `FARTICLE`) — one activation, one cache (`c07`); no double-open.
- **Symmetry not followed:** `FCUSTOMER`'s selection module (`CUS301`) shows no country description and imports nothing; `FPROVIDER`'s (`PRO301`) likewise — only the article selection reaches into another service program. Not a defect; noted so the target does not assume every selection dialog resolves foreign descriptions.
- **The graph has no service program depending on `FPARAMETER` or `LOG`** — parameter and logging are program-level concerns only in this estate (five programs read `PATH` directly; one program logs).

## Dependencies

- `FFAMILLY` (`fam-maintain`, held — cited for the export names only), `FARTICLE` / `ART301` (`art-modules`, held — cited for the two call lines only).
- `c01`, `c03`, `c04`, `c05` (program-level edges), `c06` (export lists), `c07` (activation).

## Assumptions / unknowns

- Platform: `BNDSRVPGM` on `CRTSRVPGM` records the dependency in the object; activation of a service program activates its own bound service programs — inference, runtime-confirmable with `DSPSRVPGM DETAIL(*SRVPGM)`.
- Target stance (room, prose only): the graph is the module-layering the target should preserve or consciously flatten — master-data getters (article, customer, family, provider, VAT, country, parameter) with **one** cross-dependency (article selection → family), logging separate, and three programs with no getter dependency at all.

## Evidence

`ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/{FCOUNTRY,FCUSTOMER,FFAMILLY,FPROVIDER,FVAT}.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8` · `ATU_SRC/QRPGLESRC/ART301.SQLRPGLE:13-14,164-165` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:8` · `CUS301.SQLRPGLE:13` · `COU301.RPGLE:16` · `FAM301.RPGLE:16` · `PRO301.SQLRPGLE:13` · `PAR300.RPGLE:8` · `LOG300.RPGLE:8-9` · `ATU_SRC/QRPGLESRC/ART302.SQLRPGLE:4,11` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:156` · `ATU_SRC/QSRVSRC/FFAMILLY.BND:5,8` · structural grep of `ATU_SRC/**` for `BNDSRVPGM` (three lines: two `.ILEPGM`, one `.ILESRVPGM`)
