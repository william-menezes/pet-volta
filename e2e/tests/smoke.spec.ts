import { expect, test } from '@playwright/test';

const email = process.env['E2E_EMAIL'] ?? '';
const password = process.env['E2E_PASSWORD'] ?? '';

test.describe('Pet Volta - Smoke', () => {
  test('Landing carrega', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pet Volta/i);
  });

  test('Login -> Dashboard (se credenciais estiverem definidas)', async ({ page }) => {
    test.skip(!email || !password, 'Defina E2E_EMAIL e E2E_PASSWORD para rodar este teste.');

    await page.goto('/auth/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha').fill(password);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Resumo dos seus pets/i)).toBeVisible();
  });
});

