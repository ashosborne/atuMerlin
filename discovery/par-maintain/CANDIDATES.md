# CANDIDATES — par-maintain (Phase A, unbound)

Seed: `PAR200` + `PAR201` + `FPARAMETER` (`PAR300`). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| par-maintain-c01 | `PAR200` lists `PARAMETER` rows by (`PACODE`, `PASUBCODE`) 14 per load with two-part saved-key restore; list shows `PARM1`, first 32 chars of `PARM2` (`PARM2S`), `PARM3`, `PARM4`, `PARM5`; F5 refresh reloads from the top; options 2 / 4 only, others RI + SFLMSG 35 | `QRPGLESRC/PAR200.PGM.RPGLE:92-119`, `:133-150`, `:153-173`; `QDDSSRC/PAR200D.DSPF:15-28`, `:31-41` | observed-in-code | Core list |
| par-maintain-c02 | F6 create → FMT03: code, sub-code and all five values input; Enter checks the key does not already exist (40 `This code/sub-code already exist.`) then `write fparam`; no other validation (blank code allowed, numeric fields unvalidated) | `PAR200.PGM.RPGLE:145-147`, `:251-305`; `PAR200D.DSPF:140-151` | observed-in-code | Create path |
| par-maintain-c03 | **After a create the list is not refreshed**: F6 sets `step01 = lod`, so on return the program appends the *next* 14 rows from the saved position instead of reloading; the new row appears only after F5 or re-entry | `PAR200.PGM.RPGLE:145-147`, `:93-107`, `:301-304` | observed-in-code | Display quirk |
| par-maintain-c04 | Option 2 edit → FMT02: key output, `PARM1..5` input (`PARM2` accepts lowercase); Enter → `update fparam` unconditionally, no validation, no audit | `PAR200.PGM.RPGLE:180-184`, `:216-247`; `PAR200D.DSPF:106-115` | observed-in-code | Edit path |
| par-maintain-c05 | Option 4 delete is **immediate**: `delete (pacode:pasubcode) parameter` with no confirmation; the subfile row is rewritten blank with `PARM2 = '*** Deleted ****'`; consecutive 4s processed in one pass | `PAR200.PGM.RPGLE:185-192` | observed-in-code | Delete path |
| par-maintain-c06 | Key semantics: F3 on FMT02 / FMT03 returns to the list (panel 1), not exit; F12 on the list ends the program | `PAR200.PGM.RPGLE:135-140`, `:226-236`, `:278-288` | observed-in-code | Navigation |
| par-maintain-c07 | `PAR201` (CL, menu opt 83): `CALLPRC GETPARM2('PATH', ' ')` into a 100-char variable, appends `'*'` with `*TCAT`, then `WRKLNK OBJ(&PATH)` — opens the IFS directory where the application writes its PDF / XML / spreadsheet outputs | `QCLSRC/PAR201.CLLE:4-10`; `QILESRC/PAR201.ILEPGM:8-9`; `QPNLSRC/SAMMNU.MENU:155-158` | observed-in-code | Operator utility; the only CL that binds a service program procedure |
| par-maintain-c08 | If `PATH` is blank / missing, `PAR201` runs `WRKLNK OBJ('*')` (current directory); the RPG consumers would build file names relative to a blank path | `PAR201.CLLE:9-10`; `PAR300.RPGLE:34-44` (blank buffer on miss) | inferred | Edge behaviour (runtime) |
| par-maintain-c09 | `FPARAMETER` getters: `GetPARM1` (10A), `GetPARM2` (100A), `GetPARM3` (2A), `GetPARM4` (1P 0), `GetPARM5` (3P 0), all keyed by (`PACODE`, `PASUBCODE`) 10A by value over a cached `PARAMETER` chain (two-part last-key cache); unknown key → blanks / zero | `QRPGLESRC/PAR300.RPGLE:22-80`, `:82-98`; `QPROTOSRC/PARAMETER.RPGLEINC:7-33` | observed-in-code | Getter family |
| par-maintain-c10 | `FPARAMETER` is built with `EXPORT(*ALL)` — no binder source — so the internal `chainPARAMETER` and `closePARAMETER` are **exported too** (unlike every `*SRCFILE` srvpgm where `close*` is hidden); no signature control | `QILESRVSRC/FPARAMETER.ILESRVPGM:8`; no `QSRVSRC/FPARAMETER.BND` | observed-in-code | Binding fact |
| par-maintain-c11 | Only one parameter is live in the tree: `('PATH', ' ')` via `GetParm2` from `ORD500`, `PRO202`, `PRO203`, `PAR201`; `GetPARM1/3/4/5` have **no caller** | `ORD500.PGM.RPGLE:58`; `PRO202.SQLRPGLE:151`; `PRO203.PGM.SQLRPGLE:32`; `PAR201.CLLE:7`; grep = none for the others | observed-in-code | Call graph / data contract |
| par-maintain-c12 | `PARAMETER` is a plain key/value table: no audit or delete columns, `UNIQUE` on the two-part key, sub-code blank for `PATH` | `QDDSSRC/PARAMETER.PF:4-14` | observed-in-code | Data-model fact |
| par-maintain-c13 | `LOG100` opens `PARAMETER` only to read the library name from the INFDS (pos 93–102) and create the `SAMLOG` user space next to it — the file's library doubles as "the application library" | `QRPGLESRC/LOG100.PGM.RPGLE:6-7`, `:11-12`, `:20` | observed-in-code | Cross-slice dependency (log-programs) |

## Deferred recommendations (prose only)

- c03 / c05: no-confirm delete and stale-list-after-create are as-is quirks; recommend preserve-as-is unless the room wants a UX fix.
- c10: `EXPORT(*ALL)` exposes internals; a target API should export only the getters. Build note, not behaviour.
- c11: the parameter store is effectively a single setting (`PATH`). Recommend the room treat `PATH` as **configuration** in the target rather than converting a generic key/value maintenance screen.
