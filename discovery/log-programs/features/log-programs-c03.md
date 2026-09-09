# log-programs-c03 — AddLogEntry: resolve SAMLOG once per activation group, append 'User: … * Date: … * Msg: … ***'

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — the log line contract) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`AddLogEntry(entry 500A by value)` is the only export of the `LOG` service program (`LOG300`, `nomain`). On the first call in an activation group it runs `init`: sets `inz = *on` and resolves `'SAMLOG    *LIBL'` to a pointer `p1` with `QUSPTRUS`. Every call then builds one line in a 500-byte varying field —

`'User: ' + User + ' * ' + 'Date: ' + %char(%timestamp()) + ' * ' + 'Msg: ' + %trim(entry) + ' ***'`

— assigns it to the 600-byte fixed field based at `p1 + pos` (so **600 bytes are written**: the line, blank-padded), and advances `pos` by the line's logical length. `User` is a module static initialised `inz(*USER)` — the job user **at the moment the service program was activated**, not at each call — and is written as its full 10 characters, blank-padded (not trimmed). The fixed part of a line is 63 bytes (`6 + 10 + 3 + 6 + 26 + 3 + 5 + 4`), so a line is `63 + len(%trim(entry))` bytes; the in-tree caller (`ORD700`, `c07`) produces lines of roughly 120–130 bytes. There is no newline, no record boundary, no size check (`c04`), no lock (`c10`), no error handling: the procedure has no `monitor` and `QUSPTRUS` is called without an error-code parameter, so failures escape to the caller — who in-tree swallows them (`callp(e)`, `%error` never tested).

## Entrypoints

- `ATU_SRC/QPROTOSRC/LOG.RPGLEINC:4-5` — `d AddLogEntry pr` / `d entry 500 value`
- `ATU_SRC/QRPGLESRC/LOG300.RPGLE:6` — `h nomain`; `:4` — ARCAD `%XREF … OBJ(SAMLOG) OBJTYPE(*USRSPC) USAGE(*UPD)`
- `LOG300.RPGLE:12-16` — `pos 10i 0 based(p1)`, `data 600 based(p2)`, `usrspc 20`, `inz n`, `User 10 inz(*USER)`
- `LOG300.RPGLE:18-35` — `p AddLogEntry b export` … `p e`
- `LOG300.RPGLE:37-46` — `p init b` (not exported): `usrspc = 'SAMLOG    *LIBL'; inz = *on; rtvusrspcptr(usrspc:p1);`
- `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8` — `CRTSRVPGM SRVPGM(&O/&N) MODULE(LOG300) ACTGRP(*CALLER) EXPORT(*ALL)`
- Caller: `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:78-81` (`c07`)

## Inputs / outputs / observables

- In: `entry` — 500 bytes by value (a shorter literal is blank-padded by the prototype; `%trim` then removes leading **and** trailing blanks). — `LOG300.RPGLE:20,30`
- In (implicit): `pos` at offset 0 of `SAMLOG` (`c02`); `User` (static, first activation); `%timestamp()` — the job's current timestamp, `%char` = `YYYY-MM-DD-HH.MM.SS.UUUUUU` (26 characters, ISO form, microseconds). — `:12,16,29`
- Out: 600 bytes written at `p1 + pos`: the line, then blanks; `pos += %len(data2)`. — `:13,27,31-32`
- Observable line (example, `ORD700` message, user `ASH`): `User: ASH        * Date: 2026-09-09-09.15.00.123456 * Msg: ORD700:Order Line deleted 123 1 article : ART001 quantity : 10 ***` — the next line begins immediately after the final `*`.

## Behaviour as implemented

1. `if not inz; init(); endif;` — once per activation group: `inz = *on` is set **before** `rtvusrspcptr`, so a failed resolution is never retried in that activation group (`c06`). — `LOG300.RPGLE:24-26,41-43`
2. `p2 = p1 + pos;` — position at the current cursor. — `:27`
3. `data2 = 'User: ' + user + ' * '; data2 += 'Date: ' + %char(%Timestamp()) + ' * '; data2 += 'Msg: ' + %trim(entry) + ' ***';` — three concatenations into a **500-byte varying** field. — `:28-30`
4. `data = data2;` — assignment to the 600-byte fixed field: the varying value is copied and the remainder blank-padded — 600 bytes touched from `pos`. — `:13,31`
5. `pos += %len(data2);` — cursor advanced by the logical length only; the padding blanks are overwritten by the next entry. — `:32`

## Validation rules found in code

None. No length check on `entry`, no check that `p1` is set, no check that `pos + 600 ≤ size` (`c04`), no `%error`, no `monitor`, no `*pssr`.

## Edge cases found in code

- **`User` is stamped at activation, not per call.** `inz(*USER)` runs when the service program's static storage is initialised in the caller's activation group (`ACTGRP(*CALLER)`; `ORD700` is `dftactgrp(*no)` with no `actgrp` → `QILE`, inference). In an interactive job that is the signed-on user; in a job that swaps profiles (server job, `QWTSETP`) later lines carry the first user (platform; inference). — `LOG300.RPGLE:16`, `LOG.ILESRVPGM:8`, `ORD700.PGM.RPGLE:4`
- **Long messages truncate and lose the terminator.** `data2` is `500 varying`; the fixed part is 63 bytes, so a trimmed `entry` longer than 437 characters is cut at 500 and the `' ***'` delimiter is not written — the next line is glued on with no separator. Not reachable from the in-tree caller (`ORD700` ≈ 60 characters); latent in the interface (`entry` is 500). — `:20,22,28-30`
- **Leading blanks are removed** (`%trim`, both ends); trailing blanks of `User` are kept (`User` is not trimmed). — `:28,30`
- **600-byte write for a ~125-byte line** — the physical write always extends 600 bytes past `pos`; this is what makes the overflow point `size − 600`, not `size` (`c04`). — `:13,31`
- **Every call after a failed `init` fails too.** `p1` stays `*null`, `inz` stays `*on`; `p2 = p1 + pos` dereferences a null basing pointer → `MCH3601`, escaped to the caller, swallowed by `callp(e)` in `ORD700`. No retry until the activation group ends (`c06`). — `:24-27,42-43`, `ORD700.PGM.RPGLE:78`
- **`SAMLOG` replaced while resolved (`c01` re-run):** `p1` still addresses the old space; entries go to the replaced copy (inference).
- **No newline** — a viewer that does not split on `' ***'` shows one continuous line.

## Dependencies

- `SAMLOG` `*USRSPC` on `*LIBL` (`c01`); `QUSPTRUS` (`APICALL.RPGLEINC:14-16`)
- `LOG.RPGLEINC` prototype; binding into the caller (`c08`)
- Caller: `ORD700` event `'2'` (`c07`, `ord-trigger-ord700-c03`)

## Assumptions / unknowns

- Platform facts flagged inference: static initialisation timing of `inz(*USER)` in a `*CALLER` service program; `%char(%timestamp())` 26-character form; null-basing-pointer exception id; `QILE` default for `dftactgrp(*no)`.
- Target: the ORD vertical writes the same `Msg` text and a 10-character user to a `samlog` table per delete (`modern/db/schema.sql:170-199`, `modern/README.md:219-220`); the per-call user and the timestamp column replace the static `User` and the in-line `Date`. Whether the legacy *line string* (with `User:` / `Date:` prefixes) must be reproducible is a room question, not decided here.

## Evidence

`ATU_SRC/QRPGLESRC/LOG300.RPGLE:4,6,12-16,18-35,37-46` · `ATU_SRC/QPROTOSRC/LOG.RPGLEINC:4-5` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:14-16` · `ATU_SRC/QILESRVSRC/LOG.ILESRVPGM:8` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:4,78-81`
