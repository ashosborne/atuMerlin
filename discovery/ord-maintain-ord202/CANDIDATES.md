# CANDIDATES — ord-maintain-ord202 (Phase A, unbound)

Seed: display one order — `ORD202(orid)`, read-only. All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| ord-maintain-ord202-c01 | Header display: chain `ORDER1` + `CUSTOME1`; order/delivery/close dates converted from ISO numeric, zero shown as 1940-01-01 sentinel | `QRPGLESRC/ORD202.PGM.RPGLE:82-91`, `:58`, `:147-150` | observed-in-code | Entry contract |
| ord-maintain-ord202-c02 | Lines display: `DETORD1` by ORID with article description via direct `ARTICLE1` chain (not FARTICLE); running totals net / with VAT | `ORD202.PGM.RPGLE:99-115` | observed-in-code | Primary content |
| ord-maintain-ord202-c03 | Read-only: F3/F12 exit; any other key exits too (`other → act → panel = 0`) | `ORD202.PGM.RPGLE:129-144` | observed-in-code | Screen contract |
| ord-maintain-ord202-c04 | Callers: `ORD200` opt 5, `ORD201` opt 5 | `QRPGLESRC/ORD200.PGM.SQLRPGLE:24-25,236-239`, `QRPGLESRC/ORD201.PGM.SQLRPGLE:21-22,242-245` | observed-in-code | Call graph |
| ord-maintain-ord202-c05 | DSPF declares CF06 'Create' / CA05 'Refresh' and option column, but program ignores them (dead keys, subfile SFLPAG 6 of SFLSIZ 7 — no paging logic) | `QDDSSRC/ORD202D.DSPF:31-32,39-40`, `ORD202.PGM.RPGLE:129-139` | observed-in-code | Prevents phantom "create from display" card; paging limitation |
| ord-maintain-ord202-c06 | Uses `ARTICLE1` directly instead of `GetArtDesc` (inconsistent with ORD101/ORD100) | `ORD202.PGM.RPGLE:8`, `:108` | observed-in-code | Dependency fact for conversion (bypasses service program) |

## Deferred recommendations (prose only)

- c05 subfile size (SFLSIZ 7 / SFLPAG 6, no page-down handling) — orders with >7 lines may not display fully; needs runtime confirmation. Recorded as open question.
