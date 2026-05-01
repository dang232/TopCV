import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedFormList } from '@topcv/shared/forms';

import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';

@Injectable()
export class ListFormsPageUseCase {
  constructor(@Inject(FORM_REPOSITORY) private readonly repository: FormRepository) {}

  async execute(input: { page: number; pageSize: number }): Promise<PaginatedFormList> {
    const page = input.page;
    const pageSize = input.pageSize;

    const skip = (page - 1) * pageSize;
    const [total, forms] = await Promise.all([
      this.repository.countAll(),
      this.repository.findPage({ skip, take: pageSize }),
    ]);

    return {
      items: forms.map((form) => FormDtoMapper.toDto(form)),
      total,
      page,
      pageSize,
    };
  }
}

