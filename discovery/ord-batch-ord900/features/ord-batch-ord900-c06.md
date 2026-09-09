# ord-batch-ord900-c06 — `ORD901` is a whole-file rewrite: `ORDER` opened `UF E DISK` (update, arrival sequence, no `COMMIT` keyword), one native `UPDATE` per row, then two set-based SQL `UPDATE`s in the same program with no `SET OPTION COMMIT`, no handler, no `COMMIT` — a failure anywhere leaves the file partly shifted, and a rerun can shift the done rows twice

| | |
| --- | --- |
| Slice | `ord-batch-ord900` |
| Status | `documented` (as-is runtime-characteristic card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD901` touches every row of `ORDER` and, through its SQL tail, every out-of-sync row of `DETORD` and every customer with orders. The native side is explicit: `forder UF E DISK` — update-capable, externally described, no key (the physical file has none, so reads are in arrival sequence), and **no `COMMIT` keyword**, so the row loop runs without commitment control by construction. The SQL side is silent: the member has no `SET OPTION COMMIT`, no `COMMIT` / `ROLLBACK` statement, no `WHENEVER`, no `sqlcod` test. Whether the two tail statements ran under `COMMIT(*CHG)` (the precompiler default) or `*NONE` was decided at build time by options that are not in the tree (`iproj.json` delegates to `elias compile`); `ART801` and `ART200` set it explicitly, `ORD901` does not. Either way there is no atomicity across the three parts. A failure in the loop (`RNQ0112` on a bad date, `c03`) leaves the rows before it shifted and the rest not; a failure in the tail leaves the loop applied. And because the shift is recomputed from `MAX(ORDATE)` on every run, a rerun after a mid-loop failure shifts the already-done rows **a second time** when the newest order was not among them (`c03`). The program runs in the interactive job of whoever picks menu option 81; there is no confirmation, no parameter, no output.

## Entrypoints

- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:4` — the F-spec
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:19-41` — the read / update loop
- `ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:42-50` — the two SQL `UPDATE`s
- Menu: `SAMMNU.MENU:147-150` (`cmd call ord901` — interactive `CALL`, no `SBMJOB`)

## Inputs / outputs / observables

- In: every row of `ORDER`; `DETORD`, `CUSTOMER` for the tail. — `ORD901.PGM.SQLRPGLE:4,19,42-50`
- Out: every row of `ORDER` rewritten (even when unchanged, `c03` same-day case); `DETORD` rows with `ODYEAR` out of sync; `CUSTOMER` rows with orders. — `ORD901.PGM.SQLRPGLE:39,42-50`
- Observable: record locks on `ORDER` one row at a time for the duration of each `read` → `update` (native `UF` read locks the record — language semantics); the SQL updates take row / file locks for their duration; the interactive job is busy until the end. Concurrent `ORD100` / `ORD200` / `ORD201` sessions would wait or time out on the locked row (`ORD200:245 chain (orid) order1` — default wait). No message on success.

## Behaviour as implemented

1. **Open mode.** `UF E DISK`: `U` = update, `F` = full-procedural, `E` = externally described, no `K` = arrival sequence (`ORDER.PF` has no `K` line), no `COMMIT` keyword. — `ORD901.PGM.SQLRPGLE:4`; `ATU_SRC/QDDSSRC/ORDER.PF:5-14`
2. **Loop.** `read order` / `dow not %eof` / … / `update forde` / `read order` — sequential, one record lock at a time, every row updated whether or not anything changed (no compare-before-write). — `ORD901.PGM.SQLRPGLE:19-20,39-41`
3. **Mixed access to one file.** The same `ORDER` file is open natively (F-spec) while the tail's SQL reads it (`FROM order` / `FROM "ORDER"`) — the loop has ended (`%eof`), so no row is locked by the native side at that point. — `ORD901.PGM.SQLRPGLE:19-20,42-50`
4. **Commitment stance.** Native: none (no `COMMIT` keyword). SQL: undetermined from source — no `SET OPTION` in the member (grep: `ART200:332` is the only `SET OPTION` in `QRPGLESRC`; `ART801`'s header has `COMMIT = *NONE`). If the build used the precompiler default `COMMIT(*CHG)`, the tail statements need the three files journaled and are committed implicitly when the activation group ends (inference); if `*NONE`, they apply as they run. — `ORD901.PGM.SQLRPGLE` (absence); `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:332`; `ATU_SRC/QSQLSRC/ART801.SQLPRC:9-20`; `iproj.json:14-15`
5. **Error handling.** None: no `MONITOR`, no `(E)` extender, no `WHENEVER`, no `sqlcod` / `sqlstt` test, no `*PSSR`. Every failure surfaces as the default inquiry / escape message in the interactive job. — structural read of the member

## Validation rules found in code

- None.

## Edge cases found in code

- **Partial run, native side.** `RNQ0112` on row *k* (`c03` / `c04`): rows 1..k−1 shifted and written; k..N untouched; tail never runs (`ODYEAR` / `CULASTORD` not resynced). Operator sees an inquiry message; `C` (cancel) ends the program with `LR` off — files closed by the system at job / activation-group end. — `ORD901.PGM.SQLRPGLE:19-41`
- **Rerun after partial run.** Offset recomputed from `MAX(ORDATE)` over the mixed file. Newest order among the done rows → `days = 0` → harmless rerun (the bad row fails again). Newest order among the untouched rows → same `days` → done rows shifted **again**, landing `days` past today; their `ORDATDEL` / `ORDATCLO` then hit the future guard and are zeroed (`c04`) — deliveries and closes disappear from those orders. Non-idempotent; not detectable by the program. — `ORD901.PGM.SQLRPGLE:11,17,21-32`
- **Partial run, SQL side.** Statement (2) fails → loop and statement (1) stay applied, `CULASTORD` stale. Under `COMMIT(*CHG)` a failed statement is rolled back by itself, the earlier ones are not (no `ROLLBACK` in the program) — inference. — `ORD901.PGM.SQLRPGLE:42-50`
- **Not journaled under `*CHG`.** If built with the default and `ORDER` / `DETORD` / `CUSTOMER` are not journaled, the first SQL `UPDATE` fails (`SQL7008`) every time — the loop still runs to completion first, so the dates shift but the years / `CULASTORD` never resync. Only the source owner can say which build option applies. — `ORD901.PGM.SQLRPGLE:42`
- **Concurrency.** Interactive job, no `ALCOBJ`, no exclusive lock: `ORD100` confirms and `ORD200` / `ORD201` edits can interleave with the loop. An order inserted mid-run (dated today by `ORD100`) is read later in arrival sequence and shifted by `days` into the future (its `ORDATE > today`); a subsequent run would then have `days < 0` (`c03`). Theoretical in a demo estate. — `ORD901.PGM.SQLRPGLE:17,19-21`
- **Runtime.** One update per order plus one trigger call per line for the backfill (`c05`) — linear; fine for a sample, unbounded for a real estate; runs in the foreground of the menu user's session.

## Dependencies

- `ORDER.PF`, `DETORD.PF`, `CUSTOMER.PF` (shared PFs — **deps**, not the slice); `ORDER1` / `ORDER2` / `ORDER3` access paths maintained on each update.
- `ORD700U` / `ORD700` (fires from the tail — `c05`).
- `c02` (the file is open before the guard), `c03` (rerun arithmetic), `c04` (future guards on a double shift), `c05` (tail statements), `c08` (no CL wrapper that could add `STRCMTCTL` / `ALCOBJ` / `SBMJOB`).
- Build: `iproj.json` → `elias compile` (compile options not in tree); `sql-objects-c09` (how `ART801` sets `COMMIT = *NONE` explicitly — the contrast).

## Assumptions / unknowns

- Platform: `UF` without `COMMIT` = no commitment control; `CRTSQLRPGI` default `COMMIT(*CHG)`; implicit commit at activation-group end; `SQL7008` for a non-journaled file under commitment control; native `read` on a `UF` file holds a record lock until `update` / next `read`. Inference; the build option is knowable only from the box (`DSPPGM ORD901` / `PRTSQLINF ORD901`).
- **needs-SME (source owner):** `PRTSQLINF ORD901` — which `COMMIT` option the object was built with. Settles whether the tail ever ran on an unjournaled sample.
- **needs-SME (room, ORD pack):** if the utility has a target counterpart at all (`c07`), the target should decide atomic-or-not explicitly — the as-is behaviour is "three independent parts, rerun unsafe after failure". Same question `sql-objects-c09` asks for `ART801`.

## Evidence

`ATU_SRC/QRPGLESRC/ORD901.PGM.SQLRPGLE:4,11,17,19-50` · `ATU_SRC/QDDSSRC/ORDER.PF:5-14` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:332` · `ATU_SRC/QSQLSRC/ART801.SQLPRC:9-20` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:245` · `ATU_SRC/QPNLSRC/SAMMNU.MENU:147-150` · `iproj.json:14-15` · structural grep of `ATU_SRC/**` for `SET OPTION` (`ART200:332`, `ART801` header only), of the member for `COMMIT` / `ROLLBACK` / `WHENEVER` / `MONITOR` / `sqlcod` / `*PSSR` (none)
