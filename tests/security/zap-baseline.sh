#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker jest wymagany do uruchomienia OWASP ZAP baseline." >&2
  exit 1
fi

TARGET="${1:-http://127.0.0.1:3000}"

# API nasłuchuje na 127.0.0.1, więc kontener korzysta z sieci hosta.
docker run --rm --network host zaproxy/zap-stable \
  zap-baseline.py -t "$TARGET"
