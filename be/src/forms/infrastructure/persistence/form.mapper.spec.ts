import { describe, expect, it } from 'vitest';

import { FieldType } from '../../domain/field-type';
import { DynamicForm } from '../../domain/form.aggregate';
import { FormStatus } from '../../domain/form-status';
import { FormEntity } from './form.entity';
import { FormMapper } from './form.mapper';

describe('FormMapper', () => {
  it('maps between domain aggregate and MikroORM entity without leaking persistence types', () => {
    const form = DynamicForm.create(
      'form-1',
      {
        title: 'Onboarding',
        description: 'Collect details',
        order: 1,
        status: FormStatus.Active,
        fields: [{ id: 'name', label: 'Name', type: FieldType.Text, order: 0, required: true }],
      },
      new Date('2099-01-01T00:00:00.000Z'),
    );

    const entity = FormMapper.toEntity(form);
    const mapped = FormMapper.toDomain(entity);

    expect(entity).toBeInstanceOf(FormEntity);
    expect(mapped.toSnapshot()).toEqual(form.toSnapshot());
  });
});
