# CONTEXT_GATE — Pack B document-slices conveyor (atu-merlin), run 5

Run: `pack-b document-slices` via `overnight/AGENT_JOB.md` (line 1 `RUN`; re-queued after the residual bind tip `d24702f`; job header "Prefer order: vat-module, then dat-utils, then cou-maintain FCOUNTRY features")
Started: 2026-09-08T20:01Z (UTC; 21:01 Europe/London)
Agent: document-slices-conveyor (Cloud Agent, automation job runner)

Previous gates preserved in git: Pack A run 1 at `ab342e9:overnight/CONTEXT_GATE.md`; Pack B runs 1–4 at `0e32c19`, `5ac7f0d`, `efb5e2a`, `200a3e3` (`:overnight/CONTEXT_GATE.md`); Pack A residual at `73e5a0e:overnight/CONTEXT_GATE.md`.

## Repo identity

| Item | Value |
| --- | --- |
| Remote | `https://github.com/ashosborne/atuMerlin` |
| Work branch | `cursor/atu-merlin-estate-discovery` |
| HEAD at start | `02c94686b90a60495a1bb4b5e013877d508ab1dd` ("AGENT_JOB pack-b: requeue after bind tip (residual wave)") |
| Base / PR target | `master` |
| Existing PR | #1 `cursor/atu-merlin-estate-discovery` → `master` (open; this run updates it) |
| `overnight/stop.txt` | absent at start |
| `overnight/AGENT_JOB.md` line 1 | `RUN` |

## Station and gate decision

- Station: **Document (Discovery Phase B deepen)**. Not Architecture-bind, not Convert — `ROOM_OK` not required and not claimed.
- Human bind present: `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md` (`d24702f`) + `discovery/vat-module/BIND.md` (room bind 2026-09-08, recorded by Agent Smith). Pack B may proceed.
- The Architecture PACK `atu-merlin-ts-cus-v1`, `modern/` (CUS convert) and `verification/` are **not** touched or consumed. Job header: "Do not convert. Do not widen atu-merlin-ts-cus-v1."
- Cap: 1 slice this run.

## Context read (hard gate)

- `migration-factory/docs/FIELD-GUIDE.md` — App Discovery Phase B run shape, "Done enough", Do / don't
- `migration-factory/prompts/discovery-agent-v0.2.md` (behaviour-card shape, Phase B exit criteria)
- `migration-factory/skills/operator/deepen-phase-b/SKILL.md`
- `migration-factory/skills/operator/waive-characterization/SKILL.md` — deferred note only; **not** executed
- `migration-factory/schemas/discovery-manifest.schema.md`; `app-manifest` schema via `overnight/tools/gen_coverage.py` lint
- `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`, `overnight/AGENT_JOB.md` (job body = Pack B charter), `overnight/MORNING_BRIEF.md` (Pack A residual), `overnight/document-conveyor/JOURNAL.md` (runs 1–4), `overnight/CONTEXT_GATE.md` (Pack A residual)
- `discovery/vat-module/{MANIFEST.yaml,CANDIDATES.md,BIND.md,SME_BRIEF.md}`; `discovery/ord-trigger-ord700/features/ord-trigger-ord700-c02.md`, `MANIFEST.yaml`, `CHARACTERIZATION.md`, `SME_BRIEF.md` (card / note style from run 4)
- `overnight/tools/{mark_documented.py,gen_coverage.py}`

Factory pack present at `migration-factory/` — no BLOCKED. `inventory/atu-merlin/APP_MANIFEST.yaml` present.

## Slice pick

Priority rule 1 (accepted, not yet `documented`) yields three slices from the residual bind: `vat-module` (10 accepted), `dat-utils` (8 accepted), `cou-maintain` (6 accepted, `c07`–`c12`; `c01`–`c06`, `c13` deferred). Job preference order puts `vat-module` first.

**Chosen SLICE_ID: `vat-module`** — 10 accepted candidates (`c01`–`c10`), all `observed-in-code`, none `needs-SME` at bind. Auto-accept policy not needed (nothing `inferred` in this slice).

Not deepened this run: `dat-utils`, `cou-maintain` (next in queue); `art-interactive` / `art-modules` (`ART200`, `ART250`, `ART300` cited as the caller / VAT-code-entry surfaces only); `ord-entry-ord101` (caller call sites only); `fam-maintain` (`FAVATCD` cited as a pointer only); every deferred / unbound slice.

## Source read for the deepen (read-only, `ATU_SRC/**` untouched)

Seed members: `QRPGLESRC/VAT300.RPGLE` (85 lines), `QPROTOSRC/VAT.RPGLEINC`, `QSRVSRC/FVAT.BND`, `QILESRVSRC/FVAT.ILESRVPGM`.
Deps read as citations only: `QDDSSRC/VATDEF.PF`, `QDDSSRC/SAMREF.PF` (`VATCODE`, `VATRATE`, `DLCODE`, `TOTPRICE`, `UNITPRICE`), `QDDSSRC/DETORD.PF`, `QDDSSRC/ARTICLE.PF`, `QDDSSRC/FAMILLY.PF:9-10`, `QBNDSRC/SAMPLE.BNDDIR`.
Caller call sites only (what is passed in, what is done with the result): `QRPGLESRC/ORD100.PGM.RPGLE:7,20,266-269,293-295`, `QRPGLESRC/ORD101.PGM.RPGLE:5,17,223-226,258-260`, `QRPGLESRC/ART250.PGM.SQLRPGLE:4,15,120,151-157`, `QRPGLESRC/ART300.RPGLE:83-91` (`GetArtVatCode`), `QPROTOSRC/ARTICLE.RPGLEINC:39`, `QSRVSRC/FARTICLE.BND:12`.
Display surfaces that show or capture the VAT fields (cited, not deepened): `QDDSSRC/ORD100D.DSPF:117-121`, `QDDSSRC/ORD101D.DSPF:122-126`, `QDDSSRC/ART250D.DSPF:50,60,63`, `QDDSSRC/ART200D.DSPF:73-75,105-115`; `QRPGLESRC/ART200.PGM.SQLRPGLE:5,14,244-306` (VAT code entry with no validation; `VATRATE`/`VATDESC`/`WITHVAT` never populated).
Absence evidence: `QPNLSRC/SAMMNU.MENU:82-163` (no VAT option); structural grep of `ATU_SRC/**` for every reference to `VATDEF`, `FVAT`, `VAT.RPGLEINC`, `ClcVAT`, `GetVATRate`, `GetVATDesc`, `ExistVATRate`, `CloseVATDEF`, `VATRATE`, `VATCODE`, `VATDESC`, `VATDEL`, `ARVATCD`, `GetArtVatCode`.

## Charter in force (Pack B)

`PHASE_A: false`, `PHASE_B: true`, `CAP_SLICES_PER_RUN: 1`, `ALLOW_CONVERSION: false`, `ALLOW_TEST_GEN: false`, `ALLOW_TEST_EXEC: false`, `CHARACTERIZATION: deferred-waived`, `AUTO_ACCEPT_POLICY: observed-in-code-within-seed-only` (not exercised),
`WRITE_SCOPE: discovery/**, inventory/**, overnight/**, docs/estate/**`, `NO_COMMITS_TO_DEFAULT_BRANCH: true`, `COMMIT_AS: document-slices-conveyor`.
