# dat-utils-c08 — Result value left unassigned on invalid input (port trap)

| | |
| --- | --- |
| Slice | `dat-utils` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

When `test(de) *iso` fails, both programs set only the result null indicator (`date_ind = -1`) and skip the `%date` assignment, so the `date` result parameter — DB2's result buffer, passed by reference — keeps whatever the SQL runtime placed in it. Under SQL semantics this is correct and invisible: a `-1` indicator means "value is NULL, ignore the buffer". A target that ports the two programs as a function *returning a date plus a flag* — or that reads the value before the flag — would surface an undefined value. The same is true on the `*PSSR` path (`c05`), where neither the value nor the indicator is set for the failing call.

## Entrypoints

- `DAT001` `if %error; date_ind = -1; else; date = %date(dat8:*iso); endif;` — `ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:45-50`
- `DAT002` same block inside the `else` of the sentinel test — `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:50-55`
- `date` is parameter 2 of the `pi` (by reference, `d`) — `DAT001.PGM.RPGLE:33`, `DAT002.PGM.RPGLE:33`

## Inputs / outputs / observables

- In: an argument that fails `test(de) *iso` (`c01` lists the classes).
- Out: `date_ind = -1`; `date` **not written**; `SQL_State = '00000'` (it is an SQL NULL, not an error). — `DAT001.PGM.RPGLE:42-47`
- Observable from SQL: NULL. Observable in the in-tree callers: a failed `fetch` (no indicator variable, `-305`) — the host variable is not updated either, so the subfile date field keeps its previous row's value / the `*inzsr` preset, but the row is never written (`c03`). — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:121-131`

## Behaviour as implemented

1. `date_ind = *zero` at the top of the call. — `DAT001.PGM.RPGLE:42`
2. `test(de) *iso dat8` → `%error` on. — `:45-46`
3. `date_ind = -1;` — nothing else. — `:47`
4. `return;` — `:51`

Contrast with the sentinel and valid paths, which always assign `date` and leave `date_ind = 0` (`DAT002.PGM.RPGLE:45-48,54`).

## Validation rules found in code

None beyond the `test(de)` itself.

## Edge cases found in code

- **The buffer is DB2's, not the program's.** Because `date` is a by-reference parameter, "keeps whatever it held" means whatever DB2 passed — typically the previous row's result storage or an initialised value. The program has no way to observe or clear it and does not try. Nothing in the source initialises `date` on entry.
- **Error path is worse, by design.** In `*PSSR` neither `date` nor `date_ind` is touched (`date_ind` stays `0` = "value present"); the `SQLSTATE` makes DB2 discard the call, so again invisible under SQL semantics (`c05`).
- **A NULL argument never reaches the code**, so the "input NULL → what result?" question does not arise for the program; it is answered by `RETURNS NULL ON NULL INPUT` (`c04`).
- **Sentinel paths always assign.** `0` and `99999999` write a value *and* leave the indicator at `0`; only the `test` failure produces an indicator without a value. — `DAT002.PGM.RPGLE:45-52`

## Dependencies

- `c01` / `c02` (which inputs fail), `c04` (parameter semantics), `c05` (error path), `c06` (program stays active, so the program's own variables — but not `date` — persist).

## Assumptions / unknowns

- None for the as-is reading. For a later station: the rule to reproduce is "invalid → NULL / absent", never "invalid → previous value"; the card exists so that a characterization or conversion does not accidentally encode the buffer artefact.

## Evidence

`ATU_SRC/QRPGLESRC/DAT001.PGM.RPGLE:33,42-51` · `ATU_SRC/QRPGLESRC/DAT002.PGM.RPGLE:33,42-57` · `ATU_SRC/QSQLSRC/ISOTODATE.SQLUDF:27` · `ATU_SRC/QSQLSRC/ISOTODATE4.SQLUDF:11` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:121-131`
