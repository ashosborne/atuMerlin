# ord-entry-ord101-c08 — Unused ORD500 prototype and create indicator (dead declarations)

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD101` declares a `Prtord` prototype for `ORD500` and a `create` indicator (06) that are never referenced; the display file defines only `CA03`, `CA12`, `CA05` and a conditioned `PAGEDOWN`. Several more `ORD100`-shaped declarations are dead too (`help`, `prompt`, `confirm`, `morekeys`, `pagedown`, `count`, state constant `lod` on panel 2). Net: **`ORD101` does not print, does not add, does not deliver** — the surface is edit and delete only. This card exists so nobody derives a "print from line maintenance" or "F6 add" behaviour from the declarations.

## Entrypoints

- Declarations only — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:27-28,33-60`
- Function keys actually defined — `ATU_SRC/QDDSSRC/ORD101D.DSPF:10-11,30-31`

## Inputs / outputs / observables

- None. No behaviour is reachable through these symbols.

## Behaviour as implemented

| Symbol | Declared | Referenced | Note |
| --- | --- | --- | --- |
| `Prtord` (`extpgm('ORD500')`) | `:27-28` | never | Same prototype as in `ORD100` / `ORD200` / `ORD201`, copied across. |
| `create` (ind 06) | `:38` | never | No `CF06` in `ORD101D`; `ORD100` uses 06 for "add line". |
| `help` 01, `prompt` 04, `confirm` 08, `morekeys` 24 | `:34,36,39,41` | never | No `HELP`, `CF04`, `CF08`, `CA24` in the DSPF. |
| `pagedown` 25 | `:42` | never | `PAGEDOWN(25)` is `N80`-conditioned and `sflend` is always on after the one-shot load (`c01`), so it never fires. |
| `count` (`3 0`) | `:59` | never | `ORD100` uses it for line numbering; no lines are created here (`c10`). |
| `lod` state for `step02` | `:63` | `pnl02` has no `when step02 = lod` | Harmless; `S02prp` goes straight to `dsp`. |
| `Info` / `lrrn` | `:30-31` | used | Top-of-page RRN for `RRB01` (`c01`). |

The DSPF's `PRINT` keyword (system Print key) is the only "print" available — the screen image, not the order. — `ORD101D.DSPF:7`

## Validation rules found in code

None.

## Edge cases found in code

- **Keys that do something**: `F3`, `F12` (`CA03`, `CA12`, file level), `F5` (`CA05` on `CTL01` only — on `FMT02`, F5 is not enabled and is rejected by the display), Enter, Page Down (system-handled). `F3` on `FMT02` returns to the list (`c03`), on `CTL01` ends the program (`c10`). — `ORD101D.DSPF:10-11,31,83-91,100-103`
- Bound but only partly used copybooks: of `CUSTOMER.RPGLEINC` only `GetCusName`; of `ARTICLE.RPGLEINC` only `GetArtDesc`, `GetArtVatCode`; of `VAT.RPGLEINC` only `CLCVat`, `GetVATRate`. — `ORD101.PGM.RPGLE:15-17,114,223-226,259`

## Dependencies

- None functional. Build-wise the unused `ORD500` prototype creates no binding dependency (dynamic `extpgm`).

## Assumptions / unknowns

- Whether the dead `6=Deliver` legend (`c07`) and these `ORD100`-shaped leftovers indicate `ORD101` was cloned from `ORD100` and trimmed — a code-archaeology note for the SME, not a behaviour.

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:15-17,27-28,30-31,33-60,63,114,202-216,223-226,259` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:7,10-11,30-31,83-91,100-103`
