# cou-maintain-c07 — GetCountryName / GetCountryIso3 / ExistCountry (cached keyed chain)

| | |
| --- | --- |
| Slice | `cou-maintain` (FCOUNTRY half) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`, `overnight/BIND_RECORD_RESIDUAL_2026-09-08.md`; FCOUNTRY half only) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

`COU300` is a `nomain` module with three exported one-argument procedures over the `COUNTRY` file: `GetCountryName(coid)` returns `COUNTR` (30A), `GetCountryIso3(coid)` returns `COISO` (3A), `ExistCountry(coid)` returns `%found(country)`. All three call the same private `chainCOUNTRY`, which opens the file on first use, and re-reads only when the requested code differs from the code of the record currently in the buffer. An unknown code clears the record buffer and fails the chain, so the getters return blanks and `ExistCountry` returns `*off`. `COUNTRY` has **no delete flag**, so "exists" means "row present" — there is no `IsCountryDeleted` and nothing to soft-delete against (contrast `FFAMILLY` / `FCUSTOMER`).

## Entrypoints

- Exported symbols `GETCOUNTRYNAME`, `GETCOUNTRYISO3`, `EXISTCOUNTRY` — `ATU_SRC/QSRVSRC/FCOUNTRY.BND:5-7`
- Prototypes: `GetCountryName PR 30A / COID 2A value` — `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-8`; `GetCountryIso3 PR 3A` — `:12-13`; `ExistCountry PR n` — `:17-18`
- Implementation: `GetCountryName` — `ATU_SRC/QRPGLESRC/COU300.RPGLE:19-27`; `GetCountryIso3` — `:29-37`; `ExistCountry` — `:40-48`; private `chainCOUNTRY` — `:50-63`
- Callers (call sites only, not deepened): `CUS200` `S02prp` / after F4 / `S02chk` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:259,284,292`; `PRO200` — `ATU_SRC/QRPGLESRC/PRO200.RPGLE:219,239,247`; `CUS250` — `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:130`; `PRO250` — `ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE:136`

## Inputs / outputs / observables

| Item | Detail | Source |
| --- | --- | --- |
| Argument | `P_COID 2A value` on all three procedures | `COU300.RPGLE:21,31,42` |
| `GetCountryName` | returns `COUNTR` (`like(countr)`, 30A via `SAMREF`); blanks when unknown | `COU300.RPGLE:20,25`, `ATU_SRC/QDDSSRC/SAMREF.PF:20-21` |
| `GetCountryIso3` | returns `COISO` (`like(coiso)`, 3A literal in `COUNTRY.PF`, not a `SAMREF` field); blanks when unknown | `COU300.RPGLE:30,35`, `ATU_SRC/QDDSSRC/COUNTRY.PF:9` |
| `ExistCountry` | returns `%found(country)` — result of the most recent `chain` on the module's `COUNTRY` ODP | `COU300.RPGLE:46` |
| File | `COUNTRY if e k disk usropn` — input only, keyed by `COID` (`UNIQUE`) | `COU300.RPGLE:6`, `COUNTRY.PF:4,10` |
| Cache state | the record buffer `FCOUN` (`COID`, `COUNTR`, `COISO`) + key field `K_COID`; module static, lifetime = activation group | `COU300.RPGLE:13,15-16,57-61` |

## Behaviour as implemented

1. **Open guard.** `if not %open(COUNTRY); open COUNTRY; endif;` — the file is `USROPN` and is opened by the first getter called in the activation group. It is never closed by any exported path (`c08`). — `COU300.RPGLE:54-56`
2. **Cache test.** `if P_COID <> COID` — the argument is compared with the **file field** `COID` of the record currently in the buffer, not with a saved last-key variable. — `:57`
3. **Miss.** `K_COID = P_COID; clear *all FCOUN; chain kf COUNTRY;` — the buffer is blanked first, so on a failed chain every record field is blank (`COID` included). — `:58-60`
4. **Return.** Each getter returns the corresponding buffer field; `ExistCountry` returns `%found(country)`. — `:25,35,46`

Consequences of steps 2–3 (derived from the code, same shape as `vat-module-c02` / `cus-modules-c01`):

- A **hit is cached**: repeated calls for the same code perform no I/O and return the buffered row. A row changed by another job (e.g. `COU200`, deferred) is not seen until a different code is requested.
- A **miss is not cached**: after a miss `COID` is blank, so the next call for the same unknown code re-reads.
- A **blank code never reads**: at module start and after every miss the buffer's `COID` is blank, so `P_COID = *blanks` skips the chain and returns the blank buffer / the `%found` left by the previous chain (`*off` at start, `*off` after a miss). After a hit, a blank argument does chain (blank key), misses, and blanks the buffer. Net result for every reachable sequence: blank → blanks / `*off`. Correct by construction rather than by an explicit test.
- `%found` is stable between chains, so `ExistCountry` on a cached hit is `*on` and after a miss is `*off`; no sequence returns a wrong answer, only a different number of reads.

## Validation rules found in code

None. No trimming, no case folding, no length check; the 2-character key is matched exactly. Caller screens take the code in a field with no `CHECK(LC)` (`CUS200D.DSPF:131`, `PRO200D.DSPF:101`), so a 5250 session uppercases typed input before the program sees it — system behaviour, not this module's.

## Edge cases found in code

- **`ExistCountry` as the first call in an activation group with a blank code** never chains; `%found` is its initial `*off`, so the caller's "country must exist" rule (`cus-interactive-c04`, `PRO200.RPGLE:247-250`) rejects a blank country without any read. — `COU300.RPGLE:57`
- **No delete flag.** `COUNTRY.PF` is `COID`, `COUNTR`, `COISO` only; `ExistCountry` cannot distinguish "retired" from "live" because the file has no such notion. `FAM300` has `IsArtFamDeleted`; `COU300` has no analogue. — `COUNTRY.PF:6-9`; compare `ATU_SRC/QRPGLESRC/FAM300.RPGLE:40-48`
- **Getter and predicate share one buffer.** A caller that does `GetCountryName(x)` then `ExistCountry(x)` (the `CUS200` prompt path then check path, `CUS200.PGM.SQLRPGLE:284,292`) performs one read for both.
- **Return length mismatch is only nominal.** Prototype says `30A` / `3A`, module says `like(countr)` / `like(coiso)`; both resolve to 30 / 3 through `SAMREF` / the literal length. — `COUNTRY.RPGLEINC:7,12`, `COU300.RPGLE:20,30`

## Dependencies

- `ATU_SRC/QDDSSRC/COUNTRY.PF` (`UNIQUE`, `REF(SAMREF)`, key `COID`) — `:4-10`; `ATU_SRC/QDDSSRC/SAMREF.PF:18,20-21` (`COID 2`, `COUNTR 30`)
- `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-18`; binding facts in `c12`; `closeCOUNTRY` / unused export in `c08`
- Consumers of the returned name: `CUS200D.DSPF:141` and `PRO200D.DSPF:103` (`CONAME 30A O`), `CUS250D.DSPF:70` and `PRO250D.DSPF:65` (`COUNTR` output field `REFFLD(FCOUN/COUNTR *LIBL/COUNTRY)` — those two display files reference `COUNTRY` at compile time)

## Assumptions / unknowns

- Activation group of the callers is compile metadata (`CUS200`, `CUS250`, `PRO250` have `dftactgrp(*no)` with no `actgrp` keyword; `PRO200` is `ACTGRP(QILE)` via `PRO200.ILEPGM:9`). Whether two callers in one job share this cache depends on it (`c12`).
- The converted CUS vertical carries a read-only dependency surface for these two getters at `modern/src/shared/fcountry/index.ts` (`existCountry`, `getCountryName`, per-call queries, no cache). Pointer only: this card is the as-is reference for it; nothing here changes or widens `atu-merlin-ts-cus-v1`.

## Evidence

`ATU_SRC/QRPGLESRC/COU300.RPGLE:4,6,8,10-16,19-48,50-63` · `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:7-18` · `ATU_SRC/QSRVSRC/FCOUNTRY.BND:5-7` · `ATU_SRC/QDDSSRC/COUNTRY.PF:4-10` · `ATU_SRC/QDDSSRC/SAMREF.PF:18,20-21` · `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:259,284,292` · `ATU_SRC/QRPGLESRC/PRO200.RPGLE:219,239,247` · `ATU_SRC/QRPGLESRC/CUS250.PGM.RPGLE:130` · `ATU_SRC/QRPGLESRC/PRO250.PGM.RPGLE:136` · `ATU_SRC/QRPGLESRC/FAM300.RPGLE:40-48`
