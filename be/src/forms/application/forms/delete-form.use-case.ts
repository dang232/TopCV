import { Inject, Injectable } from '@nestjs/common';
import { FormIdInputSchema } from '@topcv/shared/forms';

import { FormCacheInvalidator } from '../cache-keys/form-cache.invalidator';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { FORM_SEARCH_INDEX, type FormSearchIndex } from '../ports/form.search-index';

@Injectable()
export class DeleteFormUseCase {
  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FormCacheInvalidator) private readonly cacheInvalidator: FormCacheInvalidator,
    @Inject(FORM_SEARCH_INDEX) private readonly searchIndex: FormSearchIndex,
  ) {}

  async execute(input: { id: string }): Promise<{ deleted: true }> {
    const { id } = FormIdInputSchema.parse(input);

    await this.repository.delete(id);
    await this.cacheInvalidator.invalidateForm(id);
    await this.searchIndex.remove(id);

    return { deleted: true };
  }
}
