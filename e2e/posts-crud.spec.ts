import { expect, test } from '@playwright/test';

/**
 * Critical CRUD flow for posts.
 *
 * Walks a single post through the full lifecycle:
 *   create → view → edit → delete
 *
 * Uses a Date.now()-suffixed title so concurrent or repeated runs
 * don't collide with seeded data in db.json. The post is deleted at
 * the end so the mock backend is left clean.
 *
 * The delete button uses window.confirm; we register a dialog handler
 * globally on the page so it auto-accepts.
 */
test.describe('Posts CRUD', () => {
  test('create, edit and delete a post as the owner', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    // 1. Login as alice.
    await page.goto('/login');
    await page.getByLabel(/usuario|username/i).fill('alice');
    await page.getByLabel(/contraseña|password/i).fill('alice123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/posts$/);

    // 2. Create a new post with a unique title.
    const title = `e2e post ${Date.now()}`;
    const updatedTitle = `${title} (edited)`;

    await page.getByTestId('posts-new-link').click();
    await expect(page).toHaveURL(/\/posts\/new$/);

    await page.getByTestId('post-form-title').fill(title);
    await page
      .getByTestId('post-form-body')
      .fill(
        'Body created by the Playwright e2e suite. Long enough to clear the minLength validator.',
      );
    await page.getByTestId('post-form-tags').fill('e2e,playwright');
    await page.getByTestId('post-form-submit').click();

    // 3. Land on the detail page with the new title.
    await expect(page).toHaveURL(/\/posts\/[^/]+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByTestId('post-actions')).toBeVisible();

    // 4. Edit the post via the action link.
    await page.getByTestId('post-edit-link').click();
    await expect(page).toHaveURL(/\/posts\/[^/]+\/edit$/);

    await page.getByTestId('post-form-title').fill(updatedTitle);
    await page.getByTestId('post-form-submit').click();

    // 5. Back on the detail page with the new title.
    await expect(page).toHaveURL(/\/posts\/[^/]+$/);
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible();
    // updatedTitle is `${title} (edited)`, so the default accessible
    // name match would resolve the new heading as a substring of the
    // old. Use `exact: true` to enforce a full-string match.
    await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);

    // 6. Delete and return to the list.
    await page.getByTestId('post-delete-button').click();
    await expect(page).toHaveURL(/\/posts(?:\?|$)/);

    // 7. Verify the post is gone from the list (search is the most
    //    reliable way to filter down to a single row).
    await page.getByTestId('posts-search-input').fill(updatedTitle);
    await expect(page.getByTestId('posts-empty')).toBeVisible();
  });
});
