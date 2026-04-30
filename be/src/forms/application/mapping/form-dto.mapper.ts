import type { FormDto, FormField as ContractFormField } from '@topcv/shared/forms';

import type { FormField } from '../../domain/form-field';
import type { FormSnapshot } from '../../domain/form-snapshot';
import { DynamicForm } from '../../domain/form.aggregate';

export class FormDtoMapper {
  static toDto(form: DynamicForm): FormDto {
    const snapshot = form.toSnapshot();

    return {
      id: snapshot.id,
      title: snapshot.title,
      description: snapshot.description,
      order: snapshot.order,
      status: snapshot.status,
      fields: snapshot.fields.map((field) => ({ ...field })) as ContractFormField[],
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString(),
    };
  }

  static toDomainFields(fields: ContractFormField[]): FormField[] {
    return fields.map((field) => ({ ...field })) as FormField[];
  }

  static restore(dto: FormDto): DynamicForm {
    return DynamicForm.restore({
      id: dto.id,
      title: dto.title,
      description: dto.description,
      order: dto.order,
      status: dto.status,
      fields: this.toDomainFields(dto.fields),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  static fromSnapshot(snapshot: FormSnapshot): FormDto {
    return this.toDto(DynamicForm.restore(snapshot));
  }
}
