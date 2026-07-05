---
name: extjs-coworkee-revamp
description: >
  Playbook + living record for revamping the ExtJS "Coworkee" employee-directory app
  to a modern full stack: Next.js 16 + React 19 + Ant Design 6 + TanStack Query 5 +
  React Hook Form 7/Zod 4 + NextAuth v5 (frontend), and Spring Boot 3.5 + JDK 17 +
  PostgreSQL + Flyway + Spring Security Resource Server (backend), with Keycloak (OIDC)
  for auth. The pilot (people list + detail + create/edit Wizard) is COMPLETE. Use this
  skill when continuing/extending this migration, when porting another ExtJS screen
  (office, organization, history) using the same patterns, or when you need the
  ExtJS→React/Spring component mapping, the architectural decisions, or which tools/
  skills were used at each phase. Reusable for similar ExtJS 5/6 → modern revamps.
---

# ExtJS Coworkee Revamp — Playbook & Living Record

This skill is BOTH a reusable playbook for ExtJS→modern migrations AND a living record
of how *this* Coworkee revamp was done (decisions, component mapping, tools used). It
is updated at every phase so the work is reproducible and the next screen follows the
same path.

## What we are building

| Layer | Tech |
|---|---|
| Frontend | Next.js 16.2 (App Router) + React 19.2 + Ant Design 6.5 |
| Server state | TanStack Query 5 |
| Forms | React Hook Form 7 + Zod 4 (`@hookform/resolvers`) |
| Auth (frontend) | NextAuth / Auth.js v5 (OIDC → Keycloak) |
| Backend | Spring Boot 3.5.16, JDK 17, REST |
| Persistence | PostgreSQL 16 + Flyway + Spring Data JPA |
| Auth (backend) | Spring Security OAuth2 Resource Server (JWT from Keycloak) |
| Auth server | Keycloak 26 (docker-compose) |
| Tests | Vitest (web unit), JUnit + Testcontainers (api), Playwright (e2e, both) |

- Source app (read-only reference): `Coworkee/client` + `Coworkee/server`
- Target backend: `Coworkee/coworkee-api` · Target frontend: `Coworkee/coworkee-web`
  (both live inside the Coworkee repo — see conventions below)

## Status — Pilot COMPLETE ✅

Delivered end-to-end and verified (G1 build + G2 unit + G3 Playwright, per phase):

| Phase | What | Where |
|---|---|---|
| 2 Backend | Spring Boot REST + JPA + Flyway seed + Keycloak Resource Server | `coworkee-api/` |
| 3 Frontend | Next.js + AntD + TanStack + NextAuth; `domain/` pure fns; `api/` ACL | `coworkee-web/` |
| 5 Auth | docker-compose (Postgres+Keycloak) + realm; full OIDC login e2e | `coworkee-api/docker-compose.yml`, `keycloak/` |
| 4 Pilot | people **list** (group/filter/search) + **detail** (age/tenure/history/coworkers) + create/edit **Wizard** | `coworkee-web/src/app/people/**` |

- All 21 business rules (BR-01~21) covered by a test; BR-19/20 N/A (ADR-004, no password).
  Coverage matrix in `references/business-logic-patterns.md`.
- Runs locally: `bash migration/run-local.sh` (see `migration/RUNBOOK.md`). Demo users
  `admin/admin` (write) and `viewer/viewer` (read-only).
- Verification screenshots retained in `migration/screenshots/` (01 login → 09 clean detail).
- **Next**: office / organization / history slices — repeat the workflow below.

## The workflow (do not skip phases)

1. **Inventory & business-logic excavation** — scan ExtJS model `calculate`/`convert`,
   grid renderers/templates, `Ext.override`, store listeners, ViewModel formulas,
   validators, and the server API. Record every rule as `BR-xx` in
   `migration/inventory/<module>.md`. Unexplained behavior is replicated, not deleted.
2. **Architecture mapping** — map each ExtJS construct to its React/Spring home using
   `references/component-mapping.md`. Extract business rules into pure functions first
   (`coworkee-web/src/domain/**`), independent of UI.
3. **Backend first** — port the Ext.Direct RPC + Sequelize layer to Spring Boot REST +
   JPA. Keep the response envelope shape; absorb quirks in the backend, not the client.
4. **Frontend data layer** — TanStack Query + an anti-corruption layer
   (`coworkee-web/src/api/<module>.ts`) that unwraps `{ data, total }` and Zod-parses.
5. **UI slice** — AntD components, thin and presentational; logic stays in `domain/`.
6. **Prove parity** — before/after table-driven tests; every `BR-xx` references a test.

## Reference files

- `references/component-mapping.md` — ExtJS construct → React/AntD/Spring target (the
  lookup table to consult before writing any component).
- `references/decision-log.md` — architectural decisions (ADR-style) + rationale.
- `references/business-logic-patterns.md` — recurring "magic" patterns (calculate
  fields, `dateDiff`, `generateUsername`, Ext.Direct envelope, id/username/email
  lookup) and exactly how each was ported.
- `references/skills-and-tools.md` — which Claude skills/tools were used at each phase
  and why (so the process itself is reproducible).

## How to extend (next screens)

Office / Organization / History follow the SAME path: inventory the module → map with
`component-mapping.md` → backend entity+endpoints → web api layer+domain fns → AntD
screen → parity tests. Append new `BR-xx` rows and any new mappings/decisions to the
reference files as you go.

## Working conventions (user-mandated)

These are standing rules for this project — follow them every phase:

1. **Verify with screenshots, and retain them.** Beyond the G1/G2/G3 gates, drive the
   *running* app with Playwright and capture screenshots (`coworkee-web/scripts/
   screenshots.mjs`, `screenshots-phase4.mjs`) into `migration/screenshots/`. Commit the
   PNGs with the phase and state what each verifies. Test logs alone are not enough.
2. **Repos live under `Coworkee/`.** `coworkee-api` and `coworkee-web` are committed inside
   the Coworkee repo and pushed to its GitHub remote (branch
   `feature/migrate-extjs-practice`) — one commit per phase. Do not give them separate git
   remotes.
3. **Keep it runnable locally.** Maintain `migration/run-local.sh` / `stop-local.sh` and
   `migration/RUNBOOK.md` so the user can start the whole stack from their own VS Code Git
   Bash terminal (`bash migration/run-local.sh`).

## Update protocol (keep this skill alive)

When you complete a unit of work, update the matching reference file in the SAME commit:
new component mapping → `component-mapping.md`; new architectural choice →
`decision-log.md`; new reusable port pattern → `business-logic-patterns.md`; a phase
done → `skills-and-tools.md`. The skill must always reflect the current state of the
revamp.
