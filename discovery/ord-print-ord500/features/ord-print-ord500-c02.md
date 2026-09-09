# ord-print-ord500-c02 — Resolve IFS path from PATH parameter and hand off to PDF step

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B — seam edge) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

After the spooled file is closed, `ORD500` reads the IFS directory from the `PARAMETER` file through the `FPARAMETER` service program — `path = getParm2('PATH':' ')` — and calls `ORD500C(%trim(%char(orid)) : path)` synchronously, with no return value and no `monitor`. `GetParm2` opens `PARAMETER` lazily and caches the last key for the life of the activation group; a missing `PATH` row yields a **blank** path that is passed on unchecked. The order id is converted to character and handed to a **5-byte** `const` parameter, so a six-digit order id loses its last digit in the PDF name.

## Entrypoints

- Prototype `pdford … extpgm('ORD500C')` with `id 5 const`, `path 100 const` — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:21-23`
- `/COPY ../QPROTOSRC/PARAMETER.RPGLEINC` → `GetPARM2(PACODE 10A value, PASUBCODE 10A value) : 100A` — `ORD500.PGM.RPGLE:13`, `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:13-15`
- Call site, last two statements of the program — `ORD500.PGM.RPGLE:58-59`
- Service program body: `PAR300.RPGLE` `GetPARM2` → `chainPARAMETER` — `ATU_SRC/QRPGLESRC/PAR300.RPGLE:34-44,82-98`

## Inputs / outputs / observables

- In: `PARAMETER.PF` row with `PACODE = 'PATH'`, `PASUBCODE = ' '` (a single blank in the call, blank-padded to 10 — the same key `PAR201.CLLE` uses); `PARM2` (`100A`) is the directory. — `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14`, `ATU_SRC/QCLSRC/PAR201.CLLE:5-8`
- In: `orid` from the `ORDER1` record buffer (`6P 0`) — not the `id` parameter (equal when the order was found). — `ORD500.PGM.RPGLE:59`
- Out: call `ORD500C` with `&ORD *CHAR 5` = `%trim(%char(orid))` (digits, no leading zeros, blank-padded to 5) and `&PATH *CHAR 100` = `PARM2` as stored (trailing blanks included). — `ORD500.PGM.RPGLE:21-23,58-59`, `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:4-7`
- Observable: the PDF appears (or is replaced) under `PATH` (`c03`); nothing is returned to `ORD500` or its caller; no message.

## Behaviour as implemented

1. `close ord500o` precedes the call — the spooled file is complete before `ORD500C` looks for `SPLNBR(*LAST)` (`c03`). — `ORD500.PGM.RPGLE:57`
2. `path = getParm2('PATH':' ')`. In `PAR300`: `chainPARAMETER` opens `PARAMETER` if not open (`usropn`), and **only if the requested key differs from the last one** does `clear *all FPARAM` + `chain kf PARAMETER`; then `return PARM2`. — `ORD500.PGM.RPGLE:58`, `PAR300.RPGLE:6,34-44,82-98`
3. `pdfOrd(%trim(%char(orid)) : path)` — `%char` of a packed `6P 0` gives the digits only (`%trim` is redundant); the value is copied into a 5-byte temporary for the `const` parameter (right-padded, or **right-truncated** when longer — `123456` → `12345`); `path` is passed as 100 bytes. Synchronous `CALL`; control returns only when `ORD500C` ends. — `ORD500.PGM.RPGLE:21-23,59`
4. Program end (`*inlr` already on — `c07`).

## Validation rules found in code

None. The returned `path` is not tested for blank or existence; `orid`'s length is not checked against the 5-byte parameter; there is no `monitor`, `(e)` or `*PSSR` around the call.

## Edge cases found in code

- **`PATH` row missing** (Phase A open question) → `chainPARAMETER` clears the buffer, the `chain` misses (untested), `PARM2` is blank → `path` = 100 blanks → `ORD500C` runs `CVTSPLPDF … TODIR(&PATH)` with a blank directory. Neither program guards this; the outcome (error escape or a file in some default location) belongs to the `CVTSPLPDF` implementation, which is **not in the tree** (`c04`). An escape would surface as an unmonitored call failure in `ORD500` (status 00202) and then in its caller (`c05`). — `PAR300.RPGLE:93-95`, `ORD500.PGM.RPGLE:58-59`, `ORD500C.PGM.CLLE:11-14`
- **Order id ≥ 100000** → `%char(orid)` is 6 characters, the `const` parameter is 5 → the last digit is dropped → `Custord12345.pdf` for orders 123450–123459 → the PDF of another order is **replaced** (`STMFOPT(*REPLACE)`, `c03`). Latent: order numbers come from the `LASTORDNO` data area (`ORD100:190-197`), currently far below; the field allows it. — `ORD500.PGM.RPGLE:22,59`, `ORD500C.PGM.CLLE:5,8-9`, `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:190-197`
- **Stale `PATH`**: `chainPARAMETER` re-reads only when the key changes; every `ORD500` call asks for the same key, and `ClosePARAMETER` is called by **nobody** in the tree. `FPARAMETER` is `ACTGRP(*CALLER)`, so `PARAMETER` stays open, with the first `PATH` value cached, until the activation group (inferred `QILE`) ends. A change to the `PATH` row through `PAR200` takes effect in a job only after that. — `PAR300.RPGLE:6,90-96`, `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8`
- **Trailing blanks**: `PARM2` is passed as a full 100-byte value; whether `CVTSPLPDF` trims the directory name is not visible from source (`c04`). — `ORD500.PGM.RPGLE:26,58-59`, `ORD500C.PGM.CLLE:7,12`
- **Caller waits**: the PDF conversion runs inside the interactive job (`ORD100` confirm, `ORD200`/`ORD201` option 6) before control returns to the screen (`c05`). — `ORD500.PGM.RPGLE:59`
- **Not reached on a not-found order id** — the exception in `c08` fires before this step; no PDF, no `PATH` lookup.

## Dependencies

- `FPARAMETER` service program (`PAR300` module, `nomain`, `PARAMETER if e k disk usropn`, `ACTGRP(*CALLER)`, `EXPORT(*ALL)`) — `PAR300.RPGLE:4-6`, `FPARAMETER.ILESRVPGM:8`; listed in `SAMPLE.BNDDIR` but `ORD500` names **no** `bnddir` (`c06`, `srvpgm-supporting-c05`). — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`
- `PARAMETER.PF` (`UNIQUE`, `K PACODE`, `K PASUBCODE`) — maintained by `PAR200` (`par-maintain`, unbound; `par-maintain-c11` records `ORD500` as one of the four `GetParm2('PATH')` consumers).
- `ORD500C.PGM.CLLE` (`c03`).

## Assumptions / unknowns

- The `const`-parameter truncation is the documented ILE RPG rule for passing a longer character value to a shorter `const` parameter (a temporary of the parameter's length is passed); stated from the language definition, not from a runtime observation. Runtime-confirmable with an order id ≥ 100000.
- needs-SME (with `par-maintain`): is `PATH` target **configuration** (environment setting) rather than data? `par-maintain-c11` asks the same question from the other side.
- needs-SME: the blank-`PATH` and stale-`PATH` behaviours are recorded as-is; neither is fixed here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:13,21-23,26,57-59` · `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:13-15,37` · `ATU_SRC/QRPGLESRC/PAR300.RPGLE:4-6,34-44,82-107` · `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14` · `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` · `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:4-14` · `ATU_SRC/QCLSRC/PAR201.CLLE:4-10` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:190-197`
