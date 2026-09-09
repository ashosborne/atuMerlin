# sql-objects-c06 — `ARTIINF` rows are never deleted: no `DELETE` in the tree, no cascade in the DDL; `ART200` option 4 soft-deletes the article (`ARDEL = 'X'`) and leaves its free text in place and still editable

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is data-lifecycle card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

The three SQL statements against `ARTIINF` in the estate are one `SELECT`, one `UPDATE`, one `INSERT` (`ART200`) plus one `SELECT` (`ART302`). There is no `DELETE FROM artiinf` anywhere, no RPG `delete` against it (it is not an F-spec file in any program — accessed by embedded SQL only), and the DDL declares no foreign key, so nothing can cascade. Articles themselves are never physically deleted either: `ART200` option 4 does `chain arid article1; ardel = 'X'; armod = %timestamp(); armodid = user; update farti` and touches nothing else. Consequence: an article's free text outlives its soft delete, and — because the `ART200` list (`ARTICLE2`) has no select/omit on `ARDEL` and option 3 is accepted on any listed row — the text of a deleted article can still be opened and rewritten. `ARTIINF` therefore only ever grows.

## Entrypoints

- Soft delete of an article: `ART200` `when opt01 = 4` — `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:208-216`
- The four `ARTIINF` statements: `ART200.PGM.SQLRPGLE:333-335,371-373,375-376`; `ART302.SQLRPGLE:17-19` (`c05`)
- DDL without referential action: `ATU_SRC/QSQLSRC/ARTIINF.TABLE:5-20`

## Inputs / outputs / observables

- In: option `4` on an `ART200` list row (option validation accepts 2, 3, 4, 6 — `if opt01 > 6 or opt01 = 1 or opt01 = 5` is the error branch). — `ART200.PGM.SQLRPGLE:172`
- Out: `ARTICLE` row updated (`ARDEL`, `ARMOD`, `ARMODID`); `ARTIINF` untouched. — `ART200.PGM.SQLRPGLE:209-213`
- Observable: the article stays in the `ART200` list (read over `ARTICLE2`, keyed `ARDESC, ARID`, no `S`/`O` specs), now with `ARDEL = 'X'`; option 3 on it still opens `FMT03` with the stored text (`c05`). — `ART200.PGM.SQLRPGLE:111,116,124`; `ATU_SRC/QDDSSRC/ARTICLE2.LF`

## Behaviour as implemented

1. **Option 4 is an update, not a delete.** `chain arid article1` then three field assignments and `update farti`. No `delete`, no SQL. — `ART200.PGM.SQLRPGLE:208-216`
2. **No physical delete of `ARTICLE` anywhere.** Grep for `delete` in `ART200` / `ART201` / `ART202` returns nothing; the `delete` opcodes in the tree are on `DETORD1` / `ORDER1` / `TMPDETORD` / `PARAMETER` (`ORD100:224`, `ORD101:191`, `ORD200:230,232`, `ORD201:235,237`, `PAR200:186`). The `ART300:110` hit is the `IsArtDeleted` comparison. — structural grep
3. **No delete of `ARTIINF` anywhere.** Grep `artiinf` / `ARTIINF`: DDL + the four statements above. Grep `delete from` (case-insensitive) across `ATU_SRC`: none. — structural grep
4. **No cascade possible.** `ARTIINF.TABLE` has a primary key only — no `REFERENCES ARTICLE`, so even a physical delete of an `ARTICLE` row (outside the tree) would leave the text row behind. — `ARTIINF.TABLE:19-20`
5. **The text remains reachable after soft delete.** The list is `ARTICLE2` with no select/omit; `readc` option handling routes `3` to panel 3 for whatever row it is on; `S03prp` reads the row by `:arid` regardless of `ARDEL`. — `ART200.PGM.SQLRPGLE:111-116,172,203-207,331-335`; `ARTICLE2.LF`

## Validation rules found in code

- None. Neither `ART200` nor the DDL prevents editing the text of a soft-deleted article, and nothing prevents an `ARTIINF` row whose `ARID` no longer exists (only reachable via out-of-tree deletes).

## Edge cases found in code

- **Orphan text after an out-of-tree hard delete.** If an `ARTICLE` row is removed with `DFU` / `STRSQL`, its `ARTIINF` row survives; `GetArtInfo` for a *new* article that later reuses the id would return the old text (`ART200` `arid = %editc(NewId:'X')` generates ids — `ART200.PGM.SQLRPGLE:250,304` — whether ids can recur is an `art-interactive` question). — `ARTIINF.TABLE:19-20`
- **Re-activation.** No in-tree path clears `ARDEL`; a soft-deleted article stays deleted, text and all. — structural grep `ardel =`
- **Growth.** The table gains a row the first time option 3 is confirmed for an article and never loses it; size is bounded by the number of article ids ever given a text × ≤ 1520 bytes. — `ART200.PGM.SQLRPGLE:374-377`

## Dependencies

- `ARTICLE.PF:39` (`ARDEL`), `ARTICLE1.LF` (`UNIQUE K ARID`), `ARTICLE2.LF` (list order, no `S`/`O`); `c05` (the table); `ART200` option 4 (`art-interactive`, held — cited for the soft-delete statement only).

## Assumptions / unknowns

- **needs-SME (room, `art-*` owner):** should the target delete (or hide) the free text when an article is soft-deleted, or keep the as-is "text outlives the article" behaviour? Recommendation: record as-is, decide in the ART Architecture pack when it exists; nothing in the tree depends on the orphan text being kept.
- Whether operational clean-up of `ARTIINF` exists outside the tree (CL, `RGZPFM`, SQL scripts) — unknown; source shows none.

## Evidence

`ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:111-116,172,203-216,250,304,331-335,371-377` · `ATU_SRC/QRPGLESRC/ART302.SQLRPGLE:17-19` · `ATU_SRC/QSQLSRC/ARTIINF.TABLE:5-20` · `ATU_SRC/QDDSSRC/ARTICLE.PF:39` · `ATU_SRC/QDDSSRC/ARTICLE1.LF` · `ATU_SRC/QDDSSRC/ARTICLE2.LF` · structural grep of `ATU_SRC/**` for `artiinf` (5 hits: DDL ×4 lines, `ART200` ×3, `ART302` ×1), `delete from` (none), `delete` opcode in `ART200`/`ART201`/`ART202` (none; the estate's record deletes are `ORD100:224` (`tmpdetord`), `ORD101:191`, `ORD200:230,232`, `ORD201:235,237`, `PAR200:186` — none on `ARTICLE` or `ARTIINF`), assignments to `ardel` (`ART200:210` only; `ART300:110` is the `IsArtDeleted` comparison)
