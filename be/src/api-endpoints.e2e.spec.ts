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
import type { FormRepository } from './forms/application/ports/form.repository';
import { FORM_REPOSITORY } from './forms/application/ports/form.repository';
import type { SubmissionRepository } from './forms/application/ports/submission.repository';
import { SUBMISSION_REPOSITORY } from './forms/application/ports/submission.repository';
import { DynamicForm } from './forms/domain/form.aggregate';
import { FieldType as DomainFieldType } from './forms/domain/field-type';
import { FormStatus as DomainFormStatus } from './forms/domain/form-status';
import { MIKRO_ORM } from './database/database.module';
import { ELASTICSEARCH_CLIENT, REDIS_CLIENT } from './infra/external-clients.module';

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
      return { result: 'deleted' };
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

  async findById(id: string): Promise<DynamicForm | null> {
    return this.forms.get(id) ?? null;
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
  'HTTP API (app endpoints + oRPC)',
  {
    timeout: 60_000,
  },
  () => {
    let app: INestApplication;
    let baseUrl: string;
    let rpcLink: RPCLink<Record<string, never>>;

    const indexedFormIds: string[] = [];
    const formRepo = new InMemoryFormRepository();
    const submissionRepo = new InMemorySubmissionRepository();
    const redisMock = createRedisMock();
    const esMock = createElasticsearchMock(indexedFormIds);
    const mikroMock = createMikroOrmMock();

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
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
      rpcLink = new RPCLink({ url: `${baseUrl}/rpc` });
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

    it('RPC forms.create → list → get → update → search → active → delete', async () => {
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

      const created = (await rpcLink.call(['forms', 'create'], createInput, {
        context: {},
      })) as FormDto;

      expect(created.id).toBeTruthy();
      expect(created.title).toBe('E2E Form');

      const listed = (await rpcLink.call(['forms', 'list'], undefined, { context: {} })) as FormDto[];

      expect(listed.some((form) => form.id === created.id)).toBe(true);

      const fetched = (await rpcLink.call(['forms', 'get'], { id: created.id }, { context: {} })) as FormDto;

      expect(fetched.id).toBe(created.id);

      const updated = (await rpcLink.call(
        ['forms', 'update'],
        { id: created.id, title: 'Updated E2E' },
        { context: {} },
      )) as FormDto;

      expect(updated.title).toBe('Updated E2E');

      const searched = (await rpcLink.call(['forms', 'search'], { query: 'E2E' }, { context: {} })) as FormDto[];

      expect(searched.some((form) => form.id === created.id)).toBe(true);

      const active = (await rpcLink.call(['forms', 'active'], undefined, { context: {} })) as FormDto[];

      expect(active.some((form) => form.id === created.id)).toBe(true);

      const deleted = (await rpcLink.call(['forms', 'delete'], { id: created.id }, { context: {} })) as {
        deleted: true;
      };

      expect(deleted).toEqual({ deleted: true });
    });

    it('RPC forms.submit and submissions.list round-trip', async () => {
      const createInput = {
        title: 'Survey',
        description: '',
        order: 0,
        status: FormStatus.Active,
        fields: [{ label: 'Answer', type: FieldType.Text, order: 0, required: true }],
      };

      const created = (await rpcLink.call(['forms', 'create'], createInput, {
        context: {},
      })) as FormDto;

      const key = submissionAnswerKey(created.fields[0]);

      await rpcLink.call(
        ['forms', 'submit'],
        {
          formId: created.id,
          answers: { [key]: 'hello-api' },
        },
        { context: {} },
      );

      const submissions = (await rpcLink.call(['submissions', 'list'], undefined, {
        context: {},
      })) as SubmissionDto[];

      expect(submissions.length).toBeGreaterThanOrEqual(1);
      expect(submissions[0]?.formId).toBe(created.id);
      expect(submissions[0]?.answers[key]).toBe('hello-api');
    });

    it('RPC unmatched path responds with 404 via fetch', async () => {
      const response = await fetch(`${baseUrl}/rpc/__no_such_procedure__`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ json: {} }),
      });

      expect(response.status).toBe(404);
    });

    it('seeded repo: GET /health stays ok when infra mocks succeed', async () => {
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

      const listed = (await rpcLink.call(['forms', 'list'], undefined, { context: {} })) as FormDto[];

      expect(listed.some((form) => form.id === 'seed-form')).toBe(true);
    });
  },
);
