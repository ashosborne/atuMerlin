# CANDIDATES — cus-modules (Phase A, unbound)

Seed: FCUSTOMER modules `CUS300` (getters) + `CUS301` (`SltCustomer` selection window). All rows `candidate`.

| id | provisional name | evidence | confidence | why it belongs |
| --- | --- | --- | --- | --- |
| cus-modules-c01 | Customer getter family (11 procedures) returning one CUSTOMER column each by CUID | `QRPGLESRC/CUS300.RPGLE:19-137` (GetCusName, Phone, Vat, Mail, Adrline1-3, Zip, City, Country, LimCredit, Credit), `QPROTOSRC/CUSTOMER.RPGLEINC:8-56`, `QSRVSRC/FCUSTOMER.BND:5-17` | observed-in-code | The callable API of the seam |
| cus-modules-c02 | `ExistCus` = found and not soft-deleted | `CUS300.RPGLE:152-160` (`%found and CUDEL <> 'X'`) | observed-in-code | Used as validation primitive elsewhere |
| cus-modules-c03 | `IsCusDeleted` = `CUDEL = 'X'` | `CUS300.RPGLE:163-171` | observed-in-code | Soft-delete semantics |
| cus-modules-c04 | Lazy-open + last-key cache in `chainCUSTOME1` (skips chain if same CUID; returns stale/cleared buffer otherwise) | `CUS300.RPGLE:173-186` (`if not %open… open`, `if P_CUID <> CUID … clear *all FCUST; chain`) | observed-in-code | Subtle: getters for a missing id return blanks/zero, not an error |
| cus-modules-c05 | `CloseCUSTOME1` prototyped but not exported by FCUSTOMER | `CUS300.RPGLE:188-195`, `CUSTOMER.RPGLEINC:54-56` vs `QSRVSRC/FCUSTOMER.BND:5-17` (no CLOSECUSTOME1) | observed-in-code | Binding gap: file stays open for activation-group lifetime |
| cus-modules-c06 | `SltCustomer` selection window: dynamic SQL `LIKE` on name and/or city, `ORDER BY CUSTNM`, 14 rows/page, returns chosen CUID or default | `QRPGLESRC/CUS301.SQLRPGLE:54-124` (statement build), `:126-144` (page load), `:211-227` (return cuid), `QDDSSRC/CUS301D.DSPF:24-37` | observed-in-code | Shared prompt used by CUS250 and ORD100 |
| cus-modules-c07 | Selection rules: only option 1 valid; exactly one selection; errors reverse-imaged (`INVALID OPTION`, `ONLY ONE SELECTION`) | `CUS301.SQLRPGLE:168-209`, `CUS301D.DSPF:35-36` | observed-in-code | Screen contract |
| cus-modules-c08 | Changing search criteria re-prepares the cursor; F3/F12 return the input default unchanged | `CUS301.SQLRPGLE:214-216`, `:157-160`, `:75`, `:93` | observed-in-code | Edge behaviour for characterization |
| cus-modules-c09 | Dynamic SQL built by string concatenation of user-entered search text (injection surface) | `CUS301.SQLRPGLE:103-115`, `:119-121` (`prepare s1 from :stm`) | observed-in-code | Risk finding, not a feature — SME to decide whether to preserve semantics or parameterise |
| cus-modules-c10 | Dormant `GetCusLastOrdDate` (commented "remove the comment to test the addition of a function") | `CUS300.RPGLE:139-150`, `CUSTOMER.RPGLEINC:37-40` | inferred (training scaffold) | Should be **rejected** as behaviour; recorded so nobody "discovers" it later |
| cus-modules-c11 | `SltCustomer` when name and city both blank → statement falls into city branch with `LIKE '%%'` (matches all) | `CUS301.SQLRPGLE:104-114` (else branch) | observed-in-code | Default listing semantics |

## Overlap with other seeds

- `srvpgm-fcustomer` (queue #22) is the *binding/export* view of the same code. Recommend at bind time: fold `srvpgm-fcustomer` into this slice (export list = c01/c02/c03/c06 + `EXISTCUS`/`ISCUSDELETED` symbols) rather than two slices over the same 2 modules.

## Deferred recommendations (prose only)

- c10 → reject.
- c09 → keep as a **risk note** on c06 rather than a separate behaviour if SME prefers fewer cards.
