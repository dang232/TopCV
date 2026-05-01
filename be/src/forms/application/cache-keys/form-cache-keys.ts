export const FormCacheKeys = {
  list: () => 'forms:list',
  active: () => 'forms:active',
  byId: (id: string) => `forms:by-id:${id}`,
} as const;

