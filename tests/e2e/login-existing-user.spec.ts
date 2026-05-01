import { test } from '@playwright/test';

test('login with provided credentials shows correct dashboard', async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const username = 'dangqwe321';
  const password = 'Dang25102005';
  const email = `${username}@example.test`;

  page.on('console', (msg) => console.log(`[browser:${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.log('[browser:pageerror]', String(err)));

  await page.goto(new URL('/login?next=/dashboard', baseURL).toString());
  await page.waitForLoadState('networkidle');

  await page.locator('#loginHint').fill(username);
  await page.locator('#password').fill(password);

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/auth/login')),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  // If creds don't exist yet in local dev, register them once (keeps the test stable on fresh realms).
  const errorText = await page.locator('p.text-red-700').first().textContent().catch(() => null);
  if (errorText && /invalid credentials/i.test(errorText)) {
    await page.goto(new URL('/register?next=/dashboard', baseURL).toString());
    await page.waitForLoadState('networkidle');

    await page.locator('#username').fill(username);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.locator('#confirmPassword').fill(password);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/auth/register')),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);

    // Auto-login after register.
    await page.waitForResponse((r) => r.url().includes('/api/v1/auth/login'));
  }

  console.log('final url before wait:', page.url());
  console.log('waiting for URL match…');
  await page.waitForURL(/\/dashboard/i, { timeout: 15_000 });
  console.log('URL matched, asserting dashboard heading…');

  // Should show either staff or admin content.
  const heading = page.locator('h1', { hasText: /available forms|form management portal/i });
  await heading.first().waitFor({ state: 'visible', timeout: 10_000 });
  console.log('dashboard heading visible');
});

