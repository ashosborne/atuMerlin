import type { Db } from "../../db/pool.js";

/**
 * LOG service program (module LOG300) and the SAMLOG user space as a shared logging module —
 * pack atu-merlin-ts-log-v1@1, mapping rules "RPGLE log programs -> TS shared logging module" and
 * "PF / samlog -> reuse or align with existing ORD samlog table; additive shared helpers".
 *
 * Alignment, not a second log: the ORD vertical (pack atu-merlin-ts-ord-v1@1) already writes the
 * one in-tree log event (ORD700 on order-line delete, log-programs-c07) to the `samlog` table
 * from the `ord700_detord_delete` trigger, naming the actor through `ord700_user()`
 * (modern/db/schema.sql, ORD section). This module writes to the SAME table with the SAME actor
 * rule so that a line appended here and a line appended by the trigger are indistinguishable.
 * Nothing under modern/src/features/order/** or the ORD schema is changed by the LOG pack.
 *
 * Cards: log-programs-c02 (SAMLOG byte layout — `decodeSamlogUserSpace`), c03 (AddLogEntry line
 * contract — `addLogEntry`, `normaliseLogEntry`, `formatLegacyLine`, `toRpgTimestamp`),
 * c07 (ORD700 the only writer — reuse of the trigger's table and actor), c08 (one export —
 * `Samlog` has exactly `addLogEntry`).
 *
 * Kept as-is (planted facts, not fixed here — needs-SME in discovery/log-programs/SME_BRIEF.md):
 *  - c03 `entry` is `500A` by value: a longer message is cut at 500, then `%trim` removes leading
 *    AND trailing blanks. Reproduced in `normaliseLogEntry` (what is stored in `samlog.msg`).
 *  - c03 the legacy line is built in a `500 varying` field: a trimmed message longer than 437
 *    characters is cut and loses the `' ***'` terminator. Reproduced in `formatLegacyLine` only
 *    (the string contract); the stored `msg` is the full trimmed entry — see README CR-L3.
 *  - c03 `User` is written blank-padded to 10, never trimmed; `formatLegacyLine` pads.
 *
 * Deliberately not reproduced (residual; modern/README.md LOG section):
 *  - c01 / c05 / c06 LOG100 (create / replace the 5000-byte space, header, install step, the
 *    swallowed QUSCRTUS error and the never-retried init): the table exists once `applySchema`
 *    has run; there is no reset path and no "never created" state. TODO(log-programs-c06): the
 *    install runbook (who runs LOG100) is an ops question — nothing coded.
 *  - c03 `User` stamped once per activation group (`inz(*USER)`): the target records the actor
 *    per event, as the ORD trigger already does. Needs-SME (SME_BRIEF item 7).
 *  - c04 capacity: a 600-byte write past the end of the space fails silently and permanently;
 *    `samlog` is an unbounded table. TODO(log-programs-c04): allocated size / observed failure on
 *    the box is a runtime fact; nothing here caps the log.
 *  - c09 the reader (`ADSPUSRSPC`, menu option 84) has no source; no reader is invented here.
 *    TODO(log-programs-c09): what option 84 renders is unknown; `formatLegacyLine` is the one
 *    string a reader could depend on, offered for the room's decision, not as the reader.
 *  - c10 unsynchronised shared cursor (lost lines): the target insert is transactional.
 */

/** `entry 500A value` (LOG.RPGLEINC:5): the prototype cuts a longer argument to 500 bytes. */
export const ADDLOGENTRY_ENTRY_LENGTH = 500;
/** `User 10 inz(*USER)` (LOG300.RPGLE:16) and `samlog.user_id varchar(10)`. */
export const SAMLOG_USER_LENGTH = 10;
/** `data2 500 varying` (LOG300.RPGLE:20): the legacy line buffer. */
export const LEGACY_LINE_BUFFER_LENGTH = 500;
/** `'User: ' + 10 + ' * ' + 'Date: ' + 26 + ' * ' + 'Msg: ' + ' ***'` = 6 + 10 + 3 + 6 + 26 + 3 + 5 + 4 (c03). */
export const LEGACY_LINE_FIXED_LENGTH = 63;
/** The only record delimiter in SAMLOG (c02, c03). */
export const LEGACY_LINE_TERMINATOR = " ***";
/** `data 600 based(p2)` (LOG300.RPGLE:13): bytes physically written per call — recorded, not reproduced (c04). */
export const LEGACY_WRITE_LENGTH = 600;
/** SAMLOG header (c02): 4-byte big-endian `pos` at 0, `'***'` at 4, first entry at 7. */
export const SAMLOG_HEADER_LENGTH = 7;
/** `QUSCRTUS` initial size in LOG100 (c01); no auto-extend anywhere (c04). Recorded, not reproduced. */
export const SAMLOG_INITIAL_SIZE = 5000;

/** One `samlog` row as the ORD trigger and this module write it. */
export interface SamlogRow {
  id: number;
  /** `timestamp without time zone`, read back as `YYYY-MM-DDTHH:MM:SS[.ffffff]` (db/pool.ts). */
  logged_at: string;
  /** `varchar(10)`, the actor: `ord700_user()` unless the caller names one. */
  user_id: string;
  /** The trimmed entry (`%trim(entry)`, c03); the ORD700 message text for trigger rows. */
  msg: string;
}

export interface Samlog {
  /**
   * LOG300.AddLogEntry — append one line to the application log. Writes a `samlog` row with
   * `normaliseLogEntry(entry)` as `msg`. The actor defaults to `ord700_user()` (the ORD trigger's
   * rule: `atu.user` set on the transaction, else the database role) so a caller inside an
   * ORD transaction logs as the same user the trigger would; a caller outside one names the user.
   * Returns nothing, as the legacy procedure returns nothing.
   */
  addLogEntry(entry: string, user?: string): Promise<void>;
}

/**
 * The one export of the LOG service program (c08: `EXPORT(*ALL)` exports `AddLogEntry` alone;
 * `init` is not exported). The layout / line helpers below are module-level functions, not part
 * of the service-program surface.
 */
export function createSamlog(db: Db): Samlog {
  return {
    async addLogEntry(entry, user) {
      const actor = user === undefined ? null : user.slice(0, SAMLOG_USER_LENGTH);
      await db.query("INSERT INTO samlog (user_id, msg) VALUES (COALESCE($1, ord700_user()), $2)", [actor, normaliseLogEntry(entry)]);
    },
  };
}

/**
 * The `entry 500A value` parameter through `%trim` (c03, LOG300.RPGLE:20,30): cut to 500, then
 * leading and trailing blanks removed. Only blanks — `%trim` with no character list.
 */
export function normaliseLogEntry(entry: string): string {
  return trimBlanks(entry.slice(0, ADDLOGENTRY_ENTRY_LENGTH));
}

/**
 * `%char(%timestamp())` (c03): the 26-character ISO form `YYYY-MM-DD-HH.MM.SS.UUUUUU`.
 * Accepts the `samlog.logged_at` text the pool hands back (`YYYY-MM-DDTHH:MM:SS[.f…]`, or the
 * raw Postgres form with a blank) — fraction padded to six digits — or a `Date`, whose millisecond
 * precision yields `…mmm000`.
 */
export function toRpgTimestamp(at: string | Date): string {
  if (at instanceof Date) {
    const p = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${p(at.getFullYear(), 4)}-${p(at.getMonth() + 1)}-${p(at.getDate())}-${p(at.getHours())}.${p(at.getMinutes())}.${p(at.getSeconds())}.${p(at.getMilliseconds(), 3)}000`;
  }
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/.exec(at);
  if (!m) throw new Error(`not a timestamp: ${at}`);
  return `${m[1]}-${m[2]}.${m[3]}.${m[4]}.${(m[5] ?? "").padEnd(6, "0")}`;
}

/**
 * The legacy line string (c03, LOG300.RPGLE:28-30) rebuilt from a `samlog` row:
 * `'User: ' + User(10, blank-padded) + ' * Date: ' + timestamp(26) + ' * Msg: ' + msg + ' ***'`,
 * then the `500 varying` cut — a `msg` longer than 437 characters loses its tail and the
 * terminator, as on the box. Offered as the string contract nothing in the tree reads (c09);
 * whether it is a contract at all is the room's question (SME_BRIEF item 7).
 */
export function formatLegacyLine(row: Pick<SamlogRow, "user_id" | "logged_at" | "msg">): string {
  const line = `User: ${row.user_id.slice(0, SAMLOG_USER_LENGTH).padEnd(SAMLOG_USER_LENGTH)} * Date: ${toRpgTimestamp(row.logged_at)} * Msg: ${row.msg}${LEGACY_LINE_TERMINATOR}`;
  return line.slice(0, LEGACY_LINE_BUFFER_LENGTH);
}

export interface DecodedSamlog {
  /** Offset 0, `10i 0` big-endian: bytes used = next-write offset (c02). */
  pos: number;
  /** Bytes 4-6 read `'***'` (LOG100 writes it; nothing on the box reads it back). */
  headerMarker: boolean;
  /** Bytes 7 .. pos-1 split on `' ***'`; each line without its terminator. */
  lines: string[];
  /** Bytes after the last terminator and before `pos` (a line cut by the 500-byte buffer, c03, or a torn write, c10). Empty when clean. */
  tail: string;
}

export interface DecodeSamlogOptions {
  /** Byte -> text for the copied space. Default `latin1` (one char per byte); an EBCDIC copy needs the box's CCSID table — not supplied here (runtime fact, c02). */
  text?: (bytes: Buffer) => string;
  /** The terminator as it appears in the copied bytes. Default: `' ***'` as latin1 bytes. */
  terminator?: Buffer;
}

/**
 * The SAMLOG layout (c02) as a decoder over a raw copy of the space: `pos` from offset 0, the
 * `'***'` marker at 4, entries from 7 to `pos - 1`, split on `' ***'` (the rule c09 spells out
 * for a reader that does not exist in the tree). This is the decoding rule only — no migration
 * of existing SAMLOG content is performed or recommended (c02 open question: recommendation no).
 * Bytes at and beyond `pos` (the 600-byte blank pad and the `X'00'` fill) are ignored.
 */
export function decodeSamlogUserSpace(space: Buffer, opts: DecodeSamlogOptions = {}): DecodedSamlog {
  const text = opts.text ?? ((b: Buffer) => b.toString("latin1"));
  const terminator = opts.terminator ?? Buffer.from(LEGACY_LINE_TERMINATOR, "latin1");
  if (space.length < SAMLOG_HEADER_LENGTH) throw new Error(`SAMLOG shorter than its ${SAMLOG_HEADER_LENGTH}-byte header`);
  const pos = space.readInt32BE(0);
  if (pos < SAMLOG_HEADER_LENGTH || pos > space.length) throw new Error(`SAMLOG pos ${pos} outside the copied space`);
  const headerMarker = text(space.subarray(4, SAMLOG_HEADER_LENGTH)) === "***";
  const body = space.subarray(SAMLOG_HEADER_LENGTH, pos);
  const lines: string[] = [];
  let from = 0;
  for (;;) {
    const at = body.indexOf(terminator, from);
    if (at === -1) break;
    lines.push(text(body.subarray(from, at)));
    from = at + terminator.length;
  }
  return { pos, headerMarker, lines, tail: text(body.subarray(from)) };
}

function trimBlanks(s: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && s[start] === " ") start++;
  while (end > start && s[end - 1] === " ") end--;
  return s.slice(start, end);
}
