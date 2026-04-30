import { defineEntity, p } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import type { SubmissionDto } from '@topcv/shared/forms';

export const SubmissionEntitySchema = defineEntity({
  name: 'SubmissionEntity',
  collection: 'submissions',
  properties: {
    _id: p.type(ObjectId).primary(),
    id: p.string().serializedPrimaryKey(),
    publicId: p.string().unique(),
    formId: p.string(),
    answers: p.json().$type<SubmissionDto['answers']>(),
    submittedAt: p.datetime(),
  },
});

export class SubmissionEntity extends SubmissionEntitySchema.class {
  constructor() {
    super();
    this._id = new ObjectId();
  }
}

SubmissionEntitySchema.setClass(SubmissionEntity);
