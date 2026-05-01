import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/src/shared/auth';
import { LoginPageClient } from './LoginPageClient';

const mockReplace = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/src/shared/api/http/apiClient', () => ({
  apiFetchJson: vi.fn(),
}));

describe('LoginPageClient', () => {
  it('renders sign-in form', () => {
    render(
      <AuthProvider>
        <LoginPageClient />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('calls backend login endpoint with credentials', async () => {
    const user = userEvent.setup();
    const { apiFetchJson } = await import('@/src/shared/api/http/apiClient');
    vi.mocked(apiFetchJson).mockResolvedValue({
      accessToken: 'access.token.value',
      idToken: 'access.token.value',
      expiresIn: 60,
    });

    render(
      <AuthProvider>
        <LoginPageClient />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() =>
      expect(apiFetchJson).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        json: { usernameOrEmail: 'user@example.com', password: 'Password1' },
      }),
    );
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPageClient />
      </AuthProvider>,
    );

    const input = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(input.type).toBe('password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(input.type).toBe('text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input.type).toBe('password');
  });

  it('shows invalid email message when login hint looks like email', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPageClient />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/email or username/i), 'not-an-email@');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
  });
});

