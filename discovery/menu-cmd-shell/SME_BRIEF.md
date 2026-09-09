# SME_BRIEF — menu-cmd-shell (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-09 (night residual wave — Ash authorized, Field recorded; `BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`); 9/9 accepted candidates documented by the Pack B conveyor on 2026-09-09 (run 15). The one `inferred` row (`c02`, the out-of-tree targets) was accepted by the bind and is carded with its `inferred` confidence kept — the menu actions and the absence from the tree are exact, what the objects do is outside it (same practice as `par-maintain-c08`, `log-programs-c04/c06/c09/c10`). **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; residual-wave slices are document-only per the bind record.

## What was documented

The application shell: `SAMMNU` (UIM menu — 20 options in three groups, a long command line, 14 wired keys), `SAMHELP` (five placeholder help modules), `SAMMSGF` (12 messages, nine live) and the `CVTSPLPDF` command definition (14 parameters, processing program bound outside the tree). Cards live in `features/menu-cmd-shell-c01.md` … `c09.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). This is an **adapter layer**, not a behaviour seam; the Phase A recommendation — `reject` as a conversion slice, use `c01` as the navigation spec and `c05` as the message resource — is unchanged and is the room's to take.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c06` — **`ERR0001` is live; the dead set is three, not four.** `ART200D.DSPF:98` carries `ERRMSGID(ERR0001 *LIBL/SAMMSGF 40)` on the family field `ARTIFA`, and `ART200:286-288` raises indicator 40 (`errFamilly`) when `existArtFam(artifa)` fails. Phase A had read the adjacent literal `ERRMSG('A description is mandatory' 41)` on `ARDESC` (`:90`) and stopped. Dead: `ERR0003`, `ERR0004`, `ERR0005` (article / customer / provider "unknown") — superseded by the generic `ERR0103` "Code &1 Unknown." on the three by-id screens (inference). 12 ids, 12 `ERRMSGID` sites in 9 DSPFs, no programmatic sender anywhere. **Phase A corrected.**
- `c09` — **the `PRO250` "Display Article" mismatch is not user-visible.** `PRO250D.DSPF:24` puts `Provider by Id` on row 1; only the `%TEXT` comments (`PRO250.PGM.RPGLE:2`, `PRO250D.DSPF:2`) say "Display Article" — wrong *object text* (`DSPOBJD`), right *screen text*. The genuinely visible differences, from a full 20-option comparison: option 6's label `ORD100` while the action calls `ORD100C2`; option 7 "Article by id" vs the `ART250D` heading "Article by Code"; option 82's label `SQLPRC:ART801` vs the procedure's SQL name `UPDATE_ON_CUS_ORD_QTY`; option 10 `PRO203` under "Reports" though it is a selection screen. Six targets have blank `%TEXT`. **Phase A sharpened.**
- `c04` — **three undefined help names, not two, plus an orphan and a mis-target.** Panel `help=h` (F1 on the background) is undefined alongside `srt200` (option 1) and `ord100` (options 6–9); the `SAMHELP` module `ART200` is therefore never referenced; option 3 (`ORD201`) points at the *defined but wrong* `cus200`. 36 `help=` references, five modules, three words of body in total. Nothing to preserve. **Phase A sharpened.**
- `c01` — **every one of the 16 in-tree targets is parameterless**, so the 16 `cmd call` actions are well-formed (no `PI` / `dcl-pi` / `*ENTRY` / `PROCEDURE DIVISION USING` / `PGM PARM` anywhere among them); `ORD100`'s `cuid options(*nopass)` is why option 6 goes through `ORD100C2`. Option 82 calls the `SPECIFIC`-named `*PGM` of an SQL procedure. Options 80/81/82 are unguarded destructive resets; the menu checks no authority. Nothing in the tree invokes the menu (no `GO`, no initial program). `COU200` is the only RPG III target.
- `c07` — **"no `PGM()` in source" is the normal shape of command source**: the processing program is `CRTCMD PGM()`, a build parameter, and **no `CRTCMD` exists anywhere in `ATU_SRC`** — the blind spot is the build, and `CRTORD` shares it (`ord-entry-ord100-c09`). The three cross-parameter dependencies are `PMTCTL` (prompting only); with no `DEP`, the analyzer enforces no cross-parameter rule. `TOSTMF` is `TYPE(*NAME)` — simple-name rules on a stream-file name (inference). Default `STMFCODPAG(1250)` is not overridden by `ORD500C`. **Phase A sharpened.**
- `c08` — **`submsgf=sammsgf` has no consumer**: the only `msg` reference in either panel group is `cpd9817`, explicitly qualified to `qcpfmsg`; no `ERR` id appears in `QPNLSRC`. `ZMENU` is never assigned in source (menu manager supplies the name — inference). **Phase A sharpened.**
- `c05` — as Phase A, with the consumer map: 12 `ERRMSGID` sites, `FMT` widths matching the DSPF `ERRDATA` fields (6A; 45A = 30 + 15), all `SEV(0)`, no second-level text, `CCSID(297)` texts in a `CCSID(65535)` file; mandatory-field messages are DSPF *literals*, not catalogue entries.
- `c03` — as Phase A, spelled out: 14 keys, eight with legend text, `PRIORITY` ordering, every key's help = "Help not available"; no `LMTCPB`-style restriction in the panel — the profile governs the command line.
- `c02` — as Phase A: `CUSQRY` / `ARTQRY` / `CUSQRYFMT` / `ADSPUSRSPC` absent; menu titles are the only specification; the "Reports" group holds zero documentable reports. Option 84 → `log-programs-c09` (documented), not re-derived.

Phase A statements corrected: `c06` (four dead → three; `ERR0001` live). Sharpened: `c09` (comment-level, not screen-level, mismatch; full register), `c04` (`h`, orphan `ART200`, option 3), `c07` (build-step blind spot; `PMTCTL` ≠ `DEP`), `c08` (inert `submsgf`), `c01` (parameterless confirmation; `SPECIFIC` call). No Phase A rule about what a valid operation does was wrong.

**Existing target counterparts (not widened here):** none for the shell itself. The CUS and ORD verticals (converted and verified under `WAIVED_PATHFINDER`) reproduce the customer-rule and order-quantity texts inside their own validation and print their own PDFs; `log-programs-c09` already cites the ORD vertical's `samlog` table as option 84's counterpart. None of that was read for this slice, checked, or extended.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c09`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggested: `c06` `ART200D.DSPF:98`, `c09` `PRO250D.DSPF:24`, `c01` the parameterless check).
- [ ] **Room — is the menu a slice?** Recommendation unchanged: `reject` as a conversion slice; `c01`'s table is the navigation spec for the target UI; decide which options the target carries at all (80–84 resets / log, 90 signoff).
- [ ] **Room — messages:** carry the nine live `SAMMSGF` texts as a resource keyed by id (`c05`); drop or reserve `ERR0003`–`ERR0005` (`c06`); decide "Familly" once.
- [ ] `c02` (`inferred`) — **source owner:** supply `CUSQRY`, `ARTQRY`, `CUSQRYFMT` (QM query / form source) and name the library for them and `ADSPUSRSPC`. Until then two reports and the log viewer are unspecifiable from source and options 12/13/84 stay `unknown`.
- [ ] `c07` — **ops / build owner:** `DSPCMD CVTSPLPDF` on the box → processing program and product; confirm how `CRTCMD` (for both `CVTSPLPDF` and `CRTORD`) is run in the ARCAD build; effect of default `STMFCODPAG(1250)`.
- [ ] `c03` — room: command line and F6/F10/F14 operator keys in the target — equivalent or drop? (Recommendation: drop.) Box: do application users run with `LMTCPB(*YES)`?
- [ ] `c04` — confirm "no help content to preserve" (bodies are `Text` / `Help not available`).
- [ ] `c01` — box: how do users reach `SAMMNU` (initial menu on the profile, `GO`, sign-on program)? Not in the tree.
- [ ] `c08` — runtime-confirm by screen capture: `ZMENU` corner id, `sysnam` separator, exact `CPD9817` text.
- [ ] `c09` — `pro-interactive` owner: fix `PRO250` / `PRO250D` `%TEXT` ("Display Article" → provider) when that slice is edited — metadata only; not done here. Target labels: menu titles normalised once; option 7 wording.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `menu-cmd-shell` (if the room decides the shell has anything to test).

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. Room: is the menu a slice at all; which options does the target carry? (`c01`)
2. Source owner: `CUSQRY`, `ARTQRY`, `CUSQRYFMT`, `ADSPUSRSPC` — sources and library. (`c02`)
3. Room: command line / operator keys in the target. (`c03`)
4. Room: confirm no help to preserve. (`c04`)
5. Room: message resource — nine live ids; fate of the three dead; "Familly". (`c05`, `c06`)
6. Ops / build: `CVTSPLPDF` processing program and product; `CRTCMD` in the build; code page 1250. (`c07`)
7. Runtime-confirm `ZMENU`, `sysnam`, `CPD9817` text. (`c08`)
8. `pro-interactive`: `PRO250` object-text correction; target label wording. (`c09`)

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Is the menu a slice? | Bind accepted all 9 for **documentation**; the reject / navigation-spec decision is left to the room (checklist item 2). `c01` is written as the spec either way. |
| Messages | Carded as a catalogue (`c05`) with the live/dead split (`c06`, corrected); resource-file recommendation stands; the rules the texts voice stay with the owning slices. |
| `CVTSPLPDF` | Carded as an interface definition (`c07`); the invocation stays `ord-print-ord500-c03`; the processing program stays `ord-print-ord500-c04` needs-SME. |
| QM queries / `ADSPUSRSPC` | Carded as a blind-spot register (`c02`, `inferred` kept); option 84 pointer to `log-programs-c09`. |
| Called programs | Cited for existence, entry declarations, `%TEXT` and row-1 headings only (`c01`, `c09`); no PRO / ART / ORD / CUS behaviour documented; planted PRO defects untouched. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any found defect (`srt200` / `ord100` / `h` help names, orphan `ART200` module, option-3 help mis-target, `PRO250` `%TEXT`, `Familly`, inert `submsgf`, dead messages), edit any card outside `discovery/menu-cmd-shell/`, widen `atu-merlin-ts-cus-v1` or `atu-merlin-ts-ord-v1`, or edit `ATU_SRC/**`.
