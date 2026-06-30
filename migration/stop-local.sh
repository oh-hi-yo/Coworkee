#!/usr/bin/env bash
#
# Stop the Coworkee backend (8080) and frontend (3000). Leaves Postgres + Keycloak
# (docker) running — stop those with: cd coworkee-api && docker compose down
#
#   bash migration/stop-local.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for port in 3000 8080; do
  pids=$(netstat -ano 2>/dev/null | grep "LISTENING" | grep ":$port " | awk '{print $NF}' | sort -u)
  for pid in $pids; do
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
      taskkill //PID "$pid" //F >/dev/null 2>&1 && echo "stopped :$port (pid $pid)"
    fi
  done
done
rm -f "$ROOT/coworkee-api/.backend.pid"
echo "Backend/frontend stopped. Infra (postgres+keycloak) still up — 'docker compose down' in coworkee-api to stop it."
