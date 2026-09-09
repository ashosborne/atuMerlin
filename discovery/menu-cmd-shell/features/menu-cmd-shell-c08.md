# menu-cmd-shell-c08 — Shell message plumbing: `dftmsgf=qcpfmsg`, `submsgf=sammsgf` (declared, unused), Enter with no selection → `CPD9817`, `SAMHELP` imported wholesale, `ZMENU` panel id, system name on the top separator

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — panel-group header semantics) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The panel group header and the panel attributes give the shell its framing: `:pnlgrp dftmsgf=qcpfmsg submsgf=sammsgf.` names the system message file as the default source for `msg` references and the application file as the *substitution* file; `:import name='*' pnlgrp=SAMHELP.` pulls every help module in (`c04`); `:var name=Zmenu.` + `panelid=zmenu` display a dialog variable as the panel identifier in the top-left corner; `topsep=sysnam` prints the system name on the top separator line; `Enter='msg cpd9817 qcpfmsg'` sends the system's "option not valid" message when Enter is pressed with no usable selection; `:copyr.` carries the vendor copyright line; `:menu depth='*' scroll=Yes Botsep=none.` sizes the option area. Two facts sharpen Phase A: **`submsgf=sammsgf` has no consumer** — the panel group contains no `msg` reference to any `ERR…` id (its only `msg` is `cpd9817`, explicitly qualified to `qcpfmsg`), so the declaration is inert; and `ZMENU` is never assigned in the source — for a `*MENU` object the menu manager fills it with the menu name (platform convention, inference), which is why the corner shows `SAMMNU` rather than blank. Both message files are unqualified → `*LIBL`.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:1-3` — `%METADATA` / `%TEXT Main menu application SAMPLE`
- `SAMMNU.MENU:4-5` — `:pnlgrp dftmsgf=qcpfmsg` / `submsgf=sammsgf.`
- `SAMMNU.MENU:6-7` — `:copyr.` / `(C) Copyright Arcad Software, 2016.`
- `SAMMNU.MENU:8-9` — `:import name='*'` / `pnlgrp=SAMHELP.`
- `SAMMNU.MENU:10` — `:var name=Zmenu.`
- `SAMMNU.MENU:71-77` — `:panel name=SAMPLE help=h keyl=key01 Enter='msg cpd9817 qcpfmsg' panelid=zmenu topsep=sysnam.` / `Arcad Sample Application`
- `SAMMNU.MENU:78-81` — `:menu depth='*' scroll=Yes Botsep=none.` / `:Topinst.Select one of the following:`
- `SAMMNU.MENU:168,171-172` — `:emenu.` / `:epanel.` / `:epnlgrp.`

## Inputs / outputs / observables

- In: Enter with an empty or non-option selection (`Enter=` action); nothing else is input to this plumbing.
- Out: message `CPD9817` from `QCPFMSG` on the menu's message line (text is the system's — not in the tree). — `SAMMNU.MENU:74`
- Observable framing: panel id (`ZMENU` value) top-left; system name on the top separator; title `Arcad Sample Application` centred; instruction line `Select one of the following:`; no bottom separator (`Botsep=none`); copyright text is metadata (`:copyr.` is not displayed on the panel — platform). — `SAMMNU.MENU:6-7,75-81`

## Behaviour as implemented

1. `dftmsgf=qcpfmsg`: any `msg <id>` in the panel group without an explicit file is looked up in `QCPFMSG`. The one `msg` in the file qualifies the file anyway (`msg cpd9817 qcpfmsg`), so the default is never exercised. — `SAMMNU.MENU:4,74`
2. `submsgf=sammsgf`: names the file for message ids used as **substitution text** (`&msg(…)` / `msg` in text areas). **No such reference exists** in `SAMMNU` or `SAMHELP` (grep `ERR` / `msg(` → none), so the declaration binds nothing. It does document intent: the shell *expected* to use application messages. — `SAMMNU.MENU:5`; structural grep
3. `:import name='*' pnlgrp=SAMHELP.`: all help modules of `SAMHELP` become resolvable by name (`c04` for the mis-mappings). — `SAMMNU.MENU:8-9`
4. `Enter='msg cpd9817 qcpfmsg'`: when the user presses Enter and UIM has no option to act on (empty command line, or a number that is not an option — `c01` gaps), the named message is issued. Typing an invalid option number is the normal way to hit it. — `SAMMNU.MENU:74`
5. `panelid=zmenu` / `:var name=Zmenu.`: the dialog variable is declared with no `:varrcd`, no class, no initial value and no program to set it; a `*MENU` object's manager supplies the menu name (platform, inference). — `SAMMNU.MENU:10,75`
6. `topsep=sysnam`: the top separator shows the system name (standard `GO` menu look). — `SAMMNU.MENU:76`
7. `:menu depth='*'` gives the menu area all remaining rows; `scroll=Yes` allows Page Up/Down (`c03`); `Botsep=none` suppresses the separator above the command line. — `SAMMNU.MENU:78-80`

## Validation rules found in code

Not applicable (framing only). The only "rule" is UIM's own option validation, whose failure message is the `Enter=` action above.

## Edge cases found in code

- **`submsgf` declared, never used** — an inert attribute. If a future edit added `&msg(ERR2001)`-style text it would resolve; today nothing does. — `SAMMNU.MENU:5`
- **`CPD9817` is the generic "option not valid" message** for every wrong entry (11, 14–19, 22–79, 85–89, >90, non-numeric junk that is not a command) — there is no application-specific wording. Its exact text is the system's (`QCPFMSG`, not in the tree). — `SAMMNU.MENU:74`
- **Panel `help=h` is undefined** (`c04`): F1 on the background hits the one broken help name that is *not* on an option. — `SAMMNU.MENU:72`
- **`%TEXT Main menu application SAMPLE` / panel `name=SAMPLE` / title `Arcad Sample Application`** — the object is the vendor's sample; the panel name `SAMPLE` is what a `RTNPNL`-style caller would see (none exists in the tree). — `SAMMNU.MENU:2,71,77`
- **Copyright 2016 in the source, message file extracted 2022** (`c05`) — two generations of the same sample; cosmetic.
- **Both message files resolve on `*LIBL`** — `QCPFMSG` is always there (`QSYS`); `SAMMSGF` must be on the interactive job's library list for the DSPF `ERRMSGID`s to display (`c05`), though the menu itself never fetches from it. — `SAMMNU.MENU:4-5`

## Dependencies

- `SAMHELP.PNLGRP` (`c04`), `SAMMSGF` (`c05`, declaration only), `QCPFMSG` (system).
- `key01` (`c03`), the option list (`c01`).

## Assumptions / unknowns

- Platform: `dftmsgf` / `submsgf` semantics; `Enter=` action timing; `ZMENU` filled by the menu manager for `CRTMNU TYPE(*UIM)` objects; `:copyr.` not rendered; `topsep=sysnam` — inference / runtime-confirmable (a screen capture of the menu settles the corner id, the separator and the exact `CPD9817` text in one go).
- Build: `CRTMNU MENU(SAMMNU) TYPE(*UIM) SRCFILE(QPNLSRC)` is the step that turns this source into the object — no `CRTMNU` in the tree (`c04`).
- Target stance (room, prose only): none of this is behaviour; the *title* and *instruction* strings are the only text a target menu might reuse.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:1-10,71-81,168,171-172` · `ATU_SRC/QPNLSRC/SAMHELP.PNLGRP:4,21` · structural grep `ATU_SRC/QPNLSRC/**` (i) for `msg` (the two `msgf` attributes, `cmd dspmsg` on F6, and the one `msg` action `SAMMNU.MENU:74`) and for `ERR` (none) · structural grep `ATU_SRC/**` for `CRTMNU` (none)
