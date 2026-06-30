#!/usr/bin/env bash
#
# Start the whole Coworkee stack from VS Code's Git Bash terminal:
#
#   bash migration/run-local.sh
#
# Brings up Postgres + Keycloak (docker), then the Spring backend (in the background,
# logging to coworkee-api/backend.log), then the Next.js frontend in the FOREGROUND so this
# terminal shows its logs. Ctrl+C stops the frontend; the backend keeps running — use
# `bash migration/stop-local.sh` to stop everything.
#
# Ports: frontend 3000, backend 8080, Keycloak 8081, Postgres 5432.
# Demo users: admin/admin (write), viewer/viewer (read-only).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-/c/Program Files/Eclipse Adoptium/jdk-17.0.19.10-hotspot}"
export PATH="$JAVA_HOME/bin:/c/Program Files/Docker/Docker/resources/bin:$PATH"

echo "[1/3] Postgres + Keycloak (docker compose up -d)..."
( cd "$ROOT/coworkee-api" && docker compose up -d )
printf "      waiting for Keycloak realm"
until curl -sf http://localhost:8081/realms/coworkee/.well-known/openid-configuration >/dev/null 2>&1; do
  printf "."; sleep 3
done
echo " ready"

if [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/people 2>/dev/null)" = "401" ]; then
  echo "[2/3] Backend already running on :8080 — skipping"
else
  echo "[2/3] Backend coworkee-api (logs -> coworkee-api/backend.log)..."
  ( cd "$ROOT/coworkee-api" && nohup ./mvnw -q spring-boot:run > backend.log 2>&1 & echo $! > .backend.pid )
  printf "      waiting for backend"
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/people 2>/dev/null)" = "401" ]; do
    printf "."; sleep 3
  done
  echo " ready"
fi

echo "[3/3] Frontend coworkee-web — open http://localhost:3000  (admin/admin or viewer/viewer)"
echo "      (Ctrl+C stops the frontend; backend keeps running)"
cd "$ROOT/coworkee-web"
[ -d node_modules ] || npm install
exec npm run dev
