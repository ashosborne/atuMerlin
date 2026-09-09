# menu-cmd-shell-c06 — Three messages are never referenced (`ERR0003`, `ERR0004`, `ERR0005`); `ERR0001` **is** live via `ART200D` — Phase A's "four dead" corrected to three

| | |
| --- | --- |
| Slice | `menu-cmd-shell` |
| Status | `documented` (as-is behaviour card, Phase B — dead catalogue entries; Phase A corrected) |
| Confidence | `observed-in-code` (the reference count is a structural grep; *why* the three are unused is inference) |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`; bound under the Phase A name "Four messages never referenced (ERR0001/0003/0004/0005)") |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

A whole-tree search for each of the twelve `SAMMSGF` ids finds every reference in `QDDSSRC` `ERRMSGID` keywords and none anywhere else. **Nine ids are live; three are dead.** Phase A listed `ERR0001` ("Familly code unknown") among the dead on the grounds that `ART200D` "uses its own `ERRMSG`" — that is half true: `ART200D` uses a literal `ERRMSG` for the *description-mandatory* rule (indicator 41) **and** `ERRMSGID(ERR0001 *LIBL/SAMMSGF 40)` on the family field `ARTIFA` (indicator 40), which `ART200` raises as `errFamilly` when `existArtFam(artifa)` fails. So `ERR0001` is referenced and reachable. The dead three are the entity-unknown texts for **article, customer and provider**: the screens that look those up by id (`ART250D`, `CUS250D`, `PRO250D`) all use the generic `ERR0103` "Code &1 Unknown." with the typed code substituted, so the specific messages were superseded (inference from the pattern; nothing in the tree says so). No RPG, COBOL or CL program sends any `SAMMSGF` message programmatically, so there is no hidden consumer the DSPF grep would miss.

## Entrypoints

- `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:13-18` — `ADDMSGD MSGID(ERR0003) … 'Article unknown. Press F4 to select.'`, `ERR0004 … 'Customer unknown…'`, `ERR0005 … 'Provider unknown…'`
- `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:9-10` — `ERR0001 … 'Familly code unknown. Press F4 to select.'`
- Live reference for `ERR0001`: `ATU_SRC/QDDSSRC/ART200D.DSPF:97-98` — `ARTIFA R B 7 29 REFFLD(FARTI/ARTIFA *LIBL/ARTICLE)` / `A 40 ERRMSGID(ERR0001 *LIBL/SAMMSGF 40)`; raised by `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:34` (`errFamilly 40 40n`) and `:286-288` (`if not existArtFam(artifa); errFamilly = *on; …`)
- Absence for `ERR0003` / `ERR0004` / `ERR0005`: structural grep `ATU_SRC/**` (i) → each id appears only on its own `ADDMSGD` line
- The screens that *would* use them use `ERR0103` instead: `ATU_SRC/QDDSSRC/ART250D.DSPF:28`, `CUS250D.DSPF:28`, `PRO250D.DSPF:30` — `ERRMSGID(ERR0103 *LIBL/SAMMSGF 40 &ERRDATA)`

## Inputs / outputs / observables

- In / out: none — the three messages are never displayed. `DSPMSGD` shows them; no screen or program can emit them.
- Observable: a `DSPMSGD RANGE(ERR0003 ERR0005) MSGF(SAMMSGF)` on the box lists three descriptions no code path reaches.

## Behaviour as implemented

Reference count per id (whole tree, case-insensitive), as-is:

| Id | Sites | Live? |
| --- | ---: | --- |
| `ERR0001` | 1 (`ART200D:98`) | **yes** — Phase A corrected |
| `ERR0002` | 3 (`CUS200D:132`, `PRO200D:102`, `PRO201D:106`) | yes |
| `ERR0003` | 0 | **no** |
| `ERR0004` | 0 | **no** |
| `ERR0005` | 0 | **no** |
| `ERR0103` | 3 (`ART250D:28`, `CUS250D:28`, `PRO250D:30`) | yes |
| `ERR1001` | 1 (`ORD101D:138`) | yes |
| `ERR1002` | 1 (`ORD101D:120`) | yes |
| `ERR2000` | 1 (`CUS200D:107`) | yes |
| `ERR2001` | 1 (`CUS200D:116`) | yes |
| `ERR2002` | 1 (`CUS200D:117`) | yes |

12 ids, 12 reference sites, 9 live, 3 dead. — `SAMMSGF.MSGF:9-32`; DSPF lines as cited

1. `ERRMSGID` is the only mechanism: every site is a DSPF field-level keyword conditioned by an indicator; the program sets the indicator, the display file fetches the text. No `SNDPGMMSG MSGID(ERR…)`, no `QMHSNDPM`, no `SNDUSRMSG`, no `RTVMSG` anywhere in `ATU_SRC`. — structural grep
2. For `ERR0001`, the path is `ART200` `S02chk` → `existArtFam(artifa)` false → `errFamilly = *on` (`*IN40`) → `step02 = dsp` → redisplay with `ERR0001` on the `ARTIFA` field. Behaviour belongs to `art-interactive` (held); cited here only to prove the message is live. — `ART200.PGM.SQLRPGLE:280-290`

## Validation rules found in code

Not applicable (this card is about references, not rules).

## Edge cases found in code

- **Phase A's reasoning error, for the record:** `ART200D` has *both* mechanisms on adjacent fields — `ERRMSG('A description is mandatory' 41)` on `ARDESC` (`:90-91`) and `ERRMSGID(ERR0001 …)` on `ARTIFA` (`:98`). Reading the first and stopping gave "uses its own `ERRMSG`". — `ART200D.DSPF:90-98`
- **Superseded, not orphaned by accident (inference):** `ERR0003`/`0004`/`0005` say "Press F4 to select" — the wording of a *maintenance* screen with a prompt key (like `ERR0001`/`ERR0002` on `ART200D`/`CUS200D`/`PRO200D`). The screens that validate an article / customer / provider code are the by-id displays (`ART250D`, `CUS250D`, `PRO250D`), which do offer F4 (`PRO250D.DSPF:27` `'F4=Prompt'`) yet use `ERR0103` with the code echoed. Whether an earlier design had article/customer/provider *fields* on maintenance screens (order lines? `ORD100D`/`ORD101D` use their own texts — `ord-entry-ord100`) is not knowable from the tree.
- **`ORD100D` / `ORD101D` article-unknown handling does not use `ERR0003`:** `ORD101D` references only `ERR1001`/`ERR1002`; `ORD100D` references no `SAMMSGF` id at all (grep) — the order-entry article check, if any, is voiced by literal `ERRMSG` or program text (`ord-entry-ord100` / `ord-entry-ord101` own that). So the most obvious candidate consumer for `ERR0003` does not consume it.
- **Nothing depends on the ids staying in the file:** deleting the three would break no compile (`ERRMSGID` is resolved at display time) and no program. As-is, they stay.

## Dependencies

- `c05` (the catalogue); `ART200D` / `ART200` (`art-interactive`, held — cited for the one `ERR0001` reference only, not documented).

## Assumptions / unknowns

- The grep is exhaustive for the tree as delivered; a consumer outside `ATU_SRC` (another library's DSPF, a CL in a deployment tool, a QM form) is not excluded — same class of blind spot as `c02`. Inference: none exists, because every other application object is in the tree.
- Target stance (room, prose only): drop the three from the target resource file, or keep them as reserved ids for a future article/customer/provider maintenance screen — recommendation: drop; the by-id screens' generic `ERR0103` is the pattern the target already reproduces.

## Evidence

`ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:9-18` · `ATU_SRC/QDDSSRC/ART200D.DSPF:90-98` · `ATU_SRC/QRPGLESRC/ART200.PGM.SQLRPGLE:14,34,280-290` · `ATU_SRC/QDDSSRC/ART250D.DSPF:28` · `ATU_SRC/QDDSSRC/CUS250D.DSPF:28` · `ATU_SRC/QDDSSRC/PRO250D.DSPF:27-32` · `ATU_SRC/QDDSSRC/ORD101D.DSPF:120,138` · structural grep `ATU_SRC/**` (i) for each `ERR0001`…`ERR2002` (12 DSPF sites, none in `QRPGLESRC` / `QRPGSRC` / `QCBLSRC` / `QCLSRC` / `QSQLSRC`), for `SNDPGMMSG` / `QMHSNDPM` / `SNDUSRMSG` / `RTVMSG` with an `ERR` id (none), for `sammsgf` in `ORD100D.DSPF` (none)
