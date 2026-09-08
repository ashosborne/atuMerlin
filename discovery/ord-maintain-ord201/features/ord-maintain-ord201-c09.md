# ord-maintain-ord201-c09 — Menu entry option 3

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — entry point) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMMNU` option 3 "Work with Customer Orders" runs `cmd call ORD201` — the **only** caller of `ORD201` under `ATU_SRC` (no CL wrapper, command or program call site). `ORD201` takes no parameters; `F3` and `F12` both end it identically. The menu item's `help=` points at `cus200` (the customer screen's help topic), and the screen's panel id literal is `'ORD200-1'` — the twin's id. `ORD200`, by contrast, is reachable only from `CUS200` option 5 (`ord-maintain-ord200-c10`).

## Entrypoints

- `:menui option=3 action='cmd call ORD201' help=cus200.` / text "Work with Customer Orders … ORD201" — `ATU_SRC/QPNLSRC/SAMMNU.MENU:91-94`
- Program mainline: no `*entry` / procedure interface; `pnl01` while `panel = 1`, else `pnl00` — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:69-74`

## Inputs / outputs / observables

- In: none. `User` (`inz(*user)`) is captured and never used. — `ORD201.PGM.SQLRPGLE:55`
- Out: none passed back; the menu redisplays after return.
- Screen identity: `'ORD200-1'` at 1/2 (`COLOR(BLU)`), title `'Work with Customer Orders'` at 1/27 — `ATU_SRC/QDDSSRC/ORD201D.DSPF:50-51,56-57`

## Behaviour as implemented

1. Menu `call ORD201` → the program starts at `*inzsr` (`c11`), then cycles through `pnl01` steps until `panel = 0`. — `ORD201.PGM.SQLRPGLE:69-91,285-288`
2. `F3` (`CA03`, `exit`): `panel = 0; step01 = prp;` → next cycle `pnl00` → `close c1; *inlr = *on` → return to the menu. — `ORD201.PGM.SQLRPGLE:146-148,291-294`
3. `F12` (`CA12`, `cancel`): `step01 = prp; panel = panel - 1;` → `panel = 0` → same `pnl00` path. There is only one panel, so Cancel = Exit. — `ORD201.PGM.SQLRPGLE:149-151`
4. No confirmation on exit; no "options pending" check — typed options are simply abandoned.

## Validation rules found in code

None.

## Edge cases found in code

- **Help mis-mapped.** `help=cus200` — option 3's Help shows the `CUS200` topic (`menu-cmd-shell` records the help map as broken/placeholder; `SAMHELP` topics are stubs). — `SAMMNU.MENU:93`, `discovery/menu-cmd-shell/MANIFEST.yaml` (pointer)
- **Panel id reuse.** Both list screens announce themselves as `ORD200-1`; a user or a screen-scraper cannot tell the twins apart by the id, only by the presence of the customer header (`ORD200`) versus the customer line per row (`ORD201`). — `ORD201D.DSPF:50` vs `ATU_SRC/QDDSSRC/ORD200D.DSPF:46`
- **Activation group.** `dftactgrp(*no)` without `ACTGRP` → inferred `QILE` (`CRTSQLRPGI` default); the menu's `call` runs it there. All four callees (`ORD100C2`→`ORD100`, `ORD101`, `ORD202`, `ORD500`) are called by name via `*LIBL`. Build owner to confirm. — `ORD201.PGM.SQLRPGLE:5,16-25`
- **Menu is the only route.** Structural grep of `ATU_SRC/**` for `ORD201` finds `SAMMNU.MENU:92,94` and the program's own members only; `CUS200` calls `ORD200`, never `ORD201`. — absence evidence, `overnight/CONTEXT_GATE.md`
- **`PRINT` keyword.** The Print key is enabled on the display file, so the list can be printed as a screen image; unrelated to option 6. — `ORD201D.DSPF:10`
- **Unlike `ORD200`, no parameter to get wrong.** `ORD200` with an unknown `cuid` shows a blank header and empty list (`ord-maintain-ord200-c11`); `ORD201` has no such failure mode.

## Dependencies

- `SAMMNU.MENU` (`menu-cmd-shell`, unbound — cited only) — `SAMMNU.MENU:91-94`

## Assumptions / unknowns

- Activation group is inferred from the `H` spec; a `CRTSQLRPGI` build option could differ. Build owner.
- Whether the target keeps one list (all orders, filterable by customer) or two entry points is an ORD-pack question, not a Discovery one; recorded.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:91-94` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:5,16-25,55,69-91,146-151,285-294` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:8-10,50-51,56-57` · `ATU_SRC/QDDSSRC/ORD200D.DSPF:46`
