# log-programs-c08 — LOG service program: EXPORT(*ALL) exports one procedure; how ORD700 binds to it is not in source

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — build note / blind spot) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`LOG.ILESRVPGM` (ARCAD-generated build description) is one command: `CRTSRVPGM SRVPGM(&O/&N) MODULE(LOG300) ACTGRP(*CALLER) EXPORT(*ALL)`. There is **no binder source** (`ATU_SRC/QSRVSRC/` holds `.BND` members for `FARTICLE`, `FCOUNTRY`, `FCUSTOMER`, `FFAMILLY`, `FPROVIDER`, `FVAT` — not `LOG`, not `FPARAMETER`), so the export list is whatever `LOG300` exports and the signature is generated from it — no `*PRV`, no compatibility control. `LOG300` exports exactly **one** symbol: `AddLogEntry` has the `export` keyword on its P-spec; `init` does not, and no D-spec is `export`ed. So `EXPORT(*ALL)` here means one procedure, not "everything in the module" — the module statics (`p1`, `pos`, `inz`, `User`) stay private. On the consumer side the binding is a blind spot: `LOG` is **absent from `SAMPLE.BNDDIR`** (eleven service programs listed, not `LOG`), `ORD700`'s H-spec is `dftactgrp(*no)` with **no `bnddir`**, and `ATU_SRC/QILESRC/` has no `ORD700.ILEPGM` — so the only in-tree caller (`c07`) cannot be built from the tree as it stands; the `BNDSRVPGM`/`BNDDIR` that resolves `AddLogEntry` lives in ARCAD build metadata outside `ATU_SRC`. Same finding as `srvpgm-supporting` (`SAMPLE.BNDDIR` contents; `EXPORT(*ALL)` twins) and `ord-trigger-ord700-c03` (build-owner question).

## Entrypoints

- `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:1-8` — ARCAD header (`FGRMON_OBJ/LOG`, 2022-05-17) + `CRTSRVPGM … MODULE(LOG300) ACTGRP(*CALLER) EXPORT(*ALL)`
- `ATU_SRC/QRPGLESRC/LOG300.RPGLE:18` — `p AddLogEntry b export`; `:37` — `p init b` (no `export`); `:12-16` — module statics, none `export`
- `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` — `CRTBNDDIR` + `ADDBNDDIRE … OBJ((*LIBL/XML) (*LIBL/ORDER) (*LIBL/TXT) (*LIBL/XSS) (*LIBL/FARTICLE) (*LIBL/FCUSTOMER) (*LIBL/FFAMILLY) (*LIBL/FPARAMETER) (*LIBL/FPROVIDER) (*LIBL/FVAT) (*LIBL/FCOUNTRY))` — no `LOG`
- `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4` — `H dftactgrp(*no)` (no `bnddir`, no `actgrp`)
- Absence: `ATU_SRC/QSRVSRC/` listing (six `.BND`, no `LOG.BND`); `ATU_SRC/QILESRC/` listing (`PAR201.ILEPGM`, `PRO200.ILEPGM` only); grep `ATU_SRC/**` for `\bLOG\b` in `QBNDSRC`, `QILESRC`, `QSRVSRC` (none)

## Inputs / outputs / observables

- Build output: `*SRVPGM LOG`, activation group of the caller, exports `AddLogEntry` only, generated signature. — `LOG.ILESRVPGM:8`, `LOG300.RPGLE:18,37`
- Observable on the box: `DSPSRVPGM LOG DETAIL(*PROCEXP)` → one procedure; `DETAIL(*SIGNATURE)` → one generated signature; `DSPPGM ORD700 DETAIL(*SRVPGM)` → which `LOG` (library) it was bound to — the fact the tree cannot give.

## Behaviour as implemented

1. `CRTSRVPGM` with `EXPORT(*ALL)`: the binder exports every symbol the module exports — here `AddLogEntry`. — `LOG.ILESRVPGM:8`, `LOG300.RPGLE:18`
2. `ACTGRP(*CALLER)`: the service program's statics live in the caller's activation group (`ORD700` → `QILE`, inference) — this is what makes `init` once-per-job and `User` stamped-at-activation (`c03`). — `LOG.ILESRVPGM:8`
3. `ORD700` compiled with `CRTBNDRPG` needs `AddLogEntry` resolved at bind time; with no `bnddir` in the H-spec and no `.ILEPGM`, the compile command itself must have carried `BNDDIR(...)` or `BNDSRVPGM` — not in the tree. — `ORD700.PGM.RPGLE:4`

## Validation rules found in code

Not applicable (build description).

## Edge cases found in code

- **Signature drift.** Any change to `LOG300`'s export set (adding a second exported procedure) regenerates the signature; without `*PRV` every bound program (`ORD700`) must be re-bound or fails at activation (`MCH4431`, inference). Latent — nothing changes today.
- **`EXPORT(*ALL)` is harmless here** because the module exports one procedure; contrast `FPARAMETER` (`par-maintain-c10`), where the same option exposes internal helpers. Applying the P-spec rule consistently: only procedures with `export` on their `b` line are module exports.
- **`LOG` not in `SAMPLE.BNDDIR`** while `FPARAMETER` is — so `PAR201`/`PRO200` (`.ILEPGM` with the bind directory) could not resolve `AddLogEntry` either; the log is reachable only by whatever bound `ORD700`. — `SAMPLE.BNDDIR:8-14`, `srvpgm-supporting`

## Dependencies

- `srvpgm-supporting` (accepted, next-but-one in queue) owns the estate-wide binding inventory (`SAMPLE.BNDDIR`, `.BND` members, `.ILEPGM`); cited, not deepened.
- `ord-trigger-ord700-c03` (documented) carries the same "how is `AddLogEntry` bound into `ORD700`" needs-SME line; not duplicated.

## Assumptions / unknowns

- needs-SME (build owner / ARCAD): the compile/bind command for `ORD700`; which library's `LOG` it is bound to; whether `LOG` should be added to `SAMPLE.BNDDIR` for a from-source rebuild.
- Platform (inference): `EXPORT(*ALL)` semantics; `*CALLER` static lifetime; signature-violation message id.
- Target: none — the ORD vertical has no service-program boundary here (a Postgres trigger function writes `samlog` directly, `modern/db/schema.sql:189-199`).

## Evidence

`ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:1-8` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:12-18,37` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4,8` · `ATU_SRC/QSRVSRC/` and `ATU_SRC/QILESRC/` listings (absence)
