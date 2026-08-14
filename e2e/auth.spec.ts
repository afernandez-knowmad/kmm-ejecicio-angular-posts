import { expect, test } from '@playwright/test';

/**
 * Auth flow e2e.
 *
 * Covers the acceptance criteria tied to authentication:
 *   - Private routes are not accessible without a session.
 *   - Login validates against the mock backend and lands on /posts.
 *   - Logout returns the user to /login.
 *
 * Each test receives a fresh browser context, so the AuthSessionStorage
 * localStorage entry from one test does not leak into the next.
 */
test.describe('Auth', () => {
  test('redirects to /login when accessing a private route without a session', async ({ page }) => {
    await page.goto('/posts');
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('logs in with valid credentials and lands on /posts', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario|username/i).fill('alice');
    await page.getByLabel(/contraseña|password/i).fill('alice123');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByTestId('posts-items')).toBeVisible();
  });

  test('rejects invalid credentials without leaving the login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario|username/i).fill('alice');
    await page.getByLabel(/contraseña|password/i).fill('wrong-password');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toBeVisible();
  });

  test('logs out and returns to /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario|username/i).fill('alice');
    await page.getByLabel(/contraseña|password/i).fill('alice123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/posts$/);

    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
