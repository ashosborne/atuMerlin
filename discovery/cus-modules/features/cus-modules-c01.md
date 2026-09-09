# cus-modules-c01 — Customer getter family (GetCus*)

| | |
| --- | --- |
| Slice | `cus-modules` (`srvpgm-fcustomer` folded in at bind) |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

Eleven exported `nomain` procedures in `CUS300` each take a customer id by value (`5P 0`), call the module-private `chainCUSTOME1`, and return one `CUSTOMER` column straight from the module-global record buffer. There is no found/not-found signal: an unknown id yields `*blanks` / `0`.

## Entrypoints

- Exported symbols `GETCUSNAME`, `GETCUSPHONE`, `GETCUSVAT`, `GETCUSMAIL`, `GETCUSADRLINE1..3`, `GETCUSZIP`, `GETCUSCITY`, `GETCUSCOUNTRY`, `GETCUSLIMCREDIT`, `GETCUSCREDIT` — `ATU_SRC/QSRVSRC/FCUSTOMER.BND:4-20`
- Prototypes (shared include, `/COPY`'d by every caller) — `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:7-63`
- Implementations — `ATU_SRC/QRPGLESRC/CUS300.RPGLE:19-137`
- Service program `FCUSTOMER` = `MODULE(CUS300 CUS301) ACTGRP(*CALLER) EXPORT(*SRCFILE)` — `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9`; reached through `SAMPLE.BNDDIR` — `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:12`

## Inputs / outputs / observables

| Procedure | Returns | Type (via `CUSTOMER.PF` → `SAMREF`) | `CUS300.RPGLE` |
| --- | --- | --- | --- |
| `GetCusName` | `CUSTNM` | 30A | `:19-27` |
| `GetCusPhone` | `CUPHONE` | 15A (`PHONE`) | `:29-37` |
| `GetCusVat` | `CUVAT` | 12A (`VATNUM`) | `:39-47` |
| `GetCusMail` | `CUMAIL` | 50A (`EMAIL`) | `:49-57` |
| `GetCusAdrline1/2/3` | `CULINE1/2/3` | 50A (`ADRLINE`) | `:59-87` |
| `GetCusZip` | `CUZIP` | 10A (`ZIPCOD`) | `:89-97` |
| `GetCusCity` | `CUCITY` | 30A (`CITY`) | `:99-107` |
| `GetCusCountry` | `CUCOUN` | 2A (`COID`) — code, not name | `:109-117` |
| `GetCusLimCredit` | `CULIMCRE` | 9P 2 | `:119-127` |
| `GetCusCredit` | `CUCREDIT` | 9P 2 | `:129-137` |

Input for every getter: one parameter `5 0` passed `value` — `CUS300.RPGLE:21` and siblings; `CUSTOMER.RPGLEINC:8` etc. Field definitions: `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-29`, `ATU_SRC/QDDSSRC/SAMREF.PF:9-71`.

## Behaviour as implemented

1. Every getter body is identical in shape: `chainCUSTOME1(P_CUID); return <field>;` — no `%found` test, no error path, no message. — `CUS300.RPGLE:23-25` (pattern repeated through `:137`)
2. The returned value is the field in the `FCUST` record buffer of `CUSTOME1` (`if e k disk usropn`, module-global, so shared by all procedures in `CUS300`). — `CUS300.RPGLE:6`
3. Unknown id: `chainCUSTOME1` clears the buffer before the `CHAIN`, and a failed `CHAIN` leaves the buffer as cleared, so character getters return `*blanks` and numeric getters return `0`. Detail in `cus-modules-c04`. — `CUS300.RPGLE:180-184`
4. Same id as the previous call (any getter, `ExistCus`, or `IsCusDeleted`): no I/O; the cached record is returned. — `CUS300.RPGLE:180`
5. Columns **not** exposed by any getter: `CULASTORD` (dormant scaffold — `cus-modules-c10`, needs-SME), `CUCREA`, `CUMOD`, `CUMODID`, `CUDEL` (only via `ExistCus` / `IsCusDeleted`, `c02`/`c03`).
6. Country is returned as the 2-character code; callers needing the name go to `FCOUNTRY.GetCountryName` themselves (e.g. `CUS250`, documented in `cus-interactive-c10`).

## Validation rules found in code

None. The id is not range-checked or existence-checked; there is no authority or soft-delete filter on getters (a `CUDEL = 'X'` customer's data is returned like any other).

## Edge cases found in code

- **Blank/zero is ambiguous.** `GetCusMail(unknown)` and `GetCusMail(customer with no e-mail)` both return `*blanks`; `GetCusLimCredit(unknown)` and a genuine zero limit both return `0`. No observed caller distinguishes the two: `ORD100` calls `GetCusName(orcuid)` even after `SltCustomer(0)` was cancelled and `orcuid = 0` — the header just shows a blank name. — `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:321-328`; `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:283`
- **Stale reads.** Because of the last-key cache (`c04`) a second `GetCusName(7)` after another program updated customer 7 in the same activation group returns the old name. No invalidation entry point is exported (`c05`).
- **Prototype/implementation drift risk.** The include hard-codes return lengths (`30`, `15`, `12`, `50`, `10`, `2`, `9 2`) while the implementation uses `like(<field>)`; they agree with `SAMREF` today, but a `SAMREF` change would need the include edited by hand. — `CUSTOMER.RPGLEINC:7,12,17,22,27,42,47,52,57,62` vs `CUS300.RPGLE:20,30,40,50,60,90,100,110,120,130`
- Parameter names differ between prototype (`CUID`) and procedure interface (`P_CUID`); legal RPG, no behavioural effect. — `CUSTOMER.RPGLEINC:8` vs `CUS300.RPGLE:21`

## Export surface (folded `srvpgm-fcustomer` view)

- `STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('V1')` with 15 exports: `EXISTCUS`, the 11 getters above, `ISCUSDELETED`, `SLTCUSTOMER`. — `FCUSTOMER.BND:4-20`
- The signature is an explicit literal, so it does not change when the export list changes; existing callers keep binding to the same `'V1'` (ILE signature rule — system behaviour, not tested here).
- Not exported: `CLOSECUSTOME1` (`c05`), `chainCUSTOME1` (private helper, no prototype in the include), `GETCUSLASTORDDATE` (commented out, `c10`).
- Consumers found under `ATU_SRC`: `CUS250` (`SltCustomer`), `ORD100` (`SltCustomer`, `GetCusName`), `ORD101` (`GetCusName`). No caller of any other getter, of `ExistCus`, or of `IsCusDeleted` was found by structural grep. `ORD500`, `ORD200`, `ORD202` chain `CUSTOME1` directly instead.

## Dependencies

- `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` (`UNIQUE`, key `CUID`, `PFILE(CUSTOMER)`) — read-only open in `CUS300`
- `ATU_SRC/QDDSSRC/CUSTOMER.PF`, `ATU_SRC/QDDSSRC/SAMREF.PF` (field references)
- `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC`, `ATU_SRC/QSRVSRC/FCUSTOMER.BND`, `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM`, `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:12`

## Assumptions / unknowns

- Cache and open-file lifetime = the caller's activation group (`ACTGRP(*CALLER)`); observed callers compile with `dftactgrp(*no)` and no `ACTGRP` keyword (`CUS250.PGM.RPGLE:4`, `ORD100.PGM.RPGLE:7`, `ORD101.PGM.RPGLE:5`), so which activation group they share is a compile/runtime default — not confirmed here.
- Whether callers outside `ATU_SRC` use the other getters — needs-SME (recorded in `MANIFEST.yaml`).

## Evidence

`ATU_SRC/QRPGLESRC/CUS300.RPGLE:4-8,19-137,173-186` · `ATU_SRC/QPROTOSRC/CUSTOMER.RPGLEINC:7-63` · `ATU_SRC/QSRVSRC/FCUSTOMER.BND:4-20` · `ATU_SRC/QILESRVSRC/FCUSTOMER.ILESRVPGM:8-9` · `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:12` · `ATU_SRC/QDDSSRC/CUSTOMER.PF:5-29` · `ATU_SRC/QDDSSRC/CUSTOME1.LF:4-6` · `ATU_SRC/QRPGLESRC/ORD100.PGM.RPGLE:321-328` · `ATU_SRC/QRPGLESRC/ORD101.PGM.RPGLE:283`
