import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';
import type { SubmissionDto } from '@topcv/shared/forms';

import type { SubmissionRepository } from '../../application/ports/submission.repository';
import { SubmissionEntity } from './submission.entity';

@Injectable()
export class MikroSubmissionRepository implements SubmissionRepository {
  constructor(private readonly em: EntityManager) {}

  async save(submission: SubmissionDto): Promise<SubmissionDto> {
    const entity = new SubmissionEntity();
    entity.publicId = submission.id;
    entity.formId = submission.formId;
    entity.answers = submission.answers;
    entity.submittedAt = new Date(submission.submittedAt);

    this.em.persist(entity);
    await this.em.flush();

    return submission;
  }

  async findAll(): Promise<SubmissionDto[]> {
    const entities = await this.em.find(SubmissionEntity, {}, { orderBy: { submittedAt: 'desc' } });

    return entities.map((entity) => ({
      id: entity.publicId,
      formId: entity.formId,
      answers: entity.answers,
      submittedAt: entity.submittedAt.toISOString(),
    }));
  }
}
