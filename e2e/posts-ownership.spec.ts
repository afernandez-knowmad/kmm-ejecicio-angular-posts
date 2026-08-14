import { expect, test } from '@playwright/test';

/**
 * Ownership enforcement e2e.
 *
 * Exercises the `ownershipGuardFor('posts', ...)` guard: a user that
 * is not the author of a post cannot reach the edit form, even by
 * typing the URL directly. They are redirected to the read-only view
 * with a `forbidden=1` query param, and the detail page renders the
 * forbidden state instead of the edit / delete actions.
 *
 * The seed data gives post id 1 to alice and post id 2 to bruno.
 */
test.describe('Post ownership', () => {
  test('non-owner is redirected from /posts/:id/edit to the read-only view with forbidden', async ({
    page,
  }) => {
    // 1. Login as bruno.
    await page.goto('/login');
    await page.getByLabel(/usuario|username/i).fill('bruno');
    await page.getByLabel(/contraseña|password/i).fill('bruno123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/posts$/);

    // 2. Try to forge navigation to alice's post edit URL.
    await page.goto('/posts/1/edit');

    // 3. Should be redirected to /posts/1?forbidden=1 — the detail
    //    page picks up the query and renders the forbidden state.
    await expect(page).toHaveURL(/\/posts\/1\?forbidden=1$/);
    await expect(page.getByTestId('post-detail-forbidden')).toBeVisible();

    // 4. Edit / delete actions must NOT be visible to a non-owner.
    await expect(page.getByTestId('post-actions')).toHaveCount(0);
  });

  test('owner can open the edit form for their own post', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario|username/i).fill('alice');
    await page.getByLabel(/contraseña|password/i).fill('alice123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/posts$/);

    // Post id 1 belongs to alice (userId 1).
    await page.goto('/posts/1/edit');
    await expect(page).toHaveURL(/\/posts\/1\/edit$/);
    await expect(page.getByTestId('post-form-edit')).toBeVisible();
  });
});
