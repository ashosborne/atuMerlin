# CANDIDATES — vat-module (Phase A, unbound)

Seed: `FVAT` service program = `VAT300`. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| vat-module-c01 | `ClcVAT(code, net)` = `%dech((net × VATRATE) / 100 : 9 : 2)` — intermediate `11P 4`, result half-adjusted to 2 decimals; `net` and result are `9P 2` by value | `QRPGLESRC/VAT300.RPGLE:38-49`; `QPROTOSRC/VAT.RPGLEINC:22-24` | observed-in-code | The one arithmetic rule; used on every order line |
| vat-module-c02 | Unknown VAT code → `VATRATE = 0` (buffer cleared on miss) → `ClcVAT` returns 0 and `GetVATRate` returns 0 **silently**; no `ExistVATRate` call precedes any `ClcVAT` in the tree | `VAT300.RPGLE:61-74` (`clear *all FVAT` then chain), `:19-26`, `:38-49`; callers `ORD100.PGM.RPGLE:267,269,294`, `ORD101.PGM.RPGLE:224,226,259`, `ART250.PGM.SQLRPGLE:154` | observed-in-code | Silent-zero rule — an article with a bad VAT code gets zero VAT |
| vat-module-c03 | `GetVATRate(code)` returns `VATRATE` (4P 2); `GetVATDesc(code)` returns `VATDESC` (20A) — **no caller** for `GetVATDesc` | `VAT300.RPGLE:19-35`; grep = none for `GetVATDesc` | observed-in-code | Getters |
| vat-module-c04 | `ExistVATRate(code)` = `%found(VATDEF) and VATDEL <> 'X'` — respects the delete flag, but has **no caller** in `ATU_SRC` | `VAT300.RPGLE:52-59`; grep = none | observed-in-code | Unused predicate (contrast with `ExistArtFam`, fam-maintain-c02) |
| vat-module-c05 | Lazy open + last-key cache (`chainVATDEF`, 1A key); `closeVATDEF` present but not exported | `VAT300.RPGLE:6`, `:61-83`; `FVAT.BND:4-9` | observed-in-code | Same pattern as the other srvpgms |
| vat-module-c06 | Rates are read once per activation group and cached by code; a rate change in `VATDEF` is not seen by a running job until it asks for a different code and comes back | `VAT300.RPGLE:66-73` | observed-in-code | Cache staleness (matters for rate changes) |
| vat-module-c07 | **No maintenance path for VAT rates**: no `VAT200`, no menu option, no writer of `VATDEF` anywhere in `ATU_SRC`; `VATDEL`, `VATMOD`, `VATMODID`, `VATCREA` have no writer (absence) | grep `ATU_SRC` for `fvat` writers = none; `QPNLSRC/SAMMNU.MENU:82-163`; `QDDSSRC/VATDEF.PF:5-16` | observed-in-code | Recorded absence — rates are static reference data here |
| vat-module-c08 | VAT code lives on the article (`ARVATCD`); every caller obtains it via `GetArtVatCode(arid)` before calling `FVAT`, so `FVAT` never sees an article id — two srvpgm hops per line | `ORD100.PGM.RPGLE:267-269`; `ORD101.PGM.RPGLE:224-226`; `ART250.PGM.SQLRPGLE:154`; `QDDSSRC/ARTICLE.PF:32` | observed-in-code | Call-graph shape |
| vat-module-c09 | Export surface = 4 symbols (`CLCVAT`, `EXISTVATRATE`, `GETVATDESC`, `GETVATRATE`), `SIGNATURE('V1')`, `ACTGRP(*CALLER)`; listed in `SAMPLE.BNDDIR` | `FVAT.BND:4-9`; `FVAT.ILESRVPGM:8-9`; `SAMPLE.BNDDIR:13-14` | observed-in-code | Binding facts |
| vat-module-c10 | `VAT.RPGLEINC` declares `CLCVat`'s code parameter as `1` (no `A`) while `VAT300` declares `1A` — same storage, compiles, but a copybook / module drift | `VAT.RPGLEINC:22-23`; `VAT300.RPGLE:39-40` | observed-in-code | Trivial source drift |

## Deferred recommendations (prose only)

- c01 / c02 together are the rule a target must reproduce exactly (half-adjust to 2 dp; unknown code → 0). Recommend **accept** both as the core of this slice even though `FVAT` is not itself in the CUS PACK — `ORD100` documented cards (`ord-entry-ord100-c03`, `c04`) already cite `CLCVat` and will need this rule when ORD is converted.
- c07: no rate maintenance means the target can treat VAT rates as **seed data / configuration**.
- c06: cache staleness is a runtime property; recommend `needs-SME` only if rates change while jobs run in the real deployment.
