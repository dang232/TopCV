'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { writeStoredSession } from '@/src/shared/auth/authStore';
import { exchangeCodeForSession, getReturnToAndClear } from '@/src/shared/auth/keycloak';

export function AuthCallbackPageClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const errorFromProvider = search.get('error');
  const errorDescription = search.get('error_description');
  const code = search.get('code');
  const state = search.get('state');

  const syncError =
    errorFromProvider ? `${errorFromProvider}${errorDescription ? `: ${errorDescription}` : ''}` : !code || !state ? 'Missing callback parameters.' : null;

  useEffect(() => {
    if (syncError) return;

    exchangeCodeForSession({ code: code as string, state: state as string })
      .then((session) => {
        writeStoredSession(session);
        const returnTo = getReturnToAndClear('/dashboard');
        router.replace(returnTo);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [code, router, state, syncError]);

  const shownError = syncError ?? error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-950">
      <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Authentication</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{shownError ? 'Sign-in failed' : 'Signing you in…'}</h1>
        {shownError ? (
          <p className="mt-3 text-zinc-600">{shownError}</p>
        ) : (
          <div className="mt-3 space-y-4 text-zinc-600">
            <p>Completing Keycloak sign-in and redirecting back to the app.</p>
            <div className="flex items-center gap-3">
              <div
                aria-label="Loading"
                className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-700"
              />
              <p className="text-sm">Exchanging authorization code for tokens…</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

