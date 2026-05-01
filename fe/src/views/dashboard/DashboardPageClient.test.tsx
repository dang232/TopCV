import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@/src/shared/auth';
import { writeStoredSession } from '@/src/shared/auth/authStore';
import { DashboardPageClient } from './DashboardPageClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

describe('DashboardPageClient', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders admin dashboard when role is admin', () => {
    writeStoredSession({ accessToken: 'token', roles: ['admin'] });

    render(
      <AuthProvider>
        <DashboardPageClient />
      </AuthProvider>,
    );

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /form management portal/i })).toBeInTheDocument();
  });

  it('renders admin dashboard when role is ADMIN (uppercase)', () => {
    writeStoredSession({ accessToken: 'token', roles: ['ADMIN'] });

    render(
      <AuthProvider>
        <DashboardPageClient />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /form management portal/i })).toBeInTheDocument();
  });

  it('renders staff dashboard when role is staff', () => {
    writeStoredSession({ accessToken: 'token', roles: ['staff'] });

    render(
      <AuthProvider>
        <DashboardPageClient />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /available forms/i })).toBeInTheDocument();
  });

  it('renders staff dashboard when role is STAFF (uppercase)', () => {
    writeStoredSession({ accessToken: 'token', roles: ['STAFF'] });

    render(
      <AuthProvider>
        <DashboardPageClient />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /available forms/i })).toBeInTheDocument();
  });
});

