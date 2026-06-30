# Coworkee Revamp — Local Runbook

Start the full stack on your machine. Ports: Postgres 5432, Keycloak 8081, backend 8080,
frontend 3000.

## 1. Infra (Postgres + Keycloak)
```powershell
cd C:\workspace\Coworkee\coworkee-api
docker compose up -d
```
Keycloak takes ~30s to import the `coworkee` realm. Admin console: http://localhost:8081
(admin/admin). To wipe data and reseed: `docker compose down -v` then `up -d`.

## 2. Backend (coworkee-api)
```powershell
cd C:\workspace\Coworkee\coworkee-api
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
.\mvnw spring-boot:run
```
Flyway creates the schema + seed (51 people / 11 offices / 10 orgs / 347 actions) on first
run against an empty DB. API at http://localhost:8080/api (requires a Keycloak token).

## 3. Frontend (coworkee-web)
```powershell
cd C:\workspace\Coworkee\coworkee-web
npm install        # first time only
npm run dev        # or: npm run build ; npm run start
```
Open http://localhost:3000 → redirected to Keycloak login.

## Demo users (Keycloak realm `coworkee`)
| user | password | role | can write? |
|---|---|---|---|
| admin | admin | coworkee-admin | yes (Add/Edit visible; POST/PUT allowed) |
| viewer | viewer | coworkee-viewer | no (Add hidden; backend returns 403) |

## Verification gates (per phase)
- **Backend**: `cd coworkee-api && .\mvnw clean verify` (JUnit + Testcontainers).
  API e2e: `cd coworkee-api\e2e && npm i && npx playwright test` (stack must be up).
- **Frontend**: `cd coworkee-web && npm run test` (Vitest), `npm run build`,
  `npx playwright test` (e2e; stack must be up).

## Screenshots
Regenerate verification captures into `migration/screenshots/`:
```powershell
cd C:\workspace\Coworkee\coworkee-web
node scripts/screenshots.mjs admin admin
node scripts/screenshots-phase4.mjs
```
