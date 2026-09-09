# ord-entry-ord101-c12 — Closed-order guard lives in the callers (absence here)

| | |
| --- | --- |
| Slice | `ord-entry-ord101` |
| Status | `documented` (as-is behaviour card, Phase B — observed absence) |
| Confidence | `observed-in-code` |
| Bind | accept — room ORD bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`ORD101` reads the order header (`c02`) but never tests `ORDATCLO` (close date) or `ORDATDEL` (delivery date): a closed or delivered order's lines can be edited and deleted freely once `ORD101` is running. The only closed-order protection is in the callers' option checks — `ORD201` refuses `2` / `4` when `datclo > d'1940-01-01'`; `ORD200` intends the same but its condition is mis-parenthesised and refuses every `2` (`c09`). A direct `CALL ORD101` carries no guard at all. The delivered state is guarded per line, not per order (`c05`).

## Entrypoints

- `ORD101` — no reference to `ORDATCLO` / `ORDATDEL` in the member (absence; buffer fields loaded by `chain id order1`) — `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:282`, `ATU_SRC/QDDSSRC/ORDER.PF:11-14`
- `ORD201` `s01chk` guard — `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:67,191-199`
- `ORD200` `s01chk` guard — `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,187-195`

## Inputs / outputs / observables

- In (callers): `datclo` fetched by SQL through the `dat-utils` UDF into a date, sentinel `d'1940-01-01'` = "never closed". — `ORD201.PGM.SQLRPGLE:67,119`
- Out (callers): `SFLMSG` 36 "Closed order can not be edited or deleted", row `DSPATR(RI)`, no call. — `ATU_SRC/QDDSSRC/ORD201D.DSPF:45-46`, `ORD201.PGM.SQLRPGLE:192-198`
- `ORD101`: no output tied to the close state; `FMT02` / `CTL01` do not show `ORDATCLO` / `ORDATDEL`. — `ATU_SRC/QDDSSRC/ORD101D.DSPF:56-57,76-78,130-135`

## Behaviour as implemented

1. `ORD201.s01chk`: `if (opt01 = 2 or opt01 = 4) and datclo > datBlank` → error, `step01 = dsp`. Option `7` (close) is likewise refused on an already-closed order and `8` (deliver) on a delivered one. — `ORD201.PGM.SQLRPGLE:181-199`
2. `ORD200.s01chk`: `if opt01 = 2 or opt01 = 4 and datclo > datBlank` → `2` is always an error (precedence), `4` is guarded correctly. — `ORD200.PGM.SQLRPGLE:187-195`
3. `ORD101`: `chain id order1` fills `ORDATE`, `ORDATDEL`, `ORDATCLO` into the buffer; none is read afterwards; every option and key behaves identically for open, delivered and closed orders. — `ORD101.PGM.RPGLE:282`, whole member (grep)

## Validation rules found in code

- In `ORD101`: none on order state.
- In the callers: "closed" ⇔ `ORDATCLO` converted date `>` `1940-01-01` (i.e. any non-zero `ORDATCLO`; the `0` / `1940-01-01` sentinel convention is `dat-utils-c01` / `c07`).

## Edge cases found in code

- **Closed order reachable three ways:** (a) direct `CALL ORD101 PARM(&ORID)`; (b) `ORD101` already open when another job closes the order — the closing job is blocked by `ORD101`'s `ORDER` record lock (`c02`) until the operator leaves, so this path is in practice serialised by the lock rather than by a rule; (c) `ORD201` list loaded before the order was closed elsewhere — its `datclo` is the SQL fetch value, so a stale list lets `2` through (`F5` refreshes). — `ORD101.PGM.RPGLE:8,282`, `ORD201.PGM.SQLRPGLE:119`
- **Delivered order.** Neither caller blocks `2` on a delivered order; `ORD101` then edits delivered lines subject only to `c04` (delivered quantity can be lowered to 0 per line) and blocks delete per line via `c05`.
- **Edit does not reopen.** `ORD101` never writes `ORDER`, so editing lines of a closed order (via the direct path) leaves `ORDATCLO` set — order totals change after close with no trace except the `ORD700` update log (`c11`).
- **`ORD200` defect.** Because `2` is unreachable there, `ORD200` users cannot maintain lines at all (they must go through `ORD201`); recorded as-is (`c09`).

## Dependencies

- `ord-maintain-ord200` / `ord-maintain-ord201` (guard owners; bound, queued) — cited only.
- `dat-utils` (`ISO_Num_To_Date` / `1940-01-01` sentinel) — cited only.

## Assumptions / unknowns

- needs-SME (Phase A question 2): should the target enforce "no line changes on a closed order" **inside** the line-maintenance surface (defence in depth) or keep it purely at the list? As-is: list only, and one list has it wrong.
- needs-SME: should delivered (not closed) orders be editable at line level at all? As-is: yes.

## Evidence

`ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:8,282` (absence: no `ORDATCLO` / `ORDATDEL` reference in the member) · `ATU_SRC/QDDSSRC/ORDER.PF:11-14` · `ATU_SRC/QRPGLESRC/ORD201.PGM.SQLRPGLE:67,119,181-199` · `ATU_SRC/QRPGLESRC/ORD200.PGM.SQLRPGLE:74,187-195` · `ATU_SRC/QDDSSRC/ORD201D.DSPF:45-46` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:56-57,76-78,130-135`
