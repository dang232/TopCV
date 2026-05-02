import { afterEach, describe, expect, it, vi } from 'vitest';

import type { KeycloakAuthService } from '../keycloak/keycloak-auth.service';
import { AuthFacade } from './auth.facade';

describe(AuthFacade.name, () => {
  const prevEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...prevEnv };
    vi.restoreAllMocks();
  });

  it('rejects admin registration when ALLOW_ADMIN_SIGNUP is explicitly false', async () => {
    process.env.ALLOW_ADMIN_SIGNUP = 'false';

    const auth = new AuthFacade(undefined);
    await expect(
      auth.register({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'admin' }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows admin registration when ALLOW_ADMIN_SIGNUP is unset', async () => {
    delete process.env.ALLOW_ADMIN_SIGNUP;

    const registerUser = vi.fn().mockResolvedValue({ userId: 'u1' });
    const keycloak = { registerUser } as unknown as KeycloakAuthService;
    const auth = new AuthFacade(keycloak);

    await expect(
      auth.register({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'admin' }),
    ).resolves.toEqual({ created: true, userId: 'u1' });

    expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'admin' }),
    );
  });
});
