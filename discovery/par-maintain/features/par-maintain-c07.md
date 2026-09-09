# par-maintain-c07 — PAR201 Work with IFS output (GetParm2 PATH → WRKLNK)

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`PAR201` (CL, menu option 83 "Work with IFS output") is seven statements: `CALLPRC GETPARM2('PATH', ' ')` into a 100-byte `&PATH`, append `'*'` with `*TCAT` (trailing blanks trimmed first), then `WRKLNK OBJ(&PATH)`. It is the only CL in the tree that calls a service-program procedure, bound by `PAR201.ILEPGM` (`CRTPGM … BNDSRVPGM(FPARAMETER) ACTGRP(QILE)`). It opens the interactive **Work with Object Links** panel over the pattern `<PATH>*` — the contents of the output directory **only if `PATH` ends with `/`**; otherwise the entries of the parent directory whose names begin with the last path component. No `MONMSG`: any failure (no `PARAMETER` file, escape from `WRKLNK`) surfaces as an unhandled message in the session. `WRKLNK` gives the operator full file management (display, edit, rename, remove…) over whatever the pattern matches.

## Entrypoints

- `SAMMNU` option 83 `call par201`, help `nohelp` (Utilities group) — `ATU_SRC/QPNLSRC/SAMMNU.MENU:155-158`
- `PAR201.CLLE` — `ATU_SRC/QCLSRC/PAR201.CLLE:4-10`
- Build: `CRTPGM PGM(&O/&N) MODULE(PAR201) ENTMOD(PAR201) BNDSRVPGM(FPARAMETER) ACTGRP(QILE)` — `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9`

## Inputs / outputs / observables

- In: `&CODE` `*CHAR 10` `'PATH'`, `&SUBCODE` `*CHAR 10` `' '`, both passed `*BYVAL` to `GETPARM2` (prototype `10A value`, `10A value`, returns `100A`); return value into `&PATH` `*CHAR 100`. — `PAR201.CLLE:4-8`, `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:13-15`
- Out: `WRKLNK OBJ('<trimmed PATH>*')` — a 5250 list panel (system command, not application code). Nothing written by `PAR201` itself. — `PAR201.CLLE:9-10`
- Observable: the `WRKLNK` panel; on a blank `PATH` the pattern is `'*'` (`c08`).

## Behaviour as implemented

1. `CALLPRC PRC(GETPARM2) PARM((&CODE *BYVAL) (&SUBCODE *BYVAL)) RTNVAL(&PATH)` → `FPARAMETER.GetPARM2` → `chainPARAMETER('PATH':' ')` → `PARM2` of that row, or 100 blanks on a miss (`c09`). — `PAR201.CLLE:7-8`, `ATU_SRC/QRPGLESRC/PAR300.RPGLE:34-44,82-98`
2. `CHGVAR VAR(&PATH) VALUE(&PATH *TCAT '*')` — `*TCAT` removes trailing blanks from the 100-byte value and appends `*`. — `PAR201.CLLE:9`
3. `WRKLNK OBJ(&PATH)` — interactive. Pattern semantics (CL/IFS rule, not source): `/home/sample/out/*` lists the entries of `/home/sample/out`; `/home/sample/out*` lists the entries of `/home/sample` beginning with `out` (the directory itself plus any mis-named siblings). — `PAR201.CLLE:10`
4. No `MONMSG`, no `RETURN`, no `ENDPGM`; the program ends when `WRKLNK` returns (F3/F12 on the panel). — `PAR201.CLLE:4-10`

## Validation rules found in code

None. `&PATH` is not tested for blank, for existence, or for a trailing separator.

## Edge cases found in code

- **Trailing separator is the data contract.** `PRO202` and `PRO203` build their file names as `%trim(path) + fileName` — they also need `PATH` to end with `/`; `ORD500C` passes `PATH` as `TODIR` and is separator-tolerant. `PAR201` lists what the two `%trim` writers would have produced either way: with the slash, the directory; without it, the mis-placed `…outPur_Ord_*.xml` / `…outGoods to purchase_*.xml` siblings. — `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:151-152`, `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:32-33`, `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:11-12`
- **Blank / missing `PATH`** → `'*'` → the job's current directory (`c08`).
- **100-character `PATH`** with no trailing blank → `*TCAT` result truncated back to 100 → the `*` is lost → `WRKLNK` on the exact path (a directory shows its own entry, not its contents). Edge of the field width; no in-tree value approaches it.
- **Failures are unhandled**: `PARAMETER` not on `*LIBL` → `open` fails inside `PAR300` → RPG exception → function check in `PAR201` → inquiry/escape in the session; `WRKLNK` in a non-interactive job → escape (`PAR201` has no batch caller — menu only). Inference.
- **Cache.** `PAR201` runs in `QILE`; `FPARAMETER` is `ACTGRP(*CALLER)`, so the first `GetPARM2` in the job opens `PARAMETER` and caches `PATH` for every later consumer in `QILE` (`ORD500`, `PRO200`/`PRO202`, `PRO203` — `c09`); a `PATH` change made in `PAR200` is not seen by `PAR201` until the activation group is reclaimed.
- **Operator power.** `WRKLNK` options (2=Edit, 4=Remove, 7=Rename, 5=Display, 8=Attributes, …) apply to the generated PDF / XML / spreadsheet files — deletion of application output is one keystroke away, by design of the utility.

## Dependencies

- `FPARAMETER` (`GetPARM2`) — `PAR300.RPGLE:34-44`; `PARAMETER.PF` row `('PATH', ' ')` — data, not source (`c11`)
- `PAR201.ILEPGM` (explicit `CRTPGM`, one of two in the tree — `srvpgm-supporting-c04`) — `PAR201.ILEPGM:8-9`
- System command `WRKLNK`.

## Assumptions / unknowns

- `*TCAT` trimming, `WRKLNK` pattern matching, CL `RTNVAL` receiving a 100-byte character return value, the function-check surface on an unmonitored escape — platform rules, runtime-confirmable.
- needs-SME: is `PAR201` behaviour to preserve, or an ops convenience to fold into a runbook / file browser in the target? Phase A recommendation: `reject` or runbook. If `PATH` becomes configuration (`c11`) the utility has no lookup to do.
- needs-SME (data): does the `PATH` value on the box end with `/`? Decides whether `PRO202`/`PRO203` output is written into the directory `PAR201` shows.

## Evidence

`ATU_SRC/QCLSRC/PAR201.CLLE:4-10` · `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:155-158` · `ATU_SRC/QRPGLESRC/PAR300.RPGLE:34-44,82-98` · `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:13-15` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:151-152` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:32-33` · `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:11-12`
