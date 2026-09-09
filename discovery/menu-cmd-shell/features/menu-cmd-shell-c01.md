# menu-cmd-shell-c01 — SAMMNU entry map: 20 options in three groups, every action a parameterless `cmd call` (or STRQMQRY / ADSPUSRSPC / SIGNOFF)

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — navigation spec; the menu is an adapter, not a behaviour seam) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMMNU` is a UIM menu panel group (`:pnlgrp` … `:panel name=SAMPLE` … `:menu`) whose single panel lists **20 options** in three `:menugrp` groups plus one ungrouped option, and whose every `:menui` action is a CL command string run through the command analyzer. **16 actions are `cmd call <pgm>` with no parameters**, two are `cmd STRQMQRY …` (options 12, 13) and one is `cmd adspusrspc samlog` (option 84); option 90 is `cmd signoff`. Every called program that exists in the tree was checked for an entry parameter list — **none has one** (no `PI`, `dcl-pi`, `*ENTRY PLIST`, `PROCEDURE DIVISION USING` or `PGM PARM`), so the parameterless calls are well-formed; the one program that *does* take a parameter (`ORD100`, `cuid options(*nopass)`) is reached through the wrapper `ORD100C2`, which is why option 6 calls the wrapper. The option numbers are not contiguous (1–10, 12, 13, 20, 21, 80–84, 90). The text column carries a display label after the title (`ART200`, `QMQRY:CUSQRY`, `SQLPRC:ART801`, …) that is **not** always the object actually called (`c09`). Nothing in the tree invokes the menu itself (no `GO SAMMNU`, no initial-program CL): how a user reaches it is outside the tree.

## Entrypoints

- `ATU_SRC/QPNLSRC/SAMMNU.MENU:71-81` — `:panel name=SAMPLE help=h keyl=key01 Enter='msg cpd9817 qcpfmsg' panelid=zmenu topsep=sysnam.` / title `Arcad Sample Application` / `:menu depth='*' scroll=Yes Botsep=none.` / `:Topinst.Select one of the following:`
- `SAMMNU.MENU:82-119` — `:menugrp.Master files` options 1–9
- `SAMMNU.MENU:120-133` — `:menugrp.Reports` options 10, 12, 13
- `SAMMNU.MENU:134-163` — `:menugrp.Utilities` options 20, 21, 80–84
- `SAMMNU.MENU:164-168` — option 90 (`signoff`), outside any group; `:emenu.`

## Inputs / outputs / observables

- In: an option number typed on the command line (`c03`), or a CL command (`c03`).
- Out: the command string of the chosen `:menui` is executed; control returns to the menu when the called program ends (UIM `cmd` action). — `SAMMNU.MENU:83-166`
- Observable: the menu as rendered — three group headings, 20 option lines, the `Selection or command` prompt, the key legend (`c03`), the system name on the top separator (`topsep=sysnam`), the copyright text (`:copyr.`) — `SAMMNU.MENU:6-7,76-81,169-170`

## Behaviour as implemented

The complete map, as-is (option → action → title text → display label → where the target lives; case as written in source — CL is case-insensitive):

| Opt | Action | Title (as displayed) | Label | Target in tree | Slice (APP_MANIFEST) |
| ---: | --- | --- | --- | --- | --- |
| 1 | `cmd call ART200` | Work with Articles | `ART200` | `QRPGLESRC/ART200.PGM.SQLRPGLE` | `art-interactive` (held) |
| 2 | `cmd call CUS200` | Work with Customers | `CUS200` | `QRPGLESRC/CUS200.PGM.SQLRPGLE` | `cus-interactive` (documented) |
| 3 | `cmd call ORD201` | Work with Customer Orders | `ORD201` | `QRPGLESRC/ORD201.PGM.SQLRPGLE` | `ord-maintain-ord201` (documented) |
| 4 | `cmd call pro200` | Work with Providers | `PRO200` | `QRPGLESRC/PRO200.RPGLE` + `QILESRC/PRO200.ILEPGM` | `pro-interactive` (accepted, queue) |
| 5 | `cmd call pro201` | Display Providers | `PRO201` | `QCBLSRC/PRO201.CBL` | `pro-cobol-pro201` (accepted, queue) |
| 6 | `cmd call ORD100C2` | Create a Customer Order. | `ORD100` | `QCLSRC/ORD100C2.PGM.CLLE` → `CALL PGM(ORD100)` | `ord-entry-ord100` (documented) |
| 7 | `cmd call ART250` | Article by id | `ART250` | `QRPGLESRC/ART250.PGM.SQLRPGLE` | `art-interactive` (held) |
| 8 | `cmd call CUS250` | Customer by id | `CUS250` | `QRPGLESRC/CUS250.PGM.RPGLE` | `cus-interactive` (documented) |
| 9 | `cmd call PRO250` | Provider by id | `PRO250` | `QRPGLESRC/PRO250.PGM.RPGLE` | `pro-interactive` (accepted, queue) |
| 10 | `cmd call pro203` | Article to purchase | `PRO203` | `QRPGLESRC/PRO203.PGM.SQLRPGLE` (workstation program, `pro202d`) | `pro-interactive` (accepted, queue) |
| 12 | `cmd STRQMQRY QMQRY(CUSQRY) QMFORM(CUSQRYFMT)` | Customer with Open Order | `QMQRY:CUSQRY` | **absent** (`c02`) | — |
| 13 | `cmd STRQMQRY QMQRY(ARTQRY) ` | Article by Last Order Date | `QMQRY:ARTQRY` | **absent** (`c02`) | — |
| 20 | `cmd call par200` | Work with Parameters | `PAR200` | `QRPGLESRC/PAR200.PGM.RPGLE` | `par-maintain` (documented) |
| 21 | `cmd call cou200` | Work with countries | `COU200` | `QRPGSRC/COU200.RPG` (RPG III) | `cou-maintain` COU200 half (accepted, queue) |
| 80 | `cmd call ord900` | Reset LASTORDNO | `ORD900` | `QRPGLESRC/ORD900.PGM.RPGLE` | `ord-batch-ord900` (accepted, queue) |
| 81 | `cmd call ord901` | Reset Order dates to current | `ORD901` | `QRPGLESRC/ORD901.PGM.SQLRPGLE` | `ord-batch-ord900` (accepted, queue) |
| 82 | `cmd call art801` | Reset Summary Fields | `SQLPRC:ART801` | `QSQLSRC/ART801.SQLPRC` (`CREATE PROCEDURE UPDATE_ON_CUS_ORD_QTY () … SPECIFIC ART801`) | `sql-objects` (accepted, queue) |
| 83 | `cmd call par201` | Work with IFS output | `PAR201` | `QCLSRC/PAR201.CLLE` + `QILESRC/PAR201.ILEPGM` | `par-maintain` (documented) |
| 84 | `cmd adspusrspc samlog` | Display Application log | — | **absent** command (`c02`; `log-programs-c09`) | — |
| 90 | `cmd signoff` | Signoff | — | system command | — |

— `SAMMNU.MENU:83-167`

1. The user types an option number (or a command) and presses Enter; UIM runs the `action` string of the matching `:menui`. — `SAMMNU.MENU:55-57,83-166,169`
2. `cmd call X` is CL `CALL PGM(X)` with no `PARM`: the program is resolved on `*LIBL` (none of the actions is library-qualified) and started with no parameters. — `SAMMNU.MENU:84,88,…,156`
3. Option 82 calls the **external program object** of an SQL procedure: `CREATE PROCEDURE UPDATE_ON_CUS_ORD_QTY ( ) … SPECIFIC ART801` creates a `*PGM` named `ART801` with no parameters, so `CALL ART801` is a valid way to run the procedure body (platform semantics of `SPECIFIC` for SQL procedures — inference; the procedure body is `sql-objects`' to document). — `QSQLSRC/ART801.SQLPRC:4-9`, `SAMMNU.MENU:152`
4. Option 6 calls the wrapper, not the program: `ORD100` declares `pi cuid options(*nopass)`; `ORD100C2` ("Create new order without parameter") prepares `QTEMP/DETORD` and `CALL PGM(ORD100)` with no parameter (`ord-entry-ord100` owns that behaviour). The label column still says `ORD100`. — `QRPGLESRC/ORD100.PGM.RPGLE:26-28`, `QCLSRC/ORD100C2.PGM.CLLE:2,11`, `SAMMNU.MENU:104-106`
5. When the called program returns, the menu is redisplayed (UIM `cmd` action semantics; not spelled out in source — platform). Options 12/13/84 behave the same way if their objects exist on `*LIBL`; otherwise the command analyzer's error is shown on the menu (`c02`).

## Validation rules found in code

- Option numbers are validated by UIM against the `:menui option=` set: **11, 14–19, 22–79, 85–89** and anything above 90 are not options; the panel's `Enter='msg cpd9817 qcpfmsg'` supplies the "not valid" message when Enter is pressed with no usable selection (`c08`). — `SAMMNU.MENU:74,83-166`
- No authority, role or user-class checks anywhere in the menu: every signed-on user who can reach `SAMMNU` sees all 20 options, including the three reset utilities (80–82) and the parameter maintenance (20). Whether a program refuses is the program's business (none of the documented ones does).

## Edge cases found in code

- **Non-contiguous numbering.** 11 is missing between 10 and 12 in the Reports group (Phase A `c02`); the Utilities group jumps 21 → 80. Nothing in the tree explains the gaps (a removed option 11 is the natural reading — inference).
- **Mixed case in actions** (`ART200` vs `pro200`, `ord900`) — cosmetic; CL folds to upper case.
- **Reports group is misnamed for one of its members:** option 10 `PRO203` opens a display file (`fpro202d cf e workstn`) — an interactive selection screen, not a spooled report; 12 and 13 are QM queries (true reports, absent). — `QRPGLESRC/PRO203.PGM.SQLRPGLE:5`
- **Three utilities are destructive resets** offered without confirmation at menu level: 80 `ORD900` (`LASTORDNO` data area), 81 `ORD901` (order dates / `ODYEAR` backfill / `CULASTORD`), 82 `ART801` (summary fields). Their behaviour is `ord-batch-ord900` / `sql-objects`; the menu adds no guard. — `SAMMNU.MENU:143-154`
- **Two programs are built with modules from other slices** (`PRO200.ILEPGM`: `MODULE(PRO200 PRO202) BNDSRVPGM(XML FCOUNTRY FPARAMETER)`; `PAR201.ILEPGM`: `BNDSRVPGM(FPARAMETER)`) — the menu neither knows nor cares; noted because a from-source rebuild of "everything the menu calls" needs those build members (`srvpgm-supporting`). — `QILESRC/PRO200.ILEPGM:8-9`, `QILESRC/PAR201.ILEPGM:8-9`
- **`COU200` is RPG III** (`QRPGSRC/COU200.RPG`, `*ENTRY`-less, fixed-form) — the only non-ILE target on the menu. — `QRPGSRC/COU200.RPG:1-12`
- **No entry to the menu in the tree:** grep for `SAMMNU` outside `QPNLSRC` finds nothing — no initial program, no `GO`, no job description. Whether users reach it via `GO SAMMNU`, a user-profile initial menu or a sign-on program is a box fact.

## Dependencies

- Every called program (table above) — each is another slice's behaviour; this card cites their existence and entry declarations only.
- `SAMHELP` (`c04`), `SAMMSGF` / `QCPFMSG` (`c05`, `c08`), the key list `key01` (`c03`).
- Out-of-tree: `CUSQRY`, `ARTQRY`, `CUSQRYFMT`, `ADSPUSRSPC` (`c02`), `SIGNOFF` (system).

## Assumptions / unknowns

- Platform: UIM `cmd` action = command analyzer execution with the user's authority and `LMTCPB` attribute in force; control returns to the menu on completion; `CALL` to an SQL procedure's `SPECIFIC`-named `*PGM` with no parameters is valid. Each is inference / runtime-confirmable.
- Target stance (room, prose only — `SME_BRIEF.md`): this table **is** the navigation spec for the target UI. Recommendation unchanged from Phase A: `reject` as a conversion slice; carry the option titles as labels (`c09` for the ones that disagree with the programs) and the grouping as the menu structure. Which options the target should even have (80–84, 90) is a room decision, not a documentation fact.

## Evidence

`ATU_SRC/QPNLSRC/SAMMNU.MENU:6-7,55-57,71-170` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:26-28` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:2,5-11` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:4-9` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:5` · `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` · `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9` · `ATU_SRC/QRPGSRC/COU200.RPG:1-12` · `ATU_SRC/QCBLSRC/PRO201.CBL:107` (`PROCEDURE DIVISION.` without `USING`) · structural grep of the 16 in-tree targets for `PI` / `dcl-pi` / `*ENTRY` / `PGM PARM` (none) · structural grep `ATU_SRC/**` for `SAMMNU` outside `QPNLSRC` (none)
