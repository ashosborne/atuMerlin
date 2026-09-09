# log-programs-c04 — No capacity check: logging stops silently once the 600-byte write crosses the end of SAMLOG

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — runtime consequence) |
| Confidence | `inferred` (the sizes and the absence of any check are `observed-in-code`; the exception, the exact byte at which it fires and what the operator sees are runtime / platform) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound as `inferred`, kept `inferred`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMLOG` is created with an initial size of **5000 bytes** and no auto-extend (`QUSCRTUS` alone; `QUSCUSAT` is never called anywhere in `ATU_SRC`). `AddLogEntry` writes a **600-byte fixed** field at `p1 + pos` on every call and never compares `pos` with the size. The write therefore fails with a space-addressing exception (`MCH0601`, inference) as soon as `pos + 600` exceeds the space's allocated size — i.e. from about `pos ≥ 4400` if the allocation is exactly 5000. With `ORD700` lines of ≈ 125 bytes that is roughly **35 deletions** — fewer than the Phase A estimate of "40–60 lines" — after which every further `AddLogEntry` in every job fails the same way. The failure is permanent and invisible: the assignment at line 31 raises before `pos` is advanced (line 32), so `pos` stays where it was and each next call fails at the same offset; the only caller catches the escape with `callp(e)` and never tests `%error`; nothing is written to a message queue or joblog by the log itself. Recovery is manual (`LOG100` re-run = reset, `c01`).

## Entrypoints

- `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:21` — `crtusrspc(usrspc:'LOG':5000:X'00':…)` — size 5000, no auto-extend parameter in `QUSCRTUS`
- `ATU_SRC/QRPGLESRC/LOG300.RPGLE:13` — `d data s 600 based(p2)`
- `LOG300.RPGLE:27-32` — `p2 = p1 + pos; … data = data2; pos += %len(data2);`
- `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:78` — `callp(e) addlogEntry(…)` — `%error` never read
- Absence: structural grep of `ATU_SRC/**` for `QUSCUSAT` / `QUSCHGUS` / `QUSRTVUS` (none); grep of `LOG300.RPGLE` for `monitor`, `%error`, `*pssr`, `5000` (none)

## Inputs / outputs / observables

- Capacity: 5000 bytes requested; usable for entries = `size − 7` (header) but the last *successful* write needs `pos + 600 ≤ size`. — `LOG100.PGM.RPGLE:21,24`, `LOG300.RPGLE:13`
- Per `ORD700` line: `63 + len('ORD700:Order Line deleted ' + orid + ' ' + line + ' article : ' + arid(6) + ' quantity : ' + qty)` ≈ 63 + 59…68 → **≈ 122–131 bytes**. — `LOG300.RPGLE:28-30`, `ORD700.PGM.RPGLE:78-81`, `ATU_SRC/QDDSSRC/SAMREF.PF:11,34,37,47`
- Observable: the log stops growing; deletes keep working (`ORD700` continues to `UpdArt` after the swallowed error — `ord-trigger-ord700-c03`); `pos` at offset 0 stays at its last good value; a `DSPJOBLOG` of the deleting job may show the escape as a *received-and-handled* message only (runtime).

## Behaviour as implemented

1. Nothing in `LOG100` sets auto-extend; nothing in `LOG300` reads the size (`QUSRUSAT` not used). — `LOG100.PGM.RPGLE:21`, grep
2. Each call positions at `pos` and assigns 600 bytes. — `LOG300.RPGLE:27,31`
3. When `pos + 600 > allocated size` the assignment addresses storage beyond the object → exception in `LOG300` (no handler) → escape to `ORD700` → `callp(e)` sets `%error`, execution continues. — `:31`, `ORD700.PGM.RPGLE:78`
4. `pos` unchanged (line 32 not reached) → the condition holds forever → every subsequent call in every job fails identically. — `:31-32`

## Validation rules found in code

None — that is the finding.

## Edge cases found in code

- **Threshold is `size − 600`, not `size`.** Even though a line is ~125 bytes and there would be room for four more lines, the 600-byte fixed write is what crosses the boundary. — `LOG300.RPGLE:13,31`
- **Allocated size may exceed 5000.** User spaces are allocated in page units; if the box gives `SAMLOG` 8192 (or more) bytes, the first failure moves to `pos ≥ 7592` — ≈ 60 lines. The Phase A "~4400 bytes" is the lower bound. Runtime fact: `DSPOBJD SAMLOG *USRSPC DETAIL(*FULL)` or `QUSRUSAT` on the box. — inference
- **Partial write?** Whether the bytes below the boundary are stored before the exception (leaving a truncated last line without `' ***'`) or nothing is stored is an MI detail; either way `pos` is not advanced. — inference
- **Not reached today?** The in-tree writer fires only on order-line deletes (`c07`); at a few deletes a day the space lasts weeks to months, then fails silently — consistent with nobody noticing. — `ORD700.PGM.RPGLE:76-82`
- **Wrap-around, rotation, archive:** none exists. The only reset is `LOG100` (`c01`).

## Dependencies

- `c01` (size, no auto-extend), `c02` (cursor), `c03` (600-byte write), `c07` (the only writer and its `callp(e)`)

## Assumptions / unknowns

- needs-SME (box): has `SAMLOG` ever filled? What did operators see (nothing, an inquiry, a joblog entry)? What is the object's actual allocated size?
- needs-SME (room): the recommendation from Phase A stands — treat the user-space log as a non-functional side effect replaced by target-side logging; the ORD vertical already writes each line to an unbounded `samlog` table (`modern/db/schema.sql:132-140`, `README.md:325`: "log never fails silently here"). Nothing of this card is behaviour to reproduce; it is a known legacy defect to record as-is (job header: do not fix).

## Evidence

`ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:21,24` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:13,27-32` · `ATU_SRC/QRPGLESRC/ORD700.PGM.RPGLE:76-82` · `ATU_SRC/QDDSSRC/SAMREF.PF:11,34,37,47` · structural grep `ATU_SRC/**` for `QUSCUSAT`, `QUSCHGUS`, `QUSRTVUS` (none)
