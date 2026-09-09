# CANDIDATES — pro-cobol-pro201 (Phase A, unbound)

Seed: `PRO201` COBOL "Display Providers" (menu opt 5). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| pro-cobol-pro201-c01 | Read-only provider list: `PROVIDE1` read sequentially (keyed by `PRID`), 14 rows per load (`SFLPAG` constant), `PRDEL` shown, Page Down loads the next 14; options 2 (display) and 5 (items) only, others SFLMSG 35 | `QCBLSRC/PRO201.CBL:30-33`, `:94`, `:147-180`, `:214-239`; `QDDSSRC/PRO201D.DSPF:15-21`, `:52-55` | observed-in-code | Core list |
| pro-cobol-pro201-c02 | Option 2 shows FMT02 with all provider fields output-only, populated by `MOVE CORRESPONDING` from the subfile row (hidden fields `PRCONT`…`PRCREA` carried in the subfile record, so no re-read of the database) | `PRO201.CBL:247-254`, `:280-282`; `PRO201D.DSPF:22-30`, `:86-107` | observed-in-code | Display path; data may be stale vs database since the subfile load |
| pro-cobol-pro201-c03 | Option 5 → `CALL "ART202" USING PRID-WRK` (dynamic program call; `PRID` copied to a work field) | `PRO201.CBL:73`, `:256-263` | observed-in-code | Call graph |
| pro-cobol-pro201-c04 | One option processed per Enter: `ACT01` reads a single `NEXT MODIFIED` row and acts on it; remaining option rows are only reached after the list is redisplayed and Enter pressed again | `PRO201.CBL:241-266` | observed-in-code | Divergence from the RPG lists (which loop) |
| pro-cobol-pro201-c05 | **F3 on the detail panel does not exit**: it sets `PANEL 1` + `STEP01 PRP`, which clears the subfile and re-reads `PROVIDE1` from the *current* file position without repositioning and without resetting `IN80`; after a fully loaded list this yields an empty list (`SAVRRN01 = 0` → no `SFLDSP`). F12 on the detail returns to the list as displayed (`STEP01 DSP`); Enter on the detail also returns via `PRP` | `PRO201.CBL:147-158` (no `START`, `IN80` untouched), `:292-305` | observed-in-code (code path) / inferred (runtime effect) | Navigation defect; needs a run on the box to confirm the visible effect |
| pro-cobol-pro201-c06 | F3 and F12 on the list both end the program (`PANEL 0`); Page Down decoded from control-area value `'90'` (comment warns PAGEUP is `'91'`) | `PRO201.CBL:75-80`, `:199-211` | observed-in-code | Key semantics |
| pro-cobol-pro201-c07 | `PRP01` performs the first `READ` before `LOD01`, so the first page is read-ahead by one; `IN80` at end of file is set and never reset for the life of the program | `PRO201.CBL:147-158`, `:163-180` | observed-in-code | Load mechanics (feeds c05) |
| pro-cobol-pro201-c08 | Direct file access — `PRO201` does not use `FPROVIDER`, `FCOUNTRY` or any service program; country is shown as the raw code; `CONAME` field on FMT02 is never populated (blank) | `PRO201.CBL:28-40`, `:280-282`; `PRO201D.DSPF:105-107` | observed-in-code | Dependency fact / display gap |
| pro-cobol-pro201-c09 | DSPF leftovers from `PRO200D`: `ERRMSG 41 'The name is mandatory'` and `ERRMSGID ERR0002` on read-only fields, `CF04` on FMT02 — none reachable from the COBOL | `PRO201D.DSPF:74`, `:90`, `:106`; `PRO201.CBL:292-305` (no F4 branch) | observed-in-code | As-is oddity |
| pro-cobol-pro201-c10 | Only COBOL member in `ATU_SRC`; compiled as `*PGM` with `PROCESS APOST`; `STOP RUN` closes both files on every exit | `PRO201.CBL:4`, `:307-316`; `QPNLSRC/SAMMNU.MENU:99-102` | observed-in-code | Language outlier for the room's target-stack decision |

## Deferred recommendations (prose only)

- c05: the empty-list-after-F3 effect is derived from the code path (no `START`, `IN80` not reset). Recommend the SME confirm on the box before it is carded; if confirmed, decide preserve vs fix.
- c10: COBOL is a one-off here. Recommend the room decide whether this seam is converted at all or simply **retired** in favour of `PRO200` (which already lists the same rows with more options) — `PRO201` adds no data the RPG screens lack.
