import type { DynamicForm } from '../../domain/form.aggregate';

export const FORM_REPOSITORY = Symbol('FORM_REPOSITORY');

export interface FormRepository {
  save(form: DynamicForm): Promise<DynamicForm>;
  findAll(): Promise<DynamicForm[]>;
  findById(id: string): Promise<DynamicForm | null>;
  delete(id: string): Promise<void>;
}
