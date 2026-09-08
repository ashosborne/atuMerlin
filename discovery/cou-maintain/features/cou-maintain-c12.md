# cou-maintain-c12 — FCOUNTRY export surface, binding and callers

| | |
| --- | --- |
| Slice | `cou-maintain` (FCOUNTRY half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`; FCOUNTRY half only) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`FCOUNTRY` is a service program of two `nomain` modules (`COU300`, `COU301`) created with `ACTGRP(*CALLER)` and `EXPORT(*SRCFILE)` from `FCOUNTRY.BND`, which exports **four** symbols under a literal `SIGNATURE('V1')` with no `*PRV` block. It is one of eleven service programs in `SAMPLE.BNDDIR` and is additionally named explicitly in `PRO200.ILEPGM` (`BNDSRVPGM`). Four programs call it: `CUS200` and `PRO200` use `GetCountryName`, `SltCountry`, `ExistCountry`; `CUS250` and `PRO250` use `GetCountryName` only. `GetCountryIso3` has no caller (`c08`). The deferred `COU200` does not use it (reads `COUNTRY` directly).

## Entrypoints

- `CRTSRVPGM SRVPGM(&O/&N) MODULE(COU300 COU301) ACTGRP(*CALLER) EXPORT(*SRCFILE) SRCFILE(*LIBL/QSRVSRC) SRCMBR(*SRVPGM)` — `ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:8-9` (ARCAD-generated, 2022-05-17 — `:4-6`)
- `STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('V1')` / `EXPORT SYMBOL('EXISTCOUNTRY')`, `('GETCOUNTRYISO3')`, `('GETCOUNTRYNAME')`, `('SLTCOUNTRY')` / `ENDPGMEXP` — `ATU_SRC/QSRVSRC/FCOUNTRY.BND:4-9`
- `ADDBNDDIRE BNDDIR(&O/&N) OBJ(… (*LIBL/FCOUNTRY *SRVPGM))` — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`
- `CRTPGM PGM(&O/&N) MODULE(PRO200 PRO202) ENTMOD(PRO200) BNDSRVPGM(XML FCOUNTRY FPARAMETER) ACTGRP(QILE)` — `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9`
- Copybook `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-27` (five prototypes, `c08`)

## Inputs / outputs / observables

| Caller | Binding | Procedures used | Call sites |
| --- | --- | --- | --- |
| `CUS200` (`*PGM`, SQLRPGLE) | `h dftactgrp(*no) bnddir('SAMPLE')` | `GetCountryName`, `SltCountry`, `ExistCountry` | `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:26,35,259,283-284,292` |
| `CUS250` (`*PGM`) | `ctl-opt dftactgrp(*NO) bnddir('SAMPLE')` | `GetCountryName` | `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:4,10,130` |
| `PRO200` (module in `*PGM` PRO200) | no `H` spec; bound by `PRO200.ILEPGM` `BNDSRVPGM(… FCOUNTRY …)` | `GetCountryName`, `SltCountry`, `ExistCountry` | `ATU_SRC/QRPGLESRC/PRO200.RPGLE:11,219,238-239,247`; `PRO200.ILEPGM:8-9` |
| `PRO250` (`*PGM`) | `ctl-opt dftactgrp(*NO) bnddir('SAMPLE')` | `GetCountryName` | `ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE:4,10,136` |

Per-procedure use (`c07`, `c09`): the name getter feeds an output field (`CONAME 30A` on `CUS200D` / `PRO200D`, `COUNTR` on `CUS250D` / `PRO250D`); `SltCountry` is the F4 prompt on the edit panel; `ExistCountry` is the "country must exist" check raising indicator 40 → `ERRMSGID(ERR0002 *LIBL/SAMMSGF)` = `'Country code unknown. Press F4 to select.'` — `ATU_SRC/QDDSSRC/CUS200D.DSPF:131-132,141`, `ATU_SRC/QDDSSRC/PRO200D.DSPF:101-103`, `ATU_SRC/QDDSSRC/CUS250D.DSPF:70`, `ATU_SRC/QDDSSRC/PRO250D.DSPF:65`, `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:11-12`.

## Behaviour as implemented

1. **Export surface = 4 symbols**, listed alphabetically in the binder source. `closeCOUNTRY` exists in `COU300` but is not exported (`c08`). — `FCOUNTRY.BND:5-8`
2. **Literal signature `'V1'`, single `STRPGMEXP` block.** Same policy as `FCUSTOMER`, `FVAT`, `FARTICLE`, `FFAMILLY`; only `FPROVIDER` uses `SIGNATURE(*GEN)` with a `PGMLVL(*PRV)` block. With a literal signature the export list can change without the callers noticing a mismatch at activation — compatibility is by convention (append-only) rather than checked. — `FCOUNTRY.BND:4`; compare `ATU_SRC/QSRVSRC/FPROVIDER.BND:6,28`, `ATU_SRC/QSRVSRC/FVAT.BND:4`
3. **`ACTGRP(*CALLER)`.** The service program runs in the caller's activation group. `COU300`'s buffer/ODP (`c07`) and `COU301`'s files and open display file (`c09`) therefore have the lifetime of that group. `PRO200` is explicitly `ACTGRP(QILE)`; `CUS200`, `CUS250`, `PRO250` compile with `dftactgrp(*no)` and no `actgrp` keyword, so their group is a compile parameter not in source (the `CRTBNDRPG` default is also `QILE`). If they all resolve to `QILE`, one job's `CUS200` and `PRO200` share a single `COUNTRY` cache and ODP set. — `FCOUNTRY.ILESRVPGM:8`, `PRO200.ILEPGM:9`, `CUS200.PGM.SQLRPGLE:26`, `CUS250.PGM.RPGLE:4`, `PRO250.PGM.RPGLE:4`
4. **Two binding routes.** Three callers resolve imports through the `SAMPLE` binding directory; `PRO200.RPGLE` has no `H` spec, so its imports are satisfied only because `PRO200.ILEPGM` names `FCOUNTRY` in `BNDSRVPGM`. Removing that entry (or building `PRO200` with `CRTBNDRPG`) would fail at bind. — `SAMPLE.BNDDIR:8-14`, `PRO200.ILEPGM:8-9`, `PRO200.RPGLE:1-11`
5. **Consumers of the exported behaviour** are the two edit screens and the two display screens; `SltCustomer` (`CUS301`) shows the raw `CUCOUN` code and does not call `FCOUNTRY` (`cus-modules-c06`). — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:41,103`

## Validation rules found in code

None at this level (binding is build-time).

## Edge cases found in code

- **Copybook parameter naming.** Every prototype names its parameter `COID`, the same name as the file field; harmless in a prototype (names are documentation) but a reader may mistake it for the field. — `COUNTRY.RPGLEINC:8,13,18,23`
- **Mixed pass-by conventions in one copybook:** the three `COU300` procedures take `COID … value`; `SltCountry` takes it by reference (`c09`). — `COUNTRY.RPGLEINC:8,13,18,23`
- **Display files compile against `COUNTRY`.** `CUS250D` and `PRO250D` reference `FCOUN/COUNTR *LIBL/COUNTRY` for their name field, and `COU301D` references `COUNTRY` for `COID`/`COUNTR`/`POSCOD`/`POSDES`; `CUSTOMER.PF` / `PROVIDER.PF` reference `COID` through `SAMREF` for `CUCOUN` / `PRCOUN`. The country row layout is therefore a compile-time dependency of four display files and two physical files. — `CUS250D.DSPF:70`, `PRO250D.DSPF:65`, `COU301D.DSPF:25-26,60,65`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:16`, `ATU_SRC/QDDSSRC/PROVIDER.PF:17`
- **No install / build script** creates the service program, the binding directory entry or the `PRO200` program beyond the ARCAD-generated `CRTSRVPGM` / `CRTPGM` / `CRTBNDDIR` members; creation order (modules → srvpgm → bnddir → programs) is build metadata (`srvpgm-supporting`, unbound).
- **`COU200` bypasses the service program** and updates `COUNTRY` directly (`cou-maintain-c13`, deferred), so a cached getter in another activation group can hold a name that `COU200` has just changed (`c07`).

## Dependencies

- `c07`, `c08`, `c09` (what is exported and how it behaves); `srvpgm-supporting` Phase A (binding-directory facts, unbound — cited only)
- Callers' slices: `cus-interactive` (`c04`, `c05`, `c10` documented — they cite this service program as a dependency), `pro-interactive` (unbound)
- The converted CUS vertical's dependency surface `modern/src/shared/fcountry/index.ts` implements `existCountry`, `getCountryName`, `listCountries` for the CUS cards; it is the target-side consumer of `c07`/`c09` and is not changed or widened by this run.

## Assumptions / unknowns

- `needs-SME (build owner)`: activation group of `CUS200`, `CUS250`, `PRO250` (compile parameter); whether the `'V1'` literal has ever been bumped; target library of `FCOUNTRY` relative to the callers (`*LIBL` in the binding directory).
- Whether `PRO200`'s explicit `BNDSRVPGM` is intentional (no `H` spec) or an artefact of an older build is not in source.

## Evidence

`ATU_SRC/QILESRVSRC/FCOUNTRY.ILESRVPGM:4-9` · `ATU_SRC/QSRVSRC/FCOUNTRY.BND:4-9` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` · `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` · `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-27` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:26,35,259,283-284,292` · `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:4,10,130` · `ATU_SRC/QRPGLESRC/PRO200.RPGLE:1-11,219,238-239,247` · `ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE:4,10,136` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:131-132,141` · `ATU_SRC/QDDSSRC/PRO200D.DSPF:101-103` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:70` · `ATU_SRC/QDDSSRC/PRO250D.DSPF:65` · `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:11-12` · `ATU_SRC/QSRVSRC/FPROVIDER.BND:6,28` · `ATU_SRC/QSRVSRC/FVAT.BND:4` · `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:41,103` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:16` · `ATU_SRC/QDDSSRC/PROVIDER.PF:17`
