# menu-cmd-shell-c07 — CVTSPLPDF command parameter contract: 3 required + 11 optional parameters, prompt-control only (no `DEP`), processing program bound at `CRTCMD` time — outside the tree

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — interface definition of an integration edge; the converter itself stays a blind spot) |
| Confidence | `observed-in-code` (the definition); the processing program and what the PDF looks like are outside the tree (needs-SME, `ord-print-ord500-c04`) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CVTSPLPDF.CMD` ("Convert Spool to PDF") is a 96-line command definition with **14 parameters**: three required (`FROMFILE` spooled-file name, `TOSTMF` stream-file name, `TODIR` IFS directory), the spooled-file selectors `JOB` (default `*` = current job) and `SPLNBR` (default `*ONLY`; `*LAST`), the output controls `STMFOPT` (`*NONE` | `*REPLACE`), `STMFCODPAG` (default **1250**, `*PCASCII`, `*STMF`; shown only on additional parameters), `TITLE` (`*NONE` | `*STMFILE` | text 50), `PAGESIZE` (`*SPLF` | `*CUSTOM` | paper + orientation, default landscape) with dependent `CUSTOMPAGE` (width/length/unit, A4-in-mm defaults), `FONT` (`*CONVERT` | face + size) and `BOOKMARK` (`*PAGNBR` | `*POS` | `*KEY` | `*NONE`) with dependent `BMARKPOS` / `BMARKKEY`. Phase A said "no `PGM()` in source — processing program unknown"; the sharper statement is that **command source never names its processing program** — that is the `PGM()` parameter of `CRTCMD`, a build step — and **no `CRTCMD` exists anywhere in `ATU_SRC`** (the only build members are `*.ILEPGM`, `*.ILESRVPGM`, `*.BND`, `*.BNDDIR`, the `MSGF` script), so the command→program binding is outside the tree for *both* commands in `QCMDSRC` (`CRTORD` too — `ord-entry-ord100-c09`). Cross-parameter dependencies are expressed with `PMTCTL` only, which governs **prompting**, not validation: nothing in the definition stops `CUSTOMPAGE` being given with `PAGESIZE(*A4)`, or `BMARKPOS` with `BOOKMARK(*NONE)` — whatever happens then is the processing program's business. The one in-tree caller is `ORD500C` (`ord-print-ord500-c03`, documented — pointer only).

## Entrypoints

- `ATU_SRC/QCMDSRC/CVTSPLPDF.CMD:4` — `CMD PROMPT('Convert Spool to PDF')` (no other keyword — `CMD` takes only `PROMPT` in source)
- `CVTSPLPDF.CMD:6-13` — `FROMFILE`, `TOSTMF`, `TODIR` (`MIN(1)`)
- `CVTSPLPDF.CMD:15-24` — `JOB` (qualified name/user/number) and `SPLNBR`
- `CVTSPLPDF.CMD:26-36` — `STMFOPT`, `STMFCODPAG`, `TITLE`
- `CVTSPLPDF.CMD:38-55` — `PAGESIZE` (`LIST3`) and `CUSTOMPAGE` (`LIST4`, `PMTCTL(CUSTOM)`)
- `CVTSPLPDF.CMD:57-65` — `FONT` (`LIST5`)
- `CVTSPLPDF.CMD:67-89` — `BOOKMARK`, `BMARKPOS` (`LIST1`, `PMTCTL(POS)`), `BMARKKEY` (`LIST2`, `PMTCTL(KEY)`)
- `CVTSPLPDF.CMD:91-95` — the three `PMTCTL` statements `CUSTOM`, `POS`, `KEY`
- Caller: `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:11-14`
- Twin without program binding: `ATU_SRC/QCMDSRC/CRTORD.CMD:4-6`

## Inputs / outputs / observables

The contract, as-is:

| Kwd | Type / len | Required | Default | Values / special values | Notes |
| --- | --- | --- | --- | --- | --- |
| `FROMFILE` | `*NAME 10` | yes | — | — | spooled file name |
| `TOSTMF` | `*NAME 64` | yes | — | — | stream-file *name*, `*NAME` rules apply |
| `TODIR` | `*PNAME 256` | yes | — | — | IFS directory |
| `JOB` | qualified `*NAME 10` / `*NAME 10` / `*CHAR 6` `RANGE(000000 999999)` | no | `*` | `SNGVAL(*)` | current job |
| `SPLNBR` | `*DEC 4` `RANGE(1 9999)` | no | `*ONLY` | `*LAST`=-2, `*ONLY`=-3 | |
| `STMFOPT` | `*CHAR 8` `RSTD` | no | `*NONE` | `*NONE`, `*REPLACE` | |
| `STMFCODPAG` | `*DEC 5 0` `RANGE(1 32767)` | no | `1250` | `*PCASCII`=-1, `*STMF`=-2 | `PMTCTL(*PMTRQS)` — hidden until F10 |
| `TITLE` | `*CHAR 50` `RSTD(*NO)` | no | `*NONE` | `*NONE`, `*STMFILE` | |
| `PAGESIZE` | `LIST3`: paper `*CHAR 7` `RSTD` + orientation `*CHAR 10` `RSTD` | no | `*SPLF` | `SNGVAL(*SPLF, *CUSTOM)`; paper `*A4 *A5 *LETTER *LEGAL *EXEC`; orientation `*LANDSCAPE` (dft) `*PORTRAIT` | |
| `CUSTOMPAGE` | `LIST4`: width `*DEC 6 3`, length `*DEC 6 3`, unit `*CHAR 5` `RSTD` | no | `210`, `297`, `*MM` | `RANGE(.001 999.999)`; `*INCH *MM`; `EXPR(*YES)` | `PMTCTL(CUSTOM)`: shown when `PAGESIZE = *CUSTOM` |
| `FONT` | `LIST5`: face `*CHAR 10` `RSTD`, size `*DEC 2` `RANGE(4 36)` | no | `*CONVERT` | `SNGVAL(*CONVERT)`; 14 faces (`*COURIER`…`*DINGBATS`, Courier/Helvetica/Times ×4 styles, Symbol, Dingbats); size `*CALC`=-1 | |
| `BOOKMARK` | `*CHAR 7` `RSTD` | no | `*PAGNBR` | `*PAGNBR *POS *KEY *NONE` | |
| `BMARKPOS` | `LIST1`: line `*DEC 3` `1-300`, column `*DEC 3` `1-378`, length `*DEC 3` `1-378` | no | `1`, `1`, `1` | — | `PMTCTL(POS)`: `BOOKMARK = *POS` |
| `BMARKKEY` | `LIST2`: key `*CHAR 378` `VARY(*YES *INT2)`, occurrence `*DEC 3` `1-999`, offset `*DEC 3` `-378..378`, length `*DEC 3` `1-378` | no | `' '`, `1`, `0`, `1` | — | `PMTCTL(KEY)`: `BOOKMARK = *KEY` |

— `CVTSPLPDF.CMD:6-95`

- Out: not defined by the command source (no return variable — `CMD` source has no `RTNVAL` parameters here); the effect is the processing program's. From the caller's contract: a stream file `<TODIR>/<TOSTMF>` (`ord-print-ord500-c03`).
- Observable: the prompt screen (F4 on the command) shows the layout above; `STMFCODPAG` appears only after F10; `CUSTOMPAGE` / `BMARKPOS` / `BMARKKEY` appear only when their controlling value is chosen.

## Behaviour as implemented

1. The command analyzer validates each parameter against the definition (type, length, `RSTD` value lists, `RANGE`, `MIN(1)`, qualifier structure) before calling the processing program. The processing program's name is **not** in this source; it is supplied by `CRTCMD PGM(…)` at build time. — `CVTSPLPDF.CMD:4`; absence of `CRTCMD` in `ATU_SRC/**`
2. Values are passed to the processing program positionally in definition order, with `SPCVAL` mappings applied (`*LAST` → -2, `*ONLY` → -3, `*PCASCII` → -1, `*STMF` → -2, `*CALC` → -1) and lists as `*INT2`-prefixed structures (`LIST1`–`LIST5`). — `CVTSPLPDF.CMD:22-23,30-31,64-65`
3. `PMTCTL` statements make `CUSTOMPAGE`, `BMARKPOS`, `BMARKKEY` conditional **on the prompter** (`NBRTRUE(*EQ 1)` with one `COND` each). — `CVTSPLPDF.CMD:91-95`
4. `ORD500C`'s invocation supplies `FROMFILE(ORD500O) TOSTMF(&FILENAME) TODIR(&PATH) SPLNBR(*LAST) STMFOPT(*REPLACE) PAGESIZE(*A4 *PORTRAIT) FONT(*COURIER 11) BOOKMARK(*NONE)` and takes the defaults `JOB(*)`, `STMFCODPAG(1250)`, `TITLE(*NONE)`; no `CUSTOMPAGE` / `BMARK*`. Behaviour and failure handling of that call: `ord-print-ord500-c03`. — `ORD500C.PGM.CLLE:11-14`

## Validation rules found in code

- Required: `FROMFILE`, `TOSTMF`, `TODIR` (`MIN(1)`); everything else defaulted. — `:6-13`
- `TOSTMF` is `TYPE(*NAME)`: the value must satisfy IBM i **simple-name** rules (first character alphabetic / `$#@`, then alphanumerics, `$#@_.`; no blanks, no hyphen — platform, inference). `Custord123.pdf` passes; a name with a space or `-` would be rejected by the analyzer before any program runs. `TODIR` is `*PNAME` (path name — permissive). — `:9-13`
- `JOB` number is `*CHAR 6` with `RANGE(000000 999999)` — six digits enforced as a character range. — `:19-20`
- `RSTD(*YES)` lists close the value sets for `STMFOPT`, paper, orientation, unit, font face, `BOOKMARK`; `TITLE` is `RSTD(*NO)` (free text plus two special values). — `:26-27,41-45,53-55,59-63,67-68,34-35`
- **No `DEP` statements**: no cross-parameter rule is enforced by the analyzer (e.g. `CUSTOMPAGE` without `PAGESIZE(*CUSTOM)` is accepted; `BMARKPOS` and `BMARKKEY` may both be given). — `:91-95` are `PMTCTL`, not `DEP`

## Edge cases found in code

- **Default code page 1250** (Windows Central European) for the stream file — an unusual default for a PDF byte stream; `ORD500C` does not override it. What the processing program does with it (PDF is binary; the code page may apply to text extraction / bookmarks only) is unknown. As-is. — `:30-32`
- **`PAGESIZE` default is `*SPLF`** (take the size from the spooled file) but the *orientation element* defaults to `*LANDSCAPE` — the element default applies only when a paper size is given without orientation (`PAGESIZE(*A4)` → A4 landscape). `ORD500C` gives both. — `:38-45`
- **`FONT` face uses `SPCVAL` with `RSTD(*YES)` and no `VALUES`** — equivalent to a closed list of 14 special values; `EXPR(*YES)` allows CL expressions. — `:59-63`
- **`BMARKKEY` key string is `VARY(*YES *INT2)`** — passed with a 2-byte length prefix; the other `*CHAR` parameters are fixed. — `:82-83`
- **`SPLNBR` special values are negative** (`*LAST`=-2, `*ONLY`=-3) in a `*DEC 4` parameter whose `RANGE` is `1 9999` — the range applies to typed numbers only; special values bypass it (platform). — `:22-24`
- **`STMFCODPAG(*STMF)`** (-2) presumably means "use the stream file's / directory's code page" — its meaning is the program's, not the definition's. Inference.
- **No `ALLOW()`** on `CMD` → the command is allowed in every environment (interactive, batch, CL program, REXX, …) by default — platform default. — `:4`
- **`CRTORD.CMD` shares the blind spot:** it too has only `CMD PROMPT(…)` + one `PARM`; its processing program (`ORD100C`, by the wrapper's shape) is `ord-entry-ord100-c09`, `inferred`. Both commands' `CRTCMD` steps live in the ARCAD build, not in the tree. — `CRTORD.CMD:4-6`

## Dependencies

- `ORD500C` → `ORD500` (`ord-print-ord500-c03`, documented) — the one caller.
- Processing program: **outside the tree** (needs-SME: which product supplies `CVTSPLPDF`; `ord-print-ord500-c04`).
- `ORD500O` printer file (`ord-print-ord500`) — the spooled file named in the caller.

## Assumptions / unknowns

- Platform: `CMD` source has no processing-program keyword; `CRTCMD PGM()` binds it; `PMTCTL` vs `DEP` semantics; `*NAME` character rules; `SPCVAL` mapping and `RANGE` bypass; list parameter passing format; `ALLOW` default — inference / runtime-confirmable (`DSPCMD CVTSPLPDF` on the box gives the processing program and library in one step).
- needs-SME: the product / library behind `CVTSPLPDF` (several spool-to-PDF utilities use this name — do not assume ARCAD's); whether the same command is used elsewhere on the box outside this application.
- Target stance (room, prose only): integration edge — the target produces the PDF with its own renderer (the ORD vertical, converted under waiver, handles printing its own way; not checked or widened here). Nothing in this definition is behaviour to convert; the four values `ORD500C` sets (A4 portrait, Courier 11, replace, no bookmarks) are the only requirement the caller expresses.

## Evidence

`ATU_SRC/QCMDSRC/CVTSPLPDF.CMD:4-95` · `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:4-14` · `ATU_SRC/QCMDSRC/CRTORD.CMD:4-6` · `ATU_SRC/QCMDSRC/` listing (two members) · structural grep `ATU_SRC/**` (i) for `cvtsplpdf` (the `.CMD` + `ORD500C:11` only) and for `CRTCMD` (none) · `discovery/ord-print-ord500/features/ord-print-ord500-c03.md` (pointer)
