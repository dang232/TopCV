import { Inject, Injectable, Optional } from '@nestjs/common';
import { UpdateFormInputSchema, type FormDto, type UpdateFormInput } from '@topcv/shared/forms';

import { FormNotFound } from '../../domain/errors/form-not-found';
import { FormCacheInvalidator } from '../cache-keys/form-cache.invalidator';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { FORM_SEARCH_INDEX, type FormSearchIndex } from '../ports/form.search-index';

type Clock = () => Date;

@Injectable()
export class UpdateFormUseCase {
  private readonly clock: Clock;

  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    private readonly cacheInvalidator: FormCacheInvalidator,
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

    await this.cacheInvalidator.invalidateForm(id);
    await this.searchIndex.index(saved.toSnapshot());

    return FormDtoMapper.toDto(saved);
  }
}
