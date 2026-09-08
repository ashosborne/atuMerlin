# ord-entry-ord100-c10 — Entry paths into order creation

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B; call-graph card) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Three callers reach order creation, always through a CL wrapper (`c02`): menu `SAMMNU` option 6 → `ORD100C2` (no customer); `ORD200` `F6` → `ORD100C(cuid)` (customer preselected, so `SltCustomer` is skipped — `c01`); `ORD201` `F6` → `ORD100C2`. No program under `ATU_SRC` calls `ORD100` directly except `ORD100C2`, and `CRTORD` is used only by `ORD100C` (`c09`, needs-SME). Both list programs reload their subfile after the call returns.

## Entrypoints

- `SAMMNU` option 6: `action='cmd call ORD100C2'`, text "Create a Customer Order. ORD100" — `ATU_SRC/QPNLSRC/SAMMNU.MENU:104-106`
- `ORD200`: `NewOrder pr extpgm('ORD100C') x like(cuid)`; `when create; newOrder(cuid); step01 = prp;` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:30-31,154-156`
- `ORD201`: `Neword pr extpgm('ORD100C2')`; `when create; NewOrd(); step01 = prp; exec sql close c1;` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:16,155-158`
- `ORD100C2` → `CALL PGM(ORD100)`; `ORD100C` → `CRTORD CUID(&CUID)` — `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:11`, `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:12`

## Inputs / outputs / observables

- `ORD200` passes its in-scope customer id (`cuid`, 5P 0) by reference to `ORD100C`, which declares `&CUID *DEC(5 0)`. — `ORD200.PGM.SQLRPGLE:31`, `ORD100C.PGM.CLLE:4-5`
- The menu and `ORD201` paths pass nothing → `ORD100` prompts for the customer (`c01`).
- On return, `ORD200`/`ORD201` set `step01 = prp` (list rebuilt, so a newly confirmed order appears); `ORD201` also closes its SQL cursor first. Neither inspects a result — `ORD100` returns nothing.

## Behaviour as implemented

1. Menu option 6 runs `CALL ORD100C2` in the interactive job; `QTEMP` staging and override are set up by the CL (`c02`).
2. `ORD200` (orders for one customer) — `F6` calls `ORD100C` with that customer, then reloads. — `ORD200.PGM.SQLRPGLE:154-156`
3. `ORD201` (order list) — `F6` calls `ORD100C2`, then closes cursor `c1` and reloads. — `ORD201.PGM.SQLRPGLE:155-158`
4. `ORD100C2` calls `ORD100` with no parameters (`%parms = 0`, `c01`).

## Validation rules found in code

None at the call sites; `ORD200` does not check that `cuid` is non-zero (a `0` would make `ORD100` prompt, `c01`).

## Edge cases found in code

- **Same-job re-entry.** Each wrapper run starts with `DLTF QTEMP/DETORD`, so an order abandoned from `ORD200` and a new one started from the menu in the same job do not share staged rows (`c02`, `c13`).
- **Override scope.** The `OVRDBF` is issued inside the CL wrapper; `ORD100` runs one call level deeper, so the override is visible to it. It is not deleted explicitly (`c02`).
- **`help=ord100`** is also referenced by menu options 7–9 (`ART250`, `CUS250`, `PRO250`) — help-panel reuse, not a call path. — `SAMMNU.MENU:109,113,117`
- `ORD200`/`ORD201` are the only RPG callers found; `ORD100` itself has no callers other than `ORD100C2` (structural grep of `ATU_SRC/**`).

## Dependencies

- `ORD200.PGM.SQLRPGLE`, `ORD201.PGM.SQLRPGLE` (slices `ord-maintain-ord200` / `ord-maintain-ord201`, Phase A candidates, unbound) — caller sites only.
- `SAMMNU.MENU` (menu; not a slice).
- `CRTORD.CMD` (`c09`, needs-SME for the command→program binding).

## Assumptions / unknowns

- Whether `ORD100`, `ORD100C` or `CRTORD` are invoked from outside `ATU_SRC` (job schedulers, other menus) — not observable here.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:104-106,109,113,117` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:30-31,154-156` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:16,155-158` · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-5,12` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:11`
