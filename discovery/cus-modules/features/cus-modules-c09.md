# cus-modules-c09 — Dynamic SQL string concatenation of user input

| | |
| --- | --- |
| Slice | `cus-modules` |
| Status | `documented` (as-is behaviour card, Phase B) — risk finding, kept as its own card per bind |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`s01prp` builds the `SELECT` by concatenating `%trim(srchName)` / `%trim(srchCity)` inside single-quoted `LIKE '%…%'` literals and runs it with `PREPARE`/`OPEN`. Typed text is interpreted as SQL text, not bound as a parameter: a `'` breaks or alters the statement, `%`/`_` act as wildcards, and any failure is silent (empty list).

## Entrypoints

- Statement build — `ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:103-115`; `exec sql prepare s1 from :stm; declare C1 cursor for s1; open c1;` — `:119-121`
- Input fields `SRCHNAME 10 B`, `SRCHCITY 10 B` (no `CHECK(LC)`) — `ATU_SRC/QDDSSRC/CUS301D.DSPF:56-57`
- `stm` is `500` varying — `CUS301.SQLRPGLE:70`

## Inputs / outputs / observables

Statement text as built (`ORDER BY CUSTNM` appended in every case — `:115`):

| Criteria | Statement |
| --- | --- |
| name and city | `SELECT CUID, CUSTNM, CUCITY, CUCOUN FROM CUSTOMER Where UPPER(CUSTNM) like '%<name>%' AND UPPER(CUCITY) like '%<city>%'  ORDER BY CUSTNM` |
| name only | `… Where UPPER(CUSTNM) like '%<name>%'  ORDER BY CUSTNM` |
| city only, or both blank | `… Where UPPER(CUCITY) like '%<city>%'  ORDER BY CUSTNM` (`c11`) |

`<name>`/`<city>` = `%trim(field)`, at most 10 characters each, already uppercased by the 5250 session (no `CHECK(LC)`; system behaviour).

## Behaviour as implemented

1. No escaping or doubling of `'` in the input; no parameter markers; no host-variable predicate. — `:105-113`
2. `UPPER()` on the column side only; the literal is whatever was typed. — `:105,109,112`
3. No `SQLCODE`/`SQLSTATE` check after `PREPARE`, `DECLARE`, `OPEN` or the first `FETCH`. A failed prepare cascades: `sqlcod <> 0` → `S01lod` writes no rows → `sflend` on → empty list, "Bottom", no message. — `:119-122,133-140`
4. Injectable length is bounded: 10 characters per field, 20 in total; the statement buffer is 500 bytes.

## Validation rules found in code

None on the criteria content.

## Edge cases found in code

- **Quote.** A single `'` inside the text ends the literal early; the remainder is parsed as SQL → syntax error (silent empty list) or, if it happens to parse, an altered predicate.
- **Wildcards.** `%` and `_` typed by the user are `LIKE` metacharacters (no `ESCAPE` clause) — `_` matches any single character, `%` any run.
- **Statement shape is SELECT-only** and the result is bound into a 4-column DS (`data`), so a well-formed injected fragment can at most widen or narrow the customer list returned to an already-authenticated 5250 user; anything producing extra columns or a different statement type fails at `FETCH`/`PREPARE` and shows an empty list. This is a static reading of the code path, not a security assessment.
- Blank input in a branch produces `LIKE '%%'` (`c11`), which matches every non-null row.
- CCSID/collation of `UPPER()` and `LIKE` on national characters is a job/runtime setting — not observable from source.

## Dependencies

- SQL runtime (dynamic SQL); `CUSTOMER` table; `ATU_SRC/QDDSSRC/CUS301D.DSPF:56-57`

## Assumptions / unknowns

- **needs-SME / architecture (carried from bind):** preserve the as-is quirk (wildcards, quote behaviour, silent failure) as the characterised contract, or treat it as a defect to be fixed during conversion? Not a Discovery decision; recorded here so it is not lost. No fix proposed and none made.

## Evidence

`ATU_SRC/QRPGLESRC/CUS301.SQLRPGLE:70,103-122,133-140` · `ATU_SRC/QDDSSRC/CUS301D.DSPF:56-57`
