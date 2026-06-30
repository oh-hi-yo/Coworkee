/*
 * Drives the real app in Chromium and captures verification screenshots into
 * ../migration/screenshots. Requires the full stack up:
 *   coworkee-api/docker compose up -d  (postgres + keycloak)
 *   coworkee-api ./mvnw spring-boot:run (backend :8080)
 *   coworkee-web npm run start          (frontend :3000)
 *
 * Usage: node scripts/screenshots.mjs [user] [password]
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../migration/screenshots');
const BASE = process.env.WEB_BASE ?? 'http://localhost:3000';
const user = process.argv[2] ?? 'admin';
const password = process.argv[3] ?? 'admin';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

// 1) Protected route -> Keycloak login page
await page.goto(`${BASE}/people`);
await page.waitForURL(/\/realms\/coworkee\//, { timeout: 30_000 });
await page.waitForSelector('input[name="username"]');
await shot('01-keycloak-login.png');

// 2) Sign in -> employee directory list (data served by the Spring backend)
await page.fill('input[name="username"]', user);
await page.fill('input[name="password"]', password);
await Promise.all([
  page.waitForURL(`${BASE}/people`, { timeout: 30_000 }),
  page.click('#kc-login, input[type=submit], button[type=submit]'),
]);
await page.waitForSelector('.ant-table-row', { timeout: 30_000 });
await page.waitForTimeout(800);
await shot(`02-directory-list-${user}.png`);

await browser.close();
console.log('done');
