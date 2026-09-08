# JOURNAL — Pack B document-slices conveyor, atu-merlin

One row per run. Branch `cursor/atu-merlin-estate-discovery`. Times UTC (Ash is Europe/London, +1h in September).

| run | started (UTC) | HEAD at start | SLICE_ID | result |
| ---: | --- | --- | --- | --- |
| 1 | 2026-09-08T13:22Z | `ab342e9` | `cus-interactive` | 12/12 accepted cards written; MANIFEST → `documented`; APP_MANIFEST bumped; COVERAGE regenerated; INDEX row mirrored. `CHARACTERIZATION: deferred-waived`. |
| 2 | 2026-09-08T15:11Z | `0e32c19` | `cus-modules` | 10/10 accepted cards written (`c01`–`c09`, `c11`); `c10` stays needs-SME (inferred, no card); MANIFEST → `documented`; APP_MANIFEST bumped (documented 12→22); COVERAGE regenerated; INDEX row 2 done. `CHARACTERIZATION: deferred-waived`. |
| 3 | 2026-09-08T16:07Z | `5ac7f0d` | `ord-entry-ord100` | 12/12 accepted cards written (`c01`–`c08`, `c10`, `c12`–`c14`); `c09`, `c11` stay needs-SME (inferred, no card); MANIFEST → `documented`; APP_MANIFEST bumped (documented 22→34); COVERAGE regenerated; INDEX row 5 done. `CHARACTERIZATION: deferred-waived`. Queue left: `ord-trigger-ord700`. |
| 4 | 2026-09-08T17:45Z | `fa5b77f` | `ord-trigger-ord700` | 8/8 accepted cards written (`c02`–`c07`, `c09`, `c10`); `c01`, `c08`, `c11` stay needs-SME (inferred, no card); MANIFEST → `documented`; APP_MANIFEST bumped (documented 34→42, accepted 8→0); COVERAGE regenerated; INDEX row 11 done. `CHARACTERIZATION: deferred-waived`. **Queue empty — conveyor idle until more slices are bound.** |
| 5 | 2026-09-08T20:01Z | `02c9468` | `vat-module` | 10/10 accepted cards written (`c01`–`c10`); no needs-SME candidates in the slice; MANIFEST → `documented`; APP_MANIFEST bumped (documented 42→52, surfaces accepted 12→14); COVERAGE regenerated; INDEX row 19 done. `CHARACTERIZATION: deferred-waived`. Queue left: `dat-utils`, `cou-maintain` (FCOUNTRY `c07`–`c12` only). |

## Run 1 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN`.
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD.
- Pick: `cus-interactive` (job preference; CUS-first prove path). Other accepted undocumenteds left in queue: `cus-modules`, `ord-entry-ord100`, `ord-trigger-ord700`.
- FEATURE_IDs: kept the Phase A / bind ids `cus-interactive-c01..c12` rather than renumbering to `<SLICE_ID>-NNN`. The bind record, `BIND.md` and APP_MANIFEST `behaviour_id`s all reference the `cNN` ids; renumbering would break that trace for no gain. Flagged as a Field Guide open decision, not silently changed.
- Phase A summaries corrected from source during deepen (as-is, observed): `c08` — `CUMODID` is set only at `*inzsr`; on update the `chain` reloads the stored `CUMODID`, so update refreshes `CUMOD` but **not** `CUMODID`. `c04` — update-mode duplicate check counts DB rows matching the *new* values, so changing name+phone to collide with exactly one other customer passes (`dup = 1`).
- Phase A open question on `CUCREA` answered from source: update path chains the record first, so stored `CUCREA` is preserved; create uses the `*inzsr` date (program start date, not save date).
- `APP_MANIFEST.yaml`: `notes` had been changed to a list by the bind commit; `gen_coverage.py` rendered it as a Python list. Added `overnight/tools/mark_documented.py` (status bump + pointers only) and made `gen_coverage.py` render list notes as bullets. No inventory content invented.
- Timestamps in `discovery/cus-interactive/MANIFEST.yaml` normalised to run time.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## Run 2 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN` (job header: "run 2 prefer cus-modules").
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD. `ROOM_OK` not required for this station and not claimed.
- Pick: `cus-modules` (job preference; CUS-first prove path). Remaining accepted undocumenteds: `ord-entry-ord100`, `ord-trigger-ord700`.
- `srvpgm-fcustomer` folded per bind: no new feature invented; export/signature facts documented inside `c01` and `c05`.
- `c10` (inferred scaffold) kept `needs-SME`, no card written. Auto-accept policy not exercised.
- Findings beyond Phase A summaries (as-is, cited in cards): `ExistCus`/`IsCusDeleted` have no callers in `ATU_SRC` and only `GetCusName` of the getters is called; misses are not cached but hits are (stale reads possible in one activation group); `ExistCus(0)` as first call never chains (`%found` undefined); `SltCustomer` criteria persist across calls; SQL errors silent; F8 unhandled → Enter; criteria change beats selection.
- Evidence corrections: `SLTCUSTOMER` export `FCUSTOMER.BND:19`; `c10` include comment `CUSTOMER.RPGLEINC:64-67`.
- Tooling: `MANIFEST.yaml` summaries quoted (unquoted `: ` broke PyYAML before `mark_documented.py` ran; no tool changes needed). `gen_coverage.py` 0 problems.
- Pushed once at the end with `AGENT_JOB.md` already `DONE`.

## Run 3 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN` (job header: "run 3 prefer ord-entry-ord100").
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD. `ROOM_OK` not required for this station and not claimed. The CUS PACK bound at `5ac7f0d` was not consumed (ORD is document-only per bind).
- VM had a scratch branch checked out at `5ac7f0d`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before any write.
- Pick: `ord-entry-ord100` (job preference). Remaining accepted undocumented: `ord-trigger-ord700` (last in the bind).
- `c09`, `c11` (inferred) kept `needs-SME`, no card written. Auto-accept policy not exercised. `c09` evidence line corrected to `ORD100C.PGM.CLLE:12` (status unchanged).
- Findings beyond Phase A summaries (as-is, cited in cards): program starts in the add-line panel after customer selection; after `F6` a cancelled article prompt re-prompts until an article is chosen; `F3`/`F12` on `FMT02` reached via `F6` end the program (staged order lost silently), but return to the list from the first-pass add screen and the edit screen; no "F27" — 27 is `CHANGE(27)`; footer `TOTVAT` drifts on delete (`ODTOTVAT` not in `SFL01`) and footer totals are stale after an edit; `DETORD.ODYEAR` written `0` by `ORD100` (only `ORD901` backfills); no commitment control; zero-line orders confirmable; `SFLMSG` 35/36 never reset in code (persistence = INDARA runtime question); no customer/article/credit/stock guards (7 procedures, 4 files in total).
- Pointers only (not deepened): `ORD901.PGM.SQLRPGLE:42-45` (deferred `ord-batch-ord900`), `ORD500` callee signature, `ORD200`/`ORD201` call sites, `ORD700A`/`ORD701` trigger definitions.
- Tooling: `mark_documented.py --slice ord-entry-ord100` (12 bumps, 12 cards), `gen_coverage.py` 0 problems. No tool changes.
- Pushed once at the end with `AGENT_JOB.md` already `DONE`.

## Run 4 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN` (job header: "run 4 prefer ord-trigger-ord700", re-queued after the CUS convert station finished at `efb5e2a`).
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD. `ROOM_OK` not required for this station and not claimed. `modern/` (CUS convert) and the CUS PACK were not touched.
- VM had a scratch branch checked out at `fa5b77f`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before any write.
- Pick: `ord-trigger-ord700` (only accepted undocumented slice left; matches job preference). Bind queue is now empty.
- `c01`, `c08`, `c11` (inferred) kept `needs-SME`, no card written. Auto-accept policy not exercised. Their MANIFEST summaries were sharpened with the observed facts from the cards (e.g. "order close never reaches ORD700") without changing status or confidence.
- Findings beyond Phase A summaries (as-is, cited in cards): insert path adds full `ODQTY` and ignores `ODQTYLIV` (every other path uses outstanding); only the delete event logs, message carries `ODQTY` not the subtracted quantity, `callp(e)` with `%error` unread; in-tree update firers are `ORD101` edit, `ORD200`/`ORD201` opt 8 deliver (`-ODQTY` per undelivered line) and `ORD901` `ODYEAR` backfill (nets 0); no in-tree writer changes `ODARID`; order close (opt 7) touches `ORDER` only; `UpdArt` has no error handling, ignores `ARDEL`, does not stamp `ARMOD`, can go negative; `*inlr` only on the no-parm path; `ORD701` assigns (not `MAX`), fires before the lines are written; `ART801` `WHERE EXISTS` leaves rows without open orders untouched and is the only writer of `CUCREDIT`; `AddLogEntry` binding not in source (no `bnddir`, `LOG` absent from `SAMPLE.BNDDIR`, no `ORD700.ILEPGM`).
- Evidence corrections: `ORD701` body `ORD701.SQLTRG:5-16` (was `:4-14`); menu opt 82 `SAMMNU.MENU:151-154` (was `:152-155`); `ART801` `CULASTORD` statement `:34-37` (was `:33-36`).
- Pointers only (not deepened): `ORD100`/`ORD101`/`ORD200`/`ORD201`/`ORD901` call sites; `LOG300` (what the log line contains); `PRO202`/`PRO203`/`CUS200`/`CUS250D`/`CUS300` as consumers of the maintained fields.
- Tooling: `mark_documented.py --slice ord-trigger-ord700` (8 bumps, 8 cards, 0 surface bumps — surfaces were already `accepted` from run 1), `gen_coverage.py` 0 problems. No tool changes.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).

## Run 5 notes (2026-09-08)

- `overnight/stop.txt` absent at start; `overnight/AGENT_JOB.md` line 1 `RUN` (job header: residual wave, "Prefer order: vat-module, then dat-utils, then cou-maintain FCOUNTRY features"; bind tip `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` @ `d24702f`).
- Station: Document (Phase B). No Architecture-bind, no Convert, no Test gen, no RECORD. `ROOM_OK` not required for this station and not claimed. `atu-merlin-ts-cus-v1`, `modern/`, `verification/` untouched.
- VM had a scratch branch checked out at `02c9468`; switched to `cursor/atu-merlin-estate-discovery` (same SHA) before any write.
- Pick: `vat-module` (job preference; first of three accepted undocumenteds). Remaining accepted undocumented: `dat-utils` (8), `cou-maintain` (FCOUNTRY `c07`–`c12`; `c01`–`c06`, `c13` deferred — do not deepen).
- All 10 candidates were `observed-in-code` and accepted; no `inferred` rows, so nothing stays needs-SME for lack of a card. Auto-accept policy not exercised. Six needs-SME *target* questions carried in `MANIFEST.yaml` (`c02` unknown code → error or zero; `c04` soft-deleted code still applied; `c06` intra-day rate changes; `c07` how VATDEF is maintained; `c03` dead VAT fields on ART200 FMT02; `c05`/`c09` activation group and signature practice).
- Findings beyond Phase A summaries (as-is, cited in cards): `eval` into `11P 4` truncates before `%dech` half-adjusts (equivalent to rounding the exact quotient); misses clear the buffer so non-blank misses re-read every call while a blank code never reads at all; `ExistVATRate` is the only reader of `VATDEL` and has no caller, so soft-deleted rates still apply; `VAT300` is the only member that opens `VATDEF`; `ART200` writes `ARVATCD` as typed (validates description and family only; F4 prompts family only) and never fills the `VATRATE`/`VATDESC`/`WITHVAT` output fields on its FMT02; `GetVATRate` is called immediately after `ClcVAT` for the same code (cache hit); `FAVATCD` never applied; `DETORD` stores neither code nor rate; `'V1'` literal signature with no `*PRV` (contrast `FPROVIDER.BND`); copybook publishes five prototypes for four exports.
- Phase A corrections: `c08` — `ART250` passes `ARVATCD` directly (one hop), only `ORD100`/`ORD101` go through `GetArtVatCode` (twice per line prepare); `c10` — the module PI for `ClcVAT` also omits the `A` (`VAT300.RPGLE:40`), so the drift is between `ClcVAT` and the other three procedures, not copybook vs module.
- Pointers only (not deepened): `ART250` "with VAT" label shows the VAT amount (art-interactive); `GetArtVatCode` / `chainARTICLE1` pattern (art-modules); `ORDERCUS.VIEW` / `ART801` as consumers of `ODTOTVAT`; `LOG100` as the only install-style member.
- Bind mirror gap noted: `d24702f` did not mirror `accepted` into `APP_MANIFEST.yaml` / `INDEX.md` for `dat-utils` and `cou-maintain`; this run mirrored only its own slice (cap 1) and flagged the gap in the INDEX header and MORNING_BRIEF §4.
- Tooling: `mark_documented.py --slice vat-module` (10 bumps, 10 cards, 2 surface bumps), `gen_coverage.py` 0 problems. No tool changes.
- Pushed once at the end with `AGENT_JOB.md` already `DONE` (every push re-fires the automation; expect one no-op run).
