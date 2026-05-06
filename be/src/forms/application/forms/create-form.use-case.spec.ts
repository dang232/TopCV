import { describe, expect, it, vi } from 'vitest';
import { FieldType, FormStatus } from '@topcv/shared/forms';

import { FormCacheInvalidator } from '../cache-keys/form-cache.invalidator';
import type { FormCache } from '../ports/form.cache';
import type { FormRepository } from '../ports/form.repository';
import type { FormSearchIndex } from '../ports/form.search-index';
import { CreateFormUseCase } from './create-form.use-case';

describe('CreateFormUseCase', () => {
  it('persists a valid form, invalidates read caches, and indexes the document', async () => {
    const repository: FormRepository = {
      save: vi.fn(async (form) => form),
      findAll: vi.fn(),
      findByStatus: vi.fn(async () => []),
      countAll: vi.fn(async () => 0),
      findPage: vi.fn(async () => []),
      findById: vi.fn(),
      findByIds: vi.fn(),
      delete: vi.fn(),
    };
    const cache: FormCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    const searchIndex: FormSearchIndex = {
      index: vi.fn(),
      remove: vi.fn(),
      search: vi.fn(),
    };
    const useCase = new CreateFormUseCase(
      repository,
      new FormCacheInvalidator(cache),
      searchIndex,
      () => 'form-1',
      () => new Date('2099-01-01T00:00:00.000Z'),
    );

    const created = await useCase.execute({
      title: 'Onboarding',
      description: 'Collect details',
      order: 1,
      status: FormStatus.Active,
      fields: [{ label: 'Name', type: FieldType.Text, order: 0, required: true }],
    });

    expect(created).toMatchObject({
      id: 'form-1',
      title: 'Onboarding',
      fields: [{ id: 'form-1-field-0', label: 'Name' }],
    });
    expect(repository.save).toHaveBeenCalledOnce();
    expect(cache.delete).toHaveBeenCalledWith('forms:list', 'forms:active');
    expect(searchIndex.index).toHaveBeenCalledOnce();
  });
});
