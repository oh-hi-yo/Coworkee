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

## Phase 2 — Backend Spring Boot (PENDING)
- Planned tools: `bash` (Maven/Gradle, `mvn`/`./mvnw`, Java 17), `Write`/`Edit` for
  sources, Flyway for seed, Testcontainers + JUnit for tests.
- Output target: `coworkee-api` with Person/Office/Organization/Action entities,
  REST endpoints, Resource Server security, seed migration, tests.

## Phase 3 — Frontend skeleton + auth (PENDING)
- Planned tools: `bash` (npm/pnpm, `create-next-app`), `Write`/`Edit`.
- Libraries: Ant Design 5, TanStack Query, React Hook Form, Zod, NextAuth v5.
- Output: `coworkee-web` skeleton, `src/domain/**` pure fns (+ Vitest), `src/api/**`
  anti-corruption layer, NextAuth OIDC wiring.

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
