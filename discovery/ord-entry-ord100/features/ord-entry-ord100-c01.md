# ord-entry-ord100-c01 — Customer selection at entry

| | |
| --- | --- |
| Slice | `ord-entry-ord100` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD100` takes one optional parameter `cuid` (5P 0, `options(*nopass)`). In `*inzsr`, when no parameter is passed or it is `0`, the program calls `SltCustomer(0)`; a `0` result ends the program before any screen is shown. Otherwise the customer id becomes `ORCUID` for the whole order, and `GetCusName` fills the 30-character `CUSTNAME` header shown on every format. After a customer is known the program starts **directly in the add-line panel** (`panel = 2`, `create` forced on), not in the line list.

## Entrypoints

- Program entry `ord100 pi cuid options(*nopass) like(orcuid)` — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:22-28`
- `*inzsr` — `ORD100.PGM.RPGLE:318-331`
- Called with a parameter by `ORD100C` via `CRTORD CUID(&CUID)` (command→program binding is `c09`, needs-SME) — `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-5,12`; without a parameter by `ORD100C2` `CALL PGM(ORD100)` — `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:11`

## Inputs / outputs / observables

- In: `cuid` 5P 0 (optional). `ORD100C` declares `&CUID *DEC(5 0)`; `CRTORD` declares `CUID TYPE(*DEC) LEN(5) DFT(0)` — `ORD100C.PGM.CLLE:5`, `ATU_SRC/QCMDSRC/CRTORD.CMD:5-6`.
- Out: module fields `ORCUID` (record-format field of `ORDER`, later written in `c07`) and `CUSTNAME` (display-only, 30A) — `ATU_SRC/QDDSSRC/ORD100D.DSPF:56-57,125-126,137-138`.
- Observable: either the `SltCustomer` window (`CUS301D`) appears first, or the program goes straight to `FMT02` after prompting for the first article (`c03`).

## Behaviour as implemented

1. `panel = 2` — the initial panel is the **line entry** panel, not the subfile. — `ORD100.PGM.RPGLE:319`
2. `if %parms = 0 or cuid = 0` → `orcuid = SltCustomer(0)`. `SltCustomer` returns the selected `CUID`, or its argument (`0`) unchanged on F3/F12 (`cus-modules-c06`). — `ORD100.PGM.RPGLE:320-321`, `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:79`
3. `if orcuid = 0 → panel = 0` — the main `select` then runs `pnl00`, which sets `*inlr`; the program ends with no order screen shown. — `ORD100.PGM.RPGLE:322-324,333-335`
4. Else `orcuid = cuid` — the parameter is taken **as given**; there is no existence / soft-delete check (`ExistCus` / `IsCusDeleted` are not called). — `ORD100.PGM.RPGLE:325-327`
5. `CUSTNAME = GetCusName(orcuid)` — runs even when `orcuid = 0` (returns blanks, `cus-modules-c01`). — `ORD100.PGM.RPGLE:328`
6. `create = *on; count = 0` — indicator 06 is forced on so that the first pass of `S02prp` behaves as "F6 Add" and prompts `SltArticle` (`c03`). — `ORD100.PGM.RPGLE:329-330`

### Program shape (applies to every card in this slice)

The mainline (`select` on `panel`, `ORD100.PGM.RPGLE:72-79`) is not inside a loop. With no primary file, the RPG cycle re-runs the mainline once per cycle pass until `*inlr` is set in `pnl00` (`panel = 0`). `panel` (1 = subfile `CTL01`, 2 = `FMT02`, other = end) and the two step variables `step01` / `step02` (`prp → lod → dsp → key → chk → act`) form the state machine; `*inzsr` runs once before the first pass. — `ORD100.PGM.RPGLE:58-60,65-70,72-79,333-335`

## Validation rules found in code

None on the customer: any non-zero `cuid` is accepted, including ids that do not exist in `CUSTOMER` or are soft-deleted (`CUDEL = 'X'`). `CUSTNAME` would then be blank on screen and the order would still be created against that id (`c07`).

## Edge cases found in code

- **Unpassed parameter.** `%parms = 0 or cuid = 0` relies on left-to-right short-circuit evaluation of `or` so that `cuid` is never touched when it was not passed (ILE RPG compiler behaviour; not exercised here). — `ORD100.PGM.RPGLE:320`
- **Cancel at customer prompt.** `SltCustomer` F3/F12 → `0` → silent end; nothing is written, no message. The `QTEMP/DETORD` copy created by the CL wrapper stays in the job (`c02`, `c13`).
- **Deleted customer via prompt.** `SltCustomer` lists `CUDEL = 'X'` rows too (`cus-modules-c11`), so a soft-deleted customer can be chosen here.
- `GetCusName` returns 30 characters into a 30A field — no truncation. — `CUSTOMER.RPGLEINC:7-8`, `ORD100D.DSPF:57`
- Activation group: `dftactgrp(*no)` with no `ACTGRP` keyword (compile default; runtime, not confirmed). `FCUSTOMER` is `ACTGRP(*CALLER)`, so its last-key cache (`cus-modules-c04`) lives with this program's group. — `ORD100.PGM.RPGLE:7`

## Dependencies

- `FCUSTOMER` service program: `SltCustomer`, `GetCusName` — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:7-8,79`, `ATU_SRC/QSRVSRC/FCUSTOMER.BND:19`; bound through `SAMPLE` binding directory — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`, `ORD100.PGM.RPGLE:7,18`
- `ORCUID` definition `REFFLD(CUID)` 5P 0 — `ATU_SRC/QDDSSRC/ORDER.PF:8`, `ATU_SRC/QDDSSRC/SAMREF.PF:15-17`
- Callers: `c10`.

## Assumptions / unknowns

- Whether an order is ever created for a non-existent / soft-deleted customer in practice (no guard in code) — for the SME.
- `CRTORD` → `ORD100` binding lives outside source (`c09`, needs-SME).

## Evidence

`ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:7,18,22-28,58-60,72-79,318-335` · `ATU_SRC/QCLSRC/ORD100C.PGM.CLLE:4-5,12` · `ATU_SRC/QCLSRC/ORD100C2.PGM.CLLE:11` · `ATU_SRC/QCMDSRC/CRTORD.CMD:5-6` · `ATU_SRC/QDDSSRC/ORD100D.DSPF:56-57,125-126,137-138` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:7-8,79` · `ATU_SRC/QSRVSRC/FCUSTOMER.BND:19` · `ATU_SRC/QDDSSRC/ORDER.PF:8` · `ATU_SRC/QDDSSRC/SAMREF.PF:15-17`
