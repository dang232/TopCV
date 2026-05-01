import { Injectable, UnauthorizedException } from '@nestjs/common';

import {
  InvalidRoleError,
  KeycloakAccountNotReadyError,
  KeycloakBadResponseError,
  KeycloakConflictError,
  KeycloakForbiddenError,
  KeycloakUnreachableError,
  MisconfigError,
} from './keycloak-auth.errors';
import type { KeycloakRealmRole } from './keycloak.types';

type KeycloakTokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  token_type?: string;
  scope?: string;
};

type KeycloakUserRepresentation = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  emailVerified?: boolean;
  requiredActions?: string[];
};

function assertEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new MisconfigError(`Missing env var: ${name}`);
  return v;
}

function keycloakBaseFromIssuer(issuer: string): { baseUrl: string; realm: string } {
  const u = new URL(issuer);
  const marker = '/realms/';
  const idx = u.pathname.indexOf(marker);
  if (idx < 0) {
    throw new Error('KEYCLOAK_ISSUER must include /realms/<realm>');
  }
  const basePath = u.pathname.slice(0, idx); // '' or '/auth'
  const realm = u.pathname.slice(idx + marker.length).split('/').filter(Boolean)[0];
  if (!realm) throw new Error('KEYCLOAK_ISSUER realm missing');
  return {
    baseUrl: `${u.protocol}//${u.host}${basePath}`,
    realm,
  };
}

function formUrlEncoded(params: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, v);
  return body;
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

function tryParseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class KeycloakAuthService {
  private async safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(input, init);
    } catch (err) {
      throw new KeycloakUnreachableError('Keycloak is unreachable', { cause: err });
    }
  }

  private async throwAdminError(message: string, res: Response, step: string): Promise<never> {
    const body = await readErrorBody(res);
    if (res.status === 403) {
      throw new KeycloakForbiddenError(message, { step, body });
    }
    throw new KeycloakBadResponseError(message, { status: res.status, body });
  }

  private issuer(): string {
    return assertEnv('KEYCLOAK_ISSUER');
  }

  private adminClientId(): string {
    return assertEnv('KEYCLOAK_ADMIN_CLIENT_ID');
  }

  private adminClientSecret(): string {
    return assertEnv('KEYCLOAK_ADMIN_CLIENT_SECRET');
  }

  private async tokenEndpoint(): Promise<{ url: string; realm: string; baseUrl: string }> {
    const { baseUrl, realm } = keycloakBaseFromIssuer(this.issuer());
    return { baseUrl, realm, url: `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token` };
  }

  private async adminBaseUrl(): Promise<{ baseUrl: string; realm: string; url: string }> {
    const { baseUrl, realm } = keycloakBaseFromIssuer(this.issuer());
    return { baseUrl, realm, url: `${baseUrl}/admin/realms/${encodeURIComponent(realm)}` };
  }

  private async getAdminAccessToken(): Promise<string> {
    const token = await this.tokenEndpoint();
    const res = await this.safeFetch(token.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formUrlEncoded({
        grant_type: 'client_credentials',
        client_id: this.adminClientId(),
        client_secret: this.adminClientSecret(),
      }),
    });
    if (!res.ok) {
      throw new KeycloakBadResponseError('Keycloak admin auth failed', { status: res.status, body: await readErrorBody(res) });
    }
    const json = (await res.json()) as KeycloakTokenResponse;
    if (!json.access_token) throw new UnauthorizedException({ message: 'Keycloak admin auth failed: missing access_token' });
    return json.access_token;
  }

  async loginWithPasswordGrant(input: {
    usernameOrEmail: string;
    password: string;
    clientId: string;
  }): Promise<KeycloakTokenResponse> {
    const token = await this.tokenEndpoint();
    const res = await this.safeFetch(token.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formUrlEncoded({
        grant_type: 'password',
        client_id: input.clientId,
        username: input.usernameOrEmail,
        password: input.password,
        // `offline_access` requires the user to have the realm role `offline_access`.
        // New registrations only get app roles (admin/staff), so requesting it can cause valid logins to fail.
        scope: 'openid profile email',
      }),
    });
    if (!res.ok) {
      const bodyText = await readErrorBody(res);
      const bodyJson = tryParseJson(bodyText) as
        | { error?: string; error_description?: string; errorDescription?: string }
        | undefined;

      const error = bodyJson?.error;
      const desc = bodyJson?.error_description ?? bodyJson?.errorDescription;
      if (res.status === 400 && error === 'invalid_grant' && typeof desc === 'string' && /account is not fully set up/i.test(desc)) {
        throw new KeycloakAccountNotReadyError('Account is not fully set up', { error, description: desc });
      }

      throw new UnauthorizedException({ message: `Invalid credentials: ${bodyText}` });
    }
    return (await res.json()) as KeycloakTokenResponse;
  }

  async logoutWithRefreshToken(input: { refreshToken: string; clientId: string }): Promise<void> {
    const { baseUrl, realm } = keycloakBaseFromIssuer(this.issuer());
    const url = `${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/logout`;
    const res = await this.safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formUrlEncoded({
        client_id: input.clientId,
        refresh_token: input.refreshToken,
      }),
    });
    if (!res.ok) {
      // Keycloak logout can be best-effort; surface for debugging but don't leak token.
      throw new UnauthorizedException({ message: `Logout failed: ${await readErrorBody(res)}` });
    }
  }

  private async createUser(
    adminToken: string,
    user: { username: string; email: string; firstName?: string; lastName?: string },
  ): Promise<string> {
    const admin = await this.adminBaseUrl();
    const res = await this.safeFetch(`${admin.url}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        // Keycloak user-profile defaults can require first/last name for the "user" role,
        // which blocks direct-grant logins with `invalid_grant: Account is not fully set up`.
        firstName: user.firstName ?? user.username,
        lastName: user.lastName ?? 'User',
        enabled: true,
        emailVerified: true,
        requiredActions: [],
      } satisfies KeycloakUserRepresentation),
    });

    if (res.status === 201) {
      const loc = res.headers.get('location');
      const id = loc?.split('/').filter(Boolean).at(-1);
      if (!id) throw new Error('Keycloak user create succeeded but Location header missing');
      return id;
    }

    // Keycloak often returns 409 for duplicate username/email.
    const body = await readErrorBody(res);
    if (res.status === 409) {
      throw new KeycloakConflictError('Username or email already exists', body);
    }
    if (res.status === 403) {
      throw new KeycloakForbiddenError('Keycloak user create forbidden', { step: 'createUser', body });
    }
    throw new KeycloakBadResponseError('Keycloak user create failed', { status: res.status, body });
  }

  private async clearRequiredActions(adminToken: string, userId: string): Promise<void> {
    const existing = await this.getUser(adminToken, userId);
    await this.updateUser(adminToken, userId, {
      ...existing,
      enabled: true,
      emailVerified: true,
      requiredActions: [],
    });
  }

  private async ensureNoRequiredActions(adminToken: string, userId: string): Promise<void> {
    const user = await this.getUser(adminToken, userId);
    const actions = user.requiredActions ?? [];
    if (actions.length === 0) return;

    await this.updateUser(adminToken, userId, { ...user, requiredActions: [] });

    const after = await this.getUser(adminToken, userId);
    const afterActions = after.requiredActions ?? [];
    if (afterActions.length === 0) return;

    throw new KeycloakBadResponseError('Keycloak required actions could not be cleared', {
      status: 409,
      body: JSON.stringify({ userId, requiredActions: afterActions }),
    });
  }

  private async setPassword(adminToken: string, userId: string, password: string): Promise<void> {
    const admin = await this.adminBaseUrl();
    const res = await this.safeFetch(`${admin.url}/users/${encodeURIComponent(userId)}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ type: 'password', value: password, temporary: false }),
    });
    if (!res.ok) {
      await this.throwAdminError('Keycloak set password failed', res, 'setPassword');
    }
  }

  private async deleteUser(adminToken: string, userId: string): Promise<void> {
    const admin = await this.adminBaseUrl();
    const res = await this.safeFetch(`${admin.url}/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!res.ok && res.status !== 404) {
      await this.throwAdminError('Keycloak delete user failed', res, 'deleteUser');
    }
  }

  private async getUser(adminToken: string, userId: string): Promise<KeycloakUserRepresentation> {
    const admin = await this.adminBaseUrl();
    const res = await this.safeFetch(`${admin.url}/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}`, Accept: 'application/json' },
    });
    if (!res.ok) {
      await this.throwAdminError('Keycloak get user failed', res, 'getUser');
    }
    return (await res.json()) as KeycloakUserRepresentation;
  }

  private async updateUser(adminToken: string, userId: string, user: KeycloakUserRepresentation): Promise<void> {
    const admin = await this.adminBaseUrl();
    const res = await this.safeFetch(`${admin.url}/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      await this.throwAdminError('Keycloak update user failed', res, 'updateUser');
    }
  }

  private async assignRealmRole(adminToken: string, userId: string, roleName: string): Promise<void> {
    const admin = await this.adminBaseUrl();
    const getRoleRes = await this.safeFetch(`${admin.url}/roles/${encodeURIComponent(roleName)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}`, Accept: 'application/json' },
    });
    if (!getRoleRes.ok) {
      if (getRoleRes.status === 404) {
        throw new InvalidRoleError(roleName);
      }
      await this.throwAdminError('Keycloak role lookup failed', getRoleRes, 'roleLookup');
    }
    const role = (await getRoleRes.json()) as { id?: string; name?: string };
    if (!role?.id || !role?.name) throw new Error('Keycloak role lookup returned invalid role representation');

    const mapRes = await this.safeFetch(`${admin.url}/users/${encodeURIComponent(userId)}/role-mappings/realm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify([{ id: role.id, name: role.name }]),
    });
    if (!mapRes.ok) {
      await this.throwAdminError('Keycloak role assign failed', mapRes, 'roleAssign');
    }
  }

  async registerUser(input: {
    username: string;
    email: string;
    password: string;
    role: KeycloakRealmRole;
  }): Promise<{ userId: string }> {
    const adminToken = await this.getAdminAccessToken();
    const userId = await this.createUser(adminToken, { username: input.username, email: input.email });
    try {
      await this.setPassword(adminToken, userId, input.password);
      // Some realm configs assign default required actions (e.g. UPDATE_PROFILE) to new users, which blocks direct-grant login.
      // Fetch+full update is more reliable than a minimal payload across Keycloak versions/configs.
      await this.clearRequiredActions(adminToken, userId);
      await this.assignRealmRole(adminToken, userId, input.role);
      // Some realms add required actions after password/role assignment; ensure it's cleared at the end too.
      await this.clearRequiredActions(adminToken, userId);
      // Final safety check: if required actions persist, clear again or rollback.
      await this.ensureNoRequiredActions(adminToken, userId);
      return { userId };
    } catch (err) {
      // Best-effort rollback so a failed register doesn't leave a partial user behind.
      try {
        await this.deleteUser(adminToken, userId);
      } catch {
        // ignore rollback errors; original error is more actionable
      }
      throw err;
    }
  }
}

