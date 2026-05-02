import { describe, expect, it } from 'vitest';

import { AuthFacade } from './auth.facade';

describe(AuthFacade.name, () => {
  it('rejects admin registration when ALLOW_ADMIN_SIGNUP is not true', async () => {
    const prev = process.env.ALLOW_ADMIN_SIGNUP;
    delete process.env.ALLOW_ADMIN_SIGNUP;

    const auth = new AuthFacade(undefined);
    await expect(
      auth.register({ username: 'bob', email: 'bob@example.com', password: 'Password1!', role: 'admin' }),
    ).rejects.toMatchObject({ status: 403 });

    process.env.ALLOW_ADMIN_SIGNUP = prev;
  });
});

