import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  SubmitFormInputSchema,
  createSubmissionAnswersSchema,
  type FormAnswerValue,
  type SubmissionDto,
  type SubmitFormInput,
} from '@topcv/shared/forms';

import { FormNotFound } from '../../domain/errors/form-not-found';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { SUBMISSION_REPOSITORY, type SubmissionRepository } from '../ports/submission.repository';

type IdFactory = () => string;
type Clock = () => Date;

@Injectable()
export class SubmitFormUseCase {
  private readonly idFactory: IdFactory;
  private readonly clock: Clock;

  constructor(
    @Inject(FORM_REPOSITORY) private readonly forms: FormRepository,
    @Inject(SUBMISSION_REPOSITORY) private readonly submissions: SubmissionRepository,
    @Optional() @Inject('FORM_ID_FACTORY') idFactory?: IdFactory,
    @Optional() @Inject('FORM_CLOCK') clock?: Clock,
  ) {
    this.idFactory = idFactory ?? (() => crypto.randomUUID());
    this.clock = clock ?? (() => new Date());
  }

  async execute(input: SubmitFormInput): Promise<SubmissionDto> {
    const parsed = SubmitFormInputSchema.parse(input);
    const form = await this.forms.findById(parsed.formId);

    if (!form) {
      throw new FormNotFound(parsed.formId);
    }

    const formDto = FormDtoMapper.toDto(form);
    const answers = Object.fromEntries(
      Object.entries(createSubmissionAnswersSchema(formDto.fields).parse(parsed.answers)).filter(
        (entry): entry is [string, FormAnswerValue] => entry[1] !== undefined,
      ),
    );
    const submission: SubmissionDto = {
      id: this.idFactory(),
      formId: parsed.formId,
      answers,
      submittedAt: this.clock().toISOString(),
    };

    return this.submissions.save(submission);
  }
}
