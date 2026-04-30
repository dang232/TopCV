import { Inject, Injectable } from '@nestjs/common';
import type { SubmissionDto } from '@topcv/shared/forms';

import { SUBMISSION_REPOSITORY, type SubmissionRepository } from '../ports/submission.repository';

@Injectable()
export class ListSubmissionsUseCase {
  constructor(@Inject(SUBMISSION_REPOSITORY) private readonly submissions: SubmissionRepository) {}

  async execute(): Promise<SubmissionDto[]> {
    return this.submissions.findAll();
  }
}
