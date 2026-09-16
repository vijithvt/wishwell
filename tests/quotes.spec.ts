import { test, expect } from '@playwright/test';

test('choose quotes, cycle suggestions and preserve custom text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Create a poster', exact:true}).click();
  const wish=page.getByLabel('Birthday wish');
  const first=await wish.inputValue();
  await expect(page.getByLabel('Suggested quotes').locator('option')).toHaveCount(10);
  await page.getByRole('button', {name:'Next quote'}).click();
  await expect(wish).not.toHaveValue(first);
  await expect(page.locator('.preview-fit .poster-quote')).toHaveText(await wish.inputValue());
  await page.getByLabel('Suggested quotes').selectOption('9');
  await page.getByRole('button', {name:'Next quote'}).click();
  await expect(wish).toHaveValue(first);
  await page.getByLabel('Suggested quotes').selectOption('4');
  const chosen=await wish.inputValue();
  await page.getByLabel('Auto quote').uncheck();
  await expect(wish).toHaveValue(chosen);
  await wish.fill('A wish of my own.');
  await expect(page.locator('.preview-fit .poster-quote')).toHaveText('A wish of my own.');
});
