import { Inject, Injectable } from '@nestjs/common';
import type { FormDto } from '@topcv/shared/forms';

import { RedisFormCache } from '../../infrastructure/cache/redis-form-cache';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_CACHE, type FormCache } from '../ports/form.cache';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';

@Injectable()
export class GetActiveFormsUseCase {
  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FORM_CACHE) private readonly cache: FormCache,
  ) {}

  async execute(): Promise<FormDto[]> {
    const key = RedisFormCache.keys.active();
    const cached = await this.cache.get<FormDto[]>(key);

    if (cached) {
      return cached;
    }

    const activeForms = (await this.repository.findAll())
      .map((form) => FormDtoMapper.toDto(form))
      .filter((form) => form.status === 'active')
      .sort((left, right) => left.order - right.order);

    await this.cache.set(key, activeForms, 60);

    return activeForms;
  }
}
