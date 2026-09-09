# cus-interactive-c04 — Customer validation rules (FMT02 check)

| | |
| --- | --- |
| Slice | `cus-interactive` |
| Status | `documented` (as-is behaviour card, Phase B) |
| Confidence | `observed-in-code` |
| Bind | accept — room bind 2026-09-08 (`BIND.md`) |
| Characterization | deferred-waived (no IBM i runtime; documented from source only) |

## Summary

On Enter from `FMT02` (create or update), `S02chk` applies four rules — country must exist, name mandatory, phone mandatory and digits-only, no duplicate `UPPER(name)+phone` — sets one DDS error indicator per failure and redisplays; all other fields are stored unvalidated.

## Entrypoints

- `S02key` `other` → `step02 = chk` → `S02chk` — `ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:285-287,290-319`
- Error rendering: `FMT02` `ERRMSG`/`ERRMSGID` keywords — `ATU_SRC/QDDSSRC/CUS200D.DSPF:105-109,115-117,131-132`

## Inputs / outputs / observables

| Rule | Code | Indicator | Message | Source of text |
| --- | --- | --- | --- | --- |
| Country code must exist in `COUNTRY` | `if not ExistCountry(cucoun)` | 40 `ErrCountry` | `ERR0002` "Country code unknown. Press F4 to select." | `SAMMSGF.MSGF:11-12`, `CUS200D.DSPF:132` |
| Name mandatory | `if custnm = *blanks` | 41 `ErrName` | DDS literal "The name is mandatory" | `CUS200D.DSPF:106` |
| Phone mandatory | `if cuphone = *blanks` | 43 `ErrPhone` | `ERR2001` "A phone number is mandatory" | `SAMMSGF.MSGF:29-30`, `CUS200D.DSPF:116` |
| Phone digits only | `%check('0123456789' : %trim(cuphone)) > 0` | 44 `ErrPhoneNum` | `ERR2002` "Phone number must contain only numbers" | `SAMMSGF.MSGF:31-32`, `CUS200D.DSPF:117` |
| No duplicate name+phone | `select count(*) … where UPPER(custnm) = UPPER(:custnm) and cuphone = :cuphone`; fail if `CRT and dup > 0` or `UPD and dup > 1` | 42 `ErrDup` | `ERR2000` "Customer &1 /Phone &2 Already Exist" with `ERRDATA = custnm + cuphone` | `SAMMSGF.MSGF:27-28`, `CUS200D.DSPF:107-110` |

All indicators live in the `INDDS` (`INDARA`) — `CUS200.PGM.SQLRPGLE:40-60`, `CUS200D.DSPF:7`.

## Behaviour as implemented

1. `step02 = act` is set first; each failing rule flips it back to `dsp`, so **all rules are evaluated in one pass** and several errors can show together. — `:291-317`
2. Phone checks are nested: mandatory first; only if non-blank is the value trimmed, checked for digits, and then used in the duplicate query. A blank phone therefore skips the duplicate check entirely. — `:300-317`
3. `cuphone = %trim(cuphone)` **mutates the field**: the stored `CUPHONE` is left-adjusted, leading blanks removed. — `:304`
4. Duplicate query runs against the physical `CUSTOMER` via embedded SQL (not the LF), case-insensitive on name via `UPPER`, exact on phone. Fixed-length CHAR comparison in SQL ignores trailing blanks. — `:309-311`
5. Error indicators are turned off by the display file on the next input because each `ERRMSG`/`ERRMSGID` names the same indicator as its response indicator; the program never resets 40-44 itself. — `CUS200D.DSPF:106-108,116-117,132`
6. `ERRDATA` (45A, program-to-system) carries `custnm + cuphone` (30 + 15) for `ERR2000` substitution `&1 &2` (`FMT (*CHAR 30) (*CHAR 15)`). — `:313`, `CUS200D.DSPF:110`, `SAMMSGF.MSGF:27-28`

## Validation rules found in code

As tabulated above. **Fields with no validation at all:** `CUVAT`, `CUMAIL`, `CULINE1..3`, `CUZIP`, `CUCITY`, `CULIMCRE` (sign and range unchecked). — `CUS200D.DSPF:114-137`, `:290-319`

## Edge cases found in code

- **Update-mode duplicate gap.** `dup` counts stored rows matching the *new* name+phone. The customer's own stored row still has its *old* values while editing, so changing name+phone to collide with exactly one other customer yields `dup = 1`, which passes (`dup > 1` required in `UPD`). The `UPD` threshold only works when the values are unchanged (self counted). Static derivation from `:309-312`; not runtime-confirmed.
- Operator precedence: `mode = CRT and dup > 0 or mode = UPD and dup > 1` — RPG evaluates `and` before `or`, so the expression is `(CRT ∧ dup>0) ∨ (UPD ∧ dup>1)`, as intended. — `:312`
- Digits-only check runs on `%trim(cuphone)`, so internal blanks or `+`, `-`, `(`, `)` fail; international prefixes cannot be entered. — `:305`
- Name check is on `*blanks` only; a name of all blanks fails but `.` or a single character passes. Name case is preserved (`CHECK(LC)`) but compared case-insensitively for duplicates. — `:296`, `CUS200D.DSPF:105-109`
- Country check uses `FCOUNTRY.ExistCountry` → `%found` on `COUNTRY` by exact 2-char code; blank country fails (unless a blank-coded country row exists). — `ATU_SRC/QRPGLESRC/COU300.RPGLE:40-48`
- Stored `CUPHONE` values written by other paths (e.g. `ORD901` data refresh, external loads) with leading blanks would escape the duplicate match — carried from Phase A as an SME/data question.

## Dependencies

- `FCOUNTRY.ExistCountry` — `ATU_SRC/QPROTOSRC/COUNTRY.RPGLEINC:17-18`, `COU300.RPGLE:40-63`; bound via `BNDDIR('SAMPLE')` — `CUS200.PGM.SQLRPGLE:26`, `ATU_SRC/QBNDSRC/SAMPLE.BNDDIR:8-14`
- `SAMMSGF.MSGF` (`ERR0002`, `ERR2000`, `ERR2001`, `ERR2002`) resolved `*LIBL` at display time.
- `CUSTOMER.PF` (SQL table for the duplicate query).

## Assumptions / unknowns

- SQL `UPPER` behaviour on the job CCSID (message file is CCSID 297 / French) is runtime configuration.
- Whether the update-mode duplicate gap is a known/accepted defect — **needs-SME** (documented as-is; not fixed, not redesigned).

## Evidence

`ATU_SRC/QRPGLESRC/CUS200.PGM.SQLRPGLE:26,40-60,285-319` · `ATU_SRC/QDDSSRC/CUS200D.DSPF:7,105-117,131-132` · `ATU_SRC/QMSGFSRC/SAMMSGF.MSGF:11-12,27-32` · `ATU_SRC/QRPGLESRC/COU300.RPGLE:40-63`
