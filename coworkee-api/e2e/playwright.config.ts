import { defineConfig } from '@playwright/test';

/**
 * Backend API e2e (Phase 2 G3). Assumes the stack is already running:
 *   docker compose up -d        (postgres + keycloak)
 *   ./mvnw spring-boot:run       (coworkee-api on :8080)
 * Use `npm run e2e` at the repo root (scripts/e2e.* ) to orchestrate automatically.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:8080',
  },
});
