import type { FormStatus } from '@topcv/shared/forms';

import type { DynamicForm } from '../../domain/form.aggregate';

export const FORM_REPOSITORY = Symbol('FORM_REPOSITORY');

export interface FormRepository {
  save(form: DynamicForm): Promise<DynamicForm>;
  findAll(): Promise<DynamicForm[]>;
  findByStatus(status: FormStatus): Promise<DynamicForm[]>;
  countAll(): Promise<number>;
  findPage(input: { skip: number; take: number }): Promise<DynamicForm[]>;
  findById(id: string): Promise<DynamicForm | null>;
  findByIds(ids: string[]): Promise<DynamicForm[]>;
  delete(id: string): Promise<void>;
}
