# srvpgm-supporting-c01 — `SAMPLE.BNDDIR`: eleven `*LIBL` service-program entries, in a fixed order; `LOG` absent; six entries actually consumed by the `bnddir('SAMPLE')` programs

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is build-contract card, Phase B — binding layer; nothing here is business behaviour) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMPLE.BNDDIR` is an ARCAD-generated CL member of two commands: `CRTBNDDIR BNDDIR(&O/&N)` and one `ADDBNDDIRE` that adds **eleven** `*SRVPGM` entries, every one qualified `*LIBL`, in this order: `XML`, `ORDER`, `TXT`, `XSS`, `FARTICLE`, `FCUSTOMER`, `FFAMILLY`, `FPARAMETER`, `FPROVIDER`, `FVAT`, `FCOUNTRY`. **`LOG` is not in the directory**, so the one program that imports `AddLogEntry` (`ORD700`) cannot resolve it through `bnddir('SAMPLE')` (`c05`). Of the eleven, **six** are imported by at least one of the twelve `bnddir('SAMPLE')` programs (`FARTICLE`, `FCUSTOMER`, `FFAMILLY`, `FPROVIDER`, `FVAT`, `FCOUNTRY`); `FPARAMETER` is listed but every one of its callers binds it by other means (`c04`, `c05`); `XML` is listed but its only in-tree consumer names it explicitly on `CRTPGM` (`c02`, `c04`); `XSS`, `ORDER`, `TXT` are reached by no `bnddir` program at all. Four of the eleven have no source in the tree (`c02`). The directory is the compile-time contract of the twelve programs (`c03`) and nothing else.

## Entrypoints

- `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8` — `CRTBNDDIR BNDDIR(&O/&N)` (`&O` / `&N` are the ARCAD object-library / object-name substitution variables — `c09`)
- `SAMPLE.BNDDIR:9-14` — `ADDBNDDIRE BNDDIR(&O/&N) OBJ((*LIBL/XML *SRVPGM) (*LIBL/ORDER *SRVPGM) (*LIBL/TXT *SRVPGM) (*LIBL/XSS *SRVPGM) (*LIBL/FARTICLE *SRVPGM) (*LIBL/FCUSTOMER *SRVPGM) (*LIBL/FFAMILLY *SRVPGM) (*LIBL/FPARAMETER *SRVPGM) (*LIBL/FPROVIDER *SRVPGM) (*LIBL/FVAT *SRVPGM) (*LIBL/FCOUNTRY *SRVPGM))`
- Consumers: the twelve H-spec / `ctl-opt` lines `bnddir('SAMPLE')` (`c03`)

## Inputs / outputs / observables

- In: the compiling job's library list at `CRTBNDRPG` / `CRTSQLRPGI` time — every entry is `*LIBL`, so *which* `FARTICLE` etc. a program binds to is decided by the build job's `*LIBL`, not by the source. — `SAMPLE.BNDDIR:10-14`
- Out: a `*BNDDIR` object named `SAMPLE` in `&O`; the binder consults it only for imports still unresolved after the program's own modules and any explicit `BNDSRVPGM` (platform rule — inference). — `SAMPLE.BNDDIR:8`
- Observable (build time only): `DSPBNDDIR SAMPLE` lists the eleven entries in the order above; `DSPPGM <pgm> DETAIL(*SRVPGM)` on any of the twelve shows only the service programs it actually imported from, never all eleven (platform — runtime-confirmable).

## Behaviour as implemented

The directory, entry by entry, with what the tree says about each (case as written in source):

| # | Entry | Source in tree | `.BND` / export mode | Consumed via `bnddir('SAMPLE')` by | Other in-tree binder |
| ---: | --- | --- | --- | --- | --- |
| 1 | `XML` | **none** (`c02`) | — | nobody | `PRO200.ILEPGM` `BNDSRVPGM(XML …)` (`c04`) |
| 2 | `ORDER` | **none** (`c02`) | — | nobody | none — referenced by nothing |
| 3 | `TXT` | **none** (`c02`) | — | nobody | none — referenced by nothing |
| 4 | `XSS` | **none** (`c02`) | — | nobody | none in source — `PRO203` needs it without `bnddir` (`c05`) |
| 5 | `FARTICLE` | `FARTICLE.ILESRVPGM` (`ART300`, `ART301`) | `FARTICLE.BND`, `'V1'`, 10 symbols | `ART201`, `ART202`, `ART250`, `ORD100`, `ORD101` | — |
| 6 | `FCUSTOMER` | `FCUSTOMER.ILESRVPGM` (`CUS300`, `CUS301`) | `FCUSTOMER.BND`, `'V1'`, 15 symbols | `CUS250`, `ORD100`, `ORD101` | — |
| 7 | `FFAMILLY` | `FFAMILLY.ILESRVPGM` (`FAM300`, `FAM301`) | `FFAMILLY.BND`, `'V1'`, 4 symbols | `ART200`, `ART250` | `FARTICLE.ILESRVPGM` `BNDSRVPGM(FFAMILLY)` (`c08`) |
| 8 | `FPARAMETER` | `FPARAMETER.ILESRVPGM` (`PAR300`) | no `.BND` — `EXPORT(*ALL)`, 5 exports (`c06`) | **nobody** | `PRO200.ILEPGM`, `PAR201.ILEPGM` (`c04`); `ORD500`, `PRO203` by build metadata (`c05`) |
| 9 | `FPROVIDER` | `FPROVIDER.ILESRVPGM` (`PRO300`, `PRO301`) | `FPROVIDER.BND`, `*GEN` + `*PRV`, 14 symbols | `ART201`, `ART202`, `PRO250` | — |
| 10 | `FVAT` | `FVAT.ILESRVPGM` (`VAT300`) | `FVAT.BND`, `'V1'`, 4 symbols | `ART250`, `ORD100`, `ORD101` | — |
| 11 | `FCOUNTRY` | `FCOUNTRY.ILESRVPGM` (`COU300`, `COU301`) | `FCOUNTRY.BND`, `'V1'`, 4 symbols | `CUS200`, `CUS250`, `PRO250` | `PRO200.ILEPGM` `BNDSRVPGM(… FCOUNTRY …)` (`c04`) |
| — | `LOG` | `LOG.ILESRVPGM` (`LOG300`) | no `.BND` — `EXPORT(*ALL)`, 1 export (`c06`) | **not listed** | `ORD700` needs it without `bnddir` and without an `.ILEPGM` (`c05`) |

— `SAMPLE.BNDDIR:10-14`; consumers from the import table in `c03`; binders from `c04`, `c08`; export modes from `c06`

1. The directory is created empty and filled by a single `ADDBNDDIRE`; there is no `RMVBNDDIRE`, no second directory anywhere in the tree, and no program names a directory other than `SAMPLE`. — `SAMPLE.BNDDIR:8-14`; structural grep `bnddir` (`c03`)
2. Entry order is the binder's search order for an unresolved import (platform — inference). Because no two service programs in the tree export the same symbol (`c06` cross-check: 51 distinct symbols across the six `.BND` files plus 6 `EXPORT(*ALL)` exports, no duplicates), order cannot change *which* service program satisfies an import — it only matters if one of the four sourceless entries exports a colliding name, which cannot be checked from the tree. — `QSRVSRC/*.BND`; `PAR300.RPGLE:22-70`; `LOG300.RPGLE:18`
3. Every entry is `*LIBL`: the binding is resolved against the library list of the job that runs the compile. The `iproj.json` build declares `objlib: &verlibatu` and `curlib: *CRTDFT`, i.e. a per-version library whose name is substituted by the build — which library `XML`, `XSS`, `ORDER`, `TXT` are found in is therefore a build-environment fact, not a source fact (`c09`). — `SAMPLE.BNDDIR:10-14`; `iproj.json` `objlib`, `curlib`
4. Six of eleven entries are consumed through the directory; `FPARAMETER`'s presence is redundant with respect to the tree (all its callers bind it explicitly or by metadata) but not wrong — any future `bnddir('SAMPLE')` program calling `GetPARM*` would resolve without a change to the directory. — table above

## Validation rules found in code

- None at run time: a binding directory is consulted at bind time only; a missing entry object (`XML` absent from `*LIBL` when compiling `PRO200`, say) fails the *build*, not the program (platform). Nothing in source checks for the service programs' existence.
- The directory does not declare symbols — an entry whose service program does not export the wanted symbol is simply skipped by the binder (platform); the export lists (`c06`) are the actual contract.

## Edge cases found in code

- **`LOG` absent.** The only service program with an in-tree caller that is *not* in the directory. `ORD700` (the caller) has no `bnddir` either — so its import is doubly outside source (`c05`; `log-programs-c08`, `ord-trigger-ord700`). Adding `LOG` to `SAMPLE` would not help `ORD700` as written (no `bnddir` on its H-spec).
- **Four entries without source** (`XML`, `ORDER`, `TXT`, `XSS`) sit *first* in the search order; on a build box where they are absent from `*LIBL` the binder skips them and the six real entries still resolve — the twelve `bnddir` programs import nothing from the four, so their builds are unaffected by the gap (`c03`). The gap bites `PRO200` (`BNDSRVPGM(XML …)`) and `PRO203` (`XSS`) only (`c02`).
- **`FPARAMETER` listed, never consumed via the directory** — see step 4.
- **Name of the directory (`SAMPLE`) is the only string the twelve programs carry**; `&O` / `&N` in the member mean the object's library and name are decided by ARCAD at build (`c09`). A rebuild elsewhere must create `SAMPLE` in a library on the compile job's `*LIBL`.

## Dependencies

- Creates: `*BNDDIR SAMPLE` (surface `bnddir:SAMPLE`).
- Refers to (does not create): `*SRVPGM` `XML`, `ORDER`, `TXT`, `XSS` (surfaces `srvpgm:XML` / `srvpgm:XSS` / `srvpgm:ORDER` / `srvpgm:TXT`, all `unknown` — `c02`), `FARTICLE`, `FCUSTOMER`, `FFAMILLY`, `FPARAMETER`, `FPROVIDER`, `FVAT`, `FCOUNTRY` (`c06`, and their own slices for the procedure behaviour).
- Consumers: the twelve programs in `c03`.

## Assumptions / unknowns

- Platform: binding-directory semantics (search order, unresolved-imports-only, bind-time `*LIBL` resolution) — inference, runtime-confirmable with `DSPBNDDIR` / a binder listing.
- Whether the four sourceless entries exist on the production box, and in which library, is a box fact (needs-SME, `c02`).
- Target stance (room, prose only — `SME_BRIEF.md`): the directory is an ILE build artefact with no target counterpart; the *dependency edges* it encodes (`c03`, `c08`) are what the target's module layering should preserve. Recommendation unchanged from Phase A: `reject` as a conversion slice; carry the tables as architecture notes.

## Evidence

`ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:4-14` · `ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FFAMILLY.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QILESRVSRC/FPROVIDER.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FVAT.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8` · `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` · `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9` · `ATU_SRC/QSRVSRC/{FARTICLE,FCOUNTRY,FCUSTOMER,FFAMILLY,FPROVIDER,FVAT}.BND` · `iproj.json` (`objlib`, `curlib`) · structural grep of `ATU_SRC/**` for `bnddir` (12 program lines + the `.BNDDIR` member), for `LOG` as a `*SRVPGM` entry (none), for `RMVBNDDIRE` / a second `CRTBNDDIR` (none)
