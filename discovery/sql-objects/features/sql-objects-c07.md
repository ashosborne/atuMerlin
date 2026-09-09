# sql-objects-c07 — `CUSSEQ` sequence: `START WITH 1551 INCREMENT BY 1 NO MAXVALUE NO CYCLE`; one consumer (`CUS200` F6, `NEXT VALUE FOR CusSeq`); the sequence is unbounded but `CUID` is `5P 0` — surface card, behaviour under `cus-interactive-c02`

| | |
| --- | --- |
| Slice | `sql-objects` |
| Status | `documented` (as-is object-contract card, Phase B — surface for a behaviour already carded; points at `cus-interactive-c02`, does not re-derive it) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md` — "Never widen CUS") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`CUSSEQ` is a nine-line `CREATE SEQUENCE`: `START WITH 1551`, `INCREMENT BY 1`, `NO MAXVALUE`, `NO CYCLE`; data type, minimum value, cache and order are left to the platform defaults (`AS INTEGER`, `MINVALUE 1`, `CACHE 20`, `NO ORDER` — inference). The member text is "Next customer Number". It is referenced once in the estate — `CUS200` `s01key` `when create` (F6): `exec sql set :Cuid = NEXT VALUE FOR CusSeq` — before the create screen is shown; the draw-before-save and gap semantics are documented at `cus-interactive-c02` (steps 1 and 5, edge "Sequence value is consumed on F6"). What this card adds is the object contract and one arithmetic fact: `CUID` is `5P 0` (`SAMREF`), so the column tops out at 99 999 while the sequence does not — the 98 450th draw (value 100 000) overflows the host variable, and `CUS200` does not test `sqlcod` after the `SET`.

## Entrypoints

- `CREATE SEQUENCE CUSSEQ START WITH 1551 INCREMENT BY 1 NO MAXVALUE NO CYCLE ;` — `ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:5-9` (member text: `/* %TEXT Next customer Number */` — `:2`)
- Consumer: `exec sql set :Cuid = NEXT VALUE FOR CusSeq ;` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:185` (behaviour: `cus-interactive-c02`)
- No other reference (structural grep `CUSSEQ` / `CusSeq`: the DDL and `CUS200:185`; no `PREVIOUS VALUE`, no `ALTER SEQUENCE`).

## Inputs / outputs / observables

- Out: one integer per `NEXT VALUE` — 1551, 1552, … with no upper bound declared. — `CUSSEQ.SQLSEQ:6-9`
- Receiver: `:Cuid`, the `CUSTOMER.CUID` field of the `FCUST` record (`5P 0` via `REFFLD(CUID)` → `SAMREF`), shown on `FMT02` as output-only. — `ATU_SRC/QDDSSRC/CUSTOMER.PF:6`; `ATU_SRC/QDDSSRC/SAMREF.PF:15-17`; `cus-interactive-c02` §Inputs
- Observable: new customer ids on `CUS200` / `CUS250`; gaps after cancelled creates (`cus-interactive-c02`).

## Behaviour as implemented

1. **Definition.** Four clauses only. `NO CYCLE` means exhaustion raises an error rather than wrapping; `NO MAXVALUE` means "exhaustion" is the data type's maximum (2 147 483 647 for the default `INTEGER` — inference). — `CUSSEQ.SQLSEQ:5-9`
2. **Start value.** 1551 — a data fact: the customer file held ids up to 1550 when the sequence was introduced (inference from the number; nothing in the tree says so).
3. **Resolution.** `CusSeq` is unqualified in `CUS200`; the program uses system naming (no `SET OPTION NAMING`), so the sequence is found through `*LIBL` at run time (platform). — `CUS200.PGM.SQLRPGLE:185`
4. **Draw.** `SET :Cuid = NEXT VALUE FOR CusSeq` on F6, before `FMT02` is displayed; no `sqlcod` check follows the statement (`when pagedown` is the next line). — `CUS200.PGM.SQLRPGLE:179-186`
5. **Non-transactional.** `NEXT VALUE` is never rolled back (platform), and `CUS200` runs without commitment control anyway; a cancelled create leaves a gap (`cus-interactive-c02` edge case). — `CUSSEQ.SQLSEQ:9`; `CUS200.PGM.SQLRPGLE:185`

## Validation rules found in code

- None on the sequence. `CUSTOME1.LF` is `UNIQUE` on `CUID`, so a duplicate id (only possible if the sequence were reset below the highest existing id — `ALTER SEQUENCE … RESTART`, not in the tree) fails at `write fcust`, which `cus-interactive-c02` covers. — `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6`

## Edge cases found in code

- **Column narrower than the sequence.** `CUID` is `5P 0` → maximum 99 999. The sequence reaches 100 000 on its 98 450th value. At that point the `SET` into `:Cuid` fails with a numeric-overflow error (inference, SQLCODE `-304` class), `:Cuid` keeps its previous content, and — with no `sqlcod` test — `CUS200` proceeds to `FMT02` in `CRT` mode showing the stale id; the eventual `write fcust` then hits the `UNIQUE` key. Theoretical at the estate's size, real for the target: a `bigint`/`integer` sequence feeding a 5-digit id column reproduces the same cliff. — `SAMREF.PF:15`; `CUS200.PGM.SQLRPGLE:185`
- **Cache gaps.** With the default `CACHE 20` (inference) up to 19 values are lost when the last job holding the cache ends abnormally or the system is restarted; ids are therefore not dense even without cancelled creates. — `CUSSEQ.SQLSEQ` (clause absent)
- **Only one path creates customers.** No other program, CL or SQL inserts into `CUSTOMER` (`cus-interactive-c02` §Assumptions), so every id ≥ 1551 came from this sequence; ids ≤ 1550 predate it.

## Dependencies

- `CUS200` (`cus-interactive-c02` — behaviour owner; not widened), `CUSTOMER.PF` / `SAMREF.PF` (`CUID 5P 0`), `CUSTOME1.LF` (`UNIQUE`).
- Existing target counterpart (cited read-only, not widened): `modern/db/schema.sql:4-6` `CREATE SEQUENCE cusseq` as-is; `modern/src/features/customer/customer.repository.ts:66` `nextval('cusseq')` — drawn at save rather than on F6, which the CUS conversion documents as its own decision (`customer.service.ts:120`). Nothing here changes that.

## Assumptions / unknowns

- Platform: `CREATE SEQUENCE` defaults (`AS INTEGER`, `MINVALUE 1`, `CACHE 20`, `NO ORDER`), `*LIBL` resolution, non-rollback of `NEXT VALUE`, overflow SQLCODE. Inference, runtime-confirmable (`QSYS2.SYSSEQUENCES`).
- **needs-SME (room, CUS pack):** does the target keep `CUID` at five digits? If so, the sequence's `NO MAXVALUE` should become `MAXVALUE 99999` (or the column widen) — a decision, not a defect fix; recorded here because the source contract is silent about it.

## Evidence

`ATU_SRC/QSQLSRC/CUSSEQ.SQLSEQ:2,5-9` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:179-186` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:6` · `ATU_SRC/QDDSSRC/SAMREF.PF:15-17` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `discovery/cus-interactive/features/cus-interactive-c02.md` (behaviour; steps 1, 5; edge "consumed on F6") · structural grep of `ATU_SRC/**` for `CUSSEQ` (2 hits), `NEXT VALUE` (1), `PREVIOUS VALUE` / `ALTER SEQUENCE` (none)
