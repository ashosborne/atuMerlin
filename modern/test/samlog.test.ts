/**
 * Shared logging / SAMLOG alignment at the TypeScript boundary — pack atu-merlin-ts-log-v1@1,
 * WAIVED_PATHFINDER (no IBM i goldens; expected values are derived from the cards, not recorded
 * on the box). Cards: log-programs-c02 (byte layout, decoder), c03 (AddLogEntry line contract),
 * c04 / c06 / c10 (user-space failure modes — tested as the deltas), c07 (ORD700 the only writer:
 * a trigger row and an addLogEntry row share table, actor rule and shape), c08 (one export).
 * The ORD feature itself is not exercised here beyond one direct DELETE on a fixture line, which
 * is what fires the trigger the LOG pack aligns with.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  ADDLOGENTRY_ENTRY_LENGTH,
  LEGACY_LINE_BUFFER_LENGTH,
  LEGACY_LINE_FIXED_LENGTH,
  LEGACY_LINE_TERMINATOR,
  LEGACY_WRITE_LENGTH,
  SAMLOG_HEADER_LENGTH,
  SAMLOG_INITIAL_SIZE,
  SAMLOG_USER_LENGTH,
  createSamlog,
  decodeSamlogUserSpace,
  formatLegacyLine,
  normaliseLogEntry,
  toRpgTimestamp,
  type Samlog,
  type SamlogRow,
} from "../src/shared/samlog/index.js";
import { createTestDb, type TestDb } from "./helpers/db.js";

let t: TestDb;
let log: Samlog;

beforeAll(async () => {
  t = await createTestDb();
  log = createSamlog(t.db);
});
afterAll(() => t.close());
beforeEach(() => t.reset());

async function rows(): Promise<SamlogRow[]> {
  const r = await t.db.query<SamlogRow>("SELECT id, logged_at, user_id, msg FROM samlog ORDER BY id");
  return r.rows;
}

/** A synthetic SAMLOG copy the way LOG100 + n AddLogEntry calls leave it (c01, c02, c03). */
function buildUserSpace(lines: string[], size = SAMLOG_INITIAL_SIZE): Buffer {
  const space = Buffer.alloc(size, 0);
  let pos = SAMLOG_HEADER_LENGTH;
  space.write("***", 4, "latin1");
  for (const line of lines) {
    const padded = line.padEnd(LEGACY_WRITE_LENGTH).slice(0, LEGACY_WRITE_LENGTH);
    space.write(padded, pos, "latin1");
    pos += line.length;
  }
  space.writeInt32BE(pos, 0);
  return space;
}

const RPG_TIMESTAMP = /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{6}$/;

describe("log-programs-c08 — the LOG service program exports one procedure", () => {
  it("createSamlog exposes exactly addLogEntry (init is not exported)", () => {
    expect(Object.keys(log)).toEqual(["addLogEntry"]);
  });
});

describe("log-programs-c03 — AddLogEntry appends one row to the shared samlog table", () => {
  it("writes the trimmed entry and the named user, returns nothing", async () => {
    await expect(log.addLogEntry("  ORD700:Order Line deleted 60001 1 article : ART001 quantity : 10   ", "ASH")).resolves.toBeUndefined();
    const [row] = await rows();
    expect(row.msg).toBe("ORD700:Order Line deleted 60001 1 article : ART001 quantity : 10");
    expect(row.user_id).toBe("ASH");
    expect(row.logged_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("defaults the actor to ord700_user(): atu.user on the transaction, else the database role", async () => {
    const client = await t.db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('atu.user', $1, true)", ["OPERATOR12"]);
      await client.query("INSERT INTO samlog (user_id, msg) VALUES (COALESCE($1, ord700_user()), $2)", [null, "in-transaction"]);
      await client.query("COMMIT");
    } finally {
      client.release();
    }
    await log.addLogEntry("outside any transaction");
    const r = await rows();
    expect(r.map((x) => x.msg)).toEqual(["in-transaction", "outside any transaction"]);
    expect(r[0].user_id).toBe("OPERATOR12");
    const role = (await t.db.query<{ u: string }>("SELECT current_user AS u")).rows[0].u;
    expect(r[1].user_id).toBe(role.slice(0, SAMLOG_USER_LENGTH));
  });

  it("cuts the user to 10 characters (User 10A) and keeps its case", async () => {
    await log.addLogEntry("x", "MixedCaseUserName");
    expect((await rows())[0].user_id).toBe("MixedCaseU");
  });

  it("entry is 500 by value: cut to 500, then %trim on both ends; only blanks are trimmed", async () => {
    const long = "A".repeat(ADDLOGENTRY_ENTRY_LENGTH + 40);
    await log.addLogEntry(long, "U");
    await log.addLogEntry("\t tabbed \t", "U");
    const r = await rows();
    expect(r[0].msg).toHaveLength(ADDLOGENTRY_ENTRY_LENGTH);
    expect(r[1].msg).toBe("\t tabbed \t");
    expect(normaliseLogEntry("   ")).toBe("");
    expect(normaliseLogEntry(" a b ")).toBe("a b");
    expect(normaliseLogEntry(" ".repeat(499) + "Z" + "Q")).toBe("Z");
  });

  it("an empty or blank entry still writes a row (no validation in LOG300)", async () => {
    await log.addLogEntry("", "U");
    await log.addLogEntry("     ", "U");
    expect((await rows()).map((x) => x.msg)).toEqual(["", ""]);
  });
});

describe("log-programs-c03 — the legacy line string is reproducible from a row", () => {
  const row = { user_id: "ASH", logged_at: "2026-09-09T09:15:00.123456", msg: "ORD700:Order Line deleted 123 1 article : ART001 quantity : 10" };

  it("'User: ' + User(10, blank-padded) + ' * Date: ' + 26-char timestamp + ' * Msg: ' + msg + ' ***'", () => {
    expect(formatLegacyLine(row)).toBe(
      "User: ASH        * Date: 2026-09-09-09.15.00.123456 * Msg: ORD700:Order Line deleted 123 1 article : ART001 quantity : 10 ***",
    );
    expect(formatLegacyLine(row)).toHaveLength(LEGACY_LINE_FIXED_LENGTH + row.msg.length);
  });

  it("the fixed part is 63 bytes and the terminator is the only delimiter", () => {
    const line = formatLegacyLine({ ...row, msg: "" });
    expect(line).toHaveLength(LEGACY_LINE_FIXED_LENGTH);
    expect(line.endsWith(LEGACY_LINE_TERMINATOR)).toBe(true);
    expect(line).not.toContain("\n");
  });

  it("User is written blank-padded to 10, never trimmed; a 10-character user fills the field", () => {
    expect(formatLegacyLine({ ...row, user_id: "OPERATOR12" }).startsWith("User: OPERATOR12 * Date: ")).toBe(true);
    expect(formatLegacyLine({ ...row, user_id: "" }).startsWith("User:            * Date: ")).toBe(true);
  });

  it("the 500-byte varying buffer cuts a message over 437 characters and drops the terminator (as-is)", () => {
    const at437 = formatLegacyLine({ ...row, msg: "M".repeat(437) });
    expect(at437).toHaveLength(LEGACY_LINE_BUFFER_LENGTH);
    expect(at437.endsWith(LEGACY_LINE_TERMINATOR)).toBe(true);
    const at438 = formatLegacyLine({ ...row, msg: "M".repeat(438) });
    expect(at438).toHaveLength(LEGACY_LINE_BUFFER_LENGTH);
    expect(at438.endsWith(LEGACY_LINE_TERMINATOR)).toBe(false);
    expect(at438.endsWith("M **")).toBe(true);
  });

  it("toRpgTimestamp renders %char(%timestamp()): pool text, Postgres text and Date", () => {
    expect(toRpgTimestamp("2026-09-09T09:15:00.123456")).toBe("2026-09-09-09.15.00.123456");
    expect(toRpgTimestamp("2026-09-09 09:15:00.5")).toBe("2026-09-09-09.15.00.500000");
    expect(toRpgTimestamp("2026-09-09T09:15:00")).toBe("2026-09-09-09.15.00.000000");
    expect(toRpgTimestamp(new Date(2026, 8, 9, 9, 15, 0, 123))).toBe("2026-09-09-09.15.00.123000");
    expect(() => toRpgTimestamp("09/09/2026")).toThrow(/not a timestamp/);
  });

  it("a row written by addLogEntry formats to a 26-character Date without a stored string", async () => {
    await log.addLogEntry("hello", "ASH");
    const [row] = await rows();
    const line = formatLegacyLine(row);
    const date = line.slice("User: ASH        * Date: ".length, "User: ASH        * Date: ".length + 26);
    expect(date).toMatch(RPG_TIMESTAMP);
    expect(line).toBe(`User: ASH        * Date: ${date} * Msg: hello ***`);
  });
});

describe("log-programs-c07 — ORD700 is the only writer; the trigger row and an addLogEntry row are one shape", () => {
  it("a DETORD delete (trigger) and addLogEntry arrive in the same table with the same actor rule", async () => {
    // Fixture rows written directly (no ORD feature code): one header, one line on a seeded article.
    const line = { odorid: 60001, odline: 1, odarid: "A00001", odqty: 4 };
    await t.db.query("INSERT INTO orders (orid, orcuid, ordate) VALUES ($1, 1001, CURRENT_DATE)", [line.odorid]);
    await t.db.query("INSERT INTO detord (odorid, odline, odarid, odqty) VALUES ($1, $2, $3, $4)", [line.odorid, line.odline, line.odarid, line.odqty]);
    expect(await rows()).toEqual([]); // ORD700 event '1' (insert) logs nothing (c07)

    const client = await t.db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('atu.user', $1, true)", ["ASH"]);
      await client.query("DELETE FROM detord WHERE odorid = $1 AND odline = $2", [line.odorid, line.odline]);
      await client.query("COMMIT");
    } finally {
      client.release();
    }
    await log.addLogEntry(`ORD700:Order Line deleted ${line.odorid} ${line.odline} article : ${line.odarid.padEnd(6)} quantity : ${line.odqty}`, "ASH");

    const r = await rows();
    expect(r).toHaveLength(2);
    expect(r[0].msg).toBe(r[1].msg);
    expect(r[0].user_id).toBe("ASH");
    expect(r[1].user_id).toBe("ASH");
    expect(formatLegacyLine(r[0]).replace(/Date: .{26}/, "Date: <ts>")).toBe(formatLegacyLine(r[1]).replace(/Date: .{26}/, "Date: <ts>"));
  });

  it("the shared writer does not touch the ORD side effects: no article change, no second trigger", async () => {
    const before = await t.db.query<{ n: number }>("SELECT SUM(arcusqty)::int AS n FROM article");
    await log.addLogEntry("ORD700:Order Line deleted 1 1 article : ART001 quantity : 10", "ASH");
    const after = await t.db.query<{ n: number }>("SELECT SUM(arcusqty)::int AS n FROM article");
    expect(after.rows[0].n).toBe(before.rows[0].n);
    expect((await rows()).length).toBe(1);
  });
});

describe("log-programs-c02 / c09 — the SAMLOG byte layout as a decoder (no migration performed)", () => {
  const lines = [
    "User: ASH        * Date: 2026-09-09-09.15.00.000001 * Msg: first ***",
    "User: ASH        * Date: 2026-09-09-09.15.00.000002 * Msg: second ***",
  ];

  it("reads pos at 0 (big-endian), '***' at 4, splits bytes 7..pos-1 on ' ***'", () => {
    const space = buildUserSpace(lines);
    expect(space.readInt32BE(0)).toBe(SAMLOG_HEADER_LENGTH + lines[0].length + lines[1].length);
    const d = decodeSamlogUserSpace(space);
    expect(d.pos).toBe(7 + lines[0].length + lines[1].length);
    expect(d.headerMarker).toBe(true);
    expect(d.lines).toEqual(lines.map((l) => l.slice(0, -LEGACY_LINE_TERMINATOR.length)));
    expect(d.tail).toBe("");
  });

  it("a fresh LOG100 space (pos = 7) decodes to no lines; the 600-byte blank pad past pos is ignored", () => {
    const fresh = buildUserSpace([]);
    expect(decodeSamlogUserSpace(fresh)).toEqual({ pos: 7, headerMarker: true, lines: [], tail: "" });
    const one = buildUserSpace([lines[0]]);
    expect(one.subarray(7 + lines[0].length, 7 + LEGACY_WRITE_LENGTH).toString("latin1")).toBe(" ".repeat(LEGACY_WRITE_LENGTH - lines[0].length));
    expect(decodeSamlogUserSpace(one).lines).toHaveLength(1);
  });

  it("a line cut by the 500-byte buffer (no terminator) surfaces as the tail, not as a line", () => {
    const cut = formatLegacyLine({ user_id: "ASH", logged_at: "2026-09-09T09:15:00", msg: "M".repeat(450) });
    const d = decodeSamlogUserSpace(buildUserSpace([lines[0], cut]));
    expect(d.lines).toHaveLength(1);
    expect(d.tail).toBe(cut);
  });

  it("round trip: rows -> formatLegacyLine -> user space -> decoder gives the rows' lines back", async () => {
    await log.addLogEntry("first", "ASH");
    await log.addLogEntry("second", "ASH");
    const formatted = (await rows()).map(formatLegacyLine);
    const d = decodeSamlogUserSpace(buildUserSpace(formatted));
    expect(d.lines.map((l) => l + LEGACY_LINE_TERMINATOR)).toEqual(formatted);
  });

  it("refuses a copy shorter than the header or a pos outside the copy (no lower/upper bound on the box)", () => {
    expect(() => decodeSamlogUserSpace(Buffer.alloc(6))).toThrow(/header/);
    const bad = buildUserSpace([]);
    bad.writeInt32BE(SAMLOG_INITIAL_SIZE + 1, 0);
    expect(() => decodeSamlogUserSpace(bad)).toThrow(/outside/);
    bad.writeInt32BE(0, 0);
    expect(() => decodeSamlogUserSpace(bad)).toThrow(/outside/);
  });

  it("text decoding and terminator are injectable for a copy in another encoding", () => {
    const upper = decodeSamlogUserSpace(buildUserSpace(lines), { text: (b) => b.toString("latin1").toUpperCase() });
    expect(upper.lines[0].startsWith("USER: ASH")).toBe(true);
    const odd = Buffer.alloc(64, 0);
    odd.write("***", 4, "latin1");
    odd.write("a##b##", 7, "latin1");
    odd.writeInt32BE(13, 0);
    expect(decodeSamlogUserSpace(odd, { terminator: Buffer.from("##", "latin1") }).lines).toEqual(["a", "b"]);
  });
});

describe("log-programs-c04 / c06 / c10 — user-space failure modes have no table counterpart (deltas)", () => {
  it("c04: forty ORD700-sized lines are all kept — no 5000-byte capacity, no silent permanent stop", async () => {
    const msg = "ORD700:Order Line deleted 60001 1 article : ART001 quantity : 10";
    for (let i = 0; i < 40; i++) await log.addLogEntry(msg, "ASH");
    const r = await rows();
    expect(r).toHaveLength(40);
    const bytesLegacyWouldNeed = SAMLOG_HEADER_LENGTH + 39 * (LEGACY_LINE_FIXED_LENGTH + msg.length) + LEGACY_WRITE_LENGTH;
    expect(bytesLegacyWouldNeed).toBeGreaterThan(SAMLOG_INITIAL_SIZE);
  });

  it("c06: the log exists after applySchema — no install step, no never-created state, first call succeeds", async () => {
    const exists = await t.db.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_name = 'samlog' AND table_schema = current_schema()");
    expect(exists.rows[0].n).toBe(1);
    await log.addLogEntry("first call in this job", "ASH");
    expect((await rows())[0].msg).toBe("first call in this job");
  });

  it("c10: concurrent appends are all kept in order of commit — no shared cursor, no lost line", async () => {
    await Promise.all(Array.from({ length: 25 }, (_, i) => log.addLogEntry(`line ${i}`, "JOB" + (i % 2))));
    const r = await rows();
    expect(r).toHaveLength(25);
    expect(new Set(r.map((x) => x.msg)).size).toBe(25);
    expect(r.map((x) => x.id)).toEqual([...r.map((x) => x.id)].sort((a, b) => a - b));
  });
});

describe("LOG section of db/schema.sql — additive only", () => {
  it("samlog keeps the ORD pack's shape (id, logged_at, user_id varchar(10), msg text) and carries the LOG comments", async () => {
    const cols = await t.db.query<{ column_name: string; data_type: string; character_maximum_length: number | null }>(
      "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'samlog' AND table_schema = current_schema() ORDER BY ordinal_position",
    );
    expect(cols.rows).toEqual([
      { column_name: "id", data_type: "bigint", character_maximum_length: null },
      { column_name: "logged_at", data_type: "timestamp without time zone", character_maximum_length: null },
      { column_name: "user_id", data_type: "character varying", character_maximum_length: SAMLOG_USER_LENGTH },
      { column_name: "msg", data_type: "text", character_maximum_length: null },
    ]);
    const comment = await t.db.query<{ c: string | null }>("SELECT obj_description(to_regclass(current_schema() || '.samlog'), 'pg_class') AS c");
    expect(comment.rows[0].c).toContain("atu-merlin-ts-log-v1");
  });
});
