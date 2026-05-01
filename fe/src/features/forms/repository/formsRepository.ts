import type {
  CreateFormInput,
  FormDto,
  PaginatedFormList,
  SubmissionDto,
  SubmitFormInput,
  UpdateFormInput,
} from '@topcv/shared';

/**
 * Port used by the Forms feature (presentation layer).
 * Implementation can be oRPC, REST, mocks, etc.
 */
export interface FormsRepository {
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

