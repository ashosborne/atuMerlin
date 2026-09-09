# cou-maintain-c02 — Option 2 → `FMT02` "Edit a country": code shown, name (`CHECK(LC)`) and ISO-3 editable; Enter → `UPDAT FCOUN` unconditionally — no validation, no audit columns, no commitment control

| | |
| --- | --- |
| Slice | `cou-maintain` (COU200 half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — night residual wave 2026-09-09 (`BIND.md`, `overnight/BIND_RECORD_NIGHT_RESIDUAL_2026-09-09.md:14`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Panel 2 is the estate's **only write path to `COUNTRY`**. Option 2 on a list row (`c01` / `c06`) sets `PANEL = 2`; `S02PRP` re-reads the row from the file with a locking `CHAIN` on `COID`, `S02DSP` shows `FMT02` with the code as output and the name and ISO-3 code as input, and Enter runs `S02CHK` — which contains **no checks** (`MOVE 'ACT' STEP02` and nothing else) — then `S02ACT`: `UPDAT FCOUN` with whatever is in the two input fields, then back to panel 1. Blank name, blank ISO code, a two-character or lowercase ISO code, a duplicate ISO code across countries — all are written as typed (the ISO field has no `CHECK(LC)`, so the 5250 keyboard uppercases it; the name field does). The file has three columns and no audit fields, so nothing records who changed what or when; the file is not under commitment control, so the `UPDAT` is immediate and final. The ISO-3 column written here has no reader in the estate except the uncalled `GetCountryIso3` (`c08`); the name written here is what `GetCountryName` serves to `CUS200` / `CUS250` / `PRO200` / `PRO250` — after their cache is refreshed by a different code (`c07`).

## Entrypoints

- From panel 1: `S01ACT` `OPT01 = 2` → `PANEL = 2`, `STEP02 = 'PRP'` — `ATU_SRC/QRPGSRC/COU200.RPG:94-98`
- Panel-2 dispatcher `PNL02` (`CASEQ` on `STEP02`: `PRP` / `DSP` / `KEY` / `CHK` / `ACT`) — `COU200.RPG:101-108`
- Record format `FMT02` — `ATU_SRC/QDDSSRC/COU200D.DSPF:52-73`

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| Key used | `COID` as read by `READC SFL01` (the subfile field shares the program field with the file record) | `COU200.RPG:90,111`; `COU200D.DSPF:19` |
| Read | `COID CHAINCOUNTRY 98` — keyed read **with lock** (file is `UF`); HI indicator 98 = not found, never tested (`c03`) | `COU200.RPG:7,111` |
| Screen fields | `COID 2A O` at 5/24 ("Country Code . . :"); `COUNTR 30A B` at 6/24 with `CHECK(LC)` ("Country Name . . ."); `COISO 3A B` at 7/24, no `CHECK(LC)` ("Iso Code (3) . . ."); all `REFFLD(FCOUN/… *LIBL/COUNTRY)` | `COU200D.DSPF:62-64,70-73` |
| Heading / keys | `COU200` / `Edit a country` / `Type choices, press Enter.` / `F3=Exit` / `F12=Cancel`; `DATE` `TIME`; no `OVERLAY` (the format replaces the screen) | `COU200D.DSPF:54-69` |
| Write | `UPDAT FCOUN` — the whole record (`COID`, `COUNTR`, `COISO`) from the program fields | `COU200.RPG:131`; `ATU_SRC/QDDSSRC/COUNTRY.PF:6-9` |
| Observable | after Enter the list returns; the edited row still shows the **old** values (`c06`); a fresh call of `COU200`, or `GetCountryName` after a cache miss, shows the new ones | `COU200.RPG:130-133` |

## Behaviour as implemented

1. **Prepare.** `S02PRP`: `STEP02 = 'DSP'`; `COID CHAIN COUNTRY` (indicator 98 on not-found, ignored). On success the record buffer — and therefore the three screen fields — holds the file's **current** values, not the subfile's, so a change made by another job since the list was loaded is shown. The record is now locked. — `COU200.RPG:109-112`
2. **Display.** `S02DSP`: `EXFMT FMT02`; `STEP02 = 'KEY'`. — `COU200.RPG:113-116`
3. **Keys.** `S02KEY`: `*IN03` → `GOTO ENDPGM` (program ends — `c05`); `*IN12` → `PANEL = 1` (back to the list, no write, lock still held — `c05`); otherwise `STEP02 = 'CHK'`. — `COU200.RPG:117-126`
4. **Check.** `S02CHK`: `STEP02 = 'ACT'`. Nothing else. — `COU200.RPG:127-129`
5. **Act.** `S02ACT`: `UPDAT FCOUN`; `PANEL = 1`. The `UPDAT` releases the lock. `STEP02` is left at `'ACT'` and is reset to `'PRP'` by the next option-2 row in `S01ACT`. — `COU200.RPG:130-133`, `:96`

## Validation rules found in code

**None.** Specifically absent:

- no test of `COUNTR` (blank allowed; leading blanks kept; no trim);
- no test of `COISO` (blank, 1–3 characters, digits, punctuation all accepted; no uniqueness — `COUNTRY.PF` is `UNIQUE` on `COID` only; no cross-check against `COID`);
- no `CHECK(ME)` / `CHECK(MF)`, `VALUES`, `RANGE`, `COMP` or `ERRMSG` keyword on either input field in the DDS;
- no "changed?" test — Enter always writes, even when nothing was typed;
- no confirmation step.

Case handling comes from the display, not the program: `COUNTR` has `CHECK(LC)` (mixed case preserved), `COISO` does not (uppercased by the keyboard shift — platform, inference). — `COU200D.DSPF:71-73`

## Edge cases found in code

- **Every Enter writes.** Because `S02CHK` does nothing and `S02ACT` does not compare, an Enter on an unchanged panel still performs `UPDAT` (a rewrite of identical data — no observable change, one I/O). — `COU200.RPG:127-131`
- **Blank ISO code.** Accepted; the file's `COISO` becomes blanks; `GetCountryIso3` (uncalled) would return blanks, indistinguishable from an unknown code (`c07`). — `COU200.RPG:131`; `COUNTRY.PF:9`
- **Blank name.** Accepted; `CUS200D` / `PRO200D` `CONAME`, `CUS250D` / `PRO250D` `COUNTR` then show blanks for a country that *does* exist (`ExistCountry` still `*on`). — `COU200.RPG:131`; pointer `c07`
- **Cache staleness in other jobs.** `COU300`'s cache test is `P_COID <> COID` on its own buffer (`COU300.RPGLE:57`); a job holding a cached hit for this code keeps serving the old name until it asks for a different code. `COU200` opens `COUNTRY` itself (OPM, default activation group) and shares no ODP with any ILE caller. — pointer `c07`; `COU200.RPG:7`
- **Concurrent edit.** Two `COU200` users on the same row: the second `CHAIN` waits for the lock for the file's `WAITRCD` (a `CRTPF` parameter, not in the DDS — build unknown) and then fails with a record-lock exception; the program has no LO indicator on the `CHAIN` and no `INFSR`, so the default handler issues an inquiry message (platform — inference). — `COU200.RPG:7,111`
- **Duplicate ISO codes.** Nothing prevents two countries sharing an ISO-3 code, or a country's ISO-3 disagreeing with its 2-character `COID`. The estate never reads `COISO` in anger (`c08`), so the inconsistency is invisible until something does.
- **The code cannot be changed.** `COID` is output-only on `FMT02`; there is no rename-key path and no create / delete path (`c04`).

## Dependencies

- `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` (three columns; `UNIQUE K COID`; no audit fields — contrast `CUSTOMER.PF:25-28` `CUMOD` / `CUMODID` and `ARTICLE.PF:35-36` `ARMOD`)
- `ATU_SRC/QDDSSRC/SAMREF.PF:18,20` (`COID 2`, `COUNTR 30`); `COISO` is a literal `3` in the PF, not a `SAMREF` field (`c08`)
- Consumers of what is written: `c07` (`GetCountryName` / `GetCountryIso3` / `ExistCountry`), `c09` (`SltCountry` shows `COUNTR`), `c12` (display files compiled against the layout). Pointer only: `modern/db/schema.sql:324,330` records `COU200` as the only writer of `country`; no maintenance path exists in `modern/` — not changed, not proposed here.

## Assumptions / unknowns

- Platform (inference / runtime-confirmable): `CHAIN` on a `UF` file locks the record; `UPDAT` releases it; keyboard uppercasing without `CHECK(LC)`; record-lock wait / exception path; no commitment control without the F-spec keyword (column 66 blank).
- Build: `WAITRCD` of `COUNTRY`; `CRTRPGPGM` options.
- **needs-SME (room / product owner):** does the target need ISO-3 validation (format, uniqueness, consistency with the 2-character code) — Phase A's question, still open. As-is there is none.
- **needs-SME (room):** is an unaudited, unconfirmed edit of reference data acceptable in the target, given that the converted CUS / ORD / PRO surfaces read the name through `GetCountryName`? The FCOUNTRY half's `c07` staleness question is the other side of the same coin.

## Evidence

`ATU_SRC/QRPGSRC/COU200.RPG:7,90,94-98,101-108,109-112,113-116,117-126,127-129,130-133` · `ATU_SRC/QDDSSRC/COU200D.DSPF:52-73` · `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` · `ATU_SRC/QDDSSRC/SAMREF.PF:18,20` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:57` (pointer, `c07`) · structural grep of `ATU_SRC/**` for `WRITE` / `DELET` / `INSERT` on `FCOUN` / `COUNTRY` (none — `UPDAT` at `COU200.RPG:131` is the only write), for `COISO` (seed members only)
