#!/usr/bin/env bash
# Throw-away local PostgreSQL cluster for development and tests (no root, no Docker).
# Needs the PostgreSQL server binaries on PATH or under /usr/lib/postgresql/<ver>/bin.
#
#   scripts/local-pg.sh start   # initdb + start on $PGPORT (default 54329), prints DATABASE_URL
#   scripts/local-pg.sh stop
#   scripts/local-pg.sh url
set -euo pipefail

PGDATA="${PGDATA:-/tmp/atu-merlin-pg}"
PGPORT="${PGPORT:-54329}"
DBNAME="${DBNAME:-atu_merlin}"

find_bin() {
  if command -v pg_ctl >/dev/null 2>&1; then dirname "$(command -v pg_ctl)"; return; fi
  ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1
}
BIN="$(find_bin)"
[ -n "$BIN" ] || { echo "PostgreSQL binaries not found" >&2; exit 1; }

url() { echo "postgres://$(id -un)@127.0.0.1:${PGPORT}/${DBNAME}"; }

case "${1:-}" in
  start)
    if [ ! -f "$PGDATA/PG_VERSION" ]; then
      "$BIN/initdb" -D "$PGDATA" -A trust -U "$(id -un)" >/dev/null
    fi
    if ! "$BIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
      "$BIN/pg_ctl" -D "$PGDATA" -o "-p $PGPORT -k /tmp -c listen_addresses=127.0.0.1" -l "$PGDATA/server.log" -w start >/dev/null
    fi
    "$BIN/psql" -h 127.0.0.1 -p "$PGPORT" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DBNAME}'" | grep -q 1 \
      || "$BIN/createdb" -h 127.0.0.1 -p "$PGPORT" "$DBNAME"
    echo "DATABASE_URL=$(url)"
    ;;
  stop)
    "$BIN/pg_ctl" -D "$PGDATA" -m fast stop
    ;;
  url)
    url
    ;;
  *)
    echo "usage: $0 start|stop|url" >&2
    exit 2
    ;;
esac
