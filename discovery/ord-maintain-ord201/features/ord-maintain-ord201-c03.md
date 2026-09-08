# ord-maintain-ord201-c03 — Option 2 update -> ORD101 with correct closed guard

| | |
| --- | --- |
| Slice | `ord-maintain-ord201` |
| Status | `documented` (as-is behaviour card, Phase B — seam edge) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Option `2` on an **open** order calls `ORD101(orid)` — line maintenance — synchronously, then clears the option and rewrites the row **without reloading**. The guard is `(opt01 = 2 or opt01 = 4) and datclo > datBlank` with the parentheses in place, so `2` is refused only on a closed order (message 36). This is the **only working path to `ORD101` in the estate**: `ORD200`'s guard lacks the parentheses and refuses every `2` (`ord-maintain-ord200-c03`/`c09`, planted defect, as-is).

## Entrypoints

- Legend `2=Edit` on `CTL01` — `ATU_SRC/QDDSSRC/ORD201D.DSPF:61`
- Guard: `s01chk` `if (opt01 = 2 or opt01 = 4) and datclo > datBlank` → `sflmsg2` (36) — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:191-199`
- Action: `s01act` `when opt01 = 2` → `Updord(orid)` — `ORD201.PGM.SQLRPGLE:229-232`
- Prototype `Updord pr extpgm('ORD101')`, one parameter `like(orid)` (`6P 0`) — `ORD201.PGM.SQLRPGLE:18-19`, `ATU_SRC/QDDSSRC/SAMREF.PF:34`

## Inputs / outputs / observables

- In: row `orid` (by reference; `ORD101` declares it `id like(orid)` and never writes it). — `ORD201.PGM.SQLRPGLE:230`, `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:19-25`
- Out (data): whatever `ORD101` does to `DETORD` (edit quantities/price, delete lines — `ord-entry-ord101-c03`, `c06`); nothing written by `ORD201`. — `ORD101.PGM.RPGLE:8-9`
- Out (screen): `opt01 = 0; update sfl01` — row rewritten as loaded: `SUMORD` (Value) still shows the pre-edit `TOTVAL`; `DATLIV`/`DATCLO` unchanged (`ORD101` does not touch them). No message. — `ORD201.PGM.SQLRPGLE:231-232`

## Behaviour as implemented

1. `s01chk`: closed order (`datclo > d'1940-01-01'`, screen copy) → `DSPATR(RI)`, `SFLMSG` 36 "Closed order can not be edited or deleted", page positioned to the first error row, `step01 = dsp` — the whole pass is cancelled (`c07`). Open order → passes. — `ORD201.PGM.SQLRPGLE:191-199`, `ORD201D.DSPF:45-46`
2. `s01act`: `readc` the row, `Updord(orid)` — `ORD101` opens `ORDER1`/`DETORD1` `UF`, chains the header (lock held for its session — `ord-entry-ord101-c02`), lists the lines, returns on `F3`/`F12`. — `ORD201.PGM.SQLRPGLE:230`, `ORD101.PGM.RPGLE:8-9`
3. `opt01 = 0; update sfl01` (with `sflnxtchg` off → changed flag cleared). `step01` stays `act`, so the next changed row is processed on the next cycle; `%eof` → `dsp`. — `ORD201.PGM.SQLRPGLE:225-228,231-232`
4. No reload: the `Value` column is stale until `F5`, `F6` or a re-entry.

## Validation rules found in code

- Refused if `datclo > 1940-01-01` (message 36). A delivered-but-not-closed order **can** be edited (`ORD101` itself has no closed/delivered test — `ord-entry-ord101-c12`).
- No check that the order exists (a ghost row after `4`, `c04`, passes with `orid = 0` → `ORD101(0)`, whose header `chain` misses silently — `ord-entry-ord101-c02`).

## Edge cases found in code

- **Precedence divergence — the point of this candidate.** `ORD200.PGM.SQLRPGLE:187` reads `opt01 = 2 or opt01 = 4 and datclo > datBlank` (no parentheses → `2 or (4 and closed)`): every `2` refused. `ORD201:191` has `(opt01 = 2 or opt01 = 4) and …`. Same message, same action code otherwise. Preserve-or-correct for the twin is a room decision recorded in `ord-maintain-ord200-c09`. — `ORD201.PGM.SQLRPGLE:191` vs `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:187`
- **Stale guard.** The test uses the subfile copy of `datclo`; an order closed by another job after the load (or by `ORD200` `7`) still opens in `ORD101`. — `ORD201.PGM.SQLRPGLE:191`
- **Stale total after return.** Edits and deletes in `ORD101` change `ODTOTVAT` (and re-rate at today's VAT on a plain Enter — `ord-entry-ord101-c03`); the row's `SUMORD` is not re-read. Neither twin reloads (`ord-entry-ord101-c09`). — `ORD201.PGM.SQLRPGLE:231-232`
- **Lock interplay.** `ORD201` holds no `ORDER1` lock at the time of the call (its `chain` is only in `7`/`8`, released by `update`), so `ORD101`'s header chain does not wait on the caller. — `ORD201.PGM.SQLRPGLE:251,262`
- **Delete inside, then options outside.** Lines deleted in `ORD101` change the outcome of a later `4` guard (`c07`, live file read) but not of `7`/`8` (screen-copy guards).
- **Message 36 text covers both `2` and `4`.** "edited or deleted" — one wording for both options. — `ORD201D.DSPF:45-46`

## Dependencies

- `ORD101.PGM.RPGLE` (`ord-entry-ord101`, documented) — `ORD101.PGM.RPGLE:8-9,19-25`
- `ORDER1.LF` (header lock in the callee) — `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`

## Assumptions / unknowns

- needs-SME / room: with `ORD200`'s `2` dead, is `ORD201` the intended (only) line-maintenance entry, or should both work in the target? Not a Discovery decision; recorded for the ORD pack.

## Evidence

`ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:18-19,191-199,225-232,251,262` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:45-46,61` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:8-9,19-25` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:187` · `ATU_SRC/QDDSSRC/SAMREF.PF:34` · `ATU_SRC/QDDSSRC/ORDER1.LF:4-6`
