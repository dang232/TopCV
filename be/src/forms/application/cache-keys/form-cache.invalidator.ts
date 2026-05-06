import { Inject, Injectable } from '@nestjs/common';

import { FORM_CACHE, type FormCache } from '../ports/form.cache';
import { FormCacheKeys } from './form-cache-keys';

@Injectable()
export class FormCacheInvalidator {
  constructor(@Inject(FORM_CACHE) private readonly cache: FormCache) {}

  async invalidateLists(): Promise<void> {
    await this.cache.delete(FormCacheKeys.list(), FormCacheKeys.active());
  }

  async invalidateForm(id: string): Promise<void> {
    await this.cache.delete(FormCacheKeys.list(), FormCacheKeys.active(), FormCacheKeys.byId(id));
  }
}
