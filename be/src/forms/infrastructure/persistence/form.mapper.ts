import { DynamicForm } from '../../domain/form.aggregate';
import { FormEntity } from './form.entity';

export class FormMapper {
  static toEntity(form: DynamicForm, entity = new FormEntity()): FormEntity {
    const snapshot = form.toSnapshot();

    entity.publicId = snapshot.id;
    entity.title = snapshot.title;
    entity.description = snapshot.description;
    entity.order = snapshot.order;
    entity.status = snapshot.status;
    entity.fields = snapshot.fields;
    entity.createdAt = snapshot.createdAt;
    entity.updatedAt = snapshot.updatedAt;

    return entity;
  }

  static toDomain(entity: FormEntity): DynamicForm {
    return DynamicForm.restore({
      id: entity.publicId,
      title: entity.title,
      description: entity.description,
      order: entity.order,
      status: entity.status,
      fields: entity.fields,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
