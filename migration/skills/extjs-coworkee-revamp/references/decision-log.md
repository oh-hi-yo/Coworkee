# Decision Log (ADR-style)

Architectural decisions for the Coworkee revamp, with rationale. Append as we go.

## ADR-001 — Target stack
React 19 + Next.js 16 (App Router) + Ant Design 5 + TanStack Query + RHF/Zod (web);
Spring Boot 3 + JDK 17 + PostgreSQL + Flyway + JPA (api); Keycloak for auth.
**Why:** user-specified modern stack; AntD gives ready enterprise components close to
ExtJS's widget richness; TanStack Query is the natural replacement for Ext data stores.

## ADR-002 — REST instead of Ext.Direct RPC
Replace `Server.people.list(params)` RPC with `GET /api/people?...`.
**Why:** idiomatic Spring, cacheable, easier to secure with Resource Server. Response
envelope `{ data, total }` is preserved and unwrapped by a web anti-corruption layer.

## ADR-003 — Two separate repos
`coworkee-web` and `coworkee-api` as independent repos.
**Why:** user choice; independent deploy/lifecycle.

## ADR-004 — Auth = Keycloak, Person loses password (Q1 → A)
Keycloak owns authentication with seed users; Person is pure directory data with the
`password` field removed from entity/API. Frontend uses NextAuth OIDC; backend is a
Resource Server validating Keycloak JWTs.
**Why:** clean separation of identity vs directory; avoids storing/validating passwords;
realistic modern pattern. **Consequence:** BR-19/BR-20 (password required / confirm
password) do not apply to Person; pilot Wizard has no password fields.

## ADR-005 — Remove readonly demo mode (Q2)
Drop the "writes rollback in readonly mode" behavior; gate writes with Keycloak roles +
Spring Security `@PreAuthorize`.
**Why:** real authorization is more useful for training than the demo guard.

## ADR-006 — Pilot scope includes create/edit Wizard (Q3)
Pilot = employee list + detail + create/edit Wizard (no password fields).
**Why:** user wants the form patterns (Steps + RHF + Zod, username auto-gen) in the
pilot so the reusable pattern covers writes too.

## ADR-007 — Seed data + portraits (Q4)
Convert `People.json` / `Offices.json` / `Organizations.json` into a Flyway seed
migration. Copy `server/public/api/portraits/**` into `coworkee-api` static resources;
`picture` is emitted as an absolute URL.
**Why:** keep the familiar demo dataset; backend-served portraits match BR (Sequelize
getter prepended the API URL).

## ADR-008 — PostgreSQL via docker-compose
**Why:** user choice; closer to production than SQLite; runs alongside Keycloak in one
compose file.

## ADR-009 — Per-phase verification gates (Playwright mandatory)
Every phase must pass three gates on the user's local machine before being marked done
or proceeding: G1 build (`./mvnw clean verify` / `npm run build`), G2 unit tests
(JUnit / Vitest), G3 **Playwright e2e** (API tests for the backend, browser e2e for the
frontend). No phase advances on red.
**Why:** user requirement — keep every increment runnable and proven, not just the final
pilot. Playwright is the single designated e2e tool, used from Phase 2 onward.

## Open / revisit later
- Mobile (phone/tablet) profiles are out of scope for pilot; revisit if needed.
- `actions/events` history model: included read-only in detail; full CRUD later.
