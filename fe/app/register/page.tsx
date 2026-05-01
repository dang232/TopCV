import { Suspense } from 'react';
import { RegisterPageClient } from '@/src/views/auth/RegisterPageClient';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageClient />
    </Suspense>
  );
}