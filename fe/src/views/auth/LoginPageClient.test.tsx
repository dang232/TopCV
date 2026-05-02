import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('@/src/shared/api/http/apiClient', async () => {
  const actual = await vi.importActual<typeof import('@/src/shared/api/http/apiClient')>('@/src/shared/api/http/apiClient');
  return {
    ...actual,
    apiFetchJson: vi.fn(),
  };
});

describe('LoginPageClient', () => {
  beforeEach(async () => {
    const { apiFetchJson } = await import('@/src/shared/api/http/apiClient');
    vi.mocked(apiFetchJson).mockClear();
  });

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

  it('shows backend error message for wrong credentials', async () => {
    const user = userEvent.setup();
    const { apiFetchJson, ApiHttpError } = await import('@/src/shared/api/http/apiClient');
    vi.mocked(apiFetchJson).mockRejectedValueOnce(
      new ApiHttpError(401, { error: { code: 'WRONG_CREDENTIALS', message: 'Wrong username or password' } }, 'Wrong username or password'),
    );

    render(
      <AuthProvider>
        <LoginPageClient />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(await screen.findByText('Wrong username or password')).toBeInTheDocument();
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

  it('does not apply signup password rules; submits with a weak password', async () => {
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
    await user.type(screen.getByLabelText(/^password$/i), 'x');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(apiFetchJson).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        json: { usernameOrEmail: 'user@example.com', password: 'x' },
      }),
    );
  });

  it('shows password required when password is empty or whitespace-only', async () => {
    const user = userEvent.setup();
    const { apiFetchJson } = await import('@/src/shared/api/http/apiClient');

    render(
      <AuthProvider>
        <LoginPageClient />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), '   ');
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    expect(apiFetchJson).not.toHaveBeenCalled();
  });
});

