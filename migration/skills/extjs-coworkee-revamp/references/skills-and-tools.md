# Skills & Tools Used (per phase)

Reproducibility log: which Claude skills/tools were used at each phase and why. Append
as phases complete.

> **Verification gate (ADR-009) — every phase:** G1 local build (`./mvnw clean verify`
> / `npm run build`) + G2 unit tests (JUnit / Vitest) + G3 **Playwright e2e** (API tests
> backend, browser e2e frontend). Playwright is the designated e2e tool from Phase 2 on;
> no phase is "done" until all three are green on the user's machine.

## Phase 1 — Inventory (DONE)
- **Skill `extjs-to-react-migration`** — provided the phased methodology (excavate
  business logic before coding; high-risk hiding spots checklist; inventory format;
  parity-test requirement). We adapted its target stack to the user's (AntD + Keycloak
  + Spring Boot instead of the skill's TanStack-only default).
- **Tools** — `Grep`/`bash find`/`cat` to scan `client/app/**` and `server/**`;
  `Read` for key files; `Write` to author `migration/inventory/person.md` and `PLAN.md`.
- Output: 21 business rules (BR-01~21), API contract, data model, open questions.

## Phase 2 — Backend Spring Boot (DONE ✅)
- **Tools used**: Spring Initializr (`start.spring.io/starter.zip`) for the scaffold +
  Maven wrapper (no separate Maven install); `Write`/`Edit` for sources; Node
  (`scripts/generate-seed.js`) to turn the JSON seeds into `V2__seed.sql`; `./mvnw clean
  verify` with Testcontainers Postgres for JUnit; `docker compose` (postgres:16 +
  keycloak:26) + `@playwright/test` (API request context) for the e2e gate.
- **Delivered** (`C:\workspace\coworkee-api`): Person/Office/Organization/Action entities
  (Person has no password — ADR-004), DTOs + mappers (absolute picture URL, BR-01 `url`,
  BR-02 `fullname`), `{data,total}` envelope, REST endpoints (people list/get-by-key/
  create/update/filters/generate-username, offices, organizations, actions, me), Resource
  Server security with realm-role→`ROLE_*` converter + `@PreAuthorize` writes, Flyway
  V1 schema + V2 deterministic seed (51 people / 11 offices / 10 orgs / 347 actions),
  portraits served as static resources.
- **Business rules covered**: BR-01/02 (mapper), BR-03 (LocalDate `YYYY-MM-DD`),
  BR-04 (`/api/people/{key}` id∨username∨email), BR-09/11/12 (Specification paging/
  sort/filter/search), BR-18 (Bean Validation), BR-21 (`UsernameGenerator`, quirk-exact).
  BR-19/20 N/A (ADR-004, no password).
- **Gates**: G1 `./mvnw clean verify` BUILD SUCCESS · G2 22 tests green (8 username unit
  + 13 Person API integration + context) · G3 5 Playwright API e2e green
  (`coworkee-api/e2e/`) against running backend + Keycloak.
- New decisions: ADR-010 (Boot 3.5.16), ADR-011 (deterministic seed generator),
  ADR-012 (front-loaded Keycloak for the Phase 2 e2e).

## Phase 3 — Frontend skeleton + auth (DONE ✅)
- **Tools used**: `create-next-app@latest` (Next 16.2.9 / React 19, App Router, src dir);
  `Write`/`Edit`; Vitest + jsdom for domain/api unit tests; `next build` (G1);
  `@playwright/test` + Chromium for the UI smoke (G3). Read the bundled Next 16 docs
  (`node_modules/next/dist/docs`) for breaking changes (Proxy, async searchParams).
- **Delivered** (`C:\workspace\Coworkee\coworkee-web`): `src/domain/**` pure functions —
  `format/dateDiff.ts` (BR-15, Ext.Date.diff/add/plural replicated exactly, incl. leap-day
  fidelity), `format/actionIcon.ts` (BR-16), `format/date.ts` (BR-03/17 parse + `F jS, Y`),
  `person/derive.ts` (BR-01/02), `person/contact.ts` (BR-05~08); `src/api/**`
  anti-corruption layer (Zod schemas, `apiFetch` envelope-unwrap + error mapping, typed
  people/offices/organizations/actions modules); NextAuth v5 OIDC (`src/auth.ts`),
  route protection (`src/proxy.ts`), Providers (AntD registry + TanStack Query + session),
  login auto-redirect, a basic people list page (enriched in Phase 4).
- **Gates**: G1 `next build` OK · G2 41 Vitest green (dateDiff/derive/contact/actionIcon/
  date parity + api unwrap) · G3 1 Playwright UI smoke green (unauthenticated → Keycloak).
- New decisions: ADR-013 (AntD 6), ADR-014 (Zod 4 + next-auth v5), ADR-015 (Next 16 Proxy).

## Phase 4 — Pilot screens + parity (DONE ✅)
- **Tools used**: `Write`/`Edit` for AntD screens; Vitest for the grouping pure fn;
  `@playwright/test` (real Chromium) for the critical journeys; `scripts/screenshots*.mjs`
  for verification captures.
- **Delivered**: enriched list (`app/people/page.tsx`) — A-Z grouping (BR-10), debounced
  search (BR-13), office/organization filters (BR-11), URL-synced filters (BR-12), default
  lastname sort (BR-09), admin "Add employee"; detail (`app/people/[key]/page.tsx`) —
  conditional fields + `F jS, Y` + age/tenure via `dateDiff` (BR-15/17), contact buttons
  (BR-05~08), History + Coworkers dependent queries (BR-14); create/edit Wizard
  (`components/PersonWizard.tsx` + `new`/`[key]/edit`) — Steps + RHF + Zod (BR-18), username
  auto-gen with manual-edit-wins (BR-21), no password (ADR-004); role-gated writes (ADR-005).
- **Tests**: Vitest grouping (BR-10); Playwright e2e — list grouping/search, detail
  parity, wizard auto-username + manual-edit, full create→edit→list, viewer 403/hidden.
  Component-level UI BRs are covered by real-browser Playwright (rather than RTL+MSW) to
  avoid AntD 6 + jsdom friction — see the BR coverage matrix in business-logic-patterns.md.
- **Gates**: G1 `next build` OK (routes /people, /people/[key], /edit, /new) · G2 43 Vitest
  green · G3 7 Playwright e2e green. Screenshots 03-07 in `migration/screenshots/`.
- BR matrix has no orphans (BR-19/20 N/A by ADR-004).

## Phase 5 — Keycloak + docker-compose (DONE ✅ — infra front-loaded in Phase 2)
- **Tools used**: `docker compose` (postgres:16 + keycloak:26), Keycloak realm export JSON,
  `@playwright/test` for the full browser login flow, `node scripts/screenshots.mjs`
  (Chromium) for verification screenshots.
- **Delivered**: `coworkee-api/docker-compose.yml`, `coworkee-api/keycloak/realm-coworkee.json`
  (client `coworkee-web` confidential + direct-access-grant, roles `coworkee-admin`/
  `coworkee-viewer`, seed users `admin`/`viewer`); backend `issuer-uri` + role converter;
  frontend NextAuth Keycloak provider + `.env`.
- **Gates**: G1/G2 unchanged (no regression). G3 full login e2e green
  (`coworkee-web/e2e/login.spec.ts`): admin logs in via Keycloak → directory list renders
  real backend data. Screenshots in `migration/screenshots/` (01 login page, 02 list).
- **Remaining for Phase 4**: role-gated write UI (admin sees Add/Edit; viewer hidden +
  backend 403) — covered with the pilot screens.

## Document-format skills (use only when producing those deliverables)
- `docx` / `pptx` / `xlsx` / `pdf` — not needed for code, but available if the user
  later wants a written migration report or slide summary. Read the relevant SKILL.md
  only at that point.
