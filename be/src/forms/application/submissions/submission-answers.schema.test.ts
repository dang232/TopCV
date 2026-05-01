import { describe, expect, it } from 'vitest';

import { CreateFormInputSchema } from '@topcv/shared/forms';

import { createSubmissionAnswersSchema } from './submission-answers.schema';

const baseField = {
  label: 'Customer name',
  order: 0,
  required: true,
};

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

  it('accepts number answers in the 0..100 range', () => {
    const schema = createSubmissionAnswersSchema(form.fields);

    expect(
      schema.safeParse({
        name: 'Jane',
        score: 0,
        date: '2099-01-01',
        color: '#AABBCC',
        department: 'Engineering',
      }).success,
    ).toBe(true);

    expect(
      schema.safeParse({
        name: 'Jane',
        score: 100,
        date: '2099-01-01',
        color: '#AABBCC',
        department: 'Engineering',
      }).success,
    ).toBe(true);
  });

  it('rejects numbers outside range and non-finite values', () => {
    const schema = createSubmissionAnswersSchema(form.fields);

    expect(
      schema.safeParse({
        name: 'Jane',
        score: -1,
        date: '2099-01-01',
        color: '#AABBCC',
        department: 'Engineering',
      }).success,
    ).toBe(false);

    expect(
      schema.safeParse({
        name: 'Jane',
        score: 101,
        date: '2099-01-01',
        color: '#AABBCC',
        department: 'Engineering',
      }).success,
    ).toBe(false);

    expect(
      schema.safeParse({
        name: 'Jane',
        score: Number.POSITIVE_INFINITY,
        date: '2099-01-01',
        color: '#AABBCC',
        department: 'Engineering',
      }).success,
    ).toBe(false);
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

