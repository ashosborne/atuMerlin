# ord-print-ord500-c03 — Spool to PDF via CVTSPLPDF

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B — output contract of the invocation; the converter itself is the `c04` blind spot) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD500C(&ORD, &PATH)` is a two-statement CL: it builds the file name `Custord<orid>.pdf` and runs `CVTSPLPDF FROMFILE(ORD500O) TOSTMF(&FILENAME) TODIR(&PATH) SPLNBR(*LAST) STMFOPT(*REPLACE) PAGESIZE(*A4 *PORTRAIT) FONT(*COURIER 11) BOOKMARK(*NONE)`. The **last** `ORD500O` spooled file of the **current job** is converted; an existing PDF of the same name is **replaced**; the spooled file itself is left in the output queue. There is no `MONMSG`: any failure escapes to `ORD500` and from there, unmonitored, to the interactive caller. The command definition is in the tree; its processing program is not (`c04`, needs-SME), so what the PDF looks like — and how a blank directory, a missing directory or a mixed-case file name are treated — cannot be documented from source.

## Entrypoints

- `PGM PARM(&ORD &PATH)`; `&ORD *CHAR 5`, `&FILENAME *CHAR 50`, `&PATH *CHAR 100` — `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:4-7`
- Only caller: `ORD500` (`pdford … extpgm('ORD500C')`) — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:21-23,59`; no other reference to `ORD500C` under `ATU_SRC/**`
- Command definition `CVTSPLPDF.CMD` (`PROMPT('Convert Spool to PDF')`) — `ATU_SRC/QCMDSRC/CVTSPLPDF.CMD:4-96`

## Inputs / outputs / observables

- In: `&ORD` — the order id as up to five characters (`c02`); `&PATH` — the IFS directory from `PARAMETER.PATH`, 100 bytes.
- In (implicit): the job's most recent spooled file named `ORD500O` — `JOB` is not given, so the command default `*` (current job) applies; `SPLNBR(*LAST)` picks the newest. — `ORD500C.PGM.CLLE:11-12`, `CVTSPLPDF.CMD:15-24`
- Out: stream file `<&PATH>/Custord<orid>.pdf`, A4 portrait, Courier 11, no bookmarks, replacing any existing file of that name. — `ORD500C.PGM.CLLE:8-14`
- Not produced: no return value, no message to the user, no deletion or hold of the spooled file (the command has no such parameter). — `CVTSPLPDF.CMD:6-89`

## Behaviour as implemented

1. `CHGVAR &FILENAME ('Custord' *CAT &ORD *TCAT '.pdf')` — `*CAT` appends the 5-byte `&ORD` with its trailing blanks; `*TCAT` then trims those blanks before appending `.pdf` → `Custord123.pdf` (no padding, no leading zeros — `c02`). — `ORD500C.PGM.CLLE:8-9`
2. `CVTSPLPDF` with the parameters below; the program ends when the command returns (no explicit `ENDPGM` in the source — optional in CL). — `ORD500C.PGM.CLLE:11-14`

| Parameter | As invoked | Command default (`CVTSPLPDF.CMD`) | Note |
| --- | --- | --- | --- |
| `FROMFILE` | `ORD500O` | required | spooled-file (printer-file) name — `:6-7` |
| `TOSTMF` | `&FILENAME` (`Custord<orid>.pdf`) | required | `TYPE(*NAME) LEN(64)` — `:9-10` |
| `TODIR` | `&PATH` | required | `TYPE(*PNAME) LEN(256)` — `:12-13` |
| `JOB` | — | `*` (current job) | — `:15-20` |
| `SPLNBR` | `*LAST` | `*ONLY` | `*LAST` = special value `-2` — `:22-24` |
| `STMFOPT` | `*REPLACE` | `*NONE` | existing PDF overwritten — `:26-28` |
| `STMFCODPAG` | — | `1250` | — `:30-32` |
| `TITLE` | — | `*NONE` | — `:34-36` |
| `PAGESIZE` | `*A4 *PORTRAIT` | `*SPLF` | orientation default would be `*LANDSCAPE` — `:38-45` |
| `FONT` | `*COURIER 11` | `*CONVERT` | — `:57-65` |
| `BOOKMARK` | `*NONE` | `*PAGNBR` | — `:67-69` |

## Validation rules found in code

None in `ORD500C`: no `MONMSG`, no `CHKOBJ` on the directory, no test of `&PATH` or `&ORD`. Whatever validation exists is inside the `CVTSPLPDF` processing program (absent — `c04`).

## Edge cases found in code

- **Any failure escapes.** With no `MONMSG`, an escape message from `CVTSPLPDF` (directory missing, blank `&PATH`, command or processing program not found on `*LIBL`, conversion error) ends `ORD500C` in error; `ORD500` has no `monitor` on the call (status 00202) and no `*PSSR`, so the failure reaches the interactive caller (`ORD100`, `ORD200`, `ORD201`) as an unmonitored function check (inference from CL/ILE RPG semantics — an inquiry message in the user's session). In `ORD100` this happens **before** the "The order is printed." window (`c05`). The spooled file has already been produced by then. — `ORD500C.PGM.CLLE:11-14`, `ORD500.PGM.RPGLE:59`
- **Re-print replaces.** Option 6 in `ORD200` / `ORD201` runs the same path; `STMFOPT(*REPLACE)` overwrites `Custord<orid>.pdf`, so the PDF for an order is always the **latest** print (with the lines and stored totals as they are at that moment — `c01`), not the confirmation-time document. A new spooled file is added to the output queue on every print. — `ORD500C.PGM.CLLE:12-13`
- **Name collision on truncation** (`c02`): orders `123450`–`123459` all map to `Custord12345.pdf` and replace each other.
- **`SPLNBR(*LAST)` relies on ordering.** It addresses the newest `ORD500O` spooled file of the job — correct because `ORD500` closes its printer file immediately before the call (`c01`, `c02`). If the printer file were left open (it is not), or if the job produced another `ORD500O` in between (single-threaded interactive job — it cannot), a different document would be converted. — `ORD500.PGM.RPGLE:57-59`, `ORD500C.PGM.CLLE:12`
- **`TOSTMF` is `TYPE(*NAME)`, not `*PNAME`.** `Custord123.pdf` is a syntactically valid simple name (letters, digits, period). Whether the command analyser applies name rules to a mixed-case value supplied from a CL variable (folding `Custord` to `CUSTORD`) — and therefore what the file is actually called on the IFS — is not decidable from source; part of the `c04` blind spot. `TODIR` is `*PNAME`, so `&PATH` is taken as a path. — `CVTSPLPDF.CMD:9-13`
- **Trailing blanks in `&PATH`** (`c02`) — handled, or not, by the processing program.
- **`&ORD` shorter than 5** — blank-padded by the caller; trimmed by `*TCAT`; no zero-padding, so `Custord7.pdf`, `Custord123.pdf`. — `ORD500C.PGM.CLLE:8-9`

## Dependencies

- `CVTSPLPDF` command (definition present, processing program absent — not an IBM-supplied command; provider unknown, `c04` / needs-SME). — `CVTSPLPDF.CMD:4`
- The `ORD500O` spooled file in the current job (`c01`); `&PATH` from `PARAMETER` (`c02`).
- The directory named in `PATH` must exist and be writable by the job's user — a runtime environment fact; nothing in the tree creates it.

## Assumptions / unknowns

- The PDF's rendering (fonts, page fit of a 90-column `*SCS` spool on A4 portrait at Courier 11, `HIGHLIGHT` handling, code page 1250) is entirely the converter's — **cannot be characterized from source**. `c04` stays needs-SME: which product supplies `CVTSPLPDF`, and is the PDF in parity scope at all, or is "a PDF named `Custord<orid>.pdf` exists under `PATH`" the contract to preserve?
- The escape-propagation path (CL escape → RPG status 00202 → caller's function check) is stated from platform semantics; the source shows only the absence of every handler. Runtime-confirmable.

## Evidence

`ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:4-14` · `ATU_SRC/QCMDSRC/CVTSPLPDF.CMD:4-96` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:21-23,57-59`
