# cou-maintain-c13 — `COU200` is the estate's only OPM RPG III member (`QRPGSRC`, fixed-form, `CASEQ` / `GOTO` / `TAG`); it opens `COUNTRY` directly for update and bypasses the `FCOUNTRY` service program — the one direct writer whose changes the getter cache does not see

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ATU_SRC/QRPGSRC` holds exactly one member, `COU200.RPG` — 138 lines of RPG/400 (OPM RPG III): fixed-column `F` / `I` / `C` specs, `KINFDS` / `KSFILE` continuation lines, a `CASEQ` dispatcher, `CABEQ` / `GOTO` / `TAG` control flow, `SELEC` / `WHEQ` / `OTHER`, `DOWEQ`, `Z-ADD` / `MOVE`, and an `*INZSR`. Every other program in the estate is ILE RPG (`QRPGLESRC`, 37 members) or ILE COBOL (`QCBLSRC`, `PRO201` — the other language outlier, `pro-cobol-pro201`, room-held). The member has a blank `%TEXT` (like `ORD700` / `ORD900` / `ORD901` / `PRO203` / `ART801`), while its display file `COU200D` carries the ARCAD provenance text "Membre ajout{ par la commande AADDSRCARC" (the only `AADDSRCARC` in the tree) and `%%TS` stamps of 2016-11-04 under V7R1. There is no compile spec for it (`QILESRC` holds only `PAR201.ILEPGM` / `PRO200.ILEPGM`; an OPM program is built by `CRTRPGPGM`, whose options are not in the tree — `iproj.json` delegates to `elias compile`). Functionally, the program **does not use `FCOUNTRY`**: it declares `COUNTRY` itself as `UF` and reads / updates it with native I/O, so it is (a) the only member that can write the file (`c04`), (b) a separate ODP in the default activation group — an OPM program cannot run in a named ILE activation group — and therefore (c) the writer whose renames `COU300`'s cache does not notice until a different code is requested (`c07`). Phase A's recommendation stands and is restated, not decided: for a 138-line OPM screen with one operation, the room decides **retire-and-replace** (a thin maintain form over the target `country` table) versus **convert**; the COU Architecture pack currently keeps the panel half out of scope and `modern/` has no maintenance path for `country`.

## Entrypoints

- Member: `ATU_SRC/QRPGSRC/COU200.RPG` (whole member; specs at `:4-10`, mainline `:12-19`, `*INZSR` `:134-138`)
- Menu: `:menui option=21 action='cmd call cou200'` — `ATU_SRC/QPNLSRC/SAMMNU.MENU:139-142`
- Display file: `ATU_SRC/QDDSSRC/COU200D.DSPF` (`%TEXT` `:2`, `%%TS` `:4,13,23,53`)

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| Source directory census | `QRPGSRC`: 1 member (`COU200.RPG`); `QRPGLESRC`: 37; `QCBLSRC`: `PRO201`; `QCLSRC`: 4; `QILESRC`: 2 `.ILEPGM`; `QILESRVSRC`: service-program specs | `ls ATU_SRC/*` |
| Specs | `F` WORKSTN `CF E` with `KINFDS INFDS` and `RRN01 KSFILE SFL01`; `F` `COUNTRY UF E K DISK`; `I` INFDS `B 378 379 0 LRRN` | `COU200.RPG:4-10` |
| Opcodes used | `TAG`, `CASEQ`, `ENDCS`, `CABEQ`, `GOTO`, `SETON`, `SETOF`, `BEGSR`/`ENDSR`, `Z-ADD`, `MOVE`, `WRITE`, `EXFMT`, `SETLL`, `READ`, `READC`, `UPDAT`, `CHAIN`, `DOWEQ`/`ENDDO`, `IFGT`/`IFNE`/`IFEQ`/`ANDNE`/`ENDIF`, `SELEC`/`WHEQ`/`OTHER`/`ENDSL`, `COMP`, `ADD` | `COU200.RPG:12-138` |
| No `H` spec, no parameters | no `*ENTRY PLIST`; the menu `call cou200` passes none | `COU200.RPG` (grep); `SAMMNU.MENU:140` |
| No binding | no `/COPY` of `COUNTRY.RPGLEINC`, no `CALLB` / `CALLP`, no reference to `FCOUNTRY` / `GetCountryName` / `ExistCountry` | structural grep of the member |
| `%TEXT` | blank | `COU200.RPG:2` |
| Display-file provenance | `%TEXT Membre ajout{ par la commande AADDSRCARC`; `%%TS SD 20161104 162149 VTAQUIN REL-V7R1M0 5770-WDS` | `COU200D.DSPF:2,4,13,23,53` |

## Behaviour as implemented

1. **Program shape.** Mainline: `LOOP TAG`; `CASEQ` on `PANEL` (1 → `PNL01`, 2 → `PNL02`); `CABEQ 0 ENDPGM`; `GOTO LOOP`; `ENDPGM TAG`; `SETON LR`. Each panel subroutine is itself a `CASEQ` on a 3-character step (`PRP` / `LOD` / `DSP` / `KEY` / `CHK` / `ACT`) — the same PRP-LOD-DSP-KEY-CHK-ACT state machine the ILE panels (`CUS200`, `PRO200`, `COU301`, …) implement in free-form `select` / `when`. — `COU200.RPG:12-29,101-108`
2. **Direct file access.** `COUNTRY` is opened by the program at start (not `USROPN`), read without lock for the list, chained with lock for the edit, updated in place, closed at `LR`. — `COU200.RPG:7,39-44,111,131,19`
3. **No service-program call.** The country *name* and *ISO code* shown and edited here come from the program's own record buffer, never from `GetCountryName` / `GetCountryIso3`; existence is never asked (`ExistCountry`) because the program only edits rows it has just listed. — `COU200.RPG:37-47,109-112`
4. **Activation.** OPM → default activation group (`*DFTACTGRP`); the ILE callers of `FCOUNTRY` are `QILE` (`PRO200`, explicit) or the un-keyworded default (`srvpgm-supporting-c07`: most likely `QILE`). Distinct ODPs; no shared open data path with `COU300` / `COU301` in the same job. — `COU200.RPG:7`; pointer `c12`

## Validation rules found in code

- Not applicable — this card is a classification. The panel's own (absent) rules are `c02`'s.

## Edge cases found in code

- **Cache interaction (the practical consequence).** A `COU200` rename in job X is served stale by `GetCountryName` in job Y for as long as Y's last requested code is that one (`COU300.RPGLE:57` compares against its own buffer). Within one job, a user who runs `COU200` from the menu and then `CUS200` sees the new name only if `CUS200`'s getter has not yet cached that code in that activation group. — pointer `c07`; `COU200.RPG:131`
- **No prototype drift risk.** Because the program does not include `COUNTRY.RPGLEINC`, the copybook's five-prototypes-for-four-exports drift (`c08`) cannot affect it; equally, a future signature bump of `FCOUNTRY` (`c12`) cannot break it.
- **Compile-time coupling is through the DDS only.** `COU200D` `REFFLD`s every data field to `*LIBL/COUNTRY`; a layout change to `COUNTRY.PF` requires recompiling the display file and (level check) the program. — `COU200D.DSPF:19-21,70-73`
- **`SELEC` dates the member.** `SELEC` / `WHEQ` / `OTHER` arrived in RPG/400 V2R2; the member is RPG/400, not System/38 RPG III. Cosmetic, but it rules out the oldest tooling assumptions. — `COU200.RPG:59-66,91-99,118-125`
- **`INDARA` handled without a declaration.** The display file specifies a separate indicator area; RPG/400 maps it automatically (platform — inference). — `COU200D.DSPF:7`

## Dependencies

- `c01`, `c02`, `c04`, `c05`, `c06` (what the program does); `c07`, `c08`, `c12` (FCOUNTRY half — the service program this member does not use); `menu-cmd-shell-c01` (option 21)
- `pro-cobol-pro201` (the other language outlier; room-held) — comparison only
- Pointers only (not changed, not proposed): `architecture/atu-merlin-cou/PACK.yaml:30,36,67,96-97,140-141` (panel half out of scope / stay_legacy until carded and the pack is SUPERSEDEd — carding is what this run does; superseding is the ME's / room's act); `modern/README.md:655,681,721,749`; `modern/db/schema.sql:324,330` (`country` has no maintenance path; `COU200` recorded as the only writer)

## Assumptions / unknowns

- Platform (inference): OPM programs run in the default activation group; RPG/400 `INDARA` mapping; `GOTO` out of a subroutine (`c05`).
- Build: `CRTRPGPGM` options; whether the object on the box was compiled from this member (the `%%TS` stamps are the display file's, not the program's — the RPG member has no timestamp line).
- **needs-SME (room) — Phase A Q, restated:** retire-and-replace (a thin target maintain form: list + edit name / ISO, plus whatever create / delete the room decides under `c04`) versus convert the OPM program. Inputs for the decision, all as-is: one operation (`c02`), no validation (`c02`), unguarded concurrency (`c03`), no create / delete (`c04`), key quirks (`c05`), stale list (`c06`). The card records the inputs; the room decides.
- **needs-SME (ME, COU pack):** the pack's "until Pack B cards it and pack SUPERSEDEd" condition is now half met. Whether to draft a superseding pack version that adds a maintain surface, or leave `country` read-only in the target, is the ME's proposal to the room — outside this station.

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:2,4-10,12-29,37-47,59-66,91-99,101-108,109-112,118-125,131,134-138` · `ATU_SRC/QDDSSRC/COU200D.DSPF:2,4,7,13,19-21,23,53,70-73` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:139-142` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:6,57` · `ATU_SRC/QRPGLESRC/COU301.RPGLE:6` · `iproj.json` (`buildCommand`) · directory census of `ATU_SRC/*` (`QRPGSRC` = 1 member; `QILESRC` = `PAR201.ILEPGM`, `PRO200.ILEPGM`) · structural grep of the member for `/COPY`, `CALLB`, `CALLP`, `FCOUNTRY`, `GetCountry`, `ExistCountry`, `*ENTRY`, `PLIST` (none) · structural grep of `ATU_SRC/**` for `AADDSRCARC` (1 hit — `COU200D.DSPF:2`)
