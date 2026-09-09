# srvpgm-supporting-c05 — Three programs (`PRO203`, `ORD500`, `ORD700`) import service-program procedures with neither `bnddir` nor an `.ILEPGM`; a fourth (`LOG100`) has `dftactgrp(*no)` but imports nothing — how the three bind is build metadata, not source

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is blind-spot card, Phase B — the half that is source is exact; the half that is the build is outside the tree) |
| Confidence | `inferred` — bound `accepted` as `inferred`; carded with the confidence kept (run-13/14/15 practice) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Sixteen `QRPGLESRC` programs say `dftactgrp(*no)`; twelve also say `bnddir('SAMPLE')` (`c03`) and two more have a `CRTPGM` member (`c04`). The remaining four — `PRO203`, `ORD500`, `ORD700`, `LOG100` — have **no binder information anywhere in `ATU_SRC`**. Three of them need one: `PRO203` imports `GetParm2` (`FPARAMETER`) and sixteen `xss*` procedures (`XSS`, sourceless — `c02`); `ORD500` imports `getParm2` (`FPARAMETER`); `ORD700` imports `addlogEntry` (`LOG`, which is not even in `SAMPLE.BNDDIR` — `c01`). From source alone, `CRTBNDRPG` / `CRTSQLRPGI` of these three fails with unresolved imports. Whatever makes them build — a `BNDDIR()` / `BNDSRVPGM()` parameter on the create command (for `PRO203`, `CRTSQLRPGI … COMPILEOPT('BNDDIR(...)')`), an ARCAD cross-reference-driven bind, or a directory on the build box's default — is in ARCAD / elias server-side metadata: `iproj.json` carries no per-object options and `.elias/hashList.json` carries only source hashes (`c09`). `LOG100`'s `dftactgrp(*no)` has no binding consequence: its three prototypes are `extpgm` (dynamic program calls to `QUSCRTUS`, `QUSPTRUS`, `QCMDEXC`), so it links with nothing bound.

## Entrypoints

- `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:4` — `h dftactgrp(*no)`; `:7-8` `/copy qprotosrc,Xss` + `/COPY ../QPROTOSRC/PARAMETER.RPGLEINC`; `:32` `GetParm2('PATH':' ')`; `:33-94` the `xss*` calls
- `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:4` — `h dftactgrp(*no)`; `:13` `/COPY ../QPROTOSRC/PARAMETER.RPGLEINC`; `:58` `getParm2('PATH':' ')`
- `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4` — `H dftactgrp(*no)`; `:8` `/COPY ../QPROTOSRC/LOG.RPGLEINC`; `:78` `callp(e) addlogEntry(…)`
- `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:5` — `h dftactgrp(*no)`; `:9` `/COPY ../QPROTOSRC/APICALL.RPGLEINC` (`crtusrspc … extpgm('QUSCRTUS')`, `rtvusrspcptr … extpgm('QUSPTRUS')`, `exec … extpgm('QCMDEXC')` — `APICALL.RPGLEINC:4,14,19`)
- Absence: no `bnddir` on any of the four; no `QILESRC/PRO203|ORD500|ORD700|LOG100.ILEPGM` (`QILESRC` has two members — `c04`); no `CRTBNDRPG` / `CRTSQLRPGI` command source anywhere

## Inputs / outputs / observables

- In: source (exact, above) + build metadata (absent).
- Out: nothing observable at run time — a program that was built *is* bound; the question is only how.
- Observable on a built object: `DSPPGM PRO203 DETAIL(*SRVPGM)` (expect `XSS`, `FPARAMETER`), `DSPPGM ORD500 DETAIL(*SRVPGM)` (expect `FPARAMETER`), `DSPPGM ORD700 DETAIL(*SRVPGM)` (expect `LOG`), `DSPPGM LOG100 DETAIL(*SRVPGM)` (expect none beyond system ones); `DETAIL(*BASIC)` on each for the activation group (`c07`). The ARCAD object record / elias compile log would show the create command actually used (needs-SME, build owner).

## Behaviour as implemented

| Program | Slice (status) | Create command implied by `.PGM.` + extension | Bound imports (source) | Exporter | In `SAMPLE`? | What source offers to bind it |
| --- | --- | --- | --- | --- | --- | --- |
| `PRO203` | `pro-interactive` (accepted, queue) | `CRTSQLRPGI OBJTYPE(*PGM)` | `GetParm2` + 16 `xss*` (`c02`) | `FPARAMETER`; `XSS` (no source) | yes / yes | **nothing** — no `bnddir`, no `.ILEPGM`; `CRTSQLRPGI` has no `BNDDIR` parameter of its own (binder options go through `COMPILEOPT`) |
| `ORD500` | `ord-print-ord500` (documented) | `CRTBNDRPG` | `getParm2` | `FPARAMETER` | yes | **nothing** — no `bnddir`, no `.ILEPGM` |
| `ORD700` | `ord-trigger-ord700` (documented) | `CRTBNDRPG` | `addlogEntry` | `LOG` | **no** (`c01`) | **nothing** — and even `bnddir('SAMPLE')` would not help, `LOG` is not in the directory |
| `LOG100` | `log-programs` (documented) | `CRTBNDRPG` | **none** (three `extpgm` prototypes) | — | — | not needed |

— H-spec / `/COPY` / call lines above; `SAMPLE.BNDDIR:10-14`; `QILESRC/` listing

1. **Source is exact about *what* is imported.** The call sites are unambiguous: one `FPARAMETER` getter each in `PRO203` / `ORD500` (`GetParm2` for the `PATH` row — the same literal `('PATH':' ')` as `PRO202` and `PAR201`, `par-maintain-c11`), one `LOG` procedure in `ORD700`, sixteen `XSS` procedures in `PRO203`. — cited lines
2. **Source is silent about *how*.** `DFTACTGRP(*NO)` lets the compiler accept bound calls; resolving them needs `BNDDIR` or `BNDSRVPGM` on `CRTBNDRPG` (or `COMPILEOPT` on `CRTSQLRPGI`), an H-spec `bnddir`, or a `CRTPGM` step. The tree has the H-spec route for twelve programs and the `CRTPGM` route for two, and **neither** for these three. — structural grep (`c03`, `c04`)
3. **The build system is named but its per-object options are not in the tree.** `iproj.json`: `buildCommand: elias compile {branch}`, `compileCommand: elias compile {branch} -f {filename}`, `objlib &verlibatu`, `includePath ATU_SRC/QPROTOSRC`, ARCAD extension `code ATU`, `libraryPrefix ATU`, `validated: true`. `.elias/hashList.json`: `branch FT_zel001`, one `{comparisonHash, relativeIFSPath, status: "DRY"}` per source member (the four programs included), nothing else. ARCAD's own object attributes (the "Direct Object FGRMON_OBJ/…" records the generated members mention — `c09`) are where a `BNDDIR` / `BNDSRVPGM` default would live. — `iproj.json`; `.elias/hashList.json`; `SAMPLE.BNDDIR:5`
4. **Plausible resolutions, none confirmable from source** (inference — needs the build owner): (a) elias / ARCAD passes `BNDDIR(SAMPLE)` (or `COMPILEOPT('BNDDIR(SAMPLE)')`) to every `CRTBNDRPG` / `CRTSQLRPGI` — would bind `PRO203` (`XSS`, `FPARAMETER`) and `ORD500` (`FPARAMETER`) but **still not `ORD700`** (`LOG` absent from `SAMPLE`); (b) ARCAD computes `BNDSRVPGM` from its cross-reference per object — would bind all three; (c) the three objects were created by hand or by a former `.ILEPGM` that is no longer in source (`ORD700`'s and `LOG`'s history — `log-programs-c08`). Only (b) and (c) explain `ORD700`; (a) alone cannot.
5. **`LOG100` is ILE for no binding reason.** Its `dftactgrp(*no)` puts it in `QILE` (default — `c07`) but it binds nothing; `extpgm` calls resolve dynamically at run time. Consequence: none for binding; for activation, its static storage (the based user-space pointer) lives in `QILE` for the job like everything else (`log-programs-c01`). — `LOG100.PGM.RPGLE:5,9`; `APICALL.RPGLEINC:4,14,19`

## Validation rules found in code

- None at run time. At build time the binder either resolves every import or fails the create; there is no partial state — so if these three objects exist on the box, they *were* bound, by something not in this tree.

## Edge cases found in code

- **`ORD700` is the hardest case**: sourceless binding **and** the target service program is outside the only binding directory. It is also a trigger-fired program (`ord-trigger-ord700`), so a rebuild that silently drops `LOG` would surface only as a `callp(e)`-swallowed error on the first line-delete (`ORD700.PGM.RPGLE:78` — `log-programs-c04`). A from-source rebuild must supply `BNDSRVPGM(LOG)` explicitly.
- **`PRO203` is doubly blocked**: no binder in source (this card) and no `XSS` source or copybook (`c02`). Nothing in the tree can build it.
- **`ORD500` and `PRO203` need exactly one export (`GetPARM2`) of `FPARAMETER`** — the same one `PAR201` and `PRO202` need. `FPARAMETER` is consumed by four programs and **not one** of them binds it through `SAMPLE` (`c01`, `c04`).
- **The `dftactgrp(*no)` count (16) exceeds the binder count (14) by exactly these four** — so "has an H-spec with `dftactgrp(*no)`" is not a reliable proxy for "binds through `SAMPLE`" when scanning the tree; the `bnddir` keyword itself is.
- **Case drift**: `getParm2` (`ORD500`, `PRO202`) vs `GetParm2` (`PRO203`, `PAR201` as `GETPARM2`) — cosmetic.

## Dependencies

- Exporters: `FPARAMETER` (`par-maintain`, documented), `LOG` (`log-programs`, documented), `XSS` (`c02`, `unknown`).
- Programs' behaviour: `pro-interactive` (`PRO203`, accepted, queue — cited for imports only), `ord-print-ord500` (`ORD500`), `ord-trigger-ord700` (`ORD700`), `log-programs` (`LOG100`) — all cited, not re-derived.
- Build system: `iproj.json`, `.elias/hashList.json` (`c09`).

## Assumptions / unknowns

- **needs-SME (build owner — Phase A Q3):** how do `PRO203`, `ORD500`, `ORD700` resolve `XSS` / `FPARAMETER` / `LOG`? Ask for the elias compile log or ARCAD object attributes for the three, or `DSPPGM … DETAIL(*SRVPGM)` output from the box. This decides whether a from-source rebuild needs a new `.ILEPGM` per program or a build-level `BNDDIR`.
- Platform: `CRTSQLRPGI` `COMPILEOPT` route; `extpgm` = dynamic call; unresolved import = create failure — inference, runtime-confirmable.
- Target stance (room, prose only): none of this is behaviour. For the target it is a dependency list — `PRO203` → parameter store + spreadsheet writer; `ORD500` → parameter store; `ORD700` → log — which the ORD conversion already models for `ORD500` / `ORD700` (`modern/` — cited by `log-programs` / `ord-*` cards, not read here).

## Evidence

`ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:4,7-8,32-94` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:4,13,58` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4,8,78` · `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:5,9` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:4,14,19` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:10-14` · `ATU_SRC/QILESRC/` listing (two members) · `iproj.json` (whole) · `.elias/hashList.json` (structure; entries for the four members) · structural grep of `ATU_SRC/**` for `dftactgrp` (16 lines), `bnddir` (12 program lines), `BNDSRVPGM` (three build members), `CRTBNDRPG` / `CRTSQLRPGI` / `COMPILEOPT` (none)
