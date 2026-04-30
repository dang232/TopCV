export const FORM_CACHE = Symbol('FORM_CACHE');

export interface FormCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(...keys: string[]): Promise<void>;
}
