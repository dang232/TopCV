'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/src/shared/auth';
import { Button } from '@/src/shared/ui/Button';
import { PasswordField } from '@/src/shared/ui/PasswordField';
import { getLoginHintError, getPasswordError } from './validators';

export function LoginPageClient() {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ loginHint?: string | null; password?: string | null }>({});
  const [loginHint, setLoginHint] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const next = search.get('next') ?? '/dashboard';

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-6xl items-stretch px-6 py-10">
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">FormFlow</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Sign in to continue. Your credentials are verified by the backend against Keycloak.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium">Secure</p>
                <p className="mt-1 text-zinc-600">Keycloak-backed</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium">Fast</p>
                <p className="mt-1 text-zinc-600">No redirect</p>
              </div>
            </div>
          </div>
        </div>

        <section className="flex w-full flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">FormFlow</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-3 text-zinc-600">
              You’ll sign in here and go straight to the dashboard.
            </p>

            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);

                const hint = loginHint.trim();
                const nextFieldErrors = {
                  loginHint: getLoginHintError(hint),
                  password: getPasswordError(password),
                };
                setFieldErrors(nextFieldErrors);
                if (nextFieldErrors.loginHint || nextFieldErrors.password) return;

                try {
                  await login({ usernameOrEmail: hint, password, returnTo: next });
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
                }
              }}
            >
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="loginHint">
                  Email or username
                </label>
                <input
                  id="loginHint"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-700/30 focus:ring-4"
                  autoComplete="username"
                  value={loginHint}
                  onChange={(e) => setLoginHint(e.target.value)}
                  aria-invalid={fieldErrors.loginHint ? true : undefined}
                  aria-describedby={fieldErrors.loginHint ? 'loginHint-error' : undefined}
                />
                {fieldErrors.loginHint ? (
                  <p id="loginHint-error" className="text-xs text-red-700">
                    {fieldErrors.loginHint}
                  </p>
                ) : null}
              </div>

              <PasswordField
                id="password"
                label="Password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                helpText="We authenticate against Keycloak via the backend."
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-zinc-300 text-indigo-700 focus:ring-indigo-700/30"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <span className="text-sm text-zinc-500">No redirect</span>
              </div>

              <Button type="submit">
                Sign in
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-zinc-600">
              <span>New here?</span>
              <Link className="font-medium text-indigo-700 hover:text-indigo-800" href={`/register?next=${encodeURIComponent(next)}`}>
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

