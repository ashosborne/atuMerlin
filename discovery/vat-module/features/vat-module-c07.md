# vat-module-c07 — No maintenance path for VAT rates (absence)

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B — recorded absence) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Nothing in `ATU_SRC` creates, changes, deletes or lists `VATDEF` rows. There is no `VAT200`-style program, no menu option, no CL, no SQL statement and no display file for VAT rates; `VATDEF` is opened by exactly one member (`VAT300`, input-only). The audit columns `VATCREA`, `VATMOD`, `VATMODID` and the delete flag `VATDEL` have no writer, and `VATDESC` has no reader that is ever executed (`c03`). In this tree VAT rates are **static reference data** whose only reader is `FVAT`.

## Entrypoints

- None (absence). The only `VATDEF` file spec in the tree: `ATU_SRC/QRPGLESRC/VAT300.RPGLE:6` (`if`, input only).
- Menu `SAMMNU` groups "Master files", "Reports", "Utilities": options 1–9, 10, 12, 13, 20, 21, 80–84 — none touches VAT. — `ATU_SRC/QPNLSRC/SAMMNU.MENU:82-163`

## Inputs / outputs / observables

- Observable: the rate table cannot be seen or edited from any application screen. Users only ever see a rate as the `VATRATE` output field on an order line (`c03`), and enter a VAT *code* on the article (`ART200`, unvalidated, `c02`).

## Behaviour as implemented (evidence of absence)

1. **File references.** Structural grep of `ATU_SRC/**` for `VATDEF`: `VAT300.RPGLE:6,65-66,71,79-80` (open/chain/close, input only); `VATDEF.PF` itself; three DSPF `REFFLD(FVAT/… *LIBL/VATDEF)` field references (`ORD100D`, `ORD101D`, `ART200D`) that borrow field definitions and do not perform I/O. No `uf`, `o`, `write`, `update`, `delete`, SQL `INSERT`/`UPDATE`/`DELETE`, `CPYF`, `DFU` or `RUNSQL` against `VATDEF`.
2. **Programs.** No member whose name or `%TEXT` refers to VAT other than `VAT300`, `VAT.RPGLEINC`, `FVAT.BND`, `FVAT.ILESRVPGM`. Sibling reference tables do have maintainers (`PAR200` parameters, `COU200` countries, `ART200` articles, `CUS200` customers, `PRO200` providers) — menu options 1, 2, 4, 20, 21. — `SAMMNU.MENU:83-98,135-142`
3. **Selection list.** No `SltVAT*` procedure (contrast `SltArtFam`, `SltCustomer`, `SltArticle`, `SltProvider`); `ART200`'s only `F4` prompt is the family. — `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:271-274`
4. **Audit / delete columns.** `VATDEF.PF` defines `VATCREA` (`L`, "CREATION DATE"), `VATMOD` (`Z`, "LAST MODIFICATION"), `VATMODID` (`10`, "LAS MOD BY"), `VATDEL` (`REFFLD(DLCODE)`); none is referenced by any program except `VATDEL` inside the never-called `ExistVATRate` (`c04`). — `ATU_SRC/QDDSSRC/VATDEF.PF:9-15`, `VAT300.RPGLE:57`
5. **Copybook.** `VAT.RPGLEINC` publishes only read-side prototypes (three getters/predicate, `CLCVat`, `CloseVATDEF`); no `AddVAT`/`UpdVAT`. — `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-28`

## Validation rules found in code

Not applicable — there is no input path to validate. The absence of a maintainer is also why no validation of a VAT *code* exists at the article (`c02`): there is no list to validate against from a screen.

## Edge cases found in code

- **`VATDEF` content is outside the application.** Rows arrive by restore, DFU, SQL or an installer not in the tree (`LOG100` is the only install-style member and it creates the `SAMLOG` user space, not `VATDEF`). — pointer, `log-programs` seed
- **`FAMILLY.FAVATCD` ("DFT VAT CODE") is a second, unused VAT reference**: defined by DDS, never read or written by a program (fam-maintain `c12`, pointer only). — `ATU_SRC/QDDSSRC/FAMILLY.PF:9-10`
- **Effect on `c06`:** with no in-tree writer, cache staleness can only be triggered from outside the application.

## Dependencies

- `VATDEF.PF` — `ATU_SRC/QDDSSRC/VATDEF.PF:4-16`
- `c02`, `c03`, `c04`, `c06` (the behaviours whose consequences depend on this absence).

## Assumptions / unknowns

- **Open question carried in `MANIFEST.yaml`:** how are rates maintained on the box (DFU / STRSQL / restore from a master image)? The SME answer decides whether the target treats `VATDEF` as seed configuration or needs a maintenance screen the legacy never had — a scope decision for the room, not for this card.
- Whether the "unknown-surface" note in `APP_MANIFEST.yaml` (no create/delete for `PROVIDER`, `COUNTRY`, `FAMILLY`, `VATDEF`) is the same finding — yes for `VATDEF`; this card is its citation.

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:6,57,65-66,71,79-80` · `ATU_SRC/QDDSSRC/VATDEF.PF:4-16` · `ATU_SRC/QPROTOSRC/VAT.RPGLEINC:7-28` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:82-163` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:271-274` · `ATU_SRC/QDDSSRC/FAMILLY.PF:9-10` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:120` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:125` · `ATU_SRC/QDDSSRC/ART200D.DSPF:112,115` · structural grep of `ATU_SRC/**` (`VATDEF`, `VATCREA`, `VATMOD`, `VATMODID`, `VATDEL`, `VATDESC`, `VAT`)
