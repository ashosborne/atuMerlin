# ord-trigger-ord700-c02 — Insert adds ordered quantity to article customer-order quantity

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

When a row is inserted into `DETORD`, `ORD700` (trigger event `'1'`) adds the **full ordered quantity** `new.ODQTY` to `ARTICLE.ARCUSQTY` for the line's article `new.ODARID`. The delivered quantity on the new row (`new.ODQTYLIV`) is **not** subtracted — the insert path treats the whole `ODQTY` as outstanding. The only in-tree writer that inserts `DETORD` rows is `ORD100` at confirm, which always writes `ODQTYLIV = 0`, so in-tree the two readings coincide.

## Entrypoints

- Trigger definition `ORD700_DETORD_ARTICLE_INSERT` — `ADDPFTRG FILE(DETORD) TRGTIME(*AFTER) TRGEVENT(*INSERT) PGM(ORD700) RPLTRG(*YES)` — `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7` (definition only; attachment on the box is `c01`, needs-SME)
- `ORD700` mainline `when teven = '1'` — `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:73-75`
- Firing writer in `ATU_SRC`: `ORD100` `write fdeto` (real `DETORD`, once per confirmed line) — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:11,206`

## Inputs / outputs / observables

- In: trigger buffer `PARM1` with `TEVEN = '1'`, `NEWOFF` → new record image mapped onto `NEW` (`EXTNAME(detord)`, qualified, `based(pn)`). — `ORD700.PGM.RPGLE:54-56,74`
- Out: `ARTICLE` row with `ARID = new.ODARID` rewritten with `ARCUSQTY = ARCUSQTY + new.ODQTY` (all other fields as read). — `ORD700.PGM.RPGLE:104-109`
- Observable: `ARCUSQTY` ("CUSTOMER ORDER QTY", `QUANTITY` 5 0) on the article. Consumers in tree: `PRO202` / `PRO203` reorder proposals (`arstock < ARMINQTY - arcusqty + arpurqty`) and `PRO202D`. — `ATU_SRC/QDDSSRC/ARTICLE.PF:25-27`, `ATU_SRC/QDDSSRC/SAMREF.PF:47`, `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:87-104`, `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:60-84`

## Behaviour as implemented

1. Entry / buffer parse (`c06`). `TEVEN = '1'` selects the insert branch. — `ORD700.PGM.RPGLE:65-73`
2. `pn = %addr(parm1) + newoff` — `NEW` now overlays the after-image of the inserted `DETORD` row. — `ORD700.PGM.RPGLE:74`
3. `UpdArt(new.odqty : new.odarid)` — quantity passed **by value** as `5 0`; article id `like(new.ODARID)` (`ARID` 6A). — `ORD700.PGM.RPGLE:10-12,75,98-100`
4. `UpdArt`: `qty = 0` → return; `chain id article1`; not found → return; else `ARCUSQTY += qty; update farti` (`c05`). — `ORD700.PGM.RPGLE:101-109`
5. `return` without `*inlr` — the program stays activated between trigger calls (`c06`). — `ORD700.PGM.RPGLE:95`

## Validation rules found in code

None. No check that `new.ODQTY` is positive, that `new.ODQTYLIV` is zero, or that the article exists (a missing article is a silent no-op, `c05`). No check of `TTIME` (assumes `*AFTER`) or of the null-byte map.

## Edge cases found in code

- **`ODQTYLIV` ignored on insert.** A row inserted with `ODQTYLIV > 0` adds the whole `ODQTY`, whereas the delete (`c03`) and update (`c04`) paths and `ART801` (`c10`) work in `ODQTY - ODQTYLIV`. No in-tree writer inserts such a row (`ORD100` stages `ODQTYLIV = 0`), so this is a latent asymmetry, not an observed defect. — `ORD700.PGM.RPGLE:75` vs `:82,87-88`; `ORD100.PGM.RPGLE:206` (row copied from the staged `TMPREC`, `ODQTYLIV = 0` per `ord-entry-ord100-c03`)
- **Negative or zero quantity.** `ODQTY = 0` is a silent no-op; a negative `ODQTY` would decrement `ARCUSQTY`. Nothing in `ORD700` guards sign. — `ORD700.PGM.RPGLE:101-103,108`
- **Blank article id** (`ODARID = ' '`): `chain` misses → silent no-op. — `ORD700.PGM.RPGLE:104-107`
- **Staged rows never fire this.** `ORD100`'s `QTEMP/DETORD` copy is created `TRG(*NO)` (`c09`); only the final `write fdeto` at confirm does, once per line, after the `ORDER` header (`c07`) has been written. — `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:8-10`, `ORD100.PGM.RPGLE:197-206`
- **No SQL `INSERT` into `DETORD` anywhere in `ATU_SRC`**; `ORD900` / `ORD901` do not insert lines. Any insert from outside the tree (e.g. `STRSQL`, data load with triggers active) would also fire this rule. — structural grep

## Dependencies

- `ARTICLE1.LF` (`UF E K`, unique key `ARID`, format `FARTI` over `ARTICLE.PF`) — `ORD700.PGM.RPGLE:6`, `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5,25`
- `DETORD.PF` record layout via `EXTNAME(detord)` — `ATU_SRC/QDDSSRC/DETORD.PF:5-20`
- Trigger buffer contract (`c06`).

## Assumptions / unknowns

- Whether the insert trigger is attached on the reference box (`c01`, needs-SME). The definitions exist; attachment is runtime state.
- Whether `ARCUSQTY` is meant to be "ordered" or "outstanding" quantity — the insert path says ordered, every other path says outstanding (`c11`, needs-SME, stays a question).

## Evidence

`ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:6,10-12,54-56,65-75,95,98-109` · `ATU_SRC/QTRGSRC/ORD700A.SYSTRG:4-7` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:11,197-206` · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:8-10` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5,25-27` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/DETORD.PF:5-20` · `ATU_SRC/QDDSSRC/SAMREF.PF:11,47` · `ATU_SRC/QRPGLESRC/PRO202.SQLRPGLE:87-104` · `ATU_SRC/QRPGLESRC/PRO203.PGM.SQLRPGLE:60-84`
