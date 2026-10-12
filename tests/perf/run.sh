#!/usr/bin/env bash
set -euo pipefail

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 nie jest w PATH. Binarka powinna być w ~/.local/bin albo zainstalowana systemowo." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PERF_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PERF_PORT:-3099}"
BASE_URL="http://127.0.0.1:${PORT}"
DB="$ROOT/apps/api/data/perf.sqlite"

mkdir -p "$ROOT/apps/api/data"
rm -f "$DB" "$DB-wal" "$DB-shm"

TSX="$ROOT/apps/api/node_modules/.bin/tsx"
if [[ ! -x "$TSX" ]]; then
  TSX="$ROOT/node_modules/.bin/tsx"
fi

(
  cd "$ROOT/apps/api"
  LOGIN_RATE_LIMIT_MAX="${LOGIN_RATE_LIMIT_MAX:-100000}" \
    PORT="$PORT" \
    DB_PATH="$DB" \
    "$TSX" src/index.ts
) &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
}
trap cleanup EXIT

ready=0
for _ in $(seq 1 50); do
  if curl -sf "$BASE_URL/api/health" >/dev/null; then
    ready=1
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "API zakończyło się, zanim zaczęło nasłuchiwać." >&2
    exit 1
  fi
  sleep 0.2
done

if [[ "$ready" -ne 1 ]]; then
  echo "API nie odpowiedziało na $BASE_URL/api/health" >&2
  exit 1
fi

cd "$PERF_DIR"
BASE_URL="$BASE_URL" node seed.mjs
BASE_URL="$BASE_URL" k6 run smoke.js
BASE_URL="$BASE_URL" k6 run load.js
BASE_URL="$BASE_URL" k6 run stress.js
