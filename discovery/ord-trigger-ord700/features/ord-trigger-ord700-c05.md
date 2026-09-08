# ord-trigger-ord700-c05 — Silent no-op on zero delta or unknown article

| | |
| --- | --- |
| Slice | `ord-trigger-ord700` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`UpdArt(qty, id)` is the single write path of `ORD700`. It returns without doing anything when `qty = 0` or when no `ARTICLE` row has `ARID = id`; otherwise it reads the article with an update lock, adds `qty` to `ARCUSQTY` and rewrites the record. No error, message, log entry or return code is produced in either skip case, and no I/O exception is handled: a `chain` or `update` failure (other than not-found) is unhandled inside the trigger.

## Entrypoints

- Procedure `UpdArt` (prototype and implementation) — `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:10-12,97-110`
- Called from every event branch: insert (`:75`), delete (`:82`), update (`:87-89`, `:91`, `:92`).

## Inputs / outputs / observables

- In: `qty` `5 0` **by value** (a signed delta), `id` `like(new.ODARID)` (`ARID` 6A). — `ORD700.PGM.RPGLE:98-100`, `ATU_SRC/QDDSSRC/SAMREF.PF:11,47`
- Out: `ARTICLE` record `update farti` with `ARCUSQTY` changed; every other field (`ARDESC`, `ARSTOCK`, `ARMOD`, `ARMODID`, `ARDEL`, …) rewritten with the value just read — `ARMOD` / `ARMODID` are **not** stamped by the trigger. — `ORD700.PGM.RPGLE:104-109`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5-39`
- Observable: only `ARCUSQTY`. No diagnostic on skip.

## Behaviour as implemented

1. `if qty = 0 → return`. — `ORD700.PGM.RPGLE:101-103`
2. `chain id article1` (file `ARTICLE1` opened `UF E K DISK`; unique key `ARID`). — `ORD700.PGM.RPGLE:6,104`, `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`
3. `if not %found → return`. — `ORD700.PGM.RPGLE:105-107`
4. `ARCUSQTY += qty; update farti`. — `ORD700.PGM.RPGLE:108-109`
5. Return to the mainline `select`; the mainline `return`s without `*inlr` (`c06`), so `ARTICLE1` stays open across trigger invocations. — `ORD700.PGM.RPGLE:94-95`

## Validation rules found in code

None: no sign check, no bound check, no soft-delete check (`ARDEL` is ignored — a soft-deleted article is updated like any other), no check that the article's `ARCUSQTY` stays `>= 0`.

## Edge cases found in code

- **Unknown or blank article id → silent skip.** Lines for an article that was later hard-deleted, or staged with a blank id, leave `ARCUSQTY` untouched on every event. — `ORD700.PGM.RPGLE:104-107`
- **Zero delta → skip before any I/O**, so price-only edits and `ODYEAR` backfills (`c04`) never touch `ARTICLE`. — `ORD700.PGM.RPGLE:101-103`
- **Negative result is possible.** `QUANTITY` is `5 0` zoned (signed); a delete or delivery delta larger than the current `ARCUSQTY` (e.g. after a reconciliation, or if the insert never fired) yields a negative value that is stored as-is. — `ORD700.PGM.RPGLE:108`, `SAMREF.PF:47`
- **Overflow is unguarded.** `ARCUSQTY` is 5 digits; `+=` past 99999 is an unhandled numeric exception inside a trigger program. — `ORD700.PGM.RPGLE:108`
- **No `(e)` extender on `chain` / `update`**: a record lock held by another job (e.g. `ART201` editing the same article) or any other I/O error surfaces as an unhandled exception in the trigger, which — being an `*AFTER` trigger — propagates to the originating `write`/`update`/`delete` in the writer program. The writers (`ORD100`, `ORD101`, `ORD200`, `ORD201`) do not monitor their `DETORD` I/O either. — `ORD700.PGM.RPGLE:104,109`; `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:206`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:191,270`
- **Read-with-lock then rewrite** (no re-read, no commitment control) — two jobs' triggers on the same article serialise on the record lock; the delta-add form means the result is order-independent as long as each update completes. — `ORD700.PGM.RPGLE:104-109`

## Dependencies

- `ARTICLE1.LF` over `ARTICLE.PF` (format `FARTI`). — `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6`, `ATU_SRC/QDDSSRC/ARTICLE.PF:5`

## Assumptions / unknowns

- Whether silent skips are acceptable (no operator visibility when `ARCUSQTY` silently stops tracking an article). SME question; carried in `SME_BRIEF.md`.
- Runtime behaviour of an unhandled exception inside the trigger (message to the writer's job, rollback scope without commitment control) is a platform fact not verifiable here.

## Evidence

`ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:6,10-12,75,82,87-92,94-95,97-110` · `ATU_SRC/QDDSSRC/ARTICLE.PF:5-39` · `ATU_SRC/QDDSSRC/ARTICLE1.LF:4-6` · `ATU_SRC/QDDSSRC/SAMREF.PF:11,47` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:206` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:191,270`
