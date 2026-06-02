import { test, expect } from '@playwright/test';

// Common setup to catch console errors during tests
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => {
    console.error(`Page error: ${err.message}`);
  });
});

test('Dashboard renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});

test('Billing Engine renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/billing');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});

test('Inventory Dashboard renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/inventory');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});

test('Smart Shortage Engine renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/inventory/shortage');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});

test('Purchases History renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/purchases/history');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});

test('Supplier Returns renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/supplier-returns');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});

test('Accounting Ledgers renders successfully', async ({ page }) => {
  const response = await page.goto('http://localhost:3000/accounting/ledgers');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
});
