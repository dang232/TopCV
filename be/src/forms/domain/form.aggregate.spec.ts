import { describe, expect, it } from 'vitest';

import { FieldType } from './field-type';
import { DynamicForm } from './form.aggregate';
import { FormStatus } from './form-status';

describe('DynamicForm', () => {
  it('creates a form aggregate and sorts fields by order', () => {
    const form = DynamicForm.create(
      'form-1',
      {
        title: 'Onboarding',
        description: 'First day form',
        order: 2,
        status: FormStatus.Active,
        fields: [
          { id: 'second', label: 'Second', type: FieldType.Text, order: 2, required: true },
          { id: 'first', label: 'First', type: FieldType.Number, order: 1, required: true },
        ],
      },
      new Date('2099-01-01T00:00:00.000Z'),
    );

    expect(form.toSnapshot()).toMatchObject({
      id: 'form-1',
      title: 'Onboarding',
      status: FormStatus.Active,
      fields: [
        { id: 'first', label: 'First' },
        { id: 'second', label: 'Second' },
      ],
    });
  });

  it('updates metadata and fields while preserving creation time', () => {
    const form = DynamicForm.create(
      'form-1',
      {
        title: 'Draft',
        description: '',
        order: 0,
        status: FormStatus.Draft,
        fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
      },
      new Date('2099-01-01T00:00:00.000Z'),
    );

    form.update(
      {
        title: 'Published',
        status: FormStatus.Active,
      },
      new Date('2099-01-02T00:00:00.000Z'),
    );

    expect(form.toSnapshot()).toMatchObject({
      title: 'Published',
      status: FormStatus.Active,
      createdAt: new Date('2099-01-01T00:00:00.000Z'),
      updatedAt: new Date('2099-01-02T00:00:00.000Z'),
    });
  });
});
