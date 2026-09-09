# log-programs-c09 — Reading the log: menu option 84 runs ADSPUSRSPC, a command not in the tree; no in-tree reader of SAMLOG

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — blind spot) |
| Confidence | `inferred` (the menu action and the absence of any reader are `observed-in-code`; what `ADSPUSRSPC` shows, and whether anybody uses it, are outside the tree) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound as `inferred`, kept `inferred`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The only way the application offers to *see* the log is `SAMMNU` option **84** "Display Application log", whose action is `cmd adspusrspc samlog` — an unqualified command call resolved on `*LIBL` at run time. `ADSPUSRSPC` has no source in `ATU_SRC` (`QCMDSRC` holds other commands; grep finds the menu line only), so what it renders — raw bytes, or lines split on `' ***'`, or the binary cursor decoded — is unknown from source; the `A` prefix and the ARCAD-generated build members suggest an ARCAD utility command (inference). Nothing else reads `SAMLOG`: `QUSPTRUS` is called only by the two writers (`LOG100`, `LOG300`), no program, CL or SQL object references the space, and `menu-cmd-shell` records option 84 among the three menu options that reach objects absent from the tree (with `CUSQRY`/`ARTQRY`, options 12/13). Consequence for the estate: the log is **write-only from the application's point of view** — whether operators ever look at it, and how, cannot be answered from source. If a reader were to be written from this slice's cards: decode offset 0 as the byte count used (`c02`), take bytes `7 … pos−1`, split on `' ***'` (`c03`); expect trailing blanks after the last line (600-byte write) and `X'00'` beyond.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:159-162` — `:menui option=84` / `action='cmd adspusrspc samlog'` / `help=nohelp.` / `Display Application log`
- Absence: grep `ATU_SRC/**` (i) for `adspusrspc` / `dspusrspc` → the menu line only; grep for `SAMLOG` → `LOG100.PGM.RPGLE:20`, `LOG300.RPGLE:4,41`, `SAMMNU.MENU:160` only; `ATU_SRC/QCMDSRC/` has no `ADSPUSRSPC.CMD`
- Menu grouping: option 84 sits in the Utilities group with 80–83 (`ORD900`, `ORD901`, `ART801`, `PAR201`) — `SAMMNU.MENU:143-162` (`menu-cmd-shell`)

## Inputs / outputs / observables

- In: none from the menu (no parameters beyond the object name; no library). — `SAMMNU.MENU:160`
- Out: whatever `ADSPUSRSPC` displays — unknown. If it dumps the space: `X'0000xxxx'` `***` then the concatenated lines, no line breaks, blanks after the last entry, then nulls (`c02`, `c03`).
- Observable: `CPD0030 Command ADSPUSRSPC in library *LIBL not found` if the utility library is not on `*LIBL` (inference); `CPF9801` if `SAMLOG` was never created (`c06`).

## Behaviour as implemented

1. Menu option 84 → `QCMDEXC`-style command execution of `adspusrspc samlog` (UIM menu `cmd` action). — `SAMMNU.MENU:159-162`
2. Command resolution on `*LIBL`; object `SAMLOG` resolved by the command (presumably `*LIBL` as well — inference).
3. No in-tree post-processing, no export, no print.

## Validation rules found in code

Not applicable.

## Edge cases found in code

- **No help** (`help=nohelp`) — unlike the master-file options which have help panels. — `SAMMNU.MENU:161`
- **Blind spot is two-sided:** the *reader* is outside the tree and the *format* has no separator other than `' ***'` (`c03`); if `ADSPUSRSPC` is a generic hex/character dump, the log is readable but ugly; if it is `LOG`-aware, its parsing rules are unknown.
- **Truncated long messages** (`c03`: >437 characters lose `' ***'`) would glue two lines together in any separator-based reader — not reachable from the in-tree caller.
- **Log stopped (`c04`) or never started (`c06`)** is not distinguishable from "nothing happened" for a reader — no heartbeat, no count.

## Dependencies

- `menu-cmd-shell` (accepted, next in queue) owns `SAMMNU`; cited for option 84 only.
- `c02` / `c03` (format a reader must decode), `c04` / `c06` (why it may show nothing).

## Assumptions / unknowns

- needs-SME (ops / ARCAD): what is `ADSPUSRSPC`, which library provides it, does anyone use option 84? Is `SAMLOG` content ever needed after the fact (audit, support)?
- Target: the ORD vertical stores the lines as rows in `samlog` (`modern/db/schema.sql:132-140`) — a plain `SELECT` replaces option 84; no reader is converted, and the pack is not widened here. Whether a "Display Application log" screen exists in the target is a room decision.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:143-162` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:4,41` · `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:20` · structural grep `ATU_SRC/**` for `adspusrspc`, `dspusrspc`, `SAMLOG`; `ATU_SRC/QCMDSRC/` listing (absence)
