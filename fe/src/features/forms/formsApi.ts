import type { CreateFormInput, FormDto, SubmissionDto, SubmitFormInput, UpdateFormInput } from '@topcv/shared';

import { orpc } from '@/src/lib/orpcClient';

export interface FormsApi {
  create(input: CreateFormInput): Promise<FormDto>;
  list(): Promise<FormDto[]>;
  get(input: { id: string }): Promise<FormDto>;
  update(input: UpdateFormInput): Promise<FormDto>;
  delete(input: { id: string }): Promise<{ deleted: true }>;
  search(input: { query: string }): Promise<FormDto[]>;
  active(): Promise<FormDto[]>;
  submit(input: SubmitFormInput): Promise<SubmissionDto>;
  listSubmissions(): Promise<SubmissionDto[]>;
}

export const formsApi: FormsApi = {
  create: (input) => orpc.forms.create(input),
  list: () => orpc.forms.list(),
  get: (input) => orpc.forms.get(input),
  update: (input) => orpc.forms.update(input),
  delete: (input) => orpc.forms.delete(input),
  search: (input) => orpc.forms.search(input),
  active: () => orpc.forms.active(),
  submit: (input) => orpc.forms.submit(input),
  listSubmissions: () => orpc.submissions.list(),
};
