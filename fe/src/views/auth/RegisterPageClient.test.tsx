import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { AuthProvider } from '@/src/shared/auth';
import { RegisterPageClient } from './RegisterPageClient';

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
  const actual = (await vi.importActual('@/src/shared/api/http/apiClient')) as object;
  return {
    ...actual,
    apiFetchJson: vi.fn(),
  };
});

describe('RegisterPageClient', () => {
  it('renders registration form', () => {
    render(
      <AuthProvider>
        <RegisterPageClient />
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/^role$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <RegisterPageClient />
      </AuthProvider>,
    );

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getAllByRole('button', { name: /show password/i })[0]!);
    expect(passwordInput.type).toBe('text');
  });

  it('shows custom validation messages', async () => {
    const user = userEvent.setup();
    const { apiFetchJson } = await import('@/src/shared/api/http/apiClient');

    render(
      <AuthProvider>
        <RegisterPageClient />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/^username$/i), 'bob');
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/confirm password must match password/i)).toBeInTheDocument();
    expect(apiFetchJson).not.toHaveBeenCalled();
  });

  it('registers then logs in via backend endpoints', async () => {
    const user = userEvent.setup();
    const { apiFetchJson } = await import('@/src/shared/api/http/apiClient');
    vi.mocked(apiFetchJson).mockImplementation(async (path: string) => {
      if (path === '/auth/register') return { created: true };
      if (path === '/auth/login')
        return { accessToken: 'access.token.value', idToken: 'access.token.value', expiresIn: 60 };
      throw new Error(`Unexpected path: ${path}`);
    });

    render(
      <AuthProvider>
        <RegisterPageClient />
      </AuthProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText(/^username$/i), 'bob');
    await user.type(screen.getByLabelText(/^email$/i), 'bob@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');

    expect(submitButton).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(apiFetchJson).toHaveBeenCalledWith('/auth/register', expect.any(Object)));
    expect(vi.mocked(apiFetchJson)).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        method: 'POST',
        json: expect.objectContaining({ role: 'staff' }),
      }),
    );
    await waitFor(() => expect(apiFetchJson).toHaveBeenCalledWith('/auth/login', expect.any(Object)));
  });

  it('shows backend error message when registration fails', async () => {
    const user = userEvent.setup();
    const { apiFetchJson, ApiHttpError } = await import('@/src/shared/api/http/apiClient');

    vi.mocked(apiFetchJson).mockImplementation(async (path: string) => {
      if (path === '/auth/register') {
        throw new ApiHttpError(409, { error: { code: 'CONFLICT', message: 'Username or email already exists' } }, 'Username or email already exists');
      }
      throw new Error(`Unexpected path: ${path}`);
    });

    render(
      <AuthProvider>
        <RegisterPageClient />
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText(/^username$/i), 'bob');
    await user.type(screen.getByLabelText(/^email$/i), 'bob@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/username or email already exists/i)).toBeInTheDocument();
  });
});

