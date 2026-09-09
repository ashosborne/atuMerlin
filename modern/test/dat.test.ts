/**
 * DAT shared module (ISO_Num_To_Date / DAT001, ISOTODATE40 / DAT002, the date lock) at the
 * TypeScript boundary — pack atu-merlin-ts-dat-v1@1, WAIVED_PATHFINDER (no IBM i goldens; expected
 * values are derived from the cards, not recorded on the box). Cards: dat-utils-c01, c02, c04
 * (NULL in / pure), c05 (38I02 path), c06 (stateless), c07 (one sentinel rule), c08 (absent, never
 * stale). The SQL twins of the lock (`dat_iso_num_to_date`, `dat_date_to_iso_num`) are probed
 * through the same throw-away schema the other suites use.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  DatArgumentError,
  ISO_NUM_HIVAL,
  ISO_NUM_NONE,
  LEGACY_HIVAL_DATE,
  LEGACY_LOVAL_DATE,
  fromLegacyIsoNum,
  fromLegacySentinelDate,
  isoNumToDate,
  isoToDate40,
  testIsoNum,
  toLegacyIsoNum,
  toLegacySentinelDate,
} from "../src/shared/dat/index.js";
import { lastOrderDateOf } from "../src/features/customer/customer.service.js";
import { createTestDb, type TestDb } from "./helpers/db.js";

/** Valid yyyymmdd values across the accepted window (c01: years 0001-9999, no business range). */
const VALID: Array<[number, string]> = [
  [20240315, "2024-03-15"],
  [20240229, "2024-02-29"], // leap year
  [20000229, "2000-02-29"], // century leap year (divisible by 400)
  [19400101, LEGACY_LOVAL_DATE], // the sentinel typed as a number is just a date
  [20391231, LEGACY_HIVAL_DATE],
  [10101, "0001-01-01"], // leading zeros: 00010101
  [99991231, "9999-12-31"],
  [20231231, "2023-12-31"],
  [20240430, "2024-04-30"],
];

/** Values `test(de) *iso` rejects (c01 validation rules). */
const INVALID: number[] = [
  20240230, // day out of range for February
  20230229, // 29 February in a non-leap year
  19000229, // 1900 is not a leap year
  20241301, // month 13
  20240001, // month 00
  20240100, // day 00
  20240431, // 31 April
  101, // 00000101 -> year 0000
  99999998, // one below *HIVAL: not a sentinel, month 99
  -20240315, // DECIMAL(8,0) can be negative; not 0, not *HIVAL
  12345678, // 1234-56-78: month 56
];

describe("dat-utils-c01 — ISOTODATE40 / DAT002: 0 -> 1940-01-01, 99999999 -> 2039-12-31, invalid -> null", () => {
  it("maps the two sentinels by exact equality", () => {
    expect(isoToDate40(0)).toBe("1940-01-01");
    expect(isoToDate40(ISO_NUM_NONE)).toBe(LEGACY_LOVAL_DATE);
    expect(isoToDate40(99999999)).toBe("2039-12-31");
    expect(isoToDate40(ISO_NUM_HIVAL)).toBe(LEGACY_HIVAL_DATE);
    expect(isoToDate40(99999998)).toBeNull();
    expect(isoToDate40(-0)).toBe(LEGACY_LOVAL_DATE);
  });

  it.each(VALID)("converts a valid yyyymmdd %s -> %s (no business-window check)", (n, iso) => {
    expect(isoToDate40(n)).toBe(iso);
  });

  it.each(INVALID)("returns null for %s (the test(de) %error branch)", (n) => {
    expect(isoToDate40(n)).toBeNull();
  });

  it("the 2039-12-31 branch is carried as-is: it is a date, not a 'never' (known_risk, needs-SME)", () => {
    expect(fromLegacySentinelDate(isoToDate40(ISO_NUM_HIVAL))).toBe(LEGACY_HIVAL_DATE);
    // ORD200 / ORD201 compared `datclo > d'1940-01-01'` = already closed: 2039-12-31 counts as closed.
    expect(LEGACY_HIVAL_DATE > LEGACY_LOVAL_DATE).toBe(true);
  });
});

describe("dat-utils-c02 — ISO_Num_To_Date / DAT001: the same conversion without the sentinel block", () => {
  it("0 and 99999999 are just invalid ISO dates -> null", () => {
    expect(isoNumToDate(0)).toBeNull();
    expect(isoNumToDate(99999999)).toBeNull();
  });

  it.each(VALID)("agrees with ISOTODATE40 on every valid value (%s)", (n, iso) => {
    expect(isoNumToDate(n)).toBe(iso);
    expect(isoNumToDate(n)).toBe(isoToDate40(n));
  });

  it.each(INVALID)("agrees with ISOTODATE40 on every invalid value (%s)", (n) => {
    expect(isoNumToDate(n)).toBeNull();
  });

  it("differs from ISOTODATE40 on exactly the two sentinel inputs", () => {
    const differ = [0, 1, 99999998, 99999999, 20240315, -1].filter((n) => isoNumToDate(n) !== isoToDate40(n));
    expect(differ).toEqual([0, 99999999]);
  });
});

describe("dat-utils-c04 — interface contract: RETURNS NULL ON NULL INPUT, DETERMINISTIC, NO SQL", () => {
  it("null in -> null out without evaluating (the programs never see a NULL argument)", () => {
    expect(isoNumToDate(null)).toBeNull();
    expect(isoToDate40(null)).toBeNull();
    expect(fromLegacyIsoNum(null)).toBeNull();
  });

  it("is pure: repeated calls with the same argument give the same value (c06: nothing kept between rows)", () => {
    const first = [isoToDate40(20240315), isoToDate40(0), isoToDate40(20240230)];
    const second = [isoToDate40(20240315), isoToDate40(0), isoToDate40(20240230)];
    expect(second).toEqual(first);
    // c08: an invalid argument after a valid one yields an absent value, never the previous result.
    expect(isoToDate40(20240315)).toBe("2024-03-15");
    expect(isoToDate40(20240230)).toBeNull();
    expect(isoNumToDate(20240315)).toBe("2024-03-15");
    expect(isoNumToDate(0)).toBeNull();
  });
});

describe("dat-utils-c05 — error path: SQLSTATE 38I02 is an error, not a NULL row", () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, 20240315.5, 100000000, -100000000])(
    "an argument a DECIMAL(8,0) cannot hold (%s) raises DatArgumentError with sqlstate 38I02",
    (bad) => {
      for (const fn of [isoNumToDate, isoToDate40, fromLegacyIsoNum, testIsoNum]) {
        let caught: unknown;
        try {
          fn(bad);
        } catch (e) {
          caught = e;
        }
        expect(caught).toBeInstanceOf(DatArgumentError);
        expect((caught as DatArgumentError).sqlstate).toBe("38I02");
        expect((caught as DatArgumentError).dat8).toBe(bad);
      }
    },
  );

  it("the message is cut to the 70-character VARYING parameter", () => {
    let caught: DatArgumentError | undefined;
    try {
      toLegacyIsoNum("x".repeat(200));
    } catch (e) {
      caught = e as DatArgumentError;
    }
    expect(caught).toBeInstanceOf(DatArgumentError);
    expect(caught!.message.length).toBeLessThanOrEqual(70);
  });

  it("an invalid date is NOT the error path: it is a null result with no exception", () => {
    expect(() => isoToDate40(20240230)).not.toThrow();
    expect(isoToDate40(20240230)).toBeNull();
  });
});

describe("date lock (pack mapping rule, matches ORD) — null inside, 0 / 1940-01-01 only at the boundary", () => {
  it("boundary in, numeric: 0 -> null (never), valid -> ISO, invalid -> null", () => {
    expect(fromLegacyIsoNum(0)).toBeNull();
    expect(fromLegacyIsoNum(20240315)).toBe("2024-03-15");
    expect(fromLegacyIsoNum(20241301)).toBeNull();
    expect(fromLegacyIsoNum(99999999)).toBeNull(); // no 2039 sentinel inside the boundary
  });

  it("boundary out, numeric: null -> 0, ISO -> yyyymmdd (what ORD701 does inline for CULASTORD)", () => {
    expect(toLegacyIsoNum(null)).toBe(0);
    expect(toLegacyIsoNum("2024-03-15")).toBe(20240315);
    expect(toLegacyIsoNum("0001-01-01")).toBe(10101);
    expect(toLegacyIsoNum(LEGACY_LOVAL_DATE)).toBe(19400101); // a real 1940-01-01 date round-trips as a date
  });

  it("boundary out rejects a malformed or impossible ISO string (38I02 class, nothing invented)", () => {
    for (const bad of ["2024-02-30", "20240315", "2024-3-15", "", "2024-13-01"]) {
      expect(() => toLegacyIsoNum(bad)).toThrow(DatArgumentError);
    }
  });

  it("round-trips every valid value and never stores a sentinel", () => {
    for (const [n, iso] of VALID) {
      expect(toLegacyIsoNum(fromLegacyIsoNum(n))).toBe(n);
      expect(fromLegacyIsoNum(toLegacyIsoNum(iso))).toBe(iso);
    }
    expect(fromLegacyIsoNum(toLegacyIsoNum(null))).toBeNull();
    // The DAT002 presentation value must not leak into storage: strip it at the boundary first.
    expect(fromLegacySentinelDate(isoToDate40(0))).toBeNull();
    expect(toLegacyIsoNum(fromLegacySentinelDate(isoToDate40(0)))).toBe(0);
  });

  it("c07 — one sentinel rule: null <-> 1940-01-01 for legacy-shaped presentation only", () => {
    expect(toLegacySentinelDate(null)).toBe(LEGACY_LOVAL_DATE);
    expect(toLegacySentinelDate("2024-03-15")).toBe("2024-03-15");
    expect(fromLegacySentinelDate(LEGACY_LOVAL_DATE)).toBeNull();
    expect(fromLegacySentinelDate("2024-03-15")).toBe("2024-03-15");
    expect(fromLegacySentinelDate(null)).toBeNull();
    // DAT002 (SQL), CUS200 (explicit) and ORD202 (implicit) all reduce to this composition.
    expect(isoToDate40(0)).toBe(toLegacySentinelDate(fromLegacyIsoNum(0)));
    expect(isoToDate40(20240315)).toBe(toLegacySentinelDate(fromLegacyIsoNum(20240315)));
  });

  it("aligns with the CUS pack's CULASTORD presentation (cus-interactive-c07 / CR-6) without touching it", () => {
    const probe = [0, 20240315, 20241301, 20240229, 20230229, 19000229, 99999999, 19400101, 99991231, 1000101];
    for (const n of probe) {
      expect(fromLegacyIsoNum(n)).toBe(lastOrderDateOf(n));
    }
  });

  it("finding for the CUS pack, not fixed here: lastOrderDateOf rejects years 0001-0099 that test(de) *iso accepts", () => {
    // Date.UTC(1, 0, 1) reads year 1 as 1901, so the CUS helper's round-trip check fails for
    // 00010101 .. 00991231. DAT001 / DAT002 accept them (c01). Out-of-window either way; recorded
    // as CR-D3 in modern/README.md for the CUS pack to decide — features/customer/** is deny-listed.
    expect(fromLegacyIsoNum(10101)).toBe("0001-01-01");
    expect(lastOrderDateOf(10101)).toBeNull();
    expect(fromLegacyIsoNum(991231)).toBe("0099-12-31");
    expect(lastOrderDateOf(991231)).toBeNull();
    expect(fromLegacyIsoNum(1000101)).toBe(lastOrderDateOf(1000101));
  });
});

describe("date lock in SQL — dat_iso_num_to_date / dat_date_to_iso_num (additive, DAT section of db/schema.sql)", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await createTestDb();
  });
  afterAll(() => t.close());

  async function sqlIn(n: number | null): Promise<string | null> {
    const r = await t.db.query<{ d: string | null }>("SELECT dat_iso_num_to_date($1::integer) AS d", [n]);
    return r.rows[0]!.d;
  }
  async function sqlOut(d: string | null): Promise<number> {
    const r = await t.db.query<{ n: number }>("SELECT dat_date_to_iso_num($1::date) AS n", [d]);
    return r.rows[0]!.n;
  }

  it("agrees with the TypeScript lock on valid, invalid, sentinel and NULL inputs", async () => {
    for (const [n, iso] of VALID) expect(await sqlIn(n)).toBe(iso);
    for (const n of INVALID) expect(await sqlIn(n)).toBeNull();
    expect(await sqlIn(0)).toBeNull();
    expect(await sqlIn(99999999)).toBeNull();
    expect(await sqlIn(null)).toBeNull();
  });

  it("boundary out: NULL -> 0, date -> yyyymmdd — the same expression ORD701 uses inline", async () => {
    expect(await sqlOut(null)).toBe(0);
    expect(await sqlOut("2024-03-15")).toBe(20240315);
    expect(await sqlOut("0001-01-01")).toBe(10101);
    const r = await t.db.query<{ same: boolean }>(
      "SELECT dat_date_to_iso_num(DATE '2024-03-15') = to_char(DATE '2024-03-15', 'YYYYMMDD')::integer AS same",
    );
    expect(r.rows[0]!.same).toBe(true);
  });

  it("round-trips and is IMMUTABLE / STRICT as declared (c04 DETERMINISTIC, RETURNS NULL ON NULL INPUT)", async () => {
    for (const [n] of VALID) expect(await sqlOut(await sqlIn(n))).toBe(n);
    const r = await t.db.query<{ proname: string; provolatile: string; proisstrict: boolean }>(
      `SELECT proname, provolatile, proisstrict FROM pg_proc
       WHERE pronamespace = current_schema()::regnamespace
         AND proname IN ('dat_iso_num_to_date', 'dat_date_to_iso_num') ORDER BY proname`,
    );
    expect(r.rows).toEqual([
      { proname: "dat_date_to_iso_num", provolatile: "i", proisstrict: false },
      { proname: "dat_iso_num_to_date", provolatile: "i", proisstrict: true },
    ]);
  });
});
