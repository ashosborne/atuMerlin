# SME_BRIEF — cus-modules (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`; `srvpgm-fcustomer` folded in); 10/10 accepted candidates documented by the Pack B conveyor on 2026-09-08 (run 2). `c10` stays `needs-SME` (inferred) with no card. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested.

## What was documented

`FCUSTOMER` = two `nomain` modules bound `ACTGRP(*CALLER)`: `CUS300` (11 getters + `ExistCus` + `IsCusDeleted`, all over one lazily opened, last-key-cached `CUSTOME1` chain) and `CUS301` (`SltCustomer` selection window over dynamic SQL). Cards live in `features/cus-modules-c01.md` … `c09.md`, `c11.md`; the summary level is in `MANIFEST.yaml` (`phase: B`). Export/binding facts (`FCUSTOMER.BND`, `SIGNATURE('V1')`, 15 symbols) are documented inside `c01` and `c05` rather than as a separate feature.

Facts found while reading source that sharpen or correct the Phase A summaries (as-is, cited in the cards):

- `c02`/`c03` — **no program under `ATU_SRC` calls `ExistCus` or `IsCusDeleted`**; of the getters only `GetCusName` has callers (`ORD100`, `ORD101`). The soft-delete rule they encode is not enforced by any observed path.
- `c04` — misses are **not** cached (a failed chain leaves buffer `CUID = 0`), hits are; a hit stays cached until a *different* id is requested, so updates made by `CUS200` in the same activation group are invisible to repeated calls for the same id. `ExistCus(0)` as the very first call never chains; `%found` then has no prior operation (IBM does not document that value).
- `c05` — closing the file would not reset the cache even if it were exported; and the include advertises `CloseCUSTOME1`, so a caller would compile and fail at bind.
- `c06` — search criteria **persist across `SltCustomer` calls** in the same activation group (display-file fields, file never closed); SQL errors are silent (empty list with "Bottom"); F8 is enabled but unhandled and behaves as Enter; `'F8=By code'` legend can never display.
- `c07` — every changed row is re-marked `SFLNXTCHG`, which is the mechanism that lets `S01act` find the selection; `OPT01 <> 1` is tested before the duplicate-selection test.
- `c08` — a criteria change takes precedence over an option `1` typed on the old list; Page Down with changed criteria pages the *old* result.
- Evidence corrections — the `SLTCUSTOMER` export is at `FCUSTOMER.BND:19` (Phase A cited `:5-17` for the export list); the `c10` prototype comment is at `CUSTOMER.RPGLEINC:64-67` (Phase A cited `:37-40`).

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c09`, `c11`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c04` missing-id contract: blanks/zeros silently — preserve as the target contract, or surface not-found? (decision, not a code change here)
- [ ] `c04` stale-read cache within an activation group: known/acceptable, or a latent defect to preserve as-is?
- [ ] `c02`/`c03` dead API: confirm whether anything outside `ATU_SRC` calls `ExistCus` / `IsCusDeleted` / the non-name getters.
- [ ] `c05` `CloseCUSTOME1` not exported: intentional?
- [ ] `c09` dynamic SQL concatenation: preserve quirk vs fix — route to architecture bind (ROOM_OK), not decided here.
- [ ] `c11` "blank criteria lists all customers" (including `CUDEL = 'X'` rows) confirmed as the as-is contract.
- [ ] `c06` criteria persistence across calls: confirmed as-is (not a bug to hide in the target)?
- [ ] `c10` dormant `GetCusLastOrdDate` scaffold: reject at next bind (recommendation unchanged).
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `cus-modules`.

## Open questions carried in MANIFEST `open_questions` / `needs_sme`

1. `c01` callers of the other getters outside `ATU_SRC`.
2. `c02` `ExistCus` has no caller in `ATU_SRC` — dead API or enforced elsewhere?
3. `c04` missing-id blanks/zeros; stale-read cache.
4. `c05` `CloseCUSTOME1` not exported — intentional?
5. `c06` non-zero default returned on cancel — only `CUS250` relies on it in `ATU_SRC`.
6. `c09` preserve or fix dynamic-SQL concatenation (architecture decision).
7. `c11` keep list-all-when-blank?
8. `c10` reject at later bind.

## Ambiguous boundaries (settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| `cus-modules` vs `srvpgm-fcustomer` | Folded: one slice; `FCUSTOMER.BND` / `.ILESRVPGM` are deps, export facts in `c01`/`c05`. |
| `CUS301D.DSPF` ownership | This slice (only `CUS301` uses it). |
| `CloseCUSTOME1` not exported (`c05`) | Own thin card (accepted). |
| Injection surface (`c09`) | Own card (accepted), risk assessment left to SME/architecture. |
| Dormant scaffold (`c10`) | needs-SME, no card. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, or edit `ATU_SRC/**`.
