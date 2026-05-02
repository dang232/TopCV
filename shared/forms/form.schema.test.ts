import { describe, expect, it } from 'vitest';

import { FieldType } from './form.enum';
import { CreateFormInputSchema, SearchFormsInputSchema, SubmitFormInputSchema, UpdateFormInputSchema, submissionAnswerKey } from './form.schema';

const baseField = {
  label: 'Customer name',
  order: 0,
  required: true,
};

describe('CreateFormInputSchema', () => {
  it('accepts a valid dynamic form with all supported field types', () => {
    const result = CreateFormInputSchema.safeParse({
      title: 'Customer onboarding',
      description: 'Collect required onboarding data',
      order: 1,
      status: 'active',
      fields: [
        { ...baseField, type: 'text' },
        { ...baseField, label: 'Score', type: 'number', order: 1 },
        { ...baseField, label: 'Start date', type: 'date', order: 2 },
        { ...baseField, label: 'Brand color', type: 'color', order: 3 },
        {
          ...baseField,
          label: 'Department',
          type: 'select',
          order: 4,
          options: ['Engineering', 'Sales'],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects a select field without options', () => {
    const result = CreateFormInputSchema.safeParse({
      title: 'Invalid form',
      order: 1,
      status: 'draft',
      fields: [{ ...baseField, type: 'select', options: [] }],
    });

    expect(result.success).toBe(false);
  });
});

describe('submissionAnswerKey', () => {
  it('prefers field id when present', () => {
    const key = submissionAnswerKey({ id: 'field-id', ...baseField, type: FieldType.Text });
    expect(key).toBe('field-id');
  });

  it('falls back to label when id is omitted', () => {
    const key = submissionAnswerKey({ ...baseField, type: FieldType.Text });
    expect(key).toBe(baseField.label);
  });
});

describe('UpdateFormInputSchema', () => {
  it('parses a title-only patch without injecting status defaults', () => {
    const result = UpdateFormInputSchema.safeParse({ id: 'form-1', title: 'Only title' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
      expect(result.data.fields).toBeUndefined();
    }
  });
});

describe('SubmitFormInputSchema', () => {
  it('accepts a form id and answer record', () => {
    const result = SubmitFormInputSchema.safeParse({
      formId: 'form-1',
      answers: {
        name: 'Jane',
      },
    });

    expect(result.success).toBe(true);
  });
});

describe('SearchFormsInputSchema', () => {
  it('accepts a non-empty query', () => {
    const result = SearchFormsInputSchema.safeParse({ query: 'employee onboarding' });
    expect(result.success).toBe(true);
  });

  it('rejects excessively long queries', () => {
    const result = SearchFormsInputSchema.safeParse({ query: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
