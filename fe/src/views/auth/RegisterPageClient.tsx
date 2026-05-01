'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/src/shared/auth';
import { Button } from '@/src/shared/ui/Button';
import { PasswordField } from '@/src/shared/ui/PasswordField';
import { getConfirmPasswordError, getEmailError, getPasswordError, getUsernameError } from './validators';

export function RegisterPageClient() {
  const { isAuthenticated, register } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
  });
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const next = search.get('next') ?? '/dashboard';

  const trimmed = useMemo(
    () => ({
      email: email.trim(),
      username: username.trim(),
    }),
    [email, username],
  );

  const computedErrors = useMemo(
    () => ({
      email: getEmailError(trimmed.email),
      username: getUsernameError(trimmed.username),
      password: getPasswordError(password),
      confirmPassword: getConfirmPasswordError(password, confirmPassword),
    }),
    [confirmPassword, password, trimmed.email, trimmed.username],
  );

  const visibleErrors = useMemo(
    () => ({
      email: touched.email || hasSubmitted ? computedErrors.email : null,
      username: touched.username || hasSubmitted ? computedErrors.username : null,
      password: touched.password || hasSubmitted ? computedErrors.password : null,
      confirmPassword: touched.confirmPassword || hasSubmitted ? computedErrors.confirmPassword : null,
    }),
    [computedErrors, hasSubmitted, touched],
  );

  const isFormValid =
    !Object.values(computedErrors).some((value) => Boolean(value));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-6xl items-stretch px-6 py-10">
        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">FormFlow</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Start building with FormFlow</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Create your account in-app. We’ll create the user in Keycloak via the backend.
            </p>
            <div className="mt-8 space-y-3 text-sm text-zinc-600">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium text-zinc-900">In-app registration</p>
                <p className="mt-1">No redirects.</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="font-medium text-zinc-900">Single sign-on ready</p>
                <p className="mt-1">Works with enterprise identity.</p>
              </div>
            </div>
          </div>
        </div>

        <section className="flex w-full flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">FormFlow</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Create account</h1>
            <p className="mt-3 text-zinc-600">
              Your account is created immediately and you’ll be signed in automatically.
            </p>

            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setHasSubmitted(true);

                if (!isFormValid) return;

                try {
                  await register({ username: trimmed.username, email: trimmed.email, password, returnTo: next });
                } catch (err) {
                  setError(err instanceof Error ? err.message : String(err));
                }
              }}
            >
              <p className="text-xs text-zinc-500">New accounts are created with the staff role.</p>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-700/30 focus:ring-4"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setTouched((prev) => (prev.username ? prev : { ...prev, username: true }));
                  }}
                  onBlur={() => setTouched((prev) => (prev.username ? prev : { ...prev, username: true }))}
                  aria-invalid={visibleErrors.username ? true : undefined}
                  aria-describedby={visibleErrors.username ? 'username-error' : undefined}
                />
                {visibleErrors.username ? (
                  <p id="username-error" className="text-xs text-red-700">
                    {visibleErrors.username}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="text"
                  inputMode="email"
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-700/30 focus:ring-4"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTouched((prev) => (prev.email ? prev : { ...prev, email: true }));
                  }}
                  onBlur={() => setTouched((prev) => (prev.email ? prev : { ...prev, email: true }))}
                  aria-invalid={visibleErrors.email ? true : undefined}
                  aria-describedby={visibleErrors.email ? 'email-error' : undefined}
                />
                {visibleErrors.email ? (
                  <p id="email-error" className="text-xs text-red-700">
                    {visibleErrors.email}
                  </p>
                ) : null}
              </div>

              <PasswordField
                id="password"
                label="Password"
                autoComplete="new-password"
                value={password}
                onChange={(nextValue) => {
                  setPassword(nextValue);
                  setTouched((prev) => (prev.password ? prev : { ...prev, password: true }));
                }}
                error={visibleErrors.password}
                helpText="Password is sent to the backend to create your Keycloak user."
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(nextValue) => {
                  setConfirmPassword(nextValue);
                  setTouched((prev) => (prev.confirmPassword ? prev : { ...prev, confirmPassword: true }));
                }}
                error={visibleErrors.confirmPassword}
              />

              <Button
                type="submit"
                disabled={!isFormValid}
                aria-disabled={!isFormValid}
                variant={isFormValid ? 'primary' : 'outline'}
              >
                Create account
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-zinc-600">
              <span>Already have an account?</span>
              <Link className="font-medium text-indigo-700 hover:text-indigo-800" href={`/login?next=${encodeURIComponent(next)}`}>
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

