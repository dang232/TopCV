import { expect, test } from '@playwright/test';

test('register then auto-login succeeds (captures auth XHR bodies)', async ({ page, baseURL }) => {
  const username = `e2e_${Date.now()}`;
  const email = `${username}@example.test`;
  const password = 'E2ePassw0rd!';

  page.on('console', (msg) => {
    console.log(`[browser:${msg.type()}]`, msg.text());
  });
  page.on('pageerror', (err) => {
    console.log('[browser:pageerror]', String(err));
  });

  let registerBodyText: string | undefined;
  let loginBodyText: string | undefined;

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/api/v1/auth/register') && !url.includes('/api/v1/auth/login')) return;
    const ct = (res.headers()['content-type'] ?? '').toLowerCase();
    const text = ct.includes('application/json') ? JSON.stringify(await res.json()) : await res.text();
    if (url.includes('/api/v1/auth/register')) registerBodyText = text;
    if (url.includes('/api/v1/auth/login')) loginBodyText = text;
  });

  await page.goto(new URL('/register', baseURL).toString());
  // Ensure client-side handlers are attached before typing (avoid filling pre-hydration).
  await page.waitForLoadState('networkidle');

  await page.locator('#username').fill('');
  await page.locator('#username').type(username, { delay: 5 });
  await page.locator('#email').fill('');
  await page.locator('#email').type(email, { delay: 5 });
  await page.locator('#password').fill('');
  await page.locator('#password').type(password, { delay: 5 });
  await page.locator('#confirmPassword').fill('');
  await page.locator('#confirmPassword').type(password, { delay: 5 });

  await expect(page.locator('#username')).toHaveValue(username);
  await expect(page.locator('#email')).toHaveValue(email);
  await expect(page.locator('#password')).toHaveValue(password);
  await expect(page.locator('#confirmPassword')).toHaveValue(password);

  const submit = page.getByRole('button', { name: /create account/i });
  try {
    await expect(submit).toBeEnabled();
  } catch (err) {
    const errorTexts = await page.locator('p.text-red-700').allTextContents();
    const debug = await page.evaluate(() => {
      const pick = (id: string) => {
        const el = document.querySelector<HTMLInputElement>(`#${CSS.escape(id)}`);
        if (!el) return { id, found: false as const };
        return {
          id,
          found: true as const,
          value: el.value,
          ariaInvalid: el.getAttribute('aria-invalid'),
          ariaDescribedBy: el.getAttribute('aria-describedby'),
        };
      };
      return {
        inputs: [pick('username'), pick('email'), pick('password'), pick('confirmPassword')],
      };
    });
    throw new Error(
      `Submit stayed disabled. Visible errors: ${JSON.stringify(errorTexts)} Debug: ${JSON.stringify(debug)}\n${String(err)}`,
    );
  }

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/auth/register')),
    submit.click(),
  ]);

  // Auto-login should happen after successful registration; wait for login call.
  await page.waitForResponse((r) => r.url().includes('/api/v1/auth/login'));

  // If the app redirects to dashboard, that's the simplest success signal.
  await expect(page).toHaveURL(/\/dashboard/i);

  // Print captured bodies into test output for debugging.
  // (This is safe: it never prints the password.)
  console.log('register response body:', registerBodyText);
  console.log('login response body:', loginBodyText);
});

