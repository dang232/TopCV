import { Inject, Injectable, Optional } from '@nestjs/common';
import { UpdateFormInputSchema, type FormDto, type UpdateFormInput } from '@topcv/shared/forms';

import { FormNotFound } from '../../domain/errors/form-not-found';
import { RedisFormCache } from '../../infrastructure/cache/redis-form-cache';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_CACHE, type FormCache } from '../ports/form.cache';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { FORM_SEARCH_INDEX, type FormSearchIndex } from '../ports/form.search-index';

type Clock = () => Date;

@Injectable()
export class UpdateFormUseCase {
  private readonly clock: Clock;

  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FORM_CACHE) private readonly cache: FormCache,
    @Inject(FORM_SEARCH_INDEX) private readonly searchIndex: FormSearchIndex,
    @Optional() @Inject('FORM_CLOCK') clock?: Clock,
  ) {
    this.clock = clock ?? (() => new Date());
  }

  async execute(input: UpdateFormInput): Promise<FormDto> {
    const parsed = UpdateFormInputSchema.parse(input);
    const form = await this.repository.findById(parsed.id);

    if (!form) {
      throw new FormNotFound(parsed.id);
    }

    const { id, fields, ...updates } = parsed;
    form.update(
      {
        ...updates,
        ...(fields ? { fields: FormDtoMapper.toDomainFields(fields) } : {}),
      },
      this.clock(),
    );
    const saved = await this.repository.save(form);

    await this.cache.delete(RedisFormCache.keys.list(), RedisFormCache.keys.active(), RedisFormCache.keys.byId(id));
    await this.searchIndex.index(saved);

    return FormDtoMapper.toDto(saved);
  }
}
