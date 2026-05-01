import { Inject, Injectable } from '@nestjs/common';
import type { FormDto } from '@topcv/shared/forms';

import { FormCacheKeys } from '../cache-keys/form-cache-keys';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_CACHE, type FormCache } from '../ports/form.cache';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';

@Injectable()
export class ListFormsUseCase {
  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FORM_CACHE) private readonly cache: FormCache,
  ) {}

  async execute(): Promise<FormDto[]> {
    const key = FormCacheKeys.list();
    const cached = await this.cache.get<FormDto[]>(key);

    if (cached) {
      return cached;
    }

    const forms = (await this.repository.findAll()).map((form) => FormDtoMapper.toDto(form));
    await this.cache.set(key, forms, 60);

    return forms;
  }
}
