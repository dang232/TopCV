import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  FieldType,
  SubmitFormInputSchema,
  type FormAnswerValue,
  type FormField,
  type SubmissionDto,
  type SubmitFormInput,
} from '@topcv/shared/forms';

import { FormNotFound } from '../../domain/errors/form-not-found';
import { FormDtoMapper } from '../mapping/form-dto.mapper';
import { FORM_REPOSITORY, type FormRepository } from '../ports/form.repository';
import { SUBMISSION_REPOSITORY, type SubmissionRepository } from '../ports/submission.repository';
import { createSubmissionAnswersSchema } from './submission-answers.schema';

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

    const normalizedAnswers = Object.fromEntries(
      formDto.fields.map((field) => {
        const key = field.id ?? field.label;
        const raw = parsed.answers[key];
        return [key, coerceAnswerValue(field, raw)] as const;
      }),
    );

    const answers = Object.fromEntries(
      Object.entries(createSubmissionAnswersSchema(formDto.fields).parse(normalizedAnswers)).filter(
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

function coerceAnswerValue(field: FormField, raw: unknown): unknown {
  // Treat empty strings as "not answered" so optional fields can be omitted server-side.
  if (raw === '' || raw === null || raw === undefined) {
    return undefined;
  }

  switch (field.type) {
    case FieldType.Number: {
      if (typeof raw === 'number') return raw;
      if (typeof raw !== 'string') return raw;
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : raw;
    }
    case FieldType.Text:
    case FieldType.Date:
    case FieldType.Color:
    case FieldType.Select:
      return raw;
    default:
      return raw;
  }
}
