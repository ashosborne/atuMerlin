# par-maintain-c12 — PARAMETER is a plain two-key key/value table

| | |
| --- | --- |
| Slice | `par-maintain` |
| Status | `documented` (as-is behaviour card, Phase B — data-model fact) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`PARAMETER` is a DDS physical file, record format `FPARAM`, `UNIQUE` on `(PACODE 10A, PASUBCODE 10A)`, carrying five typed value columns — `PARM1` 10A, `PARM2` 100A, `PARM3` 2A, `PARM4` zoned 1,0, `PARM5` zoned 3,0 — and nothing else: no delete flag, no created/modified user or timestamp, no description column, no `TEXT` on the file (`%TEXT` blank), no `SAMREF` reference fields, no logical file, no SQL view or index. Three members open it (`PAR200` update/add, `PAR300` input, `LOG100` input — library discovery only, `c13`); no SQL statement touches it. Blank code and blank sub-code are legal key values (one such row can exist). Deletes are physical (`c05`).

## Entrypoints

- `ATU_SRC/QDDSSRC/PARAMETER.PF:4-14` (whole member)
- Openers: `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:5` (`uf a e k disk`), `ATU_SRC/QRPGLESRC/PAR300.RPGLE:6` (`if e k disk usropn`), `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:6-7` (`if e k disk infds(info)`)
- Referenced by `PAR200D.DSPF` `REF(*LIBL/PARAMETER)` / `REFFLD(FPARAM/… *LIBL/PARAMETER)` — `ATU_SRC/QDDSSRC/PAR200D.DSPF:7,20-27,106-115,140-151`

## Inputs / outputs / observables

| Column | Type | `TEXT` | Written by | Read by |
| --- | --- | --- | --- | --- |
| `PACODE` | 10A, key 1 | Parameter code | `PAR200` create | `PAR200`, `PAR300` cache/chain |
| `PASUBCODE` | 10A, key 2 | Parameter sub-Code | `PAR200` create | `PAR200`, `PAR300` |
| `PARM1` | 10A | Parameter 1 | `PAR200` | `PAR200` list/edit; `GetPARM1` (no caller) |
| `PARM2` | 100A | Parameter 2 | `PAR200` (`CHECK(LC)`) | `PAR200` (32 chars on the list); `GetPARM2` (`PATH` — `c11`) |
| `PARM3` | 2A | Parameter 3 | `PAR200` | `PAR200`; `GetPARM3` (no caller) |
| `PARM4` | 1S 0 (zoned) | Parameter 4 | `PAR200` | `PAR200`; `GetPARM4` → `1P 0` (no caller) |
| `PARM5` | 3S 0 (zoned) | Parameter 5 | `PAR200` | `PAR200`; `GetPARM5` → `3P 0` (no caller) |

— `PARAMETER.PF:6-12`, `PAR300.RPGLE:23,35,47,59,71`

## Behaviour as implemented

1. `UNIQUE` → duplicate `(PACODE, PASUBCODE)` on `write` fails (status 01021) — `PAR200` pre-checks with a `chain` (`c02`), no other writer exists. — `PARAMETER.PF:4,13-14`
2. Key order = list order in `PAR200` (`c01`) — EBCDIC collation of the two 10A fields, blank/blank first.
3. No delete flag → "exists" = row present; `PAR200` option 4 removes the row (`c05`), unlike `CUSTOMER` (`CUDEL`) / `ARTICLE` (`ARDEL`) which soft-delete. — `PARAMETER.PF:5-12`
4. No audit columns → no record of who changed `PATH` or when; `PAR200` has `User inz(*user)` declared and never uses it. — `PAR200.PGM.RPGLE:42`
5. `PARM4` / `PARM5` are DDS numeric without `P` → zoned; the getters return packed. — `PARAMETER.PF:11-12`, `PAR300.RPGLE:59,71`
6. Record length 136 bytes (10+10+10+100+2+1+3); `*LIBL` resolution everywhere (`REF`, `REFFLD`, the three F-specs) — the library that holds it is "the application library" for `LOG100` (`c13`).

## Validation rules found in code

Only `UNIQUE`. No `CHECK`, `RANGE`, `VALUES`, `COMP` or referential constraint in the DDS; no trigger on the file (grep `QTRGSRC`/`*.SYSTRG` for `PARAMETER` — none; the triggers in the tree are on `DETORD` / `ORDER`).

## Edge cases found in code

- **Blank/blank row** legal and unique; reachable through `PAR200` only (`c02`, `c09`).
- **Mixed-case key** cannot be typed in `PAR200` (display upper-cases — `c02`) but can exist if written by another tool; the getters compare case-sensitively (`c09`).
- **Single live row** — `('PATH', ' ')` (`c11`); the other 136-byte-wide capability is unused.

## Dependencies

- None on other files. Dependents: `PAR200`, `FPARAMETER`/`PAR300`, `LOG100` (library only), `PAR200D` (field references).

## Assumptions / unknowns

- Object attributes not in DDS (`SIZE`, `REUSEDLT`, `WAITRCD`, journaling, CCSID) are `CRTPF` defaults or build metadata — unknown; `WAITRCD` decides the lock-wait behaviour noted on `c02`/`c04`/`c05`.
- needs-SME: if `PATH` becomes configuration (`c11`) this table has no remaining purpose in the target; if the screen is kept, does the room want audit columns (not a legacy behaviour — design question, not for this card).

## Evidence

`ATU_SRC/QDDSSRC/PARAMETER.PF:4-14` · `ATU_SRC/QRPGLESRC/PAR200.PGM.RPGLE:5,42` · `ATU_SRC/QRPGLESRC/PAR300.RPGLE:6,23,35,47,59,71` · `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:6-7` · `ATU_SRC/QDDSSRC/PAR200D.DSPF:7,20-27,106-115,140-151`
