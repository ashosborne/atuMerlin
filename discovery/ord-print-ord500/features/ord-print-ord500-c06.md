# ord-print-ord500-c06 — Direct file access instead of service programs

| | |
| --- | --- |
| Slice | `ord-print-ord500` |
| Status | `documented` (as-is behaviour card, Phase B — dependency fact) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD500` declares `ARTICLE1` and `CUSTOME1` as its own files and chains them directly — the article per line for `ARDESC`, the customer once for the address block — where `ORD100` / `ORD101` call `FARTICLE.GetArtDesc` and `FCUSTOMER.GetCusName`. The only service-program dependency is `FPARAMETER` (`GetParm2`, `c02`), pulled in by `/COPY PARAMETER.RPGLEINC`; the `H` spec names **no** binding directory, so how that import is resolved is a build fact outside the tree. Miss semantics differ from the service programs: a missing article **repeats the previous line's description** (buffer not cleared; blank on the first line), a missing customer prints a blank block; neither path tests the delete flags.

## Entrypoints

- F-specs `forder1`, `fdetord1`, `fcustome1`, `farticle1` — all `if e k disk` — `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:8-11`
- `chain orcuid custome1` (once), `chain odarid article1` (per line) — `ORD500.PGM.RPGLE:33,46`
- `/COPY ../QPROTOSRC/PARAMETER.RPGLEINC` (the only prototype include); `h dftactgrp(*no)` with no `bnddir` — `ORD500.PGM.RPGLE:4,13`
- Contrast: `artdesc = GetArtDesc(odarid)` in `ORD100:117,266` / `ORD101:114,223`; `CUSTNAME = GetCusName(orcuid)` in `ORD100:328` / `ORD101:283` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:117,266,328`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:114,223,283`
- `FARTICLE` body: `GetArtDesc` → `chainARTICLE1` (`clear *all FARTI` before the chain) — `ATU_SRC/QRPGLESRC/ART300.RPGLE:19-27,114-127`

## Inputs / outputs / observables

- `ARTICLE1` (`UNIQUE`, `K ARID`) → `ARDESC` (50) on each `DETAIL` second line; `ARDEL` read but never tested. — `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7,39`, `ATU_SRC/QDDSSRC/ORD500O.PRTF:78-79`
- `CUSTOME1` (`UNIQUE`, `K CUID`) → `CUSTNM`, `CULINE1`–`3`, `CUCOUN`, `CUZIP`, `CUCITY` on `HEADER2`; `CUDEL` never tested. — `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`, `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-16,29`, `ORD500O.PRTF:18-42`
- `PARAMETER` is **not** an F-spec here: it is opened and kept open inside `FPARAMETER` (`c02`).

## Behaviour as implemented

1. Customer: `chain orcuid custome1` right after the order chain, `%found` untested; the `FCUST` buffer feeds `HEADER2` as-is. Miss → the buffer holds initial values (blanks) on a fresh call → six blank customer lines under `'Customer' <ORCUID>`. — `ORD500.PGM.RPGLE:33,35`
2. Article: `chain odarid article1` per line, `%found` untested, **no `clear`** → on a miss the `FARTI` buffer keeps the previous line's row, so the wrong description is printed; on a miss on the first line it is blank. Identical mechanism to `ord-maintain-ord202-c02`/`c06`. — `ORD500.PGM.RPGLE:46,50`
3. Contrast `FARTICLE.chainARTICLE1`: `clear *all FARTI` **before** the chain, and a last-key cache (`if P_ARID <> ARID`) → `GetArtDesc` returns blank for an unknown article and re-reads only on a key change. So the entry screens show blank for the article the print later mis-labels. — `ART300.RPGLE:114-127`
4. Contrast `FCUSTOMER.GetCusName` (`cus-modules`, documented): the entry programs fetch the name through the service program; `ORD500` (like `ORD200` and `ORD202`) chains `CUSTOME1` itself.
5. Files open at program start and close at `*inlr` on every call — no cross-call cache for any of the four LFs (the `PARAMETER` cache inside `FPARAMETER` is the exception — `c02`).

## Validation rules found in code

None: no `%found`, no `ARDEL` / `CUDEL` test, no `%error`.

## Edge cases found in code

- **Deleted article / customer** (`ARDEL` / `CUDEL` = `'X'`, `SAMREF.DLCODE`) prints normally — the soft-delete flag is not consulted anywhere in the print path. — `ARTICLE.PF:39`, `CUSTOMER.PF:29`, `ATU_SRC/QDDSSRC/SAMREF.PF:26-27`
- **Two lookup rules for one fact** across the estate: `FARTICLE` → blank on miss; `ORD500` / `ORD202` → stale carry-over on miss. Recorded as-is; a target lookup rule is a room question already carried by `ord-maintain-ord202` (`needs_sme`).
- **Binding not in tree**: `ORD500` has `dftactgrp(*no)` but neither `bnddir(…)` on the `H` spec nor a `.ILEPGM` build member under `QILESRC/` (only `PAR201`, `PRO200` have one); `FPARAMETER` is listed in `SAMPLE.BNDDIR`, which `ORD500` does not name. `srvpgm-supporting-c05` (unbound) records this as the ARCAD/elias build-metadata blind spot. Activation group inferred `QILE`; `FPARAMETER` is `ACTGRP(*CALLER)`. — `ORD500.PGM.RPGLE:4`, `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`, `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8`
- **`ORDER1` / `DETORD1` are the same seams the list twins use** — no `ORDERCUS` SQL view here; an order whose customer row is missing (unreachable via the lists — `ord-maintain-ord201-c01`) can still be printed by a direct call and yields the blank customer block.

## Dependencies

- `ORDER1.LF`, `DETORD1.LF`, `CUSTOME1.LF`, `ARTICLE1.LF` over `ORDER`, `DETORD`, `CUSTOMER`, `ARTICLE`; `ORD500O.PRTF` — all on `*LIBL`.
- `FPARAMETER` service program (`PAR300`) — `c02`; `FARTICLE` (`art-modules`, unbound) and `FCUSTOMER` (`cus-modules`, documented) are **contrasts**, not dependencies.

## Assumptions / unknowns

- Build owner: how `GetParm2` is bound into `ORD500` (`CRTPGM` with `BNDSRVPGM(FPARAMETER)` or a default binding directory); activation group.
- needs-SME / room: one article / customer lookup rule for the target (blank, `'unknown'`, or error) — same line as `ord-maintain-ord202-c06`; recorded as-is here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:4,8-11,13,33,35,46,50` · `ATU_SRC/QRPGLESRC/ART300.RPGLE:19-27,114-127` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:117,266,328` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:114,223,283` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5-7,39` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-16,29` · `ATU_SRC/QDDSSRC/SAMREF.PF:26-27` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` · `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QDDSSRC/ORD500O.PRTF:18-42,78-79`
