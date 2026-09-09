# log-programs-c02 — SAMLOG layout: binary write cursor at offset 0, '***' at offset 4, entries from offset 7

| | |
| --- | --- |
| Slice | `log-programs` |
| Status | `documented` (as-is behaviour card, Phase B — data format) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`SAMLOG` is a flat byte buffer with a 7-byte header. Bytes 0–3 hold a 4-byte signed binary integer (`10i 0`) that is the **write cursor** `pos` — the offset at which the next entry is written; bytes 4–6 hold the literal `'***'`; the first entry starts at offset **7**. `LOG100` writes the header once (`pos = 7`, `data = '***'`); `LOG300.AddLogEntry` reads `pos` from offset 0 on every call, writes at `p1 + pos`, and adds the entry length back into offset 0. Because the cursor lives **inside the space**, it is persistent across jobs and IPLs and shared by every writer (`c10`). Entries are written back-to-back with **no record separator** — `' ***'` at the end of each line is the only delimiter (`c03`). The layout is defined twice, independently: a based DS in `LOG100` (`pos 10i 0` then `data 3`) and two standalone based fields in `LOG300` (`pos 10i 0 based(p1)`, `data 600 based(p2)`); they agree by construction, not through a shared copybook.

## Entrypoints

- `ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:14-16` — `d ds based(p1)` / `d pos 10i 0` / `d data 3`
- `LOG100.PGM.RPGLE:23-25` — `rtvusrspcptr(usrspc:p1); pos = 7; data = '***';`
- `ATU_SRC/QRPGLESRC/LOG300.RPGLE:12-13` — `d pos s 10i 0 based(p1)` / `d data s 600 based(p2)`
- `LOG300.RPGLE:27` — `p2 = p1 + pos;`
- `LOG300.RPGLE:31-32` — `data = data2; pos += %len(data2);`

## Inputs / outputs / observables

- Header after `LOG100`: `X'00000007'` `'***'` then `X'00'` to the end of the space. — `LOG100.PGM.RPGLE:14-16,24-25`
- After *n* entries: offset 0 = `7 + Σ len(entry_i)`; bytes 7… = the entries concatenated; after the last entry up to `600 − len` bytes of blanks (the 600-byte padded write, `c03`), then `X'00'`. — `LOG300.RPGLE:13,31-32`
- Observable: a raw dump (`DMPOBJ`, or the `ADSPUSRSPC` command of menu option 84 — `c09`) shows four binary bytes, `***`, then the text with no line breaks.

## Behaviour as implemented

1. `LOG100` overlays a DS on the space start: `pos` at offset 0 (4 bytes, big-endian binary), `data` at offset 4 (3 bytes). — `LOG100.PGM.RPGLE:14-16`
2. `pos = 7` = the byte just after the header — the first free byte. `data = '***'`. — `:24-25`
3. `LOG300` maps `pos` alone at offset 0 (`based(p1)`) and computes `p2 = p1 + pos` for each write; `data` (600 bytes) is based on `p2`. — `LOG300.RPGLE:12-13,27`
4. After the write, `pos += %len(data2)` — the cursor advances by the *logical* length of the line, not by the 600 bytes physically touched. — `:31-32`

## Validation rules found in code

None. `pos` is trusted as read: no lower bound (a corrupted or zero `pos` would write over the header), no upper bound (`c04`), no check that bytes 4–6 still read `'***'`.

## Edge cases found in code

- **`pos` is the only state.** Nothing records the entry count, the last write time or the end of the space; `pos` is both the count-of-bytes-used and the next-write offset. A reader must scan for `' ***'` to split lines. — `LOG300.RPGLE:27-32`
- **Read-modify-write of `pos` without a lock** — two writers can read the same `pos` (`c10`). — `:27,32`
- **Two definitions of one layout.** `LOG100`'s DS and `LOG300`'s standalone fields must stay byte-compatible; the `'***'` header marker is written by `LOG100` and never read by anyone. — `LOG100.PGM.RPGLE:14-16`, `LOG300.RPGLE:12-13`
- **Byte order:** `10i 0` is big-endian on IBM i; a target reading a copied `SAMLOG` must decode offset 0 accordingly (platform; runtime-confirmable).

## Dependencies

- `SAMLOG` `*USRSPC` (runtime object); `QUSPTRUS` (`APICALL.RPGLEINC:14-16`)
- `c01` (header written), `c03` (entry format), `c10` (cursor race)

## Assumptions / unknowns

- Whether anyone parses the binary header today (`c09`: the reader command is not in the tree).
- Target stance: the ORD vertical stores each line as a `samlog` row (`modern/db/schema.sql:132-140`) — the byte layout has no target counterpart; if a data migration of existing `SAMLOG` content is wanted, this card is the decoding rule (room decision, recommendation: not needed).

## Evidence

`ATU_SRC/QRPGLESRC/LOG100.PGM.RPGLE:14-16,23-25` · `ATU_SRC/QRPGLESRC/LOG300.RPGLE:12-13,27,31-32` · `ATU_SRC/QPROTOSRC/APICALL.RPGLEINC:14-16`
