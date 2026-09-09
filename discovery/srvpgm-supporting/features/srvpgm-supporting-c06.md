# srvpgm-supporting-c06 — Export and signature contract of the eight service programs: six binder sources (five hand-fixed `'V1'`, one ARCAD `*GEN` + `*PRV`), two `EXPORT(*ALL)`; every `.BND` matches its modules' `export` keywords exactly; `EXPORT(*ALL)` exports 5 (`FPARAMETER`) and 1 (`LOG`), not every procedure

| | |
| --- | --- |
| Slice | `srvpgm-supporting` |
| Status | `documented` (as-is build-contract card, Phase B — the API surface of the getter layer as the binder sees it) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Eight `CRTSRVPGM` members exist. Six use `EXPORT(*SRCFILE) SRCFILE(*LIBL/QSRVSRC) SRCMBR(*SRVPGM)` and have a binder source of the same name in `QSRVSRC`: **`FARTICLE`, `FCOUNTRY`, `FCUSTOMER`, `FFAMILLY`, `FVAT` hard-code `SIGNATURE('V1')`** with a single `*CURRENT` block; **`FPROVIDER`** is ARCAD-generated with `PGMLVL(*CURRENT) LVLCHK(*YES) SIGNATURE(*GEN)` plus a `PGMLVL(*PRV)` block that preserves the 13-symbol export list of 2016-10-25 (before `SLTPROVIDER` was added and the object was renamed from `PROVIDER`). Two — **`FPARAMETER`** and **`LOG`** — use `EXPORT(*ALL)` and have no `.BND`. Comparing every `.BND` `SYMBOL` against the `export` keyword on the modules' P-specs: **all 51 symbols match, none missing, none extra** (10 / 4 / 15 / 4 / 14 / 4). For the two `EXPORT(*ALL)` service programs the export list is whatever the modules export: `PAR300` exports **five** (`GetPARM1`–`GetPARM5`; `chainPARAMETER` and `closePARAMETER` have no `export` keyword and are module-local), `LOG300` exports **one** (`AddLogEntry`; `init` is local) — so `FPARAMETER` exports 5, not 7 (this corrects `par-maintain-c10`, see MORNING_BRIEF §7). Every copybook in `QPROTOSRC` also advertises a `Close*` procedure that **no** service program exports (seven names) and `ARTICLE.RPGLEINC` advertises `GetArtInfo`, exported only by the unbound module `ART302`; nothing in the tree calls a `Close*`, and `ART250` calls `GetArtInfo` (`c03`).

## Entrypoints

- `ATU_SRC/QILESRVSRC/FARTICLE.ILESRVPGM:8-9`, `FCOUNTRY.ILESRVPGM:8-9`, `FCUSTOMER.ILESRVPGM:8-9`, `FFAMILLY.ILESRVPGM:8-9`, `FPROVIDER.ILESRVPGM:8-9`, `FVAT.ILESRVPGM:8-9` — `EXPORT(*SRCFILE) SRCFILE(*LIBL/QSRVSRC) SRCMBR(*SRVPGM)`
- `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8`, `LOG.ILESRVPGM:8` — `EXPORT(*ALL)`
- `ATU_SRC/QSRVSRC/FARTICLE.BND:4-15`, `FCOUNTRY.BND:4-9`, `FCUSTOMER.BND:4-20`, `FFAMILLY.BND:4-9`, `FVAT.BND:4-9` — `STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('V1')` … `ENDPGMEXP`
- `ATU_SRC/QSRVSRC/FPROVIDER.BND:5-23` (`*CURRENT`, `LVLCHK(*YES) SIGNATURE(*GEN)`, 13 "Old" + 1 "New" symbol), `:25-45` (`PGMLVL(*PRV)`, 13 symbols, comment `*MODULE PRO300 NEWSAMPLE 25/10/16 17:20:41`)
- Module `export` keywords: `ART300.RPGLE:19,30,42,53,63,73,83,93,104` · `ART301.SQLRPGLE:54` · `COU300.RPGLE:19,29,40` · `COU301.RPGLE:53` · `CUS300.RPGLE:19,29,39,49,59,69,79,89,99,109,119,129,152,163` · `CUS301.SQLRPGLE:54` · `FAM300.RPGLE:19,29,40` · `FAM301.RPGLE:53` · `PRO300.RPGLE:19,29,39,49,59,69,79,89,99,109,119,129,140` · `PRO301.SQLRPGLE:54` · `VAT300.RPGLE:19,28,38,52` · `PAR300.RPGLE:22,34,46,58,70` · `LOG300.RPGLE:18`
- Module procedures **without** `export`: `ART300.RPGLE:114,129` · `COU300.RPGLE:50,65` · `CUS300.RPGLE:173,188` · `FAM300.RPGLE:50,65` · `PRO300.RPGLE:150,165` · `VAT300.RPGLE:61,76` · `PAR300.RPGLE:82,100` · `LOG300.RPGLE:37`

## Inputs / outputs / observables

- In: the modules' `export` keywords (what *can* be exported) and the `.BND` `SYMBOL` list (what *is* exported, in what order, under what signature).
- Out: the service program's export table and signature(s), checked by every bound program at activation (platform).
- Observable (build time / `DSPSRVPGM`): `DSPSRVPGM <name> DETAIL(*PROCEXP)` lists exactly the symbols below; `DETAIL(*SIGNATURE)` shows `'V1'` (padded) for five, one generated signature for `FPARAMETER` / `LOG`, and **two** signatures (current + previous) for `FPROVIDER` (runtime-confirmable).

## Behaviour as implemented

### Export cross-check — `.BND` symbols vs module `export` keywords

| Service program | Modules | Module exports | `.BND` symbols | Match | Signature | Unexported procedures (module-local) |
| --- | --- | ---: | ---: | --- | --- | --- |
| `FARTICLE` | `ART300`, `ART301` | 9 + 1 | 10 | exact | `'V1'` | `chainARTICLE1`, `closeARTICLE1` |
| `FCOUNTRY` | `COU300`, `COU301` | 3 + 1 | 4 | exact | `'V1'` | `chainCOUNTRY`, `closeCOUNTRY` |
| `FCUSTOMER` | `CUS300`, `CUS301` | 14 + 1 | 15 | exact | `'V1'` | `chainCUSTOME1`, `closeCUSTOME1` |
| `FFAMILLY` | `FAM300`, `FAM301` | 3 + 1 | 4 | exact | `'V1'` | `chainFAMILLY`, `closeFAMILLY` |
| `FPROVIDER` | `PRO300`, `PRO301` | 13 + 1 | 14 (`*CURRENT`); 13 (`*PRV`) | exact | `*GEN`, `LVLCHK(*YES)`, one `*PRV` level | `chainPROVIDE1`, `closePROVIDE1` |
| `FVAT` | `VAT300` | 4 | 4 | exact | `'V1'` | `chainVATDEF`, `closeVATDEF` |
| `FPARAMETER` | `PAR300` | **5** | — (`EXPORT(*ALL)`) | n/a — exports = module exports = 5 | generated | `chainPARAMETER`, `closePARAMETER` |
| `LOG` | `LOG300` | **1** | — (`EXPORT(*ALL)`) | n/a — exports = 1 | generated | `init` |

Symbol lists (as in the `.BND`, upper case; order as written):
`FARTICLE`: `EXISTART GETARTDESC GETARTFAM GETARTMINSTOCK GETARTREFSALPRICE GETARTSTOCK GETARTSTOCKPRICE GETARTVATCODE ISARTDELETED SLTARTICLE` (alphabetical; `SLTARTICLE` from `ART301`).
`FCOUNTRY`: `EXISTCOUNTRY GETCOUNTRYISO3 GETCOUNTRYNAME SLTCOUNTRY`.
`FCUSTOMER`: `EXISTCUS GETCUSADRLINE1 GETCUSADRLINE2 GETCUSADRLINE3 GETCUSCITY GETCUSCOUNTRY GETCUSCREDIT GETCUSLIMCREDIT GETCUSMAIL GETCUSNAME GETCUSPHONE GETCUSVAT GETCUSZIP ISCUSDELETED SLTCUSTOMER`.
`FFAMILLY`: `GETARTFAMDESC EXISTARTFAM ISARTFAMDELETED SLTARTFAM` (**source order, not alphabetical** — the only one).
`FPROVIDER` `*CURRENT`: `EXISTPROVIDER GETPROADR1 GETPROADR2 GETPROADR3 GETPROCITY GETPROCONT GETPROCOUNTRY GETPROMAIL GETPRONAME GETPROPHONE GETPROVAT GETPROZIP ISPRODELETED` ("Old exported symbols") + `SLTPROVIDER` ("New exported symbols", appended last); `*PRV`: the same 13 without `SLTPROVIDER`.
`FVAT`: `CLCVAT EXISTVATRATE GETVATDESC GETVATRATE`.
`FPARAMETER` (`*ALL`, source order): `GETPARM1 GETPARM2 GETPARM3 GETPARM4 GETPARM5`.
`LOG` (`*ALL`): `ADDLOGENTRY`.
— `.BND` lines above; module lines above

### Steps

1. **`EXPORT(*SRCFILE)`** — the binder exports exactly the `SYMBOL`s of the `*CURRENT` block, in that order, and stamps the service program with the block's signature. Each symbol must be exported by one of the `MODULE()` members (P-spec `export`), otherwise `CRTSRVPGM` fails. All six lists satisfy that (table). — `.BND` files; module `export` lines
2. **`SIGNATURE('V1')` (five)** — a fixed, hand-written signature. A bound program records `'V1'` and the *slot number* of each import; at activation only `'V1'` is compared. Adding a symbol **at the end** of the list keeps old callers valid; inserting, removing or reordering silently rebinds old callers to the wrong slot (platform — inference). None of the five lists shows any versioning history — no `*PRV` block, no comments — so whether they were ever changed after the first build cannot be seen. — `FARTICLE.BND:4`, `FCOUNTRY.BND:4`, `FCUSTOMER.BND:4`, `FFAMILLY.BND:4`, `FVAT.BND:4`
3. **`FPROVIDER` — the ARCAD pattern.** `%TEXT Generated by ARCAD (signature by version *VERS)`; `/* Signature for 01.02.13 version */`; `LVLCHK(*YES) SIGNATURE(*GEN)` generates the current signature from the export list; the `*PRV` block re-creates the 2016-10-25 signature (13 symbols, module `PRO300`, application `NEWSAMPLE`) so programs bound before `SLTPROVIDER` (from `PRO301`) existed still activate. The comment `PROVIDER renommé en FPROVIDER` records that the object was once named `PROVIDER`. This is the only service program whose contract history is visible. — `FPROVIDER.BND:2,5-6,21-22,25-30`
4. **`EXPORT(*ALL)` (two)** — exports every symbol *the modules export*; a procedure without the `export` keyword is not a module export and therefore cannot be a service-program export (platform rule). `PAR300.RPGLE` puts `export` on `GetPARM1`–`GetPARM5` (`:22,34,46,58,70`) and **not** on `chainPARAMETER` (`:82`) or `closePARAMETER` (`:100`); `LOG300.RPGLE` puts it on `AddLogEntry` (`:18`) and not on `init` (`:37`). Hence 5 and 1. Signature generated from those lists; no `*PRV`; any change to the export set changes the signature and invalidates bound programs until they are re-bound. — cited lines
5. **Copybooks over-advertise.** Every getter copybook ends with a `Close*` prototype — `CloseARTICLE1` (`ARTICLE.RPGLEINC:64`), `CloseCOUNTRY` (`COUNTRY:27`), `CloseCUSTOME1` (`CUSTOMER:84`), `CloseFAMILLY` (`FAMILLY:22`), `ClosePARAMETER` (`PARAMETER:37`), `ClosePROVIDE1` (`PROVIDER:75`), `CloseVATDEF` (`VAT:28`) — and none of the seven is exported by any service program. A program calling one would compile and then fail to bind (unresolved import). No program in the tree calls any of them. `ARTICLE.RPGLEINC:59` also advertises `GetArtInfo`, exported by `ART302` (`export` at `ART302.SQLRPGLE:11`) — a module in no `MODULE()` list — and `ART250` does call it (`c03`). — copybook lines; structural grep for `Close*(` (none) and `GetArtInfo(` (`ART250:156`)
6. **No two service programs export the same symbol** (57 exported names, all distinct), so import resolution never depends on binding-directory order (`c01`). — the lists above

## Validation rules found in code

- Build time: each `.BND` symbol must be a module export — satisfied. `LVLCHK(*YES)` on `FPROVIDER` is the default (signature checked at activation); the five `'V1'` binders do not say `LVLCHK`, so the default `*YES` applies to them too (platform).
- Run time: the signature check is the only validation; a `'V1'` match says nothing about the export list's content (step 2).

## Edge cases found in code

- **`FPARAMETER` exports 5, `LOG` exports 1** — not "all procedures". The distinction matters for the target's API surface only in the negative: nobody can call `chainPARAMETER` / `closePARAMETER` / `init` from outside, so the cache-priming and close paths are not part of any contract (they are unreachable, not "reachable by anyone with a prototype"). `par-maintain-c10` read this the other way; corrected there this run (MORNING_BRIEF §7).
- **`FFAMILLY.BND` is in source order**, the other four `'V1'` lists are alphabetical — consistent with `FFAMILLY` being edited by hand at some point (`GETARTFAMDESC` first). With a fixed `'V1'` signature, the *order* is the binary contract; a well-meant re-sort would break every bound program without any signature violation being reported (platform).
- **`FPROVIDER`'s `*PRV` block is dated 25/10/16** and names module `PRO300` and application `NEWSAMPLE`; the `*CURRENT` block is "for 01.02.13 version" — an ARCAD version number, not a date. The tree carries no other version history for any object (`c09`).
- **`FFAMILLY.ILESRVPGM` `%TEXT` reads "Functions Country"** — a copy-paste of `FCOUNTRY`'s text; object description wrong, no functional effect. — `FFAMILLY.ILESRVPGM:2` vs `FCOUNTRY.ILESRVPGM:2`
- **Seven `Close*` prototypes with no export behind them** (step 5). Latent: a future caller trying to "reset" a getter cache by calling `Close*` would fail at bind, not at run time; and even if exported, the `close*` bodies close the file without clearing the buffered key (`par-maintain-c10`, `vat-module-c06` mechanism) — so they would not reset the cache anyway.
- **`GetArtInfo` — one prototype, one caller, no exporter in the tree** (`c03` edge case; `art-modules`, held).
- **Two export mechanisms, no policy.** Five hand-fixed, one ARCAD-versioned, two `*ALL`. The versioned one is the only one that can evolve safely; the `*ALL` ones cannot add a procedure without breaking callers; the `'V1'` ones can add-at-end silently.

## Dependencies

- Modules and their procedure behaviour: `art-modules` (held), `cou-maintain` FCOUNTRY half (documented), `cus-modules` (documented), `fam-maintain` (held), `pro-modules` (accepted, queue), `vat-module` (documented), `par-maintain` (documented), `log-programs` (documented) — cited for the `export` keyword lines only.
- Consumers: `c03`, `c04`, `c05`.
- Copybooks: the nine `QPROTOSRC/*.RPGLEINC` (prototype lines cited).

## Assumptions / unknowns

- Platform: `EXPORT(*ALL)` = module exports; fixed-signature slot semantics; `LVLCHK` default `*YES`; `*PRV` block semantics — inference, runtime-confirmable with `DSPSRVPGM DETAIL(*PROCEXP)` / `DETAIL(*SIGNATURE)`.
- Whether the five `'V1'` lists were ever changed after their first build is a build-history question (needs-SME, build owner) — nothing in source can show it.
- Target stance (room, prose only — `SME_BRIEF.md`): the **57 exported names** are the complete callable surface of the getter layer as the estate actually uses it; the target's module API should be derived from the *imports* (`c03`–`c05`), not from the copybooks (which over-advertise) and not from "every procedure in the module". Do not copy the fixed-signature compatibility model.

## Evidence

`ATU_SRC/QILESRVSRC/{FARTICLE,FCOUNTRY,FCUSTOMER,FFAMILLY,FPROVIDER,FVAT}.ILESRVPGM:8-9` · `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8` · `ATU_SRC/QILESRVSRC/FFAMILLY.ILESRVPGM:2` · `ATU_SRC/QSRVSRC/FARTICLE.BND:4-15` · `FCOUNTRY.BND:4-9` · `FCUSTOMER.BND:4-20` · `FFAMILLY.BND:4-9` · `FPROVIDER.BND:2,5-23,25-45` · `FVAT.BND:4-9` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:19,30,42,53,63,73,83,93,104,114,129` · `ART301.SQLRPGLE:54` · `ART302.SQLRPGLE:11` · `COU300.RPGLE:19,29,40,50,65` · `COU301.RPGLE:53` · `CUS300.RPGLE:19-163 (14 export P-specs),173,188` · `CUS301.SQLRPGLE:54` · `FAM300.RPGLE:19,29,40,50,65` · `FAM301.RPGLE:53` · `PRO300.RPGLE:19-140 (13 export P-specs),150,165` · `PRO301.SQLRPGLE:54` · `VAT300.RPGLE:19,28,38,52,61,76` · `PAR300.RPGLE:22,34,46,58,70,82,100` · `LOG300.RPGLE:18,37` · `ATU_SRC/QPROTOSRC/ARTICLE.RPGLEINC:59,64` · `COUNTRY.RPGLEINC:27` · `CUSTOMER.RPGLEINC:84` · `FAMILLY.RPGLEINC:22` · `PARAMETER.RPGLEINC:37` · `PROVIDER.RPGLEINC:75` · `VAT.RPGLEINC:28` · structural grep of `ATU_SRC/**` for the seven `Close*` call forms (none), `GetArtInfo(` (`ART250.PGM.SQLRPGLE:156`), `.BND` members (six)
