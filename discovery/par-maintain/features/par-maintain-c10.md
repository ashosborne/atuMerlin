# par-maintain-c10 — EXPORT(*ALL) exports the five getters only; chainPARAMETER / closePARAMETER are module-local (title corrected — see Correction)

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — binding fact) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Correction (Pack B run 16, 2026-09-09, `srvpgm-supporting-c06`)

> `EXPORT(*ALL)` on `CRTSRVPGM` exports every symbol **the modules export** — and a module exports a procedure only if its P-spec carries the `export` keyword. In `PAR300.RPGLE` only `GetPARM1`–`GetPARM5` carry it (`:22,34,46,58,70`); `chainPARAMETER` (`:82`) and `closePARAMETER` (`:100`) do not, so they are local to the module and **cannot** be exported by the service program. `FPARAMETER` therefore exports **five** procedures, not seven; `DSPSRVPGM FPARAMETER DETAIL(*PROCEXP)` would list five. Consequences for the text below: `ClosePARAMETER` in the copybook (`PARAMETER.RPGLEINC:37`) has **no export behind it** — a caller would compile and then fail to bind (unresolved import), the same over-advertising every getter copybook shows (`srvpgm-supporting-c06`); `chainPARAMETER` is not reachable from outside at all. The latent "close does not clear the cache" observation (step 3) remains true of the *body* but is unreachable. The original text is kept below with the affected statements struck; the id, bind and the rest of the card are unchanged. `LOG` (`log-programs-c08`) was read correctly at the time (one export).

## Summary

`FPARAMETER` is built with `CRTSRVPGM … MODULE(PAR300) ACTGRP(*CALLER) EXPORT(*ALL)` and there is no `QSRVSRC/FPARAMETER.BND`. ~~Every procedure of `PAR300` is therefore exported — the five getters **and** the private-by-intent `chainPARAMETER` and `closePARAMETER`~~ **Corrected:** the five getters are exported; `chainPARAMETER` and `closePARAMETER` have no `export` keyword and stay module-local — and the service-program signature is generated from that five-symbol export list, with no `*PRV` history. Contrast: `FCOUNTRY` hides `closeCOUNTRY` behind `EXPORT(*SRCFILE)` (`cou-maintain-c11`); `FPROVIDER` is the only versioned binder. The copybook publishes `GetPARM1`–`5` and `ClosePARAMETER` but **not** `chainPARAMETER`, ~~so a caller could reach the cache-priming chain only by writing its own prototype~~ **Corrected:** no caller can reach `chainPARAMETER` (not exported), and a caller of `ClosePARAMETER` would fail to bind. Build note, not user-visible behaviour; it matters for the target API surface (export only the getters) and for rebinding rules.

## Entrypoints

- `ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` — `CRTSRVPGM SRVPGM(&O/&N) MODULE(PAR300) ACTGRP(*CALLER) EXPORT(*ALL)`
- `PAR300` procedure list: `GetPARM1`–`GetPARM5` (`export` keyword — exported), `chainPARAMETER`, `closePARAMETER` (no keyword — **module-local, not exported**; corrected) — `ATU_SRC/QRPGLESRC/PAR300.RPGLE:22,34,46,58,70,82,100`
- Copybook — `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:7-37`

## Inputs / outputs / observables

- Observable only at bind time: `DSPSRVPGM FPARAMETER DETAIL(*PROCEXP)` would list ~~seven~~ **five** procedures (runtime-confirmable; corrected); `DETAIL(*SIGNATURE)` one generated signature.
- Callers bound: `PAR201` (`BNDSRVPGM(FPARAMETER)`), `PRO200` (`BNDSRVPGM(XML FCOUNTRY FPARAMETER)`), and any program using `bnddir('SAMPLE')` — `*LIBL/FPARAMETER` is in the directory. `ORD500` / `PRO203` name neither (`srvpgm-supporting-c05`). — `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9`, `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9`, `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`

## Behaviour as implemented

1. `EXPORT(*ALL)` with no binder source → ~~all seven procedures exported~~ **the five module exports** (`GetPARM1`, `GetPARM2`, `GetPARM3`, `GetPARM4`, `GetPARM5`) exported, in source order; `chainPARAMETER` / `closePARAMETER` are not module exports (corrected). — `FPARAMETER.ILESRVPGM:8`, `PAR300.RPGLE:22-107`
2. Signature generated from the export names/order; adding, removing or reordering a procedure (or renaming `chainPARAMETER`) changes it → every bound program gets a signature violation at activation (`MCH4431`) until re-bound. No `*PRV` block exists to keep old signatures valid. — platform rule; `FPARAMETER.ILESRVPGM:8`
3. `ClosePARAMETER` is ~~callable (prototyped)~~ **prototyped but not exported — a call would not bind** (corrected); if it were exported it would close the shared ODP and — because the buffer is not cleared — **not** reset the cache key: after a close, the next getter re-opens and, if the same key is requested, still skips the chain (`PACODE` unchanged), returning the buffer as it was. Nobody calls it, so this is latent. — `PAR300.RPGLE:100-107,90-96`
4. `chainPARAMETER` ~~is callable by anyone with a matching prototype~~ **is module-local (no `export`) and cannot be called from outside `PAR300`** (corrected); it primes the cache and returns nothing. Not in the copybook; no caller. — `PAR300.RPGLE:82-98`

## Validation rules found in code

None — no binder language, no signature literal, no `*PRV`.

## Edge cases found in code

- **`closePARAMETER` does not invalidate the cache** (step 3) — and it is not exported, so there is *no* reset path at all from outside (corrected). Latent; recorded so nobody adds a `ClosePARAMETER()` call expecting a refresh — it would fail to bind.
- **Case drift in the copybook**: `ClosePARAMETER` (copybook) vs `closePARAMETER` (body) — RPG names are case-insensitive, so it binds; cosmetic.
- **`* git change`** comment line in `PAR300` — comment only, no code. — `PAR300.RPGLE:5`
- **`ACTGRP(*CALLER)`** is the other half of this build line: cache and ODP scope follow the caller (`c09`).

## Dependencies

- `SAMPLE.BNDDIR` (11 service programs, `FPARAMETER` among them — `srvpgm-supporting`) — `SAMPLE.BNDDIR:8-14`
- `PAR201.ILEPGM`, `PRO200.ILEPGM` explicit binds — `srvpgm-supporting-c04`

## Assumptions / unknowns

- Signature generation for `EXPORT(*ALL)` and `MCH4431` on mismatch are ILE rules — runtime-confirmable; whether the build ever bumped the signature is a build-history question (no `*PRV`, so it cannot be seen from source).
- needs-SME (build owner / ME): the target should expose the getters only; `chainPARAMETER` / `closePARAMETER` are implementation. Not a behaviour to carry.

## Evidence

`ATU_SRC/QILESRVSRC/FPARAMETER.ILESRVPGM:8` · `ATU_SRC/QRPGLESRC/PAR300.RPGLE:4-5,22,34,46,58,70,82-107` · `ATU_SRC/QPROTOSRC/PARAMETER.RPGLEINC:7-37` · `ATU_SRC/QILESRC/PAR201.ILEPGM:8-9` · `ATU_SRC/QILESRC/PRO200.ILEPGM:8-9` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`
