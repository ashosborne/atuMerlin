# ord-maintain-ord200-c02 — F6 create order for customer → ORD100C

| | |
| --- | --- |
| Slice | `ord-maintain-ord200` |
| Status | `documented` (as-is behaviour card, Phase B — seam edge) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`F6` on the list calls the CL wrapper `ORD100C(cuid)` synchronously — the customer is preselected — and then rebuilds the list from the database (`step01 = prp`), so a newly created order appears at the top. Any options typed on the same screen are discarded. The twin `ORD201` calls the parameterless `ORD100C2` instead. Order creation itself is `ord-entry-ord100` (documented); this card covers the edge only.

## Entrypoints

- `CF06(06 'Create')` on `CTL01`; legend `F6=Create` on `KEY01` — `ATU_SRC/QDDSSRC/ORD200D.DSPF:33,91`
- `s01key` `when create; newOrder(cuid); step01 = prp;` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:154-156`
- Prototype `NewOrder extpgm('ORD100C')` with one parameter `like(cuid)` — `ORD200.PGM.SQLRPGLE:30-31`

## Inputs / outputs / observables

- In: the program's `cuid` (`5P 0`), passed by reference; `ORD100C` declares `&CUID *DEC LEN(5 0)`. — `ORD200.PGM.SQLRPGLE:18-19`, `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-5`
- Out: whatever `ORD100C` → `CRTORD CUID(&CUID)` writes (`ORDER` header, `DETORD` lines, `ORD701` / `ORD700` trigger effects — owned by `ord-entry-ord100` / `ord-trigger-ord700`). `ORD200` receives no return value. — `ORD100C.PGM.CLLE:12`, `ATU_SRC/QCMDSRC/CRTORD.CMD:4-6`
- Screen: after return the subfile is cleared and reloaded (`c01`); `RRB01` back to 1.

## Behaviour as implemented

1. `F6` is a `CF` key, so field data is returned, but `s01key` tests `create` before falling through to `s01chk`: typed options are never validated or executed on an `F6` pass. — `ORD200.PGM.SQLRPGLE:146-160`
2. `ORD100C`: `DLTF QTEMP/DETORD` (monitored), `CRTDUPOBJ DETORD → QTEMP/DETORD CST(*NO) TRG(*NO)`, `OVRDBF TMPDETORD → QTEMP/DETORD`, `CRTORD CUID(&CUID)`. The staging copy has no constraints and no triggers (`ord-trigger-ord700-c09`). — `ORD100C.PGM.CLLE:6-12`
3. On return `step01 = prp` → `s01prp` redeclares/opens the cursor and `s01lod` reloads all rows. The cursor had been closed at the end of the previous load, so no cursor-already-open condition arises. — `ORD200.PGM.SQLRPGLE:129,156`
4. `cuid` is never modified by `ORD200` (`savId` is declared, never used), so the value passed on is the caller's. — `ORD200.PGM.SQLRPGLE:61`

## Validation rules found in code

None here. Whether `cuid` exists is not checked before the call (`c11`: the `*inzsr` chain to `CUSTOME1` is not tested with `%found`); an unknown customer reaches `CRTORD` with that id.

## Edge cases found in code

- **Twin divergence.** `ORD201` (all customers) calls `ORD100C2` with no parameter (`ORD100` prompts for the customer); `ORD200` preselects. — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:16,155-158`, `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-11`
- **Cancelled create still reloads.** `step01 = prp` is unconditional; an `F12` inside `ORD100` still costs a full reload, with `RRB01` reset to page 1.
- **Override scope.** `OVRDBF` in `ORD100C` is not explicitly scoped or deleted; its lifetime follows the CL program's call level / activation group (build property, not visible in source). Pointer for the build owner; `ord-entry-ord100` owns the create path.
- **`SAMMNU` is not a caller of `ORD200`**; the menu's create path is `ORD100C2` (`ord-entry-ord100-c05`). Cited only.

## Dependencies

- `ORD100C.PGM.CLLE` → `CRTORD.CMD` → `ORD100` (`ord-entry-ord100`, documented) — cited only
- `QTEMP/DETORD` staging copy (`ord-trigger-ord700-c09`) — cited only

## Assumptions / unknowns

- None specific to this edge beyond the override-scope build property above.

## Evidence

`ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:18-19,30-31,61,129,146-160` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:33,91` · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-12` · `ATU_SRC/QCMDSRC/CRTORD.CMD:4-6` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:5-11` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:16,155-158`
