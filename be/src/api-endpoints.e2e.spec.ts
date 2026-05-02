import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RPCLink } from '@orpc/client/fetch';
import type { AddressInfo } from 'node:net';
import {
  FieldType,
  FormStatus,
  submissionAnswerKey,
  type FormDto,
  type SubmissionDto,
} from '@topcv/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppModule } from './app.module';
import { KeycloakJwtVerifier } from './auth/keycloak/keycloak-jwt.verifier';
import type { FormRepository } from './forms/application/ports/form.repository';
import { FORM_REPOSITORY } from './forms/application/ports/form.repository';
import type { SubmissionRepository } from './forms/application/ports/submission.repository';
import { SUBMISSION_REPOSITORY } from './forms/application/ports/submission.repository';
import { DynamicForm } from './forms/domain/form.aggregate';
import { FieldType as DomainFieldType } from './forms/domain/field-type';
import { FormStatus as DomainFormStatus } from './forms/domain/form-status';
import { MIKRO_ORM } from './database/database.module';
import { HTTP_API_V1_FORMS_PATH, HTTP_API_V1_SUBMISSIONS_PATH } from './http/api-path.constants';
import { ELASTICSEARCH_CLIENT, REDIS_CLIENT } from './infra/external-clients.module';

const orpcPublicEnabled = (process.env.ORPC_PUBLIC_ENABLED ?? '').toLowerCase() === 'true';

function createRedisMock() {
  return {
    ping: vi.fn(async () => 'PONG'),
    get: vi.fn(async () => null),
    set: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
  };
}

function createElasticsearchMock(indexedFormIds: string[]) {
  return {
    info: vi.fn(async () => ({ cluster_name: 'test' })),
    index: vi.fn(async ({ id }: { id: string }) => {
      indexedFormIds.push(id);
      return { result: 'created' };
    }),
    delete: vi.fn(async ({ id }: { id: string }) => {
      const index = indexedFormIds.indexOf(id);
      if (index >= 0) {
        indexedFormIds.splice(index, 1);
      }
      return { _index: 'forms', _id: id, result: 'deleted' };
    }),
    search: vi.fn(async () => ({
      hits: {
        hits: indexedFormIds.map((_id) => ({ _id })),
      },
    })),
  };
}

function createMikroOrmMock() {
  return {
    checkConnection: vi.fn(async () => ({ ok: true })),
    em: {
      fork: vi.fn(() => ({})),
    },
  };
}

class InMemoryFormRepository implements FormRepository {
  private readonly forms = new Map<string, DynamicForm>();

  reset(): void {
    this.forms.clear();
  }

  async save(form: DynamicForm): Promise<DynamicForm> {
    const snapshot = form.toSnapshot();
    this.forms.set(snapshot.id, form);

    return form;
  }

  async findAll(): Promise<DynamicForm[]> {
    return [...this.forms.values()].sort((left, right) => left.toSnapshot().order - right.toSnapshot().order);
  }

  async countAll(): Promise<number> {
    return this.forms.size;
  }

  async findPage(input: { skip: number; take: number }): Promise<DynamicForm[]> {
    const all = await this.findAll();
    return all.slice(input.skip, input.skip + input.take);
  }

  async findById(id: string): Promise<DynamicForm | null> {
    return this.forms.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<DynamicForm[]> {
    return ids.flatMap((id) => {
      const found = this.forms.get(id);
      return found ? [found] : [];
    });
  }

  async delete(id: string): Promise<void> {
    this.forms.delete(id);
  }
}

class InMemorySubmissionRepository implements SubmissionRepository {
  private submissions: SubmissionDto[] = [];

  reset(): void {
    this.submissions = [];
  }

  async save(submission: SubmissionDto): Promise<SubmissionDto> {
    this.submissions.push(submission);

    return submission;
  }

  async findAll(): Promise<SubmissionDto[]> {
    return [...this.submissions].sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
  }
}

describe(
  'HTTP API (REST /api/v1 + health)',
  {
    timeout: 60_000,
  },
  () => {
    let app: INestApplication;
    let baseUrl: string;

    const indexedFormIds: string[] = [];
    const formRepo = new InMemoryFormRepository();
    const submissionRepo = new InMemorySubmissionRepository();
    const redisMock = createRedisMock();
    const esMock = createElasticsearchMock(indexedFormIds);
    const mikroMock = createMikroOrmMock();

    async function restJson<T>(
      pathUnderApi: string,
      init: RequestInit & { json?: unknown; token?: 'admin' | 'staff' | null } = {},
    ): Promise<{ ok: boolean; status: number; body: T | undefined }> {
      const { json, token, ...rest } = init;
      const rel = pathUnderApi.startsWith('/') ? pathUnderApi.slice(1) : pathUnderApi;
      const url = `${baseUrl}/${rel}`;
      const headers = new Headers(rest.headers);
      headers.set('Accept', 'application/json');
      const auth = token === undefined ? null : token;
      if (auth) {
        headers.set('Authorization', `Bearer ${auth}`);
      }
      if (json !== undefined) {
        headers.set('Content-Type', 'application/json');
      }
      const response = await fetch(url, {
        ...rest,
        headers,
        body: json !== undefined ? JSON.stringify(json) : rest.body,
      });
      const text = await response.text();
      let body: T | undefined;
      if (text) {
        try {
          body = JSON.parse(text) as T;
        } catch {
          body = text as unknown as T;
        }
      }
      return { ok: response.ok, status: response.status, body };
    }

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(KeycloakJwtVerifier)
        .useValue({
          verifyAuthorizationHeaderDetailed: vi.fn(async (authHeader: string | undefined) => {
            const header = authHeader?.trim();
            if (!header) return { user: null, outcome: 'missing_authorization' as const };
            if (header === 'Bearer admin') {
              return {
                user: { sub: 'admin', preferredUsername: 'admin', roles: ['ADMIN'], rawRoles: ['ADMIN'] },
                outcome: 'ok' as const,
              };
            }
            if (header === 'Bearer staff') {
              return {
                user: { sub: 'staff', preferredUsername: 'staff', roles: ['STAFF'], rawRoles: ['STAFF'] },
                outcome: 'ok' as const,
              };
            }
            return { user: null, outcome: 'jwt_invalid' as const };
          }),
          verifyAuthorizationHeader: vi.fn(async (authHeader: string | undefined) => {
            const header = authHeader?.trim();
            if (!header) return null;
            if (header === 'Bearer admin') {
              return { sub: 'admin', preferredUsername: 'admin', roles: ['ADMIN'], rawRoles: ['ADMIN'] };
            }
            if (header === 'Bearer staff') {
              return { sub: 'staff', preferredUsername: 'staff', roles: ['STAFF'], rawRoles: ['STAFF'] };
            }
            return null;
          }),
        })
        .overrideProvider(FORM_REPOSITORY)
        .useValue(formRepo)
        .overrideProvider(SUBMISSION_REPOSITORY)
        .useValue(submissionRepo)
        .overrideProvider(MIKRO_ORM)
        .useValue(mikroMock)
        .overrideProvider(REDIS_CLIENT)
        .useValue(redisMock)
        .overrideProvider(ELASTICSEARCH_CLIENT)
        .useValue(esMock)
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
      await app.listen(0);

      const address = app.getHttpServer().address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
      await app.close();
    });

    beforeEach(() => {
      formRepo.reset();
      submissionRepo.reset();
      indexedFormIds.length = 0;
      vi.mocked(mikroMock.checkConnection).mockResolvedValue({ ok: true });
      vi.mocked(redisMock.ping).mockResolvedValue('PONG');
      vi.mocked(esMock.info).mockResolvedValue({ cluster_name: 'test' });
    });

    it('GET / returns greeting text', async () => {
      const response = await fetch(`${baseUrl}/`);

      expect(response.ok).toBe(true);
      expect(await response.text()).toBe('Hello World!');
    });

    it('GET /health returns status and service keys', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const body = (await response.json()) as {
        status: string;
        services: Record<string, string>;
      };

      expect(response.ok).toBe(true);
      expect(body.status).toMatch(/^(ok|degraded)$/);
      expect(body.services).toMatchObject({
        mongodb: expect.any(String),
        redis: expect.any(String),
        elasticsearch: expect.any(String),
      });
    });

    it('REST /api/v1/forms: create → list → get → update → search → active → delete', async () => {
      const createInput = {
        title: 'E2E Form',
        description: 'Integration test',
        order: 0,
        status: FormStatus.Active,
        fields: [
          { label: 'Name', type: FieldType.Text, order: 0, required: true },
          { label: 'Score', type: FieldType.Number, order: 1, required: true },
        ],
      };

      const createdRes = await restJson<FormDto>(HTTP_API_V1_FORMS_PATH, {
        method: 'POST',
        token: 'admin',
        json: createInput,
      });
      expect(createdRes.ok).toBe(true);
      const created = createdRes.body as FormDto;
      expect(created.id).toBeTruthy();
      expect(created.title).toBe('E2E Form');

      const listRes = await restJson<FormDto[]>(HTTP_API_V1_FORMS_PATH, { method: 'GET', token: 'admin' });
      expect(listRes.ok).toBe(true);
      const listed = listRes.body ?? [];
      expect(listed.some((form) => form.id === created.id)).toBe(true);

      const getRes = await restJson<FormDto>(`${HTTP_API_V1_FORMS_PATH}/${created.id}`, {
        method: 'GET',
        token: 'admin',
      });
      expect(getRes.ok).toBe(true);
      expect((getRes.body as FormDto).id).toBe(created.id);

      const updateRes = await restJson<FormDto>(`${HTTP_API_V1_FORMS_PATH}/${created.id}`, {
        method: 'PUT',
        token: 'admin',
        json: { title: 'Updated E2E' },
      });
      expect(updateRes.ok).toBe(true);
      expect((updateRes.body as FormDto).title).toBe('Updated E2E');

      const searchRes = await restJson<FormDto[]>(`${HTTP_API_V1_FORMS_PATH}/search?query=E2E`, {
        method: 'GET',
        token: 'admin',
      });
      expect(searchRes.ok).toBe(true);
      const searched = searchRes.body ?? [];
      expect(searched.some((form) => form.id === created.id)).toBe(true);

      const activeRes = await restJson<FormDto[]>(`${HTTP_API_V1_FORMS_PATH}/active`, {
        method: 'GET',
        token: 'admin',
      });
      expect(activeRes.ok).toBe(true);
      const active = activeRes.body ?? [];
      expect(active.some((form) => form.id === created.id)).toBe(true);

      const deleteRes = await restJson<{ deleted: true }>(`${HTTP_API_V1_FORMS_PATH}/${created.id}`, {
        method: 'DELETE',
        token: 'admin',
      });
      expect(deleteRes.ok).toBe(true);
      expect(deleteRes.body).toEqual({ deleted: true });
    });

    it('REST submit + /api/v1/submissions list round-trip', async () => {
      const createInput = {
        title: 'Survey',
        description: '',
        order: 0,
        status: FormStatus.Active,
        fields: [{ label: 'Answer', type: FieldType.Text, order: 0, required: true }],
      };

      const createdRes = await restJson<FormDto>(HTTP_API_V1_FORMS_PATH, {
        method: 'POST',
        token: 'admin',
        json: createInput,
      });
      expect(createdRes.ok).toBe(true);
      const created = createdRes.body as FormDto;

      const key = submissionAnswerKey(created.fields[0]);

      const submitRes = await restJson<SubmissionDto>(`${HTTP_API_V1_FORMS_PATH}/${created.id}/submit`, {
        method: 'POST',
        token: 'staff',
        json: { answers: { [key]: 'hello-api' } },
      });
      expect(submitRes.ok).toBe(true);

      const submissionsRes = await restJson<SubmissionDto[]>(HTTP_API_V1_SUBMISSIONS_PATH, {
        method: 'GET',
        token: 'staff',
      });
      expect(submissionsRes.ok).toBe(true);
      const submissions = submissionsRes.body ?? [];
      expect(submissions.length).toBeGreaterThanOrEqual(1);
      expect(submissions[0]?.formId).toBe(created.id);
      expect(submissions[0]?.answers[key]).toBe('hello-api');
    });

    it('REST 401 without JWT on protected route', async () => {
      const res = await restJson(`${HTTP_API_V1_FORMS_PATH}/active`, { method: 'GET', token: null });
      expect(res.status).toBe(401);
    });

    it('REST 403 when role missing (staff cannot create)', async () => {
      const res = await restJson(`${HTTP_API_V1_FORMS_PATH}`, {
        method: 'POST',
        token: 'staff',
        json: {
          title: 'Nope',
          description: '',
          order: 0,
          status: FormStatus.Active,
          fields: [{ label: 'A', type: FieldType.Text, order: 0, required: true }],
        },
      });
      expect(res.status).toBe(403);
    });

    it('REST unknown collection path returns 404', async () => {
      const response = await fetch(`${baseUrl}/api/v1/no-such-resource`, { method: 'GET' });
      expect(response.status).toBe(404);
    });

    it('seeded repo: REST GET /api/v1/forms includes seed when infra mocks succeed', async () => {
      const frozen = DynamicForm.create(
        'seed-form',
        {
          title: 'Seed',
          description: '',
          order: 0,
          status: DomainFormStatus.Active,
          fields: [
            {
              id: 'seed-field',
              label: 'Only',
              type: DomainFieldType.Text,
              order: 0,
              required: true,
            },
          ],
        },
        new Date('2099-01-01T00:00:00.000Z'),
      );

      await formRepo.save(frozen);

      const listRes = await restJson<FormDto[]>(HTTP_API_V1_FORMS_PATH, { method: 'GET', token: 'admin' });
      expect(listRes.ok).toBe(true);
      const listed = listRes.body ?? [];
      expect(listed.some((form) => form.id === 'seed-form')).toBe(true);
    });

    describe.skipIf(!orpcPublicEnabled)('optional oRPC when ORPC_PUBLIC_ENABLED=true', () => {
      let rpcAdmin: RPCLink<Record<string, never>>;
      let rpcStaff: RPCLink<Record<string, never>>;
      let rpcAnon: RPCLink<Record<string, never>>;

      beforeAll(() => {
        const makeRpc = (token: 'admin' | 'staff' | null) =>
          new RPCLink({
            url: `${baseUrl}/rpc`,
            fetch: async (request, init) => {
              const headers = new Headers(request.headers);
              if (token) headers.set('Authorization', `Bearer ${token}`);
              return fetch(new Request(request, { headers }), init);
            },
          });

        rpcAdmin = makeRpc('admin');
        rpcStaff = makeRpc('staff');
        rpcAnon = makeRpc(null);
      });

      it('RPC forms.create minimal smoke', async () => {
        const created = (await rpcAdmin.call(['forms', 'create'], {
          title: 'RPC Smoke',
          description: '',
          order: 0,
          status: FormStatus.Active,
          fields: [{ label: 'A', type: FieldType.Text, order: 0, required: true }],
        }, { context: {} })) as FormDto;
        expect(created.id).toBeTruthy();
      });

      it('RPC unmatched path responds with 404 via fetch', async () => {
        const response = await fetch(`${baseUrl}/rpc/__no_such_procedure__`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ json: {} }),
        });
        expect(response.status).toBe(404);
      });

      it('RPC unauthorized without JWT', async () => {
        await expect(rpcAnon.call(['forms', 'active'], undefined, { context: {} })).rejects.toMatchObject({
          status: 401,
        });
      });

      it('RPC forbidden when role missing', async () => {
        await expect(
          rpcStaff.call(
            ['forms', 'create'],
            {
              title: 'Nope',
              description: '',
              order: 0,
              status: FormStatus.Active,
              fields: [{ label: 'A', type: FieldType.Text, order: 0, required: true }],
            },
            { context: {} },
          ),
        ).rejects.toMatchObject({ status: 403 });
      });
    });
  },
);
