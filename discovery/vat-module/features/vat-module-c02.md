# vat-module-c02 — Unknown VAT code → rate 0 → zero VAT, silently

| | |
| --- | --- |
| Slice | `vat-module` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

When the requested code has no `VATDEF` row, `chainVATDEF` clears the whole record buffer before the `chain`, so a miss leaves `VATRATE = 0`, `VATDESC = *blanks`, `VATDEL = *blank`. `ClcVAT` then returns `0` and `GetVATRate` returns `0`. No indicator, message or error is raised, and **no caller in `ATU_SRC` calls `ExistVATRate` before computing** — an article carrying a VAT code that is not in `VATDEF` gets `ODTOTVAT = ODTOT` on every order line and a `.00` VAT rate on the screen. The only in-tree place a VAT code is entered (`ART200` article maintenance) does not validate it.

## Entrypoints

- `chainVATDEF` miss path — `ATU_SRC/QRPGLESRC/VAT300.RPGLE:68-72`
- Every exported procedure calls it first: `GetVATRate` `:23`, `GetVATDesc` `:32`, `ClcVAT` `:45`, `ExistVATRate` `:56`
- Callers that consume the zero (call sites only): `ORD100.PGM.RPGLE:267-269,294-295`; `ORD101.PGM.RPGLE:224-226,259-260`; `ART250.PGM.SQLRPGLE:154`
- Where an unknown code can enter: `ART200` FMT02 input field `ARVATCD` (no validation, no prompt) — `ATU_SRC/QDDSSRC/ART200D.DSPF:107,111`, `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:280-291,297-301`

## Inputs / outputs / observables

- In: `P_VATCODE` not equal to the code currently in the buffer and not present as `VATDEF.VATCODE`. — `VAT300.RPGLE:68-71`
- Out: buffer fields all cleared (`clear *all FVAT`), `%found(VATDEF)` off. `GetVATRate → 0.00`, `GetVATDesc → *blanks`, `ClcVAT → 0.00`, `ExistVATRate → *off`. — `VAT300.RPGLE:24,33,46-47,57,70`
- Observable in the callers: `vat = 0`, `odtotvat = odtot`, `vatRate` displayed as `.00`; `ART250` shows `VATINCL` blank/zero. No `ERRMSG`, no indicator. — `ORD100.PGM.RPGLE:267-269`, `ATU_SRC/QDDSSRC/ORD100D.DSPF:118-121`, `ORD101.PGM.RPGLE:224-226`, `ATU_SRC/QDDSSRC/ORD101D.DSPF:123-126`, `ATU_SRC/QDDSSRC/ART250D.DSPF:63`

## Behaviour as implemented

1. `if P_VATCODE <> VATCODE` — the request differs from the buffered code. — `VAT300.RPGLE:68`
2. `K_VATCODE = P_VATCODE; clear *all FVAT; chain kf VATDEF;` — the buffer is cleared **before** the read, so a miss leaves zeros/blanks rather than the previous hit's values. — `VAT300.RPGLE:69-71`
3. The calling procedure returns the cleared field or computes with it: `ClcVAT` computes `(net × 0) / 100 = 0`. — `VAT300.RPGLE:46-47`
4. Because the buffer's `VATCODE` is now blank, the next call with the **same unknown code** compares unequal again and re-reads — misses are not cached (a blank request code is the exception, `c05`). — `VAT300.RPGLE:68,70`

## Validation rules found in code

None in `FVAT`. `ExistVATRate` exists (`c04`) but has no caller. In `ART200`, the check subroutine validates only the description (`ardesc = ' '`) and the family (`existArtFam`); `ARVATCD` is written to `ARTICLE` as typed (any single character, including blank). — `ART200.PGM.SQLRPGLE:280-291,297-306`, `ART200D.DSPF:111`

## Edge cases found in code

- **Blank VAT code** (new article left blank in `ART200`, or `GetArtVatCode` for an unknown article): resolves to 0 without ever reading `VATDEF` on the first call, because the buffer starts blank (`c05`). — `VAT300.RPGLE:68`, `ATU_SRC/QRPGLESRC/ART300.RPGLE:83-91`
- **Soft-deleted code** (`VATDEL = 'X'`) is **not** a miss: the rate is still applied (`c04`). — `VAT300.RPGLE:45-47` vs `:57`
- **No F4 prompt for the VAT code.** `ART200` FMT02 `F4=Prompt` handles the family only (`sltArtFam`); no VAT selection procedure exists in `ATU_SRC`. — `ART200.PGM.SQLRPGLE:271-274`, `ART200D.DSPF:75,105`
- **The family default VAT code is never applied.** `FAMILLY.FAVATCD` ("DFT VAT CODE") exists in DDS but no program reads it (fam-maintain `c12`, pointer only), so a blank `ARVATCD` stays blank. — `ATU_SRC/QDDSSRC/FAMILLY.PF:9-10`
- **Persistence.** `ORD100` stores `ODTOTVAT = ODTOT` on the `DETORD` row; nothing downstream can tell a zero-rated line from an unknown-code line. — `ORD100.PGM.RPGLE:267-268`, `ATU_SRC/QDDSSRC/DETORD.PF:17-20`

## Dependencies

- `VATDEF.PF` keyed by `VATCODE`. — `ATU_SRC/QDDSSRC/VATDEF.PF:6,16`
- `c05` (cache / open), `c04` (unused existence check), `c08` (code comes from the article).
- `ART200` cited only as the entry surface for `ARVATCD`; the `art-interactive` slice is not deepened here.

## Assumptions / unknowns

- Whether unknown codes actually occur in the reference data cannot be known from source (no rate maintenance exists, `c07`).
- **needs-SME question carried in `MANIFEST.yaml`:** should a bad VAT code be an error in the target rather than silent zero VAT? The as-is answer is "silent zero"; a target that raises instead changes observable totals.

## Evidence

`ATU_SRC/QRPGLESRC/VAT300.RPGLE:19-59,61-74` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:267-269,294-295` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:224-226,259-260` · `ATU_SRC/QRPGLESRC/ART250.PGM.SQLRPGLE:154` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:271-274,280-291,297-306` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:83-91` · `ATU_SRC/QDDSSRC/ART200D.DSPF:75,105-115` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:118-121` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:123-126` · `ATU_SRC/QDDSSRC/ART250D.DSPF:63` · `ATU_SRC/QDDSSRC/VATDEF.PF:6,16` · `ATU_SRC/QDDSSRC/FAMILLY.PF:9-10` · `ATU_SRC/QDDSSRC/DETORD.PF:17-20`
