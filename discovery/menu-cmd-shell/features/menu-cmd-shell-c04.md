# menu-cmd-shell-c04 — Help mapping is broken or placeholder: three undefined help names (`h`, `srt200`, `ord100`), one orphan module (`ART200`), one wrong topic (option 3 → `cus200`), and every defined body is "Text" / "Help not available"

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — nothing to preserve) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMMNU` imports every help module from `SAMHELP` (`:import name='*' pnlgrp=SAMHELP.`) and references help by name on the panel, on the key list and on each option. `SAMHELP` defines **five** modules — `ART200` ("Work with Articles"), `CUS200` ("Work with Customers"), `PRO200` ("Work with Provider"), `NOHELP` ("Help"), `help` ("Help") — whose bodies are one paragraph each: `Text` for the first three and `Help not available` for the last two. Cross-checking the 36 `help=` references in `SAMMNU` (1 panel, 1 key list + 14 keys, 20 options) against those five names: the **panel** (`help=h`) and options **1** (`help=srt200`, a typo for `ART200`) and **6–9** (`help=ord100`) name modules that **do not exist**; option **3** (`ORD201`) points at the *defined but wrong* topic `cus200`; options 4 and 5 share `pro200`; options 10–90 and all 14 keys point at the placeholders `nohelp` / `help`. The `ART200` module is therefore **never referenced** (orphan) — the one option that should use it uses `srt200`. Net: no help text exists anywhere in the shell that a target would preserve; the mapping is also inconsistent enough that F1 on five of the twenty options (1, 6–9) and on the panel background fails at run time rather than showing a placeholder. Phase A sharpened: adds the panel-level `h`, the orphan module, and the option-3 mis-target.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:8-9` — `:import name='*' pnlgrp=SAMHELP.`
- `SAMMNU.MENU:72` — panel `help=h`
- `SAMMNU.MENU:12,14,17,22,27,32,37,42,47,52,56,59,62,65,68` — key list `HELP=help` and every `:KEYI … help=help`
- `SAMMNU.MENU:85` — option 1 `help=srt200`; `:89` — option 2 `help=cus200`; `:93` — option 3 `help=cus200`; `:97,101` — options 4, 5 `help=pro200`; `:105,109,113,117` — options 6–9 `help=ord100`; `:123,127,131,137,141,145,149,153,157,161,166` — options 10–90 `help=nohelp`
- `ATU_SRC/QPNLSRC/SAMHELP.PNLGRP:5-7` — `:help name=ART200.Work with Articles` / `:p.Text`; `:8-10` — `CUS200` / `Text`; `:11-13` — `PRO200.Work with Provider` / `Text`; `:14-16` — `NOHELP.Help` / `Help not available`; `:17-19` — `help.Help` / `Help not available`

## Inputs / outputs / observables

- In: F1 / Help key with the cursor on an option line, on a key legend, or elsewhere on the panel. — `SAMMNU.MENU:13-15,58-60`
- Out (defined names): a help window titled "Work with Articles" / "Work with Customers" / "Work with Provider" containing the word `Text`, or titled "Help" containing `Help not available`. — `SAMHELP.PNLGRP:5-19`
- Out (undefined names `h`, `srt200`, `ord100`): UIM cannot find the module at display time → its own "help not available / not found" error (platform, inference; the exact message id is a runtime fact). — `SAMMNU.MENU:72,85,105-117`

## Behaviour as implemented

The reference-to-definition map, as-is:

| Where | `help=` | Defined in `SAMHELP`? | Body shown |
| --- | --- | --- | --- |
| panel `SAMPLE` (background) | `h` | **no** | run-time error |
| key list + all 14 keys | `help` | yes | `Help not available` |
| opt 1 `ART200` | `srt200` | **no** (typo; `ART200` exists, unused) | run-time error |
| opt 2 `CUS200` | `cus200` | yes | `Text` |
| opt 3 `ORD201` | `cus200` | yes — **wrong topic** ("Work with Customers") | `Text` |
| opt 4 `PRO200`, opt 5 `PRO201` | `pro200` | yes | `Text` |
| opt 6 `ORD100C2`, 7 `ART250`, 8 `CUS250`, 9 `PRO250` | `ord100` | **no** | run-time error |
| opt 10, 12, 13, 20, 21, 80–84, 90 | `nohelp` | yes | `Help not available` |

— `SAMMNU.MENU:72,85-166`, `SAMHELP.PNLGRP:5-19`

1. Compile time: because the import is `name='*'`, the UIM compiler cannot resolve help names against the imported panel group and accepts any name (platform — this is why `h`, `srt200`, `ord100` compile). — `SAMMNU.MENU:8-9`
2. Run time: F1 resolves the name in the current panel group, then in the imported `SAMHELP`; the five defined names display, the three undefined ones fail. — `SAMHELP.PNLGRP:4-21`
3. UIM names are case-insensitive: `cus200` ↔ `CUS200`, `help` ↔ `help`. — platform

## Validation rules found in code

Not applicable.

## Edge cases found in code

- **Orphan module `ART200`**: defined (`SAMHELP.PNLGRP:5-7`) but referenced by nothing, because option 1 says `srt200` — the typo is one keystroke (`s` for `a`). — `SAMMNU.MENU:85`
- **Option 3 gets the customers topic** for the orders program — a copy-paste from option 2 (inference); the title would read "Work with Customers" over the `ORD201` line. — `SAMMNU.MENU:91-94`
- **`ord100` for four unrelated options** (order entry, article-by-id, customer-by-id, provider-by-id) — block copy of the option-6 line (inference). — `SAMMNU.MENU:103-118`
- **`NOHELP` and `help` are functionally identical** (both "Help" / "Help not available") — two names for one placeholder. — `SAMHELP.PNLGRP:14-19`
- **The `SAMHELP` titles are the only "content"**: "Work with Provider" (singular) vs the menu's "Work with Providers" — cosmetic (`c09` family).
- No `:help` module carries `:xh3`, `:link`, `:isch` or any structure — three words of body in total (`Text` ×3, `Help not available` ×2).

## Dependencies

- `SAMHELP.PNLGRP` (this slice), imported wholesale (`c08`).

## Assumptions / unknowns

- Platform: `:import name='*'` deferring resolution; run-time behaviour on an undefined help name; case folding — inference / runtime-confirmable. Whether the ARCAD build compiles `SAMMNU` with `CRTMNU TYPE(*UIM)` and whether that build step reports the unresolved names as warnings is outside the tree (no `CRTMNU` / `CRTPNLGRP` anywhere in `ATU_SRC`).
- Target stance (room, prose only): there is **no help content to carry**. If the target wants contextual help, it is new content; the five titles are all that could be reused, and three of them duplicate the menu option titles.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:8-9,12-69,72,85-166` · `ATU_SRC/QPNLSRC/SAMHELP.PNLGRP:4-21` · structural grep `ATU_SRC/**` for `CRTMNU`, `CRTPNLGRP` (none)
