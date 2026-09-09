# srvpgm-supporting-c03 — Twelve programs bind through `bnddir('SAMPLE')`; nine import from six service programs, three (`ORD200`, `ORD201`, `ORD202`) import nothing, and one (`ART250`) imports a symbol no service program exports

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is build-contract card, Phase B — the dependency edges of the binding layer) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Twelve `*.PGM.*` members in `QRPGLESRC` carry `dftactgrp(*no)` **and** `bnddir('SAMPLE')` on their H-spec (fixed form, nine) or `ctl-opt` (free form, three): `ART200`, `ART201`, `ART202`, `ART250`, `CUS200`, `CUS250`, `ORD100`, `ORD101`, `ORD200`, `ORD201`, `ORD202`, `PRO250`. Comparing each program's procedure calls against the export lists (`c06`) gives the real edges: nine programs import from **six** service programs (`FARTICLE`, `FCUSTOMER`, `FFAMILLY`, `FPROVIDER`, `FVAT`, `FCOUNTRY`); **`ORD200`, `ORD201` and `ORD202` import no bound procedure at all** — their `bnddir` is inert and their inter-program calls are dynamic `extpgm` calls; and **`ART250` calls `GetArtInfo`**, prototyped in `ARTICLE.RPGLEINC` but exported by no service program in the tree (it lives in `ART302`, a module that is in no `MODULE()` list — `docs/estate/INDEX.md` row 4, `art-modules`, held). No `bnddir` program imports `FPARAMETER`, `XML`, `XSS`, `ORDER` or `TXT`.

## Entrypoints

Fixed-form `h dftactgrp(*no) bnddir('SAMPLE')`: `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:5` · `ART201.PGM.RPGLE:5` · `ART202.PGM.RPGLE:5` · `CUS200.PGM.SQLRPGLE:26` · `ORD100.PGM.RPGLE:7` · `ORD101.PGM.RPGLE:5` · `ORD200.PGM.SQLRPGLE:5` · `ORD201.PGM.SQLRPGLE:5` · `ORD202.PGM.RPGLE:5`
Free-form `ctl-opt dftactgrp(*NO) bnddir('SAMPLE');`: `ART250.PGM.SQLRPGLE:4` · `CUS250.PGM.RPGLE:4` · `PRO250.PGM.RPGLE:4`

## Inputs / outputs / observables

- In: the copybooks each program includes (`/COPY ../QPROTOSRC/*.RPGLEINC`) — they supply the prototypes; the *imports* are the procedures actually called. — `/COPY` lines cited per row below
- Out: at `CRTBNDRPG` / `CRTSQLRPGI` each unresolved import is looked up in `SAMPLE` (`c01`); the program object records which service programs it was bound to. — platform
- Observable (build time only): `DSPPGM <pgm> DETAIL(*SRVPGM)` lists exactly the service programs in the "imports from" column below, plus `QRNXIE` / `QSYS` system ones (runtime-confirmable).

## Behaviour as implemented

Import table — every bound procedure each of the twelve programs calls, checked name by name against the export lists (`c06`). Counts are **distinct procedures** imported per service program, not call sites.

| Program | Slice (status) | Copybooks | Imports from | Distinct | Notes |
| --- | --- | --- | --- | ---: | --- |
| `ART200` | `art-interactive` (held) | `FAMILLY` | `FFAMILLY` | 3 | `getArtFamDesc` (`:253`, `:273`), `sltArtFam` (`:272`), `existArtFam` (`:286`) |
| `ART201` | `art-interactive` (held) | `PROVIDER`, `ARTICLE` | `FARTICLE`, `FPROVIDER` | 1 + 1 | |
| `ART202` | `art-interactive` (held) | `PROVIDER`, `ARTICLE` | `FARTICLE`, `FPROVIDER` | 1 + 1 | |
| `ART250` | `art-interactive` (held) | `FAMILLY`, `ARTICLE`, `VAT` | `FARTICLE`, `FFAMILLY`, `FVAT` **+ `GetArtInfo`** | 1 + 1 + 1 **+ 1** | `GetArtInfo(arid)` at `:156` — **no exporter in tree** (edge case) |
| `CUS200` | `cus-interactive` (documented) | `COUNTRY` | `FCOUNTRY` | 3 | H-spec is at line 26 (25 comment lines precede it) |
| `CUS250` | `cus-interactive` (documented) | `CUSTOMER`, `COUNTRY` | `FCUSTOMER`, `FCOUNTRY` | 1 + 1 | |
| `ORD100` | `ord-entry-ord100` (documented) | `CUSTOMER`, `ARTICLE`, `VAT` | `FARTICLE`, `FCUSTOMER`, `FVAT` | 4 + 2 + 2 | |
| `ORD101` | `ord-entry-ord101` (documented) | `CUSTOMER`, `ARTICLE`, `VAT` | `FARTICLE`, `FCUSTOMER`, `FVAT` | 2 + 1 + 2 | |
| `ORD200` | `ord-maintain-ord200` (documented) | none | **none** | 0 | `extpgm` prototypes only (`ORD101`, `ORD202`, `ORD500`, `ORD100C`) |
| `ORD201` | `ord-maintain-ord201` (documented) | none | **none** | 0 | `extpgm` only (`ORD100C2`, `ORD101`, `ORD202`, `ORD500`) |
| `ORD202` | `ord-maintain-ord202` (documented) | none | **none** | 0 | one local prototype (`ord202`), no bound import — already noted "bnddir inert" in `ord-maintain-ord202` |
| `PRO250` | `pro-interactive` (accepted, queue) | `PROVIDER`, `COUNTRY` | `FPROVIDER`, `FCOUNTRY` | 1 + 1 | |

— H-spec lines above; `/COPY` lines: `ART200:14`, `ART201:13-14`, `ART202:13-14`, `ART250:13-15`, `CUS200:35`, `CUS250:9-10`, `ORD100:18-20`, `ORD101:15-17`, `PRO250:9-10`; call sites by structural grep of the 57 exported names + `GetArtInfo` against each member (comment lines excluded); `ORD200.PGM.SQLRPGLE:15-30`, `ORD201.PGM.SQLRPGLE:16-24`, `ORD202.PGM.RPGLE:16` (the `pr` lines)

1. Every one of the twelve says `dftactgrp(*no)` (required for bound calls) and names the directory; **none** carries an `actgrp(...)` keyword, so the activation group is the compiler's default (`c07`). — H-spec lines
2. Six of the eleven directory entries are exercised: `FARTICLE` (5 programs), `FCUSTOMER` (3), `FFAMILLY` (2), `FPROVIDER` (3), `FVAT` (3), `FCOUNTRY` (3). Reverse view: `FARTICLE` is the most-bound service program (5 of 12). — table
3. Three programs bind the directory for nothing. `ORD200` / `ORD201` / `ORD202` reach other programs by dynamic `CALL` (`extpgm`) and read their master data with their own F-specs (`CUSTOME1`, `ARTICLE1`), not through `FCUSTOMER` / `FARTICLE` getters. The `bnddir` keyword costs nothing but documents an intent that the code never followed. — `ORD200:5,15-30`; `ORD201:5,16-24`; `ORD202:5,16`
4. `ART250` has one import the tree cannot satisfy: `GetArtInfo` (prototype `ARTICLE.RPGLEINC:59`, body `ART302.SQLRPGLE:11` `PGetArtInfo B export`). `FARTICLE.ILESRVPGM` builds from `MODULE(ART300 ART301)` only and `FARTICLE.BND` does not list `GETARTINFO`; no other `CRTSRVPGM` / `CRTPGM` names `ART302`. As the tree stands, `CRTBNDRPG ART250` fails with an unresolved import unless the build supplies `ART302` some other way (build metadata — `c05`, `c09`). This is the "ART302 not bound in FARTICLE source" fact already recorded for `art-modules`; it is restated here only because it is a binding fact of a `bnddir('SAMPLE')` program. No ART behaviour is documented and nothing is invented about `ART302` (`BIND.md`). — `ART250.PGM.SQLRPGLE:4,14,156`; `ARTICLE.RPGLEINC:59`; `ART302.SQLRPGLE:4,6,11`; `FARTICLE.ILESRVPGM:8`; `FARTICLE.BND:5-14`
5. Nothing in the twelve calls a `Close*` procedure (`CloseARTICLE1`, `CloseCUSTOME1`, `CloseFAMILLY`, `CloseCOUNTRY`, `ClosePROVIDE1`, `CloseVATDEF`) — good, because none is exported (`c06`); the copybooks advertise them, the binder would refuse them. — structural grep (none)

## Validation rules found in code

- The compiler enforces `dftactgrp(*no)` for any bound call; all twelve satisfy it. No program checks anything about its service programs at run time.
- Fixed `SIGNATURE('V1')` on five of the six imported service programs (`c06`) means the activation-time signature check passes for *any* build of those service programs that still says `'V1'` — including one whose export list has changed (platform — the risk is documented in `c06`).

## Edge cases found in code

- **`ART250` / `GetArtInfo` unresolved from source** (step 4). Held with `art-*` at the bind; recorded, not deepened.
- **`ORD200` / `ORD201` / `ORD202` inert `bnddir`** (step 3). For a target: these three programs have *no* dependency on the getter layer; the ORD vertical conversion already treats them so (`ord-maintain-ord202` "no service program — `bnddir` inert").
- **`CUS200`'s H-spec is at line 26**, after 25 lines of comment header — the only one of the twelve not in the first seven lines. Cosmetic; noted so a scan for "H-spec in the header" does not miss it.
- **Three programs use free-form `ctl-opt`** (`ART250`, `CUS250`, `PRO250` — the "by id" display programs) and nine use fixed-form `h`; same keywords, same effect. Two coding generations in one directory (`c09`).
- **Programs that are ILE but outside the binding layer:** `PRO203`, `ORD500`, `ORD700`, `LOG100` have `dftactgrp(*no)` and no `bnddir` (`c05`). Programs with **no H-spec at all** (`DAT001`, `DAT002`, `ORD900`, `ORD901`, `PAR200`) compile `DFTACTGRP(*YES)` by default, call no bound procedure, and run in the default activation group — they cannot use a service program without an H-spec change. `COU200.RPG` is RPG III (OPM), `PRO201.CBL` has no binding keywords. — structural grep `dftactgrp` (16 members) vs `QRPGLESRC` listing (21 `.PGM.` members)

## Dependencies

- `bnddir:SAMPLE` (`c01`); the six imported service programs and their export lists (`c06`); activation-group consequence (`c07`).
- Each program's behaviour is its own slice's (table column 2); this card cites H-spec, `/COPY` and call lines only.
- `ART302` / `GetArtInfo`: `art-modules` (held).

## Assumptions / unknowns

- Platform: `DFTACTGRP(*YES)` default for members without an H-spec; `extpgm` calls are dynamic and need no binding; the binder searches `SAMPLE` only for still-unresolved imports; `CRTBNDRPG` fails on an unresolved import — each inference, runtime-confirmable with a binder listing / `DSPPGM`.
- The import lists come from a structural grep of the exported names against each member with comment lines excluded; a call spelled through a pointer or a `%paddr` would be missed (none seen).
- Target stance (room, prose only): the "imports from" column is the program → module dependency list the target should preserve (or consciously flatten); the three inert rows and the `ART250` gap are the two places where the source and the intent disagree.

## Evidence

`ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:5,14` · `ART201.PGM.RPGLE:5,13-14` · `ART202.PGM.RPGLE:5,13-14` · `ART250.PGM.SQLRPGLE:4,13-15,156` · `CUS200.PGM.SQLRPGLE:26,35` · `CUS250.PGM.RPGLE:4,9-10` · `ORD100.PGM.RPGLE:7,18-20` · `ORD101.PGM.RPGLE:5,15-17` · `ORD200.PGM.SQLRPGLE:5,15-30` · `ORD201.PGM.SQLRPGLE:5,16-24` · `ORD202.PGM.RPGLE:5,16` · `PRO250.PGM.RPGLE:4,9-10` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:59` · `ATU_SRC/QRPGLESRC/ART302.SQLRPGLE:4,6,11` · `ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:8` · `ATU_SRC/QSRVSRC/FARTICLE.BND:5-14` · structural grep of `ATU_SRC/**` for `bnddir` (12 program lines), `dftactgrp` (16 program lines), the 57 exported symbols + `GetArtInfo` + the seven `Close*` names per member
