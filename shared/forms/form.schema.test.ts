import { describe, expect, it } from 'vitest';

import {
  CreateFormInputSchema,
  SubmitFormInputSchema,
  UpdateFormInputSchema,
  createSubmissionAnswersSchema,
} from './form.schema';

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

describe('createSubmissionAnswersSchema', () => {
  const form = CreateFormInputSchema.parse({
    title: 'Survey',
    order: 0,
    status: 'active',
    fields: [
      { id: 'name', ...baseField, type: 'text' },
      { id: 'score', ...baseField, label: 'Score', type: 'number', order: 1 },
      { id: 'date', ...baseField, label: 'Date', type: 'date', order: 2 },
      { id: 'color', ...baseField, label: 'Color', type: 'color', order: 3 },
      {
        id: 'department',
        ...baseField,
        label: 'Department',
        type: 'select',
        order: 4,
        options: ['Engineering', 'Sales'],
      },
    ],
  });

  it('accepts valid answers for every documented field type', () => {
    const schema = createSubmissionAnswersSchema(form.fields);

    const result = schema.safeParse({
      name: 'Jane',
      score: 99,
      date: '2099-01-01',
      color: '#AABBCC',
      department: 'Engineering',
    });

    expect(result.success).toBe(true);
  });

  it('rejects text longer than 200 characters', () => {
    const schema = createSubmissionAnswersSchema(form.fields);

    const result = schema.safeParse({
      name: 'x'.repeat(201),
      score: 99,
      date: '2099-01-01',
      color: '#AABBCC',
      department: 'Engineering',
    });

    expect(result.success).toBe(false);
  });

  it('rejects number answers outside 0 to 100', () => {
    const schema = createSubmissionAnswersSchema(form.fields);

    const result = schema.safeParse({
      name: 'Jane',
      score: 101,
      date: '2099-01-01',
      color: '#AABBCC',
      department: 'Engineering',
    });

    expect(result.success).toBe(false);
  });

  it('rejects past dates, invalid colors, and select values outside options', () => {
    const schema = createSubmissionAnswersSchema(form.fields);

    const result = schema.safeParse({
      name: 'Jane',
      score: 99,
      date: '2000-01-01',
      color: 'blue',
      department: 'Finance',
    });

    expect(result.success).toBe(false);
  });

  it('accepts answers keyed by label when field id is omitted', () => {
    const form = CreateFormInputSchema.parse({
      title: 'Survey',
      order: 0,
      status: 'active',
      fields: [{ ...baseField, type: 'text' }],
    });

    const schema = createSubmissionAnswersSchema(form.fields);

    const result = schema.safeParse({
      [baseField.label]: 'Jane',
    });

    expect(result.success).toBe(true);
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
