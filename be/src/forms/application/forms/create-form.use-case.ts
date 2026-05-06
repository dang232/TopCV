import { Inject, Injectable, Optional } from '@nestjs/common';
import { CreateFormInputSchema, type CreateFormInput, type FormDto } from '@topcv/shared/forms';

import { DynamicForm } from '../../domain/form.aggregate';
import { FormCacheInvalidator } from '../cache-keys/form-cache.invalidator';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { FORM_SEARCH_INDEX, type FormSearchIndex } from '../ports/form.search-index';

type IdFactory = () => string;
type Clock = () => Date;

@Injectable()
export class CreateFormUseCase {
  private readonly idFactory: IdFactory;
  private readonly clock: Clock;

  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FormCacheInvalidator) private readonly cacheInvalidator: FormCacheInvalidator,
    @Inject(FORM_SEARCH_INDEX) private readonly searchIndex: FormSearchIndex,
    @Optional() @Inject('FORM_ID_FACTORY') idFactory?: IdFactory,
    @Optional() @Inject('FORM_CLOCK') clock?: Clock,
  ) {
    this.idFactory = idFactory ?? (() => crypto.randomUUID());
    this.clock = clock ?? (() => new Date());
  }

  async execute(input: CreateFormInput): Promise<FormDto> {
    const parsed = CreateFormInputSchema.parse(input);
    const formId = this.idFactory();
    const fields = parsed.fields.map((field, index) => ({
      ...field,
      id: field.id ?? `${formId}-field-${index}`,
    }));
    const form = DynamicForm.create(formId, { ...parsed, fields: FormDtoMapper.toDomainFields(fields) }, this.clock());
    const saved = await this.repository.save(form);

    await this.cacheInvalidator.invalidateLists();
    await this.searchIndex.index(saved.toSnapshot());

    return FormDtoMapper.toDto(saved);
  }
}
