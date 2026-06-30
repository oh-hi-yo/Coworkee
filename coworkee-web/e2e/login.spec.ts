import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 5 G3 — full OIDC login flow end-to-end: NextAuth → Keycloak → back to the app,
 * then the directory list renders real data served by the Spring backend (Phase 2).
 * Requires the stack up: coworkee-api docker compose + spring-boot:run, web npm run start.
 */
async function keycloakLogin(page: Page, username: string, password: string) {
  await page.goto('/people');
  await page.waitForURL(/\/realms\/coworkee\//, { timeout: 30_000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL('**/people', { timeout: 30_000 }),
    page.click('#kc-login, input[type=submit], button[type=submit]'),
  ]);
}

test('admin logs in via Keycloak and sees the directory list from the backend', async ({ page }) => {
  await keycloakLogin(page, 'admin', 'admin');
  // table rendered with seed data, default lastname sort
  await expect(page.locator('.ant-table-row').first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Armstrong')).toBeVisible();
  await expect(page.getByText('Admin User')).toBeVisible();
});
