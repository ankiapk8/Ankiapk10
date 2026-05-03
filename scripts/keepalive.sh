#!/usr/bin/env bash
# Pings the API health endpoint every 4 minutes to prevent the dev repl from hibernating.
API_PORT="${PORT:-3001}"
INTERVAL=240

echo "[keepalive] Starting — pinging http://localhost:${API_PORT}/api/healthz every ${INTERVAL}s"
while true; do
  sleep "$INTERVAL"
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}/api/healthz" 2>/dev/null || echo "ERR")
  echo "[keepalive] ping → $STATUS"
done
