import { expect, test, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const png = fileURLToPath(new URL('../fixtures/pixel.png', import.meta.url));

async function register(page: Page, user: { name: string; email: string; password: string }) {
  await page.goto('/register');
  await page.getByTestId('register-name').fill(user.name);
  await page.getByTestId('register-email').fill(user.email);
  await page.getByTestId('register-password').fill(user.password);
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('lists-page')).toBeVisible();
}

test('logowanie istniejącym kontem', async ({ page }) => {
  const email = `login.${Date.now()}@example.com`;
  await register(page, { name: 'Ola', email, password: 'haslo1234' });
  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('login-email')).toBeVisible();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('haslo1234');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('lists-page')).toBeVisible();
});

test('właściciel zarządza listą, a współdzielący zmienia tylko status', async ({ browser }) => {
  const stamp = Date.now();
  const owner = { name: 'Jan', email: `jan.${stamp}@example.com`, password: 'haslo1234' };
  const guest = { name: 'Ania', email: `ania.${stamp}@example.com`, password: 'haslo1234' };

  const ownerContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const guestPage = await guestContext.newPage();

  await register(guestPage, guest);
  await register(ownerPage, owner);

  await ownerPage.getByTestId('new-list-button').click();
  await ownerPage.getByTestId('list-name-input').fill('Zakupy na piątek');
  await ownerPage.getByTestId('list-date-trigger').click();
  await expect(ownerPage.locator('.rdp-root')).toBeVisible();
  await ownerPage.keyboard.press('Escape');
  await ownerPage.getByTestId('list-date').fill('2026-10-16');
  await ownerPage.getByTestId('create-list-submit').click();
  await expect(ownerPage.getByTestId('list-title')).toHaveText('Zakupy na piątek');

  await ownerPage.getByTestId('item-name').fill('mleko');
  await ownerPage.getByTestId('item-quantity').fill('2');
  await ownerPage.getByTestId('item-unit').click();
  await ownerPage.getByRole('option', { name: 'l', exact: true }).click();
  await ownerPage.getByTestId('item-image').setInputFiles(png);
  await ownerPage.getByTestId('add-item-submit').click();
  await expect(ownerPage.getByTestId('item-label')).toHaveText('mleko');
  await expect(ownerPage.getByTestId('item-photo')).toBeVisible();

  await ownerPage.getByTestId('item-checkbox').click();
  await expect(ownerPage.getByTestId('item-label')).toHaveClass(/line-through/);

  await ownerPage.getByTestId('edit-list-button').click();
  await ownerPage.getByTestId('edit-list-name').fill('Zakupy na sobotę');
  await ownerPage.getByTestId('save-list-button').click();
  await expect(ownerPage.getByTestId('list-title')).toHaveText('Zakupy na sobotę');

  await ownerPage.getByTestId('share-button').click();
  await ownerPage.getByTestId('share-email').fill(guest.email);
  await ownerPage.getByTestId('share-submit').click();
  await expect(ownerPage.getByTestId('share-user')).toContainText(guest.email);

  await guestPage.goto('/lists');
  await guestPage.getByTestId('list-card').filter({ hasText: 'Zakupy na sobotę' }).click();
  await expect(guestPage.getByTestId('shared-note')).toBeVisible();
  await expect(guestPage.getByTestId('add-item-form')).toHaveCount(0);
  await expect(guestPage.getByTestId('item-delete')).toHaveCount(0);
  await guestPage.getByTestId('item-checkbox').click();
  await expect(guestPage.getByTestId('item-label')).not.toHaveClass(/line-through/);

  await ownerPage.reload();
  await expect(ownerPage.getByTestId('item-label')).not.toHaveClass(/line-through/);

  await ownerPage.getByTestId('item-delete').click();
  await ownerPage.getByTestId('confirm-delete-item').click();
  await expect(ownerPage.getByTestId('item-row')).toHaveCount(0);

  await ownerPage.getByTestId('delete-list-button').click();
  await ownerPage.getByTestId('confirm-delete-list').click();
  await expect(ownerPage.getByTestId('lists-page')).toBeVisible();
  await expect(ownerPage.getByText('Zakupy na sobotę')).toHaveCount(0);

  await ownerContext.close();
  await guestContext.close();
});
