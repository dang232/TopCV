import { Inject, Injectable } from '@nestjs/common';
import { FormIdInputSchema } from '@topcv/shared/forms';

import { RedisFormCache } from '../../infrastructure/cache/redis-form-cache';
import { FORM_CACHE, type FormCache } from '../ports/form.cache';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { FORM_SEARCH_INDEX, type FormSearchIndex } from '../ports/form.search-index';

@Injectable()
export class DeleteFormUseCase {
  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FORM_CACHE) private readonly cache: FormCache,
    @Inject(FORM_SEARCH_INDEX) private readonly searchIndex: FormSearchIndex,
  ) {}

  async execute(input: { id: string }): Promise<{ deleted: true }> {
    const { id } = FormIdInputSchema.parse(input);

    await this.repository.delete(id);
    await this.cache.delete(RedisFormCache.keys.list(), RedisFormCache.keys.active(), RedisFormCache.keys.byId(id));
    await this.searchIndex.remove(id);

    return { deleted: true };
  }
}
