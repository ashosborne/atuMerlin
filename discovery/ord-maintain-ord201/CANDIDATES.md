# CANDIDATES — ord-maintain-ord201 (Phase A, unbound)

Seed: all orders across customers — `ORD201` (menu opt 3). All rows `candidate`. Where a rule is identical to `ORD200`, the row says so; divergences are called out.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-maintain-ord201-c01 | List all orders from `ORDERCUS` with customer id/name, paged 14 rows, ordered by order date desc then id desc | `QRPGLESRC/ORD201.PGM.SQLRPGLE:98-130`, `QDDSSRC/ORD201D.DSPF:33-34` (SFLPAG 7) | observed-in-code | Primary screen; paged (ORD200 is not) |
| ord-maintain-ord201-c02 | F6 create → `ORD100C2` (customer chosen inside ORD100); cursor closed and list rebuilt | `ORD201.PGM.SQLRPGLE:16`, `:155-158` | observed-in-code | Seam edge |
| ord-maintain-ord201-c03 | Option 2 update → `ORD101`; guard `(2 or 4) and closed` correctly parenthesised | `ORD201.PGM.SQLRPGLE:191-199`, `:229-232` | observed-in-code | Divergence from ORD200-c09 |
| ord-maintain-ord201-c04 | Option 4 delete: lines first, then header; clears orid/oryear in the subfile row | `ORD201.PGM.SQLRPGLE:233-241` | observed-in-code | Divergence in ordering vs ORD200 |
| ord-maintain-ord201-c05 | Options 5 display (`ORD202`), 6 print (`ORD500`) | `ORD201.PGM.SQLRPGLE:21-25`, `:242-249` | observed-in-code | Seam edges |
| ord-maintain-ord201-c06 | Option 7 close / option 8 deliver — same rules as ORD200-c06/c07 | `ORD201.PGM.SQLRPGLE:250-278` | observed-in-code | Lifecycle rules (shared) |
| ord-maintain-ord201-c07 | Guards: 7 if closed, 8 if delivered, 4 if any line delivered, 1 / >8 invalid (option 3 **is** allowed here but has no action — dead option) | `ORD201.PGM.SQLRPGLE:172-216`, `:224-282` (no `when opt01 = 3`) | observed-in-code | Rules + a dead option divergence from ORD200 (which rejects 3) |
| ord-maintain-ord201-c08 | F5 refresh closes cursor and reloads from row 1 | `ORD201.PGM.SQLRPGLE:152-154` | observed-in-code | Screen behaviour |
| ord-maintain-ord201-c09 | Menu entry: SAMMNU option 3 "Work with Customer Orders" | `QPNLSRC/SAMMNU.MENU:92-95` | observed-in-code | Entry point |
| ord-maintain-ord201-c10 | Declared but unused files `CUSTOME1`, `ARTICLE1` | `ORD201.PGM.SQLRPGLE:8-9` (no chain/read observed) | observed-in-code | Prevents phantom deps |
| ord-maintain-ord201-c11 | Cursor closed at program end (`pnl00`) — not in ORD200 | `ORD201.PGM.SQLRPGLE:291-294` | observed-in-code | Minor divergence |

## Deferred recommendations (prose only)

- Recommend Pack B produce shared lifecycle cards (close/deliver/delete/guards) once, referenced by both `ord-maintain-ord200` and `ord-maintain-ord201`, to avoid TRACEABILITY duplication. Not merging the slices.
- c07 dead option 3 → quirk note.
