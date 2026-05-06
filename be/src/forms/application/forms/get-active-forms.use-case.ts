import { Inject, Injectable } from '@nestjs/common';
import { FormStatus, type FormDto } from '@topcv/shared/forms';

import { FormCacheKeys } from '../cache-keys/form-cache-keys';
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
    const key = FormCacheKeys.active();
    const cached = await this.cache.get<FormDto[]>(key);

    if (cached) {
      return cached;
    }

    const activeForms = (await this.repository.findByStatus(FormStatus.Active))
      .map((form) => FormDtoMapper.toDto(form))
      .sort((left, right) => left.order - right.order);

    await this.cache.set(key, activeForms, 60);

    return activeForms;
  }
}
