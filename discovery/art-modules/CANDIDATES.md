# CANDIDATES — art-modules (Phase A, unbound)

Seed: FARTICLE modules `ART300` (getters), `ART301` (`SltArticle`), `ART302` (`GetArtInfo`). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| art-modules-c01 | Article getter family (7): Desc, RefSalPrice, StockPrice, Fam, Stock, MinStock, VatCode | `QRPGLESRC/ART300.RPGLE:19-91`, `QPROTOSRC/ARTICLE.RPGLEINC:7-40`, `QSRVSRC/FARTICLE.BND:5-14` | observed-in-code | Callable API |
| art-modules-c02 | `ExistArt` (found and `ARDEL <> 'X'`) and `IsArtDeleted` | `ART300.RPGLE:93-112` | observed-in-code | Validation primitives |
| art-modules-c03 | Lazy-open + last-key cache in `chainARTICLE1` (same pattern as CUS300) | `ART300.RPGLE:114-127` | observed-in-code | Missing id → blanks/zeros silently |
| art-modules-c04 | `SltArticle` selection window: dynamic SQL by description LIKE and/or family equality, `ORDER BY ARDESC`, 14 rows/page, F4 family prompt (`SltArtFam`), returns chosen ARID or default | `QRPGLESRC/ART301.SQLRPGLE:54-124`, `:163-167` (F4), `:216-232`, `QDDSSRC/ART301D.DSPF` | observed-in-code | Shared prompt used by ART250 and ORD100 |
| art-modules-c05 | Selection rules: option 1 only, single selection; criteria change re-prepares cursor | `ART301.SQLRPGLE:173-214`, `:219-221` | observed-in-code | Screen contract |
| art-modules-c06 | Binding gap: `ART302`/`GetArtInfo` not in FARTICLE module list nor export list, yet called by `ART250` | `QILESRVSRC/FARTICLE.ILESRVPGM:8` (`MODULE(ART300 ART301)`), `QSRVSRC/FARTICLE.BND:4-15` (no GETARTINFO), `QRPGLESRC/ART302.SQLRPGLE:11-24`, `QRPGLESRC/ART250.PGM.SQLRPGLE:156` | observed-in-code | Build/binding inconsistency — how does ART250 link? (ARCAD metadata may differ from source) |
| art-modules-c07 | `GetArtInfo` cached single-row SQL read of `ARTIINF` (skips re-read when same id) | `ART302.SQLRPGLE:11-24` | observed-in-code | Read side of art-interactive-c04 |
| art-modules-c08 | Dynamic SQL built by concatenating user-entered search text (injection surface) | `ART301.SQLRPGLE:104-121` | observed-in-code | Risk finding (mirror of cus-modules-c09) |
| art-modules-c09 | Selection window does not filter soft-deleted articles | `ART301.SQLRPGLE:104-115` (no `ARDEL` predicate) | observed-in-code | Boundary question for SME |
| art-modules-c10 | `CloseARTICLE1` prototyped but not exported | `ART300.RPGLE:129-136`, `ARTICLE.RPGLEINC:62-64`, `FARTICLE.BND:4-15` | observed-in-code | Mirror of cus-modules-c05 |
| art-modules-c11 | Family prompt inside the selector defaults help text `'<F4> to select.'` | `ART301.SQLRPGLE:76` | observed-in-code | Minor screen behaviour; fold into c04 |

## Overlap with other seeds

- `srvpgm-farticle` (queue #23) is the binding/export view of the same modules → recommend merging into this slice at bind (as with cus-modules / srvpgm-fcustomer).

## Deferred recommendations (prose only)

- c11 → fold into c04.
- c06 → needs build owner, not a behaviour card; keep as `needs-SME`.
