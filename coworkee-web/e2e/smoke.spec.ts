import { test, expect } from '@playwright/test';

/**
 * Phase 3 G3 — auth smoke: an unauthenticated visit to a protected route is redirected
 * to the Keycloak login page (proxy → /login → signIn('keycloak')).
 */
test('unauthenticated visit redirects to the Keycloak login page', async ({ page }) => {
  await page.goto('/people');
  await page.waitForURL(/\/realms\/coworkee\//, { timeout: 30_000 });
  expect(page.url()).toContain('/realms/coworkee/');
  // Keycloak renders a username/password form
  await expect(page.locator('input[name="username"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});
