import { describe, expect, it, vi } from 'vitest';

import { FieldType } from '../../domain/field-type';
import { DynamicForm } from '../../domain/form.aggregate';
import { FormStatus } from '../../domain/form-status';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import type { FormCache } from '../ports/form.cache';
import type { FormRepository } from '../ports/form.repository';
import type { FormSearchIndex } from '../ports/form.search-index';
import { DeleteFormUseCase } from './delete-form.use-case';
import { GetActiveFormsUseCase } from './get-active-forms.use-case';
import { GetFormUseCase } from './get-form.use-case';
import { ListFormsUseCase } from './list-forms.use-case';
import { SearchFormsUseCase } from './search-forms.use-case';
import { UpdateFormUseCase } from './update-form.use-case';

function makeForm(id: string, status: FormStatus = FormStatus.Draft, order = 0) {
  return DynamicForm.create(
    id,
    {
      title: `Form ${id}`,
      description: '',
      order,
      status,
      fields: [{ id: `${id}-field`, label: 'Name', type: FieldType.Text, order: 0, required: true }],
    },
    new Date('2099-01-01T00:00:00.000Z'),
  );
}

function makeDeps(forms: DynamicForm[] = []) {
  const repository: FormRepository = {
    save: vi.fn(async (form) => form),
    findAll: vi.fn(async () => forms),
    findById: vi.fn(async (id) => forms.find((form) => form.toSnapshot().id === id) ?? null),
    delete: vi.fn(),
  };
  const cache: FormCache = {
    get: vi.fn(async () => null),
    set: vi.fn(),
    delete: vi.fn(),
  };
  const searchIndex: FormSearchIndex = {
    index: vi.fn(),
    remove: vi.fn(),
    search: vi.fn(async () => []),
  };

  return { repository, cache, searchIndex };
}

describe('form use cases', () => {
  it('lists forms through a read-through cache', async () => {
    const form = makeForm('form-1');
    const { repository, cache } = makeDeps([form]);
    const useCase = new ListFormsUseCase(repository, cache);

    await expect(useCase.execute()).resolves.toEqual([FormDtoMapper.toDto(form)]);

    expect(cache.get).toHaveBeenCalledWith('forms:list');
    expect(cache.set).toHaveBeenCalledWith('forms:list', [FormDtoMapper.toDto(form)], 60);
  });

  it('gets one form through a read-through cache', async () => {
    const form = makeForm('form-1');
    const { repository, cache } = makeDeps([form]);
    const useCase = new GetFormUseCase(repository, cache);

    await expect(useCase.execute({ id: 'form-1' })).resolves.toEqual(FormDtoMapper.toDto(form));

    expect(cache.set).toHaveBeenCalledWith('forms:by-id:form-1', FormDtoMapper.toDto(form), 60);
  });

  it('updates a form, invalidates read caches, and reindexes search', async () => {
    const form = makeForm('form-1');
    const { repository, cache, searchIndex } = makeDeps([form]);
    const useCase = new UpdateFormUseCase(repository, cache, searchIndex, () => new Date('2099-01-02T00:00:00.000Z'));

    const updated = await useCase.execute({ id: 'form-1', title: 'Updated' });

    expect(updated.title).toBe('Updated');
    expect(repository.save).toHaveBeenCalledOnce();
    expect(cache.delete).toHaveBeenCalledWith('forms:list', 'forms:active', 'forms:by-id:form-1');
    expect(searchIndex.index).toHaveBeenCalledOnce();
  });

  it('deletes a form and removes cache/search entries', async () => {
    const { repository, cache, searchIndex } = makeDeps();
    const useCase = new DeleteFormUseCase(repository, cache, searchIndex);

    await useCase.execute({ id: 'form-1' });

    expect(repository.delete).toHaveBeenCalledWith('form-1');
    expect(cache.delete).toHaveBeenCalledWith('forms:list', 'forms:active', 'forms:by-id:form-1');
    expect(searchIndex.remove).toHaveBeenCalledWith('form-1');
  });

  it('searches indexed forms and resolves ids back to stored forms', async () => {
    const form = makeForm('form-1');
    const { repository, searchIndex } = makeDeps([form]);
    vi.mocked(searchIndex.search).mockResolvedValue(['form-1']);
    const useCase = new SearchFormsUseCase(repository, searchIndex);

    await expect(useCase.execute({ query: 'form' })).resolves.toEqual([FormDtoMapper.toDto(form)]);
  });

  it('returns active forms sorted by display order with caching', async () => {
    const later = makeForm('later', FormStatus.Active, 2);
    const first = makeForm('first', FormStatus.Active, 1);
    const draft = makeForm('draft', FormStatus.Draft, 0);
    const { repository, cache } = makeDeps([later, first, draft]);
    const useCase = new GetActiveFormsUseCase(repository, cache);

    const active = await useCase.execute();

    expect(active.map((form) => form.id)).toEqual(['first', 'later']);
    expect(cache.set).toHaveBeenCalledWith('forms:active', active, 60);
  });
});
