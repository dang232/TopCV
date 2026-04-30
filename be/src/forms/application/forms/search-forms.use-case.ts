import { Inject, Injectable } from '@nestjs/common';
import { SearchFormsInputSchema, type FormDto, type SearchFormsInput } from '@topcv/shared/forms';

import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { FORM_SEARCH_INDEX, type FormSearchIndex } from '../ports/form.search-index';

@Injectable()
export class SearchFormsUseCase {
  constructor(
    @Inject(FORM_REPOSITORY) private readonly repository: FormRepository,
    @Inject(FORM_SEARCH_INDEX) private readonly searchIndex: FormSearchIndex,
  ) {}

  async execute(input: SearchFormsInput): Promise<FormDto[]> {
    const { query } = SearchFormsInputSchema.parse(input);
    const ids = await this.searchIndex.search(query);
    const forms = await Promise.all(ids.map((id) => this.repository.findById(id)));

    return forms.filter((form): form is NonNullable<typeof form> => Boolean(form)).map((form) => FormDtoMapper.toDto(form));
  }
}
