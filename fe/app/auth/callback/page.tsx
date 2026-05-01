import { Suspense } from 'react';
import { AuthCallbackPageClient } from '@/src/views/auth/AuthCallbackPageClient';

export default function AuthCallbackPage() {
  // Next.js requires `useSearchParams()` usage to be
  // wrapped in a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <AuthCallbackPageClient />
    </Suspense>
  );
}