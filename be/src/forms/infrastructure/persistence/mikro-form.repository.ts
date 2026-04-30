import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import type { FormRepository } from '../../application/ports/form.repository';
import type { DynamicForm } from '../../domain/form.aggregate';
import { FormEntity } from './form.entity';
import { FormMapper } from './form.mapper';

@Injectable()
export class MikroFormRepository implements FormRepository {
  constructor(private readonly em: EntityManager) {}

  async save(form: DynamicForm): Promise<DynamicForm> {
    const snapshot = form.toSnapshot();
    const existing = await this.em.findOne(FormEntity, { publicId: snapshot.id });
    const entity = FormMapper.toEntity(form, existing ?? new FormEntity());

    this.em.persist(entity);
    await this.em.flush();

    return FormMapper.toDomain(entity);
  }

  async findAll(): Promise<DynamicForm[]> {
    const entities = await this.em.find(FormEntity, {}, { orderBy: { order: 'asc' } });

    return entities.map((entity) => FormMapper.toDomain(entity));
  }

  async findById(id: string): Promise<DynamicForm | null> {
    const entity = await this.em.findOne(FormEntity, { publicId: id });

    return entity ? FormMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    const entity = await this.em.findOne(FormEntity, { publicId: id });

    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
