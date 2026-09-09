# MORNING_BRIEF — atu-merlin

# PHASE B DOCUMENT ONLY — NO TESTS — NO CONVERSION

Run: Pack B document-slices conveyor, run 14 · 2026-09-09 09:09 – 09:50 UTC (10:09–10:50 Europe/London)
Branch: `cursor/atu-merlin-estate-discovery` (PR #1 → `master`) · HEAD at start `f916270` (nudge; RUN tip `828230b`)
Previous briefs preserved in git: Pack B run 13 at `0de4efa:overnight/MORNING_BRIEF.md`; run 12 at `ee67225`; run 11 at `a664dfc`; run 10 at `60d3d61`; run 9 at `d47e987`; run 8 at `7a0e126`; run 7 at `c6b4704`; run 6 at `042232b`; run 5 at `17f0bbc`; Pack A residual at `73e5a0e`; Pack B run 4 at `6656114`; run 3 at `efb5e2a`; run 2 at `5ac7f0d`; run 1 at `0e32c19`; Pack A run 1 at `ab342e9`.

## 1. Slice processed

**`log-programs`** (job preference; second of the ten slices accepted in the night residual bind — `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`, Ash authorized, Field recorded). The application log: `LOG100` "Create Log UserSpace" (27-line RPGLE, no menu entry, no caller), the `LOG` service program (`LOG300` 46-line `nomain`, one export `AddLogEntry`, `EXPORT(*ALL)`), the `LOG.RPGLEINC` / `APICALL.RPGLEINC` prototypes, the runtime object `SAMLOG` `*USRSPC` (5000 bytes); 3 surfaces (`pgm:LOG100`, `srvpgm:LOG`, `mod:LOG300`), 10 candidates, **all accepted** by the bind (6 `observed-in-code`, 4 `inferred`: `c04` capacity, `c06` install step, `c09` reader, `c10` concurrency). `atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1`, `modern/` and `verification/` were **not** touched; the ORD vertical's `samlog` table is cited as the existing target counterpart of the log line, not widened; no Architecture pack drafted.

## 2. Cards written / needs-SME left

- **10 / 10** accepted behaviours now have as-is behaviour cards: `discovery/log-programs/features/log-programs-c01.md` … `c10.md`. Every card cites `ATU_SRC` file:line. `MANIFEST.yaml` → `phase: B`, 10 `documented`; `c04`, `c06`, `c09`, `c10` keep `confidence: inferred` on their cards (source half exact, runtime half outside the tree — run-13 practice).
- **0** candidates left without a card (the bind held nothing back); **0** `blocked`. Auto-accept policy not exercised.
- **9 needs-SME lines** carried explicitly in `MANIFEST.yaml` `needs_sme` / `open_questions`. The ones worth Ash's attention first:
  - **Room — preserve the user-space log at all?** Recommendation unchanged from Phase A: non-functional side effect. The ORD vertical already writes the same `Msg` text, a 10-character actor and a timestamp to a `samlog` table on every line delete (`modern/db/schema.sql:132-140,187-199`; `verification/ord-vertical/2026-09-09-r1/PARITY.yaml` `c03` `as_is: true`). Eight of the ten cards describe properties of the user-space implementation with no counterpart to reproduce; `c03`'s line *string* (`User:`/`Date:`/`Msg:` prefixes, `' ***'`) is the only thing a reader could depend on — and no reader is in the tree.
  - `c04` — **the log fills after ≈ 35 deletes and then fails permanently.** Every call writes a 600-byte fixed field, so the first failure is at `pos + 600 > size` (≈ 4400 at 5000 bytes) — ≈ 35 `ORD700` lines of ≈ 125 bytes, not Phase A's 40–60. The failing assignment raises **before** `pos` is advanced, so the cursor stays put and every later call in every job fails at the same offset. Silent throughout (`callp(e)`, `%error` unread). Page-rounded allocation (8192) would move it to ≈ 60 — box fact. Only reset: re-run `LOG100`. Phase A corrected.
  - `c06` — **one failed initialisation disables logging for the whole job.** `init` sets `inz = *on` before the `QUSPTRUS` call; if `SAMLOG` is missing (never created, or in a library not on the writer's `*LIBL`), the escape is swallowed, `p1` stays null, and every later `AddLogEntry` in that activation group fails on the null pointer — also swallowed. `LOG100` has no caller, menu entry, CL or `.ILEPGM`; a rebuild from `ATU_SRC` does not recreate `SAMLOG`. Install runbook, not behaviour.
  - `c08` — **`EXPORT(*ALL)` exports exactly one procedure** (only `AddLogEntry` carries `export` on its P-spec; `init` does not) — unlike `FPARAMETER`. The consumer side stays a blind spot: `LOG` not in `SAMPLE.BNDDIR`, `ORD700` no `bnddir`, no `ORD700.ILEPGM` — the only caller cannot be bound from the tree. Build owner (same line as `ord-trigger-ord700-c03`, `srvpgm-supporting`).
  - `c05` — **"errors swallowed" sharpened.** The `QUSCRTUS` error goes into `errcod` and is never read; `QUSPTRUS` is prototyped without an error code, so a create failure with no old `SAMLOG` surfaces one line later as an inquiry. The fully silent case: create fails while an **old** `SAMLOG` exists → `QUSPTRUS` finds it and lines 24–25 reset its header — the old log is logically emptied.
- Other facts recorded in the cards (as-is, cited): `User` is a module static `inz(*USER)` stamped at service-program activation (`ACTGRP(*CALLER)` → the caller's `QILE`, inference), written blank-padded to 10; the build buffer is `500 varying`, so a trimmed message over 437 characters is cut and loses the `' ***'` terminator (latent, not reachable from `ORD700`); `%trim` strips leading blanks; `%char(%timestamp())` is 26 characters; no `monitor` anywhere (`c03`); header = 4-byte big-endian cursor at 0 + `'***'` at 4, entries from 7, `' ***'` the only delimiter, 600-byte pad then `X'00'`; layout defined twice with no shared copybook (`c02`); `replace '*YES'` → re-running `LOG100` resets the log, a job holding `p1` keeps writing to the replaced copy (`c01`); one caller, one event, ordered quantity logged while the outstanding quantity is subtracted, `ODARID` untrimmed (`c07` → `ord-trigger-ord700-c03`); `adspusrspc samlog` unqualified on `*LIBL`, `help=nohelp`, no source, no other reader; a stopped or never-started log is indistinguishable from "nothing happened" (`c09`); unlocked read / write / `+=` on the shared cursor — every interleaving loses the first line and leaves a blank run; cursor corruption possible in the narrower load/add/store window (`c10`).
- Pointer-only observations left for other slices (not deepened): `SAMMNU` option 84 and the absent-object list (`menu-cmd-shell`, next in queue); `SAMPLE.BNDDIR` / `QSRVSRC` / `QILESRC` inventory (`srvpgm-supporting`); `ORD700` trigger behaviour (`ord-trigger-ord700-c03`, documented); `PARAMETER` library anchor (`par-maintain-c13`, documented). No card outside `discovery/log-programs/` edited.

## 3. Characterization

`CHARACTERIZATION: deferred-waived` — note present at `discovery/log-programs/CHARACTERIZATION.md` and on every card. Reason: no IBM i runtime; documented from source only. **No RECORD/REPLAY, no goldens, no `WAIVED_*` artefact, no Conversion unlock claimed.** `legacy_green` / `parity_green` remain `false` everywhere. Neither pack's `WAIVED_PATHFINDER` is extended; the ORD vertical's PARITY `c03` is cited, not re-verified. The note lists what a future RECORD would capture (`DSPOBJD SAMLOG *FULL` — library and actual allocated size; hex dump of the header before / after one delete; one `ORD101` option-`4` delete and the resulting line; `LOG100` re-run → reset, and whether a running job follows; `PARAMETER` library off the writer's `*LIBL` / `LOG100` never run → deletes succeed, nothing logged, no retry; `QUSCRTUS` failure with and without an old `SAMLOG`; a scripted mass delete until the log stops — the count, the exception id, `pos` unchanged; two sessions deleting simultaneously; menu option 84; `DSPSRVPGM LOG *PROCEXP`; `DSPPGM ORD700 *SRVPGM`) and the two facts to settle first (actual allocated size of `SAMLOG`; how `ORD700` is bound to `LOG`).

## 4. COVERAGE / APP_MANIFEST / INDEX delta

`inventory/atu-merlin/APP_MANIFEST.yaml` (status bumps + `discovery_card` pointers only, via `overnight/tools/mark_documented.py --slice log-programs`; no new surfaces/behaviours; one run note appended):

| Metric | before | after |
| --- | ---: | ---: |
| behaviours `documented` | 126 | **136** (+10 `log-programs`) |
| behaviours `candidate` | 135 | 125 |
| behaviours `deferred` | 7 | 7 |
| surfaces `accepted` / `candidate` / `deferred` / `unknown` | 29 / 32 / 3 / 7 | **32** / 29 / 3 / 7 (`pgm:LOG100`, `srvpgm:LOG`, `mod:LOG300` → accepted) |
| legacy_green / parity_green / parity_waived | 0 / 0 / 0 | 0 / 0 / 0 |

- `COVERAGE.md` regenerated by `overnight/tools/gen_coverage.py` (0 lint problems). Per-slice row `log-programs`: 3 surfaces, 10 behaviours, **10 documented**, weakest status `documented`.
- **Bind mirror (cap 1):** only `log-programs` was mirrored this run. The other eight night-wave slices (`menu-cmd-shell`, `srvpgm-supporting`, `sql-objects`, `ord-batch-ord900`, `cou-maintain` COU200 half, `pro-interactive`, `pro-modules`, `pro-cobol-pro201`) read `accepted` in their slice `MANIFEST.yaml` / `BIND.md` but still `candidate` (or `deferred`) in `APP_MANIFEST.yaml` and the INDEX until their runs — same practice as runs 8–13.
- `docs/estate/INDEX.md`: row 20 `log-programs` → **done** with the headline findings; header line notes run 14.
- Tooling: no tool changes (`mark_documented.py`, `gen_coverage.py` as at run 13).

## 5. Remaining accepted undocumenteds (queue for next run)

Eight, in the bind record's preferred order (cap 1 per run; Ash sets `overnight/AGENT_JOB.md` line 1 back to `RUN` each time):

1. `menu-cmd-shell` (9 candidates; adapter — the bind accepted it for documentation)
2. `srvpgm-supporting` (9 + 4 `unknown` surfaces)
3. `sql-objects` (10; `CUSSEQ` / `ART801` pointer surfaces)
4. `ord-batch-ord900` (9)
5. `cou-maintain` COU200 half (`c01`–`c06`, `c13`; FCOUNTRY half already documented in run 7)
6. `pro-interactive` (15; planted `PRO200` edit bug and XML/XSS as-is — do not invent fixes)
7. `pro-modules` (14)
8. `pro-cobol-pro201` (10)

Still held per the bind record: `art-interactive`, `art-modules` (wait `ART302` / SME), `fam-maintain` (hold until ART).

Awaiting human SME sign-off (`SME_BRIEF.md` checklists): `cus-interactive`, `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`, `vat-module`, `dat-utils`, `cou-maintain` (FCOUNTRY half), `ord-entry-ord101`, `ord-maintain-ord200`, `ord-maintain-ord201`, `ord-maintain-ord202`, `ord-print-ord500`, `par-maintain`, and now `log-programs`.

## 6. Explicit non-claims

- Did **not** convert anything. No Architecture pack drafted or widened (`atu-merlin-ts-cus-v1`, `atu-merlin-ts-ord-v1` untouched; residual packs are new packs, later, behind `ROOM_OK`). `modern/` and `verification/` not touched — read for the `samlog` citation only. The job body's `ROOM_OK` line was recorded, not consumed — this station does not need it.
- Did **not** generate tests, RECORD, REPLAY, goldens, or any waiver artefact.
- Did **not** bind anything (no self-accepts; every card was human-accepted on 2026-09-09). `ORD700`, `ORD700D.SYSTRG`, `SAMMNU`, `SAMPLE.BNDDIR`, `DETORD.PF` / `SAMREF.PF` were cited as the call site, the menu action, the binding facts and the field widths only — their slices were not deepened and no card outside `discovery/log-programs/` was edited.
- Did **not** fix any found defect (600-byte write and hard capacity, cursor not advanced on failure, `inz` set before the failing resolution, swallowed `errcod`, header reset of an old log, unlocked read-modify-write, 437-character truncation) — all recorded as-is per the job header.
- Did **not** edit `ATU_SRC/**` or touch `master`. House style respected (no pin / pinned / landed).
- No claim of parity, verification, or "% documented". Counts only.

## 7. Deviations recorded

- FEATURE_IDs kept as `log-programs-cNN` (same decision as runs 1–13; bind record, `BIND.md` and APP_MANIFEST reference them). Open Field Guide decision, unchanged.
- Four `inferred` rows (`c04`, `c06`, `c09`, `c10`) were bound `accepted` (not held as needs-SME); carded with the confidence kept and the source/runtime split stated, as run 13 did for `par-maintain-c08`. If the room prefers `inferred` rows to stay card-less, the cards can be withdrawn — flagged, not decided here.
- `c04` bound under the Phase A name "No capacity check - logging stops silently after ~4400 bytes"; the card keeps the id and adds the corrected count (≈ 35 lines) and the permanence to the name. `c05`, `c06` names sharpened likewise. `CANDIDATES.md` left as the Phase A record.
- **Trigger / sibling handling.** The automation fired on the nudge commit `f916270` ("no cards ~14m after `828230b`"). Before writing anything this run listed the automation's running agents: it was the only one — the first run-14 attempt (fired on `828230b`) had produced no cards and was no longer running — so this run took the slice. The Cloud Agent VM had a scratch branch (`cursor/atumerlin-job-runner-process-9418`) checked out; switched to `cursor/atu-merlin-estate-discovery` and reset to `origin` before any write. Origin re-checked immediately before the first commit and before the push.
- Several statements are platform semantics rather than source: API error-code convention (`c05`), page-rounded user-space allocation and `MCH0601` (`c04`), `MCH3601` on a null basing pointer and `CPF9801` from `QUSPTRUS` (`c06`), static initialisation at service-program activation and the `QILE` default (`c03`, `c08`), `EXPORT(*ALL)` semantics (`c08`), non-atomic `+=` on a based integer (`c10`), `QRPLOBJ` on replace (`c01`). Each is flagged inference / runtime-confirmable on the card and in `needs_sme`.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## 8. completeness: incomplete

Human residual gate untouched. Eight accepted slices are still undocumented (queue above); the estate scan is partial (`overnight/METHOD_COVERAGE.md`); ART slices unbound pending ART302; `fam-maintain` held; fourteen `SME_BRIEF` checklists unsigned.

## 9. Next action

**Ash:** set `overnight/AGENT_JOB.md` line 1 back to `RUN` (job header should prefer `menu-cmd-shell` next) — one slice per run, eight to go. A Pack B run takes ~40–60 minutes; a nudge before that re-fires the automation and can spawn a second run on the same slice — the runner now checks for a running sibling before writing, but the cheapest fix is to wait for the DONE flip. **Room:** decide whether the user-space log is behaviour to preserve at all (recommendation: no — the ORD vertical's `samlog` table is the log; only the `Msg` text is contract). **SME / box:** the actual allocated size of `SAMLOG` (decides the overflow point, `c04`) and how `ORD700` is bound to `LOG` (`c08`) — the two facts no card can settle from source.
