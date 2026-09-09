#!/usr/bin/env node
// Independent COMPARE probe at the TypeScript boundary — pack atu-merlin-ts-log-v1@1, WAIVED_PATHFINDER.
// Oracle = Discovery cards (discovery/log-programs/features c01..c10) + modern/README.md (LOG section).
// NOT IBM i goldens: nothing here is a claim of parity against the box.
//
// The oracles are written from the cards and the cited source lines, not copied from the module or
// its vitest suite:
//  - c02 / c03 / c04 / c10: LOG100 + LOG300 are replayed in JavaScript as a byte machine over a
//    user space — 7-byte header (big-endian `pos` at 0, '***' at 4), `entry 500A value` through
//    `%trim` (blanks only, both ends), the line built in a `500 varying` field, a 600-byte fixed
//    write at `p1 + pos` that fails (MCH0601) when `pos + 600 > size` BEFORE `pos` is advanced,
//    `pos += %len(data2)` on success, and an unlocked read-modify-write of `pos` (c10).
//    The module is compared with it on the line string, the stored message, the decoder's output
//    over the machine's bytes, and — where the module deliberately differs (CR-L5 capacity,
//    CR-L8 concurrency) — the delta is observed as such.
//  - c07: the ORD700 message is rebuilt from ORD700.PGM.RPGLE:78-81 (%char of the packed fields,
//    ODARID untrimmed at 6) and compared with what the ORD trigger writes AND with what the LOG
//    module writes for the same event.
//  - c03 `%char(%timestamp())`: the 26-character ISO form from components, over rows the database
//    hands back.
//
//   cd modern && ./scripts/local-pg.sh start
//   DATABASE_URL=$(./scripts/local-pg.sh url) npx tsx ../verification/log-vertical/<RUN_ID>/evidence/probe.mjs
//
// Writes results.json next to this file. Needs a live DATABASE_URL (the module is probed against a
// throw-away schema built and seeded by modern/test/helpers/db.ts and dropped at the end).

import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { randomBytes } from "node:crypto";
import * as samlogModule from "../../../../modern/src/shared/samlog/index.ts";
import { createTestDb } from "../../../../modern/test/helpers/db.ts";
import { buildApp } from "../../../../modern/src/app.ts";

const { createSamlog, normaliseLogEntry, formatLegacyLine, toRpgTimestamp, decodeSamlogUserSpace } = samlogModule;

const here = dirname(fileURLToPath(import.meta.url));
const modernRoot = join(here, "../../../../modern");
const results = [];

function record(id, card, name, pass, detail) {
  results.push({ id, card, name, pass: Boolean(pass), detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${name}${pass ? "" : "  <-- " + JSON.stringify(detail).slice(0, 800)}`);
}
function randInt(min, max) {
  const span = max - min + 1;
  return min + (randomBytes(6).readUIntBE(0, 6) % span);
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function same(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
const MSG_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :*-./";
function randStr(maxLen, chars = MSG_CHARS, minLen = 0) {
  const n = randInt(minLen, maxLen);
  let s = "";
  for (let i = 0; i < n; i++) s += chars[randInt(0, chars.length - 1)];
  return s;
}

// --- Oracle 1: RPG fixed-length alpha and %trim (c03: `entry 500A value`, `User 10`, %trim blanks only) ---
/** Assignment into a fixed-length alpha field: cut on the right, pad with blanks. */
function fixedAlpha(value, len) {
  return value.slice(0, len).padEnd(len, " ");
}
/** `%trim` with no character list removes blanks (X'40' — here ' ') from both ends and nothing else. */
function rpgTrim(s) {
  return s.replace(/^ +/, "").replace(/ +$/, "");
}
/** `%char(%timestamp())` on the box: `YYYY-MM-DD-HH.MM.SS.UUUUUU` (26 characters). */
function rpgTimestamp(y, mo, d, h, mi, s, micro) {
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(y, 4)}-${p(mo)}-${p(d)}-${p(h)}.${p(mi)}.${p(s)}.${p(micro, 6)}`;
}

// --- Oracle 2: LOG300.AddLogEntry line (c03, LOG300.RPGLE:20,22,28-30) --------------------------------
const LINE_FIXED = 6 + 10 + 3 + 6 + 26 + 3 + 5 + 4; // 63 (card c03)
function legacyLine(user, ts26, entry) {
  const trimmed = rpgTrim(fixedAlpha(entry, 500)); // the 500A by-value parameter through %trim
  let data2 = "User: " + fixedAlpha(user, 10) + " * ";
  data2 += "Date: " + ts26 + " * ";
  data2 += "Msg: " + trimmed + " ***";
  return data2.slice(0, 500); // `data2 500 varying`
}

// --- Oracle 3: the SAMLOG user space as LOG100 + LOG300 leave it (c01, c02, c03, c04, c10) -------------
const HEADER = 7;
const WRITE = 600;
function legacyUserSpace(size = 5000, encode = (s) => Buffer.from(s, "latin1")) {
  const space = Buffer.alloc(size, 0); // QUSCRTUS initial value X'00' (c01)
  space.writeInt32BE(HEADER, 0); // pos = 7
  encode("***").copy(space, 4); // data = '***'
  const written = [];
  let failures = 0;
  const machine = {
    space,
    written,
    get pos() {
      return space.readInt32BE(0);
    },
    get failures() {
      return failures;
    },
    /** One AddLogEntry call as LOG300.RPGLE:27-32. */
    add(entry, user, ts26) {
      const line = legacyLine(user, ts26, entry);
      const pos = space.readInt32BE(0); // p2 = p1 + pos
      if (pos + WRITE > size) {
        failures++; // `data = data2` addresses storage beyond the object (c04) — pos NOT advanced
        return { ok: false, line, pos };
      }
      const bytes = encode(line);
      Buffer.alloc(WRITE, encode(" ")[0]).copy(space, pos); // 600-byte fixed field, blank-padded
      bytes.copy(space, pos);
      space.writeInt32BE(pos + bytes.length, 0); // pos += %len(data2)
      written.push(line);
      return { ok: true, line, pos };
    },
    /**
     * Two AddLogEntry calls interleaved as c10 "Interleaving A" (A27 B27 A31 A32 B31 B32): both read
     * the same pos, A writes, A increments, B writes at the SAME pos (overwriting A), B increments.
     */
    addRaced(entryA, userA, entryB, userB, ts26) {
      const la = legacyLine(userA, ts26, entryA);
      const lb = legacyLine(userB, ts26, entryB);
      const pos = space.readInt32BE(0);
      if (pos + WRITE > size) {
        failures += 2;
        return { ok: false };
      }
      const put = (line) => {
        Buffer.alloc(WRITE, encode(" ")[0]).copy(space, pos);
        encode(line).copy(space, pos);
      };
      put(la); // A31
      space.writeInt32BE(space.readInt32BE(0) + la.length, 0); // A32
      put(lb); // B31 — at the stale pos
      space.writeInt32BE(space.readInt32BE(0) + lb.length, 0); // B32 — relative increment
      written.push(la, lb);
      return { ok: true, lost: la, kept: lb };
    },
  };
  return machine;
}
/** The reader rule c09 spells out, applied to raw bytes: offset 0 = bytes used, take 7 .. pos-1, split on ' ***'. */
function readerRule(space, decode = (b) => b.toString("latin1"), terminator = Buffer.from(" ***", "latin1")) {
  const pos = space.readInt32BE(0);
  const body = space.subarray(HEADER, pos);
  const out = [];
  let from = 0;
  for (;;) {
    const at = body.indexOf(terminator, from);
    if (at === -1) break;
    out.push(decode(body.subarray(from, at)));
    from = at + terminator.length;
  }
  return { pos, lines: out, tail: decode(body.subarray(from)) };
}

// --- Oracle 4: the ORD700 message (c07, ORD700.PGM.RPGLE:78-81) ---------------------------------------
/** `%char` of a packed/zoned numeric: digits, no leading zeros, '-' only when negative. `old.odarid` is 6A, untrimmed. */
function ord700Message(odorid, odline, odarid, odqty) {
  return `ORD700:Order Line deleted ${String(odorid)} ${String(odline)} article : ${fixedAlpha(odarid, 6)} quantity : ${String(odqty)}`;
}

// --- EBCDIC CP037 for the line charset (used only to exercise the c02 "runtime CCSID" note) ------------
const EBCDIC_PUNCT = { " ": 0x40, "*": 0x5c, ":": 0x7a, "-": 0x60, ".": 0x4b, "/": 0x61 };
function ebcdicByte(ch) {
  if (ch in EBCDIC_PUNCT) return EBCDIC_PUNCT[ch];
  const c = ch.charCodeAt(0);
  if (c >= 0x30 && c <= 0x39) return 0xf0 + (c - 0x30);
  const lower = ch.toLowerCase();
  const isUpper = ch !== lower;
  const i = lower.charCodeAt(0) - 0x61;
  if (i < 0 || i > 25) throw new Error(`no CP037 byte for ${JSON.stringify(ch)}`);
  let b;
  if (i <= 8) b = 0x81 + i;
  else if (i <= 17) b = 0x91 + (i - 9);
  else b = 0xa2 + (i - 18);
  return isUpper ? b + 0x40 : b;
}
const EBCDIC_TO_CHAR = new Map();
for (const ch of MSG_CHARS + ":*-./") EBCDIC_TO_CHAR.set(ebcdicByte(ch), ch);
const ebcdicEncode = (s) => Buffer.from([...s].map(ebcdicByte));
const ebcdicDecode = (b) => [...b].map((x) => EBCDIC_TO_CHAR.get(x) ?? "\uFFFD").join("");

// --- Setup ------------------------------------------------------------------------------------------

const t = await createTestDb();
const log = createSamlog(t.db);
const app = await buildApp({ db: t.db });
await app.ready();

async function rows() {
  return (await t.db.query("SELECT id, logged_at, user_id, msg FROM samlog ORDER BY id")).rows;
}
async function clearLog() {
  await t.db.query("TRUNCATE samlog");
}
async function role() {
  return (await t.db.query("SELECT current_user AS u")).rows[0].u;
}
async function http(method, url, payload) {
  const res = await app.inject({ method, url, payload });
  return { status: res.statusCode, body: res.body };
}
const RPG_TS = /^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{6}$/;
const TS_FIXED = "2026-09-09-09.15.00.123456";

try {
  // ============================================================ c03 — the line contract

  // P01: formatLegacyLine == the LOG300 line machine on 3 000 (user, timestamp, message) triples incl. the 437 / 438 boundary.
  {
    const bad = [];
    let cut = 0;
    for (let i = 0; i < 3000; i++) {
      const user = i % 7 === 0 ? "" : randStr(10, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 1);
      const len = i < 20 ? 430 + i : i % 5 === 0 ? randInt(400, 520) : randInt(0, 200);
      const msg = rpgTrim(fixedAlpha(randStr(len, MSG_CHARS, len), 500)); // a stored msg is already trimmed
      const ts = rpgTimestamp(randInt(2000, 2099), randInt(1, 12), randInt(1, 28), randInt(0, 23), randInt(0, 59), randInt(0, 59), randInt(0, 999999));
      const pool = ts.replace(/^(\d{4}-\d{2}-\d{2})-(\d{2})\.(\d{2})\.(\d{2})\.(\d{6})$/, "$1T$2:$3:$4.$5").replace(/\.?0+$/, "");
      const want = legacyLine(user, ts, msg);
      const got = formatLegacyLine({ user_id: user, logged_at: pool, msg });
      if (want.length === 500 && !want.endsWith(" ***")) cut++;
      if (got !== want) bad.push({ user, ts, pool, len: msg.length, got: got.slice(0, 120), want: want.slice(0, 120), gl: got.length, wl: want.length });
    }
    const at437 = formatLegacyLine({ user_id: "ASH", logged_at: "2026-09-09T09:15:00.123456", msg: "M".repeat(437) });
    const at438 = formatLegacyLine({ user_id: "ASH", logged_at: "2026-09-09T09:15:00.123456", msg: "M".repeat(438) });
    record("P01", "c03", `formatLegacyLine == LOG300 line machine ('User: ' + User(10, padded) + ' * Date: ' + 26-char timestamp + ' * Msg: ' + msg + ' ***' in a 500 varying) on 3 000 triples; ${cut} lines over 437 characters lose the terminator in both; 437 keeps ' ***' at exactly 500, 438 does not`, bad.length === 0 && cut > 100 && at437.length === 500 && at437.endsWith(" ***") && at438.length === 500 && !at438.endsWith(" ***"), { bad: bad.slice(0, 3), cut });
  }

  // P02: normaliseLogEntry == `entry 500A value` through %trim on 3 000 strings: cut to 500 first, then blanks (only blanks) off both ends.
  {
    const bad = [];
    const samples = ["", " ", "     ", "\t", " \t x \t ", "x".repeat(500), "x".repeat(501), " ".repeat(499) + "ZQ", " ".repeat(500) + "Z", "a" + " ".repeat(600), "\u00a0nbsp\u00a0", "\nnl\n"];
    for (let i = 0; i < 3000; i++) {
      const entry = i < samples.length ? samples[i] : randStr(600, MSG_CHARS + "      \t", 0);
      const want = rpgTrim(fixedAlpha(entry, 500));
      const got = normaliseLogEntry(entry);
      if (got !== want) bad.push({ entry: entry.slice(0, 60), got: got.slice(0, 60), want: want.slice(0, 60) });
    }
    record("P02", "c03", "normaliseLogEntry == fixed-length 500A + %trim oracle on 3 000 entries: cut at 500 BEFORE trimming (499 blanks + 'ZQ' -> 'Z'; 500 blanks + 'Z' -> ''), leading and trailing blanks removed, tabs / NBSP / newlines kept (no character list)", bad.length === 0, { bad: bad.slice(0, 5) });
  }

  // P03: toRpgTimestamp == %char(%timestamp()) on 1 500 timestamps round-tripped through samlog.logged_at (pool text) plus the raw Postgres text and Date forms.
  {
    await clearLog();
    const bad = [];
    const cases = [];
    for (let i = 0; i < 1500; i++) {
      const y = randInt(1990, 2099), mo = randInt(1, 12), d = randInt(1, 28), h = randInt(0, 23), mi = randInt(0, 59), s = randInt(0, 59);
      const micro = i % 4 === 0 ? 0 : i % 4 === 1 ? randInt(1, 999) * 1000 : i % 4 === 2 ? randInt(1, 9) * 100000 : randInt(0, 999999);
      const literal = `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(micro).padStart(6, "0")}`;
      cases.push({ literal, want: rpgTimestamp(y, mo, d, h, mi, s, micro) });
    }
    for (let i = 0; i < cases.length; i += 100) {
      const batch = cases.slice(i, i + 100);
      const values = batch.map((_, j) => `($${j + 1}::timestamp, 'U', 'x')`).join(", ");
      await t.db.query(`INSERT INTO samlog (logged_at, user_id, msg) VALUES ${values}`, batch.map((c) => c.literal));
    }
    const back = await rows();
    for (let i = 0; i < cases.length; i++) {
      const got = toRpgTimestamp(back[i].logged_at);
      if (got !== cases[i].want || !RPG_TS.test(got)) bad.push({ literal: cases[i].literal, pool: back[i].logged_at, got, want: cases[i].want });
    }
    const raw = toRpgTimestamp("2026-09-09 09:15:00.5") === "2026-09-09-09.15.00.500000";
    const noFrac = toRpgTimestamp("2026-09-09T09:15:00") === "2026-09-09-09.15.00.000000";
    const asDate = toRpgTimestamp(new Date(2026, 8, 9, 9, 15, 0, 123)) === "2026-09-09-09.15.00.123000";
    let rejects = 0;
    for (const v of ["09/09/2026", "2026-09-09", "2026-09-09T09:15", "", "2026-09-09T09:15:00.1234567"]) {
      try { toRpgTimestamp(v); } catch { rejects++; }
    }
    record("P03", "c03", `toRpgTimestamp == %char(%timestamp()) (YYYY-MM-DD-HH.MM.SS.UUUUUU) on ${cases.length} timestamps written to samlog.logged_at and read back through the pool (fraction 0 / ms / tenths / random micro all padded to 6); raw Postgres text and Date forms agree; 5 malformed inputs throw`, bad.length === 0 && raw && noFrac && asDate && rejects === 5, { bad: bad.slice(0, 5), raw, noFrac, asDate, rejects });
  }

  // P04: addLogEntry over the module — 500 random entries: stored msg == %trim(500A) oracle, user_id == User(10) as named, logged_at in the call window, returns undefined; blank / empty entries still write a row (no validation in LOG300).
  {
    await clearLog();
    const bad = [];
    const before = (await t.db.query("SELECT LOCALTIMESTAMP::text AS n")).rows[0].n;
    const entries = [];
    for (let i = 0; i < 500; i++) {
      const entry = i % 50 === 0 ? pick(["", "   ", " ".repeat(600)]) : randStr(560, MSG_CHARS + "    ", 0);
      const user = i % 3 === 0 ? randStr(14, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 1) : randStr(10, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 1);
      entries.push({ entry, user });
      const ret = await log.addLogEntry(entry, user);
      if (ret !== undefined) bad.push({ i, ret });
    }
    const after = (await t.db.query("SELECT LOCALTIMESTAMP::text AS n")).rows[0].n;
    const r = await rows();
    for (let i = 0; i < entries.length; i++) {
      const wantMsg = rpgTrim(fixedAlpha(entries[i].entry, 500));
      const wantUser = entries[i].user.slice(0, 10); // varchar(10): no padding stored; formatLegacyLine pads
      const row = r[i];
      if (!row || row.msg !== wantMsg || row.user_id !== wantUser) bad.push({ i, got: row && { msg: row.msg.slice(0, 40), user: row.user_id }, want: { msg: wantMsg.slice(0, 40), user: wantUser } });
      else if (row.logged_at.replace("T", " ") < before || row.logged_at.replace("T", " ") > after) bad.push({ i, logged_at: row.logged_at, before, after });
    }
    const deliberateBlanks = entries.filter((_, i) => i % 50 === 0).length; // 10 blank-only / empty entries by construction; random entries may add more
    const blanks = r.filter((x) => x.msg === "").length;
    record("P04", "c03", `addLogEntry x ${entries.length}: every stored msg == the 500A + %trim oracle, user_id == the named user cut to 10 (case kept), logged_at inside the call window, return value undefined; ${blanks} blank / empty entries (${deliberateBlanks} deliberate) wrote an empty-msg row each (no validation, as LOG300)`, bad.length === 0 && r.length === entries.length && blanks >= deliberateBlanks, { bad: bad.slice(0, 5), count: r.length, blanks, deliberateBlanks });
  }

  // P05: c03 / CR-L4 actor rule — default = ord700_user(): the database role through the pool; atu.user only when the caller hands the module the transaction's own client; a named blank user is stored blank, not defaulted.
  {
    await clearLog();
    const dbRole = (await role()).slice(0, 10);
    await log.addLogEntry("via pool, no user");
    const client = await t.db.connect();
    let inTx;
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('atu.user', $1, true)", ["OPERATOR12"]);
      await createSamlog(client).addLogEntry("via the transaction's client");
      await client.query("INSERT INTO orders (orid, orcuid, ordate) VALUES (60001, 1001, CURRENT_DATE)");
      await client.query("INSERT INTO detord (odorid, odline, odarid, odqty) VALUES (60001, 1, 'A00001', 4)");
      await client.query("DELETE FROM detord WHERE odorid = 60001 AND odline = 1"); // the ORD700 trigger row, same transaction
      await client.query("COMMIT");
      inTx = "committed";
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      inTx = String(e);
    } finally {
      client.release();
    }
    // The transaction-local setting does not leak: the pool is back to the role.
    await log.addLogEntry("via pool after the transaction");
    await log.addLogEntry("named blank user", "");
    await log.addLogEntry("named long user", "abcdefghijklmnop");
    const r = await rows();
    const actors = r.map((x) => x.user_id);
    record("P05", "c03 CR-L4", `actor per event: through the pool the default is ord700_user() = the database role ('${dbRole}'); inside a transaction that set atu.user, createSamlog(<that client>) and the ORD700 trigger both write 'OPERATOR12' (the alignment the module documents); the next pool call is back to the role (transaction-local setting); a named '' user is stored '' (not defaulted); a 16-character user is cut to 10 with case kept`, inTx === "committed" && same(actors, [dbRole, "OPERATOR12", "OPERATOR12", dbRole, "", "abcdefghij"]), { inTx, actors, dbRole });
  }

  // ============================================================ c07 — the one event, reuse of the ORD writer

  // P06: 300 random DETORD deletes: the trigger's samlog row == the ORD700 message oracle, and addLogEntry(same text, same user) == the trigger row on msg, user_id and formatLegacyLine (Date aside).
  {
    await clearLog();
    const bad = [];
    const ARID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let n = 0;
    for (let i = 0; i < 300; i++) {
      const odorid = i === 0 ? 0 : randInt(1, 999999);
      const odline = i === 1 ? 0 : randInt(1, 99999);
      const odarid = i % 5 === 0 ? pick(["A00001", "X9", "", "Z", "B00010"]) : randStr(6, ARID_CHARS, 1);
      const odqty = i % 7 === 0 ? randInt(-99999, -1) : i % 11 === 0 ? 0 : randInt(1, 99999);
      const user = randStr(10, ARID_CHARS, 1);
      await t.db.query("INSERT INTO detord (odorid, odline, odarid, odqty) VALUES ($1, $2, $3, $4)", [odorid, odline, odarid, odqty]);
      const client = await t.db.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('atu.user', $1, true)", [user]);
        await client.query("DELETE FROM detord WHERE odorid = $1 AND odline = $2", [odorid, odline]);
        await client.query("COMMIT");
      } finally {
        client.release();
      }
      const want = ord700Message(odorid, odline, odarid, odqty);
      await log.addLogEntry(want, user);
      const r = await rows();
      const trig = r[r.length - 2];
      const mod = r[r.length - 1];
      n = r.length;
      const strip = (row) => formatLegacyLine(row).replace(/Date: .{26}/, "Date: <ts>");
      if (trig.msg !== want || mod.msg !== want || trig.user_id !== user || mod.user_id !== user || strip(trig) !== strip(mod) || !formatLegacyLine(trig).includes(" * Msg: ORD700:Order Line deleted ")) {
        bad.push({ odorid, odline, odarid, odqty, user, trig: { msg: trig.msg, user: trig.user_id }, mod: { msg: mod.msg, user: mod.user_id }, want });
      }
    }
    record("P06", "c07", `300 DETORD deletes (orid / line incl. 0, article ids 0..6 chars incl. 'X9' and blank, quantities negative / zero / positive): the ORD700 trigger row == the message oracle ('ORD700:Order Line deleted <orid> <line> article : <arid padded to 6> quantity : <qty>', %char = no leading zeros, '-' only when negative) and the LOG module's row for the same event is indistinguishable on msg, user_id and the rebuilt legacy line (Date aside) — ${n} rows`, bad.length === 0 && n === 600, { bad: bad.slice(0, 3), n });
  }

  // P07: the LOG writer has no ORD side effect and the ORD trigger does not call the LOG module: no article quantity change, no detord change, exactly one row per call; ORD700 event '1' (insert) and '3' (update) log nothing.
  {
    await clearLog();
    const snapshot = async () => (await t.db.query("SELECT (SELECT COALESCE(SUM(arcusqty), 0)::int FROM article) AS qty, (SELECT COUNT(*)::int FROM detord) AS lines, (SELECT COUNT(*)::int FROM orders) AS heads, (SELECT COUNT(*)::int FROM samlog) AS logs")).rows[0];
    const s0 = await snapshot();
    for (let i = 0; i < 20; i++) await log.addLogEntry(ord700Message(60001, i, "A00001", 10), "ASH");
    const s1 = await snapshot();
    await t.db.query("INSERT INTO detord (odorid, odline, odarid, odqty) VALUES (60002, 1, 'A00001', 3)"); // event '1'
    await t.db.query("UPDATE detord SET odqty = 5 WHERE odorid = 60002 AND odline = 1"); // event '3'
    const s2 = await snapshot();
    await t.db.query("DELETE FROM detord WHERE odorid = 60002");
    const s3 = await snapshot();
    const importers = [];
    (function walk(dir) {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.ts$/.test(name) && !p.includes(join("shared", "samlog")) && /shared\/samlog|createSamlog|addLogEntry/.test(readFileSync(p, "utf8"))) importers.push(relative(modernRoot, p));
      }
    })(join(modernRoot, "src"));
    record("P07", "c07", "20 addLogEntry calls change nothing but samlog (+20): article quantities, detord and orders untouched; a DETORD insert and update (ORD700 events '1' / '3') log nothing, the delete (event '2') logs one row; nothing under modern/src imports shared/samlog — the ORD trigger keeps its own INSERT (reuse, not rewiring)", s1.qty === s0.qty && s1.lines === s0.lines && s1.heads === s0.heads && s1.logs === s0.logs + 20 && s2.logs === s1.logs && s3.logs === s2.logs + 1 && importers.length === 0, { s0, s1, s2, s3, importers });
  }

  // ============================================================ c08 — one export

  // P08: the service-program surface is exactly addLogEntry; the module's own exports are the helpers and width constants; nothing named init / reset / truncate / read / list / clear.
  {
    const instance = Object.keys(log).sort();
    const moduleExports = Object.keys(samlogModule).sort();
    const wantModule = ["ADDLOGENTRY_ENTRY_LENGTH", "LEGACY_LINE_BUFFER_LENGTH", "LEGACY_LINE_FIXED_LENGTH", "LEGACY_LINE_TERMINATOR", "LEGACY_WRITE_LENGTH", "SAMLOG_HEADER_LENGTH", "SAMLOG_INITIAL_SIZE", "SAMLOG_USER_LENGTH", "createSamlog", "decodeSamlogUserSpace", "formatLegacyLine", "normaliseLogEntry", "toRpgTimestamp"];
    // Function names only (constants are UPPER_CASE widths): anything that would be a second procedure, a reset path or a reader.
    const suspicious = [...instance, ...moduleExports].filter((k) => /^[a-z]/.test(k) && /^(init|reset|truncat|read|list|clear|delete|remove|rotate|create(?!Samlog$))/i.test(k));
    const constants = { entry: samlogModule.ADDLOGENTRY_ENTRY_LENGTH, user: samlogModule.SAMLOG_USER_LENGTH, buffer: samlogModule.LEGACY_LINE_BUFFER_LENGTH, fixed: samlogModule.LEGACY_LINE_FIXED_LENGTH, terminator: samlogModule.LEGACY_LINE_TERMINATOR, write: samlogModule.LEGACY_WRITE_LENGTH, header: samlogModule.SAMLOG_HEADER_LENGTH, size: samlogModule.SAMLOG_INITIAL_SIZE };
    record("P08", "c08", "createSamlog(db) exposes exactly ['addLogEntry'] (EXPORT(*ALL) on a module with one exported P-spec); module exports are createSamlog, normaliseLogEntry, formatLegacyLine, toRpgTimestamp, decodeSamlogUserSpace and eight width constants whose values are the cards' (500, 10, 500, 63, ' ***', 600, 7, 5000); nothing named init / reset / truncate / read / list / clear", same(instance, ["addLogEntry"]) && same(moduleExports, wantModule) && suspicious.length === 0 && same(constants, { entry: 500, user: 10, buffer: 500, fixed: 63, terminator: " ***", write: 600, header: 7, size: 5000 }), { instance, moduleExports, suspicious, constants });
  }

  // ============================================================ c02 / c09 — the byte layout, over a copy

  // P09: decodeSamlogUserSpace over 200 spaces built by the LOG100 + LOG300 machine (random size, random line count within capacity): pos, marker, lines and empty tail all equal what the machine wrote.
  {
    const bad = [];
    let lines = 0;
    for (let i = 0; i < 200; i++) {
      const size = pick([5000, 5000, 8192, 16384, 65536]);
      const m = legacyUserSpace(size);
      const n = randInt(0, 30);
      for (let k = 0; k < n; k++) {
        const r = m.add(randStr(200, MSG_CHARS, 0), randStr(10, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1), TS_FIXED);
        if (!r.ok) break;
      }
      const d = decodeSamlogUserSpace(m.space);
      const wantLines = m.written.map((l) => l.slice(0, -4));
      lines += wantLines.length;
      const rule = readerRule(m.space);
      if (d.pos !== m.pos || !d.headerMarker || !same(d.lines, wantLines) || d.tail !== "" || !same(rule.lines, wantLines) || m.pos !== HEADER + m.written.reduce((a, l) => a + l.length, 0)) {
        bad.push({ size, n, pos: [d.pos, m.pos], marker: d.headerMarker, got: d.lines.length, want: wantLines.length, tail: d.tail.slice(0, 40) });
      }
    }
    const fresh = decodeSamlogUserSpace(legacyUserSpace().space);
    record("P09", "c02 / c09", `decoder over 200 machine-built spaces (${lines} lines; sizes 5000 .. 65536): pos == 7 + sum of logical line lengths (the 600-byte pads are not counted), '***' marker seen, every line returned without its terminator, tail empty; a fresh LOG100 space decodes to pos 7 and no lines; the c09 reader rule applied by hand agrees`, bad.length === 0 && same(fresh, { pos: 7, headerMarker: true, lines: [], tail: "" }), { bad: bad.slice(0, 3), lines, fresh });
  }

  // P10: an EBCDIC (CP037) copy of the space: the default latin1 decode is unreadable, the injectable text / terminator recover the lines — the "runtime CCSID" note on c02 exercised, not assumed.
  {
    const m = legacyUserSpace(5000, ebcdicEncode);
    const msgs = ["ORD700:Order Line deleted 60001 1 article : A00001 quantity : 10", "second line", "Mixed Case 123 ./-"];
    for (const s of msgs) m.add(s, "ASH", TS_FIXED);
    const latin = decodeSamlogUserSpace(m.space);
    const ebcdic = decodeSamlogUserSpace(m.space, { text: ebcdicDecode, terminator: ebcdicEncode(" ***") });
    const wantLines = m.written.map((l) => l.slice(0, -4));
    record("P10", "c02", "a CP037-encoded copy: with the default latin1 text the '***' marker is not seen and no line splits (terminator bytes differ); with text = CP037 -> char and terminator = CP037 ' ***' the decoder returns the three lines exactly; pos (big-endian binary, encoding-independent) agrees in both", latin.pos === m.pos && latin.headerMarker === false && latin.lines.length === 0 && ebcdic.pos === m.pos && ebcdic.headerMarker === true && same(ebcdic.lines, wantLines) && ebcdic.tail === "", { latinLines: latin.lines.length, latinMarker: latin.headerMarker, ebcdicLines: ebcdic.lines, wantLines });
  }

  // P11: c03 / c09 — a message over 437 characters loses ' ***' and glues to the next line for any separator-based reader; as the last line it is the tail. The decoder reports what the bytes say, as the card describes.
  {
    const m = legacyUserSpace(5000);
    m.add("first", "ASH", TS_FIXED);
    m.add("M".repeat(450), "ASH", TS_FIXED); // cut at 500, no terminator (c03)
    m.add("third", "ASH", TS_FIXED);
    const glued = decodeSamlogUserSpace(m.space);
    const m2 = legacyUserSpace(5000);
    m2.add("only", "ASH", TS_FIXED);
    m2.add("M".repeat(450), "ASH", TS_FIXED);
    const tail = decodeSamlogUserSpace(m2.space);
    const cutLine = m.written[1];
    record("P11", "c03 / c09", "a 450-character message: the machine writes 500 bytes with no ' ***' (as LOG300's 500 varying); the decoder then sees two lines, the second being the cut line glued to 'third' (the c09 'glued lines' consequence); when the cut line is last it is the tail, not a line", cutLine.length === 500 && !cutLine.endsWith(" ***") && glued.lines.length === 2 && glued.lines[1] === cutLine + m.written[2].slice(0, -4) && glued.tail === "" && tail.lines.length === 1 && tail.tail === cutLine, { cutLen: cutLine.length, gluedCount: glued.lines.length, gluedSecondStartsWith: glued.lines[1].slice(0, 30), tailLen: tail.tail.length });
  }

  // ============================================================ c04 / c06 / c10 — the deltas, observed as deltas

  // P12: c04 CR-L5 — the machine at 5000 bytes with ORD700-sized lines stops silently and permanently at pos + 600 > 5000 (pos not advanced, every later call fails); the table keeps all 60 lines. Observed as the documented delta.
  {
    await clearLog();
    const msg = ord700Message(60001, 1, "A00001", 10); // 63 + 64 = 127-byte line
    const lineLen = legacyLine("ASH", TS_FIXED, msg).length;
    const m = legacyUserSpace(5000);
    let ok = 0;
    let posAtFirstFailure = null;
    for (let i = 0; i < 60; i++) {
      const r = m.add(msg, "ASH", TS_FIXED);
      if (r.ok) ok++;
      else if (posAtFirstFailure === null) posAtFirstFailure = r.pos;
    }
    const wantOk = Math.floor((5000 - WRITE - HEADER) / lineLen) + 1; // lines k = 0..K with 7 + k*L + 600 <= 5000
    const permanent = m.pos === posAtFirstFailure && m.failures === 60 - ok;
    const m8k = legacyUserSpace(8192);
    let ok8k = 0;
    for (let i = 0; i < 100; i++) if (m8k.add(msg, "ASH", TS_FIXED).ok) ok8k++;
    for (let i = 0; i < 60; i++) await log.addLogEntry(msg, "ASH");
    const kept = (await rows()).length;
    record("P12", "c04 CR-L5", `legacy machine: ${lineLen}-byte ORD700 lines fill a 5000-byte SAMLOG after ${ok} calls (oracle: pos + 600 > 5000 -> ${wantOk}; the card's '≈ 35'), pos then stays at ${m.pos} and the remaining ${60 - ok} calls all fail — silent, permanent; at an 8192-byte allocation ${ok8k} lines (the card's '≈ 60'). Modern: 60 addLogEntry calls -> ${kept} rows, no capacity — CR-L5 observed as the delta`, ok === wantOk && ok >= 33 && ok <= 37 && permanent && ok8k >= 58 && ok8k <= 66 && kept === 60, { lineLen, ok, wantOk, posAtFirstFailure, finalPos: m.pos, failures: m.failures, ok8k, kept });
  }

  // P13: c06 CR-L6 — the log exists as part of the schema: the first call in a fresh schema writes; a failing insert throws to the caller (nothing swallowed, nothing latched) and the next call after the cause is removed writes again — no never-retried state.
  {
    const fresh = await createTestDb();
    let firstCall;
    try {
      const l = createSamlog(fresh.db);
      const before = (await fresh.db.query("SELECT COUNT(*)::int AS n FROM samlog")).rows[0].n;
      await l.addLogEntry("first call in a fresh schema", "ASH");
      const after = (await fresh.db.query("SELECT user_id, msg FROM samlog")).rows;
      // Make the insert fail (the throw-away schema only): the module must throw, not swallow.
      await fresh.db.query("ALTER TABLE samlog RENAME TO samlog_gone");
      let thrown = null;
      try { await l.addLogEntry("while the object is missing", "ASH"); } catch (e) { thrown = e.code ?? String(e); }
      await fresh.db.query("ALTER TABLE samlog_gone RENAME TO samlog");
      await l.addLogEntry("after the object is back", "ASH"); // no inz latch: the next call succeeds
      const final = (await fresh.db.query("SELECT msg FROM samlog ORDER BY id")).rows.map((r) => r.msg);
      firstCall = { before, after, thrown, final };
    } finally {
      await fresh.close();
    }
    record("P13", "c06 CR-L6", "fresh schema (applySchema): samlog exists with 0 rows and the first addLogEntry writes (no install step, no never-created state); with the table renamed away the call throws 42P01 to the caller (legacy: swallowed by callp(e)); once the table is back the next call writes — nothing is latched per process (legacy: inz set before the failed resolution, never retried). CR-L6 observed as the delta", firstCall.before === 0 && same(firstCall.after, [{ user_id: "ASH", msg: "first call in a fresh schema" }]) && firstCall.thrown === "42P01" && same(firstCall.final, ["first call in a fresh schema", "after the object is back"]), firstCall);
  }

  // P14: c10 CR-L8 — 200 concurrent addLogEntry calls through the pool: all kept, all distinct, ids unique and increasing; the legacy machine under the card's Interleaving A loses one line per racing pair and leaves a blank run. Observed as the delta.
  {
    await clearLog();
    await Promise.all(Array.from({ length: 200 }, (_, i) => log.addLogEntry(`line ${i}`, "JOB" + (i % 3))));
    const r = await rows();
    const msgs = new Set(r.map((x) => x.msg));
    const ids = r.map((x) => x.id);
    const strictlyIncreasing = ids.every((v, i) => i === 0 || v > ids[i - 1]);
    const m = legacyUserSpace(65536);
    for (let i = 0; i < 40; i++) m.addRaced(`A${i}`, "JOBA", `B${i}`, "JOBB", TS_FIXED);
    const d = decodeSamlogUserSpace(m.space);
    const lostA = d.lines.filter((l) => / \* Msg: A\d+$/.test(l)).length;
    const keptB = d.lines.filter((l) => l.includes(" * Msg: B")).length;
    const blankRuns = d.lines.filter((l) => /^ {10,}User: /.test(l)).length; // B's 600-byte pad ahead of the next line
    const overAdvanced = m.pos === HEADER + m.written.reduce((a, l) => a + l.length, 0); // the relative += counts the lost line too
    record("P14", "c10 CR-L8", `modern: 200 concurrent appends -> ${r.length} rows, ${msgs.size} distinct messages, ids unique and increasing (transactional insert, sequence id). Legacy machine, 40 racing pairs (Interleaving A): ${lostA} 'A' lines survive, ${keptB} 'B' lines survive, ${blankRuns} lines start with a blank run, pos over-advanced by the lost lines' lengths — CR-L8 observed as the delta`, r.length === 200 && msgs.size === 200 && strictlyIncreasing && lostA === 0 && keptB === 40 && blankRuns >= 39 && overAdvanced, { rows: r.length, distinct: msgs.size, strictlyIncreasing, lostA, keptB, blankRuns, overAdvanced, legacyPos: m.pos });
  }

  // ============================================================ residual — checked for absence and reason

  // P15: c01 / c05 / c06 / c09 — nothing invented: no LOG100 / reset / truncate path in the module, no reader route or page, no OpenAPI, no shared/logging, no HTTP registration; the ORD feature not rewired.
  {
    const routes = app.printRoutes({ commonPrefix: false }).split("\n").map((l) => l.trim()).filter(Boolean);
    const logRoutes = routes.filter((l) => /log|samlog/i.test(l));
    const probes = {};
    for (const url of ["/api/samlog", "/api/log", "/api/logs", "/samlog", "/log", "/api/samlog/1", "/api/application-log"]) probes[url] = (await http("GET", url)).status;
    probes["POST /api/samlog"] = (await http("POST", "/api/samlog", { msg: "x" })).status;
    const openapi = readdirSync(join(modernRoot, "openapi")).sort();
    const sharedDirs = readdirSync(join(modernRoot, "src", "shared")).sort();
    const samlogFiles = readdirSync(join(modernRoot, "src", "shared", "samlog")).sort();
    const moduleSrc = readFileSync(join(modernRoot, "src", "shared", "samlog", "index.ts"), "utf8");
    const sqlInModule = [...moduleSrc.matchAll(/"((?:INSERT|SELECT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER|DROP)[^"]*)"/g)].map((m) => m[1]);
    const appSrc = readFileSync(join(modernRoot, "src", "app.ts"), "utf8");
    const todos = [...moduleSrc.matchAll(/TODO\(log-programs-(c\d\d)\)/g)].map((m) => m[1]).sort();
    record("P15", "c01 / c05 / c06 / c09", `no reader and no reset invented: 0 log / samlog routes in the Fastify tree (${routes.length} routes), 8 candidate URLs 404, openapi/ = customer.yaml + order.yaml, src/shared has no logging/ directory, shared/samlog is one file whose only SQL statement is the INSERT, app.ts does not reference samlog; the module carries TODO markers for c04, c06 and c09 (the residual questions), none answered`, logRoutes.length === 0 && Object.values(probes).every((s) => s === 404) && same(openapi, ["customer.yaml", "order.yaml"]) && !sharedDirs.includes("logging") && same(samlogFiles, ["index.ts"]) && sqlInModule.length === 1 && /^INSERT INTO samlog/.test(sqlInModule[0]) && !/samlog/i.test(appSrc) && same(todos, ["c04", "c06", "c09"]), { routes: routes.length, logRoutes, probes, openapi, sharedDirs, samlogFiles, sqlInModule, todos });
  }

  // P16: CR-L2 / schema — samlog is exactly the ORD pack's table (id bigint identity-by-sequence, logged_at NOT NULL default LOCALTIMESTAMP, user_id varchar(10) NOT NULL default '', msg text NOT NULL), PK the only index, no trigger on it; the LOG section of schema.sql is COMMENT ON only and the comments cite the pack and the cards.
  {
    const cols = (await t.db.query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'samlog' ORDER BY ordinal_position`, [t.schema])).rows;
    const idx = (await t.db.query(`SELECT indexname FROM pg_indexes WHERE schemaname = $1 AND tablename = 'samlog'`, [t.schema])).rows.map((r) => r.indexname);
    const trg = (await t.db.query(`SELECT tgname FROM pg_trigger WHERE tgrelid = ($1 || '.samlog')::regclass AND NOT tgisinternal`, [t.schema])).rows;
    const comments = (await t.db.query(
      `SELECT obj_description(($1 || '.samlog')::regclass, 'pg_class') AS tbl,
              col_description(($1 || '.samlog')::regclass, 3) AS user_id,
              col_description(($1 || '.samlog')::regclass, 2) AS logged_at,
              col_description(($1 || '.samlog')::regclass, 4) AS msg`, [t.schema])).rows[0];
    const shape = cols.map((c) => [c.column_name, c.data_type, c.character_maximum_length, c.is_nullable, (c.column_default ?? "").replace(/nextval\('[^']*'::regclass\)/, "nextval(seq)")]);
    const wantShape = [["id", "bigint", null, "NO", "nextval(seq)"], ["logged_at", "timestamp without time zone", null, "NO", "LOCALTIMESTAMP"], ["user_id", "character varying", 10, "NO", "''::character varying"], ["msg", "text", null, "NO", ""]];
    const schema = readFileSync(join(modernRoot, "db", "schema.sql"), "utf8").split("\n");
    const logStart = schema.findIndex((l) => /atuMerlin LOG vertical/.test(l));
    const section = schema.slice(logStart);
    const statements = section.filter((l) => /^[A-Z]/.test(l)).map((l) => l.replace(/\s.*$/, "").concat(" ", l.split(/\s+/)[1] ?? ""));
    const kinds = [...new Set(statements.map((s) => s.trim()))];
    const cites = { pack: /atu-merlin-ts-log-v1/.test(comments.tbl ?? ""), c04: /c04/.test(comments.tbl ?? ""), c09: /c09/.test(comments.tbl ?? ""), c03user: /c03/.test(comments.user_id ?? "") && /activation group/.test(comments.user_id ?? ""), c03date: /26 chars/.test(comments.logged_at ?? ""), crl3: /CR-L3/.test(comments.msg ?? "") };
    record("P16", "CR-L2 schema", `samlog == the ORD pack's shape (id bigint from a sequence, logged_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP, user_id varchar(10) NOT NULL DEFAULT '', msg text NOT NULL); PK the only index; no trigger on samlog; the LOG section of db/schema.sql (from line ${logStart + 1}) contains ${statements.length} statements, all COMMENT ON; comments cite the pack id, c03 (activation-group User, 26-char Date), c04, c09 and CR-L3`, same(shape, wantShape) && idx.length === 1 && /pkey/.test(idx[0]) && trg.length === 0 && same(kinds, ["COMMENT ON"]) && statements.length === 4 && Object.values(cites).every(Boolean), { shape, idx, trg, kinds, statements: statements.length, logStart: logStart + 1, cites });
  }

  // P17: c03 — the card's own example line, rebuilt from a row, character for character; and the 63-byte fixed part.
  {
    const card = "User: ASH        * Date: 2026-09-09-09.15.00.123456 * Msg: ORD700:Order Line deleted 123 1 article : ART001 quantity : 10 ***";
    const row = { user_id: "ASH", logged_at: "2026-09-09T09:15:00.123456", msg: ord700Message(123, 1, "ART001", 10) };
    const got = formatLegacyLine(row);
    const empty = formatLegacyLine({ ...row, msg: "" });
    record("P17", "c03", "the c03 example line ('User: ASH        * Date: 2026-09-09-09.15.00.123456 * Msg: ORD700:Order Line deleted 123 1 article : ART001 quantity : 10 ***') is rebuilt character for character from a row whose msg is the c07 message oracle; an empty msg gives exactly the 63-byte fixed part", got === card && got.length === LINE_FIXED + row.msg.length && empty.length === LINE_FIXED, { got, card, emptyLen: empty.length });
  }

  // P18: observation — the module counts JavaScript characters where the box counted single-byte EBCDIC bytes (500A, 10A, 500 varying); identical for the in-tree charset, divergent for multi-byte text no RPG caller can pass. Recorded, not a card drift.
  {
    const nonAscii = "é".repeat(600);
    const stored = normaliseLogEntry(nonAscii);
    const bytes = Buffer.byteLength(stored, "utf8");
    const asciiSame = normaliseLogEntry("x".repeat(600)).length === 500 && Buffer.byteLength(normaliseLogEntry("x".repeat(600)), "latin1") === 500;
    await clearLog();
    await log.addLogEntry(nonAscii, "ÄÖÜÄÖÜÄÖÜÄÖÜ");
    const [row] = await rows();
    const line = formatLegacyLine(row);
    record("P18", "c03 observation", `observation (G-L2): normaliseLogEntry cuts at 500 UTF-16 code units — 600 x 'é' -> 500 characters / ${bytes} UTF-8 bytes (a 500A field holds 500 single-byte EBCDIC characters); the user is cut to 10 characters likewise; formatLegacyLine's 500 cut is in characters too. For the ASCII charset every in-tree caller uses the counts coincide exactly; recorded, not behaviour drift on any reachable input`, stored.length === 500 && bytes === 1000 && asciiSame && row.user_id === "ÄÖÜÄÖÜÄÖÜÄ" && line.length === 500, { storedChars: stored.length, bytes, asciiSame, user: row.user_id, lineChars: line.length });
  }
} finally {
  await app.close();
  await t.close();
}

// --- Summary --------------------------------------------------------------------------------------

const pass = results.filter((r) => r.pass).length;
const fail = results.length - pass;
const out = {
  pack: "atu-merlin-ts-log-v1@1",
  characterization: "WAIVED_PATHFINDER",
  oracle: "discovery/log-programs/features c01..c10 (LOG100 + LOG300 replayed as a byte machine over a user space — header, 500A + %trim, 500 varying line, 600-byte write, pos + 600 > size silent stop, unlocked cursor race; the ORD700 message rebuilt from ORD700.PGM.RPGLE:78-81; %char(%timestamp()) from components) + modern/README.md LOG section; NOT IBM i goldens",
  ran_at: new Date().toISOString(),
  summary: { pass, fail, total: results.length },
  cases: results,
};
writeFileSync(join(here, "results.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\n${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
