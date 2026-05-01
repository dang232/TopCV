import {
  FormDtoSchema,
  PaginatedFormListSchema,
  SubmissionDtoSchema,
  type CreateFormInput,
  type FormDto,
  type PaginatedFormList,
  type SubmissionDto,
  type SubmitFormInput,
  type UpdateFormInput,
} from '@topcv/shared';
import { z } from 'zod';

import {
  apiFetchJson,
  ApiContractViolationError,
  formsV1Routes,
  submissionsV1Routes,
} from '@/src/shared/api/http';

const FormDtoListSchema = z.array(FormDtoSchema);
const SubmissionDtoListSchema = z.array(SubmissionDtoSchema);
const DeleteResultSchema = z.object({
  deleted: z.literal(true),
});

function parseResponse<T>(path: string, schema: z.ZodType<T>, raw: unknown): T {
  try {
    return schema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiContractViolationError({
        route: path,
        issues: error.issues,
        message: `API response for "${path}" did not match the shared schema: ${error.message}`,
      });
    }
    throw error;
  }
}

export interface FormsApi {
  create(input: CreateFormInput): Promise<FormDto>;
  list(): Promise<FormDto[]>;
  listPage(input: { page: number; pageSize: number }): Promise<PaginatedFormList>;
  get(input: { id: string }): Promise<FormDto>;
  update(input: UpdateFormInput): Promise<FormDto>;
  delete(input: { id: string }): Promise<{ deleted: true }>;
  search(input: { query: string }): Promise<FormDto[]>;
  active(): Promise<FormDto[]>;
  submit(input: SubmitFormInput): Promise<SubmissionDto>;
  listSubmissions(): Promise<SubmissionDto[]>;
}

export const formsApi: FormsApi = {
  create: async (input) => {
    const path = formsV1Routes.create();
    const raw = await apiFetchJson<unknown>(path, { method: 'POST', json: input });
    return parseResponse(path, FormDtoSchema, raw);
  },
  list: async () => {
    const path = formsV1Routes.list();
    const raw = await apiFetchJson<unknown>(path);
    return parseResponse(path, FormDtoListSchema, raw);
  },
  listPage: async (input) => {
    const path = formsV1Routes.listPage(input.page, input.pageSize);
    const raw = await apiFetchJson<unknown>(path);
    return parseResponse(path, PaginatedFormListSchema, raw);
  },
  get: async (input) => {
    const path = formsV1Routes.get(input.id);
    const raw = await apiFetchJson<unknown>(path);
    return parseResponse(path, FormDtoSchema, raw);
  },
  update: async (input) => {
    const path = formsV1Routes.update(input.id);
    const { id, ...body } = input;
    void id;
    const raw = await apiFetchJson<unknown>(path, { method: 'PUT', json: body });
    return parseResponse(path, FormDtoSchema, raw);
  },
  delete: async (input) => {
    const path = formsV1Routes.delete(input.id);
    const raw = await apiFetchJson<unknown>(path, { method: 'DELETE' });
    return parseResponse(path, DeleteResultSchema, raw);
  },
  search: async (input) => {
    const path = formsV1Routes.search(input.query);
    const raw = await apiFetchJson<unknown>(path);
    return parseResponse(path, FormDtoListSchema, raw);
  },
  active: async () => {
    const path = formsV1Routes.active();
    const raw = await apiFetchJson<unknown>(path);
    return parseResponse(path, FormDtoListSchema, raw);
  },
  submit: async (input) => {
    const path = formsV1Routes.submit(input.formId);
    const raw = await apiFetchJson<unknown>(path, {
      method: 'POST',
      json: { answers: input.answers },
    });
    return parseResponse(path, SubmissionDtoSchema, raw);
  },
  listSubmissions: async () => {
    const path = submissionsV1Routes.list();
    const raw = await apiFetchJson<unknown>(path);
    return parseResponse(path, SubmissionDtoListSchema, raw);
  },
};
