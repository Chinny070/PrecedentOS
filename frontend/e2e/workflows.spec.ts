import { expect, test } from '@playwright/test';

const routes = ['/precedents', '/precedents/new', '/compare', '/case-court', '/tribunal', '/web-evidence', '/verify'];

for (const route of routes) {
  test(`connected workflow route ${route} renders without a runtime error`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
    expect(errors).toEqual([]);
  });
}

test('mobile viewport keeps landing controls visible and usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: /open the research lab/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /start a comparison/i })).toBeVisible();
});

test('CaseCourt exposes every appeal stage and does not submit without a wallet', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('precedentos.public-contract-addresses.v1', JSON.stringify({
    registry: `0x${'1'.repeat(40)}`, evaluator: `0x${'2'.repeat(40)}`, caseCourt: `0x${'3'.repeat(40)}`,
  })));
  await page.goto('/case-court');
  await expect(page.getByText(/appeal & mutually approved reviewer/i)).toBeVisible();
  for (const action of [
    'Submit file_appeal', 'append_appeal_evidence', 'lock_appeal_evidence',
    'propose_appeal_reviewer', 'approve_appeal_reviewer (other party)',
    'begin_appeal_review (reviewer only)', 'adjudicate_appeal (bound reviewer)',
    'Load get_appellate_ruling', 'resolve_appeal', 'Load get_appeal readback',
  ]) {
    await expect(page.getByRole('button', { name: new RegExp(action, 'i') })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: /submit file_appeal/i })).toBeDisabled();
  await expect(page.getByText(/not a neutral court process/i)).toBeVisible();
});
