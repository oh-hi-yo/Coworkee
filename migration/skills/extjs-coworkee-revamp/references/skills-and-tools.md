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

## Phase 4 — Pilot screens + parity (PENDING)
- Planned tools: Vitest + RTL + MSW (component/parity), Playwright (e2e critical paths).
- Each BR-xx → at least one before/after test.

## Phase 5 — Keycloak + docker-compose (PENDING)
- Planned tools: `bash` (docker compose), Keycloak realm export JSON.
- Output: one compose file (Keycloak + Postgres), realm/client/users, end-to-end auth.

## Document-format skills (use only when producing those deliverables)
- `docx` / `pptx` / `xlsx` / `pdf` — not needed for code, but available if the user
  later wants a written migration report or slide summary. Read the relevant SKILL.md
  only at that point.
