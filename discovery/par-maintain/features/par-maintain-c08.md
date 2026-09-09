# par-maintain-c08 — Blank PATH degrades to WRKLNK '*' / relative file names

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — edge behaviour) |
| Confidence | `inferred` (the source part is `observed-in-code`; where the files end up and what `CVTSPLPDF` / the XML and XSS service programs do with a blank or relative name is runtime / outside the tree) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound as `inferred`, kept `inferred`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Nothing in the estate checks that `PATH` exists or is non-blank. Source guarantees the first half of the chain: a missing `('PATH', ' ')` row makes `GetPARM2` return **100 blanks, silently** (`clear *all FPARAM` then a `chain` that misses — `c09`). Each of the four consumers then goes on with a blank: `PAR201` lists `WRKLNK OBJ('*')` (the job's current directory); `PRO202` opens `xmlopen('' + 'Pur_Ord_<prid>_<yymmdd>.xml')` and `PRO203` `xssopenfile('' + 'Goods to purchase_<yymmdd>.xml')` — **relative names**, resolved against the job's current directory by whatever the sourceless `XML` / `XSS` service programs do; `ORD500C` passes a blank `TODIR` to `CVTSPLPDF` (`ord-print-ord500-c02`/`c04`). No consumer tests the value; no error is raised by this slice. What "the current directory" is (user profile `HOMEDIR`, typically `/home/<user>`, or `/`) and whether the writers succeed there is runtime — hence `inferred`.

## Entrypoints

- `PAR300.chainPARAMETER` miss path — `ATU_SRC/QRPGLESRC/PAR300.RPGLE:90-96`
- `PAR201.CLLE:7-10` (`*TCAT '*'` on blanks → `'*'`)
- `ORD500.PGM.RPGLE:58-59` → `ORD500C.PGM.CLLE:11-12` (`TODIR(&PATH)`)
- `PRO202.SQLRPGLE:151-152` (`xmlopen(%trim(path) + fileName)`), `PRO203.PGM.SQLRPGLE:32-33` (`xssopenfile(%trim(path) + fileName)`)

## Inputs / outputs / observables

- In: no `PARAMETER` row with `PACODE = 'PATH'` and `PASUBCODE = ' '` (row never created, or deleted with `PAR200` option 4 — `c05`), **or** a row whose `PARM2` is blank (created/edited blank — `c02`, `c04`; indistinguishable to the getter). — `ATU_SRC/QDDSSRC/PARAMETER.PF:6-9`
- Out, per consumer (source): `PAR201` → `WRKLNK OBJ('*')`; `PRO202` → XML file named `Pur_Ord_…xml` with no directory; `PRO203` → spreadsheet `Goods to purchase_…xml` with no directory; `ORD500C` → `CVTSPLPDF … TODIR('   …')`. Where those names resolve, and whether `CVTSPLPDF` rejects a blank directory, is not in the tree.

## Behaviour as implemented

1. `chainPARAMETER('PATH':' ')`: key differs from the buffer → `clear *all FPARAM; chain kf PARAMETER` → not found → buffer stays cleared → `GetPARM2` returns `PARM2` = 100 blanks. No `%found` is exposed, no message. Because `PACODE` is now blank, the next call re-chains (a miss is not cached), so the outcome repeats on every call until the row appears. — `PAR300.RPGLE:39-43,90-96`
2. `PAR201`: `&PATH *TCAT '*'` on 100 blanks = `'*'` → `WRKLNK OBJ('*')` — every entry of the job's current directory. — `PAR201.CLLE:9-10`
3. `PRO202` / `PRO203`: `%trim(path)` = `''` → the file name alone is passed to `xmlopen` / `xssopenfile`. Relative-name resolution belongs to the `XML` / `XSS` service programs (no source — `srvpgm-supporting`), presumably the job's current directory via the IFS open. — `PRO202.SQLRPGLE:151-152`, `PRO203.PGM.SQLRPGLE:32-33`
4. `ORD500C`: `TODIR(&PATH)` blank — documented on `ord-print-ord500-c02`; converter behaviour is the `ord-print-ord500-c04` blind spot. — `ORD500C.PGM.CLLE:11-12`

## Validation rules found in code

None anywhere in the chain — the getter cannot signal "no row", and none of the four callers compares `path` to blank.

## Edge cases found in code

- **Blank value vs missing row** are the same to every consumer (`GetPARM2` returns the field either way). `PAR200` can produce both (`c02`, `c04`, `c05`).
- **Stale non-blank after a delete.** A job that read `PATH` before the row was deleted keeps the old value for the life of its activation group (`c09`); only jobs starting afterwards see blanks. So a blank-`PATH` incident appears per job, not at once.
- **Missing trailing `/`** is the second degraded mode (`c07`): `PRO202`/`PRO203` write `…<dir>Pur_Ord_…` siblings; source-provable, and not blank-related.
- **`PATH` pointing at a directory that does not exist**: same silence from this slice; failure (if any) belongs to the writers / `CVTSPLPDF`.

## Dependencies

- `PARAMETER` data on the box — not in the tree (no seed/insert of `PATH` exists in `ATU_SRC`; grep for `'PATH'` finds only the four consumers and `PAR201`). Phase A open question 1 ("is `PATH` guaranteed present?") stays open — it is data.
- `XML` / `XSS` service programs and `CVTSPLPDF` processing program — no source (`srvpgm-supporting`, `ord-print-ord500-c04`).

## Assumptions / unknowns

- The job's current directory default (`HOMEDIR` of the user profile) and IFS relative-name resolution are platform facts; the writers' handling of a relative name is not visible. Runtime-confirmable on the box by clearing `PATH` in a test job.
- needs-SME: is a blank `PATH` a state the target must tolerate (write to a default location) or refuse (fail fast)? Legacy: silent, per-consumer. If `PATH` becomes configuration (`c11`) the answer is "required setting".

## Evidence

`ATU_SRC/QRPGLESRC/PAR300.RPGLE:34-44,82-98` · `ATU_SRC/QCLSRC/PAR201.CLLE:7-10` · `ATU_SRC/QRPGLESRC/ORD500.PGM.RPGLE:58-59` · `ATU_SRC/QCLSRC/ORD500C.PGM.CLLE:11-12` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:151-152` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:32-33` · `ATU_SRC/QDDSSRC/PARAMETER.PF:6-9`
