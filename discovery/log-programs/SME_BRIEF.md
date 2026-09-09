# SME_BRIEF — log-programs (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-09 (night residual wave — Ash authorized, Field recorded; `BIND.md`; `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md`); 10/10 accepted candidates documented by the Pack B conveyor on 2026-09-09 (run 14). The four `inferred` rows (`c04` capacity, `c06` install step, `c09` reader, `c10` concurrency) were accepted by the bind and are carded with their `inferred` confidence kept — the source half of each is exact, the runtime half is outside the tree (same practice as `par-maintain-c08`, run 13). **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested; residual-wave slices are document-only per the bind record.

## What was documented

A 73-line application log: `LOG100` (27 lines) creates a 5000-byte `*USRSPC` `SAMLOG` beside `PARAMETER`; `LOG300.AddLogEntry` (46 lines, the one export of the `LOG` service program) appends `User: … * Date: … * Msg: … ***` lines at a write cursor stored in the space's first four bytes; `ORD700` on order-line delete is the only writer; menu option 84 runs a reader that is not in the tree. Cards live in `features/log-programs-c01.md` … `c10.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). The deepen sharpened three Phase A statements, corrected the capacity estimate, and found that the one operational failure mode is *permanent per job*, not transient.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c04` — **the log fills after ≈ 35 deletes, not 40–60, and then never recovers on its own.** A line is `63 + len(Msg)` bytes (`ORD700` ≈ 125), but every call writes a **600-byte fixed field**, so the first failure comes when `pos + 600 > size` — from `pos ≈ 4400` if the allocation is exactly 5000. The failing assignment (`LOG300:31`) raises **before** `pos` is advanced (`:32`), so `pos` stays put and every later call in every job fails at the same offset. Silent throughout (`ORD700` `callp(e)`, `%error` unread). If the box allocates in pages (8192), the point moves to ≈ 60 lines — runtime fact. Only reset: re-run `LOG100`.
- `c06` — **one failed initialisation kills logging for the rest of the job.** `init` sets `inz = *on` on line 42 and calls `QUSPTRUS` on line 43; if `SAMLOG` is missing (never created, or in a library not on the writer's `*LIBL`) the escape is swallowed by `ORD700`, `p1` stays null, and `init` is never retried — every later call fails on the null pointer, also swallowed. `LOG100` has no caller, menu entry, CL or `.ILEPGM`: an install step that a rebuild from `ATU_SRC` does not perform.
- `c05` — **"errors swallowed" is only half right.** The `QUSCRTUS` error goes into `errcod` and is never read; but `QUSPTRUS` is prototyped *without* an error code, so a create failure with no old `SAMLOG` surfaces one line later as an unmonitored escape (inquiry). The fully silent case is a create failure while an **old** `SAMLOG` exists: `QUSPTRUS` finds the old object and lines 24–25 reset its header — the old log is logically emptied although "create" failed. Phase A sharpened.
- `c03` — **`User` is stamped when the service program is activated, not per call** (`inz(*USER)` static, `ACTGRP(*CALLER)` → the caller's `QILE`, inference); it is written blank-padded to 10, not trimmed. The build buffer is `500 varying`: a trimmed message over 437 characters is cut at 500 and **loses the `' ***'` terminator** (not reachable from `ORD700`, latent in the 500-byte interface). `%trim` strips leading blanks too. No `monitor` anywhere; `QUSPTRUS` failures escape to the caller.
- `c08` — **`EXPORT(*ALL)` exports exactly one procedure.** Only `AddLogEntry` carries `export` on its P-spec; `init` does not and no D-spec is exported — so, unlike `FPARAMETER` (`par-maintain-c10`), nothing internal leaks. The consumer side stays a blind spot: `LOG` is not in `SAMPLE.BNDDIR`, `ORD700` has no `bnddir` and no `.ILEPGM` — the only caller cannot be bound from the tree.
- `c01` / `c02` — `replace '*YES'` means **re-running `LOG100` resets the log**, and a job that already resolved `p1` keeps writing to the replaced copy (inference). Header = 4-byte big-endian cursor + `'***'`, entries from offset 7, `' ***'` the only delimiter, trailing blanks after the last line from the 600-byte pad, then `X'00'`. The layout is defined twice (`LOG100` DS, `LOG300` standalone fields) with no shared copybook. `PARAMETER`'s library from the INFDS is the placement rule (`par-maintain-c13`), `*LIBL` the lookup rule — two rules.
- `c07` — as Phase A: one caller, one event; the message carries the **ordered** quantity while the trigger subtracts the *outstanding* one; `ODARID` untrimmed. Pointer to `ord-trigger-ord700-c03`; not re-derived.
- `c09` — as Phase A: `adspusrspc samlog` unqualified on `*LIBL`, `help=nohelp`, no source, no other reader; a stopped or never-started log is indistinguishable from "nothing happened".
- `c10` — as Phase A, spelled out: the interleavings all lose the first line and leave a blank run because the `+=` increments are relative; the cursor itself can be corrupted only in the narrower load/add/store window; the race disappears once the space is full.

Phase A statements corrected: `c04` "~40–60 lines" → ≈ 35 at 5000 bytes (600-byte write), and "stops silently" → *permanently* (cursor not advanced). Sharpened: `c05` (indirect surfacing via `QUSPTRUS`; silent header reset of an old log), `c06` (never retried within the activation group), `c03` (activation-time `User`, 437-character truncation, padded write), `c08` (one export). No Phase A rule about what a valid operation does was wrong.

**Existing target counterpart (not widened here):** the ORD vertical, converted and verified under `WAIVED_PATHFINDER`, writes the same `Msg` text plus a 10-character actor and a timestamp to a Postgres `samlog` table on every line delete (`modern/db/schema.sql:132-140,170-199`; `verification/ord-vertical/2026-09-09-r1/PARITY.yaml` `c03` `as_is: true`). That already covers `c03`'s content and `c07`; `c01`, `c02`, `c04`, `c05`, `c06`, `c08`, `c09`, `c10` are properties of the user-space implementation with no counterpart to reproduce.

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c10`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] **Room — is the user-space log behaviour to preserve at all?** Recommendation unchanged from Phase A: non-functional side effect; the target's `samlog` table (ORD pack) is the log. If yes, only `c03`'s *content* matters; if the legacy line *string* (`User:`/`Date:`/`Msg:` prefixes, `' ***'`) is a contract for some reader, say so — nothing in the tree reads it.
- [ ] `c04` (`inferred`) — box: actual allocated size of `SAMLOG` (`DSPOBJD *FULL` / `QUSRUSAT`); has it ever filled; what did operators see? Record as a known legacy defect (not to fix).
- [ ] `c06` (`inferred`) — ops: who runs `LOG100`, when, in which library list; is it in an ARCAD deployment script outside the tree? Confirm it belongs in the install runbook, not in application behaviour.
- [ ] `c08` build owner / ARCAD — how is `LOG` bound into `ORD700` (no `bnddir`, not in `SAMPLE.BNDDIR`, no `.ILEPGM`); which library's `LOG`; add to `SAMPLE.BNDDIR` for a from-source rebuild? (Same line as `ord-trigger-ord700-c03`, `srvpgm-supporting`.)
- [ ] `c09` (`inferred`) — ops: which product supplies `ADSPUSRSPC`; does anyone use menu option 84; is `SAMLOG` content ever needed after the fact (audit / support)? If never: the reader has nothing to carry.
- [ ] `c10` (`inferred`) — acceptable loss for a diagnostic log? (Target insert is transactional — no counterpart.)
- [ ] `c03` — `User` stamped at activation vs per call; the target records the actor per event (`ord700_user()`) — confirm that is the intended contract, not the legacy one.
- [ ] `c05` — runtime-confirm the two paths (inquiry on `QUSPTRUS` after a failed create; silent header reset when an old `SAMLOG` exists). As-is.
- [ ] `c01` / `c02` — is a migration of existing `SAMLOG` content wanted? (`c02` is the decoding rule; recommendation: no.)
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `log-programs`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. Room: preserve the user-space log at all? (whole slice)
2. `c04` allocated size / observed failure on the box.
3. `c06` who runs `LOG100`; install runbook.
4. `c08` binding of `LOG` into `ORD700` (build owner).
5. `c09` `ADSPUSRSPC` provider; is option 84 used.
6. `c10` acceptable loss.
7. `c03` activation-time `User`; line string vs `Msg` content as the contract.
8. `c05` runtime confirmation of the two failure paths.
9. `c01` / `c02` migration of existing content (recommendation: no).

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Is the log behaviour to preserve? | Bind accepted all 10 for **documentation**; the preserve/replace decision is left to the room (checklist item 2). Cards written so either answer is supported; the ORD vertical's `samlog` table is cited as the existing counterpart, not widened. |
| `LOG100` | Carded (`c01`, `c05`, `c06`) as an install step with its failure modes spelled out; reject / runbook remains the recommendation. |
| Binding of `LOG` into `ORD700` (`c08`) | Carded as a build note; the "one export" fact is the addition. Build-owner question shared with `ord-trigger-ord700-c03` and `srvpgm-supporting`. |
| `ADSPUSRSPC` (`c09`) | Carded as a blind spot with the decoding rule a reader would need; the command stays outside the allowlist. |
| `ORD700` (`c07`) | Pointer card only — trigger behaviour stays with `ord-trigger-ord700-c03` (documented). |
| `PARAMETER` library anchor | `par-maintain-c13` cross-referenced, not re-derived. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, fix any found defect (600-byte write and hard capacity, cursor not advanced on failure, `inz` set before the failing resolution, swallowed `errcod`, header reset of an old log, unlocked read-modify-write, 437-character truncation), edit any card outside `discovery/log-programs/`, widen `atu-merlin-ts-ord-v1`, or edit `ATU_SRC/**`.
