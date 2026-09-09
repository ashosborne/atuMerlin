# cou-maintain-c04 — Absence: no create, no delete, no code change for countries anywhere in the estate; `COUNTRY.PF` has no delete flag, so no soft-delete concept either

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B — recorded absence) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`COU200` offers exactly one operation on a country — edit its name and ISO-3 code (`c02`). There is no `F6=Create`, no `4=Delete`, no rename of the 2-character code (`COID` is output-only on both panels), and the program contains no `WRITE` or `DELET` against `COUNTRY`. Widening the search to the whole tree: `COU200` is the only member that opens `COUNTRY` for update; no CL member copies or clears it; no SQL member inserts into or deletes from it; no trigger exists on it. Countries are therefore loaded and removed **outside the source tree** (SQL, DFU, `CPYF`, a restore — unknown). The file itself is three columns with `UNIQUE K COID` and no `*DEL` marker, so — unlike `CUSTOMER` (`CUDEL`), `ARTICLE` (`ARDEL`) and the article-family file — there is no soft-delete state a program could set or filter on; "exists" is "row present" (the FCOUNTRY half records the consequence for `ExistCountry` in `c07`). Phase A's question "how are countries added on the box?" cannot be answered from source and stays needs-SME.

## Entrypoints

- Panel-1 options accepted: `OPT01 = 2` only (`0` is a no-op) — `ATU_SRC/QRPGSRC/COU200.RPG:74-76,94`
- Panel-1 legend: `'2=Edit'` is the only option text — `ATU_SRC/QDDSSRC/COU200D.DSPF:38`
- Function keys defined: `CA03`, `CA12` only (no `CF06`, no `CF05`) — `COU200D.DSPF:8-9`, legends `:48-51,58-61`
- `COID` output-only on `SFL01` and `FMT02` — `COU200D.DSPF:19,70`

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| I/O opcodes on `COUNTRY` in `COU200` | `SETLL`, `READ` ×2, `CHAIN`, `UPDAT` — no `WRITE`, no `DELET` | `COU200.RPG:39-40,44,111,131` |
| Update-capable declarations of `COUNTRY` in the tree | `COU200.RPG:7` (`UF`) only; `COU300.RPGLE:6` and `COU301.RPGLE:6` are `IF` | structural grep |
| CL / SQL / trigger touching `COUNTRY` | none (`QCLSRC`: `ORD100C`, `ORD100C2`, `ORD500C`, `PAR201`; `QSQLSRC`: no `COUNTRY`; `QTRGSRC`: `ORD700*` on `DETORD` only) | structural grep of `ATU_SRC/QCLSRC`, `QSQLSRC`, `QTRGSRC` |
| File layout | `UNIQUE`, `REF(SAMREF)`, `R FCOUN`: `COID R`, `COUNTR R`, `COISO 3`; `K COID` — no delete flag, no audit columns | `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` |
| Contrast | `CUSTOMER.PF` `CUDEL`, `PROVIDER.PF` `PRDEL` (both `REFFLD(DLCODE)`); `ARTICLE.PF` `ARDEL` (`sql-objects-c06`: `ART200` option 4 sets `ARDEL = 'X'`) | `ATU_SRC/QDDSSRC/CUSTOMER.PF:29`, `PROVIDER.PF:24`, `ARTICLE.PF` (as cited by the `sql-objects` cards) |

## Behaviour as implemented

1. Typing anything other than `0` / `2` in `Opt` is `Invalid Option` (`c01`) — there is no option whose handler would create or delete. — `COU200.RPG:74-77`
2. `S01ACT` branches only on `OPT01 = 2`. — `COU200.RPG:94`
3. `FMT02` has no input field for the code; `S02ACT` updates in place. — `COU200D.DSPF:70`; `COU200.RPG:131`
4. Program end closes the file; nothing else happens to `COUNTRY`. — `COU200.RPG:18-19`

## Validation rules found in code

- Not applicable — no create / delete path exists to validate. The one edit path has none either (`c02`).

## Edge cases found in code

- **Referential consequences of an out-of-tree delete.** `CUSTOMER.CUCOUN` and `PROVIDER.PRCOUN` hold the 2-character code (`REFFLD(COID)`) with no referential constraint (native files, no RI — `CUSTOMER.PF:16`, `PROVIDER.PF:17`); deleting a country outside the tree leaves customers / providers whose `ExistCountry` becomes `*off` and whose `GetCountryName` returns blanks (`c07`) — the `CUS200` / `PRO200` check paths would then refuse to save such a record until the country is re-entered (`ERR0002`, `c12`). Nothing in the tree can cause this; nothing in the tree detects it.
- **Referential consequences of an out-of-tree insert.** None — a new code becomes selectable in `SltCountry` (`c09`) on its next open and valid for `ExistCountry` immediately (subject to the cache — `c07`).
- **Renaming a code** is impossible from the panel; an out-of-tree key change orphans every customer / provider carrying the old code (same as a delete, above).
- **`COU200` after `CLRPFM`.** Empty list, no message (`c01`).

## Dependencies

- `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10`; `ATU_SRC/QDDSSRC/SAMREF.PF:18,20`
- `c01` (option set), `c02` (the one write path), `c07` (`ExistCountry` = row present; no `IsCountryDeleted`), `c09` (`SltCountry` lists whatever rows exist)
- Pointer only: `modern/db/schema.sql:324,330` — the target's `country` table records `COU200` as the only writer and has no maintenance path; `architecture/atu-merlin-cou/PACK.yaml:30,36` keeps the panel half out of the pack. Not changed, not proposed here.

## Assumptions / unknowns

- Platform: none needed — this card is a census of source.
- Build / ops: how countries get into `COUNTRY` on the box (initial load method; whether anyone has ever added one since). Not answerable from source.
- **needs-SME (room / product owner):** does the target need create / delete (or a soft-delete flag) for countries at all, or is a fixed reference table maintained by data load the intended model? As-is the estate has no create / delete anywhere, so a target that adds them would be adding behaviour, not converting it.
- **needs-SME (data owner):** is there an out-of-tree loader (SQL script, DFU, `CPYF` from a master) that should be treated as part of the estate?

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:7,18-19,39-40,44,74-77,94,111,131` · `ATU_SRC/QDDSSRC/COU200D.DSPF:8-9,19,38,48-51,58-61,70` · `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:6` · `ATU_SRC/QRPGLESRC/COU301.RPGLE:6` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:16,29` · `ATU_SRC/QDDSSRC/PROVIDER.PF:17,24` · structural grep of `ATU_SRC/**` for `WRITE` / `DELET` / `DELETE` / `INSERT` / `CPYF` / `CLRPFM` against `FCOUN` / `COUNTRY` (none), for `CF06` / `CF05` / `F6` / `Create` / `Delete` in `COU200D.DSPF` (none), for members of `QCLSRC` (4) / `QSQLSRC` / `QTRGSRC` referencing `COUNTRY` (none)
