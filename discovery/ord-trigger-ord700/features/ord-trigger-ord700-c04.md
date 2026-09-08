# ord-trigger-ord700-c04 — Update applies outstanding-quantity delta, handles article change

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

When a `DETORD` row is updated **and at least one field changed** (`TRGUPDCND(*CHANGE)`), `ORD700` (event `'3'`) adjusts `ARTICLE.ARCUSQTY` by the change in outstanding quantity. Same article: one adjustment of `(new.ODQTY - old.ODQTY) - (new.ODQTYLIV - old.ODQTYLIV)`. Article changed: the new article gains `new.ODQTY - new.ODQTYLIV`, the old article loses `old.ODQTY - old.ODQTYLIV`. In tree this fires from `ORD101` line edits (quantity / delivered / price), from `ORD200` / `ORD201` option `8` "deliver" (which sets `ODQTYLIV = ODQTY` and so removes the line from `ARCUSQTY`), and from `ORD901`'s `ODYEAR` backfill (a zero-delta no-op). No in-tree writer ever changes `ODARID` on an existing row, so the article-changed branch has no in-tree caller.

## Entrypoints

- Trigger definition `ORD700_DETORD_ARTICLE_UPDATE` — `ADDPFTRG FILE(DETORD) TRGTIME(*AFTER) TRGEVENT(*UPDATE) PGM(ORD700) RPLTRG(*YES) TRGUPDCND(*CHANGE)` — `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8` (definition only; attachment is `c01`)
- `ORD700` mainline `when teven = '3'` — `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:83-93`
- Firing writers in `ATU_SRC` (all through `DETORD1.LF` or `DETORD` directly):
  - `ORD101` `S02act` `update fdeto` after `odqty = dsqty; odqtyliv = dsqtyliv; odprice = dsprice` — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:9,267-270`
  - `ORD200` option `8`: for each line of the order `if odqtyliv = 0; odqtyliv = odqty; update fdeto` — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:259-270`
  - `ORD201` option `8`: identical loop — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:262-275`
  - `ORD901` `UPDATE detord d SET odyear = (...)` where `odyear` differs — `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:42-45`

## Inputs / outputs / observables

- In: trigger buffer with `TEVEN = '3'`, both `NEWOFF` and `OLDOFF` used (`NEW` and `OLD` overlay after- and before-images). — `ORD700.PGM.RPGLE:84-85`
- Out: one `ARTICLE` row rewritten (same article) or two (article changed), each `ARCUSQTY += delta` via `UpdArt`. — `ORD700.PGM.RPGLE:86-93,108-109`
- Observable: `ARCUSQTY` (as `c02`). No log entry on update.

## Behaviour as implemented

1. `pn = %addr(parm1) + newoff; po = %addr(parm1) + oldoff`. — `ORD700.PGM.RPGLE:84-85`
2. `if new.odarid = Old.odarid` → `UpdArt((New.odqty - Old.odqty) - (New.odqtyLiv - Old.odqtyLiv) : new.odarid)`. — `ORD700.PGM.RPGLE:86-89`
3. `else` → `UpdArt(new.odqty - new.odqtyliv : new.odarid)` then `UpdArt(-Old.odqty + Old.odqtyliv : old.odarid)` — new article credited first, old article debited second; each call independently subject to the `c05` no-op rules. — `ORD700.PGM.RPGLE:90-93`
4. Worked cases from the in-tree writers (arithmetic from the code, not from a run):
   - `ORD101` edit qty 5 → 8, delivered unchanged: delta `+3`.
   - `ORD101` edit delivered 0 → 2 on qty 5: delta `(0) - (2) = -2` (outstanding 5 → 3).
   - `ORD101` price-only edit: `*CHANGE` fires the trigger (row changed), delta `0` → `UpdArt` returns (`c05`).
   - `ORD200`/`ORD201` option `8` on an undelivered line qty 5: `ODQTYLIV` 0 → 5, delta `0 - 5 = -5` → line no longer counted. Lines with `ODQTYLIV > 0` are skipped by the writer (`unlock`), so partially delivered lines are **not** completed by option `8`. — `ORD200.PGM.SQLRPGLE:264-268`
   - `ORD901` `ODYEAR` backfill: only `ODYEAR` changes, delta `0` → no-op; the trigger still runs once per changed row. — `ORD901.PGM.SQLRPGLE:42-45`

## Validation rules found in code

None in the trigger. The writer-side rules (`ORD101`: `dsqtyliv > odqty` → `errqtyliv`; `dsqty < odqtyliv` → `errqty`) keep `ODQTYLIV <= ODQTY` on the edit path; the trigger itself does not check sign or bound and will happily apply a delta that drives `ARCUSQTY` negative. — `ORD101.PGM.RPGLE:250-257`, `ORD700.PGM.RPGLE:86-93`

## Edge cases found in code

- **Article-changed branch has no in-tree caller.** `ORD101`'s edit screen writes back only `ODQTY`, `ODQTYLIV`, `ODPRICE`; `ORD200`/`ORD201`/`ORD901` never touch `ODARID`. The branch is reachable only from outside the tree (SQL, DFU). — `ORD101.PGM.RPGLE:267-270`
- **Article-changed with one side unknown**: each `UpdArt` call misses independently — e.g. new article not found → old article still debited (`c05`). — `ORD700.PGM.RPGLE:91-92,104-107`
- **`*CHANGE` condition** means an `update` that rewrites identical values does not fire the trigger at all; the `ODYEAR`-only and price-only cases fire but net to zero. — `ORD700U.SYSTRG:8`
- **Order close (`ORD200`/`ORD201` option `7`) does not reach this trigger** — it updates `ORDER.ORDATCLO` only; `DETORD` rows are untouched, so `ARCUSQTY` is not reduced when an order is closed without being delivered. This is the observed fact behind needs-SME `c11` (whether that is intended is the SME question; not decided here). — `ORD200.PGM.SQLRPGLE:249-257`, `ORD201.PGM.SQLRPGLE:250-258`
- **Delivered quantity reduced** (`ORD101` lowers `dsqtyliv`): delta positive → outstanding goes back up; no guard against un-delivering. — `ORD700.PGM.RPGLE:87-88`

## Dependencies

- `ARTICLE1.LF` (as `c02`); `DETORD1.LF` `PFILE(DETORD)` (writers' access path; triggers belong to the PF). — `ATU_SRC/QDDSSRC/DETORD1.LF:5-7`
- Field sizes: `QUANTITY` 5 0 zoned (`ODQTY`, `ODQTYLIV`, `ARCUSQTY`); `UpdArt qty` parm `5 0 value` — a delta is passed through the same size as the fields. — `ATU_SRC/QDDSSRC/SAMREF.PF:47`, `ORD700.PGM.RPGLE:10-11`

## Assumptions / unknowns

- Whether the update trigger is attached on the box (`c01`).
- Business meaning of `ARCUSQTY` after close-without-delivery (`c11`, needs-SME; verify with data).

## Evidence

`ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:10-11,83-93,101-109` · `ATU_SRC/QTRGSRC/ORD700U.SYSTRG:4-8` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:9,250-257,267-270` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:249-270` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:250-275` · `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:42-45` · `ATU_SRC/QDDSSRC/DETORD1.LF:5-7` · `ATU_SRC/QDDSSRC/SAMREF.PF:47`
