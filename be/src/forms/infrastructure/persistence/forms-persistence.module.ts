import { Module } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mongodb';

import { ENTITY_MANAGER } from '../../../database/database.module';
import { FORM_REPOSITORY } from '../../application/ports/form.repository';
import { SUBMISSION_REPOSITORY } from '../../application/ports/submission.repository';
import { MikroFormRepository } from './mikro-form.repository';
import { MikroSubmissionRepository } from './mikro-submission.repository';

@Module({
  providers: [
    {
      provide: FORM_REPOSITORY,
      inject: [ENTITY_MANAGER],
      useFactory: (em: EntityManager) => new MikroFormRepository(em),
    },
    {
      provide: SUBMISSION_REPOSITORY,
      inject: [ENTITY_MANAGER],
      useFactory: (em: EntityManager) => new MikroSubmissionRepository(em),
    },
  ],
  exports: [FORM_REPOSITORY, SUBMISSION_REPOSITORY],
})
export class FormsPersistenceModule {}
