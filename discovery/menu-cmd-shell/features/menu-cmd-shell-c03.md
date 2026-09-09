# menu-cmd-shell-c03 — Command line and function keys on the menu: `cmdline size=long`; F4 prompt, F9 retrieve, F6 DSPMSG, F10 DSPJOBLOG, F14 WRKSBMJOB *USER; F3/F12 leave; page keys, Print, Help

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — shell capability outside any program) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Below the option list the panel places a **long command line** (`:cmdline size=long.` with prompt text `Selection or command`): the same input field takes an option number *or* any CL command, so a user on this menu can run whatever the command analyzer lets their profile run — the menu adds no restriction of its own. The key list `key01` wires **14 keys**: F1/Help → help, F3 `exit set`, F4 `PROMPT` (prompt the typed command), F6 `cmd dspmsg`, F9 `retrieve` (recall previous commands), F10 `cmd dspjoblog`, F12 `cancel set`, F14 `cmd wrksbmjob *user`, F24 `MOREKEYS`, Enter, Page Down / Page Up (the menu is `scroll=Yes`), Print. Eight keys carry legend text (`F3=Exit`, `F4=Prompt`, `F6=Messages`, `F9=Retrieve`, `F10=Job log`, `F12=Cancel`, `F14=Submitted jobs`, `F24=More keys`) with `PRIORITY` values that order them across the two legend rows. Every key's help is the `help` module — which says "Help not available" (`c04`). These are IBM i operator conveniences (messages, job log, submitted jobs, command retrieval), not application behaviour; the SME_BRIEF question is whether a target UI should offer any equivalent.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:11-12` — `:KEYL NAME=key01 HELP=help.`
- `SAMMNU.MENU:13-15` — `F1` `ACTION=HELP`; `:58-60` — `KEY=HELP` `ACTION=HELP`
- `SAMMNU.MENU:16-20` — `F3` `PRIORITY=25` `ACTION='exit set'` / `F3=Exit`
- `SAMMNU.MENU:21-25` — `F4` `PRIORITY=30` `ACTION=PROMPT` / `F4=Prompt`
- `SAMMNU.MENU:26-30` — `F6` `PRIORITY=25` `ACTION='cmd dspmsg'` / `F6=Messages`
- `SAMMNU.MENU:31-35` — `F9` `ACTION=retrieve` `PRIORITY=30` / `F9=Retrieve`
- `SAMMNU.MENU:36-40` — `F10` `PRIORITY=40` `ACTION='cmd dspjoblog'` / `F10=Job log`
- `SAMMNU.MENU:41-45` — `F12` `PRIORITY=30` `ACTION='cancel set'` / `F12=Cancel`
- `SAMMNU.MENU:46-50` — `F14` `PRIORITY=25` `ACTION='cmd wrksbmjob *user'` / `F14=Submitted jobs`
- `SAMMNU.MENU:51-54` — `F24` `ACTION=MOREKEYS` / `F24=More keys`
- `SAMMNU.MENU:55-57` — `ENTER` `ACTION=ENTER`; `:61-66` — `PAGEDOWN` / `PAGEUP`; `:67-69` — `PRINT` `ACTION=PRINT`; `:70` — `:EKEYL.`
- `SAMMNU.MENU:73` — `keyl=key01` on the panel; `:78-80` — `:menu depth='*' scroll=Yes Botsep=none.`
- `SAMMNU.MENU:169-170` — `:cmdline size=long.` / `Selection or command`

## Inputs / outputs / observables

- In: text on the command line (option number or command); a function key.
- Out: for `cmd …` keys the named system command runs and returns to the menu; `PROMPT` opens the command prompter for the typed text; `retrieve` recalls earlier command-line entries; `exit set` / `cancel set` end the menu; `MOREKEYS` cycles the legend; `PAGEUP` / `PAGEDOWN` scroll the option list if it does not fit; `PRINT` prints the screen. — `SAMMNU.MENU:13-69`
- Observable: legend rows show the eight texted keys; keys without text (F1, Enter, Help, Page keys, Print) are active but unlisted. — `SAMMNU.MENU:20,25,30,35,40,45,50,54`

## Behaviour as implemented

1. `:cmdline size=long.` — a full-width command line; `Selection or command` is its prompt. UIM parses a leading number as a menu selection and anything else as a command (menu semantics — platform). — `SAMMNU.MENU:169-170`
2. `F4 ACTION=PROMPT` prompts the command currently on the line (or, on an empty line, the major command menu — platform). — `SAMMNU.MENU:21-24`
3. `F9 ACTION=retrieve` recalls the previous command-line entry (repeated presses walk back). — `SAMMNU.MENU:31-34`
4. `F6`, `F10`, `F14` run `DSPMSG`, `DSPJOBLOG`, `WRKSBMJOB *USER` (submitted jobs of the current user) with defaults — no parameters beyond `*user`. — `SAMMNU.MENU:26-29,36-39,46-49`
5. `F3 exit set` and `F12 cancel set` both set the exit / cancel condition, which for a menu means leaving it (the difference matters only to a calling program's `RTNPNT`/`RTNMNU` handling — platform). — `SAMMNU.MENU:16-19,41-44`
6. `PRIORITY` (25 for F3/F6/F14, 30 for F4/F9/F12, 40 for F10, none for F24) controls which key texts appear first when the legend does not fit and where the row break falls — layout only. — `SAMMNU.MENU:18,23,28,34,38,43,48`
7. `scroll=Yes` + Page keys: the 20 options plus three group headings and separators exceed one 24-line screen only if the terminal is 24×80 with the legend and command line taken into account; whether paging is actually needed is a rendering fact (`depth='*'` lets the menu take all available rows). — `SAMMNU.MENU:78-80,61-66`

## Validation rules found in code

None in the menu. The command line is **not** restricted (no `:cmdline` size other than `long`, no `LMTCPB`-style attribute in the panel — that is a user-profile attribute the system enforces, platform). Whether a given user can run commands from here is decided by their profile, not by `SAMMNU`.

## Edge cases found in code

- **Every key has `help=help` → "Help not available"** (`SAMHELP.PNLGRP:17-19`); F1 and the Help key are wired but deliver nothing (`c04`).
- **Duplicate legend positions:** F3, F6 and F14 share `PRIORITY=25`; F4, F9 and F12 share `30` — order within a priority is by definition order (platform). Cosmetic.
- **`F14=Submitted jobs` is user-scoped** (`*user`), not job- or system-scoped; **`F6=Messages`** shows the user's message queue (`DSPMSG` default `*WRKUSR` — platform); **`F10=Job log`** shows the current interactive job's log. All three are diagnostic; none of the documented application programs sends messages to the user's message queue, so `F6` will normally show only system messages (inference).
- **Print key is enabled** (`ACTION=PRINT`) — a user can print the menu screen; irrelevant to behaviour, noted for completeness.
- **No F5=Refresh, no F13/F16/F22** — the menu offers fewer keys than the standard `GO` menus (which also have F13 Information Assistant, F16 System main menu, F23 Set initial menu); none of those exist here. Cosmetic / navigation.

## Dependencies

- `SAMHELP` `help` module (`c04`).
- System commands `DSPMSG`, `DSPJOBLOG`, `WRKSBMJOB`, the UIM prompter and retrieve buffer — platform.

## Assumptions / unknowns

- Platform: UIM menu command-line semantics (number = selection, otherwise command), `PROMPT` / `retrieve` behaviour, `exit set` vs `cancel set`, `LMTCPB` enforcement by the command analyzer, `PRIORITY` ordering — inference / runtime-confirmable.
- needs-SME (room, `SME_BRIEF` Q2, carried from Phase A): should the target expose any equivalent of the command line and the F6/F10/F14 operator keys, or are they IBM i-isms to drop? Recommendation (prose only): drop the command line; treat "messages / job log / submitted jobs" as platform observability, not application features.
- Security note, as-is: the menu grants no authority and removes none; if the box relies on users having `LMTCPB(*YES)`, the command line is inert for them; if not, this screen is an unrestricted command entry point. Box fact.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:11-70,73,78-80,169-170` · `ATU_SRC/QPNLSRC/SAMHELP.PNLGRP:17-19`
