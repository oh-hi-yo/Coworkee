import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 4 pilot critical journeys (G3). Requires the full stack up
 * (coworkee-api docker compose + spring-boot:run, coworkee-web running).
 */

async function login(page: Page, user: string, password: string) {
  await page.goto('/people');
  await page.waitForURL(/\/realms\/coworkee\//, { timeout: 30_000 });
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL(/\/people/, { timeout: 30_000 }),
    page.click('#kc-login, input[type=submit], button[type=submit]'),
  ]);
}

async function fillByPlaceholder(page: Page, placeholder: string, value: string) {
  await page.getByPlaceholder(placeholder, { exact: true }).fill(value);
}

async function fillDate(page: Page, placeholder: string, value: string) {
  const inp = page.getByPlaceholder(placeholder, { exact: true });
  await inp.click();
  await inp.fill(value);
  await inp.press('Enter');
  await page.keyboard.press('Escape'); // close the picker panel so it can't overlay other controls
}

async function selectByIndex(page: Page, index: number) {
  // Office + Organization are the only two AntD Selects (role=combobox) in the wizard.
  // The dropdown is virtualized and may sit below the fold, so select the highlighted
  // first option with the keyboard instead of clicking an off-screen element.
  await page.getByRole('combobox').nth(index).click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').first().waitFor();
  await page.keyboard.press('Enter');
}

test.describe('admin', () => {
  test('list is A-Z grouped, default lastname order, and search filters (BR-09/10/13)', async ({
    page,
  }) => {
    await login(page, 'admin', 'admin');
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
    // first group header is "A", first person is Armstrong (default lastname sort)
    await expect(page.getByText('Armstrong')).toBeVisible();

    await page.getByPlaceholder('Search name, email, title…').fill('Banks');
    await expect(page.getByRole('link', { name: 'Benjamin Banks' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Armstrong')).toHaveCount(0);
  });

  test('detail shows formatted dates, age/tenure, history and coworkers (BR-14/15/17)', async ({
    page,
  }) => {
    await login(page, 'admin', 'admin');
    await page.goto('/people/benjamin.banks');
    await expect(page.locator('.ant-descriptions')).toBeVisible();
    await expect(page.getByText('December 12th, 1984')).toBeVisible(); // F jS, Y
    await expect(page.getByText(/\(\d+ years\)/).first()).toBeVisible(); // dateDiff age
    await expect(page.getByText(/History \(\d+\)/)).toBeVisible();
    await expect(page.getByText(/Coworkers \(\d+\)/)).toBeVisible();
  });

  test('wizard auto-generates username and respects manual edits (BR-21)', async ({ page }) => {
    await login(page, 'admin', 'admin');
    await page.goto('/people/new');
    await expect(page.locator('.ant-steps')).toBeVisible();

    await fillByPlaceholder(page, 'First name', 'Ada');
    await fillByPlaceholder(page, 'Last name', 'Lovelace');
    await page.getByPlaceholder('Last name', { exact: true }).blur();
    await expect(page.getByPlaceholder('Username', { exact: true })).toHaveValue('ada_lovelace', {
      timeout: 5_000,
    });

    // manual edit must win — changing the name does NOT overwrite it
    await fillByPlaceholder(page, 'Username', 'ada_custom');
    await fillByPlaceholder(page, 'Last name', 'Byron');
    await page.getByPlaceholder('Last name', { exact: true }).blur();
    await page.waitForTimeout(800);
    await expect(page.getByPlaceholder('Username', { exact: true })).toHaveValue('ada_custom');
  });

  test('create employee end-to-end → appears in the directory (BR-18/21)', async ({ page }) => {
    const suffix = String(Date.now()).slice(-6);
    const last = `Tester${suffix}`;
    await login(page, 'admin', 'admin');
    await page.goto('/people/new');

    // General
    await fillByPlaceholder(page, 'First name', 'Casey');
    await fillByPlaceholder(page, 'Last name', last);
    await page.getByPlaceholder('Last name', { exact: true }).blur();
    await fillByPlaceholder(page, 'Email', `casey.${suffix}@extjsdemo.com`);
    await fillByPlaceholder(page, 'Title', 'QA Engineer');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Personal
    await fillDate(page, 'Birthday', '1992-05-04');
    await fillByPlaceholder(page, 'Phone', '1-555-0190');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Work
    await selectByIndex(page, 0); // Office
    await selectByIndex(page, 1); // Organization
    await fillDate(page, 'Entry date', '2022-01-10');
    // the Create button is the form's only submit button (Next/Back/Cancel are type=button)
    await page.locator('button[type=submit]').click();

    // redirected to the new person's detail
    await expect(page.getByText(`Casey ${last}`)).toBeVisible({ timeout: 15_000 });
    const id = new URL(page.url()).pathname.split('/').pop()!;

    // edit: change the title and save (plan 4.5 journey #4)
    await page.goto(`/people/${id}/edit`);
    await page.waitForSelector('.ant-steps');
    await page.getByPlaceholder('Title', { exact: true }).fill('Senior QA Engineer');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('button[type=submit]').click();
    await expect(page.getByText('Senior QA Engineer')).toBeVisible({ timeout: 15_000 });

    // and it shows up in the list search
    await page.goto('/people');
    await page.getByPlaceholder('Search name, email, title…').fill(last);
    await expect(page.getByRole('link', { name: `Casey ${last}` })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('viewer', () => {
  test('cannot add (button hidden) and is blocked from /people/new (ADR-005)', async ({ page }) => {
    await login(page, 'viewer', 'viewer');
    await expect(page.locator('.ant-table-row').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add employee' })).toHaveCount(0);

    await page.goto('/people/new');
    await expect(page.getByText('403')).toBeVisible();
  });
});
