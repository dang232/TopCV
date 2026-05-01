import { Suspense } from 'react';
import { LoginPageClient } from '@/src/views/auth/LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}