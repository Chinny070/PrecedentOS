import { expect, test } from '@playwright/test';

test('landing clearly distinguishes demo content from chain observations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /precedent is a question/i })).toBeVisible();
  await expect(page.getByText(/no live validator votes shown/i)).toBeVisible();
  await page.getByRole('link', { name: /open the research lab/i }).click();
  await expect(page).toHaveURL(/\/lab$/);
});

test('unknown routes recover to the research lab', async ({ page }) => {
  await page.goto('/not-a-real-route');
  await expect(page).toHaveURL(/\/lab$/);
});
