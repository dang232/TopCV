import type { SubmissionDto } from '@topcv/shared/forms';

export const SUBMISSION_REPOSITORY = Symbol('SUBMISSION_REPOSITORY');

export interface SubmissionRepository {
  save(submission: SubmissionDto): Promise<SubmissionDto>;
  findAll(): Promise<SubmissionDto[]>;
}
