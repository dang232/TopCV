/**
 * Relative paths under {@link API_V1} for the forms domain (no origin, starts with `/forms`).
 * Use with `createApiClient` / `apiFetchJson` which prefix {@link API_V1}.
 */
export const formsV1Routes = {
  list: () => '/forms',
  listPage: (page: number, pageSize: number) =>
    `/forms/page?${new URLSearchParams({ page: String(page), pageSize: String(pageSize) }).toString()}`,
  create: () => '/forms',
  get: (id: string) => `/forms/${encodeURIComponent(id)}`,
  update: (id: string) => `/forms/${encodeURIComponent(id)}`,
  delete: (id: string) => `/forms/${encodeURIComponent(id)}`,
  search: (query: string) => `/forms/search?${new URLSearchParams({ query }).toString()}`,
  active: () => '/forms/active',
  submit: (formId: string) => `/forms/${encodeURIComponent(formId)}/submit`,
  addField: (formId: string) => `/forms/${encodeURIComponent(formId)}/fields`,
  updateField: (formId: string, fieldId: string) =>
    `/forms/${encodeURIComponent(formId)}/fields/${encodeURIComponent(fieldId)}`,
  deleteField: (formId: string, fieldId: string) =>
    `/forms/${encodeURIComponent(formId)}/fields/${encodeURIComponent(fieldId)}`,
} as const;

export const submissionsV1Routes = {
  list: () => '/submissions',
} as const;
