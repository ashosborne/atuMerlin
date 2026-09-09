# srvpgm-supporting-c04 — `PRO200` and `PAR201` are built by explicit `CRTPGM` members (`QILESRC/*.ILEPGM`) with a `MODULE()` list, explicit `BNDSRVPGM()` and `ACTGRP(QILE)`; the binder lists match the modules' imports exactly

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is build-contract card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Two programs in the estate are not single-module `CRTBNDxxx` programs but ARCAD-generated `CRTPGM` commands in `QILESRC`: **`PRO200`** — `MODULE(PRO200 PRO202) ENTMOD(PRO200) BNDSRVPGM(XML FCOUNTRY FPARAMETER) ACTGRP(QILE)` — and **`PAR201`** — `MODULE(PAR201) ENTMOD(PAR201) BNDSRVPGM(FPARAMETER) ACTGRP(QILE)`. Their module sources carry **no binding keywords at all** (`PRO200.RPGLE` and `PRO202.SQLRPGLE` have no H-spec; `PAR201.CLLE` has no `PGM` header and does its one bound call with `CALLPRC`), so everything about how they bind is in the `.ILEPGM` member. Checking the modules' imports against the `BNDSRVPGM` lists: `PRO200.RPGLE` calls three `FCOUNTRY` procedures, `PRO202.SQLRPGLE` calls `getParm2` (`FPARAMETER`) and seven `xml*` procedures (`XML`) — **exactly** `XML FCOUNTRY FPARAMETER`; `PAR201.CLLE` calls `GETPARM2` — exactly `FPARAMETER`. Neither uses `SAMPLE.BNDDIR`. They are the only two members in the tree that name an activation group, and they name `QILE` — which is also the compiler default for the twelve `bnddir` programs (`c07`), so all ILE programs in the estate most likely share one group per job.

## Entrypoints

- `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` — `CRTPGM PGM(&O/&N) MODULE(PRO200 PRO202) ENTMOD(PRO200) BNDSRVPGM(XML FCOUNTRY FPARAMETER) ACTGRP(QILE)`
- `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9` — `CRTPGM PGM(&O/&N) MODULE(PAR201) ENTMOD(PAR201) BNDSRVPGM(FPARAMETER) ACTGRP(QILE)`
- Module sources: `ATU_SRC/QRPGLESRC/PRO200.RPGLE` (no H-spec; F-specs at `:5-9`, `/COPY COUNTRY` at `:11`), `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE` (no H-spec; `/copy qprotosrc,xml` at `:11`, `/COPY PARAMETER` at `:12`, prototype `pro202` at `:14`), `ATU_SRC/QCLSRC/PAR201.CLLE:4-10` (three `DCL`, `CALLPRC PRC(GETPARM2)`, `CHGVAR`, `WRKLNK`)

## Inputs / outputs / observables

- In: `*MODULE` objects `PRO200`, `PRO202`, `PAR201` (from `CRTRPGMOD` / `CRTSQLRPGI OBJTYPE(*MODULE)` / `CRTCLMOD` — the module-create commands are **not** in the tree; `c09`) and the named `*SRVPGM`s on `*LIBL` at bind time. — `.ILEPGM:8-9`
- Out: `*PGM PRO200` (entry module `PRO200`, second module `PRO202` reached by the bound call `pro202(...)`) and `*PGM PAR201`, both in `&O`, both `ACTGRP(QILE)`. — `.ILEPGM:8-9`
- Observable (build time / `DSPPGM`): `DSPPGM PRO200 DETAIL(*MODULE)` two modules; `DETAIL(*SRVPGM)` three service programs; `DETAIL(*BASIC)` activation group `QILE`. `DSPPGM PAR201` one module, one service program, `QILE` (runtime-confirmable).

## Behaviour as implemented

### `PRO200`

| Module | Source | Imports | Satisfied by |
| --- | --- | --- | --- |
| `PRO200` (entry) | `PRO200.RPGLE` | `GetCountryName` (`:219`, `:239`), `SltCountry` (`:238`), `ExistCountry` (`:247`); `prpOrd(prid)` (`:191`) — prototype `prpord … extproc('PRO202')` (`:16`), a bound call into the second module's main procedure | `FCOUNTRY` (`FCOUNTRY.BND:5-8`); module `PRO202` (`PRO202.SQLRPGLE:14-17` `pro202 pr/pi`, one `like(prid)` parameter) |
| `PRO202` | `PRO202.SQLRPGLE` | `getParm2('PATH':' ')` (`:151`); `xmlopen`, `xmlStrTable`, `XmlStrRec`, `xmladdcol`, `xmlendrec`, `xmlEndTable`, `xmlclose` (`:152-174`) | `FPARAMETER` (`EXPORT(*ALL)`, `GetPARM2` — `PAR300.RPGLE:34`); `XML` (no source — `c02`) |

`BNDSRVPGM(XML FCOUNTRY FPARAMETER)` ↔ imports: one-to-one, nothing missing, nothing extra. — `PRO200.ILEPGM:9`; `PRO200.RPGLE:11,16,191,219,238,239,247`; `PRO202.SQLRPGLE:11-17,151-174`

### `PAR201`

| Module | Source | Imports | Satisfied by |
| --- | --- | --- | --- |
| `PAR201` (entry) | `PAR201.CLLE` | `CALLPRC PRC(GETPARM2) PARM((&CODE *BYVAL) (&SUBCODE *BYVAL)) RTNVAL(&PATH)` (`:7-8`) | `FPARAMETER` (`GetPARM2`, `10A value, 10A value → 100A` — `PAR300.RPGLE:34-37`) |

`BNDSRVPGM(FPARAMETER)` ↔ imports: one-to-one. `&PATH` is `*CHAR 100`, matching `GetPARM2`'s `100A` return; both parameters are passed `*BYVAL`, matching the `value` keyword on the prototype. — `PAR201.ILEPGM:8`; `PAR201.CLLE:4-8`; `PARAMETER.RPGLEINC:13-17`

1. **No `BNDDIR`.** Both `CRTPGM`s resolve every import by explicit `BNDSRVPGM`; `SAMPLE` is not consulted (and `PRO200`'s `XML` entry in `SAMPLE` is therefore redundant for `PRO200` — `c01`). — `.ILEPGM:8-9`
2. **`ENTMOD` equals the first module** in both — the default, spelled out. — `.ILEPGM:8`
3. **Modules have no binding keywords.** `PRO200.RPGLE` starts with F-specs at line 5 (no `h`), `PRO202.SQLRPGLE` likewise; a member compiled without `DFTACTGRP(*NO)` could not make bound calls *as a program*, but as a `*MODULE` the keyword is irrelevant — `CRTRPGMOD` has no `DFTACTGRP`. That is why the `.PGM.` infix is absent from these three file names: the elias / ARCAD convention visible across the tree is `.PGM.` = "compile as a program" (`CRTBNDRPG` / `CRTSQLRPGI *PGM` / `CRTBNDCL`), no infix = "compile as a module" — every member in a `MODULE()` list lacks the infix and every member with the infix is in no `MODULE()` list. — `PRO200.RPGLE:1-11`, `PRO202.SQLRPGLE:1-14`, `PAR201.CLLE:1-10`; `QRPGLESRC` / `QCLSRC` listings vs the ten `MODULE()` lists (`c04`, `c06`, `c08`)
4. **`ACTGRP(QILE)` explicit.** The two programs and the three `*CALLER` service programs they bind therefore run in `QILE` — the same group the compiler assigns by default to a `DFTACTGRP(*NO)` program with no `ACTGRP` (`c07`). Explicit here, implicit for the twelve — same result unless the build overrides the default.
5. **`PRO200` is a two-module program**: `PRO200` (the "Work with Providers" screen) calls the "Prepare purchase order" XML writer as a bound procedure — `prpOrd(prid)` with `extproc('PRO202')`, i.e. the *module's main procedure* by module name — in the same program, not as a separate `*PGM`. `PRO202` is therefore not callable from the menu or from `CALL`; it exists only inside `PRO200`. — `PRO200.RPGLE:16-17,191`; `PRO202.SQLRPGLE:14-17` (`pro202 pr` / `pi`, `id like(prid)`); `PRO200.ILEPGM:8`

## Validation rules found in code

- The binder validates that every import is satisfied by `MODULE()` + `BNDSRVPGM()`; both members satisfy it *if* `XML` exists on `*LIBL` at bind time (`c02`) — `PRO200` cannot be created from this tree alone.
- `PAR201.CLLE`'s `CALLPRC` is typed by the CL compiler from the `PARM(... *BYVAL)` / `RTNVAL` clauses only — there is no prototype in CL; a mismatch with `GetPARM2`'s real signature would surface at run time, not at bind (platform). The types written match (`100A` return, two `10A value` parameters).

## Edge cases found in code

- **Only two named-AG members in the tree.** Everything else either defaults (`c07`) or is OPM / default-AG. `QILE` is a *persistent* named group: it survives program end and is reclaimed only by `RCLACTGRP QILE` or job end — so `PRO200`'s and `PAR201`'s static state, and the `FCOUNTRY` / `FPARAMETER` caches they prime, stay alive for the job (platform; `c07`).
- **`PRO200` depends on a sourceless service program at bind time** (`XML`, `c02`) — the only *program* in the tree with that property (the other consumer of a sourceless service program, `PRO203`, has no binder in source at all — `c05`).
- **`PAR201` is CL calling an RPG procedure** — the only `CALLPRC` in the tree, and the only non-RPG consumer of any service program. `WRKLNK` on the returned `PATH` + `'*'` is the program's whole job (`par-maintain-c07`, documented — not re-derived).
- **Module-create commands are absent.** `CRTRPGMOD PRO200`, `CRTSQLRPGI PRO202 OBJTYPE(*MODULE)`, `CRTCLMOD PAR201` are implied by the `MODULE()` lists and the file-name convention, not present as members; their options (`DBGVIEW`, `OPTION`, SQL `COMMIT`, `DATFMT`…) are build metadata (`c09`).
- **`%TEXT` metadata**: `PRO200.ILEPGM` "Work with Providers", `PAR201.ILEPGM` "Work with generated output" (the menu says "Work with IFS output" — `menu-cmd-shell-c01`, option 83). Cosmetic.

## Dependencies

- `*SRVPGM` `XML` (`c02`, `unknown`), `FCOUNTRY` (`cou-maintain` FCOUNTRY half, documented), `FPARAMETER` (`par-maintain`, documented).
- Programs' behaviour: `pro-interactive` (`PRO200` / `PRO202`, accepted, queue — cited for imports only), `par-maintain-c07` (`PAR201`, documented).
- Activation-group consequence: `c07`.

## Assumptions / unknowns

- Platform: `CRTRPGMOD` has no `DFTACTGRP`; `ENTMOD(*FIRST)` default; named activation groups persist to job end; `CALLPRC` typing — inference, runtime-confirmable.
- The `.PGM.`-infix convention is inferred from the tree's own consistency (no counter-example among 21 `.PGM.` members and 16 `MODULE()` members); elias documentation would confirm it (`c09`).
- Target stance (room, prose only): `PRO200`+`PRO202` is one deployable unit with an internal call — a target may keep the XML writer as a function of the provider module; `PAR201` is a two-line utility (read `PATH`, open a file browser) with no target equivalent beyond "show the output folder".

## Evidence

`ATU_SRC/QILESRC/PRO200.ILEPGM:1-9` · `ATU_SRC/QILESRC/PAR201.ILEPGM:1-9` · `ATU_SRC/QRPGLESRC/PRO200.RPGLE:1-11,16-17,191,219,238,239,247` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:1-17,151-174` · `ATU_SRC/QCLSRC/PAR201.CLLE:1-10` · `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:13-17` · `ATU_SRC/QRPGLESRC/PAR300.RPGLE:34-44` · `ATU_SRC/QSRVSRC/FCOUNTRY.BND:5-8` · `ATU_SRC/QILESRC/` listing (two members) · structural grep of `ATU_SRC/**` for `CALLPRC` (one line), `CRTRPGMOD` / `CRTCLMOD` / `CRTSQLRPGI` (none), `actgrp` (the two `.ILEPGM` lines + eight `*CALLER` lines only)
