import { describe, expect, it, vi } from 'vitest';

import { FieldType } from '../../domain/field-type';
import { DynamicForm } from '../../domain/form.aggregate';
import { FormStatus } from '../../domain/form-status';
import type { FormRepository } from '../ports/form.repository';
import type { SubmissionRepository } from '../ports/submission.repository';
import { ListSubmissionsUseCase } from './list-submissions.use-case';
import { SubmitFormUseCase } from './submit-form.use-case';

describe('submission use cases', () => {
  const form = DynamicForm.create('form-1', {
    title: 'Survey',
    description: '',
    order: 0,
    status: FormStatus.Active,
    fields: [
      { id: 'score', label: 'Score', type: FieldType.Number, order: 0, required: true },
      { id: 'note', label: 'Note', type: FieldType.Text, order: 1, required: false },
    ],
  });

  it('validates answers against stored fields before saving a submission', async () => {
    const forms: FormRepository = {
      save: vi.fn(),
      findAll: vi.fn(),
      countAll: vi.fn(async () => 1),
      findPage: vi.fn(async () => [form]),
      findById: vi.fn(async () => form),
      findByIds: vi.fn(),
      delete: vi.fn(),
    };
    const submissions: SubmissionRepository = {
      save: vi.fn(async (submission) => submission),
      findAll: vi.fn(),
    };
    const useCase = new SubmitFormUseCase(
      forms,
      submissions,
      () => 'submission-1',
      () => new Date('2099-01-01T00:00:00.000Z'),
    );

    await expect(useCase.execute({ formId: 'form-1', answers: { score: 50, note: 'Hello' } })).resolves.toEqual({
      id: 'submission-1',
      formId: 'form-1',
      answers: { score: 50, note: 'Hello' },
      submittedAt: '2099-01-01T00:00:00.000Z',
    });
  });

  it('coerces string number answers and omits empty optional answers', async () => {
    const forms: FormRepository = {
      save: vi.fn(),
      findAll: vi.fn(),
      countAll: vi.fn(async () => 1),
      findPage: vi.fn(async () => [form]),
      findById: vi.fn(async () => form),
      findByIds: vi.fn(),
      delete: vi.fn(),
    };
    const submissions: SubmissionRepository = {
      save: vi.fn(async (submission) => submission),
      findAll: vi.fn(),
    };
    const useCase = new SubmitFormUseCase(
      forms,
      submissions,
      () => 'submission-1',
      () => new Date('2099-01-01T00:00:00.000Z'),
    );

    await expect(useCase.execute({ formId: 'form-1', answers: { score: '50', note: '' } })).resolves.toEqual({
      id: 'submission-1',
      formId: 'form-1',
      answers: { score: 50 },
      submittedAt: '2099-01-01T00:00:00.000Z',
    });
  });

  it('rejects invalid answers', async () => {
    const forms: FormRepository = {
      save: vi.fn(),
      findAll: vi.fn(),
      countAll: vi.fn(async () => 1),
      findPage: vi.fn(async () => [form]),
      findById: vi.fn(async () => form),
      findByIds: vi.fn(),
      delete: vi.fn(),
    };
    const submissions: SubmissionRepository = {
      save: vi.fn(),
      findAll: vi.fn(),
    };
    const useCase = new SubmitFormUseCase(forms, submissions);

    await expect(useCase.execute({ formId: 'form-1', answers: { score: -1 } })).rejects.toThrow();
    await expect(useCase.execute({ formId: 'form-1', answers: { score: 101 } })).rejects.toThrow();
  });

  it('lists saved submissions', async () => {
    const submissions: SubmissionRepository = {
      save: vi.fn(),
      findAll: vi.fn(async () => [
        {
          id: 'submission-1',
          formId: 'form-1',
          answers: { score: 50 },
          submittedAt: '2099-01-01T00:00:00.000Z',
        },
      ]),
    };
    const useCase = new ListSubmissionsUseCase(submissions);

    await expect(useCase.execute()).resolves.toHaveLength(1);
  });
});
