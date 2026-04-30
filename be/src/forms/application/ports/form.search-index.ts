import type { DynamicForm } from '../../domain/form.aggregate';

export const FORM_SEARCH_INDEX = Symbol('FORM_SEARCH_INDEX');

export interface FormSearchIndex {
  index(form: DynamicForm): Promise<void>;
  remove(id: string): Promise<void>;
  search(query: string): Promise<string[]>;
}
