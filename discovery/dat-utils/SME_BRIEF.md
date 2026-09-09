# SME_BRIEF — dat-utils (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`); 8/8 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 6). No `needs-SME` / `inferred` candidates in this slice — every row was `observed-in-code` and accepted. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; the UDFs are **not** part of `atu-merlin-ts-cus-v1` and this brief does not propose widening it.

## What was documented

Two external SQL scalar functions and their RPG programs (4 members, ~170 lines in total): `ISOTODATE40` → `DAT002` (`0 → 1940-01-01`, `99999999 → 2039-12-31`, invalid → NULL) and `ISO_Num_To_Date` → `DAT001` (no sentinels, `0` → NULL, unused). Pure functions: no files, no SQL, no state. Cards live in `features/dat-utils-c01.md` … `c08.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

Facts found while reading source that sharpen the Phase A summaries (as-is, cited in the cards):

- `c01` — the sentinel test is an exact equality on `0` and `*HIVAL` (`99999999`); `99999998` goes to `test(de)` and returns NULL. No in-tree writer ever produces `99999999` (`ORD100` writes `0`, `ORD200`/`ORD201` write today's date, `ORD901` shifts by days or resets to `0`), so the `2039-12-31` branch is unreachable from in-tree data — and it has **no `MAPVAL`**, so a `99999999` close date would display as 31/12/2039 and count as "already closed" in the option guards. **Derived:** `1940-01-01` / `2039-12-31` are exactly RPG's `*LOVAL` / `*HIVAL` for 2-digit-year date formats; `ORD202D` shows the same sentinel as `01/01/40` under `DATFMT(*DMY)`.
- `c01`/`c03` — both callers fetch the three converted dates **with no null indicators** and loop on `sqlcod = 0`; a NULL (an invalid stored numeric date) fails the fetch (`-305`) and **ends the list load silently at that row**. Derived: with `order by datord desc`, a NULL order date sorts first and empties the list. Reachable only via out-of-tree writes. Pointer to `ord-maintain-ord200` / `ord-maintain-ord201`.
- `c02` — `DAT001` is `DAT002` minus the sentinel block; otherwise line-for-line identical. Zero and only zero difference in semantics: `0` → NULL.
- `c03` — `ORD200` loads all rows for the customer per rebuild, `ORD201` 14 per page; after deliver/close both refresh the subfile row with `%date()` directly, so the UDF is not re-invoked until the list is rebuilt. Every other program showing these columns (`ORD202`, `ORD500`, `CUS200`, `ORD901`) converts in RPG with `%date(x:*iso)` — two conversion paths for one storage format. The only unread consumer candidates are the QM queries behind menu options 12/13 (no source).
- `c04` — **correction to Phase A** ("9-parameter external interface"): `PARAMETER STYLE SQL` with one argument is **8** parameters (argument, result, two indicators, SQLSTATE, function name, specific name, message text); scratchpad / call type / dbinfo are absent. `dat8_ind`, `Function_Name`, `Specific_Name`, `stPgmName` are never read. `EXTERNAL NAME` is unqualified (library-list resolution at run time); nothing in the tree creates the functions (no `RUNSQLSTM`, no install member).
- `c05` — `*PSSR` is a safety net, not a reachable branch under valid data: `test(de)` already absorbs date errors, and the body has no I/O or arithmetic, so only a decimal-data error on a corrupt packed argument could reach it. Message text is the 80-char SDS exception text truncated to the 70-char `VARYING` parameter (the source comment says so). `date_ind` stays `0` on the error path — as-is the *statement fails*, it does not yield a NULL row.
- `c06` — nothing to go stale: both program-written outputs are reset every call and the result parameter is DB2's storage. Contrast `FVAT` / `FCUSTOMER`, where the same "return without `*inlr`" shape keeps a last-key buffer. No `H` spec — activation group is build metadata.
- `c07` — **correction to Phase A** for the `ORD202` copy: `ORD202` does not map `0 → 1940` per row; it presets the three date fields to `d'1940-01-01'` in `*inzsr` and simply does not assign them when the numeric is `0` (works because the program ends with `*inlr` per order). `ORD200`/`ORD201` are a **fourth** dependency — they hold the constant to *compare* the UDF output (`datclo > datBlank`), so the SQL sentinel and the RPG constant must agree. The raw `0` convention is tested directly by `ORD200`/`ORD201`, `ORD202`, `ORD901` and `ART801`. Each member declares its own `d'1940-01-01'`; no shared definition anywhere.
- `c08` — the untouched result is DB2's by-reference buffer, so "keeps whatever it held" means whatever DB2 passed, not the previous program value; the program never initialises `date`. On the `*PSSR` path neither value nor indicator is set.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c08`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source (suggest `c01`, `c03`, `c07`).
- [ ] `c01`/`c07` Is `1940-01-01` the agreed "no date" sentinel for the target, or should the target store / return NULL (or an optional type) and let the UI decide how to show "none"? This decides whether the CUS / ORD cards reference one rule or the target drops the sentinel altogether.
- [ ] `c01` Is the `99999999 → 2039-12-31` branch used by any out-of-tree data (DFU / SQL loads)? If never, the target can drop it.
- [ ] `c07` Collapse the three (SQL, explicit RPG, implicit RPG) implementations into one rule in the target? Room decision for the later ORD Architecture pack — not a widening of `atu-merlin-ts-cus-v1`.
- [ ] `c02`/`c03` Do the QM queries `CUSQRY` / `ARTQRY` / form `CUSQRYFMT` (menu options 12/13, no source in tree) call `ISO_Num_To_Date` or `ISOTODATE40`? If not, `ISO_Num_To_Date` is dead — `reject` rather than port?
- [ ] `c03` Should the target's order lists tolerate an invalid stored date (show blank / flag) rather than silently truncating the list? (`ord-maintain-ord200`/`201` scope; recorded here because the NULL comes from this rule.)
- [ ] `c04`/`c06` Build owner: activation group and `FENCED` status of `DAT001` / `DAT002`; target library of the two `CREATE FUNCTION`s; how the functions are (re)created on deploy.
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock). Phase A's "first golden set" recommendation stays a recommendation for a later station.
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `dat-utils`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c03`/`c02` QM queries as consumers of `ISO_Num_To_Date` (dead or not).
2. `c01`/`c07` `1940-01-01` sentinel vs NULL in the target.
3. `c07` collapse three implementations into one rule (room / ORD Architecture pack).
4. `c01` `99999999` branch used by out-of-tree data?
5. `c04` build owner: activation group, `FENCED`, target library, function creation.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| One rule or three? (Phase A recommendation: accept one "numeric ISO date with sentinels" rule here) | Room accepted all 8 candidates as separate rows; `c07` documents the three producers, the comparison consumers and the raw-`0` consumers so the ORD Architecture pack can decide. Not decided here. |
| `ISO_Num_To_Date` (Phase A: `defer` until QM sources are seen) | Room accepted `c02`/`c03` for documentation; the dead-or-not question is carried as needs-SME. |
| Callers `ORD200` / `ORD201` | Cited as call sites and for what they do with the result (un-indicated fetch, sentinel comparisons, `MAPVAL`); `ord-maintain-ord200`/`201` not deepened (unbound; next ORD bind wave per the bind record). |
| Sibling RPG conversions `CUS200` / `ORD202` / `ORD500` / `ORD901` | Cited for `c07` only; `cus-interactive-c07` already documented, the others unbound / deferred. |
| `ORDERCUS.VIEW`, `ART801` | Cited as row source / `0`-convention consumer only (`sql-objects`, unbound). |
| Test candidate | Noted in `CHARACTERIZATION.md` as what a future RECORD would capture; not actioned. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, widen `atu-merlin-ts-cus-v1`, or edit `ATU_SRC/**`.
