import { notFound } from 'next/navigation';

import { ApiDebugPageClient } from './ui';

export default function ApiDebugPage() {
  if ((process.env.NODE_ENV ?? '').toLowerCase() === 'production') {
    notFound();
  }
  return <ApiDebugPageClient />;
}

