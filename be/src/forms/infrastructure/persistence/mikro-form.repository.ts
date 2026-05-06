import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import type { FormStatus } from '@topcv/shared/forms';

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

  async findByStatus(status: FormStatus): Promise<DynamicForm[]> {
    const entities = await this.em.find(FormEntity, { status }, { orderBy: { order: 'asc' } });

    return entities.map((entity) => FormMapper.toDomain(entity));
  }

  async countAll(): Promise<number> {
    return this.em.count(FormEntity, {});
  }

  async findPage(input: { skip: number; take: number }): Promise<DynamicForm[]> {
    const entities = await this.em.find(
      FormEntity,
      {},
      { orderBy: { order: 'asc' }, offset: input.skip, limit: input.take },
    );

    return entities.map((entity) => FormMapper.toDomain(entity));
  }

  async findById(id: string): Promise<DynamicForm | null> {
    const entity = await this.em.findOne(FormEntity, { publicId: id });

    return entity ? FormMapper.toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<DynamicForm[]> {
    if (ids.length === 0) {
      return [];
    }

    const entities = await this.em.find(FormEntity, { publicId: { $in: ids } });
    const forms = entities.map((entity) => FormMapper.toDomain(entity));
    const order = new Map(ids.map((id, index) => [id, index] as const));

    return forms.sort(
      (left, right) => (order.get(left.toSnapshot().id) ?? 0) - (order.get(right.toSnapshot().id) ?? 0),
    );
  }

  async delete(id: string): Promise<void> {
    const entity = await this.em.findOne(FormEntity, { publicId: id });

    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
