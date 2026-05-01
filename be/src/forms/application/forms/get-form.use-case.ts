import { Inject, Injectable } from '@nestjs/common';
import { FormIdInputSchema, type FormDto } from '@topcv/shared/forms';

import { FormNotFound } from '../../domain/errors/form-not-found';
import { FormCacheKeys } from '../cache-keys/form-cache-keys';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_CACHE, type FormCache } from '../ports/form.cache';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';

@Injectable()
export class GetFormUseCase {
  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FORM_CACHE) private readonly cache: FormCache,
  ) {}

  async execute(input: { id: string }): Promise<FormDto> {
    const { id } = FormIdInputSchema.parse(input);
    const key = FormCacheKeys.byId(id);
    const cached = await this.cache.get<FormDto>(key);

    if (cached) {
      return cached;
    }

    const form = await this.repository.findById(id);
    if (!form) {
      throw new FormNotFound(id);
    }

    const dto = FormDtoMapper.toDto(form);
    await this.cache.set(key, dto, 60);

    return dto;
  }
}
