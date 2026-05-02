'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/src/shared/auth';
import { Alert, AlertCircleIcon, AlertDescription } from '@/src/components/ui/alert';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Input } from '@/src/components/ui/input';
import { PasswordField } from '@/src/shared/ui/PasswordField';
import { sanitizeReturnToPath } from '@/src/shared/auth/keycloak';
import { getLoginHintError, getLoginPasswordError } from './validators';

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

  const next = sanitizeReturnToPath(search.get('next'), '/dashboard');

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-6 px-6 py-10 lg:grid-cols-2 lg:gap-10">
        <Card className="order-1">
          <CardHeader className="pb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">FormFlow</p>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue. Your credentials are verified by the backend against Keycloak.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                Secure
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                Keycloak-backed
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                No redirect
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium">Secure</p>
                <p className="mt-1 text-sm text-muted-foreground">Credentials verified server-side.</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium">Fast</p>
                <p className="mt-1 text-sm text-muted-foreground">Sign in and continue to the app.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="order-2">
          <Card>
            <CardHeader className="pb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">FormFlow</p>
              <CardTitle className="text-3xl">Sign in</CardTitle>
              <CardDescription>You’ll sign in here and go straight to the dashboard.</CardDescription>
            </CardHeader>

            <CardContent>
              {error ? (
                <Alert
                  variant="destructive"
                  className="mb-4 flex gap-3"
                  aria-live="assertive"
                  id="login-auth-error"
                >
                  <AlertCircleIcon className="mt-0.5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <form
                className="space-y-4"
                aria-describedby={error ? 'login-auth-error' : undefined}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);

                  const hint = loginHint.trim();
                  const nextFieldErrors = {
                    loginHint: getLoginHintError(hint),
                    password: getLoginPasswordError(password),
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
                  <Input
                    id="loginHint"
                    autoComplete="username"
                    value={loginHint}
                    onChange={(e) => setLoginHint(e.target.value)}
                    aria-invalid={fieldErrors.loginHint ? true : undefined}
                    aria-describedby={fieldErrors.loginHint ? 'loginHint-error' : undefined}
                  />
                  {fieldErrors.loginHint ? (
                    <p id="loginHint-error" className="text-xs text-destructive">
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

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground" htmlFor="rememberMe">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <span className="text-sm text-muted-foreground">No redirect</span>
                </div>

                <Button type="submit" className="w-full">
                  Sign in
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-between text-sm text-muted-foreground">
              <span>New here?</span>
              <Link className="font-medium text-primary hover:underline" href={`/register?next=${encodeURIComponent(next)}`}>
                Create an account
              </Link>
            </CardFooter>
          </Card>
        </section>
      </div>
    </main>
  );
}

