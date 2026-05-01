import type { FormSnapshot } from '../../domain/form-snapshot';

export const FORM_SEARCH_INDEX = Symbol('FORM_SEARCH_INDEX');

export interface FormSearchIndex {
  index(snapshot: FormSnapshot): Promise<void>;
  remove(id: string): Promise<void>;
  search(query: string): Promise<string[]>;
}
