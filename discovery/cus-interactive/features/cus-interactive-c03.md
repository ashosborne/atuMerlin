# cus-interactive-c03 — Update customer (subfile option 2)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option 2 on a list row chains the customer by `CUID` on `CUSTOME1` (update-capable, record locked), shows `FMT02` in mode `UPD`, and on a clean `c04` check updates the row in place.

## Entrypoints

- `SFL01.OPT01 = 2` processed in `s01act` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:224-229`
- `S02prp` chain + display — `:257-266`; save `S02act` `update fcust` — `:321-329`
- Legend "2=Edit" — `ATU_SRC/QDDSSRC/CUS200D.DSPF:53`

## Inputs / outputs / observables

- Inputs: same `FMT02` fields as `c02`; `CUID` output only (cannot be changed).
- Output: updated `CUSTOMER` row; `MODE` shows `UPD`; `CONAME` shows resolved country name; `LASTORD` shows `CULASTORD` as a date (`c07`).

## Behaviour as implemented

1. `s01act` reads the changed subfile record, sets `mode = UPD`, `panel = 2`, `step02 = prp`, clears the option and updates the subfile row. — `:224-229`
2. `S02prp`: `CHAIN CUID CUSTOME1` (no `(n)` → record lock acquired), `CONAME = GetCountryName(CUCOUN)`, `LASTORD` derived from `CULASTORD`. **No `%found` test** after the chain. — `:257-266`
3. `S02dsp`: `EXFMT FMT02` while the record lock is held. — `:268-271`
4. F3 or F12 → back to the list without saving (`panel = 1`); F4 → country prompt (`c05`); Enter → `S02chk` (`c04`). — `:273-288`
5. Clean check → `S02act`: `CUMOD = %timestamp()`, `UPDATE FCUST`, `panel = 1`. — `:321-329`
6. Because `step01` is still `act`, control returns to `s01act`, which continues with the next changed subfile row (several rows may carry option 2 in one Enter; they are processed one after another). — `:215-237`

## Validation rules found in code

See `c04`; in `UPD` mode the duplicate rule is `dup > 1`.

## Edge cases found in code

- **Chain not checked**: if the row disappeared between load and option 2, `FCUST` holds whatever the failed chain left, and a later `UPDATE` without a preceding successful read would raise an RPG I/O exception (no `(e)`). Static derivation; no delete path exists in this seam (`c11`), so in practice only an external delete triggers this. — `:258,325`
- **Record lock across the screen**: the lock taken by the chain is held while the user sits on `FMT02`; cancelling with F12/F3 does not release it explicitly. It is released by the next successful `CHAIN` on `CUSTOME1` or program end. Other jobs updating that customer wait/time out per file `WAITRCD`. Runtime lock lifetime is not verifiable from source. — `:258,274-280`
- `CUMODID` is **not** refreshed on update: the chain reloads the stored `CUMODID`, and `S02act` only stamps `CUMOD` (see `c08`). — `:258,323,334`
- `CUCREA` is preserved on update (reloaded by the chain), answering the Phase A open question. — `:258,335`
- The list row is not refreshed after the update (see `c01` §8).
- `CUCREDIT` and `CUID` are display-only on `FMT02`; the row can only change via the fields listed in `c02`.

## Dependencies

- `CUSTOME1.LF` (`UF A E K`, `UNIQUE` on `CUID`) — `CUS200.PGM.SQLRPGLE:29`, `CUSTOME1.LF:4-6`
- `FCOUNTRY.GetCountryName` — `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-8`, `ATU_SRC/QRPGLESRC/COU300.RPGLE:19-27`

## Assumptions / unknowns

- `WAITRCD`/lock-wait behaviour is compiled-object/runtime configuration, not in `ATU_SRC`.

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:29,215-237,257-288,321-329` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:53,84-145` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`
