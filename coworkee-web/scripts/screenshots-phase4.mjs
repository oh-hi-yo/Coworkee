/*
 * Phase 4 verification screenshots: enriched list (grouping/filters/search), detail page
 * (age/tenure/contacts/history/coworkers), create Wizard (username auto-gen), and the
 * admin-vs-viewer difference. Requires the full stack up.
 *
 * Usage: node scripts/screenshots-phase4.mjs
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../migration/screenshots');
const BASE = process.env.WEB_BASE ?? 'http://localhost:3000';

async function login(page, user, password) {
  await page.goto(`${BASE}/people`);
  await page.waitForURL(/\/realms\/coworkee\//, { timeout: 30_000 });
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL(`${BASE}/people**`, { timeout: 30_000 }),
    page.click('#kc-login, input[type=submit], button[type=submit]'),
  ]);
  await page.waitForSelector('.ant-table-row', { timeout: 30_000 });
}

const browser = await chromium.launch();

// --- admin ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await ctx.newPage();
  await login(page, 'admin', 'admin');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '03-list-grouped-admin.png') });
  console.log('saved 03-list-grouped-admin.png');

  // search filter
  await page.fill('input[type="search"], .ant-input', 'Banks').catch(() => {});
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '04-list-search.png') });
  console.log('saved 04-list-search.png');

  // detail: open Benjamin Banks
  await page.goto(`${BASE}/people/benjamin.banks`);
  await page.waitForSelector('.ant-descriptions', { timeout: 30_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '05-detail.png') });
  console.log('saved 05-detail.png');

  // wizard: new employee, auto-username on blur
  await page.goto(`${BASE}/people/new`);
  await page.waitForSelector('.ant-steps', { timeout: 30_000 });
  const inputs = page.locator('.ant-card input.ant-input');
  await inputs.nth(0).fill('Ada'); // First name
  await inputs.nth(1).fill('Lovelace'); // Last name
  await inputs.nth(1).blur();
  await page.waitForTimeout(1500); // let generate-username resolve
  await page.screenshot({ path: path.join(OUT, '06-wizard-username.png') });
  console.log('saved 06-wizard-username.png');
  await ctx.close();
}

// --- viewer (no Add button) ---
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await ctx.newPage();
  await login(page, 'viewer', 'viewer');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '07-list-viewer.png') });
  console.log('saved 07-list-viewer.png');
  await ctx.close();
}

await browser.close();
console.log('done');
