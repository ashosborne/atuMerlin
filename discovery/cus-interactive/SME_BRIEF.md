# SME_BRIEF — cus-interactive (Phase B cards ready — awaiting human SME sign-off)

Status: bound 2026-09-08 (room bind, `BIND.md`); 12/12 accepted candidates documented by the Pack B conveyor on 2026-09-08. **Not signed.** SME sign-off on this brief is what unlocks Test generation later (Field Guide, App Discovery "Done enough"). Nothing here is converted or tested.

## What was documented

Two 5250 entry programs on the customer master: `CUS200` (work-with list, create, update, jump to orders) and `CUS250` (inquiry by id with prompt). Cards live in `features/cus-interactive-c01.md` … `c12.md`; the summary level is in `MANIFEST.yaml` (`phase: B`).

Corrections to the Phase A summaries found while reading source (as-is, cited in the cards):

- `c08` — `CUMODID` is stamped **only on create**. On update the `CHAIN` reloads the stored `CUMODID` and `S02act` refreshes `CUMOD` only (`CUS200.PGM.SQLRPGLE:258,323,333-337`). Phase A said "on every save"; that was wrong.
- `c04` — the update-mode duplicate rule (`dup > 1`) counts DB rows matching the **new** name+phone; the customer's own row still holds old values, so changing to collide with exactly one other customer passes (`CUS200.PGM.SQLRPGLE:309-312`).
- `c02`/`c08` — Phase A open question 2 answered: update preserves `CUCREA` (chain reloads it); create uses the **program start** date from `*INZSR`, not the save date.
- `c07` — `CUS250` shows `CULASTORD` as the raw 8-digit number (no `MAPVAL`, no edit code), unlike `CUS200`'s blank/date presentation.

Other as-is facts worth a glance before sign-off:

- F12 on the `CUS200` list and on `CUS250` `FMT01` ends the program (same as F3); F3 on either `FMT02` returns to the previous panel rather than exiting (`c01`, `c09`, `c10`).
- `CUSSEQ` is consumed on F6, before any save; cancelled creates leave gaps (`c02`).
- Record lock on `CUSTOME1` is held while the user sits on the edit screen; not released explicitly on cancel (`c03`).
- `LASTORD` on `FMT02` is input-capable but never written back (`c02`, `c07`).
- Soft-deleted customers (`CUDEL = 'X'`) are listed, editable and viewable here, while `FCUSTOMER.ExistCus` treats them as non-existent (`c11`).
- Both programs are RPG-cycle driven state machines (one step per cycle, `*INLR` only at exit).

## Sign-off checklist (human SME)

- [ ] Every accepted feature (`c01`–`c12`) has a behaviour card with at least one `ATU_SRC` citation — conveyor claims yes; SME to spot-check 2–3 cards against source.
- [ ] `c04` update-mode duplicate gap: preserve as-is, or record as a defect for the target? (decision, not a code change here)
- [ ] `c08` `CUMODID`-on-update behaviour: intended or latent defect?
- [ ] `c11` customer soft-delete: exists outside `ATU_SRC`, or never? If never, confirm "deleted customers remain listable" is the as-is contract.
- [ ] `c02` `CUSSEQ` gaps acceptable?
- [ ] `c07` sentinel-date convention: CUS-only card is enough for now, or bind ORD slices before a shared card?
- [ ] `c06` seam edge to `ORD200` accepted as thin card (no `ORD200` behaviour documented here).
- [ ] Unknown surfaces `CUSTADRE.PF` / `ADDRESS.PF` stay `unknown` (no consumer found).
- [ ] `CHARACTERIZATION: deferred-waived` note read and accepted as a stance (no waiver artefact, no Conversion unlock).
- [ ] Signed by: __________ (Slice SME) on __________ — unlocks Test generation station for `cus-interactive`.

## Open questions carried in MANIFEST `open_questions`

1. `c04` update duplicate gap (needs-SME).
2. `c04` stored `CUPHONE` hygiene for rows written outside `CUS200` (needs-SME/data).
3. `c08` `CUMODID` on update (needs-SME).
4. `c11` soft-delete location (needs-SME).
5. `c02` gap-free ids requirement?
6. `c07` shared sentinel card ownership.

## Ambiguous boundaries (unchanged from Phase A, now settled by bind)

| Boundary | Bind outcome |
| --- | --- |
| Option 5 → `ORD200` | Seam edge, thin card `c06`; `ORD200` behaviour stays in `ord-maintain-ord200` (unbound). |
| `CUSTADRE.PF` / `ADDRESS.PF` | Remain `unknown_surfaces`; not behaviours. |
| Sentinel date 1940-01-01 | `c07` documents CUS presentation only. |
| `CUS200` + `CUS250` in one slice | Bound together; 12 cards. |

## Characterization

`CHARACTERIZATION: deferred-waived` — see `CHARACTERIZATION.md`. Documentation from source only; no IBM i runtime; no RECORD/REPLAY; no goldens.

Did not: convert, generate tests, run tests, bind architecture, or edit `ATU_SRC/**`.
